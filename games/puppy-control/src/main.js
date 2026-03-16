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
        const x = player.x;
        const y = player.y;
        const dir = player.direction;

        // Draw dog (simplified version)
        ctx.fillStyle = player.color;
        ctx.fillRect(x, y + 12, player.width, player.height - 12);

        const headX = dir === 1 ? x + player.width - 18 : x + 3;
        ctx.fillRect(headX, y, 15, 15);

        // Apply pattern if available
        if (player.customization && player.customization.pattern && player.customization.pattern !== 'none') {
            if (player.customization.pattern === 'spots') {
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.arc(x + 10, y + 25, 3, 0, Math.PI * 2);
                ctx.arc(x + 22, y + 30, 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (player.customization.pattern === 'sparkle') {
                ctx.fillStyle = '#FFD700';
                ctx.font = '12px Arial';
                ctx.fillText('✨', x + 10, y + 30);
            }
        }

        // Draw hat (centered on top of head)
        if (player.customization && player.customization.hat && player.customization.hat !== 'none') {
            const hatItem = CUSTOMIZATION_ITEMS.hats.find(h => h.id === player.customization.hat);
            if (hatItem) {
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(hatItem.icon, headX + 7.5, y - 2);
                ctx.textAlign = 'left';
            }
        }

        // Draw accessory
        if (player.customization && player.customization.accessory && player.customization.accessory !== 'none') {
            const accItem = CUSTOMIZATION_ITEMS.accessories.find(a => a.id === player.customization.accessory);
            if (accItem) {
                ctx.font = 'bold 16px Arial';
                ctx.fillText(accItem.icon, headX + 3, y + 18);
            }
        }
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
            // Gray smoke trail
            for (let i = 0; i < player.trail.length; i++) {
                const point = player.trail[i];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 1000); // Fade over 1 second
                const size = 8 + (player.trail.length - i) * 0.5;

                this.ctx.fillStyle = `rgba(150, 150, 150, ${alpha * 0.5})`;
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        } else if (trailType === 'fire') {
            // Fire trail (red/orange/yellow)
            for (let i = 0; i < player.trail.length; i++) {
                const point = player.trail[i];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 800);
                const size = 6 + (player.trail.length - i) * 0.6;

                // Color shifts from yellow to orange to red
                const colorIndex = i / player.trail.length;
                if (colorIndex < 0.33) {
                    this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.7})`;
                } else if (colorIndex < 0.66) {
                    this.ctx.fillStyle = `rgba(255, 150, 0, ${alpha * 0.7})`;
                } else {
                    this.ctx.fillStyle = `rgba(255, 50, 0, ${alpha * 0.7})`;
                }

                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                this.ctx.fill();
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
            // Star trail
            for (let i = 0; i < player.trail.length; i++) {
                if (i % 3 !== 0) continue; // Sparse stars

                const point = player.trail[i];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 1200);

                this.ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
                this.ctx.font = `${12 + Math.random() * 8}px Arial`;
                this.ctx.fillText('⭐', point.x - 6, point.y + 6);
            }
        } else if (trailType === 'hearts') {
            // Heart trail
            for (let i = 0; i < player.trail.length; i++) {
                if (i % 4 !== 0) continue; // Sparse hearts

                const point = player.trail[i];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 1000);

                this.ctx.fillStyle = `rgba(255, 100, 150, ${alpha})`;
                this.ctx.font = `${14 + Math.random() * 6}px Arial`;
                this.ctx.fillText('💖', point.x - 7, point.y + 7);
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
            // Ice/snow trail
            for (let i = 0; i < player.trail.length; i++) {
                const point = player.trail[i];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 1200);
                const size = 5 + (player.trail.length - i) * 0.3;

                this.ctx.fillStyle = `rgba(173, 216, 230, ${alpha * 0.8})`;
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                this.ctx.fill();

                // Add sparkle
                if (i % 4 === 0) {
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    this.ctx.fillRect(point.x - 1, point.y - 3, 2, 6);
                    this.ctx.fillRect(point.x - 3, point.y - 1, 6, 2);
                }
            }
        } else if (trailType === 'leaves') {
            // Falling leaves trail
            for (let i = 0; i < player.trail.length; i++) {
                if (i % 3 !== 0) continue;

                const point = player.trail[i];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 1500);

                this.ctx.fillStyle = `rgba(34, 139, 34, ${alpha})`;
                this.ctx.font = `${14 + Math.random() * 4}px Arial`;
                this.ctx.fillText('🍃', point.x - 7, point.y + 7);
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
            // Cherry blossom trail
            for (let i = 0; i < player.trail.length; i++) {
                if (i % 2 !== 0) continue;

                const point = player.trail[i];
                const age = now - point.time;
                const alpha = Math.max(0, 1 - age / 1800);

                this.ctx.fillStyle = `rgba(255, 182, 193, ${alpha})`;
                this.ctx.font = `${12 + Math.random() * 6}px Arial`;
                this.ctx.fillText('🌸', point.x - 6, point.y + 6);
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

        // Apply customization if available
        if (player.customization) {
            // Draw pattern
            if (player.customization.pattern === 'spots') {
                this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
                this.ctx.beginPath();
                this.ctx.arc(x + 10, y + 25, 4, 0, Math.PI * 2);
                this.ctx.arc(x + 25, y + 30, 5, 0, Math.PI * 2);
                this.ctx.arc(x + 15, y + 35, 3, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (player.customization.pattern === 'dots') {
                this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
                this.ctx.beginPath();
                this.ctx.arc(x + 8, y + 22, 3, 0, Math.PI * 2);
                this.ctx.arc(x + 20, y + 22, 3, 0, Math.PI * 2);
                this.ctx.arc(x + 32, y + 22, 3, 0, Math.PI * 2);
                this.ctx.arc(x + 14, y + 32, 3, 0, Math.PI * 2);
                this.ctx.arc(x + 26, y + 32, 3, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (player.customization.pattern === 'stripes') {
                this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
                for (let i = 0; i < 3; i++) {
                    this.ctx.fillRect(x + 5, y + 20 + (i * 8), player.width - 10, 3);
                }
            } else if (player.customization.pattern === 'zigzag') {
                this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(x + 5, y + 20);
                this.ctx.lineTo(x + 12, y + 26);
                this.ctx.lineTo(x + 19, y + 20);
                this.ctx.lineTo(x + 26, y + 26);
                this.ctx.lineTo(x + 33, y + 20);
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.moveTo(x + 5, y + 32);
                this.ctx.lineTo(x + 12, y + 38);
                this.ctx.lineTo(x + 19, y + 32);
                this.ctx.lineTo(x + 26, y + 38);
                this.ctx.lineTo(x + 33, y + 32);
                this.ctx.stroke();
            } else if (player.customization.pattern === 'checkers') {
                this.ctx.fillStyle = 'rgba(0,0,0,0.25)';
                for (let row = 0; row < 2; row++) {
                    for (let col = 0; col < 3; col++) {
                        if ((row + col) % 2 === 0) {
                            this.ctx.fillRect(x + 5 + col * 10, y + 20 + row * 10, 10, 10);
                        }
                    }
                }
            } else if (player.customization.pattern === 'sparkle') {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = '16px Arial';
                this.ctx.fillText('✨', x + 5, y + 28);
                this.ctx.fillText('✨', x + 20, y + 38);
            } else if (player.customization.pattern === 'flames') {
                this.ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
                this.ctx.font = '14px Arial';
                this.ctx.fillText('🔥', x + 5, y + 30);
                this.ctx.fillText('🔥', x + 18, y + 36);
                this.ctx.fillText('🔥', x + 28, y + 30);
            } else if (player.customization.pattern === 'stars') {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = '12px Arial';
                this.ctx.fillText('⭐', x + 5, y + 25);
                this.ctx.fillText('⭐', x + 18, y + 30);
                this.ctx.fillText('⭐', x + 28, y + 38);
            } else if (player.customization.pattern === 'glow') {
                this.ctx.shadowColor = '#FFD700';
                this.ctx.shadowBlur = 15;
                this.ctx.strokeStyle = '#FFD700';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x, y + 12, player.width, player.height - 12);
                this.ctx.shadowBlur = 0;
            } else if (player.customization.pattern === 'lightning') {
                this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(x + 15, y + 15);
                this.ctx.lineTo(x + 18, y + 25);
                this.ctx.lineTo(x + 14, y + 25);
                this.ctx.lineTo(x + 17, y + 35);
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.moveTo(x + 28, y + 18);
                this.ctx.lineTo(x + 31, y + 28);
                this.ctx.lineTo(x + 27, y + 28);
                this.ctx.lineTo(x + 30, y + 38);
                this.ctx.stroke();
            }

            // Draw hat (centered on top of head)
            const hatItem = CUSTOMIZATION_ITEMS.hats.find(h => h.id === player.customization.hat);
            if (hatItem && hatItem.id !== 'none') {
                this.ctx.font = 'bold 24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(hatItem.icon, headX + 7.5, y - 2);
                this.ctx.textAlign = 'left';
            }

            // Draw accessory
            const accItem = CUSTOMIZATION_ITEMS.accessories.find(a => a.id === player.customization.accessory);
            if (accItem && accItem.id !== 'none') {
                this.ctx.font = 'bold 20px Arial';
                const accX = dir === 1 ? headX + 3 : headX + 3;
                this.ctx.fillText(accItem.icon, accX, y + 20);
            }
        }

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
