import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const dbPath = path.resolve('pb_data/data.db');

try {
  const db = new DatabaseSync(dbPath);
  const rows = db.prepare("SELECT * FROM custom_field_definitions").all();
  console.log('=== CUSTOM FIELD DEFINITIONS ===');
  console.log(JSON.stringify(rows, null, 2));
} catch (err) {
  console.error(err);
}
