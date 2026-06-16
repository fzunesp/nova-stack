/// <reference path="../pb_data/types.d.ts" />
var utils = require(`${__hooks}/numbering_utils.js`)

onRecordCreate(function(e) {
  var generated = utils.generateEntityNumber(e, "intake_submissions", "intakes", "INT")
  if (generated) {
    e.record.set("reference", generated)
  }
  return e.next()
}, "intake_submissions")
