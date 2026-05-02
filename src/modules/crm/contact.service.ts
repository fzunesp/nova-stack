import prisma from '@/lib/db';
import { Contact, CreateContactInput, UpdateContactInput } from './types';
import { requireUserId } from '@/lib/auth';

export async function getAllContacts(): Promise<Contact[]> {
  try {
    const userId = await requireUserId();
    return await prisma.contact.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw new Error('Failed to fetch contacts');
  }
}

export async function getContactById(id: string): Promise<Contact | null> {
  try {
    const userId = await requireUserId();
    return await prisma.contact.findFirst({
      where: { id, userId }
    });
  } catch (error) {
    console.error(`Error fetching contact with id ${id}:`, error);
    throw new Error('Failed to fetch contact');
  }
}

export async function createContact(data: CreateContactInput): Promise<Contact> {
  try {
    const userId = await requireUserId();
    return await prisma.contact.create({
      data: { ...data, userId }
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    throw new Error('Failed to create contact');
  }
}

export async function updateContact(id: string, data: UpdateContactInput): Promise<Contact> {
  try {
    const userId = await requireUserId();
    // Verify ownership first
    const existing = await prisma.contact.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Not found or unauthorized');

    return await prisma.contact.update({
      where: { id },
      data
    });
  } catch (error) {
    console.error(`Error updating contact with id ${id}:`, error);
    throw new Error('Failed to update contact');
  }
}

export async function deleteContact(id: string): Promise<Contact> {
  try {
    const userId = await requireUserId();
    // Verify ownership first
    const existing = await prisma.contact.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Not found or unauthorized');

    return await prisma.contact.delete({
      where: { id }
    });
  } catch (error) {
    console.error(`Error deleting contact with id ${id}:`, error);
    throw new Error('Failed to delete contact');
  }
}
