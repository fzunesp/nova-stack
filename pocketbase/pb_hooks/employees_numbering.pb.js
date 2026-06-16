/// <reference path="../pb_data/types.d.ts" />
var utils = require(`${__hooks}/numbering_utils.js`)

onRecordCreate(function(e) {
  var generated = utils.generateEntityNumber(e, "employees", "employees", "EMP")
  if (generated) {
    e.record.set("employee_id", generated)
  }
  return e.next()
}, "employees")
