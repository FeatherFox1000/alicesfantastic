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

        this.setupEventListeners();
        this.updateCoinDisplay();
        this.checkFirstTimePlayer();
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
            const unlocked = this.inventory.colors.includes(color.id);
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
            const unlocked = this.inventory[categoryKey].includes(item.id);
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

    drawPreview() {
        // Clear canvas
        this.previewCtx.fillStyle = '#f0f0f0';
        this.previewCtx.fillRect(0, 0, 200, 200);

        // Get current color
        const colorItem = CUSTOMIZATION_ITEMS.colors.find(c => c.id === this.currentCustomization.color);
        const color = colorItem ? colorItem.color : '#FF6B6B';

        // Draw simplified dog at center
        const x = 80;
        const y = 80;
        const scale = 2;

        // Body
        this.previewCtx.fillStyle = color;
        this.previewCtx.fillRect(x, y + 12 * scale, 40 * scale, 28 * scale);

        // Head
        this.previewCtx.fillRect(x + 22 * scale, y, 15 * scale, 15 * scale);

        // Apply pattern
        if (this.currentCustomization.pattern === 'spots') {
            this.previewCtx.fillStyle = 'rgba(0,0,0,0.3)';
            this.previewCtx.beginPath();
            this.previewCtx.arc(x + 10, y + 30, 5, 0, Math.PI * 2);
            this.previewCtx.arc(x + 50, y + 40, 6, 0, Math.PI * 2);
            this.previewCtx.arc(x + 30, y + 50, 4, 0, Math.PI * 2);
            this.previewCtx.fill();
        } else if (this.currentCustomization.pattern === 'sparkle') {
            this.previewCtx.fillStyle = '#FFD700';
            this.previewCtx.font = '20px Arial';
            this.previewCtx.fillText('✨', x + 5, y + 35);
            this.previewCtx.fillText('✨', x + 45, y + 50);
        }

        // Hat
        const hatItem = CUSTOMIZATION_ITEMS.hats.find(h => h.id === this.currentCustomization.hat);
        if (hatItem && hatItem.id !== 'none') {
            this.previewCtx.font = 'bold 30px Arial';
            this.previewCtx.fillText(hatItem.icon, x + 20, y - 5);
        }

        // Accessory
        const accItem = CUSTOMIZATION_ITEMS.accessories.find(a => a.id === this.currentCustomization.accessory);
        if (accItem && accItem.id !== 'none') {
            this.previewCtx.font = 'bold 25px Arial';
            this.previewCtx.fillText(accItem.icon, x + 25, y + 25);
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
