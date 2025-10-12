# 🐕 Puppy Control

A multiplayer 2D side-scrolling platformer game where players control cute puppies racing through platforms!

## Features

- **Multiplayer Gameplay**: Play with up to 8 friends simultaneously
- **Room System**: Create or join games using 6-digit codes (like Gimkit!)
- **Real-time Synchronization**: See other players move in real-time
- **Platform Physics**: Jump, run, and navigate through platforms
- **Cute Puppy Characters**: Each player controls an adorable puppy with unique colors

## How to Play

### Starting the Server

1. Navigate to the game directory:
   ```bash
   cd games/puppy-control
   ```

2. Install dependencies (first time only):
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and go to: `http://localhost:3001`

### Hosting a Game

1. Click **"Host Game"**
2. Enter your name
3. Select max players (2-8)
4. Click **"Create Room"**
5. Share the 6-digit room code with friends!
6. Wait for players to join
7. Click **"Start Game"** when ready

### Joining a Game

1. Click **"Join Game"**
2. Enter your name
3. Enter the 6-digit room code from your friend
4. Click **"Join Room"**
5. Wait for the host to start the game

### Controls

- **Arrow Keys** or **WASD**: Move left/right
- **Space** or **Up Arrow** or **W**: Jump

## Technical Details

### Built With

- **Frontend**: Vanilla JavaScript, HTML5 Canvas
- **Backend**: Node.js, Express
- **Real-time Communication**: Socket.io
- **Physics**: Custom collision detection system

### Architecture

- **Client-side**: Handles rendering, input, and local physics
- **Server-side**: Manages rooms, player connections, and broadcasts game state
- **Synchronization**: Position updates sent 60 times per second

## Development

Run in development mode with auto-restart:

```bash
npm run dev
```

## Future Enhancements

- [ ] Power-ups and collectibles
- [ ] Multiple levels/maps
- [ ] Score system
- [ ] Racing mode with finish line
- [ ] Custom puppy skins
- [ ] Sound effects and music
- [ ] Chat system

## Credits

Created with ❤️ for multiplayer fun!
