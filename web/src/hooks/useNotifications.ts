/**
 * useNotifications — PocketBase-backed notification feed.
 *
 * Architecture:
 * - "Read" state is tracked in a lightweight `notifications_read` collection
 *   keyed by (userId, notificationId) so it syncs across devices.
 * - Live items are derived directly from PocketBase realtime subscriptions,
 *   so notifications never go stale and work on any device / browser session.
 * - localStorage is used ONLY as a short-lived UI cache between renders,
 *   never as the primary source of truth.
 */
import { useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase'
import { useAuth } from '@/hooks/useAuth'

export interface Notification {
  id: string
  type: 'task' | 'deal' | 'contact' | 'invoice' | 'intake'
  recordId: string
  title: string
  message: string
  timestamp: string
  read: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Stable notification ID so duplicates are naturally de-duped. */
function makeId(type: string, recordId: string) {
  return `${type}-${recordId}`
}

/**
 * Persist the read-set to PocketBase so it syncs across devices.
 * Falls back silently — a missed read-sync is far better than a crash.
 */
async function persistRead(userId: string, notifId: string) {
  try {
    // Upsert pattern — check if the record already exists first
    const existing = await pb.collection('notifications_read').getList(1, 1, {
      filter: `userId = "${userId}" && notifId = "${notifId}"`,
    }).catch(() => ({ items: [] }))

    if (existing.items.length === 0) {
      await pb.collection('notifications_read').create({ userId, notifId }).catch(() => {})
    }
  } catch {
    // Non-critical — read status can re-sync on next load
  }
}

/**
 * Load the set of already-read notification IDs for the current user.
 */
async function loadReadSet(userId: string): Promise<Set<string>> {
  try {
    const res = await pb.collection('notifications_read').getList(1, 200, {
      filter: `userId = "${userId}"`,
      fields: 'notifId',
    }).catch(() => ({ items: [] }))
    return new Set(res.items.map((r: any) => r.notifId))
  } catch {
    return new Set()
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [_readSet, setReadSet] = useState<Set<string>>(new Set())

  const currentUserId = user?.id
  const userRole = (user as any)?.role

  // Merge a new notification into state, de-duping by ID
  const upsertNotification = useCallback((n: Notification) => {
    setNotifications((prev) => {
      if (prev.some((p) => p.id === n.id)) return prev
      return [n, ...prev].slice(0, 50)
    })
  }, [])

  // Build a Notification object from a raw PocketBase record
  const buildNotif = useCallback(
    (type: Notification['type'], record: any, readIds: Set<string>): Notification => {
      const id = makeId(type, record.id)
      const titleField = record.title || record.name || 'Untitled'
      const labelMap: Record<string, string> = { task: 'Task', deal: 'Deal', contact: 'Contact', invoice: 'Invoice', intake: 'Approval Required' }
      const msgMap: Record<string, string> = {
        task: `Task "${titleField}" is assigned to you.`,
        deal: `Deal "${titleField}" is assigned to you.`,
        contact: `Contact "${titleField}" is assigned to you.`,
        invoice: `Invoice "${titleField}" is assigned to you.`,
        intake: `New intake submission from "${titleField}" requires your approval.`,
      }
      return {
        id,
        type,
        recordId: record.id,
        title: labelMap[type] || type,
        message: msgMap[type] || '',
        timestamp: record.assignedAt || record.created || new Date().toISOString(),
        read: readIds.has(id),
      }
    },
    []
  )

  // Load initial batch + set up realtime subscriptions
  useEffect(() => {
    if (!currentUserId) return

    let cancelled = false

    const init = async () => {
      // Load persisted read state from PocketBase (cross-device)
      const readIds = await loadReadSet(currentUserId)
      if (cancelled) return
      setReadSet(readIds)

      // Initial fetch: assigned records
      const assignFilter = `assignedToId = "${currentUserId}"`
      const [tasksRes, dealsRes, contactsRes, invoicesRes] = await Promise.all([
        pb.collection('tasks').getList(1, 10, { filter: assignFilter, sort: '-id' }).catch(() => ({ items: [] })),
        pb.collection('deals').getList(1, 10, { filter: assignFilter, sort: '-id' }).catch(() => ({ items: [] })),
        pb.collection('contacts').getList(1, 10, { filter: assignFilter, sort: '-id' }).catch(() => ({ items: [] })),
        pb.collection('invoices').getList(1, 10, { filter: assignFilter, sort: '-id' }).catch(() => ({ items: [] })),
      ])

      let intakeItems: any[] = []
      if (userRole === 'admin' || userRole === 'hr') {
        const intakeRes = await pb.collection('intake_submissions').getList(1, 10, {
          filter: 'status = "pending"', sort: '-id',
        }).catch(() => ({ items: [] }))
        intakeItems = intakeRes.items
      }

      if (cancelled) return

      const initial: Notification[] = [
        ...tasksRes.items.map((r: any) => buildNotif('task', r, readIds)),
        ...dealsRes.items.map((r: any) => buildNotif('deal', r, readIds)),
        ...contactsRes.items.map((r: any) => buildNotif('contact', r, readIds)),
        ...invoicesRes.items.map((r: any) => buildNotif('invoice', r, readIds)),
        ...intakeItems.map((r: any) => buildNotif('intake', r, readIds)),
      ]
        .filter((n, idx, arr) => arr.findIndex(x => x.id === n.id) === idx) // de-dupe
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50)

      setNotifications(initial)
    }

    init()

    // Realtime subscriptions
    const collections: Array<{ name: string; type: Notification['type'] }> = [
      { name: 'tasks', type: 'task' },
      { name: 'deals', type: 'deal' },
      { name: 'contacts', type: 'contact' },
      { name: 'invoices', type: 'invoice' },
    ]

    collections.forEach(({ name, type }) => {
      pb.collection(name).subscribe('*', (e) => {
        if ((e.action === 'create' || e.action === 'update') && e.record.assignedToId === currentUserId) {
          setReadSet((rs) => {
            const n = buildNotif(type, e.record, rs)
            upsertNotification(n)
            return rs
          })
        }
      }).catch(() => {})
    })

    if (userRole === 'admin' || userRole === 'hr') {
      pb.collection('intake_submissions').subscribe('*', (e) => {
        if (e.action === 'create') {
          setReadSet((rs) => {
            const n = buildNotif('intake', e.record, rs)
            upsertNotification(n)
            return rs
          })
        }
      }).catch(() => {})
    }

    return () => {
      cancelled = true
      collections.forEach(({ name }) => pb.collection(name).unsubscribe('*').catch(() => {}))
      if (userRole === 'admin' || userRole === 'hr') {
        pb.collection('intake_submissions').unsubscribe('*').catch(() => {})
      }
    }
  }, [currentUserId, userRole, buildNotif, upsertNotification])

  // Actions
  const markAsRead = useCallback((id: string) => {
    setReadSet((prev) => {
      const next = new Set(prev)
      next.add(id)
      setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)))
      if (currentUserId) persistRead(currentUserId, id)
      return next
    })
  }, [currentUserId])

  const markAllAsRead = useCallback(() => {
    setNotifications((ns) => {
      const updated = ns.map((n) => ({ ...n, read: true }))
      setReadSet((prev) => {
        const next = new Set(prev)
        updated.forEach((n) => {
          next.add(n.id)
          if (currentUserId) persistRead(currentUserId, n.id)
        })
        return next
      })
      return updated
    })
  }, [currentUserId])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications }
}
