import { toast, confirmDialog, promptDialog } from './notify.js';

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
        this.gridSize = 16;
        this.cellSize = 25;

        // Set canvas size explicitly
        this.canvas.width = this.gridSize * this.cellSize;
        this.canvas.height = this.gridSize * this.cellSize;
        // Also set style to prevent scaling
        this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.style.height = this.canvas.height + 'px';

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
                // Turn off eraser
                this.eraserMode = false;
                const eraserBtn = document.getElementById('eraser-btn');
                if (eraserBtn) eraserBtn.classList.remove('active');
                // Sync the color picker
                const picker = document.getElementById('builder-color-picker');
                const preview = document.getElementById('builder-color-preview');
                if (picker) picker.value = btn.dataset.color;
                if (preview) preview.style.background = btn.dataset.color;
            });
        });

        // Custom color picker
        const colorPicker = document.getElementById('builder-color-picker');
        const colorPreview = document.getElementById('builder-color-preview');
        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => {
                this.selectedColor = e.target.value;
                if (colorPreview) colorPreview.style.background = e.target.value;
                // Deselect preset buttons and turn off eraser
                document.querySelectorAll('.builder-color-btn').forEach(b => b.classList.remove('active'));
                this.eraserMode = false;
                const eraserBtn = document.getElementById('eraser-btn');
                if (eraserBtn) eraserBtn.classList.remove('active');
            });
        }

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

        // Eraser toggle
        this.eraserMode = false;
        document.getElementById('eraser-btn').addEventListener('click', () => {
            this.eraserMode = !this.eraserMode;
            document.getElementById('eraser-btn').classList.toggle('active', this.eraserMode);
            if (this.eraserMode) {
                document.querySelectorAll('.builder-color-btn').forEach(b => b.classList.remove('active'));
            }
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

        // Load template button
        document.getElementById('load-character-template').addEventListener('click', () => {
            this.openLoadTemplateModal();
        });

        document.getElementById('close-load-character').addEventListener('click', () => {
            this.closeLoadTemplateModal();
        });

        document.getElementById('load-character-from-file').addEventListener('click', () => {
            this.loadTemplateFromFile();
        });
    }

    paint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.cellSize);
        const y = Math.floor((e.clientY - rect.top) / this.cellSize);

        if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
            this.grid[y][x] = this.eraserMode ? null : this.selectedColor;
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

    async deleteFrame() {
        if (this.frames.length <= 1) {
            toast('You must have at least one frame!');
            return;
        }

        if (await confirmDialog('Delete this frame?')) {
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

    async saveCharacter() {
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
            toast('Please draw your character first!');
            return;
        }

        // Ask if user wants to save as template
        const saveAsTemplate = await confirmDialog('Save this character as a template for future use?');

        if (saveAsTemplate) {
            const templateName = await promptDialog('Enter a name for your character template:', 'My Character');
            if (templateName) {
                const templateData = {
                    name: templateName,
                    frames: this.frames,
                    timestamp: new Date().toISOString(),
                    id: Date.now()
                };

                const savedTemplates = this.getSavedTemplates();
                savedTemplates.push(templateData);
                localStorage.setItem('creator-character-templates', JSON.stringify(savedTemplates));

                // Also download as file
                const dataStr = JSON.stringify(templateData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);

                const link = document.createElement('a');
                link.href = url;
                link.download = `${templateName}-${Date.now()}.json`;
                link.click();

                URL.revokeObjectURL(url);
            }
        }

        // Save all animation frames to player
        this.game.player.animationFrames = JSON.parse(JSON.stringify(this.frames));
        this.game.player.customGrid = this.frames[0]; // Keep first frame for compatibility
        this.game.player.width = (maxX - minX + 1) * 4; // Scale up by 4
        this.game.player.height = (maxY - minY + 1) * 4;
        this.game.player.isCustom = true;
        this.game.player.currentAnimationFrame = 0;
        this.game.player.animationSpeed = 0.15; // Frames per update

        this.closeCustomizer();
        const frameText = this.frames.length > 1 ? ` with ${this.frames.length} animation frames` : '';
        toast(`Character saved${frameText}!`);
    }

    async saveTemplate() {
        let hasBlocks = false;
        for (const frame of this.frames) {
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    if (frame[y][x]) {
                        hasBlocks = true;
                        break;
                    }
                }
                if (hasBlocks) break;
            }
            if (hasBlocks) break;
        }

        if (!hasBlocks) {
            toast('Please draw your character first!');
            return;
        }

        const templateName = await promptDialog('Enter a name for your character template:', 'My Character');
        if (!templateName) return;

        const templateData = {
            name: templateName,
            frames: this.frames,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };

        const savedTemplates = this.getSavedTemplates();
        savedTemplates.push(templateData);
        localStorage.setItem('creator-character-templates', JSON.stringify(savedTemplates));

        // Also download as file
        const dataStr = JSON.stringify(templateData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${templateName}-${Date.now()}.json`;
        link.click();

        URL.revokeObjectURL(url);

        toast('Character template saved!');
    }

    getSavedTemplates() {
        const savedTemplates = localStorage.getItem('creator-character-templates');
        return savedTemplates ? JSON.parse(savedTemplates) : [];
    }

    openLoadTemplateModal() {
        const modal = document.getElementById('load-character-modal');
        modal.classList.add('active');
        this.displaySavedTemplates();
    }

    closeLoadTemplateModal() {
        const modal = document.getElementById('load-character-modal');
        modal.classList.remove('active');
    }

    displaySavedTemplates() {
        const container = document.getElementById('saved-characters-list');
        const savedTemplates = this.getSavedTemplates();

        if (savedTemplates.length === 0) {
            container.innerHTML = '<p class="no-worlds-message">No saved character templates found. Create and save a character to see it here!</p>';
            return;
        }

        container.innerHTML = '';

        // Sort by timestamp (newest first)
        savedTemplates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        savedTemplates.forEach((template) => {
            const templateCard = document.createElement('div');
            templateCard.className = 'world-card';

            const templateInfo = document.createElement('div');
            templateInfo.className = 'world-info';

            const templateName = document.createElement('h3');
            templateName.textContent = template.name;
            templateName.className = 'world-name';

            const templateDate = document.createElement('p');
            const date = new Date(template.timestamp);
            templateDate.textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            templateDate.className = 'world-date';

            const templateFrames = document.createElement('p');
            templateFrames.textContent = `${template.frames.length} frame${template.frames.length !== 1 ? 's' : ''}`;
            templateFrames.className = 'world-blocks';

            templateInfo.appendChild(templateName);
            templateInfo.appendChild(templateDate);
            templateInfo.appendChild(templateFrames);

            const templateActions = document.createElement('div');
            templateActions.className = 'world-actions';

            const loadBtn = document.createElement('button');
            loadBtn.textContent = 'Load';
            loadBtn.className = 'world-action-btn load-btn';
            loadBtn.addEventListener('click', () => {
                this.loadSavedTemplate(template);
            });

            const downloadBtn = document.createElement('button');
            downloadBtn.textContent = '⬇️';
            downloadBtn.className = 'world-action-btn download-btn';
            downloadBtn.title = 'Download';
            downloadBtn.addEventListener('click', () => {
                this.downloadTemplate(template);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.className = 'world-action-btn delete-btn';
            deleteBtn.title = 'Delete';
            deleteBtn.addEventListener('click', () => {
                this.deleteTemplate(template.id);
            });

            templateActions.appendChild(loadBtn);
            templateActions.appendChild(downloadBtn);
            templateActions.appendChild(deleteBtn);

            templateCard.appendChild(templateInfo);
            templateCard.appendChild(templateActions);

            container.appendChild(templateCard);
        });
    }

    loadSavedTemplate(template) {
        this.frames = JSON.parse(JSON.stringify(template.frames));
        this.currentFrameIndex = 0;
        this.grid = this.frames[0];
        this.updateFrameIndicator();
        this.render();
        this.closeLoadTemplateModal();
        toast(`Template "${template.name}" loaded!`);
    }

    downloadTemplate(template) {
        const dataStr = JSON.stringify(template, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${template.name}-${template.id}.json`;
        link.click();

        URL.revokeObjectURL(url);
    }

    async deleteTemplate(templateId) {
        if (!await confirmDialog('Delete this character template?')) return;

        const savedTemplates = this.getSavedTemplates();
        const filtered = savedTemplates.filter(t => t.id !== templateId);
        localStorage.setItem('creator-character-templates', JSON.stringify(filtered));
        this.displaySavedTemplates();
    }

    loadTemplateFromFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const templateData = JSON.parse(event.target.result);
                    this.frames = JSON.parse(JSON.stringify(templateData.frames));
                    this.currentFrameIndex = 0;
                    this.grid = this.frames[0];
                    this.updateFrameIndicator();
                    this.render();
                    this.closeLoadTemplateModal();
                    toast('Character template loaded!');
                } catch (error) {
                    toast('Error loading template file!');
                }
            };

            reader.readAsText(file);
        };

        input.click();
    }
}
