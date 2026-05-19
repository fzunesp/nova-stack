import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase'
import { useAuth } from '@/hooks/useAuth'

export interface Notification {
  id: string; // unique notification ID
  type: 'task' | 'deal' | 'contact' | 'invoice' | 'intake';
  recordId: string; // ID of the referenced record
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])

  const currentUserId = user?.id
  const userRole = (user as any)?.role

  // Load from localStorage on mount/user change
  useEffect(() => {
    if (!currentUserId) return
    const stored = localStorage.getItem(`ns_notifications_${currentUserId}`)
    if (stored) {
      try {
        setNotifications(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse notifications', e)
      }
    }
  }, [currentUserId])

  // Save to localStorage when notifications state changes
  const saveNotifications = (newNotifications: Notification[]) => {
    setNotifications(newNotifications)
    if (currentUserId) {
      localStorage.setItem(`ns_notifications_${currentUserId}`, JSON.stringify(newNotifications))
    }
  }

  // Helper to add a notification safely without duplicates
  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const id = `${notif.type}-${notif.recordId}`
    const timestamp = new Date().toISOString()
    
    setNotifications((prev) => {
      // Check if this exact notification already exists
      const exists = prev.some((n) => n.id === id)
      if (exists) return prev

      const newNotif: Notification = {
        ...notif,
        id,
        timestamp,
        read: false,
      }
      const updated = [newNotif, ...prev].slice(0, 50) // Keep last 50 notifications
      if (currentUserId) {
        localStorage.setItem(`ns_notifications_${currentUserId}`, JSON.stringify(updated))
      }
      return updated
    })
  }

  // Fetch initial assignments and approvals
  useEffect(() => {
    if (!currentUserId) return

    const fetchInitial = async () => {
      try {
        const filter = `assignedToId = "${currentUserId}"`
        const [tasks, deals, contacts, invoices] = await Promise.all([
          pb.collection('tasks').getList(1, 10, { filter, sort: '-id' }).catch(() => ({ items: [] })),
          pb.collection('deals').getList(1, 10, { filter, sort: '-id' }).catch(() => ({ items: [] })),
          pb.collection('contacts').getList(1, 10, { filter, sort: '-id' }).catch(() => ({ items: [] })),
          pb.collection('invoices').getList(1, 10, { filter, sort: '-id' }).catch(() => ({ items: [] })),
        ])

        // Fetch pending intake submissions for HR / Admin approvals
        let pendingIntake: any = { items: [] }
        if (userRole === 'admin' || userRole === 'hr') {
          pendingIntake = await pb.collection('intake_submissions').getList(1, 10, {
            filter: 'status = "pending"',
            sort: '-id'
          }).catch(() => ({ items: [] }))
        }

        const initialNotifs: Omit<Notification, 'id' | 'timestamp' | 'read'>[] = []

        tasks.items.forEach((item: any) => {
          initialNotifs.push({
            type: 'task',
            recordId: item.id,
            title: 'Task Assigned',
            message: `Task "${item.title}" is assigned to you.`,
          })
        })

        deals.items.forEach((item: any) => {
          initialNotifs.push({
            type: 'deal',
            recordId: item.id,
            title: 'Deal Assigned',
            message: `Deal "${item.title}" is assigned to you.`,
          })
        })

        contacts.items.forEach((item: any) => {
          initialNotifs.push({
            type: 'contact',
            recordId: item.id,
            title: 'Contact Assigned',
            message: `Contact "${item.name}" is assigned to you.`,
          })
        })

        invoices.items.forEach((item: any) => {
          initialNotifs.push({
            type: 'invoice',
            recordId: item.id,
            title: 'Invoice Assigned',
            message: `Invoice "${item.title}" is assigned to you.`,
          })
        })

        pendingIntake.items.forEach((item: any) => {
          initialNotifs.push({
            type: 'intake',
            recordId: item.id,
            title: 'Approval Required',
            message: `New intake submission from "${item.name}" requires your approval.`,
          })
        })

        // Merge fetched items into our current local notifications without overriding 'read' status
        setNotifications((prev) => {
          const storedMap = new Map(prev.map(n => [n.id, n]))
          const merged: Notification[] = []

          initialNotifs.forEach((n) => {
            const id = `${n.type}-${n.recordId}`
            if (storedMap.has(id)) {
              merged.push(storedMap.get(id)!)
            } else {
              merged.push({
                ...n,
                id,
                timestamp: new Date().toISOString(),
                read: false,
              })
            }
          })

          // Add any remaining historical items that weren't in the initial list
          prev.forEach(p => {
            if (!merged.some(m => m.id === p.id)) {
              merged.push(p)
            }
          })

          // Sort by timestamp desc
          const sorted = merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50)
          localStorage.setItem(`ns_notifications_${currentUserId}`, JSON.stringify(sorted))
          return sorted
        })
      } catch (err) {
        console.error('Failed to fetch initial assignments', err)
      }
    }

    fetchInitial()

    // Real-time subscriptions for assignments
    const collections = ['tasks', 'deals', 'contacts', 'invoices']
    collections.forEach((colName) => {
      pb.collection(colName).subscribe('*', (e) => {
        if (e.action === 'create' || e.action === 'update') {
          const record = e.record
          if (record.assignedToId === currentUserId) {
            const label = colName.charAt(0).toUpperCase() + colName.slice(1, -1)
            const titleField = record.title || record.name || 'Untitled'
            addNotification({
              type: colName.slice(0, -1) as any,
              recordId: record.id,
              title: `${label} Assigned`,
              message: `You have been assigned to: "${titleField}"`,
            })
          }
        }
      }).catch(err => console.error(`Subscription failed for ${colName}`, err))
    })

    // Subscriptions for Intake approvals (Admin / HR only)
    if (userRole === 'admin' || userRole === 'hr') {
      pb.collection('intake_submissions').subscribe('*', (e) => {
        if (e.action === 'create') {
          const record = e.record
          addNotification({
            type: 'intake',
            recordId: record.id,
            title: 'Approval Required',
            message: `New intake submission from "${record.name}" requires your approval.`,
          })
        }
      }).catch(err => console.error('Subscription failed for intake_submissions', err))
    }

    // Cleanup subscriptions on unmount or user change
    return () => {
      collections.forEach((colName) => {
        pb.collection(colName).unsubscribe('*').catch(() => {})
      })
      if (userRole === 'admin' || userRole === 'hr') {
        pb.collection('intake_submissions').unsubscribe('*').catch(() => {})
      }
    }
  }, [currentUserId, userRole])

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    saveNotifications(updated)
  }

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }))
    saveNotifications(updated)
  }

  const clearNotifications = () => {
    saveNotifications([])
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  }
}
