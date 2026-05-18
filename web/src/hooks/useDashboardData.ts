import { useQuery } from '@tanstack/react-query'
import pb from '@/lib/pocketbase'

export interface BusinessMetrics {
  totalRevenue: number
  outstandingRevenue: number
  activeDeals: number
  totalDeals: number
  wonDeals: number
  conversionRate: number
  pendingTasks: number
  totalInvoices: number
}

export interface RadarItem {
  id: string
  title: string
  context: string
  link: string
  level: 'task' | 'deal' | 'invoice' | 'contact'
}

export interface RadarData {
  urgent: RadarItem[]
  attention: RadarItem[]
  opportunities: RadarItem[]
}

export interface TodaySummary {
  dueTasks: number
  overdueInvoices: number
  dealsNeedingAttention: number
}

export interface MoneyAtRisk {
  overdueInvoicesTotal: number
  openDealsValue: number
  totalAtRisk: number
}

export interface SignalItem {
  id: string
  type: 'task' | 'intake' | 'deal'
  title: string
  status: string
  link: string
  timestamp: string
  isNew: boolean
}

export interface DashboardData {
  metrics: BusinessMetrics
  radar: RadarData
  today: TodaySummary
  moneyAtRisk: MoneyAtRisk
  mySignals: SignalItem[]
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil(Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))
}

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard_data'],
    queryFn: async (): Promise<DashboardData> => {
      const now = new Date()
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      // Fetch all required data
      const [tasks, deals, invoices, contacts, intakes] = await Promise.all([
        pb.collection('tasks').getFullList(),
        pb.collection('deals').getFullList(),
        pb.collection('invoices').getFullList(),
        pb.collection('contacts').getFullList(),
        pb.collection('intake_submissions').getFullList({ sort: '-id' }),
      ])

      // 1. Business Metrics
      const totalRevenue = invoices
        .filter((i) => i.paidAt)
        .reduce((sum, i) => sum + (i.amount || 0), 0)

      const outstandingRevenue = invoices
        .filter((i) => i.status === 'pending' || i.status === 'draft' || i.status === 'active')
        .reduce((sum, i) => sum + (i.amount || 0), 0)

      const activeStages = new Set(['lead', 'contacted', 'quoted'])
      const activeDeals = deals.filter((d) => activeStages.has(d.stage)).length
      const wonDeals = deals.filter((d) => d.stage === 'won').length
      const totalDeals = deals.length
      const conversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0

      const pendingTasks = tasks.filter((t) => t.status !== 'approved').length
      const totalInvoices = invoices.length

      const metrics: BusinessMetrics = {
        totalRevenue,
        outstandingRevenue,
        activeDeals,
        totalDeals,
        wonDeals,
        conversionRate,
        pendingTasks,
        totalInvoices,
      }

      // 2. Radar Data
      const urgent: (RadarItem & { sortKey: number })[] = []
      const attention: (RadarItem & { sortKey: number })[] = []
      const opportunities: (RadarItem & { sortKey: number })[] = []

      // === URGENT ===
      for (const t of tasks) {
        if (t.dueDate && new Date(t.dueDate) < now && t.status !== 'approved') {
          const daysOverdue = daysBetween(new Date(t.dueDate), now)
          urgent.push({
            id: t.id,
            title: t.title,
            context: `Overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} — complete it`,
            link: `/tasks`,
            level: 'task',
            sortKey: daysOverdue,
          })
        }
      }

      for (const d of deals) {
        if (d.expectedCloseDate && new Date(d.expectedCloseDate) < now && d.stage !== 'won' && d.stage !== 'lost') {
          const daysOverdue = daysBetween(new Date(d.expectedCloseDate), now)
          urgent.push({
            id: d.id,
            title: d.title,
            context: `Past expected close by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} — update stage`,
            link: `/crm`,
            level: 'deal',
            sortKey: daysOverdue,
          })
        }
      }

      for (const i of invoices) {
        if (i.status === 'pending' && i.issuedDate && new Date(i.issuedDate) < sevenDaysAgo) {
          const daysAgo = daysBetween(new Date(i.issuedDate), now)
          urgent.push({
            id: i.id,
            title: i.title,
            context: `Sent ${daysAgo} days ago — follow up`,
            link: `/invoices`,
            level: 'invoice',
            sortKey: daysAgo,
          })
        }
      }

      // === ATTENTION ===
      for (const t of tasks) {
        if (t.dueDate) {
          const due = new Date(t.dueDate)
          if (due >= now && due <= threeDaysFromNow && t.status !== 'done') {
            const daysLeft = daysBetween(now, due)
            if (daysLeft <= 0) {
              attention.push({
                id: t.id,
                title: t.title,
                context: 'Due today — start working',
                link: `/tasks`,
                level: 'task',
                sortKey: 0,
              })
            } else {
              attention.push({
                id: t.id,
                title: t.title,
                context: `Due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} — plan ahead`,
                link: `/tasks`,
                level: 'task',
                sortKey: daysLeft,
              })
            }
          }
        }
      }

      for (const d of deals) {
        const created = d.created ? new Date(d.created) : new Date()
        if ((d.stage === 'contacted' || d.stage === 'quoted') && created < fourteenDaysAgo) {
          const daysInStage = daysBetween(created, now)
          attention.push({
            id: d.id,
            title: d.title,
            context: `In ${d.stage} for ${daysInStage} days — follow up`,
            link: `/crm`,
            level: 'deal',
            sortKey: daysInStage,
          })
        }
      }

      for (const i of invoices) {
        if (i.status === 'pending' && i.issuedDate) {
          const issued = new Date(i.issuedDate)
          if (issued >= sevenDaysAgo) {
            const daysAgo = daysBetween(issued, now)
            attention.push({
              id: i.id,
              title: i.title,
              context: `Sent ${daysAgo} days ago — awaiting payment`,
              link: `/invoices`,
              level: 'invoice',
              sortKey: daysAgo,
            })
          }
        }
      }

      // === OPPORTUNITIES ===
      for (const d of deals) {
        // Find if this deal has any invoices
        const dealInvoices = invoices.filter(i => i.dealId === d.id)
        if (d.value && d.value > 0 && dealInvoices.length === 0 && d.stage !== 'won' && d.stage !== 'lost') {
          // Find contact name if any
          const contact = d.contactId ? contacts.find(c => c.id === d.contactId) : null
          const contactSuffix = contact?.name ? ` with ${contact.name}` : ''
          opportunities.push({
            id: d.id,
            title: d.title,
            context: `Valued at $${d.value.toLocaleString()}${contactSuffix} — create invoice`,
            link: `/crm`,
            level: 'deal',
            sortKey: -d.value,
          })
        }
      }

      for (const i of invoices) {
        if (i.status === 'draft') {
          opportunities.push({
            id: i.id,
            title: i.title,
            context: 'Draft — send to client',
            link: `/invoices`,
            level: 'invoice',
            sortKey: 0,
          })
        }
      }

      for (const c of contacts) {
        const contactDeals = deals.filter(d => d.contactId === c.id)
        if (contactDeals.length === 0) {
          opportunities.push({
            id: c.id,
            title: c.name,
            context: 'New contact — create a deal',
            link: `/crm`,
            level: 'contact',
            sortKey: c.created ? -new Date(c.created).getTime() : 0,
          })
        }
      }

      const radar: RadarData = {
        urgent: urgent.sort((a, b) => b.sortKey - a.sortKey).slice(0, 5),
        attention: attention.sort((a, b) => a.sortKey - b.sortKey).slice(0, 5),
        opportunities: opportunities.sort((a, b) => a.sortKey - b.sortKey).slice(0, 5),
      }

      // 3. Today Summary
      const dueTasksCount = tasks.filter(t => t.dueDate && new Date(t.dueDate) <= now && t.status !== 'approved').length
      const overdueInvoicesCount = invoices.filter(i => i.status === 'pending' && i.issuedDate && new Date(i.issuedDate) < sevenDaysAgo).length
      const staleDealsCount = deals.filter(d => ['contacted', 'quoted'].includes(d.stage) && (d.created ? new Date(d.created) : new Date()) < fourteenDaysAgo).length

      const today: TodaySummary = {
        dueTasks: dueTasksCount,
        overdueInvoices: overdueInvoicesCount,
        dealsNeedingAttention: staleDealsCount,
      }

      // 4. Money At Risk
      const overdueInvoicesItems = invoices.filter(i => i.status === 'pending' && i.issuedDate && new Date(i.issuedDate) < sevenDaysAgo)
      const openDealsItems = deals.filter(d => !['won', 'lost'].includes(d.stage) && d.value > 0)

      const overdueInvoicesTotal = overdueInvoicesItems.reduce((sum, i) => sum + (i.amount || 0), 0)
      const openDealsValue = openDealsItems.reduce((sum, d) => sum + (d.value || 0), 0)

      const moneyAtRisk: MoneyAtRisk = {
        overdueInvoicesTotal,
        openDealsValue,
        totalAtRisk: overdueInvoicesTotal + openDealsValue,
      }

      // 5. My Signals
      // Get the current user
      const userId = pb.authStore.record?.id
      
      const myTasks = tasks.filter(t => t.assignedToId === userId && t.status !== 'approved')
        .sort((a, b) => (b.created ? new Date(b.created).getTime() : 0) - (a.created ? new Date(a.created).getTime() : 0))
        .slice(0, 5)
        
      const myIntakes = intakes.filter(i => i.assignedToId === userId && !['approved', 'rejected', 'archived'].includes(i.status))
        .sort((a, b) => (b.created ? new Date(b.created).getTime() : 0) - (a.created ? new Date(a.created).getTime() : 0))
        .slice(0, 5)
        
      const myDeals = deals.filter(d => d.assignedToId === userId && !['won', 'lost'].includes(d.stage))
        .sort((a, b) => (b.created ? new Date(b.created).getTime() : 0) - (a.created ? new Date(a.created).getTime() : 0))
        .slice(0, 3)

      const mySignals: SignalItem[] = [
        ...myTasks.map((t): SignalItem => ({
          id: t.id,
          type: 'task',
          title: t.title,
          status: t.status,
          link: `/tasks`,
          timestamp: t.created || '',
          isNew: t.status === 'draft',
        })),
        ...myIntakes.map((i): SignalItem => ({
          id: i.id,
          type: 'intake',
          title: i.name,
          status: i.status,
          link: `/intake`,
          timestamp: i.created || '',
          isNew: i.status === 'draft',
        })),
        ...myDeals.map((d): SignalItem => ({
          id: d.id,
          type: 'deal',
          title: d.title,
          status: d.stage,
          link: `/crm`,
          timestamp: d.created || '',
          isNew: d.stage === 'lead',
        })),
      ].sort((a, b) => (b.timestamp ? new Date(b.timestamp).getTime() : 0) - (a.timestamp ? new Date(a.timestamp).getTime() : 0))

      return {
        metrics,
        radar,
        today,
        moneyAtRisk,
        mySignals,
      }
    },
  })
}
