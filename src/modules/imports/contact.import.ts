/**
 * Server-only contact import logic.
 * DO NOT import this in Client Components.
 */
import prisma from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import type { ContactRow } from './csv.parser';

export type { ContactRow };

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export async function importContacts(rows: ContactRow[]): Promise<ImportResult> {
  const userId = await requireUserId();

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  const CHUNK_SIZE = 50;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    try {
      const result = await prisma.contact.createMany({
        data: chunk.map(row => ({
          name:        row.name,
          email:       row.email || null,
          phone:       row.phone || null,
          companyName: row.company || null,
          userId,
        })),
      });
      imported += result.count;
    } catch {
      // Fallback: insert one-by-one
      for (const row of chunk) {
        try {
          await prisma.contact.create({
            data: { name: row.name, email: row.email || null, phone: row.phone || null, companyName: row.company || null, userId },
          });
          imported++;
        } catch (rowErr) {
          skipped++;
          errors.push(`Skipped "${row.name}": ${rowErr instanceof Error ? rowErr.message : String(rowErr)}`);
        }
      }
    }
  }

  return { imported, skipped, errors };
}
