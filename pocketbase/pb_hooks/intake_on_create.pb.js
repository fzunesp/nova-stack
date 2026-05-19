console.log("[HR-HOOK-BOOT] intake_on_create.pb.js loaded successfully")

onModelAfterCreateSuccess(function(e) {
  // Only process if this is an HR form submission (i.e. has a formId)
  var formId = e.model.get('formId')
  console.log('[HR-HOOK] intake created, formId: ' + formId)
  if (!formId) return

  try {
    var formDef = $app.findRecordById('form_definitions', formId)
    var prefix = formDef.get('prefix') || 'REQ'
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
      console.error("Failed to parse workflowSteps: " + err)
    }

    if (!workflowSteps || workflowSteps.length === 0) {
      console.warn("No workflow steps defined for form " + formId)
    } else {
      console.log('[HR-HOOK] Generating tasks, isParallel: ' + isParallel)
      var tasksColl = $app.findCollectionByNameOrId('approval_tasks')
      
      if (isParallel) {
        // Parallel mode: create all tasks at once
        for (var i = 0; i < workflowSteps.length; i++) {
          var step = workflowSteps[i]
          var taskRecord = new Record(tasksColl)
          taskRecord.set('submissionId', e.model.id)
          taskRecord.set('assignedToId', step.userId)
          taskRecord.set('stepLabel', step.label)
          taskRecord.set('stepOrder', i)
          taskRecord.set('isActive', step.active !== false)
          taskRecord.set('status', 'pending')
          
          $app.save(taskRecord)
        }
      } else {
        // Sequential mode: create only the first task
        var firstStep = workflowSteps[0]
        var taskRecord = new Record(tasksColl)
        taskRecord.set('submissionId', e.model.id)
        taskRecord.set('assignedToId', firstStep.userId)
        taskRecord.set('stepLabel', firstStep.label)
        taskRecord.set('stepOrder', 0)
        taskRecord.set('isActive', firstStep.active !== false)
        taskRecord.set('status', 'pending')
        
        $app.save(taskRecord)
      }
    }
  } catch (err) {
    console.error("Error processing hr submission: " + err)
  }
}, 'intake_submissions')
