// Creator Game - Main Logic
import { ShapeEditor, CharacterCustomizer } from './customization.js';

class CreatorGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1200;
        this.canvas.height = 700;

        // Game state
        this.mode = 'build'; // 'build' or 'play'
        this.selectedShape = 'square';
        this.selectedColor = '#FF6B6B';
        this.gridSize = 40;
        this.objects = [];

        // Player state
        this.player = {
            x: 100,
            y: 100,
            width: 30,
            height: 50,
            velocityX: 0,
            velocityY: 0,
            speed: 5,
            jumpPower: 12,
            isJumping: false,
            gravity: 0.5,
            color: '#FF1744',
            eyeColor: 'white'
        };

        // Input state
        this.keys = {};

        // Custom shapes
        this.customShapes = [];
        this.editorCanvas = null;
        this.editorCtx = null;
        this.editorGrid = [];
        this.editorGridSize = 10;

        this.init();
    }

    init() {
        this.shapeEditor = new ShapeEditor(this);
        this.characterCustomizer = new CharacterCustomizer(this);
        this.setupEventListeners();
        this.render();
        this.gameLoop();

        // Hide instructions after 15 seconds
        setTimeout(() => {
            const instructions = document.getElementById('instructions');
            if (instructions) {
                instructions.style.opacity = '0';
                setTimeout(() => {
                    instructions.style.display = 'none';
                }, 500); // Wait for fade out animation
            }
        }, 15000);
    }

    setupEventListeners() {
        // Shape selection
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedShape = btn.dataset.shape;
            });
        });

        // Color selection
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedColor = btn.dataset.color;
            });
        });

        // Mode switching
        document.getElementById('build-mode-btn').addEventListener('click', () => {
            this.switchMode('build');
        });

        document.getElementById('play-mode-btn').addEventListener('click', () => {
            this.switchMode('play');
        });

        document.getElementById('delete-mode-btn').addEventListener('click', () => {
            this.switchMode('delete');
        });

        // Canvas click for placing/deleting objects
        this.canvas.addEventListener('click', (e) => {
            if (this.mode === 'build') {
                this.placeObject(e);
            } else if (this.mode === 'delete') {
                this.deleteObjectAtMouse(e);
            }
        });

        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            // Delete object in build mode
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.mode === 'build') {
                    e.preventDefault();
                    this.deleteObjectAtMouse(e);
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // World controls
        document.getElementById('save-btn').addEventListener('click', () => this.saveWorld());
        document.getElementById('load-btn').addEventListener('click', () => this.loadWorld());
        document.getElementById('share-btn').addEventListener('click', () => this.shareWorld());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearWorld());

        // Canvas right-click for deletion
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.mode === 'build' || this.mode === 'delete') {
                this.deleteObjectAtMouse(e);
            }
        });

        // Custom shape editor
        document.getElementById('create-custom-btn').addEventListener('click', () => {
            this.shapeEditor.openEditor();
        });

        document.getElementById('close-editor').addEventListener('click', () => {
            this.shapeEditor.closeEditor();
        });

        // Character customization button
        document.getElementById('customize-character-btn').addEventListener('click', () => {
            this.characterCustomizer.openCustomizer();
        });
    }

    switchMode(mode) {
        this.mode = mode;

        // Remove active class from all mode buttons
        document.getElementById('build-mode-btn').classList.remove('active');
        document.getElementById('play-mode-btn').classList.remove('active');
        document.getElementById('delete-mode-btn').classList.remove('active');

        if (mode === 'build') {
            document.getElementById('build-mode-btn').classList.add('active');
            this.canvas.classList.remove('play-mode');
            this.canvas.style.cursor = 'crosshair';
        } else if (mode === 'delete') {
            document.getElementById('delete-mode-btn').classList.add('active');
            this.canvas.classList.remove('play-mode');
            this.canvas.style.cursor = 'not-allowed';
        } else if (mode === 'play') {
            document.getElementById('play-mode-btn').classList.add('active');
            this.canvas.classList.add('play-mode');
            this.canvas.style.cursor = 'default';
            // Reset player position
            this.player.x = 100;
            this.player.y = 100;
            this.player.velocityY = 0;
        }
    }

    placeObject(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.gridSize) * this.gridSize;
        const y = Math.floor((e.clientY - rect.top) / this.gridSize) * this.gridSize;

        const obj = {
            shape: this.selectedShape,
            color: this.selectedColor,
            x: x,
            y: y,
            width: this.gridSize,
            height: this.gridSize
        };

        // Check if object already exists at this position
        const existingIndex = this.objects.findIndex(o =>
            o.x === x && o.y === y
        );

        if (existingIndex !== -1) {
            // Replace existing object
            this.objects[existingIndex] = obj;
        } else {
            this.objects.push(obj);
        }

        this.render();
    }

    deleteObjectAtMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.gridSize) * this.gridSize;
        const y = Math.floor((e.clientY - rect.top) / this.gridSize) * this.gridSize;

        this.objects = this.objects.filter(obj =>
            !(obj.x === x && obj.y === y)
        );

        this.render();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawObject(obj) {
        this.ctx.fillStyle = obj.color;

        if (obj.shape.startsWith('custom_')) {
            // Draw custom shape
            const customShape = this.customShapes.find(s => s.id === obj.shape);
            if (customShape) {
                this.drawCustomShape(customShape, obj.x, obj.y, obj.width);
            }
        } else {
            switch(obj.shape) {
                case 'square':
                    this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                    break;

                case 'circle':
                    this.ctx.beginPath();
                    this.ctx.arc(
                        obj.x + obj.width / 2,
                        obj.y + obj.height / 2,
                        obj.width / 2,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.fill();
                    break;

                case 'triangle':
                    this.ctx.beginPath();
                    this.ctx.moveTo(obj.x + obj.width / 2, obj.y);
                    this.ctx.lineTo(obj.x + obj.width, obj.y + obj.height);
                    this.ctx.lineTo(obj.x, obj.y + obj.height);
                    this.ctx.closePath();
                    this.ctx.fill();
                    break;

                case 'rectangle':
                    this.ctx.fillRect(obj.x, obj.y, obj.width * 1.5, obj.height * 0.75);
                    break;
            }
        }
    }

    drawCustomShape(shape, x, y, size) {
        const cellSize = size / shape.grid.length;
        for (let row = 0; row < shape.grid.length; row++) {
            for (let col = 0; col < shape.grid[row].length; col++) {
                if (shape.grid[row][col]) {
                    this.ctx.fillStyle = shape.grid[row][col];
                    this.ctx.fillRect(
                        x + col * cellSize,
                        y + row * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }
    }

    drawPlayer() {
        if (this.player.isCustom && this.player.customGrid) {
            // Draw custom character from grid
            const gridSize = 10;
            const cellSize = 4; // Scale factor from editor (20px / 5 = 4px per cell)

            // Calculate bounding box to properly position the character
            let minX = gridSize, maxX = 0, minY = gridSize, maxY = 0;
            let hasBlocks = false;

            for (let y = 0; y < gridSize; y++) {
                for (let x = 0; x < gridSize; x++) {
                    if (this.player.customGrid[y][x]) {
                        hasBlocks = true;
                        minX = Math.min(minX, x);
                        maxX = Math.max(maxX, x);
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                    }
                }
            }

            // Draw each cell of the custom character
            if (hasBlocks) {
                for (let y = 0; y < gridSize; y++) {
                    for (let x = 0; x < gridSize; x++) {
                        if (this.player.customGrid[y][x]) {
                            this.ctx.fillStyle = this.player.customGrid[y][x];
                            this.ctx.fillRect(
                                this.player.x + (x - minX) * cellSize,
                                this.player.y + (y - minY) * cellSize,
                                cellSize,
                                cellSize
                            );
                        }
                    }
                }
            }
        } else {
            // Draw default simple character
            this.ctx.fillStyle = this.player.color;
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

            // Draw eyes (scale with character size)
            const eyeSize = Math.max(4, this.player.width * 0.2);
            const eyeSpacing = this.player.width * 0.23;

            this.ctx.fillStyle = this.player.eyeColor;
            this.ctx.fillRect(this.player.x + eyeSpacing, this.player.y + this.player.height * 0.2, eyeSize, eyeSize);
            this.ctx.fillRect(this.player.x + this.player.width - eyeSpacing - eyeSize, this.player.y + this.player.height * 0.2, eyeSize, eyeSize);

            // Draw pupils
            const pupilSize = Math.max(2, eyeSize * 0.5);
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(
                this.player.x + eyeSpacing + (eyeSize - pupilSize) / 2,
                this.player.y + this.player.height * 0.2 + (eyeSize - pupilSize) / 2,
                pupilSize,
                pupilSize
            );
            this.ctx.fillRect(
                this.player.x + this.player.width - eyeSpacing - eyeSize + (eyeSize - pupilSize) / 2,
                this.player.y + this.player.height * 0.2 + (eyeSize - pupilSize) / 2,
                pupilSize,
                pupilSize
            );
        }
    }

    updatePlayer() {
        // Horizontal movement
        if (this.keys['arrowleft'] || this.keys['a']) {
            this.player.velocityX = -this.player.speed;
        } else if (this.keys['arrowright'] || this.keys['d']) {
            this.player.velocityX = this.player.speed;
        } else {
            this.player.velocityX = 0;
        }

        // Jump
        if ((this.keys['arrowup'] || this.keys['w'] || this.keys[' ']) && !this.player.isJumping) {
            this.player.velocityY = -this.player.jumpPower;
            this.player.isJumping = true;
        }

        // Apply gravity
        this.player.velocityY += this.player.gravity;

        // Update position
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;

        // Collision detection with objects
        this.checkCollisions();

        // Floor collision
        if (this.player.y + this.player.height >= this.canvas.height) {
            this.player.y = this.canvas.height - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
        }

        // Boundary checks
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.canvas.width) {
            this.player.x = this.canvas.width - this.player.width;
        }
    }

    checkCollisions() {
        for (let obj of this.objects) {
            // Simple AABB collision detection
            if (this.player.x < obj.x + obj.width &&
                this.player.x + this.player.width > obj.x &&
                this.player.y < obj.y + obj.height &&
                this.player.y + this.player.height > obj.y) {

                // Collision detected, resolve it
                const overlapLeft = (this.player.x + this.player.width) - obj.x;
                const overlapRight = (obj.x + obj.width) - this.player.x;
                const overlapTop = (this.player.y + this.player.height) - obj.y;
                const overlapBottom = (obj.y + obj.height) - this.player.y;

                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                if (minOverlap === overlapTop && this.player.velocityY > 0) {
                    // Landing on top of object
                    this.player.y = obj.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.isJumping = false;
                } else if (minOverlap === overlapBottom && this.player.velocityY < 0) {
                    // Hitting bottom of object
                    this.player.y = obj.y + obj.height;
                    this.player.velocityY = 0;
                } else if (minOverlap === overlapLeft) {
                    // Hitting from left
                    this.player.x = obj.x - this.player.width;
                } else if (minOverlap === overlapRight) {
                    // Hitting from right
                    this.player.x = obj.x + obj.width;
                }
            }
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid in build and delete mode
        if (this.mode === 'build' || this.mode === 'delete') {
            this.drawGrid();
        }

        // Draw all objects
        for (let obj of this.objects) {
            this.drawObject(obj);
        }

        // Draw player in play mode
        if (this.mode === 'play') {
            this.drawPlayer();
        }
    }

    gameLoop() {
        if (this.mode === 'play') {
            this.updatePlayer();
        }

        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    saveWorld() {
        const worldData = {
            objects: this.objects,
            timestamp: new Date().toISOString()
        };

        const dataStr = JSON.stringify(worldData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `creator-world-${Date.now()}.json`;
        link.click();

        URL.revokeObjectURL(url);

        alert('World saved successfully!');
    }

    loadWorld() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const worldData = JSON.parse(event.target.result);
                    this.objects = worldData.objects || [];
                    this.render();
                    alert('World loaded successfully!');
                } catch (error) {
                    alert('Error loading world file!');
                }
            };

            reader.readAsText(file);
        };

        input.click();
    }

    shareWorld() {
        const worldData = {
            objects: this.objects,
            timestamp: new Date().toISOString()
        };

        const dataStr = JSON.stringify(worldData);
        const encoded = btoa(dataStr);

        // Create shareable URL
        const shareUrl = `${window.location.origin}${window.location.pathname}?world=${encoded}`;

        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Share link copied to clipboard!\n\nAnyone with this link can load your world.');
        }).catch(() => {
            // Fallback: show the URL
            prompt('Share this link:', shareUrl);
        });
    }

    clearWorld() {
        if (confirm('Are you sure you want to clear your entire world? This cannot be undone.')) {
            this.objects = [];
            this.render();
        }
    }

    loadSharedWorld() {
        const urlParams = new URLSearchParams(window.location.search);
        const worldParam = urlParams.get('world');

        if (worldParam) {
            try {
                const decoded = atob(worldParam);
                const worldData = JSON.parse(decoded);
                this.objects = worldData.objects || [];
                this.render();
                alert('Shared world loaded!');
            } catch (error) {
                console.error('Error loading shared world:', error);
            }
        }
    }

    renderCustomShapes() {
        const container = document.getElementById('custom-shapes-list');
        container.innerHTML = '';

        this.customShapes.forEach((shape, index) => {
            const btn = document.createElement('button');
            btn.className = 'custom-shape-btn';
            btn.dataset.shape = shape.id;

            // Create preview canvas
            const preview = document.createElement('canvas');
            preview.className = 'custom-shape-preview';
            preview.width = 40;
            preview.height = 40;
            const ctx = preview.getContext('2d');

            // Draw shape preview
            const cellSize = 40 / shape.grid.length;
            for (let row = 0; row < shape.grid.length; row++) {
                for (let col = 0; col < shape.grid[row].length; col++) {
                    if (shape.grid[row][col]) {
                        ctx.fillStyle = shape.grid[row][col];
                        ctx.fillRect(
                            col * cellSize,
                            row * cellSize,
                            cellSize,
                            cellSize
                        );
                    }
                }
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-custom-shape';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteCustomShape(index);
            });

            btn.appendChild(preview);
            btn.appendChild(deleteBtn);
            btn.title = shape.name; // Show name as tooltip

            btn.addEventListener('click', () => {
                document.querySelectorAll('.shape-btn, .custom-shape-btn').forEach(b =>
                    b.classList.remove('active')
                );
                btn.classList.add('active');
                this.selectedShape = shape.id;
            });

            container.appendChild(btn);
        });
    }

    deleteCustomShape(index) {
        if (confirm('Delete this custom shape?')) {
            this.customShapes.splice(index, 1);
            this.renderCustomShapes();
        }
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new CreatorGame();
    game.loadSharedWorld();
});
