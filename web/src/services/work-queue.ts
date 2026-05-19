import pb from '@/lib/pocketbase'


export interface WorkQueueItem {
  id: string
  type: 'task' | 'intake' | 'deal' | 'contact' | 'invoice'
  title: string
  status: string
  entityType: string
  assignedAt?: string
  updated?: string
  link: string
}

const ACTION_STATUSES = new Set(['pending', 'draft', 'needs_review', 'lead', 'contacted'])
const WAITING_STATUSES = new Set(['quoted', 'active'])

function itemNeedsAttention(status: string): boolean {
  return ACTION_STATUSES.has(status)
}

function itemIsWaiting(status: string): boolean {
  return WAITING_STATUSES.has(status)
}

function getLink(type: WorkQueueItem['type'], _id: string): string {
  switch (type) {
    case 'task': return `/tasks`
    case 'intake': return `/intake`
    case 'deal': return `/crm`
    case 'contact': return `/crm`
    case 'invoice': return `/invoices`
  }
}

export async function getMyWorkQueue(): Promise<WorkQueueItem[]> {
  const userId = pb.authStore.record?.id
  if (!userId) return []

  const [tasks, intakes, deals, contacts, invoices] = await Promise.all([
    pb.collection('tasks').getList(1, 50, {
      filter: `assignedToId = "${userId}"`,
      sort: '-id',
    }),
    pb.collection('intake_submissions').getList(1, 50, {
      filter: `assignedToId = "${userId}"`,
      sort: '-id',
    }),
    pb.collection('deals').getList(1, 50, {
      filter: `assignedToId = "${userId}"`,
      sort: '-id',
    }),
    pb.collection('contacts').getList(1, 50, {
      filter: `assignedToId = "${userId}"`,
      sort: '-id',
    }),
    pb.collection('invoices').getList(1, 50, {
      filter: `assignedToId = "${userId}"`,
      sort: '-id',
    }),
  ])

  const items: WorkQueueItem[] = [
    ...tasks.items.map((t: any) => ({
      id: t.id,
      type: 'task' as const,
      title: t.title,
      status: t.status,
      entityType: 'Task',
      assignedAt: t.assignedAt,
      updated: t.updated,
      link: getLink('task', t.id),
    })),
    ...intakes.items.map((i: any) => ({
      id: i.id,
      type: 'intake' as const,
      title: i.name,
      status: i.status,
      entityType: 'Intake',
      assignedAt: i.assignedAt,
      updated: i.updated,
      link: getLink('intake', i.id),
    })),
    ...deals.items.map((d: any) => ({
      id: d.id,
      type: 'deal' as const,
      title: d.title,
      status: d.stage,
      entityType: 'Deal',
      assignedAt: d.assignedAt,
      updated: d.updated,
      link: getLink('deal', d.id),
    })),
    ...contacts.items.map((c: any) => ({
      id: c.id,
      type: 'contact' as const,
      title: c.name,
      status: c.status,
      entityType: 'Contact',
      assignedAt: c.assignedAt,
      updated: c.updated,
      link: getLink('contact', c.id),
    })),
    ...invoices.items.map((inv: any) => ({
      id: inv.id,
      type: 'invoice' as const,
      title: inv.title,
      status: inv.status,
      entityType: 'Invoice',
      assignedAt: inv.assignedAt,
      updated: inv.updated,
      link: getLink('invoice', inv.id),
    })),
  ]

  // Sort: needs attention first, then waiting, then recently updated
  items.sort((a, b) => {
    const aUrgent = itemNeedsAttention(a.status) ? 0 : itemIsWaiting(a.status) ? 1 : 2
    const bUrgent = itemNeedsAttention(b.status) ? 0 : itemIsWaiting(b.status) ? 1 : 2
    if (aUrgent !== bUrgent) return aUrgent - bUrgent
    const aTime = a.updated ? new Date(a.updated).getTime() : 0
    const bTime = b.updated ? new Date(b.updated).getTime() : 0
    return bTime - aTime
  })

  return items.slice(0, 20)
}

export interface GroupedWorkQueue {
  needsAttention: WorkQueueItem[]
  recentlyUpdated: WorkQueueItem[]
  waiting: WorkQueueItem[]
}

export function groupWorkQueue(items: WorkQueueItem[]): GroupedWorkQueue {
  const result: GroupedWorkQueue = {
    needsAttention: [],
    recentlyUpdated: [],
    waiting: [],
  }

  const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000

  for (const item of items) {
    if (itemNeedsAttention(item.status)) {
      result.needsAttention.push(item)
    } else if (itemIsWaiting(item.status)) {
      result.waiting.push(item)
    } else {
      const itemTime = item.updated ? new Date(item.updated).getTime() : 0
      if (itemTime > twoDaysAgo) {
        result.recentlyUpdated.push(item)
      }
    }
  }

  return result
}
