/**
 * Pure CSV parsing utilities — safe for both client and server.
 * No database or server-only imports.
 */

export interface ContactRow {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

export function parseContactsCsv(csvText: string): { rows: ContactRow[]; errors: string[] } {
  const lines = csvText.trim().split(/\r?\n/);
  const errors: string[] = [];
  const rows: ContactRow[] = [];

  if (lines.length < 2) {
    errors.push('CSV must have a header row and at least one data row.');
    return { rows, errors };
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

  const nameIdx    = headers.findIndex(h => ['name', 'full name', 'fullname', 'contact name'].includes(h));
  const emailIdx   = headers.findIndex(h => ['email', 'email address', 'e-mail'].includes(h));
  const phoneIdx   = headers.findIndex(h => ['phone', 'phone number', 'mobile', 'telephone'].includes(h));
  const companyIdx = headers.findIndex(h => ['company', 'company name', 'organization', 'organisation'].includes(h));

  if (nameIdx === -1) {
    errors.push('Required column "name" not found in CSV headers.');
    return { rows, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const name = nameIdx >= 0 ? cols[nameIdx]?.trim() : '';
    if (!name) {
      errors.push(`Row ${i + 1}: skipped (missing name)`);
      continue;
    }

    rows.push({
      name,
      email:   emailIdx   >= 0 ? cols[emailIdx]?.trim()   || undefined : undefined,
      phone:   phoneIdx   >= 0 ? cols[phoneIdx]?.trim()   || undefined : undefined,
      company: companyIdx >= 0 ? cols[companyIdx]?.trim() || undefined : undefined,
    });
  }

  return { rows, errors };
}
