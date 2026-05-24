/// <reference path="../pb_data/types.d.ts" />
console.log("[HR-HOOK-BOOT] intake_on_create.pb.js loaded")

onRecordAfterCreateSuccess(function(e) {
  var formId = e.record.get('formId')
  if (!formId) return

  try {
    var formDef = $app.findRecordById('form_definitions', formId)
    var isParallel = formDef.get('isParallel') || false
    var rawSteps = formDef.get('workflowSteps')

    var workflowSteps = []
    try {
      var parsed = JSON.parse(String(rawSteps))
      if (Array.isArray(parsed)) {
        workflowSteps = parsed
      } else if (parsed && typeof parsed === 'object') {
        workflowSteps = [parsed]
      }
    } catch (err) {
      console.error('[HR-HOOK] Failed to parse workflowSteps: ' + err)
    }

    if (workflowSteps.length === 0) return

    var tasksColl = $app.findCollectionByNameOrId('approval_tasks')

    if (isParallel) {
      for (var i = 0; i < workflowSteps.length; i++) {
        var step = workflowSteps[i]
        var taskRecord = new Record(tasksColl)
        taskRecord.set('submissionId', e.record.id)
        taskRecord.set('assignedToId', step.userId)
        taskRecord.set('stepLabel', step.label)
        taskRecord.set('stepOrder', i)
        taskRecord.set('isActive', step.active !== false)
        taskRecord.set('status', 'pending')
        $app.save(taskRecord)
      }
    } else {
      var firstStep = workflowSteps[0]
      var taskRecord = new Record(tasksColl)
      taskRecord.set('submissionId', e.record.id)
      taskRecord.set('assignedToId', firstStep.userId)
      taskRecord.set('stepLabel', firstStep.label)
      taskRecord.set('stepOrder', 0)
      taskRecord.set('isActive', firstStep.active !== false)
      taskRecord.set('status', 'pending')
      $app.save(taskRecord)
    }
  } catch (err) {
    console.error("Error processing HR submission: " + err)
  }
}, 'intake_submissions')
