import prisma from '@/lib/db';
import { requireUserId } from '@/lib/auth';

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
