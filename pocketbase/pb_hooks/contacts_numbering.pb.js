/// <reference path="../pb_data/types.d.ts" />
var utils = require(`${__hooks}/numbering_utils.js`)

onRecordCreate(function(e) {
  utils.generateEntityNumber(e, "contacts", "contacts", "CON")
  return e.next()
}, "contacts")
