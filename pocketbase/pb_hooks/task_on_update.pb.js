/// <reference path="../pb_data/types.d.ts" />
console.log("[HR-HOOK-BOOT] task_on_update.pb.js loaded")

onRecordAfterUpdateSuccess(function(e) {
  try {
    var oldStatus = e.record.original().get('status')
    var newStatus = e.record.getString('status')
    console.log("[HR-HOOK-TASK] Status changed from " + oldStatus + " to " + newStatus)
    if (oldStatus === newStatus || (newStatus !== 'approved' && newStatus !== 'rejected')) return

    var submissionId = e.record.getString('submissionId')
    var formId = ''

    $app.runInTransaction(function(txApp) {
      var submission = txApp.findRecordById('intake_submissions', submissionId)
      formId = submission.getString('formId')
      console.log("[HR-HOOK-TASK] Found submission " + submissionId + " and form " + formId)
      if (!formId) return

      var formDef = txApp.findRecordById('form_definitions', formId)
      var isParallel = formDef.get('isParallel') || false
      var workflowSteps = []
      try {
        var steps = formDef.get('workflowSteps')
        var stepsStr = String(steps)
        var parsed = JSON.parse(stepsStr)
        if (Array.isArray(parsed)) {
          workflowSteps = parsed
        } else if (parsed && typeof parsed === 'object') {
          workflowSteps = [parsed]
        }
      } catch (err) {
        console.error("[HR-HOOK-TASK] Error parsing steps: " + err)
      }

      var triggerWebhook = false

      if (newStatus === 'rejected') {
        var pendingTasks = txApp.findRecordsByFilter('approval_tasks', `submissionId = "${submissionId}" && status = "pending"`)
        for (var i = 0; i < pendingTasks.length; i++) {
          var t = pendingTasks[i]
          t.set('isActive', false)
          txApp.save(t)
        }
        submission.set('status', 'rejected')
        submission.set('decidedAt', new Date().toISOString())
        submission.set('decisionNote', e.record.getString('comment'))
        txApp.save(submission)
        console.log("[HR-HOOK-TASK] Submission rejected: " + submissionId)
      } else if (newStatus === 'approved') {
        if (isParallel) {
          var remaining = txApp.findRecordsByFilter('approval_tasks', `submissionId = "${submissionId}" && status = "pending" && isActive = true`)
          if (remaining.length === 0) {
            submission.set('status', 'approved')
            submission.set('decidedAt', new Date().toISOString())
            txApp.save(submission)
            triggerWebhook = true
            console.log("[HR-HOOK-TASK] Submission approved (parallel): " + submissionId)
          }
        } else {
          var currentStep = submission.get('currentStep') || 0
          var nextStepIndex = currentStep + 1
          if (nextStepIndex < workflowSteps.length) {
            var nextStep = workflowSteps[nextStepIndex]
            var tasksColl = txApp.findCollectionByNameOrId('approval_tasks')
            var taskRecord = new Record(tasksColl)
            taskRecord.set('submissionId', submissionId)
            taskRecord.set('assignedToId', nextStep.userId)
            taskRecord.set('stepLabel', nextStep.label)
            taskRecord.set('stepOrder', nextStepIndex)
            taskRecord.set('isActive', nextStep.active !== false)
            taskRecord.set('status', 'pending')
            txApp.save(taskRecord)
            submission.set('currentStep', nextStepIndex)
            txApp.save(submission)
            console.log("[HR-HOOK-TASK] Next task created: " + nextStep.label)
          } else {
            submission.set('status', 'approved')
            submission.set('decidedAt', new Date().toISOString())
            txApp.save(submission)
            triggerWebhook = true
            console.log("[HR-HOOK-TASK] Submission approved (sequential): " + submissionId)
          }
        }
      }

      if (triggerWebhook) {
        var webhookUrl = formDef.get('webhookUrl')
        if (webhookUrl) {
          try {
            console.log("[HR-HOOK-TASK] Triggering webhook: " + webhookUrl)
            $http.send({ url: webhookUrl, method: 'POST', body: JSON.stringify({ event: 'submission.approved', submissionId: submissionId }) })
          } catch(webhookErr) {
            console.error("[HR-HOOK-TASK] Webhook call failed: " + webhookErr)
          }
        }
      }
    })
  } catch (err) {
    console.error("[HR-HOOK-TASK] Fatal Error: " + err)
  }
}, 'approval_tasks')
