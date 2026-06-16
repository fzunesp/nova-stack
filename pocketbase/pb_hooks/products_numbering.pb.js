/// <reference path="../pb_data/types.d.ts" />
var utils = require(`${__hooks}/numbering_utils.js`)

onRecordCreate(function(e) {
  var generated = utils.generateEntityNumber(e, "products", "products", "PRO")
  if (generated) {
    e.record.set("sku", generated)
  }
  return e.next()
}, "products")
