console.log("[HR-HOOK-BOOT] intake_on_before_create.pb.js loaded successfully")

onModelCreate(function(e) {
  // Only process if this is an HR form submission (i.e. has a formId)
  var formId = e.model.getString('formId')
  if (!formId) {
    return e.next()
  }

  try {
    var formDef = $app.findRecordById('form_definitions', formId)
    var prefix = formDef.getString('prefix') || 'REQ'
    
    // Find matching submissions with the same prefix to find the highest number
    var existing = $app.findRecordsByFilter(
      'intake_submissions',
      `formattedId ~ "${prefix}-"`,
      '-formattedId',
      1,
      0
    )
    
    var seq = 1
    if (existing && existing.length > 0) {
      var highestFormattedId = existing[0].getString('formattedId') || ''
      var match = highestFormattedId.match(/-(\d+)$/)
      if (match) {
        seq = parseInt(match[1], 10) + 1
      }
    }
    
    // Format sequence as e.g. VAC-001
    var seqStr = seq.toString()
    while (seqStr.length < 3) {
      seqStr = '0' + seqStr
    }
    var formattedId = prefix + '-' + seqStr
    
    e.model.set('formattedId', formattedId)
    console.log('[HR-HOOK] Generated formattedId ' + formattedId + ' for new intake submission')
  } catch (err) {
    console.error("Error generating formattedId in hook: " + err)
  }

  return e.next()
}, 'intake_submissions')
