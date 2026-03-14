require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/site-auth', require('./routes/site-auth'));
app.use('/api/characters', require('./routes/characters'));
app.use('/api', require('./routes/sessions'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`🐱 The Sandbox server running on http://localhost:${PORT}`);
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('✅ Anthropic API key loaded.');
  } else {
    console.error('❌ ANTHROPIC_API_KEY not set! Chat will not work.');
  }
});
