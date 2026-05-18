/// <reference path="../pb_data/types.d.ts" />

console.log('[AUDIT-BOOT] audit.pb.js loading...')

onModelAfterCreateSuccess(function(e) {
    console.log('[AUDIT-CREATE] ' + e.model.collection().name + '#' + e.model.id)
    try {
        var ac = $app.findCollectionByNameOrId('audit_logs')
        if (!ac) return
        var ar = new Record(ac)
        ar.set('eventType', 'create')
        ar.set('targetCollection', e.model.collection().name)
        ar.set('targetRecord', e.model.id)
        ar.set('eventTimestamp', new Date().toISOString())
        $app.save(ar)
    } catch (err) { console.error('[AUDIT-ERROR] ' + err) }
}, 'contacts', 'deals', 'tasks', 'invoices', 'intake_submissions')

onModelAfterUpdateSuccess(function(e) {
    console.log('[AUDIT-UPDATE] ' + e.model.collection().name + '#' + e.model.id)
    try {
        var ac = $app.findCollectionByNameOrId('audit_logs')
        if (!ac) return
        var ar = new Record(ac)
        ar.set('eventType', 'update')
        ar.set('targetCollection', e.model.collection().name)
        ar.set('targetRecord', e.model.id)
        ar.set('eventTimestamp', new Date().toISOString())
        $app.save(ar)
    } catch (err) { console.error('[AUDIT-ERROR] ' + err) }
}, 'contacts', 'deals', 'tasks', 'invoices', 'intake_submissions')

onModelAfterDeleteSuccess(function(e) {
    console.log('[AUDIT-DELETE] ' + e.model.collection().name + '#' + e.model.id)
    try {
        var ac = $app.findCollectionByNameOrId('audit_logs')
        if (!ac) return
        var ar = new Record(ac)
        ar.set('eventType', 'delete')
        ar.set('targetCollection', e.model.collection().name)
        ar.set('targetRecord', e.model.id)
        ar.set('eventTimestamp', new Date().toISOString())
        $app.save(ar)
    } catch (err) { console.error('[AUDIT-ERROR] ' + err) }
}, 'contacts', 'deals', 'tasks', 'invoices', 'intake_submissions')

console.log('[AUDIT-BOOT] audit.pb.js loaded successfully')
