// Custom Shape Editor
export class ShapeEditor {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('shape-editor-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 10;
        this.cellSize = 40;
        this.canvas.width = this.gridSize * this.cellSize;
        this.canvas.height = this.gridSize * this.cellSize;

        this.grid = Array(this.gridSize).fill(null).map(() =>
            Array(this.gridSize).fill(null)
        );
        this.currentColor = '#667eea';
        this.isDrawing = false;

        this.setupListeners();
        this.render();
    }

    setupListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDrawing = true;
            this.paint(e);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDrawing) {
                this.paint(e);
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDrawing = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDrawing = false;
        });

        document.getElementById('editor-color').addEventListener('change', (e) => {
            this.currentColor = e.target.value;
        });

        document.getElementById('clear-editor').addEventListener('click', () => {
            this.clear();
        });

        document.getElementById('save-custom-shape').addEventListener('click', () => {
            this.saveShape();
        });
    }

    paint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.cellSize);
        const y = Math.floor((e.clientY - rect.top) / this.cellSize);

        if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
            this.grid[y][x] = this.currentColor;
            this.render();
        }
    }

    clear() {
        this.grid = Array(this.gridSize).fill(null).map(() =>
            Array(this.gridSize).fill(null)
        );
        this.render();
    }

    render() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= this.gridSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(this.canvas.width, i * this.cellSize);
            this.ctx.stroke();
        }

        // Draw filled cells
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x]) {
                    this.ctx.fillStyle = this.grid[y][x];
                    this.ctx.fillRect(
                        x * this.cellSize + 1,
                        y * this.cellSize + 1,
                        this.cellSize - 2,
                        this.cellSize - 2
                    );
                }
            }
        }
    }

    saveShape() {
        const nameInput = document.getElementById('shape-name');
        const name = nameInput.value.trim() || 'Custom ' + (this.game.customShapes.length + 1);

        const customShape = {
            id: 'custom_' + Date.now(),
            name: name,
            grid: JSON.parse(JSON.stringify(this.grid))
        };

        this.game.customShapes.push(customShape);
        this.game.renderCustomShapes();
        this.closeEditor();
        nameInput.value = '';
    }

    closeEditor() {
        document.getElementById('custom-editor-modal').classList.remove('active');
        this.clear();
    }

    openEditor() {
        document.getElementById('custom-editor-modal').classList.add('active');
        this.clear();
    }
}

// Character Builder
export class CharacterCustomizer {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('character-builder-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 10;
        this.cellSize = 20;
        this.canvas.width = this.gridSize * this.cellSize;
        this.canvas.height = this.gridSize * this.cellSize;

        this.frames = [Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null))];
        this.currentFrameIndex = 0;
        this.grid = this.frames[0];
        this.selectedColor = '#FF6B6B';
        this.isDrawing = false;

        // Undo history for character builder
        this.history = [];
        this.maxHistorySize = 30;

        this.setupListeners();
    }

    setupListeners() {
        // Color selection
        document.querySelectorAll('.builder-color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.builder-color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedColor = btn.dataset.color;
            });
        });

        // Canvas drawing
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDrawing = true;
            this.saveToHistory(); // Save before starting to draw
            this.paint(e);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDrawing) {
                this.paint(e);
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDrawing = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDrawing = false;
        });

        // Right-click to erase
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.cellSize);
            const y = Math.floor((e.clientY - rect.top) / this.cellSize);

            if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
                this.grid[y][x] = null;
                this.render();
            }
        });

        // Clear button
        document.getElementById('clear-character-builder').addEventListener('click', () => {
            this.clear();
        });

        // Use default button
        document.getElementById('use-default-character').addEventListener('click', () => {
            this.useDefault();
        });

        // Save button
        document.getElementById('save-character').addEventListener('click', () => {
            this.saveCharacter();
        });

        // Close button
        document.getElementById('close-character-customizer').addEventListener('click', () => {
            this.closeCustomizer();
        });

        // Animation frame controls
        document.getElementById('prev-frame-btn').addEventListener('click', () => {
            this.previousFrame();
        });

        document.getElementById('next-frame-btn').addEventListener('click', () => {
            this.nextFrame();
        });

        document.getElementById('add-frame-btn').addEventListener('click', () => {
            this.addFrame();
        });

        document.getElementById('delete-frame-btn').addEventListener('click', () => {
            this.deleteFrame();
        });

        // Undo button
        document.getElementById('undo-character-btn').addEventListener('click', () => {
            this.undo();
        });
    }

    paint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.cellSize);
        const y = Math.floor((e.clientY - rect.top) / this.cellSize);

        if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
            this.grid[y][x] = this.selectedColor;
            this.frames[this.currentFrameIndex] = this.grid;
            this.render();
        }
    }

    clear() {
        this.frames[this.currentFrameIndex] = Array(this.gridSize).fill(null).map(() =>
            Array(this.gridSize).fill(null)
        );
        this.grid = this.frames[this.currentFrameIndex];
        this.render();
    }

    useDefault() {
        this.clear();
        // Create a simple default character (similar to original)
        const color = '#FF1744';
        const eyeColor = '#FFFFFF';

        // Body (3x5)
        for (let y = 2; y < 7; y++) {
            for (let x = 3; x < 6; x++) {
                this.grid[y][x] = color;
            }
        }

        // Eyes
        this.grid[3][3] = eyeColor;
        this.grid[3][5] = eyeColor;
        this.grid[4][3] = '#000000';
        this.grid[4][5] = '#000000';

        this.render();
    }

    render() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= this.gridSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(this.canvas.width, i * this.cellSize);
            this.ctx.stroke();
        }

        // Draw filled cells
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x]) {
                    this.ctx.fillStyle = this.grid[y][x];
                    this.ctx.fillRect(
                        x * this.cellSize + 1,
                        y * this.cellSize + 1,
                        this.cellSize - 2,
                        this.cellSize - 2
                    );
                }
            }
        }
    }

    openCustomizer() {
        // Load current character if it exists
        if (this.game.player.animationFrames && this.game.player.animationFrames.length > 0) {
            this.frames = JSON.parse(JSON.stringify(this.game.player.animationFrames));
            this.currentFrameIndex = 0;
            this.grid = this.frames[0];
        } else if (this.game.player.customGrid) {
            this.frames = [JSON.parse(JSON.stringify(this.game.player.customGrid))];
            this.currentFrameIndex = 0;
            this.grid = this.frames[0];
        } else {
            this.frames = [Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null))];
            this.currentFrameIndex = 0;
            this.grid = this.frames[0];
            this.useDefault();
        }

        // Clear undo history when opening customizer
        this.history = [];
        this.updateUndoButton();

        document.getElementById('character-customizer-modal').classList.add('active');
        this.updateFrameIndicator();
        this.render();
    }

    closeCustomizer() {
        document.getElementById('character-customizer-modal').classList.remove('active');
    }

    previousFrame() {
        if (this.currentFrameIndex > 0) {
            this.currentFrameIndex--;
            this.grid = this.frames[this.currentFrameIndex];
            this.updateFrameIndicator();
            this.render();
        }
    }

    nextFrame() {
        if (this.currentFrameIndex < this.frames.length - 1) {
            this.currentFrameIndex++;
            this.grid = this.frames[this.currentFrameIndex];
            this.updateFrameIndicator();
            this.render();
        }
    }

    addFrame() {
        // Create a copy of the current frame as starting point
        const newFrame = JSON.parse(JSON.stringify(this.frames[this.currentFrameIndex]));
        this.frames.push(newFrame);
        this.currentFrameIndex = this.frames.length - 1;
        this.grid = this.frames[this.currentFrameIndex];
        this.updateFrameIndicator();
        this.render();
    }

    deleteFrame() {
        if (this.frames.length <= 1) {
            alert('You must have at least one frame!');
            return;
        }

        if (confirm('Delete this frame?')) {
            this.frames.splice(this.currentFrameIndex, 1);
            if (this.currentFrameIndex >= this.frames.length) {
                this.currentFrameIndex = this.frames.length - 1;
            }
            this.grid = this.frames[this.currentFrameIndex];
            this.updateFrameIndicator();
            this.render();
        }
    }

    saveToHistory() {
        const stateCopy = {
            frames: JSON.parse(JSON.stringify(this.frames)),
            currentFrameIndex: this.currentFrameIndex
        };
        this.history.push(stateCopy);
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
        this.updateUndoButton();
    }

    undo() {
        if (this.history.length === 0) return;
        const previousState = this.history.pop();
        this.frames = previousState.frames;
        this.currentFrameIndex = previousState.currentFrameIndex;
        this.grid = this.frames[this.currentFrameIndex];
        this.updateFrameIndicator();
        this.updateUndoButton();
        this.render();
    }

    updateUndoButton() {
        const undoBtn = document.getElementById('undo-character-btn');
        if (undoBtn) {
            undoBtn.disabled = this.history.length === 0;
        }
    }

    updateFrameIndicator() {
        const indicator = document.getElementById('frame-indicator');
        indicator.textContent = `Frame ${this.currentFrameIndex + 1} of ${this.frames.length}`;

        const prevBtn = document.getElementById('prev-frame-btn');
        const nextBtn = document.getElementById('next-frame-btn');

        prevBtn.disabled = this.currentFrameIndex === 0;
        nextBtn.disabled = this.currentFrameIndex === this.frames.length - 1;
    }

    saveCharacter() {
        // Calculate bounding box from all frames
        let minX = this.gridSize, maxX = 0, minY = this.gridSize, maxY = 0;
        let hasBlocks = false;

        for (const frame of this.frames) {
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    if (frame[y][x]) {
                        hasBlocks = true;
                        minX = Math.min(minX, x);
                        maxX = Math.max(maxX, x);
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                    }
                }
            }
        }

        if (!hasBlocks) {
            alert('Please draw your character first!');
            return;
        }

        // Save all animation frames
        this.game.player.animationFrames = JSON.parse(JSON.stringify(this.frames));
        this.game.player.customGrid = this.frames[0]; // Keep first frame for compatibility
        this.game.player.width = (maxX - minX + 1) * 4; // Scale up by 4
        this.game.player.height = (maxY - minY + 1) * 4;
        this.game.player.isCustom = true;
        this.game.player.currentAnimationFrame = 0;
        this.game.player.animationSpeed = 0.15; // Frames per update

        this.closeCustomizer();
        const frameText = this.frames.length > 1 ? ` with ${this.frames.length} animation frames` : '';
        alert(`Character saved successfully${frameText}!`);
    }
}
