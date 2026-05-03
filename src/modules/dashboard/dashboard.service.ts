import prisma from '@/lib/db';
import { requireUserId, getSessionUserId } from '@/lib/auth';

export interface BusinessMetrics {
  totalRevenue: number;
  outstandingRevenue: number;
  activeDeals: number;
  totalDeals: number;
  wonDeals: number;
  conversionRate: number;
  pendingTasks: number;
  totalInvoices: number;
}

export interface ActivityItem {
  id: string;
  type: 'deal' | 'invoice' | 'task';
  label: string;
  subLabel: string;
  timestamp: Date;
  badge?: string;
  badgeColor?: 'green' | 'blue' | 'violet' | 'gray';
}

export async function getBusinessMetrics(): Promise<BusinessMetrics> {
  const userId = await requireUserId();

  const [invoices, deals, tasks] = await Promise.all([
    prisma.invoice.findMany({ where: { userId }, select: { amount: true, status: true, paidAt: true } }),
    prisma.deal.findMany({ where: { userId }, select: { stage: true } }),
    prisma.task.findMany({ where: { userId }, select: { status: true } }),
  ]);

  const totalRevenue = invoices
    .filter(i => i.paidAt !== null)
    .reduce((sum, i) => sum + i.amount, 0);

  const outstandingRevenue = invoices
    .filter(i => i.status === 'sent' || i.status === 'draft')
    .reduce((sum, i) => sum + i.amount, 0);

  const activeStages = new Set(['lead', 'contacted', 'quoted']);
  const activeDeals = deals.filter(d => activeStages.has(d.stage.toLowerCase())).length;
  const wonDeals = deals.filter(d => d.stage.toLowerCase() === 'won').length;
  const totalDeals = deals.length;
  const conversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

  const pendingTasks = tasks.filter(t => t.status !== 'done').length;
  const totalInvoices = invoices.length;

  return { totalRevenue, outstandingRevenue, activeDeals, totalDeals, wonDeals, conversionRate, pendingTasks, totalInvoices };
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
  const userId = await requireUserId();

  const [recentDeals, recentInvoices, paidInvoices, recentTasks] = await Promise.all([
    prisma.deal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, stage: true, value: true, createdAt: true },
    }),
    prisma.invoice.findMany({
      where: { userId },
      orderBy: { issuedDate: 'desc' },
      take: 5,
      select: { id: true, title: true, amount: true, status: true, issuedDate: true },
    }),
    prisma.invoice.findMany({
      where: { userId, paidAt: { not: null } },
      orderBy: { paidAt: 'desc' },
      take: 5,
      select: { id: true, title: true, amount: true, paidAt: true },
    }),
    prisma.task.findMany({
      where: { userId, status: 'done' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, status: true, createdAt: true },
    }),
  ]);

  const items: ActivityItem[] = [
    ...recentDeals.map(d => ({
      id: d.id,
      type: 'deal' as const,
      label: d.title,
      subLabel: d.value != null
        ? `$${d.value.toLocaleString()} · ${d.stage.charAt(0).toUpperCase() + d.stage.slice(1)}`
        : d.stage.charAt(0).toUpperCase() + d.stage.slice(1),
      timestamp: d.createdAt,
      badge: d.stage,
      badgeColor: (d.stage === 'won' ? 'green' : d.stage === 'lost' ? 'gray' : 'blue') as 'green' | 'gray' | 'blue',
    })),
    ...recentInvoices.map(i => ({
      id: i.id,
      type: 'invoice' as const,
      label: i.title,
      subLabel: `$${i.amount.toLocaleString()} · ${i.status.charAt(0).toUpperCase() + i.status.slice(1)}`,
      timestamp: i.issuedDate,
      badge: i.status,
      badgeColor: (i.status === 'paid' ? 'green' : i.status === 'sent' ? 'blue' : 'gray') as 'green' | 'blue' | 'gray',
    })),
    ...paidInvoices.filter(i => i.paidAt !== null).map(i => ({
      id: `${i.id}-paid`,
      type: 'invoice' as const,
      label: i.title,
      subLabel: 'Invoice marked as paid',
      timestamp: i.paidAt as Date,
      badge: 'paid',
      badgeColor: 'green' as const,
    })),
    ...recentTasks.map(t => ({
      id: t.id,
      type: 'task' as const,
      label: t.title,
      subLabel: 'Task completed',
      timestamp: t.createdAt,
      badge: 'done',
      badgeColor: 'green' as const,
    })),
  ];

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);
}

export interface RadarItem {
  id: string;
  title: string;
  context: string;
  link: string;
  level: 'task' | 'deal' | 'invoice' | 'contact';
}

interface RadarItemInternal extends RadarItem {
  sortKey: number;
}

export interface RadarData {
  urgent: RadarItem[];
  attention: RadarItem[];
  opportunities: RadarItem[];
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil(Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export async function getRadarItems(): Promise<RadarData> {
  const userId = await requireUserId();
  const now = new Date();

  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [tasks, deals, invoices, contacts] = await Promise.all([
    prisma.task.findMany({
      where: { userId },
    }),
    prisma.deal.findMany({
      where: { userId },
      include: { invoices: { select: { id: true } }, contact: { select: { name: true } } },
    }),
    prisma.invoice.findMany({
      where: { userId },
    }),
    prisma.contact.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      include: { deals: { select: { id: true } } },
    }),
  ]);

  const urgent: RadarItemInternal[] = [];
  const attention: RadarItemInternal[] = [];
  const opportunities: RadarItemInternal[] = [];

  // === URGENT ===

  for (const t of tasks) {
    if (t.dueDate && t.dueDate < now && t.status !== 'done') {
      const daysOverdue = daysBetween(t.dueDate, now);
      urgent.push({
        id: t.id,
        title: t.title,
        context: `Overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} — complete it`,
        link: `/tasks/${t.id}/edit`,
        level: 'task',
        sortKey: daysOverdue,
      });
    }
  }

  for (const d of deals) {
    if (d.expectedCloseDate && d.expectedCloseDate < now && d.stage !== 'won' && d.stage !== 'lost') {
      const daysOverdue = daysBetween(d.expectedCloseDate, now);
      urgent.push({
        id: d.id,
        title: d.title,
        context: `Past expected close by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} — update stage`,
        link: `/crm/deals/${d.id}`,
        level: 'deal',
        sortKey: daysOverdue,
      });
    }
  }

  for (const i of invoices) {
    if (i.status === 'sent' && i.issuedDate < sevenDaysAgo) {
      const daysAgo = daysBetween(i.issuedDate, now);
      urgent.push({
        id: i.id,
        title: i.title,
        context: `Sent ${daysAgo} days ago — follow up`,
        link: `/invoices/${i.id}`,
        level: 'invoice',
        sortKey: daysAgo,
      });
    }
  }

  // === ATTENTION ===

  for (const t of tasks) {
    if (t.dueDate && t.dueDate >= now && t.dueDate <= threeDaysFromNow && t.status !== 'done') {
      const msPerDay = 1000 * 60 * 60 * 24;
      const diffMs = t.dueDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / msPerDay);

      if (daysLeft <= 0) {
        attention.push({
          id: t.id,
          title: t.title,
          context: 'Due today — start working',
          link: `/tasks/${t.id}/edit`,
          level: 'task',
          sortKey: 0,
        });
      } else {
        attention.push({
          id: t.id,
          title: t.title,
          context: `Due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} — plan ahead`,
          link: `/tasks/${t.id}/edit`,
          level: 'task',
          sortKey: daysLeft,
        });
      }
    }
  }

  for (const d of deals) {
    if ((d.stage === 'contacted' || d.stage === 'quoted') && d.createdAt < fourteenDaysAgo) {
      const daysInStage = daysBetween(d.createdAt, now);
      attention.push({
        id: d.id,
        title: d.title,
        context: `In ${d.stage} for ${daysInStage} days — follow up`,
        link: `/crm/deals/${d.id}`,
        level: 'deal',
        sortKey: daysInStage,
      });
    }
  }

  for (const i of invoices) {
    if (i.status === 'sent' && i.issuedDate >= sevenDaysAgo) {
      const daysAgo = daysBetween(i.issuedDate, now);
      attention.push({
        id: i.id,
        title: i.title,
        context: `Sent ${daysAgo} days ago — awaiting payment`,
        link: `/invoices/${i.id}`,
        level: 'invoice',
        sortKey: daysAgo,
      });
    }
  }

  // === OPPORTUNITIES ===

  for (const d of deals) {
    if (d.value && d.value > 0 && d.invoices.length === 0 && d.stage !== 'won' && d.stage !== 'lost') {
      const contactSuffix = d.contact?.name ? ` with ${d.contact.name}` : '';
      opportunities.push({
        id: d.id,
        title: d.title,
        context: `Valued at $${d.value.toLocaleString()}${contactSuffix} — create invoice`,
        link: `/crm/deals/${d.id}`,
        level: 'deal',
        sortKey: -d.value,
      });
    }
  }

  for (const i of invoices) {
    if (i.status === 'draft') {
      opportunities.push({
        id: i.id,
        title: i.title,
        context: 'Draft — send to client',
        link: `/invoices/${i.id}`,
        level: 'invoice',
        sortKey: 0,
      });
    }
  }

  for (const c of contacts) {
    if (c.deals.length === 0) {
      opportunities.push({
        id: c.id,
        title: c.name,
        context: 'New contact — create a deal',
        link: `/crm/${c.id}`,
        level: 'contact',
        sortKey: -c.createdAt.getTime(),
      });
    }
  }

  return {
    urgent: urgent.sort((a, b) => b.sortKey - a.sortKey).slice(0, 5),
    attention: attention.sort((a, b) => a.sortKey - b.sortKey).slice(0, 5),
    opportunities: opportunities.sort((a, b) => a.sortKey - b.sortKey).slice(0, 5),
  };
}

export interface TodaySummary {
  dueTasks: number;
  overdueInvoices: number;
  dealsNeedingAttention: number;
}

export async function getTodaySummary(): Promise<TodaySummary> {
  const userId = await requireUserId();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [dueTasks, overdueInvoices, staleDeals] = await Promise.all([
    prisma.task.count({
      where: { userId, dueDate: { lte: now }, status: { not: 'done' } },
    }),
    prisma.invoice.count({
      where: { userId, status: 'sent', issuedDate: { lt: sevenDaysAgo } },
    }),
    prisma.deal.count({
      where: {
        userId,
        stage: { in: ['contacted', 'quoted'] },
        createdAt: { lt: fourteenDaysAgo },
      },
    }),
  ]);

  return { dueTasks, overdueInvoices, dealsNeedingAttention: staleDeals };
}

export interface MoneyAtRisk {
  overdueInvoicesTotal: number;
  openDealsValue: number;
  totalAtRisk: number;
}

export async function getMoneyAtRisk(): Promise<MoneyAtRisk> {
  const userId = await requireUserId();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [overdueInvoices, openDeals] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId, status: 'sent', issuedDate: { lt: sevenDaysAgo } },
      select: { amount: true },
    }),
    prisma.deal.findMany({
      where: {
        userId,
        stage: { notIn: ['won', 'lost'] },
        value: { gt: 0 },
      },
      select: { value: true },
    }),
  ]);

  const overdueInvoicesTotal = overdueInvoices.reduce((sum, i) => sum + i.amount, 0);
  const openDealsValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  return {
    overdueInvoicesTotal,
    openDealsValue,
    totalAtRisk: overdueInvoicesTotal + openDealsValue,
  };
}

export interface SignalItem {
  id: string;
  type: 'task' | 'intake' | 'deal';
  title: string;
  status: string;
  link: string;
  timestamp: Date;
  isNew: boolean;
}

export async function getMySignals(): Promise<SignalItem[]> {
  const userId = await getSessionUserId();
  if (!userId) return [];

  const [tasks, intakes, deals] = await Promise.all([
    prisma.task.findMany({
      where: { assignedToId: userId, status: { not: 'done' } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.intakeSubmission.findMany({
      where: {
        assignedToId: userId,
        status: { notIn: ['approved', 'rejected', 'converted'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.deal.findMany({
      where: {
        assignedToId: userId,
        stage: { notIn: ['won', 'lost'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
  ]);

  const items: SignalItem[] = [
    ...tasks.map(t => ({
      id: t.id,
      type: 'task' as const,
      title: t.title,
      status: t.status,
      link: `/tasks/${t.id}/edit`,
      timestamp: t.createdAt,
      isNew: t.status === 'todo',
    })),
    ...intakes.map(i => ({
      id: i.id,
      type: 'intake' as const,
      title: i.name,
      status: i.status,
      link: `/intake`,
      timestamp: i.createdAt,
      isNew: i.status === 'new',
    })),
    ...deals.map(d => ({
      id: d.id,
      type: 'deal' as const,
      title: d.title,
      status: d.stage,
      link: `/crm/deals/${d.id}`,
      timestamp: d.createdAt,
      isNew: d.stage === 'lead',
    })),
  ];

  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
