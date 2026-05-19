/// <reference path="../pb_data/types.d.ts" />

// Adds formId, formattedId, currentStep, and details fields to intake_submissions
// to support the dynamic HR form engine

migrate((app) => {
  const coll = app.findCollectionByNameOrId('intake_submissions')
  if (!coll) throw new Error('intake_submissions collection not found')

  const formDefsColl = app.findCollectionByNameOrId('form_definitions')
  if (!formDefsColl) throw new Error('form_definitions collection not found — run migration 1979071071 first')

  // formId — links submission to its form template
  if (!coll.fields.getByName('formId')) {
    coll.fields.add(new Field({
      name: 'formId',
      type: 'relation',
      collectionId: formDefsColl.id,
      cascadeDelete: false,
      minSelect: 0,
      maxSelect: 1,
      required: false,
    }))
  }

  // formattedId — human-readable ID e.g. VAC-001
  if (!coll.fields.getByName('formattedId')) {
    coll.fields.add(new Field({
      name: 'formattedId',
      type: 'text',
      required: false,
    }))
  }

  // currentStep — tracks sequential approval progress (0-indexed)
  if (!coll.fields.getByName('currentStep')) {
    coll.fields.add(new Field({
      name: 'currentStep',
      type: 'number',
      required: false,
    }))
  }

  // details — stores all dynamic form field values as JSON
  // (some submissions may already use the existing 'data' JSON field;
  //  'details' is the new canonical field for HR form submissions)
  if (!coll.fields.getByName('details')) {
    coll.fields.add(new Field({
      name: 'details',
      type: 'json',
      maxSize: 2000000,
      required: false,
    }))
  }

  return app.save(coll)
}, (app) => {
  const coll = app.findCollectionByNameOrId('intake_submissions')
  if (!coll) return

  for (const fieldName of ['formId', 'formattedId', 'currentStep', 'details']) {
    if (coll.fields.getByName(fieldName)) {
      coll.fields.removeByName(fieldName)
    }
  }

  return app.save(coll)
})
