// Puppy Control - Multiplayer Platformer Game

class PuppyControl {
    constructor() {
        this.socket = null;
        this.roomCode = null;
        this.playerName = null;
        this.isHost = false;
        this.gameStarted = false;

        // Game state
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1200;
        this.canvas.height = 600;

        // World dimensions
        this.worldHeight = 4000; // Tall vertical world
        this.finishLineY = 100; // Win when reaching this height

        // Camera
        this.cameraY = 0;

        // Player state
        this.players = new Map();
        this.myPlayerId = null;
        this.winner = null;

        // Physics
        this.gravity = 0.6;
        this.jumpPower = 15;
        this.moveSpeed = 5;

        // Input
        this.keys = {};

        // Generate platforms going up
        this.platforms = this.generatePlatforms();

        this.init();
    }

    init() {
        this.connectToServer();
        this.setupEventListeners();
        this.setupKeyboardControls();
    }

    generatePlatforms() {
        const platforms = [];

        // Ground platform at bottom
        platforms.push({
            x: 0,
            y: this.worldHeight - 50,
            width: 1200,
            height: 50,
            color: '#2C5F2D',
            type: 'ground'
        });

        // Generate platforms going up
        let currentY = this.worldHeight - 200;
        const platformGap = 120; // Vertical gap between platforms

        while (currentY > this.finishLineY) {
            // Random platform configuration
            const platformWidth = 100 + Math.random() * 150;
            const platformX = Math.random() * (1200 - platformWidth);

            platforms.push({
                x: platformX,
                y: currentY,
                width: platformWidth,
                height: 20,
                color: '#654321',
                type: 'normal'
            });

            // Sometimes add extra platforms for variety
            if (Math.random() > 0.6) {
                const extraX = Math.random() * (1200 - 120);
                platforms.push({
                    x: extraX,
                    y: currentY - 60,
                    width: 120,
                    height: 20,
                    color: '#654321',
                    type: 'normal'
                });
            }

            currentY -= platformGap;
        }

        // Finish platform at the top
        platforms.push({
            x: 400,
            y: this.finishLineY - 30,
            width: 400,
            height: 30,
            color: '#FFD700',
            type: 'finish'
        });

        return platforms;
    }

    connectToServer() {
        // Connect to Socket.io server
        this.socket = io('http://localhost:3002');

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('roomCreated', (data) => {
            this.roomCode = data.roomCode;
            this.isHost = true;
            this.showLobby();
            this.updateRoomCodeDisplay();
        });

        this.socket.on('roomJoined', (data) => {
            this.roomCode = data.roomCode;
            this.showLobby();
            this.updateRoomCodeDisplay();
        });

        this.socket.on('playerJoined', (data) => {
            this.updatePlayersList(data.players);
        });

        this.socket.on('playerLeft', (data) => {
            this.updatePlayersList(data.players);
        });

        this.socket.on('gameStarted', (data) => {
            this.myPlayerId = data.myPlayerId;
            this.startGame(data.players);
        });

        this.socket.on('playerMoved', (data) => {
            if (this.players.has(data.playerId)) {
                const player = this.players.get(data.playerId);
                player.x = data.x;
                player.y = data.y;
                player.velocityX = data.velocityX;
                player.velocityY = data.velocityY;
                player.direction = data.direction;
                if (data.highestY !== undefined) {
                    player.highestY = data.highestY;
                }
            }
        });

        this.socket.on('playerWon', (data) => {
            this.winner = data.playerName;
        });

        this.socket.on('error', (data) => {
            alert(data.message);
        });

        this.socket.on('hostLeft', () => {
            alert('Host left the game. Returning to main menu.');
            this.returnToMainMenu();
        });
    }

    setupEventListeners() {
        // Main menu
        document.getElementById('host-btn').addEventListener('click', () => {
            this.showScreen('host-screen');
        });

        document.getElementById('join-btn').addEventListener('click', () => {
            this.showScreen('join-screen');
        });

        // Host screen
        document.getElementById('create-room-btn').addEventListener('click', () => {
            this.createRoom();
        });

        document.getElementById('back-from-host-btn').addEventListener('click', () => {
            this.showScreen('main-menu');
        });

        // Join screen
        document.getElementById('join-room-btn').addEventListener('click', () => {
            this.joinRoom();
        });

        document.getElementById('back-from-join-btn').addEventListener('click', () => {
            this.showScreen('main-menu');
        });

        // Lobby screen
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.socket.emit('startGame', { roomCode: this.roomCode });
        });

        document.getElementById('leave-lobby-btn').addEventListener('click', () => {
            this.leaveRoom();
        });

        document.getElementById('copy-code-btn').addEventListener('click', () => {
            this.copyRoomCode();
        });
    }

    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            // Prevent arrow key scrolling
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    createRoom() {
        const name = document.getElementById('host-name').value.trim();
        const maxPlayers = parseInt(document.getElementById('max-players').value);

        if (!name) {
            alert('Please enter your name');
            return;
        }

        this.playerName = name;
        this.socket.emit('createRoom', { playerName: name, maxPlayers });
    }

    joinRoom() {
        const name = document.getElementById('join-name').value.trim();
        const code = document.getElementById('room-code').value.trim().toUpperCase();

        if (!name) {
            alert('Please enter your name');
            return;
        }

        if (code.length !== 6) {
            alert('Please enter a valid 6-digit room code');
            return;
        }

        this.playerName = name;
        this.socket.emit('joinRoom', { playerName: name, roomCode: code });
    }

    showLobby() {
        this.showScreen('lobby-screen');
        if (this.isHost) {
            document.getElementById('start-game-btn').style.display = 'block';
        }
    }

    updateRoomCodeDisplay() {
        document.getElementById('display-room-code').textContent = this.roomCode;
        document.getElementById('room-code-game').textContent = `Room: ${this.roomCode}`;
    }

    updatePlayersList(players) {
        const container = document.getElementById('players-container');
        const count = document.getElementById('player-count');
        const maxCount = document.getElementById('max-player-count');

        container.innerHTML = '';
        count.textContent = players.length;

        players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item' + (player.isHost ? ' host' : '');

            const nameSpan = document.createElement('span');
            nameSpan.className = 'player-name';
            nameSpan.textContent = player.name;

            playerDiv.appendChild(nameSpan);

            if (player.isHost) {
                const badge = document.createElement('span');
                badge.className = 'player-badge';
                badge.textContent = 'HOST';
                playerDiv.appendChild(badge);
            }

            container.appendChild(playerDiv);
        });
    }

    leaveRoom() {
        this.socket.emit('leaveRoom', { roomCode: this.roomCode });
        this.returnToMainMenu();
    }

    returnToMainMenu() {
        this.roomCode = null;
        this.isHost = false;
        this.gameStarted = false;
        this.players.clear();
        this.showScreen('main-menu');
    }

    copyRoomCode() {
        navigator.clipboard.writeText(this.roomCode).then(() => {
            const btn = document.getElementById('copy-code-btn');
            btn.textContent = '✓';
            setTimeout(() => {
                btn.textContent = '📋';
            }, 2000);
        });
    }

    startGame(playerData) {
        this.gameStarted = true;
        this.showScreen('game-screen');
        this.winner = null;

        // Initialize players at the bottom of the world
        this.players.clear();
        playerData.forEach((player, index) => {
            this.players.set(player.id, {
                id: player.id,
                name: player.name,
                x: 100 + (index * 100),
                y: this.worldHeight - 150, // Start near bottom
                width: 40,
                height: 40,
                velocityX: 0,
                velocityY: 0,
                isJumping: true,
                color: this.getPlayerColor(index),
                direction: 1, // 1 for right, -1 for left
                highestY: this.worldHeight - 150 // Track highest point reached
            });
        });

        document.getElementById('player-name-display').textContent = `Player: ${this.playerName}`;

        // Set camera to bottom
        this.cameraY = this.worldHeight - this.canvas.height;

        this.gameLoop();
    }

    getPlayerColor(index) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
        return colors[index % colors.length];
    }

    gameLoop() {
        if (!this.gameStarted) return;

        this.updateMyPlayer();
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }

    updateMyPlayer() {
        if (!this.myPlayerId || !this.players.has(this.myPlayerId)) return;

        const player = this.players.get(this.myPlayerId);

        // Don't move if game is won
        if (this.winner) return;

        // Horizontal movement
        if (this.keys['arrowleft'] || this.keys['a']) {
            player.velocityX = -this.moveSpeed;
            player.direction = -1;
        } else if (this.keys['arrowright'] || this.keys['d']) {
            player.velocityX = this.moveSpeed;
            player.direction = 1;
        } else {
            player.velocityX = 0;
        }

        // Jumping
        if ((this.keys['arrowup'] || this.keys['w'] || this.keys[' ']) && !player.isJumping) {
            player.velocityY = -this.jumpPower;
            player.isJumping = true;
        }

        // Apply gravity
        player.velocityY += this.gravity;

        // Update position
        player.x += player.velocityX;
        player.y += player.velocityY;

        // Check platform collisions
        this.checkPlatformCollisions(player);

        // Keep player in horizontal bounds
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > this.canvas.width) {
            player.x = this.canvas.width - player.width;
        }

        // Track highest point
        if (player.y < player.highestY) {
            player.highestY = player.y;
        }

        // Check if player reached the finish
        if (player.y <= this.finishLineY && !this.winner) {
            this.winner = player.name;
            this.socket.emit('playerWon', {
                roomCode: this.roomCode,
                playerName: player.name
            });
        }

        // Update camera to follow player
        const targetCameraY = player.y - this.canvas.height / 2;
        const minCameraY = 0;
        const maxCameraY = this.worldHeight - this.canvas.height;
        this.cameraY = Math.max(minCameraY, Math.min(maxCameraY, targetCameraY));

        // Emit position to server
        this.socket.emit('playerMove', {
            roomCode: this.roomCode,
            x: player.x,
            y: player.y,
            velocityX: player.velocityX,
            velocityY: player.velocityY,
            direction: player.direction,
            highestY: player.highestY
        });
    }

    checkPlatformCollisions(player) {
        for (const platform of this.platforms) {
            if (player.x < platform.x + platform.width &&
                player.x + player.width > platform.x &&
                player.y < platform.y + platform.height &&
                player.y + player.height > platform.y) {

                // Collision detected
                const overlapLeft = (player.x + player.width) - platform.x;
                const overlapRight = (platform.x + platform.width) - player.x;
                const overlapTop = (player.y + player.height) - platform.y;
                const overlapBottom = (platform.y + platform.height) - player.y;

                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                if (minOverlap === overlapTop && player.velocityY > 0) {
                    // Landing on top
                    player.y = platform.y - player.height;
                    player.velocityY = 0;
                    player.isJumping = false;
                } else if (minOverlap === overlapBottom && player.velocityY < 0) {
                    // Hitting bottom
                    player.y = platform.y + platform.height;
                    player.velocityY = 0;
                } else if (minOverlap === overlapLeft) {
                    // Hitting from left
                    player.x = platform.x - player.width;
                } else if (minOverlap === overlapRight) {
                    // Hitting from right
                    player.x = platform.x + platform.width;
                }
            }
        }
    }

    render() {
        // Clear canvas with sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#B0E0E6');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(0, -this.cameraY);

        // Draw finish line flag
        this.drawFinishFlag();

        // Draw platforms
        for (const platform of this.platforms) {
            this.ctx.fillStyle = platform.color;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            // Add platform border
            if (platform.type === 'finish') {
                this.ctx.strokeStyle = '#FFA500';
                this.ctx.lineWidth = 3;
            } else {
                this.ctx.strokeStyle = '#4A2511';
                this.ctx.lineWidth = 2;
            }
            this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        }

        // Draw all players
        this.players.forEach(player => {
            this.drawPlayer(player);
        });

        // Restore context
        this.ctx.restore();

        // Draw UI elements (not affected by camera)
        this.drawHeightIndicator();
        this.updateScoreboard();

        // Draw winner message
        if (this.winner) {
            this.drawWinnerMessage();
        }
    }

    drawFinishFlag() {
        const flagX = 500;
        const flagY = this.finishLineY - 100;

        // Flag pole
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(flagX, flagY, 5, 100);

        // Flag
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.moveTo(flagX + 5, flagY);
        this.ctx.lineTo(flagX + 55, flagY + 15);
        this.ctx.lineTo(flagX + 5, flagY + 30);
        this.ctx.closePath();
        this.ctx.fill();

        // Flag text
        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('FINISH', flagX + 10, flagY + 20);
    }

    drawHeightIndicator() {
        if (!this.myPlayerId || !this.players.has(this.myPlayerId)) return;

        const player = this.players.get(this.myPlayerId);
        const heightClimbed = Math.max(0, this.worldHeight - player.highestY);
        const totalHeight = this.worldHeight - this.finishLineY;
        const percentage = ((heightClimbed / totalHeight) * 100).toFixed(1);

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 60);

        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(`Height: ${Math.floor(heightClimbed)}m`, 20, 35);
        this.ctx.fillText(`Progress: ${percentage}%`, 20, 55);
    }

    drawWinnerMessage() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, this.canvas.height / 2 - 50, this.canvas.width, 100);

        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${this.winner} WINS!`, this.canvas.width / 2, this.canvas.height / 2 + 10);

        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('Reached the top!', this.canvas.width / 2, this.canvas.height / 2 + 40);
        this.ctx.textAlign = 'left';
    }

    drawPlayer(player) {
        const x = player.x;
        const y = player.y;
        const dir = player.direction;

        // Dog body (main torso)
        this.ctx.fillStyle = player.color;
        this.ctx.fillRect(x, y + 12, player.width, player.height - 12);

        // Dog head
        const headX = dir === 1 ? x + player.width - 18 : x + 3;
        this.ctx.fillRect(headX, y, 15, 15);

        // Snout/muzzle
        const snoutX = dir === 1 ? headX + 12 : headX - 8;
        this.ctx.fillRect(snoutX, y + 7, 8, 6);

        // Ears (floppy dog ears)
        this.ctx.fillStyle = this.darkenColor(player.color, 20);
        const earX = dir === 1 ? headX : headX + 10;
        this.ctx.fillRect(earX, y - 2, 5, 10); // Ear

        // Eyes (big puppy eyes)
        this.ctx.fillStyle = 'white';
        const eyeX = dir === 1 ? headX + 4 : headX + 6;
        this.ctx.beginPath();
        this.ctx.arc(eyeX, y + 6, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Pupils
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(eyeX + (dir === 1 ? 1 : -1), y + 6, 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Nose (black dot)
        const noseX = dir === 1 ? snoutX + 6 : snoutX + 2;
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(noseX, y + 10, 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Mouth (little smile)
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(noseX, y + 11, 3, 0.2, Math.PI - 0.2);
        this.ctx.stroke();

        // Legs (4 legs)
        this.ctx.fillStyle = player.color;
        this.ctx.fillRect(x + 5, y + player.height - 8, 5, 10); // Front left
        this.ctx.fillRect(x + player.width - 10, y + player.height - 8, 5, 10); // Front right
        this.ctx.fillRect(x + 12, y + player.height - 6, 5, 8); // Back left
        this.ctx.fillRect(x + player.width - 17, y + player.height - 6, 5, 8); // Back right

        // Paws (darker color)
        this.ctx.fillStyle = this.darkenColor(player.color, 40);
        this.ctx.fillRect(x + 5, y + player.height + 1, 5, 2); // Front left paw
        this.ctx.fillRect(x + player.width - 10, y + player.height + 1, 5, 2); // Front right paw

        // Tail (curved and wagging)
        const tailX = dir === 1 ? x - 2 : x + player.width - 3;
        const tailWag = Math.sin(Date.now() / 200) * 3; // Wagging animation
        this.ctx.fillStyle = player.color;
        this.ctx.beginPath();
        this.ctx.moveTo(tailX, y + 15);
        this.ctx.quadraticCurveTo(
            tailX + (dir === 1 ? -8 : 8),
            y + 10 + tailWag,
            tailX + (dir === 1 ? -6 : 6),
            y + 5
        );
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = player.color;
        this.ctx.stroke();

        // Tail tip
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(tailX + (dir === 1 ? -6 : 6), y + 5, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Player name
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 3;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeText(player.name, x + player.width / 2, y - 8);
        this.ctx.fillText(player.name, x + player.width / 2, y - 8);

        // Highlight my player with golden glow
        if (player.id === this.myPlayerId) {
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeRect(x - 4, y - 4, player.width + 8, player.height + 8);
            this.ctx.setLineDash([]);
        }
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
    }

    updateScoreboard() {
        const container = document.getElementById('player-scores');
        container.innerHTML = '';

        // Sort players by highest point (lowest Y value)
        const sortedPlayers = Array.from(this.players.values()).sort((a, b) => a.highestY - b.highestY);

        sortedPlayers.forEach((player, index) => {
            const heightClimbed = Math.max(0, this.worldHeight - player.highestY);
            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'score-item';
            scoreDiv.innerHTML = `
                <span style="color: ${player.color}; font-size: 20px;">⬤</span>
                <span style="flex: 1;">${player.name}</span>
                <span style="color: #FFD700;">${Math.floor(heightClimbed)}m</span>
            `;
            if (index === 0 && !this.winner) {
                scoreDiv.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
            }
            container.appendChild(scoreDiv);
        });
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new PuppyControl();
});
