// Dog Customization System

export const CUSTOMIZATION_ITEMS = {
    colors: [
        { id: 'red', name: 'Red', color: '#FF6B6B', rarity: 'common', unlocked: true },
        { id: 'teal', name: 'Teal', color: '#4ECDC4', rarity: 'common', unlocked: true },
        { id: 'blue', name: 'Blue', color: '#45B7D1', rarity: 'common', unlocked: true },
        { id: 'coral', name: 'Coral', color: '#FFA07A', rarity: 'common', unlocked: false },
        { id: 'pink', name: 'Pink', color: '#FFB6C1', rarity: 'common', unlocked: false },
        { id: 'green', name: 'Green', color: '#90EE90', rarity: 'common', unlocked: false },
        { id: 'orange', name: 'Orange', color: '#FFA500', rarity: 'common', unlocked: false },
        { id: 'lavender', name: 'Lavender', color: '#E6E6FA', rarity: 'common', unlocked: false },
        { id: 'mint', name: 'Mint', color: '#98D8C8', rarity: 'rare', unlocked: false },
        { id: 'yellow', name: 'Yellow', color: '#F7DC6F', rarity: 'rare', unlocked: false },
        { id: 'purple', name: 'Purple', color: '#BB8FCE', rarity: 'rare', unlocked: false },
        { id: 'skyblue', name: 'Sky Blue', color: '#85C1E2', rarity: 'rare', unlocked: false },
        { id: 'hotpink', name: 'Hot Pink', color: '#FF69B4', rarity: 'rare', unlocked: false },
        { id: 'lime', name: 'Lime', color: '#00FF00', rarity: 'rare', unlocked: false },
        { id: 'cyan', name: 'Cyan', color: '#00FFFF', rarity: 'rare', unlocked: false },
        { id: 'magenta', name: 'Magenta', color: '#FF00FF', rarity: 'epic', unlocked: false },
        { id: 'silver', name: 'Silver', color: '#C0C0C0', rarity: 'epic', unlocked: false },
        { id: 'gold', name: 'Gold', color: '#FFD700', rarity: 'epic', unlocked: false },
        { id: 'rose', name: 'Rose Gold', color: '#B76E79', rarity: 'epic', unlocked: false },
        { id: 'rainbow', name: 'Rainbow', color: 'rainbow', rarity: 'legendary', unlocked: false },
        { id: 'galaxy', name: 'Galaxy', color: '#4B0082', rarity: 'legendary', unlocked: false }
    ],

    hats: [
        { id: 'none', name: 'None', icon: '❌', rarity: 'common', unlocked: true },
        { id: 'beanie', name: 'Beanie', icon: '🧢', rarity: 'common', unlocked: false },
        { id: 'cap', name: 'Baseball Cap', icon: '🧢', rarity: 'common', unlocked: false },
        { id: 'party', name: 'Party Hat', icon: '🎉', rarity: 'rare', unlocked: false },
        { id: 'tophat', name: 'Top Hat', icon: '🎩', rarity: 'rare', unlocked: false },
        { id: 'cowboy', name: 'Cowboy', icon: '🤠', rarity: 'rare', unlocked: false },
        { id: 'pirate', name: 'Pirate Hat', icon: '🏴‍☠️', rarity: 'rare', unlocked: false },
        { id: 'santa', name: 'Santa Hat', icon: '🎅', rarity: 'rare', unlocked: false },
        { id: 'chef', name: 'Chef Hat', icon: '👨‍🍳', rarity: 'rare', unlocked: false },
        { id: 'crown', name: 'Crown', icon: '👑', rarity: 'epic', unlocked: false },
        { id: 'wizard', name: 'Wizard', icon: '🧙', rarity: 'epic', unlocked: false },
        { id: 'ninja', name: 'Ninja', icon: '🥷', rarity: 'epic', unlocked: false },
        { id: 'viking', name: 'Viking', icon: '⚔️', rarity: 'epic', unlocked: false },
        { id: 'halo', name: 'Halo', icon: '😇', rarity: 'legendary', unlocked: false },
        { id: 'alien', name: 'Alien', icon: '👽', rarity: 'legendary', unlocked: false }
    ],

    accessories: [
        { id: 'none', name: 'None', icon: '❌', rarity: 'common', unlocked: true },
        { id: 'bowtie', name: 'Bow Tie', icon: '🎀', rarity: 'common', unlocked: false },
        { id: 'scarf', name: 'Scarf', icon: '🧣', rarity: 'common', unlocked: false },
        { id: 'necktie', name: 'Necktie', icon: '👔', rarity: 'common', unlocked: false },
        { id: 'glasses', name: 'Sunglasses', icon: '😎', rarity: 'rare', unlocked: false },
        { id: 'bandana', name: 'Bandana', icon: '🧣', rarity: 'rare', unlocked: false },
        { id: 'necklace', name: 'Necklace', icon: '📿', rarity: 'rare', unlocked: false },
        { id: 'flower', name: 'Flower', icon: '🌸', rarity: 'rare', unlocked: false },
        { id: 'mask', name: 'Mask', icon: '🎭', rarity: 'rare', unlocked: false },
        { id: 'monocle', name: 'Monocle', icon: '🧐', rarity: 'epic', unlocked: false },
        { id: 'collar', name: 'Gold Collar', icon: '⭐', rarity: 'epic', unlocked: false },
        { id: 'medal', name: 'Medal', icon: '🏅', rarity: 'epic', unlocked: false },
        { id: 'cape', name: 'Cape', icon: '🦸', rarity: 'epic', unlocked: false },
        { id: 'wings', name: 'Wings', icon: '🦋', rarity: 'legendary', unlocked: false },
        { id: 'rocket', name: 'Rocket Pack', icon: '🚀', rarity: 'legendary', unlocked: false }
    ],

    patterns: [
        { id: 'none', name: 'Solid', icon: '▪️', rarity: 'common', unlocked: true },
        { id: 'spots', name: 'Spots', icon: '🔘', rarity: 'common', unlocked: false },
        { id: 'dots', name: 'Polka Dots', icon: '⚪', rarity: 'common', unlocked: false },
        { id: 'stripes', name: 'Stripes', icon: '〰️', rarity: 'rare', unlocked: false },
        { id: 'zigzag', name: 'Zigzag', icon: '📐', rarity: 'rare', unlocked: false },
        { id: 'checkers', name: 'Checkers', icon: '⬛', rarity: 'rare', unlocked: false },
        { id: 'sparkle', name: 'Sparkle', icon: '✨', rarity: 'epic', unlocked: false },
        { id: 'flames', name: 'Flames', icon: '🔥', rarity: 'epic', unlocked: false },
        { id: 'stars', name: 'Stars', icon: '⭐', rarity: 'epic', unlocked: false },
        { id: 'glow', name: 'Glow', icon: '💫', rarity: 'legendary', unlocked: false },
        { id: 'lightning', name: 'Lightning', icon: '⚡', rarity: 'legendary', unlocked: false }
    ],

    trails: [
        { id: 'none', name: 'None', icon: '❌', rarity: 'common', unlocked: true },
        { id: 'smoke', name: 'Smoke', icon: '💨', rarity: 'common', unlocked: false },
        { id: 'bubbles', name: 'Bubbles', icon: '🫧', rarity: 'common', unlocked: false },
        { id: 'confetti', name: 'Confetti', icon: '🎊', rarity: 'common', unlocked: false },
        { id: 'fire', name: 'Fire', icon: '🔥', rarity: 'rare', unlocked: false },
        { id: 'ice', name: 'Ice', icon: '❄️', rarity: 'rare', unlocked: false },
        { id: 'hearts', name: 'Hearts', icon: '💖', rarity: 'rare', unlocked: false },
        { id: 'leaves', name: 'Leaves', icon: '🍃', rarity: 'rare', unlocked: false },
        { id: 'electric', name: 'Electric', icon: '⚡', rarity: 'rare', unlocked: false },
        { id: 'rainbow', name: 'Rainbow', icon: '🌈', rarity: 'epic', unlocked: false },
        { id: 'stars', name: 'Stars', icon: '⭐', rarity: 'epic', unlocked: false },
        { id: 'sakura', name: 'Sakura', icon: '🌸', rarity: 'epic', unlocked: false },
        { id: 'neon', name: 'Neon', icon: '💡', rarity: 'epic', unlocked: false },
        { id: 'cosmic', name: 'Cosmic', icon: '🌌', rarity: 'legendary', unlocked: false },
        { id: 'aurora', name: 'Aurora', icon: '🌠', rarity: 'legendary', unlocked: false }
    ]
};

export class CustomizationSystem {
    constructor(game) {
        this.game = game;
        this.coins = this.loadCoins();
        this.inventory = this.loadInventory();
        this.currentCustomization = this.loadCustomization();
        this.previewCanvas = null;
        this.previewCtx = null;
        this.selectedStarterItem = null;
        this.isAdmin = false;

        this.checkAdminStatus();
        this.setupEventListeners();
        this.updateCoinDisplay();
        this.checkFirstTimePlayer();
    }

    async checkAdminStatus() {
        try {
            const token = localStorage.getItem('site_token');
            if (!token) return;
            const API_BASE = window.location.hostname === 'localhost'
                ? 'http://localhost:3003/api/site-auth'
                : 'https://ai-rp-studio.fly.dev/api/site-auth';
            const res = await fetch(API_BASE + '/me', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.is_admin) {
                this.isAdmin = true;
                this.populateCustomizationOptions();
            }
        } catch {}
    }

    setupEventListeners() {
        // Pack opening
        document.getElementById('open-pack-btn').addEventListener('click', () => {
            this.openPackModal();
        });

        document.getElementById('close-pack').addEventListener('click', () => {
            this.closePackModal();
        });

        document.getElementById('open-pack-anim-btn').addEventListener('click', () => {
            this.openPack();
        });

        document.getElementById('pack-okay-btn').addEventListener('click', () => {
            this.closePackModal();
        });

        // Customization
        document.getElementById('customize-btn').addEventListener('click', () => {
            this.openCustomizeModal();
        });

        document.getElementById('close-customize').addEventListener('click', () => {
            this.closeCustomizeModal();
        });

        document.getElementById('save-customization-btn').addEventListener('click', () => {
            this.saveCustomization();
            this.closeCustomizeModal();
        });

        // Starter pack
        document.getElementById('claim-starter-btn').addEventListener('click', () => {
            this.claimStarterItem();
        });
    }

    loadCoins() {
        const saved = localStorage.getItem('puppycontrol-coins');
        return saved ? parseInt(saved) : 100;
    }

    saveCoins() {
        localStorage.setItem('puppycontrol-coins', this.coins.toString());
        this.updateCoinDisplay();
    }

    updateCoinDisplay() {
        document.getElementById('coin-amount').textContent = this.coins;
    }

    loadInventory() {
        const saved = localStorage.getItem('puppycontrol-inventory');
        if (saved) {
            return JSON.parse(saved);
        }

        // Default unlocked items
        const defaultInventory = {};
        for (const category in CUSTOMIZATION_ITEMS) {
            defaultInventory[category] = CUSTOMIZATION_ITEMS[category]
                .filter(item => item.unlocked)
                .map(item => item.id);
        }
        return defaultInventory;
    }

    saveInventory() {
        localStorage.setItem('puppycontrol-inventory', JSON.stringify(this.inventory));
    }

    loadCustomization() {
        const saved = localStorage.getItem('puppycontrol-customization');
        return saved ? JSON.parse(saved) : {
            color: 'red',
            hat: 'none',
            accessory: 'none',
            pattern: 'none',
            trail: 'none'
        };
    }

    saveCustomization() {
        localStorage.setItem('puppycontrol-customization', JSON.stringify(this.currentCustomization));
    }

    openPackModal() {
        if (this.coins < 50) {
            alert('Not enough coins! You need 50 coins to open a pack.');
            return;
        }

        // Reset pack UI
        document.getElementById('pack-animation').style.display = 'block';
        document.getElementById('pack-results').style.display = 'none';
        document.getElementById('pack-items').innerHTML = '';

        document.getElementById('pack-modal').classList.add('active');
    }

    closePackModal() {
        document.getElementById('pack-modal').classList.remove('active');
    }

    openPack() {
        // Deduct coins
        this.coins -= 50;
        this.saveCoins();

        // Generate 3 random items
        const items = this.generatePackItems();

        // Hide animation, show results
        document.getElementById('pack-animation').style.display = 'none';
        document.getElementById('pack-results').style.display = 'block';

        // Display items
        const container = document.getElementById('pack-items');
        items.forEach((item, index) => {
            setTimeout(() => {
                const itemDiv = document.createElement('div');
                itemDiv.className = `pack-item ${item.rarity}`;
                itemDiv.innerHTML = `
                    <div class="pack-item-icon">${item.icon || '🎨'}</div>
                    <div class="pack-item-name">${item.name}</div>
                    <div class="pack-item-rarity ${item.rarity}">${item.rarity}</div>
                `;
                container.appendChild(itemDiv);
            }, index * 300);
        });

        // Add to inventory
        items.forEach(item => {
            if (!this.inventory[item.category].includes(item.id)) {
                this.inventory[item.category].push(item.id);
            }
        });
        this.saveInventory();
    }

    generatePackItems() {
        const items = [];
        const allItems = [];

        // Collect all items with their categories
        for (const category in CUSTOMIZATION_ITEMS) {
            CUSTOMIZATION_ITEMS[category].forEach(item => {
                allItems.push({ ...item, category });
            });
        }

        // Remove already unlocked defaults and items already in inventory
        const availableItems = allItems.filter(item => {
            return !CUSTOMIZATION_ITEMS[item.category].find(i => i.id === item.id && i.unlocked);
        });

        // Generate 3 items with rarity weights
        for (let i = 0; i < 3; i++) {
            const rarity = this.rollRarity();
            const rarityItems = availableItems.filter(item => item.rarity === rarity);

            if (rarityItems.length > 0) {
                const randomItem = rarityItems[Math.floor(Math.random() * rarityItems.length)];
                items.push(randomItem);
            } else {
                // Fallback to any available item
                const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                items.push(randomItem);
            }
        }

        return items;
    }

    rollRarity() {
        const roll = Math.random() * 100;
        if (roll < 1) return 'legendary'; // 1%
        if (roll < 8) return 'epic'; // 7%
        if (roll < 30) return 'rare'; // 22%
        return 'common'; // 70%
    }

    openCustomizeModal() {
        document.getElementById('customize-modal').classList.add('active');

        // Setup preview canvas
        this.previewCanvas = document.getElementById('preview-canvas');
        this.previewCtx = this.previewCanvas.getContext('2d');

        // Populate options
        this.populateCustomizationOptions();
        this.drawPreview();
    }

    closeCustomizeModal() {
        document.getElementById('customize-modal').classList.remove('active');
    }

    populateCustomizationOptions() {
        // Colors
        const colorContainer = document.getElementById('color-options');
        colorContainer.innerHTML = '';
        CUSTOMIZATION_ITEMS.colors.forEach(color => {
            const unlocked = this.isAdmin || this.inventory.colors.includes(color.id);
            const item = document.createElement('div');
            item.className = `option-item ${this.currentCustomization.color === color.id ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`;
            item.innerHTML = `
                <div class="option-icon" style="background: ${color.color}; width: 30px; height: 30px; border-radius: 50%; margin: 0 auto;"></div>
                <div class="option-name">${color.name}</div>
            `;
            if (unlocked) {
                item.addEventListener('click', () => this.selectOption('color', color.id));
            }
            colorContainer.appendChild(item);
        });

        // Hats
        this.populateCategory('hat-options', 'hats', 'hat');

        // Accessories
        this.populateCategory('accessory-options', 'accessories', 'accessory');

        // Patterns
        this.populateCategory('pattern-options', 'patterns', 'pattern');

        // Trails
        this.populateCategory('trail-options', 'trails', 'trail');
    }

    populateCategory(containerId, categoryKey, customizationKey) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        CUSTOMIZATION_ITEMS[categoryKey].forEach(item => {
            const unlocked = this.isAdmin || this.inventory[categoryKey].includes(item.id);
            const optionDiv = document.createElement('div');
            optionDiv.className = `option-item ${this.currentCustomization[customizationKey] === item.id ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`;
            optionDiv.innerHTML = `
                <div class="option-icon">${item.icon}</div>
                <div class="option-name">${item.name}</div>
            `;
            if (unlocked) {
                optionDiv.addEventListener('click', () => this.selectOption(customizationKey, item.id));
            }
            container.appendChild(optionDiv);
        });
    }

    selectOption(category, id) {
        this.currentCustomization[category] = id;
        this.populateCustomizationOptions();
        this.drawPreview();
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

    drawPreview() {
        const ctx = this.previewCtx;
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 200, 200);

        const colorItem = CUSTOMIZATION_ITEMS.colors.find(c => c.id === this.currentCustomization.color);
        const color = colorItem ? colorItem.color : '#FF6B6B';
        const darker = this.darkenColor(color, 20);
        const darkPaw = this.darkenColor(color, 40);

        // Draw a cute dog centered in the 200x200 canvas
        const cx = 100, cy = 105;

        // Tail (starts from back of body)
        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 42, cy);
        ctx.quadraticCurveTo(cx - 60, cy - 15, cx - 52, cy - 35);
        ctx.stroke();
        ctx.lineCap = 'butt';

        // Tail tip
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(cx - 52, cy - 37, 7, 0, Math.PI * 2);
        ctx.fill();

        // Body (rounded rectangle)
        ctx.fillStyle = color;
        const bx = cx - 45, by = cy - 15, bw = 90, bh = 55;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 12);
        ctx.fill();

        // Legs
        ctx.fillStyle = color;
        ctx.fillRect(cx - 32, cy + 35, 14, 25);
        ctx.fillRect(cx + 18, cy + 35, 14, 25);
        // Back legs (slightly behind)
        ctx.fillStyle = darker;
        ctx.fillRect(cx - 22, cy + 32, 12, 22);
        ctx.fillRect(cx + 10, cy + 32, 12, 22);

        // Paws
        ctx.fillStyle = darkPaw;
        ctx.beginPath();
        ctx.roundRect(cx - 34, cy + 57, 18, 8, 4);
        ctx.roundRect(cx + 16, cy + 57, 18, 8, 4);
        ctx.fill();

        // Head (big and round)
        const hx = cx + 30, hy = cy - 25;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(hx - 22, hy - 22, 52, 48, 14);
        ctx.fill();

        // Floppy ears (hanging down from sides of head)
        ctx.fillStyle = darker;
        // Left ear
        ctx.beginPath();
        ctx.ellipse(hx - 22, hy - 1, 9, 20, 0.4, 0, Math.PI * 2);
        ctx.fill();
        // Right ear
        ctx.beginPath();
        ctx.ellipse(hx + 30, hy - 1, 9, 20, -0.4, 0, Math.PI * 2);
        ctx.fill();

        // Inner ears
        ctx.fillStyle = this.darkenColor(color, 35);
        ctx.beginPath();
        ctx.ellipse(hx - 20, hy + 1, 5, 14, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(hx + 28, hy + 1, 5, 14, -0.4, 0, Math.PI * 2);
        ctx.fill();

        // Snout (lighter bump)
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.ellipse(hx + 4, hy + 10, 16, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(hx - 6, hy - 2, 9, 0, Math.PI * 2);
        ctx.arc(hx + 16, hy - 2, 9, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(hx - 3, hy - 1, 5, 0, Math.PI * 2);
        ctx.arc(hx + 19, hy - 1, 5, 0, Math.PI * 2);
        ctx.fill();

        // Eye shine
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(hx - 5, hy - 4, 2, 0, Math.PI * 2);
        ctx.arc(hx + 17, hy - 4, 2, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.ellipse(hx + 5, hy + 10, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose shine
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(hx + 4, hy + 8, 2, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx + 5, hy + 15);
        ctx.lineTo(hx + 5, hy + 18);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(hx - 1, hy + 18, 6, 0, Math.PI * 0.9);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(hx + 11, hy + 18, 6, Math.PI * 0.1, Math.PI);
        ctx.stroke();

        // Tongue
        ctx.fillStyle = '#ff8a9e';
        ctx.beginPath();
        ctx.ellipse(hx + 5, hy + 22, 4, 6, 0, 0, Math.PI);
        ctx.fill();

        // Pattern on body
        const pat = this.currentCustomization.pattern;
        if (pat === 'spots') {
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.arc(cx - 20, cy + 5, 8, 0, Math.PI * 2);
            ctx.arc(cx + 10, cy + 15, 10, 0, Math.PI * 2);
            ctx.arc(cx - 5, cy + 25, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (pat === 'dots') {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                ctx.arc(cx - 25 + i * 15, cy + 5 + (i % 2) * 15, 5, 0, Math.PI * 2);
            }
            ctx.fill();
        } else if (pat === 'stripes') {
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(bx + 10, by + 12 + i * 16, bw - 20, 5);
            }
        } else if (pat === 'sparkle') {
            ctx.font = '24px Arial';
            ctx.fillText('✨', cx - 30, cy + 10);
            ctx.fillText('✨', cx + 5, cy + 25);
        } else if (pat === 'flames') {
            ctx.font = '22px Arial';
            ctx.fillText('🔥', cx - 30, cy + 15);
            ctx.fillText('🔥', cx, cy + 25);
        } else if (pat === 'stars') {
            ctx.font = '18px Arial';
            ctx.fillText('⭐', cx - 30, cy + 5);
            ctx.fillText('⭐', cx - 5, cy + 20);
            ctx.fillText('⭐', cx + 15, cy + 8);
        }

        // Hat
        const hatItem = CUSTOMIZATION_ITEMS.hats.find(h => h.id === this.currentCustomization.hat);
        if (hatItem && hatItem.id !== 'none') {
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(hatItem.icon, hx + 4, hy - 28);
            ctx.textAlign = 'left';
        }

        // Accessory
        const accItem = CUSTOMIZATION_ITEMS.accessories.find(a => a.id === this.currentCustomization.accessory);
        if (accItem && accItem.id !== 'none') {
            ctx.font = 'bold 28px Arial';
            ctx.fillText(accItem.icon, hx - 10, hy + 40);
        }
    }

    getPlayerCustomization() {
        return this.currentCustomization;
    }

    checkFirstTimePlayer() {
        const hasClaimedStarter = localStorage.getItem('puppycontrol-starter-claimed');
        if (!hasClaimedStarter) {
            this.showStarterModal();
        }
    }

    showStarterModal() {
        document.getElementById('starter-modal').classList.add('active');
        this.populateStarterOptions();
    }

    populateStarterOptions() {
        // Starter hats (common and some rare ones)
        const starterHats = CUSTOMIZATION_ITEMS.hats.filter(h =>
            h.id !== 'none' && (h.rarity === 'common' || h.rarity === 'rare')
        ).slice(0, 4);

        const hatContainer = document.getElementById('starter-hats');
        hatContainer.innerHTML = '';
        starterHats.forEach(hat => {
            const item = document.createElement('div');
            item.className = 'starter-item';
            item.innerHTML = `
                <div class="starter-item-icon">${hat.icon}</div>
                <div class="starter-item-name">${hat.name}</div>
            `;
            item.addEventListener('click', () => this.selectStarterItem('hats', hat.id, item));
            hatContainer.appendChild(item);
        });

        // Starter trails (common and some rare ones)
        const starterTrails = CUSTOMIZATION_ITEMS.trails.filter(t =>
            t.id !== 'none' && (t.rarity === 'common' || t.rarity === 'rare')
        ).slice(0, 4);

        const trailContainer = document.getElementById('starter-trails');
        trailContainer.innerHTML = '';
        starterTrails.forEach(trail => {
            const item = document.createElement('div');
            item.className = 'starter-item';
            item.innerHTML = `
                <div class="starter-item-icon">${trail.icon}</div>
                <div class="starter-item-name">${trail.name}</div>
            `;
            item.addEventListener('click', () => this.selectStarterItem('trails', trail.id, item));
            trailContainer.appendChild(item);
        });

        // Starter patterns (common and some rare ones)
        const starterPatterns = CUSTOMIZATION_ITEMS.patterns.filter(p =>
            p.id !== 'none' && (p.rarity === 'common' || p.rarity === 'rare')
        ).slice(0, 4);

        const patternContainer = document.getElementById('starter-patterns');
        patternContainer.innerHTML = '';
        starterPatterns.forEach(pattern => {
            const item = document.createElement('div');
            item.className = 'starter-item';
            item.innerHTML = `
                <div class="starter-item-icon">${pattern.icon}</div>
                <div class="starter-item-name">${pattern.name}</div>
            `;
            item.addEventListener('click', () => this.selectStarterItem('patterns', pattern.id, item));
            patternContainer.appendChild(item);
        });
    }

    selectStarterItem(category, itemId, element) {
        // Remove selected class from all items
        document.querySelectorAll('.starter-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Add selected class to clicked item
        element.classList.add('selected');

        // Store selection
        this.selectedStarterItem = { category, itemId };

        // Enable claim button
        const claimBtn = document.getElementById('claim-starter-btn');
        claimBtn.disabled = false;
        claimBtn.textContent = 'Claim Your Item!';
    }

    claimStarterItem() {
        if (!this.selectedStarterItem) return;

        const { category, itemId } = this.selectedStarterItem;

        // Add to inventory
        if (!this.inventory[category].includes(itemId)) {
            this.inventory[category].push(itemId);
        }
        this.saveInventory();

        // Mark starter as claimed
        localStorage.setItem('puppycontrol-starter-claimed', 'true');

        // Close modal
        document.getElementById('starter-modal').classList.remove('active');

        // Show success message
        alert(`🎉 You got your ${CUSTOMIZATION_ITEMS[category].find(i => i.id === itemId).name}! Check the Customize menu to equip it!`);
    }
}
