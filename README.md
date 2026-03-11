# Alice's Fantastic Game Studio

A collection of games built by Alice! React + Vite website with multiple game projects.

## Games

- **AI RP Studio** — AI-powered role-playing game where you create your own world and character, then chat with an AI storytelling companion. Built with Express, SQLite, and the Claude API.
- **Space Pups** — Multiplayer vertical platformer racing game with 69+ customization items. Built with Socket.io.
- **Unicorns Unite** — 3D adventure game built with WebGL.
- **Creator** — 2D world-builder sandbox game.
- **Tomato Hunter** — Alice's first game, built in Construct 3. Includes v1 and v2.

## Development

```bash
npm install
npm run dev
```

This starts the main website (port 5173) and all game servers concurrently.

To run the AI RP Studio backend separately:

```bash
cd games/ai-rp-studio
npm install
cp .env.example .env  # Add your ANTHROPIC_API_KEY
npm run dev
```

### Dev Ports

| Service | Port |
|---------|------|
| Main website | 5173 |
| Unicorns Unite | 5174 |
| Creator | 5175 |
| Space Pups server | 3002 |
| Visitor tracker | 3001 |
| AI RP Studio backend | 3003 |

## Deployment

### Frontend (GitHub Pages)

The React website auto-deploys to GitHub Pages on push to `main` via `.github/workflows/deploy.yml`.

### AI RP Studio Backend (Fly.io)

The backend runs on [Fly.io](https://fly.io) with a persistent SQLite database.

```bash
cd games/ai-rp-studio
fly deploy
```

**Fly.io secrets required:**

| Secret | Description |
|--------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key for AI chat |
| `JWT_SECRET` | Random string for signing auth tokens |

Set secrets with:

```bash
fly secrets set ANTHROPIC_API_KEY=your-key JWT_SECRET=your-secret
```

The database is stored on a persistent volume, so user accounts, characters, and chat history survive redeployments.

**Useful commands:**

```bash
fly logs --app ai-rp-studio    # View logs
fly status --app ai-rp-studio  # Check app status
fly ssh console                # SSH into the server
```
