// Puppy Control - Multiplayer Server
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3002;

// Game rooms storage
const rooms = new Map();

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Generate random 6-character room code
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Create room
    socket.on('createRoom', (data) => {
        const roomCode = generateRoomCode();

        const room = {
            code: roomCode,
            host: socket.id,
            maxPlayers: data.maxPlayers,
            players: [{
                id: socket.id,
                name: data.playerName,
                isHost: true
            }],
            gameStarted: false
        };

        rooms.set(roomCode, room);
        socket.join(roomCode);
        socket.roomCode = roomCode;

        console.log(`Room created: ${roomCode} by ${data.playerName}`);

        socket.emit('roomCreated', { roomCode });
        socket.emit('playerJoined', { players: room.players });
    });

    // Join room
    socket.on('joinRoom', (data) => {
        const room = rooms.get(data.roomCode);

        if (!room) {
            socket.emit('error', { message: 'Room not found!' });
            return;
        }

        if (room.gameStarted) {
            socket.emit('error', { message: 'Game already in progress!' });
            return;
        }

        if (room.players.length >= room.maxPlayers) {
            socket.emit('error', { message: 'Room is full!' });
            return;
        }

        room.players.push({
            id: socket.id,
            name: data.playerName,
            isHost: false
        });

        socket.join(data.roomCode);
        socket.roomCode = data.roomCode;

        console.log(`${data.playerName} joined room ${data.roomCode}`);

        socket.emit('roomJoined', { roomCode: data.roomCode });
        io.to(data.roomCode).emit('playerJoined', { players: room.players });
    });

    // Start game
    socket.on('startGame', (data) => {
        const room = rooms.get(data.roomCode);

        if (!room) {
            socket.emit('error', { message: 'Room not found!' });
            return;
        }

        if (socket.id !== room.host) {
            socket.emit('error', { message: 'Only the host can start the game!' });
            return;
        }

        if (room.players.length < 1) {
            socket.emit('error', { message: 'Need at least 1 player to start!' });
            return;
        }

        room.gameStarted = true;

        console.log(`Game started in room ${data.roomCode}`);

        // Send game start to all players with their player IDs
        room.players.forEach(player => {
            io.to(player.id).emit('gameStarted', {
                myPlayerId: player.id,
                players: room.players
            });
        });
    });

    // Player movement
    socket.on('playerMove', (data) => {
        const room = rooms.get(data.roomCode);
        if (!room || !room.gameStarted) return;

        // Broadcast to other players in the room
        socket.to(data.roomCode).emit('playerMoved', {
            playerId: socket.id,
            x: data.x,
            y: data.y,
            velocityX: data.velocityX,
            velocityY: data.velocityY,
            direction: data.direction,
            highestY: data.highestY
        });
    });

    // Player won
    socket.on('playerWon', (data) => {
        const room = rooms.get(data.roomCode);
        if (!room || !room.gameStarted) return;

        // Broadcast winner to all players in the room
        io.to(data.roomCode).emit('playerWon', {
            playerName: data.playerName
        });

        console.log(`${data.playerName} won in room ${data.roomCode}!`);
    });

    // Leave room
    socket.on('leaveRoom', (data) => {
        handlePlayerLeave(socket, data.roomCode);
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);

        if (socket.roomCode) {
            handlePlayerLeave(socket, socket.roomCode);
        }
    });

    // Handle player leaving
    function handlePlayerLeave(socket, roomCode) {
        const room = rooms.get(roomCode);
        if (!room) return;

        // Check if player was host
        const wasHost = room.host === socket.id;

        // Remove player from room
        room.players = room.players.filter(p => p.id !== socket.id);

        if (room.players.length === 0) {
            // Delete empty room
            rooms.delete(roomCode);
            console.log(`Room ${roomCode} deleted (empty)`);
        } else if (wasHost) {
            // Host left, assign new host
            room.host = room.players[0].id;
            room.players[0].isHost = true;

            io.to(roomCode).emit('playerLeft', { players: room.players });
            io.to(roomCode).emit('hostLeft');

            console.log(`Host left room ${roomCode}, new host: ${room.host}`);
        } else {
            // Regular player left
            io.to(roomCode).emit('playerLeft', { players: room.players });
            console.log(`Player left room ${roomCode}`);
        }

        socket.leave(roomCode);
    }
});

server.listen(PORT, () => {
    console.log(`🐕 Puppy Control Server running on port ${PORT}`);
    console.log(`Game available at http://localhost:${PORT}`);
});
