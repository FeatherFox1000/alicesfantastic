import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dataDir = join(__dirname, 'data');
if (!existsSync(dataDir)) mkdirSync(dataDir);

const db = new Database(join(dataDir, 'site-auth.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

export default db;
