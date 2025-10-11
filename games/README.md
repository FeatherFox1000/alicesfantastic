# Games Directory

This directory contains the source code for games embedded in the alicesfantastic website.

## Unicorns Unite

A 3D magical adventure game built with Three.js.

### Development Workflow

#### Working on the game

1. Navigate to the game directory:
```bash
cd games/unicorns-unite
```

2. Start the development server:
```bash
npm run dev
```

Or from the root of alicesfantastic:
```bash
npm run dev:unicorns-unite
```

This starts a local development server where you can see your changes in real-time.

#### Building and deploying to the website

From the root of alicesfantastic:
```bash
npm run build:unicorns-unite
```

This will:
1. Build the game for production
2. Copy the built files to `/public/unicorns-unite`
3. Make the game available at `/unicorns-unite/index.html` in the website

The game is then embedded in the UnicornsUnite page component via an iframe.

### File Structure

```
games/unicorns-unite/
├── index.html          # Game HTML entry point
├── main.js             # Main game logic and Three.js setup
├── package.json        # Dependencies (Three.js, Vite)
├── dist/               # Built files (generated)
└── README.md           # Game-specific documentation
```

### Making Changes

1. Edit `main.js` for game logic, 3D models, animations, etc.
2. Edit `index.html` for UI elements, styling, or HTML structure
3. Test your changes with `npm run dev` from the game directory
4. When satisfied, build and deploy with `npm run build:unicorns-unite` from the root
5. Test the embedded game on the website by running the main website dev server

### Integration with the Website

The game is embedded in `/src/pages/UnicornsUnite.jsx` using an iframe:

```jsx
<iframe
  src="/unicorns-unite/index.html"
  title="Unicorns Unite Game"
  className="game-iframe"
  allowFullScreen
/>
```

The styling for the embedded game is in `/src/pages/UnicornsUnite.css`.
