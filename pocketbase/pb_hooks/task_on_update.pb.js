console.log("[HR-HOOK-BOOT] task_on_update.pb.js loaded successfully")

onModelAfterUpdateSuccess(function(e) {
  try {
    console.log("[HR-HOOK-TASK] Triggered for task " + e.model.id)
    // Only process if status was changed to 'approved' or 'rejected'
    var oldStatus = e.model.originalCopy().getString('status')
    var newStatus = e.model.getString('status')
    console.log("[HR-HOOK-TASK] Status changed from " + oldStatus + " to " + newStatus)
    if (oldStatus === newStatus || (newStatus !== 'approved' && newStatus !== 'rejected')) return

    var submissionId = e.model.getString('submissionId')
    var submission = $app.findRecordById('intake_submissions', submissionId)
    var formId = submission.getString('formId')
    console.log("[HR-HOOK-TASK] Found submission " + submissionId + " and form " + formId)
    if (!formId) return

    var formDef = $app.findRecordById('form_definitions', formId)
    var isParallel = formDef.get('isParallel') || false
    var workflowSteps = []
    try {
      var steps = formDef.get('workflowSteps')
      if (Array.isArray(steps)) {
        workflowSteps = steps
      } else if (typeof steps === 'string' && steps.trim() !== '') {
        workflowSteps = JSON.parse(steps)
      }
    } catch (err) {
      console.error("[HR-HOOK-TASK] Error parsing steps: " + err)
    }

    if (newStatus === 'rejected') {
      // Deactivate all remaining pending tasks
      var pendingTasks = $app.findRecordsByFilter('approval_tasks', `submissionId = "${submissionId}" && status = "pending"`)
      for (var i = 0; i < pendingTasks.length; i++) {
        var t = pendingTasks[i]
        t.set('isActive', false)
        $app.save(t)
      }
      // Mark submission rejected
      submission.set('status', 'rejected')
      submission.set('decidedAt', new Date().toISOString())
      submission.set('decisionNote', e.model.get('comment'))
      $app.save(submission)
    } else if (newStatus === 'approved') {
      if (isParallel) {
        // Parallel: check if any pending tasks remain
        var remaining = $app.findRecordsByFilter('approval_tasks', `submissionId = "${submissionId}" && status = "pending" && isActive = true`)
        if (remaining.length === 0) {
          submission.set('status', 'approved')
          submission.set('decidedAt', new Date().toISOString())
          $app.save(submission)
          // Webhook could be triggered here via $http.send
          var webhookUrl = formDef.get('webhookUrl')
          if (webhookUrl) {
            try {
              $http.send({ url: webhookUrl, method: 'POST', body: JSON.stringify({ event: 'submission.approved', submissionId: submissionId }) })
            } catch(e){}
          }
        }
      } else {
        // Sequential: activate next step if it exists
        var currentStep = submission.get('currentStep') || 0
        var nextStepIndex = currentStep + 1
        if (nextStepIndex < workflowSteps.length) {
          var nextStep = workflowSteps[nextStepIndex]
          var tasksColl = $app.findCollectionByNameOrId('approval_tasks')
          var taskRecord = new Record(tasksColl)
          taskRecord.set('submissionId', submissionId)
          taskRecord.set('assignedToId', nextStep.userId)
          taskRecord.set('stepLabel', nextStep.label)
          taskRecord.set('stepOrder', nextStepIndex)
          taskRecord.set('isActive', nextStep.active !== false)
          taskRecord.set('status', 'pending')
          
          $app.save(taskRecord)
          
          submission.set('currentStep', nextStepIndex)
          $app.save(submission)
        } else {
          submission.set('status', 'approved')
          submission.set('decidedAt', new Date().toISOString())
          $app.save(submission)
          
          var webhookUrl = formDef.get('webhookUrl')
          if (webhookUrl) {
            try {
              $http.send({ url: webhookUrl, method: 'POST', body: JSON.stringify({ event: 'submission.approved', submissionId: submissionId }) })
            } catch(e){}
          }
        }
      }
    }
  } catch (err) {
    console.error("[HR-HOOK-TASK] Fatal Error: " + err)
  }
}, 'approval_tasks')
