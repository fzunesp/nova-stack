import pb from '@/lib/pocketbase'

export interface ActivityEvent {
  id: string
  type: 'created' | 'updated' | 'deleted' | 'assigned' | 'status_changed'
  entityType: 'contact' | 'deal' | 'task' | 'invoice' | 'intake'
  entityId: string
  title: string
  timestamp: string
  actor: string
}

const COLLECTION_MAP: Record<string, string> = {
  contacts: 'Contact',
  deals: 'Deal',
  tasks: 'Task',
  invoices: 'Invoice',
  intake_submissions: 'Intake',
}

const TITLE_FIELDS: Record<string, string> = {
  contacts: 'name',
  deals: 'title',
  tasks: 'title',
  invoices: 'title',
  intake_submissions: 'name',
}

function normalizeEventType(eventType: string): ActivityEvent['type'] {
  switch (eventType) {
    case 'create':
      return 'created'
    case 'update':
      return 'updated'
    case 'delete':
      return 'deleted'
    default:
      return 'updated'
  }
}

function normalizeEntityType(collection: string): ActivityEvent['entityType'] {
  const map: Record<string, ActivityEvent['entityType']> = {
    contacts: 'contact',
    deals: 'deal',
    tasks: 'task',
    invoices: 'invoice',
    intake_submissions: 'intake',
  }
  return map[collection] || 'contact'
}

export async function getActivityFeed(): Promise<ActivityEvent[]> {
  const auditLogs = await pb.collection('audit_logs').getList(1, 20, {
    sort: '-eventTimestamp',
  })

  if (auditLogs.items.length === 0) return []

  // Group by collection to batch-fetch titles
  const byCollection: Record<string, string[]> = {}
  auditLogs.items.forEach((log) => {
    const col = log.targetCollection
    if (!byCollection[col]) byCollection[col] = []
    if (!byCollection[col].includes(log.targetRecord)) {
      byCollection[col].push(log.targetRecord)
    }
  })

  // Fetch titles in parallel
  const titleMap: Record<string, Record<string, string>> = {}
  await Promise.all(
    Object.entries(byCollection).map(async ([collection, ids]) => {
      const titleField = TITLE_FIELDS[collection] || 'name'
      const filter = ids.map((id) => `id="${id}"`).join('||')
      try {
        const records = await pb.collection(collection).getList(1, ids.length, {
          filter,
          fields: `items.id,items.${titleField}`,
        })
        titleMap[collection] = {}
        records.items.forEach((r: any) => {
          titleMap[collection][r.id] = r[titleField] || `(Untitled)`
        })
      } catch {
        titleMap[collection] = {}
      }
    })
  )

  // Normalize events
  const events: ActivityEvent[] = auditLogs.items.map((log) => {
    const collection = log.targetCollection
    const entityId = log.targetRecord
    const title = titleMap[collection]?.[entityId] || `${COLLECTION_MAP[collection] || 'Item'} #${entityId.slice(0, 6)}`

    return {
      id: log.id,
      type: normalizeEventType(log.eventType),
      entityType: normalizeEntityType(collection),
      entityId,
      title,
      timestamp: log.eventTimestamp || log.created || '',
      actor: 'System',
    }
  })

  return events
}
