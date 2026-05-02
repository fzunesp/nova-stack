import { Contact, Deal, Invoice } from '@/generated/prisma/client';

export type { Contact, Deal, Invoice };

export type DealWithContact = Deal & {
  contact: Contact;
  invoices?: Invoice[];
};

export interface CreateContactInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  notes?: string | null;
}

export interface UpdateContactInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  notes?: string | null;
}

export interface CreateDealInput {
  title: string;
  value?: number | null;
  stage?: string;
  expectedCloseDate?: Date | null;
  contactId: string;
}

export interface UpdateDealInput {
  title?: string;
  value?: number | null;
  stage?: string;
  expectedCloseDate?: Date | null;
  contactId?: string;
}
