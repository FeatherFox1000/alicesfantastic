# Unicorns Unite Game

A 3D magical adventure game built with Three.js where you play as a unicorn and rescue other unicorns in danger.

## Development

### Running the game in development mode

```bash
npm run dev
```

This will start a development server on http://localhost:5173 (or another port if 5173 is in use).

### Building for production

```bash
npm run build
```

This creates a production build in the `dist` folder.

### Deploying to the website

After building, copy the dist folder contents to `/public/unicorns-unite`:

```bash
npm run build
rm -rf ../../public/unicorns-unite
cp -r dist ../../public/unicorns-unite
```

Or use the provided script from the root of alicesfantastic:

```bash
npm run build:unicorns-unite
```

## Game Controls

- **WASD / Arrow Keys**: Move your unicorn
- **Mouse**: Look around (click to enable pointer lock)
- **Space**: Cast magic spell
- **Shift**: Activate protective shield

## Objective

Rescue all 5 unicorns in danger by casting spells on them!

## Technical Details

- Built with Three.js for 3D graphics
- Uses Vite for development and building
- Features include:
  - Realistic unicorn models with animations
  - Dynamic terrain with height mapping
  - Particle effects and post-processing (bloom)
  - Magic spell and shield systems
  - Camera controls and movement
