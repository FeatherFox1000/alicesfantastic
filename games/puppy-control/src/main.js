// Puppy Control - Multiplayer Platformer Game
import { CustomizationSystem, CUSTOMIZATION_ITEMS } from './customization.js';

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

        // Checkpoints
        this.checkpoints = [];

        // Player state
        this.players = new Map();
        this.myPlayerId = null;
        this.winner = null;

        // Lobby preview
        this.lobbyPreviewActive = false;
        this.lobbyPreviewPlayer = null;
        this.lobbyPreviewCanvas = null;
        this.lobbyPreviewCtx = null;

        // Mini-game state
        this.minigameActive = false;
        this.minigameCanvas = null;
        this.minigameCtx = null;
        this.minigameStars = [];
        this.minigameScore = 0;
        this.minigameCoins = 0;
        this.minigameLastSpawn = 0;

        // Physics
        this.gravity = 0.6;
        this.jumpPower = 15;
        this.moveSpeed = 5;

        // Input
        this.keys = {};

        // Generate platforms going up
        this.platforms = this.generatePlatforms();

        // Generate checkpoints
        this.checkpoints = this.generateCheckpoints();

        // Initialize customization system
        this.customization = new CustomizationSystem(this);

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
        const maxHorizontalDistance = 200; // Max horizontal distance between platforms
        let lastPlatformCenterX = 600; // Start from middle of ground

        while (currentY > this.finishLineY) {
            // Random platform configuration
            const platformWidth = 100 + Math.random() * 150;

            // Position platform within jumping distance of last platform
            const minX = Math.max(0, lastPlatformCenterX - maxHorizontalDistance);
            const maxX = Math.min(this.canvas.width - platformWidth, lastPlatformCenterX + maxHorizontalDistance);
            const platformX = minX + Math.random() * (maxX - minX);

            const newPlatform = {
                x: platformX,
                y: currentY,
                width: platformWidth,
                height: 20,
                color: '#654321',
                type: 'normal'
            };
            platforms.push(newPlatform);

            // Update last platform center for next iteration
            lastPlatformCenterX = platformX + platformWidth / 2;

            // Sometimes add extra platforms for variety (within reach)
            if (Math.random() > 0.6) {
                const extraWidth = 120;
                const extraMinX = Math.max(0, lastPlatformCenterX - maxHorizontalDistance);
                const extraMaxX = Math.min(this.canvas.width - extraWidth, lastPlatformCenterX + maxHorizontalDistance);
                const extraX = extraMinX + Math.random() * (extraMaxX - extraMinX);

                platforms.push({
                    x: extraX,
                    y: currentY - 60,
                    width: extraWidth,
                    height: 20,
                    color: '#654321',
                    type: 'normal'
                });
            }

            currentY -= platformGap;
        }

        // Finish platform at the top (ensure it's reachable)
        const finishWidth = 400;
        const finishMinX = Math.max(0, lastPlatformCenterX - maxHorizontalDistance);
        const finishMaxX = Math.min(this.canvas.width - finishWidth, lastPlatformCenterX + maxHorizontalDistance);
        const finishX = finishMinX + (finishMaxX - finishMinX) / 2; // Center it within range

        platforms.push({
            x: finishX,
            y: this.finishLineY - 30,
            width: finishWidth,
            height: 30,
            color: '#FFD700',
            type: 'finish'
        });

        return platforms;
    }

    generateCheckpoints() {
        const checkpoints = [];
        const checkpointInterval = 600; // Every 600px of height

        // Create checkpoints every 600px going up
        let currentY = this.worldHeight - checkpointInterval;

        while (currentY > this.finishLineY + 200) {
            checkpoints.push({
                x: 0,
                y: currentY,
                width: this.canvas.width, // Full-width so always reachable
                height: 80,
                activated: false,
                id: checkpoints.length
            });

            currentY -= checkpointInterval;
        }

        return checkpoints;
    }

    connectToServer() {
        // Connect to Socket.io server
        const serverUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3002'
            : 'https://space-pups-game.fly.dev';
        this.socket = io(serverUrl);

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

        // Fullscreen button
        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Leave game button
        document.getElementById('leave-game-btn').addEventListener('click', () => {
            this.leaveRoom();
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

        // Start lobby preview
        this.startLobbyPreview();

        // Start mini-game
        this.startMinigame();
    }

    startLobbyPreview() {
        this.lobbyPreviewCanvas = document.getElementById('lobby-preview-canvas');
        this.lobbyPreviewCtx = this.lobbyPreviewCanvas.getContext('2d');
        this.lobbyPreviewActive = true;

        // Get player customization
        const customization = this.customization.getPlayerCustomization();
        const colorItem = CUSTOMIZATION_ITEMS.colors.find(c => c.id === customization.color);

        // Create preview player
        this.lobbyPreviewPlayer = {
            x: 50,
            y: 150,
            width: 40,
            height: 40,
            velocityX: 0,
            velocityY: 0,
            isJumping: false,
            color: colorItem ? colorItem.color : '#FF6B6B',
            direction: 1,
            customization: customization,
            trail: []
        };

        // Start animation loop
        this.lobbyPreviewLoop();
    }

    stopLobbyPreview() {
        this.lobbyPreviewActive = false;
    }

    lobbyPreviewLoop() {
        if (!this.lobbyPreviewActive) return;

        const player = this.lobbyPreviewPlayer;

        // Handle movement
        if (this.keys['arrowleft'] || this.keys['a']) {
            player.velocityX = -5;
            player.direction = -1;
        } else if (this.keys['arrowright'] || this.keys['d']) {
            player.velocityX = 5;
            player.direction = 1;
        } else {
            player.velocityX = 0;
        }

        // Handle jumping
        if ((this.keys['arrowup'] || this.keys['w'] || this.keys[' ']) && !player.isJumping) {
            player.velocityY = -12;
            player.isJumping = true;
        }

        // Apply gravity
        player.velocityY += 0.5;

        // Update position
        player.x += player.velocityX;
        player.y += player.velocityY;

        // Ground collision
        if (player.y >= 150) {
            player.y = 150;
            player.velocityY = 0;
            player.isJumping = false;
        }

        // Keep in bounds
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > 300) player.x = 300 - player.width;

        // Update trail
        if (Math.abs(player.velocityX) > 0.1 || Math.abs(player.velocityY) > 0.1) {
            player.trail.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                time: Date.now()
            });
            if (player.trail.length > 15) {
                player.trail.shift();
            }
        }

        // Render
        this.renderLobbyPreview();

        requestAnimationFrame(() => this.lobbyPreviewLoop());
    }

    renderLobbyPreview() {
        // Clear canvas
        this.lobbyPreviewCtx.fillStyle = '#87CEEB';
        this.lobbyPreviewCtx.fillRect(0, 0, 300, 200);

        // Draw ground
        this.lobbyPreviewCtx.fillStyle = '#2C5F2D';
        this.lobbyPreviewCtx.fillRect(0, 190, 300, 10);

        // Draw trail
        this.drawTrailSmall(this.lobbyPreviewPlayer, this.lobbyPreviewCtx);

        // Draw player
        this.drawPlayerSmall(this.lobbyPreviewPlayer, this.lobbyPreviewCtx);
    }

    drawTrailSmall(player, ctx) {
        if (!player.customization || !player.customization.trail || player.customization.trail === 'none') {
            return;
        }

        if (player.trail.length < 2) return;

        const trailType = player.customization.trail;
        const now = Date.now();

        // Simplified trail rendering for lobby
        for (let i = 0; i < player.trail.length; i++) {
            const point = player.trail[i];
            const age = now - point.time;
            const alpha = Math.max(0, 1 - age / 1000);
            const size = 4 + (player.trail.length - i) * 0.3;

            if (trailType === 'smoke') {
                ctx.fillStyle = `rgba(150, 150, 150, ${alpha * 0.5})`;
            } else if (trailType === 'fire') {
                ctx.fillStyle = `rgba(255, 150, 0, ${alpha * 0.7})`;
            } else if (trailType === 'rainbow') {
                const hue = (i / player.trail.length) * 360;
                ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${alpha * 0.6})`;
            } else if (trailType === 'stars' || trailType === 'hearts') {
                if (i % 2 === 0) {
                    ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
                    ctx.font = '10px Arial';
                    ctx.fillText(trailType === 'stars' ? '⭐' : '💖', point.x - 5, point.y + 5);
                }
                continue;
            } else if (trailType === 'cosmic') {
                ctx.fillStyle = `rgba(147, 51, 234, ${alpha * 0.8})`;
            } else {
                ctx.fillStyle = `rgba(200, 200, 200, ${alpha * 0.5})`;
            }

            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawPlayerSmall(player, ctx) {
        // Reuse the full drawPlayer by temporarily swapping ctx
        const savedCtx = this.ctx;
        this.ctx = ctx;
        this.drawPlayer(player);
        this.ctx = savedCtx;
    }

    // Mini-game methods
    startMinigame() {
        this.minigameCanvas = document.getElementById('minigame-canvas');
        this.minigameCtx = this.minigameCanvas.getContext('2d');
        this.minigameActive = true;
        this.minigameStars = [];
        this.minigameScore = 0;
        this.minigameCoins = 0;
        this.minigameLastSpawn = Date.now();

        // Update display
        document.getElementById('minigame-score').textContent = '0';
        document.getElementById('minigame-coins').textContent = '0';

        // Add click listener
        this.minigameCanvas.addEventListener('click', (e) => {
            const rect = this.minigameCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.checkStarClick(x, y);
        });

        // Start game loop
        this.minigameLoop();
    }

    stopMinigame() {
        this.minigameActive = false;

        // Award coins earned
        if (this.minigameCoins > 0) {
            this.customization.coins += this.minigameCoins;
            this.customization.saveCoins();
        }
    }

    minigameLoop() {
        if (!this.minigameActive) return;

        const now = Date.now();

        // Spawn new stars every 1 second
        if (now - this.minigameLastSpawn > 1000) {
            this.spawnStar();
            this.minigameLastSpawn = now;
        }

        // Update stars (make them fall)
        for (let i = this.minigameStars.length - 1; i >= 0; i--) {
            const star = this.minigameStars[i];
            star.y += star.speed;

            // Remove stars that fall off screen
            if (star.y > 250) {
                this.minigameStars.splice(i, 1);
            }
        }

        // Render
        this.renderMinigame();

        requestAnimationFrame(() => this.minigameLoop());
    }

    spawnStar() {
        const star = {
            x: Math.random() * 270 + 15, // Keep stars within canvas bounds
            y: -20,
            size: 20 + Math.random() * 10,
            speed: 1 + Math.random() * 2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        };
        this.minigameStars.push(star);
    }

    checkStarClick(x, y) {
        for (let i = this.minigameStars.length - 1; i >= 0; i--) {
            const star = this.minigameStars[i];
            const distance = Math.sqrt((x - star.x) ** 2 + (y - star.y) ** 2);

            if (distance < star.size / 2) {
                // Star was clicked!
                this.minigameStars.splice(i, 1);
                this.minigameScore += 1;

                // Award coins every 5 stars
                if (this.minigameScore % 5 === 0) {
                    this.minigameCoins += 10;
                    document.getElementById('minigame-coins').textContent = this.minigameCoins;
                }

                document.getElementById('minigame-score').textContent = this.minigameScore;
                return;
            }
        }
    }

    renderMinigame() {
        // Clear canvas with gradient background
        const gradient = this.minigameCtx.createLinearGradient(0, 0, 0, 250);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.minigameCtx.fillStyle = gradient;
        this.minigameCtx.fillRect(0, 0, 300, 250);

        // Draw stars
        this.minigameStars.forEach(star => {
            this.minigameCtx.save();
            this.minigameCtx.translate(star.x, star.y);
            this.minigameCtx.rotate(star.rotation);

            // Draw star glow
            const starGradient = this.minigameCtx.createRadialGradient(0, 0, 0, 0, 0, star.size / 2);
            starGradient.addColorStop(0, '#FFD700');
            starGradient.addColorStop(0.5, '#FFA500');
            starGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            this.minigameCtx.fillStyle = starGradient;
            this.minigameCtx.beginPath();
            this.minigameCtx.arc(0, 0, star.size / 2, 0, Math.PI * 2);
            this.minigameCtx.fill();

            // Draw star emoji
            this.minigameCtx.font = `${star.size}px Arial`;
            this.minigameCtx.fillText('⭐', -star.size / 2, star.size / 2);

            // Update rotation
            star.rotation += star.rotationSpeed;

            this.minigameCtx.restore();
        });
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
        this.stopLobbyPreview();
        this.stopMinigame();
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

        // Stop lobby preview and mini-game
        this.stopLobbyPreview();
        this.stopMinigame();

        // Reset checkpoint activation states
        this.checkpoints.forEach(checkpoint => {
            checkpoint.activated = false;
        });

        // Get player customization
        const myCustomization = this.customization.getPlayerCustomization();

        // Initialize players at the bottom of the world
        this.players.clear();
        playerData.forEach((player, index) => {
            // Use customization for local player, default colors for others
            const isMe = player.id === this.myPlayerId;
            let playerColor = this.getPlayerColor(index);
            let customization = null;

            if (isMe) {
                // Get custom color from customization
                const colorItem = CUSTOMIZATION_ITEMS.colors.find(c => c.id === myCustomization.color);
                if (colorItem) {
                    playerColor = colorItem.color;
                }
                customization = myCustomization;
            }

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
                color: playerColor,
                direction: 1, // 1 for right, -1 for left
                highestY: this.worldHeight - 150, // Track highest point reached
                customization: customization, // Store customization data
                currentCheckpoint: null, // Track last checkpoint reached
                respawnX: 100 + (index * 100), // Respawn position
                respawnY: this.worldHeight - 150,
                trail: [] // Store trail positions
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

        // Update trail (if player is moving)
        if (Math.abs(player.velocityX) > 0.1 || Math.abs(player.velocityY) > 0.1) {
            player.trail.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                time: Date.now()
            });

            // Keep trail to max 20 points
            if (player.trail.length > 20) {
                player.trail.shift();
            }
        }

        // Check checkpoint collisions
        this.checkCheckpointCollisions(player);

        // Check if player has fallen off the world (respawn at checkpoint)
        if (player.y > this.worldHeight + 100) {
            player.x = player.respawnX;
            player.y = player.respawnY;
            player.velocityX = 0;
            player.velocityY = 0;
            player.isJumping = true;
        }

        // Check if player reached the finish
        if (player.y <= this.finishLineY && !this.winner) {
            this.winner = player.name;
            this.socket.emit('playerWon', {
                roomCode: this.roomCode,
                playerName: player.name
            });

            // Award coins for winning
            this.customization.coins += 100;
            this.customization.saveCoins();
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

    checkCheckpointCollisions(player) {
        for (const checkpoint of this.checkpoints) {
            // Check if player is touching checkpoint
            if (player.x < checkpoint.x + checkpoint.width &&
                player.x + player.width > checkpoint.x &&
                player.y < checkpoint.y + checkpoint.height &&
                player.y + player.height > checkpoint.y) {

                // Activate checkpoint if not already activated for this player
                if (player.currentCheckpoint !== checkpoint.id) {
                    player.currentCheckpoint = checkpoint.id;
                    player.respawnX = checkpoint.x + checkpoint.width / 2 - player.width / 2;
                    player.respawnY = checkpoint.y - player.height - 10;
                    checkpoint.activated = true;

                    // Visual feedback - could add sound here too
                    console.log(`Checkpoint ${checkpoint.id} reached!`);
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

        // Draw checkpoints
        this.drawCheckpoints();

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
            // Draw trail first (behind player)
            this.drawTrail(player);
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

    drawCheckpoints() {
        this.checkpoints.forEach(checkpoint => {
            // Draw checkpoint platform/banner
            if (checkpoint.activated) {
                // Activated checkpoint (green)
                this.ctx.fillStyle = '#4CAF50';
                this.ctx.strokeStyle = '#2E7D32';
            } else {
                // Inactive checkpoint (gray)
                this.ctx.fillStyle = '#9E9E9E';
                this.ctx.strokeStyle = '#616161';
            }

            // Draw checkpoint rectangle
            this.ctx.fillRect(checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height);
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height);

            // Draw flag poles on each side
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(checkpoint.x, checkpoint.y, 5, checkpoint.height);
            this.ctx.fillRect(checkpoint.x + checkpoint.width - 5, checkpoint.y, 5, checkpoint.height);

            // Draw checkpoint text
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CHECKPOINT', checkpoint.x + checkpoint.width / 2, checkpoint.y + 35);

            // Draw checkpoint number
            this.ctx.font = 'bold 18px Arial';
            this.ctx.fillText(`#${checkpoint.id + 1}`, checkpoint.x + checkpoint.width / 2, checkpoint.y + 60);
            this.ctx.textAlign = 'left';

            // Draw checkpoint icon/emoji
            this.ctx.font = '30px Arial';
            this.ctx.fillText('🏁', checkpoint.x + 10, checkpoint.y + 50);
            this.ctx.fillText('🏁', checkpoint.x + checkpoint.width - 40, checkpoint.y + 50);
        });
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

    drawTrail(player) {
        if (!player.customization || !player.customization.trail || player.customization.trail === 'none') {
            return;
        }

        if (player.trail.length < 2) return;

        const trailType = player.customization.trail;
        const now = Date.now();

        // Draw trail based on type
        if (trailType === 'smoke') {
            // Smoke puffs that rise and expand
            for (let i = 0; i < player.trail.length; i++) {
                const point = player.trail[i];
                const age = now - point.time;
                const life = age / 1200;
                const alpha = Math.max(0, 1 - life) * 0.5;
                const size = 6 + life * 10 + (player.trail.length - i) * 0.3;
                const rise = life * 8;

                // Multiple overlapping circles for puffy look
                this.ctx.fillStyle = `rgba(160, 160, 160, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(point.x - 2, point.y - rise, size * 0.8, 0, Math.PI * 2);
                this.ctx.arc(point.x + 3, point.y - rise - 2, size * 0.7, 0, Math.PI * 2);
                this.ctx.arc(point.x, point.y - rise + 1, size * 0.9, 0, Math.PI * 2);
                this.ctx.fill();
            }
        } else if (trailType === 'fire') {
            // Fire trail - actual flame shapes
            for (let i = 0; i < player.trail.length; i++) {
                const point = player.trail[i];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 800);
                const size = 5 + (player.trail.length - i) * 0.5;
                const flicker = Math.sin(now / 60 + i * 2) * 2;

                // Outer flame (red/orange)
                const colorIndex = i / player.trail.length;
                if (colorIndex < 0.33) {
                    this.ctx.fillStyle = `rgba(255, 220, 0, ${alpha * 0.8})`;
                } else if (colorIndex < 0.66) {
                    this.ctx.fillStyle = `rgba(255, 120, 0, ${alpha * 0.8})`;
                } else {
                    this.ctx.fillStyle = `rgba(255, 40, 0, ${alpha * 0.7})`;
                }

                // Flame shape (teardrop pointing up)
                this.ctx.beginPath();
                this.ctx.moveTo(point.x, point.y - size * 1.8 + flicker);
                this.ctx.quadraticCurveTo(point.x + size, point.y - size * 0.3, point.x + size * 0.6, point.y + size * 0.5);
                this.ctx.quadraticCurveTo(point.x, point.y + size * 0.8, point.x - size * 0.6, point.y + size * 0.5);
                this.ctx.quadraticCurveTo(point.x - size, point.y - size * 0.3, point.x, point.y - size * 1.8 + flicker);
                this.ctx.fill();

                // Inner flame (bright yellow core)
                if (colorIndex < 0.5) {
                    this.ctx.fillStyle = `rgba(255, 255, 200, ${alpha * 0.6})`;
                    this.ctx.beginPath();
                    this.ctx.moveTo(point.x, point.y - size * 0.9 + flicker);
                    this.ctx.quadraticCurveTo(point.x + size * 0.4, point.y, point.x + size * 0.2, point.y + size * 0.3);
                    this.ctx.quadraticCurveTo(point.x, point.y + size * 0.4, point.x - size * 0.2, point.y + size * 0.3);
                    this.ctx.quadraticCurveTo(point.x - size * 0.4, point.y, point.x, point.y - size * 0.9 + flicker);
                    this.ctx.fill();
                }
            }
        } else if (trailType === 'rainbow') {
            // Rainbow trail
            for (let i = 0; i < player.trail.length; i++) {
                const point = player.trail[i];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 1000);
                const size = 8 + (player.trail.length - i) * 0.4;

                const hue = (i / player.trail.length) * 360;
                this.ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${alpha * 0.6})`;
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        } else if (trailType === 'stars') {
            // Canvas-drawn star trail
            for (let i = 0; i < player.trail.length; i++) {
                if (i % 3 !== 0) continue;
                const point = player.trail[i];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 1200);
                const size = 4 + (i % 3) * 2;
                const spin = now / 500 + i;

                this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
                this.ctx.beginPath();
                for (let p = 0; p < 5; p++) {
                    const a = (p / 5) * Math.PI * 2 - Math.PI / 2 + spin;
                    const ox = point.x + Math.cos(a) * size;
                    const oy = point.y + Math.sin(a) * size;
                    const ia = a + Math.PI / 5;
                    const ix = point.x + Math.cos(ia) * (size * 0.4);
                    const iy = point.y + Math.sin(ia) * (size * 0.4);
                    if (p === 0) this.ctx.moveTo(ox, oy); else this.ctx.lineTo(ox, oy);
                    this.ctx.lineTo(ix, iy);
                }
                this.ctx.closePath();
                this.ctx.fill();
            }
        } else if (trailType === 'hearts') {
            // Canvas-drawn heart trail
            for (let i = 0; i < player.trail.length; i++) {
                if (i % 3 !== 0) continue;
                const point = player.trail[i];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 1000);
                const size = 5 + (i % 3);
                const rise = (age / 1000) * 6;

                this.ctx.fillStyle = i % 2 === 0 ? `rgba(255, 105, 180, ${alpha})` : `rgba(255, 20, 147, ${alpha})`;
                const hx = point.x, hy = point.y - rise;
                this.ctx.beginPath();
                this.ctx.moveTo(hx, hy + size * 0.3);
                this.ctx.bezierCurveTo(hx - size, hy - size * 0.5, hx - size * 1.2, hy + size * 0.4, hx, hy + size);
                this.ctx.bezierCurveTo(hx + size * 1.2, hy + size * 0.4, hx + size, hy - size * 0.5, hx, hy + size * 0.3);
                this.ctx.fill();
            }
        } else if (trailType === 'bubbles') {
            // Bubble trail
            for (let i = 0; i < player.trail.length; i++) {
                if (i % 2 !== 0) continue; // Sparse bubbles

                const point = player.trail[i];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 1500);
                const size = 4 + Math.random() * 4;

                this.ctx.strokeStyle = `rgba(173, 216, 230, ${alpha})`;
                this.ctx.fillStyle = `rgba(200, 230, 255, ${alpha * 0.3})`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            }
        } else if (trailType === 'confetti') {
            // Confetti trail
            for (let i = 0; i < player.trail.length; i++) {
                if (i % 3 !== 0) continue;

                const point = player.trail[i];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 1000);

                const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCB77', '#A855F7'];
                const color = colors[i % colors.length];

                this.ctx.fillStyle = `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
                this.ctx.save();
                this.ctx.translate(point.x, point.y);
                this.ctx.rotate((i * 45) * Math.PI / 180);
                this.ctx.fillRect(-2, -4, 4, 8);
                this.ctx.restore();
            }
        } else if (trailType === 'ice') {
            // Ice crystals / snowflakes
            for (let i = 0; i < player.trail.length; i++) {
                const point = player.trail[i];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 1200);
                const size = 4 + (player.trail.length - i) * 0.3;
                const spin = now / 800 + i;

                // Icy glow behind
                this.ctx.fillStyle = `rgba(173, 216, 255, ${alpha * 0.4})`;
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, size + 2, 0, Math.PI * 2);
                this.ctx.fill();

                // Snowflake: 6 lines radiating out
                this.ctx.strokeStyle = `rgba(220, 240, 255, ${alpha})`;
                this.ctx.lineWidth = 1.5;
                for (let a = 0; a < 6; a++) {
                    const angle = (a / 6) * Math.PI * 2 + spin;
                    this.ctx.beginPath();
                    this.ctx.moveTo(point.x, point.y);
                    const ex = point.x + Math.cos(angle) * size;
                    const ey = point.y + Math.sin(angle) * size;
                    this.ctx.lineTo(ex, ey);
                    this.ctx.stroke();
                    // Small branches
                    if (size > 4) {
                        const mid = 0.6;
                        const mx = point.x + Math.cos(angle) * size * mid;
                        const my = point.y + Math.sin(angle) * size * mid;
                        const ba = angle + 0.5;
                        this.ctx.beginPath();
                        this.ctx.moveTo(mx, my);
                        this.ctx.lineTo(mx + Math.cos(ba) * size * 0.3, my + Math.sin(ba) * size * 0.3);
                        this.ctx.stroke();
                    }
                }
            }
        } else if (trailType === 'leaves') {
            // Canvas-drawn falling leaves
            for (let i = 0; i < player.trail.length; i++) {
                if (i % 3 !== 0) continue;
                const point = player.trail[i];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 1500);
                const drift = Math.sin(now / 300 + i) * 4;
                const fall = (age / 1500) * 8;
                const spin = now / 400 + i * 1.2;

                this.ctx.fillStyle = i % 2 === 0 ? `rgba(34, 180, 34, ${alpha})` : `rgba(60, 140, 30, ${alpha})`;
                this.ctx.save();
                this.ctx.translate(point.x + drift, point.y + fall);
                this.ctx.rotate(spin);
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, 3, 7, 0, 0, Math.PI * 2);
                this.ctx.fill();
                // Leaf vein
                this.ctx.strokeStyle = `rgba(20, 100, 20, ${alpha * 0.5})`;
                this.ctx.lineWidth = 0.5;
                this.ctx.beginPath();
                this.ctx.moveTo(0, -7);
                this.ctx.lineTo(0, 7);
                this.ctx.stroke();
                this.ctx.restore();
            }
        } else if (trailType === 'electric') {
            // Electric/lightning trail
            for (let i = 0; i < player.trail.length - 1; i++) {
                const point = player.trail[i];
                const nextPoint = player.trail[i + 1];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 600);

                this.ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(point.x, point.y);
                this.ctx.lineTo(nextPoint.x + (Math.random() - 0.5) * 5, nextPoint.y);
                this.ctx.stroke();

                // Add glow
                this.ctx.strokeStyle = `rgba(173, 216, 230, ${alpha * 0.5})`;
                this.ctx.lineWidth = 4;
                this.ctx.stroke();
            }
        } else if (trailType === 'sakura') {
            // Canvas-drawn cherry blossom petals
            for (let i = 0; i < player.trail.length; i++) {
                if (i % 2 !== 0) continue;
                const point = player.trail[i];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 1800);
                const drift = Math.sin(now / 400 + i * 0.7) * 5;
                const fall = (age / 1800) * 10;
                const spin = now / 600 + i;

                this.ctx.save();
                this.ctx.translate(point.x + drift, point.y + fall);
                this.ctx.rotate(spin);
                // Petal shape - two overlapping ellipses
                this.ctx.fillStyle = i % 2 === 0 ? `rgba(255, 183, 197, ${alpha})` : `rgba(255, 140, 170, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, 2, 5, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, 5, 2, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        } else if (trailType === 'neon') {
            // Neon trail
            for (let i = 0; i < player.trail.length; i++) {
                const point = player.trail[i];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 800);
                const size = 8 + (player.trail.length - i) * 0.4;

                // Neon glow effect
                const gradient = this.ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, size);
                gradient.addColorStop(0, `rgba(0, 255, 255, ${alpha})`);
                gradient.addColorStop(0.5, `rgba(255, 0, 255, ${alpha * 0.6})`);
                gradient.addColorStop(1, `rgba(0, 255, 255, ${alpha * 0.2})`);

                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        } else if (trailType === 'aurora') {
            // Aurora borealis trail
            for (let i = 0; i < player.trail.length; i++) {
                const point = player.trail[i];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 2000);
                const size = 12 + (player.trail.length - i) * 0.6;

                // Wavy aurora effect
                const gradient = this.ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, size);
                const hue = (i * 20 + Date.now() / 50) % 360;
                gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, ${alpha * 0.8})`);
                gradient.addColorStop(0.5, `hsla(${hue + 60}, 100%, 60%, ${alpha * 0.5})`);
                gradient.addColorStop(1, `hsla(${hue + 120}, 100%, 50%, ${alpha * 0.2})`);

                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        } else if (trailType === 'cosmic') {
            // Cosmic/galaxy trail
            for (let i = 0; i < player.trail.length; i++) {
                const point = player.trail[i];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 1500);
                const size = 10 + (player.trail.length - i) * 0.7;

                // Purple/blue cosmic glow
                const gradient = this.ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, size);
                gradient.addColorStop(0, `rgba(147, 51, 234, ${alpha * 0.8})`);
                gradient.addColorStop(0.5, `rgba(59, 130, 246, ${alpha * 0.5})`);
                gradient.addColorStop(1, `rgba(30, 58, 138, ${alpha * 0.2})`);

                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                this.ctx.fill();

                // Add sparkle effect
                if (i % 5 === 0) {
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
                    this.ctx.fillRect(point.x - 1, point.y - 1, 2, 2);
                }
            }
        }
    }

    drawPlayer(player) {
        const ctx = this.ctx;
        const x = player.x;
        const y = player.y;
        const w = player.width;   // 40
        const h = player.height;  // 40
        const dir = player.direction;
        const color = player.color;

        // Handle rainbow color
        let bodyColor = color;
        let isRainbow = false;
        let darker, darkPaw;
        if (color === 'rainbow') {
            isRainbow = true;
            const grad = ctx.createLinearGradient(x, y, x + w, y + h);
            grad.addColorStop(0, '#FF0000');
            grad.addColorStop(0.17, '#FF7F00');
            grad.addColorStop(0.33, '#FFFF00');
            grad.addColorStop(0.5, '#00FF00');
            grad.addColorStop(0.67, '#0000FF');
            grad.addColorStop(0.83, '#8B00FF');
            grad.addColorStop(1, '#FF0000');
            bodyColor = grad;
            darker = '#8B00FF';
            darkPaw = '#4B0082';
        } else {
            darker = this.darkenColor(color, 20);
            darkPaw = this.darkenColor(color, 40);
        }

        // Center of body
        const cx = x + w / 2;
        const cy = y + h / 2 + 2;

        // Tail (behind body) - direction aware
        const tailDir = dir === 1 ? -1 : 1;
        const tailBaseX = cx + tailDir * 18;
        ctx.strokeStyle = typeof bodyColor === 'string' ? bodyColor : color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        const tailWag = Math.sin(Date.now() / 200) * 2;
        ctx.beginPath();
        ctx.moveTo(tailBaseX, cy);
        ctx.quadraticCurveTo(tailBaseX + tailDir * 8, cy - 6 + tailWag, tailBaseX + tailDir * 6, cy - 14);
        ctx.stroke();
        ctx.lineCap = 'butt';
        // Tail tip
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(tailBaseX + tailDir * 6, cy - 15, 3, 0, Math.PI * 2);
        ctx.fill();

        // Body (rounded rectangle)
        ctx.fillStyle = bodyColor;
        const bx = cx - 18, by = cy - 6, bw = 36, bh = 22;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 5);
        ctx.fill();

        // Legs - animated based on state
        const isMoving = Math.abs(player.velocityX || 0) > 0.5;
        const isJumping = player.isJumping || (player.velocityY && Math.abs(player.velocityY) > 1);
        const runCycle = Date.now() / 80; // Speed of leg cycle

        if (isJumping) {
            // Jumping: front legs forward, back legs back (stretched out)
            const goingUp = (player.velocityY || 0) < 0;
            if (goingUp) {
                // Going up - legs tucked under body
                ctx.fillStyle = bodyColor;
                ctx.save();
                ctx.translate(cx - 11, cy + 14);
                ctx.rotate(-0.4);
                ctx.fillRect(0, 0, 6, 8);
                ctx.restore();
                ctx.save();
                ctx.translate(cx + 9, cy + 14);
                ctx.rotate(0.4);
                ctx.fillRect(0, 0, 6, 8);
                ctx.restore();
                // Back legs tucked
                ctx.fillStyle = darker;
                ctx.save();
                ctx.translate(cx - 6, cy + 12);
                ctx.rotate(-0.3);
                ctx.fillRect(0, 0, 5, 7);
                ctx.restore();
                ctx.save();
                ctx.translate(cx + 5, cy + 12);
                ctx.rotate(0.3);
                ctx.fillRect(0, 0, 5, 7);
                ctx.restore();
                // Paws
                ctx.fillStyle = darkPaw;
                ctx.beginPath();
                ctx.roundRect(cx - 16, cy + 20, 8, 3, 2);
                ctx.roundRect(cx + 10, cy + 20, 8, 3, 2);
                ctx.fill();
            } else {
                // Falling - legs dangling down and slightly apart
                ctx.fillStyle = bodyColor;
                ctx.fillRect(cx - 14, cy + 14, 6, 12);
                ctx.fillRect(cx + 8, cy + 14, 6, 12);
                ctx.fillStyle = darker;
                ctx.fillRect(cx - 8, cy + 13, 5, 11);
                ctx.fillRect(cx + 3, cy + 13, 5, 11);
                // Paws
                ctx.fillStyle = darkPaw;
                ctx.beginPath();
                ctx.roundRect(cx - 15, cy + 25, 8, 3, 2);
                ctx.roundRect(cx + 7, cy + 25, 8, 3, 2);
                ctx.fill();
            }
        } else if (isMoving) {
            // Running animation - legs alternate with sine wave
            const legAngle1 = Math.sin(runCycle) * 0.6;
            const legAngle2 = Math.sin(runCycle + Math.PI) * 0.6;
            const legAngle3 = Math.sin(runCycle + Math.PI * 0.5) * 0.5;
            const legAngle4 = Math.sin(runCycle + Math.PI * 1.5) * 0.5;

            // Front legs
            ctx.fillStyle = bodyColor;
            ctx.save();
            ctx.translate(cx - 10, cy + 14);
            ctx.rotate(legAngle1);
            ctx.fillRect(-3, 0, 6, 10);
            // Paw
            ctx.fillStyle = darkPaw;
            ctx.beginPath();
            ctx.roundRect(-4, 9, 8, 3, 2);
            ctx.fill();
            ctx.restore();

            ctx.fillStyle = bodyColor;
            ctx.save();
            ctx.translate(cx + 10, cy + 14);
            ctx.rotate(legAngle2);
            ctx.fillRect(-3, 0, 6, 10);
            ctx.fillStyle = darkPaw;
            ctx.beginPath();
            ctx.roundRect(-4, 9, 8, 3, 2);
            ctx.fill();
            ctx.restore();

            // Back legs
            ctx.fillStyle = darker;
            ctx.save();
            ctx.translate(cx - 5, cy + 12);
            ctx.rotate(legAngle3);
            ctx.fillRect(-2.5, 0, 5, 9);
            ctx.restore();

            ctx.fillStyle = darker;
            ctx.save();
            ctx.translate(cx + 5, cy + 12);
            ctx.rotate(legAngle4);
            ctx.fillRect(-2.5, 0, 5, 9);
            ctx.restore();
        } else {
            // Standing still - static legs
            ctx.fillStyle = bodyColor;
            ctx.fillRect(cx - 13, cy + 14, 6, 10);
            ctx.fillRect(cx + 7, cy + 14, 6, 10);
            // Back legs
            ctx.fillStyle = darker;
            ctx.fillRect(cx - 8, cy + 12, 5, 9);
            ctx.fillRect(cx + 3, cy + 12, 5, 9);
            // Paws
            ctx.fillStyle = darkPaw;
            ctx.beginPath();
            ctx.roundRect(cx - 14, cy + 23, 8, 3, 2);
            ctx.roundRect(cx + 6, cy + 23, 8, 3, 2);
            ctx.fill();
        }

        // Patterns on body
        if (player.customization) {
            const pat = player.customization.pattern;
            if (pat === 'spots') {
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath();
                ctx.arc(cx - 8, cy, 3, 0, Math.PI * 2);
                ctx.arc(cx + 5, cy + 5, 4, 0, Math.PI * 2);
                ctx.arc(cx - 2, cy + 9, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (pat === 'dots') {
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    ctx.arc(cx - 10 + i * 7, cy + (i % 2) * 6, 2, 0, Math.PI * 2);
                }
                ctx.fill();
            } else if (pat === 'stripes') {
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                for (let i = 0; i < 3; i++) {
                    ctx.fillRect(bx + 4, by + 4 + i * 7, bw - 8, 2);
                }
            } else if (pat === 'zigzag') {
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 1.5;
                for (let row = 0; row < 2; row++) {
                    ctx.beginPath();
                    const zy = by + 5 + row * 10;
                    ctx.moveTo(bx + 4, zy);
                    for (let i = 0; i < 4; i++) {
                        ctx.lineTo(bx + 4 + (i + 0.5) * 7, zy + (i % 2 === 0 ? 4 : -1));
                    }
                    ctx.stroke();
                }
            } else if (pat === 'checkers') {
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                for (let r = 0; r < 2; r++) {
                    for (let c = 0; c < 3; c++) {
                        if ((r + c) % 2 === 0) {
                            ctx.fillRect(bx + 4 + c * 9, by + 4 + r * 9, 8, 8);
                        }
                    }
                }
            } else if (pat === 'sparkle') {
                ctx.fillStyle = 'rgba(255,215,0,0.7)';
                [[cx - 8, cy], [cx + 6, cy + 6], [cx + 10, cy - 3]].forEach(([sx, sy]) => {
                    const s = 3;
                    ctx.beginPath();
                    ctx.moveTo(sx, sy - s); ctx.lineTo(sx + s * 0.3, sy - s * 0.3);
                    ctx.lineTo(sx + s, sy); ctx.lineTo(sx + s * 0.3, sy + s * 0.3);
                    ctx.lineTo(sx, sy + s); ctx.lineTo(sx - s * 0.3, sy + s * 0.3);
                    ctx.lineTo(sx - s, sy); ctx.lineTo(sx - s * 0.3, sy - s * 0.3);
                    ctx.closePath(); ctx.fill();
                });
            } else if (pat === 'flames') {
                const fc = ['#FF4500', '#FF6600', '#FF8C00', '#FFD700'];
                for (let i = 0; i < 5; i++) {
                    ctx.fillStyle = fc[i % fc.length];
                    ctx.globalAlpha = 0.7;
                    const fx = bx + 3 + i * 7;
                    ctx.beginPath();
                    ctx.moveTo(fx - 2, by + bh);
                    ctx.quadraticCurveTo(fx, by + bh - 7 - (i % 3) * 2, fx + 2, by + bh);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            } else if (pat === 'stars') {
                ctx.fillStyle = 'rgba(255,215,0,0.6)';
                [[cx - 8, cy], [cx + 5, cy + 6], [cx + 10, cy - 2]].forEach(([sx, sy]) => {
                    ctx.beginPath();
                    for (let p = 0; p < 5; p++) {
                        const a = (p / 5) * Math.PI * 2 - Math.PI / 2;
                        const ox = sx + Math.cos(a) * 3;
                        const oy = sy + Math.sin(a) * 3;
                        const ia = a + Math.PI / 5;
                        const ix = sx + Math.cos(ia) * 1.2;
                        const iy = sy + Math.sin(ia) * 1.2;
                        if (p === 0) ctx.moveTo(ox, oy); else ctx.lineTo(ox, oy);
                        ctx.lineTo(ix, iy);
                    }
                    ctx.closePath(); ctx.fill();
                });
            } else if (pat === 'glow') {
                ctx.save();
                ctx.shadowColor = typeof bodyColor === 'string' ? bodyColor : '#FFD700';
                ctx.shadowBlur = 12;
                ctx.strokeStyle = typeof bodyColor === 'string' ? bodyColor : '#FFD700';
                ctx.globalAlpha = 0.5;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(bx - 4, by - 4, bw + 8, bh + 8, 8);
                ctx.stroke();
                ctx.restore();
            } else if (pat === 'lightning') {
                // Cloud above dog
                ctx.fillStyle = '#8899AA';
                ctx.beginPath();
                ctx.arc(cx, y - 12, 8, 0, Math.PI * 2);
                ctx.arc(cx - 7, y - 10, 6, 0, Math.PI * 2);
                ctx.arc(cx + 7, y - 10, 6, 0, Math.PI * 2);
                ctx.fill();
                // Lightning bolt
                if (Math.floor(Date.now() / 150) % 60 < 3) {
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.moveTo(cx + 2, y - 5);
                    ctx.lineTo(cx - 2, y + 2);
                    ctx.lineTo(cx + 1, y + 1);
                    ctx.lineTo(cx - 3, y + 8);
                    ctx.lineTo(cx + 4, y);
                    ctx.lineTo(cx + 1, y + 1);
                    ctx.lineTo(cx + 5, y - 5);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }

        // Head - direction aware
        const headOff = dir === 1 ? 10 : -10;
        const hx = cx + headOff;
        const hy = cy - 12;
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.roundRect(hx - 10, hy - 9, 21, 19, 6);
        ctx.fill();

        // Floppy ears
        ctx.fillStyle = darker;
        const earTilt = dir === 1 ? 0.3 : -0.3;
        ctx.beginPath();
        ctx.ellipse(hx - 9, hy + 1, 4, 8, earTilt, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(hx + 11, hy + 1, 4, 8, -earTilt, 0, Math.PI * 2);
        ctx.fill();

        // Snout (lighter)
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.ellipse(hx + dir * 2, hy + 4, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(hx - 3, hy - 1, 4, 0, Math.PI * 2);
        ctx.arc(hx + 7, hy - 1, 4, 0, Math.PI * 2);
        ctx.fill();
        // Pupils
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(hx - 3 + dir, hy - 1, 2, 0, Math.PI * 2);
        ctx.arc(hx + 7 + dir, hy - 1, 2, 0, Math.PI * 2);
        ctx.fill();
        // Eye shine
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(hx - 4, hy - 2, 1, 0, Math.PI * 2);
        ctx.arc(hx + 6, hy - 2, 1, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.ellipse(hx + dir * 2, hy + 4, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(hx + dir * 2 - 2, hy + 7, 2, 0, Math.PI * 0.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(hx + dir * 2 + 2, hy + 7, 2, Math.PI * 0.2, Math.PI);
        ctx.stroke();

        // Tongue
        ctx.fillStyle = '#ff8a9e';
        ctx.beginPath();
        ctx.ellipse(hx + dir * 2, hy + 9, 2, 3, 0, 0, Math.PI);
        ctx.fill();

        // Hat - canvas drawn on top of head
        if (player.customization) {
            const hatId = player.customization.hat;
            const headTop = hy - 9;
            const headCx = hx + 1;
            if (hatId === 'party') {
                ctx.fillStyle = '#FF6B9D';
                ctx.beginPath();
                ctx.moveTo(headCx, headTop - 12);
                ctx.lineTo(headCx - 6, headTop + 2);
                ctx.lineTo(headCx + 6, headTop + 2);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(headCx, headTop - 12, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (hatId === 'crown') {
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.moveTo(headCx - 7, headTop + 2);
                ctx.lineTo(headCx - 7, headTop - 6);
                ctx.lineTo(headCx - 4, headTop - 2);
                ctx.lineTo(headCx, headTop - 8);
                ctx.lineTo(headCx + 4, headTop - 2);
                ctx.lineTo(headCx + 7, headTop - 6);
                ctx.lineTo(headCx + 7, headTop + 2);
                ctx.closePath();
                ctx.fill();
            } else if (hatId === 'cowboy') {
                ctx.fillStyle = '#8B4513';
                ctx.beginPath();
                ctx.ellipse(headCx, headTop, 12, 3, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(headCx - 5, headTop - 8, 10, 8);
                ctx.beginPath();
                ctx.arc(headCx, headTop - 8, 5, Math.PI, 0);
                ctx.fill();
            } else if (hatId === 'wizard') {
                ctx.fillStyle = '#2C3E80';
                ctx.beginPath();
                ctx.moveTo(headCx, headTop - 16);
                ctx.lineTo(headCx - 8, headTop + 2);
                ctx.lineTo(headCx + 8, headTop + 2);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(headCx, headTop - 4, 1.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (hatId === 'beanie') {
                ctx.fillStyle = '#E74C3C';
                ctx.beginPath();
                ctx.arc(headCx, headTop, 8, Math.PI, 0);
                ctx.fill();
                ctx.fillRect(headCx - 8, headTop - 1, 16, 3);
                ctx.fillStyle = '#C0392B';
                ctx.beginPath();
                ctx.arc(headCx, headTop - 7, 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (hatId === 'cap') {
                ctx.fillStyle = '#3498DB';
                ctx.beginPath();
                ctx.arc(headCx, headTop + 1, 8, Math.PI, 0);
                ctx.fill();
                ctx.fillRect(headCx + (dir === 1 ? 2 : -10), headTop, 8, 3);
            } else if (hatId === 'tophat') {
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(headCx - 4, headTop - 10, 8, 10);
                ctx.fillRect(headCx - 7, headTop - 1, 14, 3);
            } else if (hatId === 'pirate') {
                ctx.fillStyle = '#1a1a2e';
                ctx.beginPath();
                ctx.arc(headCx, headTop, 9, Math.PI, 0);
                ctx.fill();
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(headCx, headTop - 3, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (hatId === 'chef') {
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(headCx, headTop - 5, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(headCx - 6, headTop - 1, 12, 3);
            } else if (hatId === 'halo') {
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(headCx, headTop - 5, 8, 3, 0, 0, Math.PI * 2);
                ctx.stroke();
            } else if (hatId === 'ninja') {
                ctx.fillStyle = '#222';
                ctx.fillRect(headCx - 9, headTop + 2, 18, 3);
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(headCx - 9, headTop + 3);
                ctx.quadraticCurveTo(headCx - 14, headTop + 1, headCx - 15, headTop + 6);
                ctx.stroke();
            } else if (hatId === 'viking') {
                ctx.fillStyle = '#888';
                ctx.beginPath();
                ctx.arc(headCx, headTop, 8, Math.PI, 0);
                ctx.fill();
                ctx.fillStyle = '#F5DEB3';
                ctx.beginPath();
                ctx.moveTo(headCx - 8, headTop);
                ctx.quadraticCurveTo(headCx - 12, headTop - 4, headCx - 10, headTop - 10);
                ctx.lineTo(headCx - 7, headTop - 2);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(headCx + 8, headTop);
                ctx.quadraticCurveTo(headCx + 12, headTop - 4, headCx + 10, headTop - 10);
                ctx.lineTo(headCx + 7, headTop - 2);
                ctx.closePath();
                ctx.fill();
            } else if (hatId === 'alien') {
                ctx.strokeStyle = '#2ECC71';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(headCx - 3, headTop);
                ctx.lineTo(headCx - 5, headTop - 10);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(headCx + 3, headTop);
                ctx.lineTo(headCx + 5, headTop - 10);
                ctx.stroke();
                ctx.fillStyle = '#2ECC71';
                ctx.beginPath();
                ctx.arc(headCx - 5, headTop - 10, 2, 0, Math.PI * 2);
                ctx.arc(headCx + 5, headTop - 10, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Accessories - direction aware
            const accId = player.customization.accessory;
            if (accId === 'scarf') {
                ctx.fillStyle = '#E74C3C';
                ctx.fillRect(hx - 10, hy + 8, 22, 4);
                ctx.fillRect(hx + (dir === 1 ? -12 : 10), hy + 8, 4, 8);
            } else if (accId === 'bowtie') {
                ctx.fillStyle = '#FF69B4';
                const btx = hx, bty = hy + 10;
                ctx.beginPath();
                ctx.moveTo(btx, bty);
                ctx.lineTo(btx - 5, bty - 3);
                ctx.lineTo(btx - 5, bty + 3);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(btx, bty);
                ctx.lineTo(btx + 5, bty - 3);
                ctx.lineTo(btx + 5, bty + 3);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#E91E63';
                ctx.beginPath();
                ctx.arc(btx, bty, 1.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (accId === 'glasses') {
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(hx - 3, hy - 1, 4, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(hx + 7, hy - 1, 4, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(hx + 1, hy - 1);
                ctx.lineTo(hx + 3, hy - 1);
                ctx.stroke();
            } else if (accId === 'cape') {
                ctx.fillStyle = '#9B2335';
                const capeDir = dir === 1 ? -1 : 1;
                ctx.beginPath();
                ctx.moveTo(cx + capeDir * 5, cy - 8);
                ctx.quadraticCurveTo(cx + capeDir * 20, cy, cx + capeDir * 16, cy + 20);
                ctx.lineTo(cx + capeDir * 8, cy + 16);
                ctx.quadraticCurveTo(cx + capeDir * 12, cy, cx + capeDir * 5, cy - 4);
                ctx.closePath();
                ctx.fill();
            } else if (accId === 'wings') {
                ctx.fillStyle = 'rgba(200,220,255,0.7)';
                ctx.beginPath();
                ctx.ellipse(cx - 3, cy - 4, 14, 8, -0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(cx + 3, cy - 4, 14, 8, 0.3, 0, Math.PI * 2);
                ctx.fill();
            } else if (accId === 'rocket') {
                const rd = dir === 1 ? -1 : 1;
                ctx.fillStyle = '#888';
                ctx.fillRect(cx + rd * 8, cy - 8, 6, 14);
                ctx.fillStyle = '#E74C3C';
                ctx.beginPath();
                ctx.moveTo(cx + rd * 8, cy - 8);
                ctx.lineTo(cx + rd * 11, cy - 14);
                ctx.lineTo(cx + rd * 14, cy - 8);
                ctx.closePath();
                ctx.fill();
                // Flame
                ctx.fillStyle = '#FF6600';
                ctx.beginPath();
                ctx.moveTo(cx + rd * 8, cy + 6);
                ctx.lineTo(cx + rd * 11, cy + 12);
                ctx.lineTo(cx + rd * 14, cy + 6);
                ctx.closePath();
                ctx.fill();
            } else if (accId === 'monocle') {
                ctx.strokeStyle = '#DAA520';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(hx + 7, hy - 1, 5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(hx + 12, hy - 1);
                ctx.lineTo(hx + 14, hy + 8);
                ctx.stroke();
            } else if (accId === 'mask') {
                ctx.fillStyle = '#222';
                ctx.beginPath();
                ctx.roundRect(hx - 8, hy - 4, 18, 6, 3);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.ellipse(hx - 2, hy - 1, 3, 2, 0, 0, Math.PI * 2);
                ctx.ellipse(hx + 8, hy - 1, 3, 2, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (accId === 'flower') {
                ctx.fillStyle = '#FF69B4';
                for (let i = 0; i < 5; i++) {
                    const a = (i / 5) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.arc(hx + 9 + Math.cos(a) * 3, hy - 6 + Math.sin(a) * 3, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = '#F1C40F';
                ctx.beginPath();
                ctx.arc(hx + 9, hy - 6, 1.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (accId === 'necktie') {
                ctx.fillStyle = '#3498DB';
                const ntx = hx + 1, nty = hy + 10;
                ctx.beginPath();
                ctx.moveTo(ntx - 3, nty);
                ctx.lineTo(ntx + 3, nty);
                ctx.lineTo(ntx + 2, nty + 10);
                ctx.lineTo(ntx, nty + 12);
                ctx.lineTo(ntx - 2, nty + 10);
                ctx.closePath();
                ctx.fill();
            } else if (accId === 'medal') {
                ctx.strokeStyle = '#E74C3C';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(hx - 2, hy + 8);
                ctx.lineTo(hx + 1, hy + 14);
                ctx.lineTo(hx + 4, hy + 8);
                ctx.stroke();
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(hx + 1, hy + 16, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Player name
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.strokeText(player.name, x + w / 2, y - 14);
        ctx.fillText(player.name, x + w / 2, y - 14);
        ctx.textAlign = 'left';

        // Highlight my player with golden glow
        if (player.id === this.myPlayerId) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
            ctx.setLineDash([]);
        }
    }

    darkenColor(color, percent) {
        if (!color || !color.startsWith('#')) return '#333333';
        const num = parseInt(color.replace('#', ''), 16);
        if (isNaN(num)) return '#333333';
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

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            // Enter fullscreen
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new PuppyControl();
});
