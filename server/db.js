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
    is_banned INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Migrations for existing databases
try { db.exec(`ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0`); } catch (e) { /* already exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`); } catch (e) { /* already exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN is_child INTEGER DEFAULT 0`); } catch (e) { /* already exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN parent_email TEXT`); } catch (e) { /* already exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN parent_consent INTEGER DEFAULT 0`); } catch (e) { /* already exists */ }
try { db.exec(`ALTER TABLE users ADD COLUMN consent_token TEXT`); } catch (e) { /* already exists */ }

// Leaderboard scores table
db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    game TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, game),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

export default db;
