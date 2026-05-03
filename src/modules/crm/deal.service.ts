import prisma from '@/lib/db';
import { Deal, DealWithContact, CreateDealInput, UpdateDealInput } from './types';
import { requireUserId } from '@/lib/auth';

export async function getAllDeals(): Promise<DealWithContact[]> {
  try {
    const userId = await requireUserId();
    return await prisma.deal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { contact: true, invoices: true }
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    throw new Error('Failed to fetch deals');
  }
}

export async function getDealById(id: string): Promise<DealWithContact | null> {
  try {
    const userId = await requireUserId();
    return await prisma.deal.findFirst({
      where: { id, userId },
      include: { contact: true, invoices: true }
    });
  } catch (error) {
    console.error(`Error fetching deal with id ${id}:`, error);
    throw new Error('Failed to fetch deal');
  }
}

export async function getDealsByContact(contactId: string): Promise<Deal[]> {
  try {
    const userId = await requireUserId();
    return await prisma.deal.findMany({
      where: { contactId, userId },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error(`Error fetching deals for contact ${contactId}:`, error);
    throw new Error('Failed to fetch deals by contact');
  }
}

export async function createDeal(data: CreateDealInput): Promise<Deal> {
  try {
    const userId = await requireUserId();
    return await prisma.deal.create({
      data: { ...data, userId, assignedToId: userId }
    });
  } catch (error) {
    console.error('Error creating deal:', error);
    throw new Error('Failed to create deal');
  }
}

export async function updateDealAssignee(id: string, assigneeId: string): Promise<Deal> {
  try {
    const userId = await requireUserId();
    const existing = await prisma.deal.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Not found or unauthorized');

    return await prisma.deal.update({
      where: { id },
      data: { assignedToId: assigneeId },
    });
  } catch (error) {
    console.error(`Error updating deal assignee ${id}:`, error);
    throw new Error('Failed to update deal assignee');
  }
}

export async function updateDeal(id: string, data: UpdateDealInput): Promise<Deal> {
  try {
    const userId = await requireUserId();
    const existing = await prisma.deal.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Not found or unauthorized');

    return await prisma.deal.update({
      where: { id },
      data
    });
  } catch (error) {
    console.error(`Error updating deal with id ${id}:`, error);
    throw new Error('Failed to update deal');
  }
}

export async function deleteDeal(id: string): Promise<Deal> {
  try {
    const userId = await requireUserId();
    const existing = await prisma.deal.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Not found or unauthorized');

    return await prisma.deal.delete({
      where: { id }
    });
  } catch (error) {
    console.error(`Error deleting deal with id ${id}:`, error);
    throw new Error('Failed to delete deal');
  }
}
