import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import authRouter from './auth-routes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3001;
const VISITORS_FILE = join(__dirname, 'visitors.json');

// Enable CORS for local development
app.use(cors());
app.use(express.json());

// Auth routes
app.use('/api/auth', authRouter);

// Initialize visitors file if it doesn't exist
async function initVisitorsFile() {
  try {
    await fs.access(VISITORS_FILE);
  } catch {
    await fs.writeFile(VISITORS_FILE, JSON.stringify({ count: 0, sessions: {} }));
  }
}

// Get visitor count
app.get('/api/visitors', async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFile(VISITORS_FILE, 'utf8'));
    res.json({ count: data.count });
  } catch (error) {
    console.error('Error reading visitors:', error);
    res.status(500).json({ error: 'Failed to get visitor count' });
  }
});

// Increment visitor count (with session tracking to prevent spam)
app.post('/api/visitors/increment', async (req, res) => {
  try {
    const sessionId = req.body.sessionId || req.ip + '-' + Date.now();
    const data = JSON.parse(await fs.readFile(VISITORS_FILE, 'utf8'));

    // Check if this session has already been counted (within last 24 hours)
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    // Clean up old sessions (older than 24 hours)
    Object.keys(data.sessions).forEach(key => {
      if (now - data.sessions[key] > dayInMs) {
        delete data.sessions[key];
      }
    });

    // Only increment if this is a new session
    if (!data.sessions[sessionId]) {
      data.count++;
      data.sessions[sessionId] = now;
      await fs.writeFile(VISITORS_FILE, JSON.stringify(data, null, 2));
    }

    res.json({ count: data.count, isNewVisitor: !data.sessions[sessionId] });
  } catch (error) {
    console.error('Error incrementing visitors:', error);
    res.status(500).json({ error: 'Failed to increment visitor count' });
  }
});

// Start server
initVisitorsFile().then(() => {
  app.listen(PORT, () => {
    console.log(`👁️  Visitor tracker running on port ${PORT}`);
    console.log(`   API available at http://localhost:${PORT}/api/visitors`);
  });
});
