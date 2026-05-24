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
    
    // Get current 2-digit year (e.g. 25 for 2025)
    var now = new Date()
    var yearShort = now.getFullYear().toString().slice(-2)
    var yearPrefix = prefix + '-' + yearShort + '-'
    
    // Find all submissions for this prefix+year to determine the highest sequence
    var allSubmissions = $app.findRecordsByFilter(
      'intake_submissions',
      'formId != ""',
      '-created',
      500,
      0
    )
    
    var maxSeq = 0
    for (var i = 0; i < allSubmissions.length; i++) {
      var fid = allSubmissions[i].getString('formattedId') || ''
      // Match pattern: PREFIX-YY-NNN (e.g. VAC-25-065)
      var match = fid.match(/^([A-Z]+)-(\d{2})-(\d+)$/)
      if (match && match[1] === prefix && match[2] === yearShort) {
        var seq = parseInt(match[3], 10)
        if (seq > maxSeq) {
          maxSeq = seq
        }
      }
    }
    
    var seq = maxSeq + 1
    var seqStr = seq.toString()
    while (seqStr.length < 3) {
      seqStr = '0' + seqStr
    }
    var formattedId = yearPrefix + seqStr
    
    e.model.set('formattedId', formattedId)
    console.log('[HR-HOOK] Generated formattedId ' + formattedId + ' for new intake submission')
  } catch (err) {
    console.error("Error generating formattedId in hook: " + err)
  }

  return e.next()
}, 'intake_submissions')
