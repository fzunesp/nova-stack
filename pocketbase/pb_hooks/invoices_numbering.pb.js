/// <reference path="../pb_data/types.d.ts" />
var utils = require(`${__hooks}/numbering_utils.js`)

onRecordCreate(function(e) {
  var generated = utils.generateEntityNumber(e, "invoices", "invoices", "INV")
  if (generated) {
    e.record.set("invoiceNumber", generated)
  }
  return e.next()
}, "invoices")
