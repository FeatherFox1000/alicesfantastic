// Creator Game - Main Logic
import { ShapeEditor, CharacterCustomizer } from './customization.js';
import { toast, confirmDialog, promptDialog } from './notify.js';

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
        this.firstPersonMode = false;
        this.mouseFollowMode = false;
        this.cameraX = 0;
        this.cameraY = 0;
        this.mouseX = 0;
        this.mouseY = 0;

        // Drag state
        this.isDragging = false;
        this.draggedObject = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;

        // Undo history
        this.history = [];
        this.maxHistorySize = 50;

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
            eyeColor: 'white',
            currentAnimationFrame: 0,
            animationCounter: 0,
            animationSpeed: 0.15
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
        this.loadTheme();
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
                // Update color picker to match
                document.getElementById('custom-color-picker').value = this.selectedColor;
            });
        });

        // Custom color picker
        const colorPicker = document.getElementById('custom-color-picker');
        colorPicker.addEventListener('input', (e) => {
            this.selectedColor = e.target.value;
            // Remove active class from preset color buttons
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
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

        // Canvas mouse events for dragging and placing
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.mode === 'build') {
                const worldX = e.clientX - this.canvas.getBoundingClientRect().left + this.cameraX;
                const worldY = e.clientY - this.canvas.getBoundingClientRect().top + this.cameraY;

                // Check if clicking on an existing object
                const clickedObject = this.getObjectAt(worldX, worldY);

                if (clickedObject && e.shiftKey) {
                    // Shift+click to drag existing object
                    this.isDragging = true;
                    this.draggedObject = clickedObject;
                    this.dragOffsetX = worldX - clickedObject.x;
                    this.dragOffsetY = worldY - clickedObject.y;
                    this.saveToHistory();
                } else if (!clickedObject) {
                    // Place new object and start drag-to-place
                    this.isPlacing = true;
                    this.saveToHistory();
                    this.placeObject(e);
                    this.lastPlacedGrid = this.getGridPos(e);
                }
            } else if (this.mode === 'delete') {
                this.isDeleting = true;
                this.deleteObjectAtMouse(e);
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging && this.draggedObject) {
                const worldX = e.clientX - this.canvas.getBoundingClientRect().left + this.cameraX;
                const worldY = e.clientY - this.canvas.getBoundingClientRect().top + this.cameraY;

                // Snap to grid
                this.draggedObject.x = Math.floor((worldX - this.dragOffsetX) / this.gridSize) * this.gridSize;
                this.draggedObject.y = Math.floor((worldY - this.dragOffsetY) / this.gridSize) * this.gridSize;

                this.render();
            } else if (this.isPlacing && this.mode === 'build') {
                // Drag to place blocks continuously
                const gridPos = this.getGridPos(e);
                if (!this.lastPlacedGrid || gridPos.gx !== this.lastPlacedGrid.gx || gridPos.gy !== this.lastPlacedGrid.gy) {
                    const worldX = e.clientX - this.canvas.getBoundingClientRect().left + this.cameraX;
                    const worldY = e.clientY - this.canvas.getBoundingClientRect().top + this.cameraY;
                    if (!this.getObjectAt(worldX, worldY)) {
                        this.placeObject(e);
                    }
                    this.lastPlacedGrid = gridPos;
                }
            } else if (this.isDeleting && this.mode === 'delete') {
                this.deleteObjectAtMouse(e);
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.isDragging = false;
            this.draggedObject = null;
            this.isPlacing = false;
            this.isDeleting = false;
            this.lastPlacedGrid = null;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isPlacing = false;
            this.isDeleting = false;
            this.lastPlacedGrid = null;
        });

        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            // Undo with Ctrl+Z or Cmd+Z
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                this.undo();
                return;
            }

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
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('save-btn').addEventListener('click', () => this.saveWorld());
        document.getElementById('load-btn').addEventListener('click', () => this.loadWorld());
        document.getElementById('share-btn').addEventListener('click', () => this.shareWorld());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearWorld());
        document.getElementById('about-btn').addEventListener('click', () => this.openAboutModal());

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

        // Load worlds modal
        document.getElementById('close-load-worlds').addEventListener('click', () => {
            this.closeLoadWorldsModal();
        });

        document.getElementById('load-from-file').addEventListener('click', () => {
            this.loadWorldFromFile();
        });

        // About modal
        document.getElementById('close-about').addEventListener('click', () => {
            this.closeAboutModal();
        });

        // First person mode toggle
        document.getElementById('first-person-btn').addEventListener('click', () => {
            this.toggleFirstPerson();
        });

        // Mouse follow mode toggle
        document.getElementById('mouse-follow-btn').addEventListener('click', () => {
            this.toggleMouseFollow();
        });

        // Track mouse position
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
    }

    switchMode(mode) {
        this.mode = mode;

        // Remove active class from all mode buttons
        document.getElementById('build-mode-btn').classList.remove('active');
        document.getElementById('play-mode-btn').classList.remove('active');
        document.getElementById('delete-mode-btn').classList.remove('active');

        const firstPersonBtn = document.getElementById('first-person-btn');

        if (mode === 'build') {
            document.getElementById('build-mode-btn').classList.add('active');
            this.canvas.classList.remove('play-mode');
            this.canvas.style.cursor = 'crosshair';
            firstPersonBtn.style.display = 'none';
            this.firstPersonMode = false;
            // Keep camera position for unlimited workspace - don't reset
        } else if (mode === 'delete') {
            document.getElementById('delete-mode-btn').classList.add('active');
            this.canvas.classList.remove('play-mode');
            this.canvas.style.cursor = 'not-allowed';
            firstPersonBtn.style.display = 'none';
            this.firstPersonMode = false;
            // Keep camera position for unlimited workspace - don't reset
        } else if (mode === 'play') {
            document.getElementById('play-mode-btn').classList.add('active');
            this.canvas.classList.add('play-mode');
            this.canvas.style.cursor = 'default';
            firstPersonBtn.style.display = 'inline-block';
            // Reset player position to center of current view
            this.player.x = this.cameraX + this.canvas.width / 2;
            this.player.y = this.cameraY + this.canvas.height / 2;
            this.player.velocityY = 0;
        }
    }

    toggleFirstPerson() {
        this.firstPersonMode = !this.firstPersonMode;
        const btn = document.getElementById('first-person-btn');

        if (this.firstPersonMode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
            this.cameraX = 0;
            this.cameraY = 0;
        }
    }

    toggleMouseFollow() {
        this.mouseFollowMode = !this.mouseFollowMode;
        const btn = document.getElementById('mouse-follow-btn');

        if (this.mouseFollowMode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
            this.cameraX = 0;
            this.cameraY = 0;
        }
    }

    getGridPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            gx: Math.floor((e.clientX - rect.left + this.cameraX) / this.gridSize),
            gy: Math.floor((e.clientY - rect.top + this.cameraY) / this.gridSize)
        };
    }

    placeObject(e) {
        const rect = this.canvas.getBoundingClientRect();
        let x = Math.floor((e.clientX - rect.left + this.cameraX) / this.gridSize) * this.gridSize;
        let y = Math.floor((e.clientY - rect.top + this.cameraY) / this.gridSize) * this.gridSize;

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
        const x = Math.floor((e.clientX - rect.left + this.cameraX) / this.gridSize) * this.gridSize;
        const y = Math.floor((e.clientY - rect.top + this.cameraY) / this.gridSize) * this.gridSize;

        // Save current state to history before making changes
        this.saveToHistory();

        this.objects = this.objects.filter(obj =>
            !(obj.x === x && obj.y === y)
        );

        this.render();
    }

    getObjectAt(worldX, worldY) {
        // Find object at the given world coordinates
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            const width = obj.shape === 'rectangle' ? obj.width * 1.5 : obj.width;
            const height = obj.shape === 'rectangle' ? obj.height * 0.75 : obj.height;

            if (worldX >= obj.x && worldX < obj.x + width &&
                worldY >= obj.y && worldY < obj.y + height) {
                return obj;
            }
        }
        return null;
    }

    drawGrid() {
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 1;

        // Calculate grid bounds based on camera position for unlimited workspace
        const startX = Math.floor(this.cameraX / this.gridSize) * this.gridSize;
        const endX = startX + this.canvas.width + this.gridSize * 2;
        const startY = Math.floor(this.cameraY / this.gridSize) * this.gridSize;
        const endY = startY + this.canvas.height + this.gridSize * 2;

        // Vertical lines
        for (let x = startX; x <= endX; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = startY; y <= endY; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
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
        if (this.player.isCustom && this.player.animationFrames && this.player.animationFrames.length > 0) {
            // Draw custom character with animation from grid
            const gridSize = 10;
            const cellSize = 4; // Scale factor from editor (20px / 5 = 4px per cell)

            // Get current animation frame
            const currentFrame = this.player.animationFrames[Math.floor(this.player.currentAnimationFrame)];

            // Calculate bounding box to properly position the character
            let minX = gridSize, maxX = 0, minY = gridSize, maxY = 0;
            let hasBlocks = false;

            for (let y = 0; y < gridSize; y++) {
                for (let x = 0; x < gridSize; x++) {
                    if (currentFrame[y][x]) {
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
                        if (currentFrame[y][x]) {
                            this.ctx.fillStyle = currentFrame[y][x];
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
        } else if (this.player.isCustom && this.player.customGrid) {
            // Draw custom character without animation (legacy support)
            const gridSize = 10;
            const cellSize = 4;

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
        const isMoving = this.keys['arrowleft'] || this.keys['a'] || this.keys['arrowright'] || this.keys['d'];

        if (this.keys['arrowleft'] || this.keys['a']) {
            this.player.velocityX = -this.player.speed;
        } else if (this.keys['arrowright'] || this.keys['d']) {
            this.player.velocityX = this.player.speed;
        } else {
            this.player.velocityX = 0;
        }

        // Update animation when moving
        if (isMoving && this.player.animationFrames && this.player.animationFrames.length > 1) {
            this.player.animationCounter += this.player.animationSpeed;
            if (this.player.animationCounter >= this.player.animationFrames.length) {
                this.player.animationCounter = 0;
            }
            this.player.currentAnimationFrame = this.player.animationCounter;
        } else {
            // Reset to first frame when not moving
            this.player.currentAnimationFrame = 0;
            this.player.animationCounter = 0;
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

        // Update camera to follow player in play mode
        if (this.mode === 'play') {
            if (this.firstPersonMode) {
                // Position camera at player's eye level (about 20% down from top of character)
                const eyeLevel = this.player.y + this.player.height * 0.2;
                this.cameraX = this.player.x + this.player.width / 2 - this.canvas.width / 2;
                this.cameraY = eyeLevel - this.canvas.height / 2;
            } else {
                // Center camera on player in regular play mode
                this.cameraX = this.player.x + this.player.width / 2 - this.canvas.width / 2;
                this.cameraY = this.player.y + this.player.height / 2 - this.canvas.height / 2;
            }
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
        // Clear entire canvas viewport
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Save context state
        this.ctx.save();

        // Update camera for mouse follow mode (unlimited workspace)
        if (this.mouseFollowMode && (this.mode === 'build' || this.mode === 'delete')) {
            const edgeThreshold = 200; // Distance from edge to start scrolling
            const scrollSpeed = 5;

            if (this.mouseX < edgeThreshold) {
                this.cameraX -= scrollSpeed;
            } else if (this.mouseX > this.canvas.width - edgeThreshold) {
                this.cameraX += scrollSpeed;
            }

            if (this.mouseY < edgeThreshold) {
                this.cameraY -= scrollSpeed;
            } else if (this.mouseY > this.canvas.height - edgeThreshold) {
                this.cameraY += scrollSpeed;
            }

            // No limits - unlimited workspace!
        }

        // Keyboard camera controls for unlimited workspace
        if (this.mode === 'build' || this.mode === 'delete') {
            const keyScrollSpeed = 10;
            if (this.keys['arrowleft'] || this.keys['a']) {
                this.cameraX -= keyScrollSpeed;
            }
            if (this.keys['arrowright'] || this.keys['d']) {
                this.cameraX += keyScrollSpeed;
            }
            if (this.keys['arrowup'] || this.keys['w']) {
                this.cameraY -= keyScrollSpeed;
            }
            if (this.keys['arrowdown'] || this.keys['s']) {
                this.cameraY += keyScrollSpeed;
            }
        }

        // Apply camera transform in play mode or build/delete modes (unlimited workspace)
        if (this.mode === 'play' || this.mode === 'build' || this.mode === 'delete') {
            this.ctx.translate(-this.cameraX, -this.cameraY);
        }

        // Draw grid in build and delete mode
        if (this.mode === 'build' || this.mode === 'delete') {
            this.drawGrid();
        }

        // Draw all objects
        for (let obj of this.objects) {
            this.drawObject(obj);
        }

        // Draw player in play mode (but not in first-person mode)
        if (this.mode === 'play' && !this.firstPersonMode) {
            this.drawPlayer();
        }

        // Restore context state
        this.ctx.restore();
    }

    gameLoop() {
        if (this.mode === 'play') {
            this.updatePlayer();
        }

        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    async saveWorld() {
        const worldName = await promptDialog('Enter a name for your world:', 'My World');
        if (!worldName) return;

        const worldData = {
            name: worldName,
            objects: this.objects,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };

        // Save to localStorage
        const savedWorlds = this.getSavedWorlds();
        savedWorlds.push(worldData);
        localStorage.setItem('creator-saved-worlds', JSON.stringify(savedWorlds));

        // Also download as file
        const dataStr = JSON.stringify(worldData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${worldName}-${Date.now()}.json`;
        link.click();

        URL.revokeObjectURL(url);

        toast('World saved successfully!');
    }

    getSavedWorlds() {
        const savedWorlds = localStorage.getItem('creator-saved-worlds');
        return savedWorlds ? JSON.parse(savedWorlds) : [];
    }

    loadWorld() {
        this.openLoadWorldsModal();
    }

    openLoadWorldsModal() {
        const modal = document.getElementById('load-worlds-modal');
        modal.classList.add('active');
        this.displaySavedWorlds();
    }

    closeLoadWorldsModal() {
        const modal = document.getElementById('load-worlds-modal');
        modal.classList.remove('active');
    }

    openAboutModal() {
        const modal = document.getElementById('about-modal');
        modal.classList.add('active');
    }

    closeAboutModal() {
        const modal = document.getElementById('about-modal');
        modal.classList.remove('active');
    }

    displaySavedWorlds() {
        const container = document.getElementById('saved-worlds-list');
        const savedWorlds = this.getSavedWorlds();

        if (savedWorlds.length === 0) {
            container.innerHTML = '<p class="no-worlds-message">No saved worlds found. Create and save a world to see it here!</p>';
            return;
        }

        container.innerHTML = '';

        // Sort by timestamp (newest first)
        savedWorlds.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        savedWorlds.forEach((world) => {
            const worldCard = document.createElement('div');
            worldCard.className = 'world-card';

            const worldInfo = document.createElement('div');
            worldInfo.className = 'world-info';

            const worldName = document.createElement('h3');
            worldName.textContent = world.name;
            worldName.className = 'world-name';

            const worldDate = document.createElement('p');
            const date = new Date(world.timestamp);
            worldDate.textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            worldDate.className = 'world-date';

            const worldBlocks = document.createElement('p');
            worldBlocks.textContent = `${world.objects.length} blocks`;
            worldBlocks.className = 'world-blocks';

            worldInfo.appendChild(worldName);
            worldInfo.appendChild(worldDate);
            worldInfo.appendChild(worldBlocks);

            const worldActions = document.createElement('div');
            worldActions.className = 'world-actions';

            const loadBtn = document.createElement('button');
            loadBtn.textContent = 'Load';
            loadBtn.className = 'world-action-btn load-btn';
            loadBtn.addEventListener('click', () => {
                this.loadSavedWorld(world);
            });

            const downloadBtn = document.createElement('button');
            downloadBtn.textContent = '⬇️';
            downloadBtn.className = 'world-action-btn download-btn';
            downloadBtn.title = 'Download';
            downloadBtn.addEventListener('click', () => {
                this.downloadWorld(world);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.className = 'world-action-btn delete-btn';
            deleteBtn.title = 'Delete';
            deleteBtn.addEventListener('click', () => {
                this.deleteSavedWorld(world.id);
            });

            worldActions.appendChild(loadBtn);
            worldActions.appendChild(downloadBtn);
            worldActions.appendChild(deleteBtn);

            worldCard.appendChild(worldInfo);
            worldCard.appendChild(worldActions);

            container.appendChild(worldCard);
        });
    }

    loadSavedWorld(world) {
        this.objects = world.objects || [];
        this.history = []; // Clear history when loading a world
        this.updateUndoButton();
        this.render();
        this.closeLoadWorldsModal();
        toast(`World "${world.name}" loaded!`);
    }

    downloadWorld(world) {
        const dataStr = JSON.stringify(world, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${world.name}-${world.id}.json`;
        link.click();

        URL.revokeObjectURL(url);
    }

    async deleteSavedWorld(worldId) {
        if (!await confirmDialog('Are you sure you want to delete this world?')) return;

        const savedWorlds = this.getSavedWorlds();
        const filtered = savedWorlds.filter(w => w.id !== worldId);
        localStorage.setItem('creator-saved-worlds', JSON.stringify(filtered));
        this.displaySavedWorlds();
    }

    loadWorldFromFile() {
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
                    this.history = []; // Clear history when loading from file
                    this.updateUndoButton();
                    this.render();
                    this.closeLoadWorldsModal();
                    toast('World loaded!');
                } catch (error) {
                    toast('Error loading world file!');
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
            toast('Share link copied to clipboard!');
        }).catch(() => {
            // Fallback: show the URL
            promptDialog('Share this link:', shareUrl);
        });
    }

    async clearWorld() {
        if (await confirmDialog('Clear your entire world?')) {
            this.saveToHistory();
            this.objects = [];
            this.render();
        }
    }

    saveToHistory() {
        // Create a deep copy of the current objects array
        const stateCopy = JSON.parse(JSON.stringify(this.objects));
        this.history.push(stateCopy);

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }

        this.updateUndoButton();
    }

    undo() {
        if (this.history.length === 0) return;

        // Restore the previous state
        this.objects = this.history.pop();
        this.render();
        this.updateUndoButton();
    }

    updateUndoButton() {
        const undoBtn = document.getElementById('undo-btn');
        if (this.history.length > 0) {
            undoBtn.disabled = false;
        } else {
            undoBtn.disabled = true;
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
                toast('Shared world loaded!');
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

    async deleteCustomShape(index) {
        if (await confirmDialog('Delete this custom shape?')) {
            this.customShapes.splice(index, 1);
            this.renderCustomShapes();
        }
    }

    toggleTheme() {
        const body = document.body;
        const isDark = body.classList.contains('dark-mode');
        const themeToggle = document.getElementById('theme-toggle');

        if (isDark) {
            body.classList.remove('dark-mode');
            themeToggle.textContent = '🌙';
            localStorage.setItem('creator-theme', 'light');
        } else {
            body.classList.add('dark-mode');
            themeToggle.textContent = '☀️';
            localStorage.setItem('creator-theme', 'dark');
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('creator-theme');
        const themeToggle = document.getElementById('theme-toggle');

        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.textContent = '☀️';
        } else {
            themeToggle.textContent = '🌙';
        }
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new CreatorGame();
    game.loadSharedWorld();
});
