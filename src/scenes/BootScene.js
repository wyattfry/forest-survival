import Phaser from 'phaser';
import { loadWorld, writeWorld, listWorlds, loadCharacter } from '../SaveManager.js';

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1800;

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  init(data) {
    this.startMode = (data && data.mode) || 'new';
    this.worldId = data && data.worldId;
    this.worldName = (data && data.worldName) || 'World';

    if (this.startMode === 'load' && this.worldId) {
      const entry = listWorlds().find(w => w.id === this.worldId);
      this.peaceful = !!(entry && entry.peaceful);
    } else {
      this.peaceful = !!(data && data.peaceful);
    }

    const character = loadCharacter();
    this.characterName = character.name;
    this.characterColor = character.color;
    this.characterGender = character.gender;
    this.characterHair = character.hair;
  }

  preload() {}

  create() {
    this.cameras.main.setBackgroundColor('#2f5d3a');

    this.generateGroundTexture();
    this.generateTreeTextures();
    this.generateRockTextures();
    this.generatePlayerTexture();
    this.generateItemTextures();
    this.generateLavaTexture();
    this.generateWaterTexture();
    this.generateObsidianTexture();

    this.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 'ground')
      .setOrigin(0, 0);

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.scatterRocks();
    this.scatterTrees();
    this.scatterItems();
    this.createPlayer();

    this.setupCameraControls();
    this.setupInventory();
    this.setupToolUse();
    this.setupCombat();
    this.scatterPools();
    if (!this.peaceful) {
      this.spawnSkeletons();
    } else {
      this.skeletons = [];
      this.skeletonBases = [];
    }
    this.setupThrowing();
    this.setupDayNightCycle();
    this.setupSettingsMenu();

    if (this.startMode === 'load' && this.worldId) {
      this.applySaveData(loadWorld(this.worldId));
    }

    this.setupAutosave();
  }

  setupAutosave() {
    if (!this.worldId) return;

    this.time.addEvent({ delay: 15000, loop: true, callback: () => this.saveGame() });
    this.events.on('shutdown', () => this.saveGame());

    this.beforeUnloadHandler = () => this.saveGame();
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    this.events.once('shutdown', () => window.removeEventListener('beforeunload', this.beforeUnloadHandler));
  }

  saveGame() {
    if (!this.player || !this.worldId) return;

    writeWorld(this.worldId, {
      version: 1,
      player: { x: this.player.x, y: this.player.y },
      inventory: this.inventory,
      hotbar: this.hotbar,
      equippedItem: this.equippedItem,
      equippedArmor: this.equippedArmor,
      playerHp: this.playerHp,
      playerMaxHp: this.playerMaxHp,
      armorHpBonus: this.armorHpBonus,
      gameMode: this.gameMode,
      cycleElapsed: (this.time.now - this.cycleStartTime) % this.cycleLengthMs
    });
  }

  applySaveData(data) {
    if (!data) return;

    if (data.player) {
      this.player.setPosition(data.player.x, data.player.y);
      this.cameras.main.centerOn(data.player.x, data.player.y);
    }

    if (data.inventory) this.inventory = data.inventory;

    if (data.hotbar) {
      this.hotbar = data.hotbar;
      this.renderHotbar();
    }

    if (typeof data.playerMaxHp === 'number') this.playerMaxHp = data.playerMaxHp;
    if (typeof data.playerHp === 'number') this.playerHp = data.playerHp;
    if (typeof data.armorHpBonus === 'number') this.armorHpBonus = data.armorHpBonus;
    this.updateHpBar();

    if (data.equippedArmor) {
      this.equippedArmor = data.equippedArmor;
      this.updateArmorSprites();
    }

    if (data.equippedItem) {
      this.equippedItem = data.equippedItem;
      const def = this.itemDefs[this.equippedItem];
      if (def) {
        this.equippedSprite.setTexture(def.handIcon);
        this.equippedSprite.setVisible(true);
      }
    }

    if (data.gameMode === 'creative') {
      this.setGameMode('creative');
    }

    if (typeof data.cycleElapsed === 'number') {
      this.cycleStartTime = this.time.now - data.cycleElapsed;
    }
  }

  generatePlayerTexture() {
    const size = 40;
    const g = this.add.graphics();
    const cx = size / 2;
    const shirtColor = this.characterColor || 0x3f5fd6;
    const hairStyle = this.characterHair || 'short';

    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, size - 4, size * 0.5, size * 0.16);

    g.fillStyle(shirtColor, 1);
    g.fillRoundedRect(cx - 9, size * 0.42, 18, 16, 4);

    g.fillStyle(0xe8b98a, 1);
    g.fillCircle(cx, size * 0.36, 10);

    this.drawHair(g, hairStyle, cx, size);

    g.fillStyle(0x2a2a2e, 1);
    g.fillCircle(cx - 3.5, size * 0.36, 1.6);
    g.fillCircle(cx + 3.5, size * 0.36, 1.6);

    g.generateTexture('player', size, size);
    g.destroy();
  }

  drawHair(g, style, cx, size) {
    const hairColor = 0x3a2a1e;

    if (style === 'long') {
      g.fillStyle(hairColor, 1);
      g.fillEllipse(cx, size * 0.27, 21, 13);
      g.fillEllipse(cx - 9, size * 0.42, 5, 10);
      g.fillEllipse(cx + 9, size * 0.42, 5, 10);
    } else if (style === 'ponytail') {
      g.fillStyle(hairColor, 1);
      g.fillEllipse(cx, size * 0.28, 20, 12);
      g.fillEllipse(cx + 10, size * 0.36, 4, 9);
    } else if (style === 'bald') {
      // No hair drawn; scalp shows through.
    } else {
      g.fillStyle(hairColor, 1);
      g.fillEllipse(cx, size * 0.28, 20, 12);
    }
  }

  generateItemTextures() {
    // Twigs: thin curved brown sticks.
    const twigSizes = [
      { key: 'twig-sm', size: 16 },
      { key: 'twig-md', size: 24 }
    ];
    twigSizes.forEach(({ key, size }) => {
      const g = this.add.graphics();
      const cy = size / 2;
      g.lineStyle(Math.max(1.5, size * 0.12), 0x6b4526, 1);
      g.beginPath();
      g.moveTo(size * 0.12, cy + size * 0.12);
      g.lineTo(size * 0.5, cy - size * 0.1);
      g.lineTo(size * 0.88, cy + size * 0.08);
      g.strokePath();
      g.lineStyle(Math.max(1, size * 0.05), 0x4a3018, 0.8);
      g.beginPath();
      g.moveTo(size * 0.35, cy - size * 0.02);
      g.lineTo(size * 0.45, cy - size * 0.22);
      g.strokePath();
      g.generateTexture(key, size, size);
      g.destroy();
    });
    this.twigKeys = twigSizes.map(s => s.key);

    // Pebbles: small rounded stones.
    const pebbleSizes = [
      { key: 'pebble-sm', size: 10 },
      { key: 'pebble-md', size: 14 }
    ];
    pebbleSizes.forEach(({ key, size }) => {
      const g = this.add.graphics();
      const cx = size / 2;
      const cy = size / 2;
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(cx, size * 0.85, size * 0.7, size * 0.2);
      g.fillStyle(0x8a8378, 1);
      g.fillEllipse(cx, cy, size * 0.8, size * 0.62);
      g.fillStyle(0xaba497, 1);
      g.fillEllipse(cx - size * 0.12, cy - size * 0.1, size * 0.4, size * 0.28);
      g.generateTexture(key, size, size);
      g.destroy();
    });
    this.pebbleKeys = pebbleSizes.map(s => s.key);

    // Campfire icon: stacked logs with flame.
    {
      const size = 28;
      const g = this.add.graphics();
      const cx = size / 2;
      g.lineStyle(3, 0x6b4526, 1);
      g.beginPath();
      g.moveTo(size * 0.15, size * 0.85);
      g.lineTo(size * 0.85, size * 0.6);
      g.strokePath();
      g.beginPath();
      g.moveTo(size * 0.85, size * 0.85);
      g.lineTo(size * 0.15, size * 0.6);
      g.strokePath();
      g.fillStyle(0xffa726, 1);
      g.fillTriangle(cx, size * 0.1, cx - size * 0.16, size * 0.55, cx + size * 0.16, size * 0.55);
      g.fillStyle(0xffe066, 1);
      g.fillTriangle(cx, size * 0.28, cx - size * 0.08, size * 0.55, cx + size * 0.08, size * 0.55);
      g.generateTexture('icon-campfire', size, size);
      g.destroy();
    }

    // Stone axe icon: handle + wedge head.
    {
      const size = 28;
      const g = this.add.graphics();
      g.lineStyle(3, 0x6b4526, 1);
      g.beginPath();
      g.moveTo(size * 0.3, size * 0.9);
      g.lineTo(size * 0.75, size * 0.2);
      g.strokePath();
      g.fillStyle(0x9a9aa0, 1);
      g.beginPath();
      g.moveTo(size * 0.55, size * 0.35);
      g.lineTo(size * 0.9, size * 0.15);
      g.lineTo(size * 0.85, size * 0.45);
      g.lineTo(size * 0.6, size * 0.5);
      g.closePath();
      g.fillPath();
      g.generateTexture('icon-axe', size, size);
      g.destroy();
    }

    // Stone pickaxe icon: handle + double-pointed head.
    {
      const size = 28;
      const g = this.add.graphics();
      g.lineStyle(3, 0x6b4526, 1);
      g.beginPath();
      g.moveTo(size * 0.3, size * 0.9);
      g.lineTo(size * 0.7, size * 0.25);
      g.strokePath();
      g.fillStyle(0x9a9aa0, 1);
      g.beginPath();
      g.moveTo(size * 0.35, size * 0.2);
      g.lineTo(size * 0.7, size * 0.35);
      g.lineTo(size * 0.95, size * 0.15);
      g.lineTo(size * 0.6, size * 0.08);
      g.closePath();
      g.fillPath();
      g.generateTexture('icon-pickaxe', size, size);
      g.destroy();
    }

    // Stone sword icon: handle + crossguard + stone blade.
    {
      const size = 28;
      const g = this.add.graphics();
      const cx = size / 2;
      g.lineStyle(3, 0x6b4526, 1);
      g.beginPath();
      g.moveTo(cx, size * 0.9);
      g.lineTo(cx, size * 0.55);
      g.strokePath();
      g.lineStyle(3, 0x8a8378, 1);
      g.beginPath();
      g.moveTo(cx - size * 0.22, size * 0.58);
      g.lineTo(cx + size * 0.22, size * 0.58);
      g.strokePath();
      g.fillStyle(0xb5b5bc, 1);
      g.beginPath();
      g.moveTo(cx - size * 0.1, size * 0.55);
      g.lineTo(cx + size * 0.1, size * 0.55);
      g.lineTo(cx + size * 0.06, size * 0.12);
      g.lineTo(cx, size * 0.05);
      g.lineTo(cx - size * 0.06, size * 0.12);
      g.closePath();
      g.fillPath();
      g.lineStyle(1, 0x8f8f96, 0.8);
      g.beginPath();
      g.moveTo(cx, size * 0.5);
      g.lineTo(cx, size * 0.12);
      g.strokePath();
      g.generateTexture('icon-sword', size, size);
      g.destroy();
    }

    // Bow icon: curved wood limb + taut string.
    {
      const size = 28;
      const g = this.add.graphics();
      const cx = size / 2;
      g.lineStyle(3, 0x8a5a34, 1);
      g.beginPath();
      g.arc(cx - size * 0.05, size / 2, size * 0.42, Phaser.Math.DegToRad(-70), Phaser.Math.DegToRad(70));
      g.strokePath();
      g.lineStyle(1.2, 0xe8e4d8, 0.9);
      g.beginPath();
      g.moveTo(cx + size * 0.09, size * 0.14);
      g.lineTo(cx + size * 0.09, size * 0.86);
      g.strokePath();
      g.generateTexture('icon-bow', size, size);
      g.destroy();
    }

    // Craftable arrow icon (matches the enemy arrow projectile look).
    {
      const size = 24;
      const g = this.add.graphics();
      const cy = size / 2;
      g.lineStyle(2, 0x6b4526, 1);
      g.beginPath();
      g.moveTo(size * 0.12, cy + 4);
      g.lineTo(size * 0.82, cy - 4);
      g.strokePath();
      g.fillStyle(0x8f8f96, 1);
      g.fillTriangle(size * 0.78, cy - 8, size * 0.82, cy - 4, size * 0.68, cy - 2);
      g.fillStyle(0xd8c39a, 1);
      g.fillTriangle(size * 0.1, cy + 1, size * 0.16, cy + 9, size * 0.22, cy + 3);
      g.generateTexture('icon-arrow-item', size, size);
      g.destroy();
    }

    // String icon: a small coiled fiber loop.
    {
      const size = 20;
      const g = this.add.graphics();
      const cx = size / 2;
      const cy = size / 2;
      g.lineStyle(1.6, 0xe8e0c8, 1);
      g.strokeEllipse(cx, cy, size * 0.6, size * 0.36);
      g.strokeEllipse(cx, cy, size * 0.36, size * 0.6);
      g.generateTexture('icon-string', size, size);
      g.destroy();
    }

    // Log seat icon: a short cut log viewed from the side.
    {
      const size = 24;
      const g = this.add.graphics();
      const cy = size / 2;
      g.fillStyle(0x8a5a34, 1);
      g.fillRoundedRect(2, cy - 5, size - 4, 10, 3);
      g.fillStyle(0xd8a86a, 1);
      g.fillEllipse(4, cy, 4, 8);
      g.fillStyle(0xd8a86a, 1);
      g.fillEllipse(size - 4, cy, 4, 8);
      g.generateTexture('icon-log-seat', size, size);
      g.destroy();
    }

    // World log seat (top-down bench, wider than the icon).
    {
      const w = 44, h = 20;
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(w / 2, h - 3, w * 0.85, h * 0.3);
      g.fillStyle(0x8a5a34, 1);
      g.fillRoundedRect(2, 2, w - 4, h - 6, 4);
      g.fillStyle(0xd8a86a, 1);
      g.fillEllipse(6, h / 2 - 1, 6, h - 8);
      g.fillEllipse(w - 6, h / 2 - 1, 6, h - 8);
      g.fillStyle(0xa87848, 1);
      g.fillEllipse(6, h / 2 - 1, 3, (h - 8) * 0.6);
      g.fillEllipse(w - 6, h / 2 - 1, 3, (h - 8) * 0.6);
      g.generateTexture('log-seat-world', w, h);
      g.destroy();
    }

    // Furnace kit icon: stone blocks with a fiery opening.
    {
      const size = 24;
      const g = this.add.graphics();
      const cx = size / 2;
      g.fillStyle(0x7a7a80, 1);
      g.fillRoundedRect(2, 2, size - 4, size - 4, 3);
      g.fillStyle(0x2a2a2e, 1);
      g.fillRect(cx - 5, size - 10, 10, 8);
      g.fillStyle(0xffa726, 1);
      g.fillTriangle(cx, size - 9, cx - 3, size - 3, cx + 3, size - 3);
      g.generateTexture('icon-furnace', size, size);
      g.destroy();
    }

    // World furnace (top-down, larger stone structure with glowing opening).
    {
      const w = 40, h = 40;
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.3);
      g.fillEllipse(w / 2, h - 4, w * 0.8, h * 0.22);
      g.fillStyle(0x6e6e74, 1);
      g.fillRoundedRect(2, 2, w - 4, h - 4, 5);
      g.fillStyle(0x59595e, 1);
      g.fillRoundedRect(6, 6, w - 12, h - 12, 4);
      g.fillStyle(0x2a2a2e, 1);
      g.fillRect(w / 2 - 8, h / 2 - 4, 16, 12);
      g.fillStyle(0xffa726, 0.9);
      g.fillTriangle(w / 2, h / 2 - 2, w / 2 - 5, h / 2 + 6, w / 2 + 5, h / 2 + 6);
      g.generateTexture('furnace-world', w, h);
      g.destroy();
    }

    // Crafting table kit icon: a small wooden workbench with tools.
    {
      const size = 24;
      const g = this.add.graphics();
      const cx = size / 2;
      g.fillStyle(0x8a5a34, 1);
      g.fillRoundedRect(2, size * 0.35, size - 4, size * 0.3, 2);
      g.fillStyle(0x6b4526, 1);
      g.fillRect(3, size * 0.62, 3, size * 0.3);
      g.fillRect(size - 6, size * 0.62, 3, size * 0.3);
      g.lineStyle(1.5, 0x9a9aa0, 1);
      g.beginPath();
      g.moveTo(cx - 4, size * 0.42);
      g.lineTo(cx + 3, size * 0.28);
      g.strokePath();
      g.generateTexture('icon-crafting-table', size, size);
      g.destroy();
    }

    // World crafting table (top-down wooden workbench).
    {
      const w = 40, h = 30;
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(w / 2, h - 3, w * 0.85, h * 0.22);
      g.fillStyle(0x8a5a34, 1);
      g.fillRoundedRect(2, 2, w - 4, h - 8, 4);
      g.fillStyle(0xa8764a, 1);
      g.fillRoundedRect(4, 4, w - 8, (h - 8) * 0.4, 3);
      g.lineStyle(1, 0x5c3a1e, 0.8);
      g.strokeRoundedRect(2, 2, w - 4, h - 8, 4);
      g.fillStyle(0x6b4526, 1);
      g.fillRect(4, h - 8, 4, 8);
      g.fillRect(w - 8, h - 8, 4, 8);
      g.lineStyle(2, 0x9a9aa0, 1);
      g.beginPath();
      g.moveTo(w * 0.62, h * 0.25);
      g.lineTo(w * 0.82, h * 0.08);
      g.strokePath();
      g.generateTexture('crafting-table-world', w, h);
      g.destroy();
    }

    // Wall icon + world piece: a solid wooden plank panel.
    {
      const size = 22;
      const g = this.add.graphics();
      g.fillStyle(0x8a5a34, 1);
      g.fillRect(2, 2, size - 4, size - 4);
      g.lineStyle(1, 0x5c3a1e, 0.8);
      for (let i = 1; i < 4; i++) {
        g.beginPath();
        g.moveTo(2 + i * (size - 4) / 4, 2);
        g.lineTo(2 + i * (size - 4) / 4, size - 2);
        g.strokePath();
      }
      g.strokeRect(2, 2, size - 4, size - 4);
      g.generateTexture('icon-wall', size, size);
      g.destroy();
    }
    {
      const w = 40, h = 40;
      const g = this.add.graphics();
      g.fillStyle(0x8a5a34, 1);
      g.fillRect(2, 2, w - 4, h - 4);
      g.lineStyle(1.5, 0x5c3a1e, 0.85);
      for (let i = 1; i < 5; i++) {
        g.beginPath();
        g.moveTo(2 + i * (w - 4) / 5, 2);
        g.lineTo(2 + i * (w - 4) / 5, h - 2);
        g.strokePath();
      }
      g.strokeRect(2, 2, w - 4, h - 4);
      g.generateTexture('wall-world', w, h);
      g.destroy();
    }

    // Door icon + world piece: a wooden door with a handle.
    {
      const size = 22;
      const g = this.add.graphics();
      g.fillStyle(0x7a5230, 1);
      g.fillRoundedRect(3, 2, size - 6, size - 4, 2);
      g.fillStyle(0x2a2a2e, 1);
      g.fillCircle(size - 7, size / 2, 1.4);
      g.generateTexture('icon-door', size, size);
      g.destroy();
    }
    {
      const w = 40, h = 12;
      const g = this.add.graphics();
      g.fillStyle(0x7a5230, 1);
      g.fillRoundedRect(1, 1, w - 2, h - 2, 2);
      g.lineStyle(1, 0x3f2814, 0.8);
      g.strokeRoundedRect(1, 1, w - 2, h - 2, 2);
      g.fillStyle(0x2a2a2e, 1);
      g.fillCircle(w - 7, h / 2, 1.6);
      g.generateTexture('door-world', w, h);
      g.destroy();
    }

    // Roof icon + world piece: an angled shingled panel (semi-transparent so it's see-through in world).
    {
      const size = 22;
      const g = this.add.graphics();
      g.fillStyle(0xa8442e, 1);
      g.fillTriangle(size / 2, 2, 2, size - 2, size - 2, size - 2);
      g.lineStyle(1, 0x7a2e1c, 0.8);
      g.strokeTriangle(size / 2, 2, 2, size - 2, size - 2, size - 2);
      g.generateTexture('icon-roof', size, size);
      g.destroy();
    }
    {
      const w = 44, h = 44;
      const g = this.add.graphics();
      g.fillStyle(0xa8442e, 0.55);
      g.fillRoundedRect(2, 2, w - 4, h - 4, 4);
      g.lineStyle(1, 0x7a2e1c, 0.6);
      for (let i = 1; i < 5; i++) {
        g.beginPath();
        g.moveTo(2, i * (h - 4) / 5 + 2);
        g.lineTo(w - 2, i * (h - 4) / 5 + 2);
        g.strokePath();
      }
      g.strokeRoundedRect(2, 2, w - 4, h - 4, 4);
      g.generateTexture('roof-world', w, h);
      g.destroy();
    }

    // Chair icon + world piece: a small wooden chair viewed from above.
    {
      const size = 20;
      const g = this.add.graphics();
      const cx = size / 2;
      g.fillStyle(0x8a5a34, 1);
      g.fillRoundedRect(cx - 6, cx - 6, 12, 12, 2);
      g.fillStyle(0x6b4526, 1);
      g.fillRect(cx - 6, cx - 8, 12, 3);
      g.generateTexture('icon-chair', size, size);
      g.destroy();
    }
    {
      const w = 24, h = 24;
      const g = this.add.graphics();
      const cx = w / 2;
      g.fillStyle(0x000000, 0.2);
      g.fillEllipse(cx, h - 4, w * 0.7, h * 0.2);
      g.fillStyle(0x8a5a34, 1);
      g.fillRoundedRect(3, 6, w - 6, h - 10, 2);
      g.fillStyle(0x6b4526, 1);
      g.fillRoundedRect(3, 2, w - 6, 5, 2);
      g.generateTexture('chair-world', w, h);
      g.destroy();
    }

    // Table icon + world piece: a square wooden table.
    {
      const size = 22;
      const g = this.add.graphics();
      g.fillStyle(0x8a5a34, 1);
      g.fillRoundedRect(2, 2, size - 4, size - 4, 3);
      g.fillStyle(0xa8764a, 1);
      g.fillRoundedRect(4, 4, size - 8, size - 8, 2);
      g.generateTexture('icon-table', size, size);
      g.destroy();
    }
    {
      const w = 34, h = 34;
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(w / 2, h - 4, w * 0.85, h * 0.2);
      g.fillStyle(0x8a5a34, 1);
      g.fillRoundedRect(2, 2, w - 4, h - 6, 4);
      g.fillStyle(0xa8764a, 1);
      g.fillRoundedRect(5, 5, w - 10, h - 12, 3);
      g.generateTexture('table-world', w, h);
      g.destroy();
    }

    // Steps icon + world piece: a small stone staircase.
    {
      const size = 22;
      const g = this.add.graphics();
      g.fillStyle(0x9a9aa0, 1);
      g.fillRect(2, size * 0.6, size - 4, size * 0.3);
      g.fillStyle(0xb5b5bc, 1);
      g.fillRect(5, size * 0.3, size - 10, size * 0.3);
      g.fillStyle(0xcfcfd4, 1);
      g.fillRect(8, 2, size - 16, size * 0.3);
      g.generateTexture('icon-steps', size, size);
      g.destroy();
    }
    {
      const w = 32, h = 32;
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.2);
      g.fillEllipse(w / 2, h - 3, w * 0.8, h * 0.15);
      g.fillStyle(0x9a9aa0, 1);
      g.fillRect(2, h * 0.62, w - 4, h * 0.3);
      g.fillStyle(0xb5b5bc, 1);
      g.fillRect(6, h * 0.32, w - 12, h * 0.3);
      g.fillStyle(0xcfcfd4, 1);
      g.fillRect(10, 2, w - 20, h * 0.3);
      g.generateTexture('steps-world', w, h);
      g.destroy();
    }

    // Iron ore icon: grey rock with rust-colored flecks.
    {
      const size = 20;
      const g = this.add.graphics();
      const cx = size / 2, cy = size / 2;
      g.fillStyle(0x8f8f96, 1);
      g.fillCircle(cx, cy, size * 0.42);
      g.fillStyle(0xb5734a, 1);
      g.fillCircle(cx - 3, cy - 2, 2.4);
      g.fillCircle(cx + 3, cy + 1, 2);
      g.fillCircle(cx, cy + 4, 1.8);
      g.generateTexture('icon-iron-ore', size, size);
      g.destroy();
    }

    // Iron ingot icon: a shiny metal bar.
    {
      const size = 22;
      const g = this.add.graphics();
      const cx = size / 2, cy = size / 2;
      g.fillStyle(0x9aa0a8, 1);
      g.fillRoundedRect(cx - 8, cy - 4, 16, 8, 2);
      g.fillStyle(0xc8ced4, 1);
      g.fillRoundedRect(cx - 8, cy - 4, 16, 3, 1.5);
      g.generateTexture('icon-iron-ingot', size, size);
      g.destroy();
    }

    // Iron chestplate icon.
    {
      const size = 22;
      const g = this.add.graphics();
      const cx = size / 2;
      g.fillStyle(0x9aa0a8, 1);
      g.fillRoundedRect(cx - 8, 4, 16, 15, 3);
      g.fillStyle(0xc8ced4, 1);
      g.fillRect(cx - 1.5, 4, 3, 15);
      g.fillStyle(0x7a808a, 1);
      g.fillCircle(cx - 8, 7, 2.5);
      g.fillCircle(cx + 8, 7, 2.5);
      g.generateTexture('icon-iron-chestplate', size, size);
      g.destroy();
    }

    // Iron helmet icon.
    {
      const size = 22;
      const g = this.add.graphics();
      const cx = size / 2, cy = size / 2;
      g.fillStyle(0x9aa0a8, 1);
      g.beginPath();
      g.arc(cx, cy - 2, 8, Phaser.Math.DegToRad(190), Phaser.Math.DegToRad(-10));
      g.lineTo(cx + 8, cy - 2);
      g.closePath();
      g.fillPath();
      g.fillRect(cx - 8, cy - 2, 16, 3);
      g.fillStyle(0xc8ced4, 1);
      g.fillTriangle(cx, cy - 9, cx - 1.4, cy - 4, cx + 1.4, cy - 4);
      g.generateTexture('icon-iron-helmet', size, size);
      g.destroy();
    }

    // Iron arm piece icon (vambrace).
    {
      const size = 22;
      const g = this.add.graphics();
      const cx = size / 2;
      g.fillStyle(0x9aa0a8, 1);
      g.fillRoundedRect(cx - 3, 3, 6, 16, 2);
      g.fillStyle(0x7a808a, 1);
      g.fillRect(cx - 3, 7, 6, 2);
      g.fillRect(cx - 3, 12, 6, 2);
      g.generateTexture('icon-iron-arm', size, size);
      g.destroy();
    }

    // Iron gauntlet icon (fist).
    {
      const size = 22;
      const g = this.add.graphics();
      const cx = size / 2, cy = size / 2;
      g.fillStyle(0x9aa0a8, 1);
      g.fillRoundedRect(cx - 6, cy - 4, 12, 10, 3);
      g.fillStyle(0x7a808a, 1);
      for (let i = 0; i < 3; i++) {
        g.fillRoundedRect(cx - 5 + i * 4, cy - 8, 3, 5, 1.5);
      }
      g.generateTexture('icon-iron-gauntlet', size, size);
      g.destroy();
    }

    // Iron leggings & boots icon.
    {
      const size = 22;
      const g = this.add.graphics();
      const cx = size / 2;
      g.fillStyle(0x9aa0a8, 1);
      g.fillRoundedRect(cx - 6, 3, 5, 12, 2);
      g.fillRoundedRect(cx + 1, 3, 5, 12, 2);
      g.fillStyle(0x5c5c62, 1);
      g.fillRoundedRect(cx - 7, 14, 6, 5, 1.5);
      g.fillRoundedRect(cx + 1, 14, 6, 5, 1.5);
      g.generateTexture('icon-iron-leggings', size, size);
      g.destroy();
    }

    // Full iron armor set icon (chestplate with a shine).
    {
      const size = 22;
      const g = this.add.graphics();
      const cx = size / 2;
      g.fillStyle(0x9aa0a8, 1);
      g.fillRoundedRect(cx - 8, 4, 16, 15, 3);
      g.fillStyle(0xc8ced4, 1);
      g.fillRect(cx - 1.5, 4, 3, 15);
      g.fillStyle(0x7a808a, 1);
      g.fillCircle(cx - 8, 7, 2.5);
      g.fillCircle(cx + 8, 7, 2.5);
      g.fillStyle(0xffe066, 0.9);
      g.fillCircle(cx + 5, 8, 1.6);
      g.generateTexture('icon-iron-armor', size, size);
      g.destroy();
    }

    // Empty bucket icon.
    {
      const size = 20;
      const g = this.add.graphics();
      const cx = size / 2;
      g.lineStyle(2, 0x9aa0a8, 1);
      g.beginPath();
      g.moveTo(cx - 6, 5);
      g.lineTo(cx - 5, size - 4);
      g.lineTo(cx + 5, size - 4);
      g.lineTo(cx + 6, 5);
      g.strokePath();
      g.lineStyle(1.5, 0x7a808a, 1);
      g.beginPath();
      g.arc(cx, 5, 6, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(-20));
      g.strokePath();
      g.lineStyle(1.2, 0x5c5c62, 0.9);
      g.beginPath();
      g.moveTo(cx - 6, 2);
      g.lineTo(cx + 6, 2);
      g.strokePath();
      g.generateTexture('icon-bucket-empty', size, size);
      g.destroy();
    }

    // Water bucket icon.
    {
      const size = 20;
      const g = this.add.graphics();
      const cx = size / 2;
      g.lineStyle(2, 0x9aa0a8, 1);
      g.beginPath();
      g.moveTo(cx - 6, 5);
      g.lineTo(cx - 5, size - 4);
      g.lineTo(cx + 5, size - 4);
      g.lineTo(cx + 6, 5);
      g.strokePath();
      g.fillStyle(0x2f88b5, 1);
      g.fillRect(cx - 5, 8, 10, size - 12);
      g.fillStyle(0x8fd6f0, 0.7);
      g.fillCircle(cx - 2, 10, 1.6);
      g.lineStyle(1.5, 0x7a808a, 1);
      g.beginPath();
      g.arc(cx, 5, 6, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(-20));
      g.strokePath();
      g.generateTexture('icon-bucket-water', size, size);
      g.destroy();
    }

    // Lava bucket icon.
    {
      const size = 20;
      const g = this.add.graphics();
      const cx = size / 2;
      g.lineStyle(2, 0x9aa0a8, 1);
      g.beginPath();
      g.moveTo(cx - 6, 5);
      g.lineTo(cx - 5, size - 4);
      g.lineTo(cx + 5, size - 4);
      g.lineTo(cx + 6, 5);
      g.strokePath();
      g.fillStyle(0xd9481f, 1);
      g.fillRect(cx - 5, 8, 10, size - 12);
      g.fillStyle(0xffb347, 0.8);
      g.fillCircle(cx - 2, 10, 1.6);
      g.lineStyle(1.5, 0x7a808a, 1);
      g.beginPath();
      g.arc(cx, 5, 6, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(-20));
      g.strokePath();
      g.generateTexture('icon-bucket-lava', size, size);
      g.destroy();
    }

    // Obsidian chunk icon.
    {
      const size = 20;
      const g = this.add.graphics();
      const cx = size / 2, cy = size / 2;
      g.fillStyle(0x241533, 1);
      g.fillTriangle(cx - 7, cy + 6, cx - 1, cy - 7, cx + 4, cy + 5);
      g.fillStyle(0x3a2454, 1);
      g.fillTriangle(cx, cy + 6, cx + 6, cy - 5, cx + 9, cy + 6);
      g.fillStyle(0x6a4a9e, 0.6);
      g.fillCircle(cx - 3, cy - 2, 1.4);
      g.generateTexture('icon-obsidian', size, size);
      g.destroy();
    }


    // Bone icon: a small skeletal fragment (double-knuckle bone shape).
    {
      const size = 16;
      const g = this.add.graphics();
      const cx = size / 2, cy = size / 2;
      g.fillStyle(0xe8e4d8, 1);
      g.fillRoundedRect(cx - 5, cy - 1.6, 10, 3.2, 1.6);
      g.fillCircle(cx - 5, cy - 1.6, 2.2);
      g.fillCircle(cx - 5, cy + 1.6, 2.2);
      g.fillCircle(cx + 5, cy - 1.6, 2.2);
      g.fillCircle(cx + 5, cy + 1.6, 2.2);
      g.generateTexture('icon-bone', size, size);
      g.destroy();
    }

    // Wood icon: a cut log with visible rings.
    {
      const size = 24;
      const g = this.add.graphics();
      const cx = size / 2;
      const cy = size / 2;
      g.fillStyle(0x8a5a34, 1);
      g.fillRoundedRect(2, cy - 6, size - 4, 12, 3);
      g.fillStyle(0xd8a86a, 1);
      g.fillCircle(4, cy, 5);
      g.fillStyle(0xa87848, 1);
      g.fillCircle(4, cy, 3);
      g.fillStyle(0xd8a86a, 1);
      g.fillCircle(size - 4, cy, 5);
      g.fillStyle(0xa87848, 1);
      g.fillCircle(size - 4, cy, 3);
      g.generateTexture('icon-wood', size, size);
      g.destroy();
    }

    // Stone chunk icon: small cluster of grey shards.
    {
      const size = 24;
      const g = this.add.graphics();
      const cx = size / 2;
      const cy = size / 2;
      g.fillStyle(0x8f8f96, 1);
      g.fillTriangle(cx - 8, cy + 6, cx - 2, cy - 7, cx + 3, cy + 5);
      g.fillStyle(0xb5b5bc, 1);
      g.fillTriangle(cx - 1, cy + 6, cx + 5, cy - 5, cx + 9, cy + 6);
      g.generateTexture('icon-stone-chunk', size, size);
      g.destroy();
    }
  }

  scatterItems() {
    this.items = this.physics.add.group();
    const twigCount = 90;
    const pebbleCount = 110;

    const tryPlace = (keys, kind) => {
      let x, y, attempts = 0;
      do {
        x = Phaser.Math.Between(20, WORLD_WIDTH - 20);
        y = Phaser.Math.Between(20, WORLD_HEIGHT - 20);
        attempts++;
      } while (attempts < 8 && this.rockPositions.some(r => Phaser.Math.Distance.Between(x, y, r.x, r.y) < r.clearRadius * 0.5));

      const key = Phaser.Utils.Array.GetRandom(keys);
      const item = this.items.create(x, y, key);
      item.itemKind = kind;
      item.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
      item.setDepth(y - 500);
      item.body.setSize(item.width * 0.8, item.height * 0.8);
      item.body.setAllowGravity(false);
      item.body.moves = false;
    };

    for (let i = 0; i < twigCount; i++) tryPlace(this.twigKeys, 'twig');
    for (let i = 0; i < pebbleCount; i++) tryPlace(this.pebbleKeys, 'pebble');
  }

  setupInventory() {
    this.inventory = { twig: 0, pebble: 0 };

    this.promptText = this.add.text(0, 0, 'Press E to pick up', {
      fontFamily: 'Arial', fontSize: '13px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 6, y: 3 }
    }).setDepth(1000001).setVisible(false);

    this.keyE = this.input.keyboard.addKey('E');
    this.keyQ = this.input.keyboard.addKey('Q');

    this.itemDefs = {
      twig: { label: 'Twig', icon: 'twig-md' },
      pebble: { label: 'Pebble', icon: 'pebble-md' },
      wood: { label: 'Wood', icon: 'icon-wood' },
      stone_chunk: { label: 'Stone Chunk', icon: 'icon-stone-chunk' },
      string: { label: 'String', icon: 'icon-string' },
      arrow_item: { label: 'Arrow', icon: 'icon-arrow-item' },
      campfire: { label: 'Campfire Kit', icon: 'icon-campfire' },
      axe: { label: 'Stone Axe', icon: 'icon-axe', equippable: true, handIcon: 'icon-axe' },
      pickaxe: { label: 'Stone Pickaxe', icon: 'icon-pickaxe', equippable: true, handIcon: 'icon-pickaxe' },
      sword: { label: 'Stone Sword', icon: 'icon-sword', equippable: true, handIcon: 'icon-sword' },
      bow: { label: 'Bow', icon: 'icon-bow', equippable: true, handIcon: 'icon-bow' },
      log_seat: { label: 'Log Seat', icon: 'icon-log-seat' },
      furnace: { label: 'Furnace Kit', icon: 'icon-furnace' },
      iron_ore: { label: 'Iron Ore', icon: 'icon-iron-ore' },
      iron_ingot: { label: 'Iron Ingot', icon: 'icon-iron-ingot' },
      bone: { label: 'Bone', icon: 'icon-bone' },
      crafting_table: { label: 'Crafting Table', icon: 'icon-crafting-table' },
      wall: { label: 'Wall', icon: 'icon-wall' },
      door: { label: 'Door', icon: 'icon-door' },
      roof: { label: 'Roof', icon: 'icon-roof' },
      chair: { label: 'Chair', icon: 'icon-chair' },
      table: { label: 'Table', icon: 'icon-table' },
      steps: { label: 'Steps', icon: 'icon-steps' },
      iron_helmet: { label: 'Iron Helmet', icon: 'icon-iron-helmet', armor: true, armorSlot: 'helmet', hpBonus: 2 },
      iron_chestplate: { label: 'Iron Chestplate', icon: 'icon-iron-chestplate', armor: true, armorSlot: 'chestplate', hpBonus: 2 },
      iron_arm_piece: { label: 'Iron Arm Piece', icon: 'icon-iron-arm', armor: true, armorSlot: 'arm', hpBonus: 2 },
      iron_gauntlet: { label: 'Iron Gauntlet', icon: 'icon-iron-gauntlet', armor: true, armorSlot: 'gauntlet', hpBonus: 2 },
      iron_leggings: { label: 'Iron Leggings & Boots', icon: 'icon-iron-leggings', armor: true, armorSlot: 'legs', hpBonus: 2 },
      iron_armor_set: { label: 'Full Iron Armor Set', icon: 'icon-iron-armor', armorSet: true },
      bucket: { label: 'Bucket', icon: 'icon-bucket-empty' },
      bucket_water: { label: 'Water Bucket', icon: 'icon-bucket-water' },
      bucket_lava: { label: 'Lava Bucket', icon: 'icon-bucket-lava' },
      obsidian: { label: 'Obsidian', icon: 'icon-obsidian' }
    };

    this.equippedItem = null;
    this.equippedSprite = this.add.image(0, 0, 'icon-axe')
      .setVisible(false)
      .setOrigin(0.1, 0.9);

    this.equippedArmor = { helmet: null, chestplate: null, arm: null, gauntlet: null, legs: null };
    this.armorHpBonus = 0;

    this.craftRecipes = [
      { result: 'campfire', label: 'Campfire Kit', cost: { twig: 3, pebble: 2 } },
      { result: 'axe', label: 'Stone Axe', cost: { twig: 2, pebble: 3 } },
      { result: 'pickaxe', label: 'Stone Pickaxe', cost: { twig: 2, pebble: 5 } },
      { result: 'sword', label: 'Stone Sword', cost: { twig: 1, pebble: 6 } },
      { result: 'string', label: 'String', cost: { wood: 2 } },
      { result: 'bow', label: 'Bow', cost: { string: 1, twig: 3 } },
      { result: 'arrow_item', label: 'Arrow (x3)', cost: { twig: 1, pebble: 1 }, yield: 3 },
      { result: 'log_seat', label: 'Log Seat', cost: { wood: 3 } },
      { result: 'furnace', label: 'Furnace Kit', cost: { stone_chunk: 5 } },
      { result: 'crafting_table', label: 'Crafting Table', cost: { wood: 10 } },
      { result: 'wall', label: 'Wall', cost: { wood: 3 } },
      { result: 'door', label: 'Door', cost: { wood: 4 } },
      { result: 'roof', label: 'Roof', cost: { wood: 4 } },
      { result: 'chair', label: 'Chair', cost: { wood: 2 } },
      { result: 'table', label: 'Table', cost: { wood: 4 } },
      { result: 'steps', label: 'Steps', cost: { wood: 2, stone_chunk: 1 } },
      { result: 'iron_helmet', label: 'Iron Helmet', cost: { iron_ingot: 2 }, requiresCraftingTable: true },
      { result: 'iron_chestplate', label: 'Iron Chestplate', cost: { iron_ingot: 2 }, requiresCraftingTable: true },
      { result: 'iron_arm_piece', label: 'Iron Arm Piece', cost: { iron_ingot: 2 }, requiresCraftingTable: true },
      { result: 'iron_gauntlet', label: 'Iron Gauntlet', cost: { iron_ingot: 2 }, requiresCraftingTable: true },
      { result: 'iron_leggings', label: 'Iron Leggings & Boots', cost: { iron_ingot: 2 }, requiresCraftingTable: true },
      { result: 'iron_armor_set', label: 'Full Iron Armor Set', cost: { iron_ingot: 8 }, requiresCraftingTable: true },
      { result: 'bucket', label: 'Bucket', cost: { iron_ingot: 3 } }
    ];

    this.invPage = 0;
    this.invSlotsPerPage = 6;
    this.invCols = 3;
    this.recipesPerPage = 3;
    this.activeTab = 'items';

    const panelWidth = 340;
    const panelHeight = 300;
    this.inventoryPanel = this.add.container(0, 0)
      .setScrollFactor(0)
      .setDepth(2000000)
      .setVisible(false);
    this.inventoryPanelSize = { width: panelWidth, height: panelHeight };

    const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x1a1a1a, 0.9)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xffffff, 0.6);

    const tabStyleOff = { fontFamily: 'Arial', fontSize: '14px', color: '#aaaaaa', backgroundColor: '#242424', padding: { x: 14, y: 6 } };
    const tabStyleOn = { fontFamily: 'Arial', fontSize: '14px', color: '#ffffff', backgroundColor: '#3a3a3a', padding: { x: 14, y: 6 } };
    this.itemsTabBtn = this.add.text(20, 14, 'Items', tabStyleOn)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.setInventoryTab('items'));
    this.craftTabBtn = this.add.text(110, 14, 'Craft', tabStyleOff)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.setInventoryTab('craft'));
    this.equipTabBtn = this.add.text(200, 14, 'Equip', tabStyleOff)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.setInventoryTab('equip'));
    this.tabStyleOn = tabStyleOn;
    this.tabStyleOff = tabStyleOff;

    this.inventorySlotsContainer = this.add.container(20, 60).setScrollFactor(0);

    this.pageLabel = this.add.text(panelWidth / 2, panelHeight - 34, '', {
      fontFamily: 'Arial', fontSize: '13px', color: '#aaaaaa'
    }).setOrigin(0.5, 0).setScrollFactor(0);

    const btnStyle = { fontFamily: 'Arial', fontSize: '14px', color: '#ffffff', backgroundColor: '#3a3a3a', padding: { x: 10, y: 4 } };
    this.prevBtn = this.add.text(20, panelHeight - 34, '< Prev', btnStyle)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.changeInventoryPage(-1));
    this.nextBtn = this.add.text(panelWidth - 20, panelHeight - 34, 'Next >', btnStyle)
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.changeInventoryPage(1));

    bg.setScrollFactor(0);
    this.inventoryPanel.add([bg, this.itemsTabBtn, this.craftTabBtn, this.equipTabBtn, this.inventorySlotsContainer, this.pageLabel, this.prevBtn, this.nextBtn]);

    this.positionInventoryPanel();
    this.scale.on('resize', () => this.positionInventoryPanel());

    this.setupHotbar();
  }

  setupHotbar() {
    this.hotbarSize = 5;
    this.hotbar = new Array(this.hotbarSize).fill(null);
    this.hotbarSlotSize = 56;
    this.hotbarGap = 8;

    this.hotbarContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(1600000);
    this.hotbarSlots = [];

    for (let i = 0; i < this.hotbarSize; i++) {
      const slotBg = this.add.rectangle(0, 0, this.hotbarSlotSize, this.hotbarSlotSize, 0x1a1a1a, 0.85)
        .setOrigin(0, 0)
        .setStrokeStyle(2, 0x555555)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.activateHotbarSlot(i));

      const icon = this.add.image(0, 0, 'twig-md').setScale(1.2).setVisible(false).setScrollFactor(0);
      const countLabel = this.add.text(0, 0, '', {
        fontFamily: 'Arial', fontSize: '11px', color: '#ffe066', fontStyle: 'bold'
      }).setOrigin(1, 0).setScrollFactor(0);
      const keyLabel = this.add.text(0, 0, `${i + 1}`, {
        fontFamily: 'Arial', fontSize: '10px', color: '#888888'
      }).setOrigin(0, 0).setScrollFactor(0);

      this.hotbarSlots.push({ slotBg, icon, countLabel, keyLabel });
      this.hotbarContainer.add([slotBg, icon, countLabel, keyLabel]);
    }

    this.positionHotbar();
    this.scale.on('resize', () => this.positionHotbar());

    this.hotbarKeys = this.input.keyboard.addKeys('ONE,TWO,THREE,FOUR,FIVE');
  }

  positionHotbar() {
    const { width, height } = this.scale;
    const totalWidth = this.hotbarSize * this.hotbarSlotSize + (this.hotbarSize - 1) * this.hotbarGap;
    const startX = width / 2 - totalWidth / 2;
    const y = height - this.hotbarSlotSize - 16;

    this.hotbarSlots.forEach((slot, i) => {
      const x = startX + i * (this.hotbarSlotSize + this.hotbarGap);
      slot.slotBg.setPosition(x, y);
      slot.icon.setPosition(x + this.hotbarSlotSize / 2, y + this.hotbarSlotSize / 2 - 4);
      slot.countLabel.setPosition(x + this.hotbarSlotSize - 4, y + 2);
      slot.keyLabel.setPosition(x + 4, y + 2);
    });
  }

  assignToHotbar(kind) {
    const emptyIndex = this.hotbar.findIndex(k => k === null);
    if (emptyIndex === -1) return;
    if (this.hotbar.includes(kind)) return;

    this.hotbar[emptyIndex] = kind;
    this.renderHotbar();
  }

  clearHotbarSlot(index) {
    this.hotbar[index] = null;
    this.renderHotbar();
  }

  renderHotbar() {
    this.hotbarSlots.forEach((slot, i) => {
      const kind = this.hotbar[i];
      const isSelectedEquip = kind && this.equippedItem === kind;
      slot.slotBg.setStrokeStyle(isSelectedEquip ? 2 : 2, isSelectedEquip ? 0xffe066 : 0x555555);

      if (!kind || !this.itemDefs[kind]) {
        slot.icon.setVisible(false);
        slot.countLabel.setText('');
        return;
      }

      const def = this.itemDefs[kind];
      const count = this.inventory[kind] || 0;

      if (count <= 0) {
        this.hotbar[i] = null;
        slot.icon.setVisible(false);
        slot.countLabel.setText('');
        return;
      }

      slot.icon.setTexture(def.icon).setVisible(true);
      slot.countLabel.setText(def.equippable ? '' : `x${count}`);
    });
  }

  activateHotbarSlot(index) {
    const kind = this.hotbar[index];
    if (!kind) return;
    const def = this.itemDefs[kind];
    if (!def) return;

    if (kind === 'pebble') {
      this.throwPebble();
    } else if (kind === 'campfire') {
      this.placeCampfire();
    } else if (kind === 'log_seat') {
      this.placeLogSeat();
    } else if (kind === 'furnace') {
      this.placeFurnace();
    } else if (kind === 'crafting_table') {
      this.placeCraftingTable();
    } else if (['wall', 'door', 'roof', 'chair', 'table', 'steps'].includes(kind)) {
      this.placeBuildPiece(kind);
    } else if (kind === 'bucket_water' || kind === 'bucket_lava') {
      this.pourBucket(kind);
    } else if (def.equippable) {
      this.toggleEquip(kind);
      this.renderHotbar();
    }
  }

  placeCampfire() {
    if ((this.inventory.campfire || 0) <= 0) return;

    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
    if (dist > this.useRange) return;

    this.inventory.campfire--;
    this.renderHotbar();
    if (this.inventoryPanel.visible) this.renderInventoryPage();

    const x = worldPoint.x;
    const y = worldPoint.y;

    const glow = this.add.circle(x, y, 15, 0xffa726, 0.18).setDepth(y - 1);
    const fire = this.add.image(x, y, 'icon-campfire').setScale(1.6).setDepth(y);

    this.tweens.add({
      targets: fire,
      scale: { from: 1.5, to: 1.7 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.14, to: 0.24 },
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const collider = this.add.zone(x, y, 24, 24);
    this.physics.add.existing(collider, true);
    this.physics.add.collider(this.player, collider);
    this.physics.add.collider(this.skeletonGroup, collider);

    this.placedCampfires = this.placedCampfires || [];
    this.placedCampfires.push({ x, y, fire, glow, collider });
  }

  placeLogSeat() {
    if ((this.inventory.log_seat || 0) <= 0) return;

    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
    if (dist > this.useRange) return;

    const nearFire = this.findNearestCampfire(worldPoint.x, worldPoint.y, 100);
    if (!nearFire) return;

    this.inventory.log_seat--;
    this.renderHotbar();
    if (this.inventoryPanel.visible) this.renderInventoryPage();

    const x = worldPoint.x;
    const y = worldPoint.y;
    const angle = Phaser.Math.Angle.Between(nearFire.x, nearFire.y, x, y);

    const sprite = this.add.image(x, y, 'log-seat-world').setDepth(y - 1);
    sprite.setRotation(angle + Math.PI / 2);

    this.logSeats = this.logSeats || [];
    this.logSeats.push({ x, y, sprite, occupied: false });
  }

  updateSeating() {
    if (!this.logSeats) return;

    if (this.seatedOn) {
      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.standUp();
      }
      return;
    }

    if (this.nearbyItem) return;

    const sitRange = 30;
    const nearest = this.findNearestInRange(
      this.logSeats.filter(s => !s.occupied),
      sitRange
    );

    if (nearest) {
      this.promptText.setText('Press E to sit');
      this.promptText.setPosition(nearest.x - this.promptText.width / 2, nearest.y - 24);
      this.promptText.setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.sitDown(nearest);
      }
    }
  }

  sitDown(seat) {
    seat.occupied = true;
    this.seatedOn = seat;
    this.player.body.setVelocity(0, 0);
    this.player.setPosition(seat.x, seat.y - 2);
    this.promptText.setVisible(false);

    this.skipStartedNight = this.isNight;
  }

  standUp() {
    if (!this.seatedOn) return;
    this.seatedOn.occupied = false;
    this.seatedOn = null;
  }

  placeFurnace() {
    if ((this.inventory.furnace || 0) <= 0) return;

    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
    if (dist > this.useRange) return;

    this.inventory.furnace--;
    this.renderHotbar();
    if (this.inventoryPanel.visible) this.renderInventoryPage();

    const x = worldPoint.x;
    const y = worldPoint.y;

    const sprite = this.add.image(x, y, 'furnace-world').setDepth(y);

    const collider = this.add.zone(x, y, 30, 30);
    this.physics.add.existing(collider, true);
    this.physics.add.collider(this.player, collider);
    this.physics.add.collider(this.skeletonGroup, collider);

    this.furnaces = this.furnaces || [];
    this.furnaces.push({ x, y, sprite, collider });
  }

  placeCraftingTable() {
    if ((this.inventory.crafting_table || 0) <= 0) return;

    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
    if (dist > this.useRange) return;

    this.inventory.crafting_table--;
    this.renderHotbar();
    if (this.inventoryPanel.visible) this.renderInventoryPage();

    const x = worldPoint.x;
    const y = worldPoint.y;

    const sprite = this.add.image(x, y, 'crafting-table-world').setDepth(y);

    const collider = this.add.zone(x, y, 30, 22);
    this.physics.add.existing(collider, true);
    this.physics.add.collider(this.player, collider);
    this.physics.add.collider(this.skeletonGroup, collider);

    this.craftingTables = this.craftingTables || [];
    this.craftingTables.push({ x, y, sprite, collider });
  }

  placeBuildPiece(kind) {
    if ((this.inventory[kind] || 0) <= 0) return;

    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
    if (dist > this.useRange) return;

    this.inventory[kind]--;
    this.renderHotbar();
    if (this.inventoryPanel.visible) this.renderInventoryPage();

    const x = worldPoint.x;
    const y = worldPoint.y;

    const config = {
      wall: { texture: 'wall-world', collides: true, colliderSize: [40, 40] },
      door: { texture: 'door-world', collides: false },
      roof: { texture: 'roof-world', collides: false, seeThrough: true },
      chair: { texture: 'chair-world', collides: false, sittable: true },
      table: { texture: 'table-world', collides: true, colliderSize: [26, 26] },
      steps: { texture: 'steps-world', collides: false }
    }[kind];

    const sprite = this.add.image(x, y, config.texture).setDepth(config.seeThrough ? y - 100000 : y);

    let collider = null;
    if (config.collides) {
      const [cw, ch] = config.colliderSize;
      collider = this.add.zone(x, y, cw, ch);
      this.physics.add.existing(collider, true);
      this.physics.add.collider(this.player, collider);
      this.physics.add.collider(this.skeletonGroup, collider);
    }

    this.buildPieces = this.buildPieces || [];
    this.buildPieces.push({ kind, x, y, sprite, collider });

    if (config.sittable) {
      this.logSeats = this.logSeats || [];
      this.logSeats.push({ x, y, sprite: null, occupied: false });
    }
  }

  updateSmelting() {
    if (!this.furnaces || this.furnaces.length === 0) return;
    if (this.furnacePanel && this.furnacePanel.visible) return;
    if (this.nearbyItem || this.seatedOn) return;

    const smeltRange = 40;
    const nearest = this.findNearestInRange(this.furnaces, smeltRange);
    if (!nearest) return;

    this.promptText.setText('Press E to open furnace');
    this.promptText.setPosition(nearest.x - this.promptText.width / 2, nearest.y - nearest.sprite.displayHeight - 10);
    this.promptText.setVisible(true);

    if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
      this.openFurnacePanel(nearest);
    }
  }

  updateBucketFill() {
    if (!this.pools || this.pools.length === 0) return;
    if (this.nearbyItem || this.seatedOn || (this.furnacePanel && this.furnacePanel.visible)) return;
    if ((this.inventory.bucket || 0) <= 0) return;

    const fillRange = 50;
    const nearest = this.findNearestInRange(this.pools, fillRange);
    if (!nearest) return;

    const label = nearest.kind === 'lava' ? 'Press E to fill with lava' : 'Press E to fill with water';
    this.promptText.setText(label);
    this.promptText.setPosition(nearest.x - this.promptText.width / 2, nearest.y - nearest.radius - 10);
    this.promptText.setVisible(true);

    if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
      this.inventory.bucket--;
      const resultKind = nearest.kind === 'lava' ? 'bucket_lava' : 'bucket_water';
      this.inventory[resultKind] = (this.inventory[resultKind] || 0) + 1;
      if (this.inventoryPanel.visible) this.renderInventoryPage();
      this.renderHotbar();
    }
  }

  pourBucket(kind) {
    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
    if (dist > this.useRange) return;

    if (kind === 'bucket_water') {
      const targetLava = this.findNearestInRange(
        this.pools.filter(p => p.kind === 'lava'),
        60
      );
      if (targetLava) {
        this.convertLavaToObsidian(targetLava);
      } else {
        this.spawnGroundPool('water', worldPoint.x, worldPoint.y);
      }
    } else if (kind === 'bucket_lava') {
      this.spawnGroundPool('lava', worldPoint.x, worldPoint.y);
    }

    this.inventory[kind]--;
    this.inventory.bucket = (this.inventory.bucket || 0) + 1;
    this.renderHotbar();
    if (this.inventoryPanel.visible) this.renderInventoryPage();
  }

  spawnGroundPool(kind, x, y) {
    const texture = kind === 'lava' ? 'lava-pool' : 'water-pool';
    const sprite = this.add.image(x, y, texture).setScale(0.35).setDepth(y - 1000000);
    const radius = sprite.displayWidth * 0.38;

    const collider = this.add.zone(x, y, radius * 1.6, radius * 1.6);
    this.physics.add.existing(collider, true);
    this.physics.add.collider(this.player, collider);
    this.physics.add.collider(this.skeletonGroup, collider);

    const pool = { kind, x, y, sprite, collider, radius, poured: true };
    this.pools.push(pool);
  }

  convertLavaToObsidian(lavaPool) {
    lavaPool.sprite.destroy();
    if (lavaPool.collider) lavaPool.collider.destroy();
    this.pools = this.pools.filter(p => p !== lavaPool);

    const obsidianSprite = this.add.image(lavaPool.x, lavaPool.y, 'obsidian-patch')
      .setScale(lavaPool.sprite.scaleX)
      .setDepth(lavaPool.y - 1000000);

    this.obsidianDeposits = this.obsidianDeposits || [];
    this.obsidianDeposits.push({ x: lavaPool.x, y: lavaPool.y, sprite: obsidianSprite, hits: 0 });
  }

  setupFurnacePanel() {
    this.furnaceSlots = { wood: 0, iron_ore: 0, output: 0 };

    const panelWidth = 320;
    const panelHeight = 220;
    this.furnacePanel = this.add.container(0, 0)
      .setScrollFactor(0)
      .setDepth(2100000)
      .setVisible(false);
    this.furnacePanelSize = { width: panelWidth, height: panelHeight };

    const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x1a1a1a, 0.92)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xffffff, 0.6)
      .setScrollFactor(0);

    const title = this.add.text(panelWidth / 2, 14, 'Furnace', {
      fontFamily: 'Arial', fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0);

    const closeBtn = this.add.text(panelWidth - 14, 12, 'X', {
      fontFamily: 'Arial', fontSize: '14px', color: '#ffffff', backgroundColor: '#3a3a3a', padding: { x: 6, y: 2 }
    }).setOrigin(1, 0).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.closeFurnacePanel());

    const slotSize = 64;
    const slotGap = 14;
    const totalSlotsWidth = slotSize * 3 + slotGap * 2;
    const woodSlotX = panelWidth / 2 - totalSlotsWidth / 2;
    const oreSlotX = woodSlotX + slotSize + slotGap;
    const outputSlotX = oreSlotX + slotSize + slotGap;
    const slotY = 56;

    const woodLabel = this.add.text(woodSlotX + slotSize / 2, slotY - 16, 'Wood (fuel)', {
      fontFamily: 'Arial', fontSize: '11px', color: '#cccccc'
    }).setOrigin(0.5, 1).setScrollFactor(0);
    const oreLabel = this.add.text(oreSlotX + slotSize / 2, slotY - 16, 'Iron Ore', {
      fontFamily: 'Arial', fontSize: '11px', color: '#cccccc'
    }).setOrigin(0.5, 1).setScrollFactor(0);
    const outputLabel = this.add.text(outputSlotX + slotSize / 2, slotY - 16, 'Output', {
      fontFamily: 'Arial', fontSize: '11px', color: '#9fd68a'
    }).setOrigin(0.5, 1).setScrollFactor(0);

    const woodSlotBg = this.add.rectangle(woodSlotX, slotY, slotSize, slotSize, 0x2c2c2c, 1)
      .setOrigin(0, 0).setStrokeStyle(1, 0x8a5a34).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.addToFurnaceSlot('wood'));
    const oreSlotBg = this.add.rectangle(oreSlotX, slotY, slotSize, slotSize, 0x2c2c2c, 1)
      .setOrigin(0, 0).setStrokeStyle(1, 0x8f8f96).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.addToFurnaceSlot('iron_ore'));
    const outputSlotBg = this.add.rectangle(outputSlotX, slotY, slotSize, slotSize, 0x2c2c2c, 1)
      .setOrigin(0, 0).setStrokeStyle(1, 0x9fd68a).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.collectFurnaceOutput());

    const woodIcon = this.add.image(woodSlotX + slotSize / 2, slotY + slotSize / 2 - 8, 'icon-wood').setScale(1.5).setScrollFactor(0);
    const oreIcon = this.add.image(oreSlotX + slotSize / 2, slotY + slotSize / 2 - 8, 'icon-iron-ore').setScale(1.8).setScrollFactor(0);
    const outputIcon = this.add.image(outputSlotX + slotSize / 2, slotY + slotSize / 2 - 8, 'icon-iron-ingot').setScale(1.8).setScrollFactor(0);

    const woodCountLabel = this.add.text(woodSlotX + slotSize - 4, slotY + 4, '', {
      fontFamily: 'Arial', fontSize: '12px', color: '#ffe066', fontStyle: 'bold'
    }).setOrigin(1, 0).setScrollFactor(0);
    const oreCountLabel = this.add.text(oreSlotX + slotSize - 4, slotY + 4, '', {
      fontFamily: 'Arial', fontSize: '12px', color: '#ffe066', fontStyle: 'bold'
    }).setOrigin(1, 0).setScrollFactor(0);
    const outputCountLabel = this.add.text(outputSlotX + slotSize - 4, slotY + 4, '', {
      fontFamily: 'Arial', fontSize: '12px', color: '#ffe066', fontStyle: 'bold'
    }).setOrigin(1, 0).setScrollFactor(0);

    const hint = this.add.text(panelWidth / 2, slotY + slotSize + 14, 'Click a slot to add 1 from inventory. Click output to collect.', {
      fontFamily: 'Arial', fontSize: '10px', color: '#888888'
    }).setOrigin(0.5, 0).setScrollFactor(0);

    const smeltBtnStyle = { fontFamily: 'Arial', fontSize: '15px', color: '#ffffff', backgroundColor: '#3a6b3a', padding: { x: 16, y: 8 } };
    const smeltBtn = this.add.text(panelWidth / 2, slotY + slotSize + 44, 'Smelt', smeltBtnStyle)
      .setOrigin(0.5, 0).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.smeltAtFurnace());

    const resultLabel = this.add.text(panelWidth / 2, slotY + slotSize + 84, '', {
      fontFamily: 'Arial', fontSize: '11px', color: '#9fd68a'
    }).setOrigin(0.5, 0).setScrollFactor(0);

    this.furnacePanelUI = { woodCountLabel, oreCountLabel, outputCountLabel, smeltBtn, resultLabel };

    this.furnacePanel.add([bg, title, closeBtn, woodLabel, oreLabel, outputLabel, woodSlotBg, oreSlotBg, outputSlotBg, woodIcon, oreIcon, outputIcon, woodCountLabel, oreCountLabel, outputCountLabel, hint, smeltBtn, resultLabel]);

    this.positionFurnacePanel();
    this.scale.on('resize', () => this.positionFurnacePanel());
  }

  positionFurnacePanel() {
    const { width, height } = this.scale;
    const { width: pw, height: ph } = this.furnacePanelSize;
    this.furnacePanel.setPosition(width / 2 - pw / 2, height / 2 - ph / 2);
  }

  openFurnacePanel(furnace) {
    if (!this.furnacePanel) this.setupFurnacePanel();
    this.activeFurnace = furnace;
    furnace.slots = furnace.slots || { wood: 0, iron_ore: 0, output: 0 };
    this.furnaceSlots = furnace.slots;
    this.renderFurnacePanel();
    this.furnacePanel.setVisible(true);
    this.promptText.setVisible(false);
  }

  closeFurnacePanel() {
    if (!this.furnacePanel) return;

    // Unsmelted wood/ore go back to inventory; smelted output stays queued in the furnace until collected.
    this.inventory.wood = (this.inventory.wood || 0) + this.furnaceSlots.wood;
    this.inventory.iron_ore = (this.inventory.iron_ore || 0) + this.furnaceSlots.iron_ore;
    this.furnaceSlots.wood = 0;
    this.furnaceSlots.iron_ore = 0;

    this.furnacePanel.setVisible(false);
    this.activeFurnace = null;
    if (this.inventoryPanel.visible) this.renderInventoryPage();
  }

  addToFurnaceSlot(kind) {
    if ((this.inventory[kind] || 0) <= 0) return;
    this.inventory[kind]--;
    this.furnaceSlots[kind]++;
    this.renderFurnacePanel();
    if (this.inventoryPanel.visible) this.renderInventoryPage();
  }

  renderFurnacePanel() {
    const { woodCountLabel, oreCountLabel, outputCountLabel, resultLabel } = this.furnacePanelUI;
    woodCountLabel.setText(`x${this.furnaceSlots.wood}`);
    oreCountLabel.setText(`x${this.furnaceSlots.iron_ore}`);
    outputCountLabel.setText(`x${this.furnaceSlots.output}`);
    resultLabel.setText(`Iron Ingots in inventory: ${this.inventory.iron_ingot || 0}`);
  }

  smeltAtFurnace() {
    if (this.furnaceSlots.wood <= 0 || this.furnaceSlots.iron_ore <= 0) return;

    this.furnaceSlots.wood--;
    this.furnaceSlots.iron_ore--;
    this.furnaceSlots.output++;

    this.renderFurnacePanel();
  }

  collectFurnaceOutput() {
    if (this.furnaceSlots.output <= 0) return;

    this.inventory.iron_ingot = (this.inventory.iron_ingot || 0) + this.furnaceSlots.output;
    this.furnaceSlots.output = 0;

    this.renderFurnacePanel();
    if (this.inventoryPanel.visible) this.renderInventoryPage();
  }

  setupDayNightCycle() {
    this.dayLengthMs = 90000;
    this.nightLengthMs = 90000;
    this.cycleLengthMs = this.dayLengthMs + this.nightLengthMs;
    this.cycleStartTime = this.time.now;
    this.isNight = false;

    this.nightOverlay = this.add.rectangle(0, 0, 4000, 4000, 0x0a1030, 0)
      .setScrollFactor(0)
      .setDepth(1800000);

    this.dayNightLabel = this.add.text(0, 0, '', {
      fontFamily: 'Arial', fontSize: '12px', color: '#cccccc'
    }).setScrollFactor(0).setDepth(1800001);

    this.positionDayNightUI();
    this.scale.on('resize', () => this.positionDayNightUI());
  }

  positionDayNightUI() {
    const { width, height } = this.scale;
    this.nightOverlay.setPosition(width / 2, height / 2);
    this.dayNightLabel.setPosition(width / 2 - 30, this.hpBarMargin + this.hpBarHeight + 6);
  }

  updateDayNightCycle() {
    if (this.seatedOn && this.isNight === this.skipStartedNight) {
      const skipSpeed = 40;
      this.cycleStartTime -= this.game.loop.delta * (skipSpeed - 1);
    }

    const elapsed = (this.time.now - this.cycleStartTime) % this.cycleLengthMs;
    const inDay = elapsed < this.dayLengthMs;

    let darkness;
    if (inDay) {
      // Ramp darkness up over the last third of the day, fully dark at night start.
      const dayProgress = elapsed / this.dayLengthMs;
      darkness = dayProgress > 0.7 ? Phaser.Math.Clamp((dayProgress - 0.7) / 0.3, 0, 1) * 0.75 : 0;
    } else {
      const nightElapsed = elapsed - this.dayLengthMs;
      const nightProgress = nightElapsed / this.nightLengthMs;
      // Fade back out over the last third of the night.
      darkness = nightProgress > 0.7 ? 0.75 * (1 - Phaser.Math.Clamp((nightProgress - 0.7) / 0.3, 0, 1)) : 0.75;
    }

    this.nightOverlay.setFillStyle(0x0a1030, darkness);

    const wasNight = this.isNight;
    this.isNight = darkness > 0.4;
    if (this.isNight !== wasNight) {
      this.onDayNightChanged();
    }

    const isSkipping = this.seatedOn && this.isNight === this.skipStartedNight;
    this.dayNightLabel.setText((this.isNight ? 'Night' : 'Day') + (isSkipping ? ' (skipping...)' : ''));
  }

  onDayNightChanged() {
    const speedMultiplier = this.isNight ? 1.4 : 1;
    this.skeletonAttackCooldown = this.isNight ? 550 : 800;
    this.nightSpeedMultiplier = speedMultiplier;
  }

  findNearestCampfire(x, y, range) {
    if (!this.placedCampfires || this.placedCampfires.length === 0) return null;
    let nearest = null;
    let nearestDist = Infinity;
    this.placedCampfires.forEach(fire => {
      const d = Phaser.Math.Distance.Between(x, y, fire.x, fire.y);
      if (d < range && d < nearestDist) {
        nearest = fire;
        nearestDist = d;
      }
    });
    return nearest;
  }

  setInventoryTab(tab) {
    this.activeTab = tab;
    this.itemsTabBtn.setStyle(tab === 'items' ? this.tabStyleOn : this.tabStyleOff);
    this.craftTabBtn.setStyle(tab === 'craft' ? this.tabStyleOn : this.tabStyleOff);
    this.equipTabBtn.setStyle(tab === 'equip' ? this.tabStyleOn : this.tabStyleOff);
    this.invPage = 0;
    this.renderInventoryPage();
  }

  positionInventoryPanel() {
    const { width, height } = this.scale;
    const { width: pw, height: ph } = this.inventoryPanelSize;
    this.inventoryPanel.setPosition(width / 2 - pw / 2, height / 2 - ph / 2);
  }

  getInventoryEntries() {
    return Object.keys(this.itemDefs)
      .map(kind => ({ kind, count: this.inventory[kind] || 0, ...this.itemDefs[kind] }))
      .filter(entry => entry.count > 0);
  }

  toggleInventoryPanel() {
    const opening = !this.inventoryPanel.visible;
    this.inventoryPanel.setVisible(opening);
    if (opening) {
      this.invPage = 0;
      this.renderInventoryPage();
    }
  }

  changeInventoryPage(delta) {
    let maxPage;
    if (this.activeTab === 'craft') {
      maxPage = Math.max(0, Math.ceil(this.craftRecipes.length / this.recipesPerPage) - 1);
    } else if (this.activeTab === 'equip') {
      maxPage = 0;
    } else {
      maxPage = Math.max(0, Math.ceil(this.getInventoryEntries().length / this.invSlotsPerPage) - 1);
    }
    this.invPage = Phaser.Math.Clamp(this.invPage + delta, 0, maxPage);
    this.renderInventoryPage();
  }

  renderInventoryPage() {
    if (this.activeTab === 'craft') {
      this.renderCraftPage();
    } else if (this.activeTab === 'equip') {
      this.renderEquipPage();
    } else {
      this.renderItemsPage();
    }
  }

  renderItemsPage() {
    this.inventorySlotsContainer.removeAll(true);

    const entries = this.getInventoryEntries();
    const maxPage = Math.max(0, Math.ceil(entries.length / this.invSlotsPerPage) - 1);
    this.invPage = Phaser.Math.Clamp(this.invPage, 0, maxPage);

    const pageEntries = entries.slice(
      this.invPage * this.invSlotsPerPage,
      this.invPage * this.invSlotsPerPage + this.invSlotsPerPage
    );

    const slotSize = 76;
    const gap = 10;

    if (pageEntries.length === 0) {
      const empty = this.add.text(130, 60, 'Empty', {
        fontFamily: 'Arial', fontSize: '14px', color: '#888888'
      });
      this.inventorySlotsContainer.add(empty);
    }

    pageEntries.forEach((entry, i) => {
      const col = i % this.invCols;
      const row = Math.floor(i / this.invCols);
      const x = col * (slotSize + gap);
      const y = row * (slotSize + gap);

      const isEquipped = this.equippedItem === entry.kind
        || (entry.armorSlot && this.equippedArmor[entry.armorSlot] === entry.kind);

      const slotBg = this.add.rectangle(x, y, slotSize, slotSize, 0x2c2c2c, 1)
        .setOrigin(0, 0)
        .setStrokeStyle(isEquipped ? 2 : 1, isEquipped ? 0xffe066 : 0x555555);
      const icon = this.add.image(x + slotSize / 2, y + slotSize / 2 - 10, entry.icon)
        .setScale(1.4);
      const label = this.add.text(x + slotSize / 2, y + slotSize - 22, entry.label, {
        fontFamily: 'Arial', fontSize: '11px', color: '#cccccc'
      }).setOrigin(0.5, 0);
      const countLabel = this.add.text(x + slotSize - 6, y + 4, `x${entry.count}`, {
        fontFamily: 'Arial', fontSize: '12px', color: '#ffe066', fontStyle: 'bold'
      }).setOrigin(1, 0);

      this.inventorySlotsContainer.add([slotBg, icon, label, countLabel]);

      if (entry.equippable || entry.armorSlot) {
        const equippedTag = this.add.text(x + 4, y + 4, isEquipped ? 'Equipped' : '', {
          fontFamily: 'Arial', fontSize: '9px', color: '#ffe066'
        }).setScrollFactor(0);
        this.inventorySlotsContainer.add(equippedTag);
      }

      slotBg.setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          const now = this.time.now;
          const isDoubleClick = this.lastSlotClick
            && this.lastSlotClick.kind === entry.kind
            && now - this.lastSlotClick.time < 300;
          this.lastSlotClick = { kind: entry.kind, time: now };

          if (isDoubleClick) {
            this.assignToHotbar(entry.kind);
          } else if (entry.armorSlot) {
            this.toggleArmorPiece(entry.kind);
          } else if (entry.armorSet) {
            this.equipArmorSet();
          } else if (entry.equippable) {
            this.toggleEquip(entry.kind);
          }
        });
    });

    this.pageLabel.setText(`Page ${this.invPage + 1} / ${maxPage + 1}`);
    this.prevBtn.setAlpha(this.invPage > 0 ? 1 : 0.4);
    this.nextBtn.setAlpha(this.invPage < maxPage ? 1 : 0.4);
  }

  canCraft(recipe) {
    const hasMaterials = Object.entries(recipe.cost).every(([kind, amount]) => (this.inventory[kind] || 0) >= amount);
    if (!hasMaterials) return false;
    if (recipe.requiresCraftingTable && !this.isNearCraftingTable()) return false;
    return true;
  }

  isNearCraftingTable() {
    if (!this.craftingTables || this.craftingTables.length === 0) return false;
    return this.craftingTables.some(t => Phaser.Math.Distance.Between(this.player.x, this.player.y, t.x, t.y) < 80);
  }

  renderCraftPage() {
    this.inventorySlotsContainer.removeAll(true);

    const maxPage = Math.max(0, Math.ceil(this.craftRecipes.length / this.recipesPerPage) - 1);
    this.invPage = Phaser.Math.Clamp(this.invPage, 0, maxPage);

    const pageRecipes = this.craftRecipes.slice(
      this.invPage * this.recipesPerPage,
      this.invPage * this.recipesPerPage + this.recipesPerPage
    );

    const rowHeight = 62;

    pageRecipes.forEach((recipe, i) => {
      const y = i * rowHeight;
      const affordable = this.canCraft(recipe);

      const rowBg = this.add.rectangle(0, y, 260, rowHeight - 8, 0x2c2c2c, 1)
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0x555555);

      const hasMaterials = Object.entries(recipe.cost).every(([kind, amount]) => (this.inventory[kind] || 0) >= amount);
      const needsTable = recipe.requiresCraftingTable && !this.isNearCraftingTable();

      let costText = Object.entries(recipe.cost)
        .map(([kind, amount]) => `${this.itemDefs[kind].label} x${amount}`)
        .join('   ');
      if (needsTable) costText += hasMaterials ? '  (near Crafting Table)' : '';

      const label = this.add.text(10, y + 8, recipe.label, {
        fontFamily: 'Arial', fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
      });
      const cost = this.add.text(10, y + 30, costText, {
        fontFamily: 'Arial', fontSize: '11px', color: affordable ? '#9fd68a' : '#d68a8a'
      });

      const craftBtn = this.add.text(250, y + rowHeight / 2 - 12, 'Craft', {
        fontFamily: 'Arial', fontSize: '13px', color: '#ffffff',
        backgroundColor: affordable ? '#3a6b3a' : '#444444', padding: { x: 10, y: 4 }
      }).setOrigin(1, 0).setScrollFactor(0);

      if (affordable) {
        craftBtn.setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.craftItem(recipe));
      }

      this.inventorySlotsContainer.add([rowBg, label, cost, craftBtn]);
    });

    this.pageLabel.setText(`Page ${this.invPage + 1} / ${maxPage + 1}`);
    this.prevBtn.setAlpha(this.invPage > 0 ? 1 : 0.4);
    this.nextBtn.setAlpha(this.invPage < maxPage ? 1 : 0.4);
  }

  renderEquipPage() {
    this.inventorySlotsContainer.removeAll(true);

    const rows = [
      { slot: 'helmet', kind: 'iron_helmet', label: 'Iron Helmet' },
      { slot: 'chestplate', kind: 'iron_chestplate', label: 'Iron Chestplate' },
      { slot: 'arm', kind: 'iron_arm_piece', label: 'Iron Arm Piece' },
      { slot: 'gauntlet', kind: 'iron_gauntlet', label: 'Iron Gauntlet' },
      { slot: 'legs', kind: 'iron_leggings', label: 'Iron Leggings & Boots' }
    ].filter(def => (this.inventory[def.kind] || 0) > 0 || this.equippedArmor[def.slot] === def.kind);

    const rowHeight = 36;

    if (rows.length === 0) {
      const empty = this.add.text(150, 40, 'No armor pieces owned yet', {
        fontFamily: 'Arial', fontSize: '12px', color: '#888888'
      }).setOrigin(0.5, 0);
      this.inventorySlotsContainer.add(empty);
    }

    rows.forEach((def, i) => {
      const y = i * rowHeight;
      const isEquipped = this.equippedArmor[def.slot] === def.kind;
      const owned = this.inventory[def.kind] || 0;
      const itemDef = this.itemDefs[def.kind];

      const rowBg = this.add.rectangle(0, y, 300, rowHeight - 4, 0x2c2c2c, 1)
        .setOrigin(0, 0)
        .setStrokeStyle(isEquipped ? 2 : 1, isEquipped ? 0xffe066 : 0x555555);

      const icon = this.add.image(20, y + (rowHeight - 4) / 2, itemDef.icon).setScale(1.1);

      const label = this.add.text(38, y + 4, `${def.label}  (+${itemDef.hpBonus} HP)`, {
        fontFamily: 'Arial', fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
      });
      const status = this.add.text(38, y + 18, isEquipped ? 'Equipped' : `Owned: x${owned}`, {
        fontFamily: 'Arial', fontSize: '9px', color: isEquipped ? '#ffe066' : '#9fd68a'
      });

      const canToggle = isEquipped || owned > 0;
      const btnText = isEquipped ? 'Unequip' : 'Equip';
      const btn = this.add.text(292, y + (rowHeight - 4) / 2, btnText, {
        fontFamily: 'Arial', fontSize: '11px', color: '#ffffff',
        backgroundColor: canToggle ? (isEquipped ? '#6b3a3a' : '#3a6b3a') : '#444444',
        padding: { x: 7, y: 3 }
      }).setOrigin(1, 0.5).setScrollFactor(0);

      if (canToggle) {
        btn.setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.toggleArmorPiece(def.kind));
      }

      this.inventorySlotsContainer.add([rowBg, icon, label, status, btn]);
    });

    const totalBonus = this.armorHpBonus;
    const summary = this.add.text(150, rows.length * rowHeight + 10,
      `Total armor bonus: +${totalBonus} HP  (Max HP: ${this.playerMaxHp})`, {
        fontFamily: 'Arial', fontSize: '11px', color: '#9fd68a'
      }).setOrigin(0.5, 0);
    this.inventorySlotsContainer.add(summary);

    this.pageLabel.setText('Page 1 / 1');
    this.prevBtn.setAlpha(0.4);
    this.nextBtn.setAlpha(0.4);
  }

  toggleEquip(kind) {
    this.equippedItem = this.equippedItem === kind ? null : kind;

    if (this.equippedItem) {
      this.equippedSprite.setTexture(this.itemDefs[this.equippedItem].handIcon);
      this.equippedSprite.setVisible(true);
    } else {
      this.equippedSprite.setVisible(false);
    }

    this.renderInventoryPage();
  }

  toggleArmorPiece(kind) {
    const slot = this.itemDefs[kind].armorSlot;
    this.equippedArmor[slot] = this.equippedArmor[slot] === kind ? null : kind;
    this.recalculateArmorHpBonus();
    this.renderInventoryPage();
  }

  equipArmorSet() {
    const pieceMap = {
      helmet: 'iron_helmet',
      chestplate: 'iron_chestplate',
      arm: 'iron_arm_piece',
      gauntlet: 'iron_gauntlet',
      legs: 'iron_leggings'
    };
    Object.entries(pieceMap).forEach(([slot, kind]) => {
      if ((this.inventory[kind] || 0) > 0) {
        this.equippedArmor[slot] = kind;
      }
    });
    this.recalculateArmorHpBonus();
    this.renderInventoryPage();
  }

  recalculateArmorHpBonus() {
    const newBonus = Object.values(this.equippedArmor)
      .filter(Boolean)
      .reduce((sum, kind) => sum + (this.itemDefs[kind].hpBonus || 0), 0);

    const delta = newBonus - this.armorHpBonus;
    this.armorHpBonus = newBonus;
    this.playerMaxHp += delta;
    this.playerHp = Math.min(this.playerHp + Math.max(delta, 0), this.playerMaxHp);
    this.updateHpBar();
  }

  updateEquippedSprite() {
    if (!this.equippedItem) return;
    this.equippedSprite.setPosition(this.player.x + 10, this.player.y - 6);

    if (this.equippedItem === 'bow') {
      const pointer = this.input.activePointer;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const angle = Phaser.Math.Angle.Between(this.equippedSprite.x, this.equippedSprite.y, worldPoint.x, worldPoint.y);
      this.equippedSprite.setRotation(angle);
    } else if (!this.swingTween || !this.swingTween.isPlaying()) {
      this.equippedSprite.setRotation(-0.6);
    }

    this.equippedSprite.setDepth(this.player.y + 1);
  }

  updateArmorSprites() {
    if (!this.armorSprites) return;

    Object.entries(this.armorSprites).forEach(([slot, sprite]) => {
      const equippedKind = this.equippedArmor[slot];
      sprite.setVisible(!!equippedKind);
      if (!equippedKind) return;

      sprite.setPosition(this.player.x, this.player.y);
      sprite.setDepth(this.player.y + (slot === 'helmet' ? 0.5 : 0.2));
    });
  }

  setupToolUse() {
    this.useRange = 60;
    this.input.on('pointerdown', (pointer) => {
      if (pointer.button !== 0) return;
      if (this.inventoryPanel.visible) return;
      if (this.playerIsDead) return;
      this.useEquippedTool();
    });

    this.toolPromptText = this.add.text(0, 0, '', {
      fontFamily: 'Arial', fontSize: '13px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 6, y: 3 }
    }).setDepth(1000001).setVisible(false);
  }

  updateToolPrompt() {
    let target = null;
    let label = '';
    let targetSprite = null;

    if (this.equippedItem === 'axe') {
      target = this.findNearestInRange(this.choppableTrees, this.useRange);
      if (target) {
        label = `Click to chop (${target.hits}/5)`;
        targetSprite = target.sprite;
      }
    } else if (this.equippedItem === 'pickaxe') {
      target = this.findNearestInRange(this.breakableRocks, this.useRange);
      if (target) {
        label = `Click to mine (${target.hits}/5)`;
        targetSprite = target.sprite;
      }
    } else if (this.equippedItem === 'sword') {
      const nearestSkeleton = this.skeletons
        .filter(s => !s.dead)
        .reduce((closest, s) => {
          const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, s.sprite.x, s.sprite.y);
          if (d < 50 && (!closest || d < closest.dist)) return { skeleton: s, dist: d };
          return closest;
        }, null);
      if (nearestSkeleton) {
        target = nearestSkeleton.skeleton;
        label = `Click to attack (${target.hits}/5)`;
        targetSprite = target.sprite;
      }
    }

    if (target && targetSprite) {
      this.toolPromptText.setText(label);
      this.toolPromptText.setPosition(targetSprite.x - this.toolPromptText.width / 2, targetSprite.y - targetSprite.displayHeight - 14);
      this.toolPromptText.setVisible(true);
    } else {
      this.toolPromptText.setVisible(false);
    }
  }

  findNearestInRange(list, range) {
    let nearest = null;
    let nearestDist = Infinity;
    list.forEach(entry => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, entry.x, entry.y);
      if (d < range && d < nearestDist) {
        nearest = entry;
        nearestDist = d;
      }
    });
    return nearest;
  }

  useEquippedTool() {
    if (this.hitInProgress) return;
    if (!this.equippedItem) return;

    if (this.equippedItem !== 'bow') {
      this.swingEquippedTool();
    }

    if (this.equippedItem === 'axe') {
      const tree = this.findNearestInRange(this.choppableTrees, this.useRange);
      if (tree) this.hitTarget(tree, 'tree');
    } else if (this.equippedItem === 'pickaxe') {
      const rock = this.findNearestInRange(this.breakableRocks, this.useRange);
      const obsidian = this.findNearestInRange(this.obsidianDeposits || [], this.useRange);
      if (rock && (!obsidian || Phaser.Math.Distance.Between(this.player.x, this.player.y, rock.x, rock.y) <= Phaser.Math.Distance.Between(this.player.x, this.player.y, obsidian.x, obsidian.y))) {
        this.hitTarget(rock, 'rock');
      } else if (obsidian) {
        this.hitObsidian(obsidian);
      }
    } else if (this.equippedItem === 'sword') {
      this.attackNearestSkeleton();
    } else if (this.equippedItem === 'bow') {
      this.firePlayerArrow();
    }
  }

  swingEquippedTool() {
    if (this.swingTween) this.swingTween.stop();

    const sprite = this.equippedSprite;
    const baseRotation = -0.6;
    sprite.setRotation(baseRotation - 1.1);

    this.swingTween = this.tweens.add({
      targets: sprite,
      rotation: baseRotation,
      duration: 140,
      ease: 'Back.easeOut'
    });
  }

  hitTarget(target, kind) {
    const maxHits = 5;
    target.hits++;
    this.hitInProgress = true;

    const sprite = target.sprite;
    const origX = target.x;

    // Damage shake: quick knock to one side and back.
    this.tweens.add({
      targets: sprite,
      x: origX + Phaser.Math.Between(-4, 4),
      duration: 60,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        sprite.x = origX;
        this.hitInProgress = false;
      }
    });

    // Brief flash on each hit for extra feedback.
    this.tweens.add({
      targets: sprite,
      alpha: 0.5,
      duration: 50,
      yoyo: true
    });

    if (kind === 'tree') {
      this.addTreeScratch(target);
    } else {
      this.addRockHole(target);
    }

    if (target.hits >= maxHits) {
      if (kind === 'tree') {
        this.destroyTree(target);
      } else {
        this.destroyRock(target);
      }
    }
  }

  hitObsidian(deposit) {
    const maxHits = 5;
    deposit.hits++;
    this.hitInProgress = true;

    const sprite = deposit.sprite;
    const origX = deposit.x;

    this.tweens.add({
      targets: sprite,
      x: origX + Phaser.Math.Between(-4, 4),
      duration: 60,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        sprite.x = origX;
        this.hitInProgress = false;
      }
    });
    this.tweens.add({
      targets: sprite,
      alpha: 0.5,
      duration: 50,
      yoyo: true
    });

    if (deposit.hits >= maxHits) {
      deposit.sprite.destroy();
      this.obsidianDeposits = this.obsidianDeposits.filter(d => d !== deposit);
      this.inventory.obsidian = (this.inventory.obsidian || 0) + 3;
      if (this.inventoryPanel.visible) this.renderInventoryPage();
    }
  }

  getDamageOverlay(target) {
    if (!target.damageOverlay) {
      const g = this.add.graphics();
      g.setDepth(target.sprite.depth + 1);
      target.damageOverlay = g;
    }
    return target.damageOverlay;
  }

  addTreeScratch(tree) {
    const g = this.getDamageOverlay(tree);
    const sprite = tree.sprite;
    const w = sprite.displayWidth;
    const h = sprite.displayHeight;
    const cx = sprite.x;
    const baseY = sprite.y;

    // A fresh diagonal axe-gash on the trunk, stacking upward with each hit.
    const gashY = baseY - h * Phaser.Math.FloatBetween(0.06, 0.24);
    const gashX = cx + Phaser.Math.FloatBetween(-0.06, 0.06) * w;
    const len = Math.max(4, w * 0.05);
    const angle = Phaser.Math.FloatBetween(-0.5, 0.5);

    g.lineStyle(2, 0x2a180a, 0.9);
    g.beginPath();
    g.moveTo(gashX - Math.cos(angle) * len, gashY - Math.sin(angle) * len);
    g.lineTo(gashX + Math.cos(angle) * len, gashY + Math.sin(angle) * len);
    g.strokePath();

    g.lineStyle(1, 0xe8d2a0, 0.65);
    g.beginPath();
    g.moveTo(gashX - Math.cos(angle) * len * 0.8, gashY - Math.sin(angle) * len * 0.8 - 1);
    g.lineTo(gashX + Math.cos(angle) * len * 0.8, gashY + Math.sin(angle) * len * 0.8 - 1);
    g.strokePath();
  }

  addRockHole(rock) {
    const g = this.getDamageOverlay(rock);
    const sprite = rock.sprite;
    const w = sprite.displayWidth;
    const h = sprite.displayHeight;
    const cx = sprite.x;
    const cy = sprite.y - h * 0.4;

    // A chipped-out crater at a random point on the rock face.
    const hx = cx + Phaser.Math.FloatBetween(-0.3, 0.3) * w;
    const hy = cy + Phaser.Math.FloatBetween(-0.25, 0.25) * h;
    const r = w * Phaser.Math.FloatBetween(0.08, 0.14);

    g.fillStyle(0x2c2c30, 0.75);
    g.fillCircle(hx, hy, r);
    g.fillStyle(0x1a1a1d, 0.6);
    g.fillCircle(hx - r * 0.2, hy - r * 0.2, r * 0.55);

    g.lineStyle(1, 0x4a4a50, 0.5);
    g.strokeCircle(hx, hy, r);
  }

  destroyTree(tree) {
    tree.sprite.destroy();
    if (tree.damageOverlay) tree.damageOverlay.destroy();
    if (tree.collider) tree.collider.destroy();
    this.choppableTrees.splice(this.choppableTrees.indexOf(tree), 1);

    this.inventory.wood = (this.inventory.wood || 0) + 5;
    if (this.inventoryPanel.visible) this.renderInventoryPage();
  }

  generateSkeletonTexture() {
    const size = 36;
    const g = this.add.graphics();
    const cx = size / 2;

    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, size - 4, size * 0.45, size * 0.14);

    g.lineStyle(3, 0xe8e4d8, 1);
    g.beginPath();
    g.moveTo(cx - 6, size * 0.55);
    g.lineTo(cx - 6, size * 0.8);
    g.moveTo(cx + 6, size * 0.55);
    g.lineTo(cx + 6, size * 0.8);
    g.strokePath();

    g.fillStyle(0xe8e4d8, 1);
    g.fillRoundedRect(cx - 8, size * 0.4, 16, 18, 3);
    g.lineStyle(1, 0xb0aa98, 0.8);
    for (let i = 0; i < 3; i++) {
      const ly = size * 0.44 + i * 5;
      g.beginPath();
      g.moveTo(cx - 7, ly);
      g.lineTo(cx + 7, ly);
      g.strokePath();
    }

    g.fillStyle(0xf0ece0, 1);
    g.fillCircle(cx, size * 0.28, 9);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(cx - 3.2, size * 0.27, 2);
    g.fillCircle(cx + 3.2, size * 0.27, 2);
    g.fillRect(cx - 1.5, size * 0.34, 3, 3);

    g.generateTexture('skeleton', size, size);
    g.destroy();
  }

  generateSkeletonArcherTexture() {
    const size = 36;
    const g = this.add.graphics();
    const cx = size / 2;

    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, size - 4, size * 0.45, size * 0.14);

    g.lineStyle(3, 0xe8e4d8, 1);
    g.beginPath();
    g.moveTo(cx - 6, size * 0.55);
    g.lineTo(cx - 6, size * 0.8);
    g.moveTo(cx + 6, size * 0.55);
    g.lineTo(cx + 6, size * 0.8);
    g.strokePath();

    g.fillStyle(0xe8e4d8, 1);
    g.fillRoundedRect(cx - 8, size * 0.4, 16, 18, 3);
    g.lineStyle(1, 0xb0aa98, 0.8);
    for (let i = 0; i < 3; i++) {
      const ly = size * 0.44 + i * 5;
      g.beginPath();
      g.moveTo(cx - 7, ly);
      g.lineTo(cx + 7, ly);
      g.strokePath();
    }

    g.fillStyle(0xf0ece0, 1);
    g.fillCircle(cx, size * 0.28, 9);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(cx - 3.2, size * 0.27, 2);
    g.fillCircle(cx + 3.2, size * 0.27, 2);
    g.fillRect(cx - 1.5, size * 0.34, 3, 3);

    // Bow held to the side.
    g.lineStyle(2, 0x8a5a34, 1);
    g.beginPath();
    g.arc(cx + size * 0.38, size * 0.5, size * 0.28, Phaser.Math.DegToRad(-100), Phaser.Math.DegToRad(100));
    g.strokePath();
    g.lineStyle(1, 0xe8d2a0, 0.8);
    g.beginPath();
    g.moveTo(cx + size * 0.38, size * 0.24);
    g.lineTo(cx + size * 0.38, size * 0.76);
    g.strokePath();

    g.generateTexture('skeleton-archer', size, size);
    g.destroy();
  }

  generateSkeletonKnightTexture() {
    const size = 36;
    const g = this.add.graphics();
    const cx = size / 2;

    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, size - 4, size * 0.5, size * 0.15);

    g.lineStyle(3, 0xe8e4d8, 1);
    g.beginPath();
    g.moveTo(cx - 6, size * 0.55);
    g.lineTo(cx - 6, size * 0.8);
    g.moveTo(cx + 6, size * 0.55);
    g.lineTo(cx + 6, size * 0.8);
    g.strokePath();

    // Chest armor (plate) over the ribcage.
    g.fillStyle(0x7a7a82, 1);
    g.fillRoundedRect(cx - 8, size * 0.4, 16, 18, 3);
    g.lineStyle(1, 0x4a4a50, 0.9);
    g.strokeRoundedRect(cx - 8, size * 0.4, 16, 18, 3);
    g.fillStyle(0x9a9aa2, 1);
    g.fillRect(cx - 1.5, size * 0.42, 3, 15);
    g.lineStyle(0.8, 0x55555c, 0.7);
    for (let i = 0; i < 2; i++) {
      const ly = size * 0.48 + i * 6;
      g.beginPath();
      g.moveTo(cx - 7, ly);
      g.lineTo(cx + 7, ly);
      g.strokePath();
    }

    // Shoulder pauldrons.
    g.fillStyle(0x8a8a90, 1);
    g.fillCircle(cx - 8, size * 0.42, 3.5);
    g.fillCircle(cx + 8, size * 0.42, 3.5);
    g.lineStyle(0.8, 0x4a4a50, 0.9);
    g.strokeCircle(cx - 8, size * 0.42, 3.5);
    g.strokeCircle(cx + 8, size * 0.42, 3.5);

    // Shield on the left arm.
    g.fillStyle(0x6e6e74, 1);
    g.fillRoundedRect(cx - 15, size * 0.42, 8, 14, 2);
    g.lineStyle(1, 0x3a3a3e, 0.9);
    g.strokeRoundedRect(cx - 15, size * 0.42, 8, 14, 2);
    g.fillStyle(0x9a9aa0, 1);
    g.fillCircle(cx - 11, size * 0.49, 2);

    // Spear held to the right, angled up.
    g.lineStyle(2.5, 0x8a5a34, 1);
    g.beginPath();
    g.moveTo(cx + 10, size * 0.92);
    g.lineTo(cx + 14, size * 0.1);
    g.strokePath();
    g.fillStyle(0x9a9aa0, 1);
    g.fillTriangle(cx + 11, size * 0.16, cx + 17, size * 0.16, cx + 14, size * -0.02);

    // Helmet over the skull, with an open faceplate.
    g.fillStyle(0xf0ece0, 1);
    g.fillCircle(cx, size * 0.28, 9);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(cx - 3.2, size * 0.27, 2);
    g.fillCircle(cx + 3.2, size * 0.27, 2);
    g.fillRect(cx - 1.5, size * 0.34, 3, 3);

    g.fillStyle(0x7a7a82, 1);
    g.beginPath();
    g.arc(cx, size * 0.24, 9.5, Phaser.Math.DegToRad(190), Phaser.Math.DegToRad(-10));
    g.lineTo(cx + 9.5, size * 0.24);
    g.closePath();
    g.fillPath();
    g.fillRect(cx - 9.5, size * 0.24, 19, 3);
    g.lineStyle(0.8, 0x4a4a50, 0.9);
    g.strokeCircle(cx, size * 0.24, 9.5);
    g.fillStyle(0x9a9aa2, 1);
    g.fillTriangle(cx, size * 0.1, cx - 1.5, size * 0.16, cx + 1.5, size * 0.16);

    g.generateTexture('skeleton-knight', size, size);
    g.destroy();
  }

  generateArrowTexture() {
    const size = 20;
    const g = this.add.graphics();
    const cy = size / 2;

    g.lineStyle(2, 0x6b4526, 1);
    g.beginPath();
    g.moveTo(size * 0.1, cy);
    g.lineTo(size * 0.75, cy);
    g.strokePath();

    g.fillStyle(0x8f8f96, 1);
    g.fillTriangle(size * 0.75, cy - 4, size * 0.75, cy + 4, size * 0.98, cy);

    g.fillStyle(0xd8c39a, 1);
    g.fillTriangle(size * 0.1, cy - 4, size * 0.1, cy + 4, size * 0, cy);

    g.generateTexture('arrow', size, size);
    g.destroy();
  }

  generateBaseTextures() {
    // Wall segment: rough-hewn wooden palisade log.
    {
      const w = 20, h = 20;
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(w / 2, h - 2, w * 0.8, h * 0.2);
      g.fillStyle(0x5b3a21, 1);
      g.fillRoundedRect(1, 1, w - 2, h - 4, 3);
      g.fillStyle(0x6e4a2c, 1);
      g.fillRect(1, 1, w - 2, 3);
      g.lineStyle(1, 0x3f2814, 0.7);
      g.strokeRoundedRect(1, 1, w - 2, h - 4, 3);
      g.generateTexture('wall-segment', w, h);
      g.destroy();
    }

    // Gate: two wooden doors slightly ajar, wider than a wall segment.
    {
      const w = 40, h = 20;
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.2);
      g.fillEllipse(w / 2, h - 2, w * 0.8, h * 0.2);
      g.fillStyle(0x7a5230, 1);
      g.fillRoundedRect(1, 1, w * 0.42, h - 4, 2);
      g.fillRoundedRect(w * 0.58, 1, w * 0.42, h - 4, 2);
      g.lineStyle(1, 0x3f2814, 0.7);
      g.strokeRoundedRect(1, 1, w * 0.42, h - 4, 2);
      g.strokeRoundedRect(w * 0.58, 1, w * 0.42, h - 4, 2);
      g.fillStyle(0x2a2a2e, 0.8);
      g.fillCircle(w * 0.4, h / 2, 1.5);
      g.fillCircle(w * 0.6, h / 2, 1.5);
      g.generateTexture('base-gate', w, h);
      g.destroy();
    }
  }

  setupCombat() {
    this.playerMaxHp = 20;
    this.playerHp = this.playerMaxHp;
    this.skeletonAttackCooldown = 800;
    this.arrowDamage = 1;
    this.arrowSpeed = 260;
    this.campfireScareRadius = 90;
    this.campfireFleeSpeed = 90;

    this.generateSkeletonTexture();
    this.generateSkeletonArcherTexture();
    this.generateSkeletonKnightTexture();
    this.generateArrowTexture();
    this.generateBaseTextures();

    this.skeletons = [];
    this.skeletonGroup = this.physics.add.group();
    this.arrows = [];
    this.arrowGroup = this.physics.add.group();

    this.hpBarWidth = 220;
    this.hpBarHeight = 18;
    this.hpBarMargin = 16;

    this.hpBarBg = this.add.rectangle(0, 0, this.hpBarWidth, this.hpBarHeight, 0x1a1a1a, 0.85)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(1500000).setStrokeStyle(2, 0xffffff, 0.5);
    this.hpBarFill = this.add.rectangle(0, 0, this.hpBarWidth - 6, this.hpBarHeight - 6, 0xd9432e, 1)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(1500001);
    this.hpBarText = this.add.text(0, 0, '', {
      fontFamily: 'Arial', fontSize: '12px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1500002);

    this.positionHpBar();
    this.scale.on('resize', () => this.positionHpBar());
    this.updateHpBar();

    this.physics.add.overlap(this.player, this.skeletonGroup, (playerObj, skeletonSprite) => {
      this.handleSkeletonTouch(skeletonSprite.enemyRef);
    });

    this.physics.add.overlap(this.player, this.arrowGroup, (playerObj, arrowSprite) => {
      this.handleArrowHit(arrowSprite.arrowRef);
    });

    this.physics.add.overlap(this.skeletonGroup, this.arrowGroup, (skeletonSprite, arrowSprite) => {
      this.handleArrowSkeletonHit(skeletonSprite.enemyRef, arrowSprite.arrowRef);
    });

    this.playerIsDead = false;
    this.deathScreen = this.add.container(0, 0)
      .setScrollFactor(0)
      .setDepth(3000000)
      .setVisible(false);

    const overlay = this.add.rectangle(0, 0, 4000, 4000, 0x000000, 0.75).setOrigin(0.5, 0.5);
    const deathText = this.add.text(0, -20, 'YOU DIED', {
      fontFamily: 'Arial', fontSize: '48px', color: '#d9432e', fontStyle: 'bold'
    }).setOrigin(0.5);
    const subText = this.add.text(0, 30, 'Respawning...', {
      fontFamily: 'Arial', fontSize: '16px', color: '#cccccc'
    }).setOrigin(0.5);
    this.deathScreen.add([overlay, deathText, subText]);

    this.positionDeathScreen();
    this.scale.on('resize', () => this.positionDeathScreen());
  }

  positionDeathScreen() {
    const { width, height } = this.scale;
    this.deathScreen.setPosition(width / 2, height / 2);
  }

  positionHpBar() {
    const { width } = this.scale;
    const x = width - this.hpBarMargin - this.hpBarWidth;
    const y = this.hpBarMargin;
    this.hpBarBg.setPosition(x, y);
    this.hpBarFill.setPosition(x + 3, y + 3);
    this.hpBarText.setPosition(x + this.hpBarWidth / 2, y + this.hpBarHeight / 2);
  }

  updateHpBar() {
    const ratio = Phaser.Math.Clamp(this.playerHp / this.playerMaxHp, 0, 1);
    this.hpBarFill.width = (this.hpBarWidth - 6) * ratio;
    this.hpBarText.setText(`HP: ${this.playerHp} / ${this.playerMaxHp}`);
  }

  setupSettingsMenu() {
    this.gameMode = 'survival';
    this.settingsButtonSize = 34;

    this.settingsBtn = this.add.text(0, 0, '⚙', {
      fontFamily: 'Arial', fontSize: '20px', color: '#ffffff', backgroundColor: 'rgba(26,26,26,0.85)',
      padding: { x: 7, y: 4 }
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(2500000)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleSettingsPanel());

    const panelWidth = 220;
    const panelHeight = 130;
    this.settingsPanel = this.add.container(0, 0)
      .setScrollFactor(0)
      .setDepth(2500001)
      .setVisible(false);
    this.settingsPanelSize = { width: panelWidth, height: panelHeight };

    const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x1a1a1a, 0.94)
      .setOrigin(0, 0).setStrokeStyle(2, 0xffffff, 0.6).setScrollFactor(0);
    const title = this.add.text(panelWidth / 2, 12, 'Settings', {
      fontFamily: 'Arial', fontSize: '15px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0);

    const closeBtn = this.add.text(panelWidth - 12, 10, 'X', {
      fontFamily: 'Arial', fontSize: '12px', color: '#ffffff', backgroundColor: '#3a3a3a', padding: { x: 5, y: 2 }
    }).setOrigin(1, 0).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.settingsPanel.setVisible(false));

    const modeLabel = this.add.text(14, 46, 'Game Mode', {
      fontFamily: 'Arial', fontSize: '11px', color: '#cccccc'
    }).setScrollFactor(0);

    const btnStyleOff = { fontFamily: 'Arial', fontSize: '13px', color: '#aaaaaa', backgroundColor: '#242424', padding: { x: 12, y: 6 } };
    const btnStyleOn = { fontFamily: 'Arial', fontSize: '13px', color: '#ffffff', backgroundColor: '#3a6b3a', padding: { x: 12, y: 6 } };

    this.survivalModeBtn = this.add.text(14, 68, 'Survival', btnStyleOn).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.setGameMode('survival'));
    this.creativeModeBtn = this.add.text(110, 68, 'Creative', btnStyleOff).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.setGameMode('creative'));
    this.settingsBtnStyleOn = btnStyleOn;
    this.settingsBtnStyleOff = btnStyleOff;

    const hint = this.add.text(panelWidth / 2, 104, 'Creative: unlimited materials', {
      fontFamily: 'Arial', fontSize: '9px', color: '#888888'
    }).setOrigin(0.5, 0).setScrollFactor(0);

    this.settingsPanel.add([bg, title, closeBtn, modeLabel, this.survivalModeBtn, this.creativeModeBtn, hint]);

    this.positionSettingsMenu();
    this.scale.on('resize', () => this.positionSettingsMenu());
  }

  positionSettingsMenu() {
    const { width } = this.scale;
    const btnX = width - this.hpBarMargin - this.hpBarWidth - this.settingsButtonSize - 10;
    const btnY = this.hpBarMargin;
    this.settingsBtn.setPosition(btnX, btnY);

    const { width: pw } = this.settingsPanelSize;
    this.settingsPanel.setPosition(btnX + this.settingsButtonSize - pw, btnY + this.settingsButtonSize + 6);
  }

  toggleSettingsPanel() {
    this.settingsPanel.setVisible(!this.settingsPanel.visible);
  }

  setGameMode(mode) {
    if (mode === this.gameMode) return;

    if (mode === 'creative') {
      this.preCreativeInventory = { ...this.inventory };
      Object.keys(this.itemDefs).forEach(kind => {
        this.inventory[kind] = 999;
      });
    } else if (mode === 'survival' && this.preCreativeInventory) {
      this.inventory = this.preCreativeInventory;
      this.preCreativeInventory = null;
    }

    this.gameMode = mode;
    this.survivalModeBtn.setStyle(mode === 'survival' ? this.settingsBtnStyleOn : this.settingsBtnStyleOff);
    this.creativeModeBtn.setStyle(mode === 'creative' ? this.settingsBtnStyleOn : this.settingsBtnStyleOff);

    if (this.inventoryPanel.visible) this.renderInventoryPage();
    this.renderHotbar();
  }

  handleSkeletonTouch(skeleton) {
    if (!skeleton || skeleton.dead) return;
    const now = this.time.now;
    if (skeleton.lastAttackTime && now - skeleton.lastAttackTime < this.skeletonAttackCooldown) return;
    skeleton.lastAttackTime = now;

    this.damagePlayer(skeleton.touchDamage || 1);
  }

  handleArrowHit(arrow) {
    if (!arrow || arrow.hit) return;
    arrow.hit = true;

    this.damagePlayer(this.arrowDamage);
    this.destroyArrow(arrow);
  }

  handleArrowSkeletonHit(skeleton, arrow) {
    if (!arrow || arrow.hit || !skeleton || skeleton.dead) return;
    if (arrow.source === skeleton) return;

    arrow.hit = true;
    this.damageSkeleton(skeleton);
    this.destroyArrow(arrow);

    if (arrow.source && !arrow.source.dead) {
      skeleton.hostileTarget = arrow.source;
    }
  }

  damagePlayer(amount) {
    if (this.playerHp <= 0) return;

    this.playerHp = Math.max(0, this.playerHp - amount);
    this.updateHpBar();

    this.cameras.main.flash(120, 150, 0, 0);
    this.tweens.add({
      targets: this.player,
      alpha: 0.4,
      duration: 80,
      yoyo: true
    });

    if (this.playerHp <= 0) {
      this.killPlayer();
    }
  }

  killPlayer() {
    if (this.playerIsDead) return;
    this.playerIsDead = true;

    this.dropAllItems();

    this.equippedItem = null;
    this.equippedSprite.setVisible(false);
    if (this.inventoryPanel.visible) this.renderInventoryPage();

    this.cameras.main.flash(300, 200, 0, 0);
    this.player.body.setVelocity(0, 0);
    this.player.setVisible(false);

    this.deathScreen.setVisible(true);
    this.deathScreen.setAlpha(0);
    this.tweens.add({
      targets: this.deathScreen,
      alpha: 1,
      duration: 300
    });

    this.time.delayedCall(1800, () => this.respawnPlayer());
  }

  respawnPlayer() {
    this.tweens.add({
      targets: this.deathScreen,
      alpha: 0,
      duration: 300,
      onComplete: () => this.deathScreen.setVisible(false)
    });

    this.player.setPosition(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    this.player.setVisible(true);
    this.player.setAlpha(1);

    this.playerHp = this.playerMaxHp;
    this.updateHpBar();

    this.playerIsDead = false;
  }

  dropAllItems() {
    const dropX = this.player.x;
    const dropY = this.player.y;

    Object.entries(this.inventory).forEach(([kind, count]) => {
      if (!count || count <= 0) return;
      const def = this.itemDefs[kind];
      if (!def) return;

      for (let i = 0; i < count; i++) {
        const x = dropX + Phaser.Math.Between(-24, 24);
        const y = dropY + Phaser.Math.Between(-24, 24);
        const item = this.items.create(x, y, def.icon);
        item.itemKind = kind;
        item.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
        item.setDepth(y - 500);
        item.body.setSize(item.width * 0.8, item.height * 0.8);
        item.body.setAllowGravity(false);
        item.body.moves = false;
      }

      this.inventory[kind] = 0;
    });

    if (this.inventoryPanel.visible) this.renderInventoryPage();
  }

  setupThrowing() {
    this.thrownPebbleSpeed = 320;
    this.thrownPebbleDamage = 1;
    this.thrownPebbles = [];
    this.thrownPebbleGroup = this.physics.add.group();

    this.aimReticle = this.add.circle(0, 0, 7, 0x000000, 0)
      .setStrokeStyle(2, 0xffe066, 0.9)
      .setDepth(1900000)
      .setVisible(false);
    this.aimReticleCross1 = this.add.line(0, 0, -4, 0, 4, 0, 0xffe066, 0.9).setDepth(1900001).setVisible(false);
    this.aimReticleCross2 = this.add.line(0, 0, 0, -4, 0, 4, 0xffe066, 0.9).setDepth(1900001).setVisible(false);

    this.physics.add.overlap(this.skeletonGroup, this.thrownPebbleGroup, (skeletonSprite, pebbleSprite) => {
      this.handleThrownPebbleHit(skeletonSprite.enemyRef, pebbleSprite.thrownRef);
    });

    this.playerArrowSpeed = 380;
    this.playerArrows = [];
    this.playerArrowGroup = this.physics.add.group();

    this.physics.add.overlap(this.skeletonGroup, this.playerArrowGroup, (skeletonSprite, arrowSprite) => {
      this.handlePlayerArrowHit(skeletonSprite.enemyRef, arrowSprite.playerArrowRef);
    });
  }

  firePlayerArrow() {
    if ((this.inventory.arrow_item || 0) <= 0) return;

    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

    this.inventory.arrow_item--;
    this.renderHotbar();
    if (this.inventoryPanel.visible) this.renderInventoryPage();

    const arrowSprite = this.physics.add.sprite(this.player.x, this.player.y - 10, 'arrow');
    this.playerArrowGroup.add(arrowSprite);
    arrowSprite.setRotation(angle);
    arrowSprite.body.setAllowGravity(false);
    arrowSprite.body.setSize(10, 6);
    arrowSprite.body.setVelocity(Math.cos(angle) * this.playerArrowSpeed, Math.sin(angle) * this.playerArrowSpeed);

    const arrow = { sprite: arrowSprite, hit: false, spawnTime: this.time.now };
    arrowSprite.playerArrowRef = arrow;
    this.playerArrows.push(arrow);
  }

  updatePlayerArrows() {
    const maxLifetime = 2000;
    this.playerArrows.forEach(arrow => {
      if (arrow.hit) return;
      arrow.sprite.setDepth(arrow.sprite.y + 100000);
      if (this.time.now - arrow.spawnTime > maxLifetime) {
        this.destroyPlayerArrow(arrow);
      }
    });
  }

  destroyPlayerArrow(arrow) {
    if (arrow.destroyed) return;
    arrow.destroyed = true;
    arrow.sprite.destroy();
    this.playerArrows = this.playerArrows.filter(a => a !== arrow);
  }

  handlePlayerArrowHit(skeleton, arrow) {
    if (!arrow || arrow.hit || !skeleton || skeleton.dead) return;

    arrow.hit = true;
    this.damageSkeleton(skeleton);
    this.destroyPlayerArrow(arrow);
  }

  updateAimReticle() {
    const hasThrowable = this.hotbar.includes('pebble');
    const hasBow = this.equippedItem === 'bow';
    const hasCampfire = this.hotbar.includes('campfire');
    const hasBucket = this.hotbar.includes('bucket_water') || this.hotbar.includes('bucket_lava');
    if ((!hasThrowable && !hasBow && !hasCampfire && !hasBucket) || this.playerIsDead) {
      this.aimReticle.setVisible(false);
      this.aimReticleCross1.setVisible(false);
      this.aimReticleCross2.setVisible(false);
      return;
    }

    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    this.aimReticle.setPosition(worldPoint.x, worldPoint.y).setVisible(true);
    this.aimReticleCross1.setTo(worldPoint.x - 4, worldPoint.y, worldPoint.x + 4, worldPoint.y).setVisible(true);
    this.aimReticleCross2.setTo(worldPoint.x, worldPoint.y - 4, worldPoint.x, worldPoint.y + 4).setVisible(true);
  }

  throwPebble() {
    if ((this.inventory.pebble || 0) <= 0) return;

    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

    this.inventory.pebble--;
    this.renderHotbar();
    if (this.inventoryPanel.visible) this.renderInventoryPage();

    const pebbleSprite = this.physics.add.sprite(this.player.x, this.player.y - 12, 'pebble-md');
    this.thrownPebbleGroup.add(pebbleSprite);
    pebbleSprite.body.setAllowGravity(false);
    pebbleSprite.body.setSize(8, 8);
    pebbleSprite.body.setVelocity(Math.cos(angle) * this.thrownPebbleSpeed, Math.sin(angle) * this.thrownPebbleSpeed);

    const pebble = { sprite: pebbleSprite, hit: false, spawnTime: this.time.now };
    pebbleSprite.thrownRef = pebble;
    this.thrownPebbles.push(pebble);
  }

  updateThrownPebbles() {
    const maxLifetime = 2000;
    this.thrownPebbles.forEach(pebble => {
      if (pebble.hit) return;
      pebble.sprite.setDepth(pebble.sprite.y + 100000);
      pebble.sprite.rotation += 0.3;
      if (this.time.now - pebble.spawnTime > maxLifetime) {
        this.destroyThrownPebble(pebble);
      }
    });
  }

  destroyThrownPebble(pebble) {
    if (pebble.destroyed) return;
    pebble.destroyed = true;
    pebble.sprite.destroy();
    this.thrownPebbles = this.thrownPebbles.filter(p => p !== pebble);
  }

  handleThrownPebbleHit(skeleton, pebble) {
    if (!pebble || pebble.hit || !skeleton || skeleton.dead) return;

    pebble.hit = true;
    this.damageSkeleton(skeleton);
    this.destroyThrownPebble(pebble);
  }

  spawnSkeletons() {
    const baseCount = 3;
    const spawnSafeRadius = 100;
    const playerSpawnX = WORLD_WIDTH / 2;
    const playerSpawnY = WORLD_HEIGHT / 2;
    const minBaseSpacing = 500;

    this.skeletonBases = [];
    const baseCenters = [];

    for (let b = 0; b < baseCount; b++) {
      let bx, by, attempts = 0;
      do {
        bx = Phaser.Math.Between(160, WORLD_WIDTH - 160);
        by = Phaser.Math.Between(160, WORLD_HEIGHT - 160);
        attempts++;
      } while (
        attempts < 30 && (
          Phaser.Math.Distance.Between(bx, by, playerSpawnX, playerSpawnY) < spawnSafeRadius + 200 ||
          baseCenters.some(c => Phaser.Math.Distance.Between(bx, by, c.x, c.y) < minBaseSpacing)
        )
      );

      baseCenters.push({ x: bx, y: by });
      const base = this.buildSkeletonBase(bx, by);
      this.skeletonBases.push(base);

      this.spawnSkeletonAt(bx, by, base, 'melee', 5, 80);
      this.spawnSkeletonAt(bx, by, base, 'archer', 3, 80);
      this.spawnSkeletonAt(bx, by, base, 'knight', 4, 80);
    }
  }

  buildSkeletonBase(cx, cy) {
    const radius = 130;
    const wallSize = 20;
    const gateWidth = 40;
    const circumference = 2 * Math.PI * radius;
    const segmentCount = Math.floor(circumference / wallSize);
    const gateAngle = 0;
    const gateHalfSpan = (gateWidth / radius) / 2;

    const walls = [];
    for (let i = 0; i < segmentCount; i++) {
      const angle = (i / segmentCount) * Math.PI * 2;
      let diff = Phaser.Math.Angle.Wrap(angle - gateAngle);
      if (Math.abs(diff) < gateHalfSpan) continue;

      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const sprite = this.add.image(x, y, 'wall-segment').setDepth(y).setRotation(angle + Math.PI / 2);
      const collider = this.add.zone(x, y, wallSize, wallSize);
      this.physics.add.existing(collider, true);
      this.physics.add.collider(this.player, collider);
      this.physics.add.collider(this.skeletonGroup, collider);
      walls.push({ sprite, collider });
    }

    const gateX = cx + Math.cos(gateAngle) * radius;
    const gateY = cy + Math.sin(gateAngle) * radius;
    const gateSprite = this.add.image(gateX, gateY, 'base-gate').setDepth(gateY).setRotation(gateAngle + Math.PI / 2);

    return { x: cx, y: cy, radius, walls, gateSprite };
  }

  spawnSkeletonAt(baseX, baseY, base, type, count, spreadRadius) {
    const textureKey = type === 'archer' ? 'skeleton-archer' : type === 'knight' ? 'skeleton-knight' : 'skeleton';
    const maxHp = type === 'knight' ? 10 : 5;
    const touchDamage = type === 'knight' ? 2 : 1;

    for (let i = 0; i < count; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.FloatBetween(0, spreadRadius);
      const x = Phaser.Math.Clamp(baseX + Math.cos(angle) * dist, 40, WORLD_WIDTH - 40);
      const y = Phaser.Math.Clamp(baseY + Math.sin(angle) * dist, 40, WORLD_HEIGHT - 40);

      const sprite = this.physics.add.sprite(x, y, textureKey);
      sprite.setOrigin(0.5, 0.85);
      sprite.body.setSize(18, 14);
      sprite.body.setOffset(9, 20);
      this.skeletonGroup.add(sprite);

      const skeleton = {
        sprite,
        hp: maxHp,
        maxHp,
        hits: 0,
        dead: false,
        type,
        touchDamage,
        homeBase: base,
        lastAttackTime: 0,
        lastShotTime: 0,
        wanderTarget: null,
        nextWanderTime: 0
      };
      sprite.enemyRef = skeleton;

      const hpBarBg = this.add.rectangle(x, y, 28, 4, 0x1a1a1a, 0.8).setOrigin(0.5, 1);
      const hpBarFill = this.add.rectangle(x - 13, y, 26, 3, 0xd9432e, 1).setOrigin(0, 1);
      skeleton.hpBarBg = hpBarBg;
      skeleton.hpBarFill = hpBarFill;

      this.skeletons.push(skeleton);

      (this.treeCollidersPending || []).forEach(zone => this.physics.add.collider(sprite, zone));
      (this.rockCollidersPending || []).forEach(zone => this.physics.add.collider(sprite, zone));
    }
  }

  updateSkeletons() {
    const nightMult = this.nightSpeedMultiplier || 1;
    const chaseRange = this.isNight ? 300 : 220;
    const stopRange = 24;
    const speed = 70 * nightMult;

    const archerEngageRange = 260;
    const archerRetreatRange = 100;
    const archerSpeed = 60 * nightMult;
    const archerShotCooldown = 1600;

    this.skeletons.forEach(skeleton => {
      if (skeleton.dead) return;
      const sprite = skeleton.sprite;

      if (skeleton.hostileTarget) {
        if (skeleton.hostileTarget.dead) {
          skeleton.hostileTarget = null;
        } else {
          this.updateHostileSkeleton(skeleton, speed, stopRange);
          sprite.setDepth(sprite.y);
          skeleton.hpBarBg.setPosition(sprite.x, sprite.y - sprite.displayHeight - 6).setDepth(sprite.y + 1);
          skeleton.hpBarFill.setPosition(sprite.x - 13, sprite.y - sprite.displayHeight - 6).setDepth(sprite.y + 2);
          const hostileRatio = Phaser.Math.Clamp(skeleton.hp / skeleton.maxHp, 0, 1);
          skeleton.hpBarFill.width = 26 * hostileRatio;
          return;
        }
      }

      const nearFire = this.findNearestCampfire(sprite.x, sprite.y, this.campfireScareRadius);
      if (nearFire) {
        const angle = Phaser.Math.Angle.Between(nearFire.x, nearFire.y, sprite.x, sprite.y);
        sprite.body.setVelocity(Math.cos(angle) * this.campfireFleeSpeed, Math.sin(angle) * this.campfireFleeSpeed);
        sprite.setDepth(sprite.y);
        skeleton.hpBarBg.setPosition(sprite.x, sprite.y - sprite.displayHeight - 6).setDepth(sprite.y + 1);
        skeleton.hpBarFill.setPosition(sprite.x - 13, sprite.y - sprite.displayHeight - 6).setDepth(sprite.y + 2);
        return;
      }

      const d = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.player.x, this.player.y);

      if (skeleton.type === 'archer') {
        if (d < archerRetreatRange) {
          // Too close: back away from the player.
          const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, sprite.x, sprite.y);
          sprite.body.setVelocity(Math.cos(angle) * archerSpeed, Math.sin(angle) * archerSpeed);
        } else if (d < archerEngageRange) {
          // In range: hold position and fire.
          sprite.body.setVelocity(0, 0);
          if (this.time.now - skeleton.lastShotTime > archerShotCooldown) {
            skeleton.lastShotTime = this.time.now;
            this.fireArrow(skeleton);
          }
        } else {
          this.wanderSkeleton(skeleton, speed);
        }
      } else if (d < chaseRange && d > stopRange) {
        const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, this.player.x, this.player.y);
        sprite.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      } else if (d <= stopRange) {
        sprite.body.setVelocity(0, 0);
      } else {
        this.wanderSkeleton(skeleton, speed);
      }

      sprite.setDepth(sprite.y);
      skeleton.hpBarBg.setPosition(sprite.x, sprite.y - sprite.displayHeight - 6).setDepth(sprite.y + 1);
      skeleton.hpBarFill.setPosition(sprite.x - 13, sprite.y - sprite.displayHeight - 6).setDepth(sprite.y + 2);
      const ratio = Phaser.Math.Clamp(skeleton.hp / skeleton.maxHp, 0, 1);
      skeleton.hpBarFill.width = 26 * ratio;
    });

    this.updateArrows();
  }

  updateHostileSkeleton(skeleton, speed, stopRange) {
    const sprite = skeleton.sprite;
    const target = skeleton.hostileTarget;
    const targetSprite = target.sprite;
    const d = Phaser.Math.Distance.Between(sprite.x, sprite.y, targetSprite.x, targetSprite.y);

    if (d > stopRange) {
      const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, targetSprite.x, targetSprite.y);
      sprite.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    } else {
      sprite.body.setVelocity(0, 0);
      const now = this.time.now;
      if (!skeleton.lastAttackTime || now - skeleton.lastAttackTime > this.skeletonAttackCooldown) {
        skeleton.lastAttackTime = now;
        this.damageSkeleton(target);
      }
    }
  }

  wanderSkeleton(skeleton, speed) {
    const sprite = skeleton.sprite;
    if (!skeleton.wanderTarget || this.time.now > skeleton.nextWanderTime) {
      if (skeleton.homeBase) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist = Phaser.Math.FloatBetween(0, skeleton.homeBase.radius * 0.7);
        skeleton.wanderTarget = {
          x: skeleton.homeBase.x + Math.cos(angle) * dist,
          y: skeleton.homeBase.y + Math.sin(angle) * dist
        };
      } else {
        skeleton.wanderTarget = {
          x: sprite.x + Phaser.Math.Between(-100, 100),
          y: sprite.y + Phaser.Math.Between(-100, 100)
        };
      }
      skeleton.nextWanderTime = this.time.now + Phaser.Math.Between(2000, 4000);
    }
    const wd = Phaser.Math.Distance.Between(sprite.x, sprite.y, skeleton.wanderTarget.x, skeleton.wanderTarget.y);
    if (wd > 8) {
      const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, skeleton.wanderTarget.x, skeleton.wanderTarget.y);
      sprite.body.setVelocity(Math.cos(angle) * speed * 0.4, Math.sin(angle) * speed * 0.4);
    } else {
      sprite.body.setVelocity(0, 0);
    }
  }

  fireArrow(skeleton) {
    const sprite = skeleton.sprite;
    const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, this.player.x, this.player.y);

    const arrowSprite = this.physics.add.sprite(sprite.x, sprite.y - sprite.displayHeight * 0.4, 'arrow');
    this.arrowGroup.add(arrowSprite);
    arrowSprite.setRotation(angle);
    arrowSprite.body.setAllowGravity(false);
    arrowSprite.body.setSize(10, 6);
    arrowSprite.body.setVelocity(Math.cos(angle) * this.arrowSpeed, Math.sin(angle) * this.arrowSpeed);

    const arrow = { sprite: arrowSprite, hit: false, spawnTime: this.time.now, source: skeleton };
    arrowSprite.arrowRef = arrow;
    this.arrows.push(arrow);
  }

  updateArrows() {
    const maxLifetime = 3000;
    this.arrows.forEach(arrow => {
      if (arrow.hit) return;
      arrow.sprite.setDepth(arrow.sprite.y + 100000);
      if (this.time.now - arrow.spawnTime > maxLifetime) {
        this.destroyArrow(arrow);
      }
    });
  }

  destroyArrow(arrow) {
    if (arrow.destroyed) return;
    arrow.destroyed = true;
    arrow.sprite.destroy();
    this.arrows = this.arrows.filter(a => a !== arrow);
  }

  attackNearestSkeleton() {
    const range = 50;
    let nearest = null;
    let nearestDist = Infinity;
    this.skeletons.forEach(skeleton => {
      if (skeleton.dead) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, skeleton.sprite.x, skeleton.sprite.y);
      if (d < range && d < nearestDist) {
        nearest = skeleton;
        nearestDist = d;
      }
    });
    if (!nearest) return;
    this.damageSkeleton(nearest);
  }

  damageSkeleton(skeleton) {
    skeleton.hits++;
    skeleton.hp = Math.max(0, skeleton.maxHp - skeleton.hits);

    const sprite = skeleton.sprite;
    this.tweens.add({
      targets: sprite,
      x: sprite.x + Phaser.Math.Between(-6, 6),
      duration: 50,
      yoyo: true,
      repeat: 1
    });
    this.tweens.add({
      targets: sprite,
      alpha: 0.4,
      duration: 60,
      yoyo: true
    });

    if (skeleton.hits >= skeleton.maxHp) {
      this.killSkeleton(skeleton);
    }
  }

  killSkeleton(skeleton) {
    skeleton.dead = true;
    this.spawnBoneFragments(skeleton.sprite.x, skeleton.sprite.y);
    skeleton.sprite.destroy();
    skeleton.hpBarBg.destroy();
    skeleton.hpBarFill.destroy();
    this.skeletons = this.skeletons.filter(s => s !== skeleton);
  }

  spawnBoneFragments(x, y) {
    const count = Phaser.Math.Between(3, 5);

    for (let i = 0; i < count; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const flyDist = 10;
      const targetX = x + Math.cos(angle) * flyDist;
      const targetY = y + Math.sin(angle) * flyDist;

      const bone = this.add.image(x, y, 'icon-bone')
        .setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2))
        .setDepth(y + 100000);

      this.tweens.add({
        targets: bone,
        x: targetX,
        y: targetY,
        rotation: bone.rotation + Phaser.Math.FloatBetween(-2, 2),
        duration: 220,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          bone.destroy();

          const item = this.items.create(targetX, targetY, 'icon-bone');
          item.itemKind = 'bone';
          item.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
          item.setDepth(targetY - 500);
          item.body.setSize(item.width * 0.8, item.height * 0.8);
          item.body.setAllowGravity(false);
          item.body.moves = false;
        }
      });
    }
  }

  destroyRock(rock) {
    rock.sprite.destroy();
    if (rock.damageOverlay) rock.damageOverlay.destroy();
    if (rock.collider) rock.collider.destroy();
    this.breakableRocks.splice(this.breakableRocks.indexOf(rock), 1);
    this.rockPositions = this.rockPositions.filter(r => r.x !== rock.x || r.y !== rock.y);

    this.inventory.stone_chunk = (this.inventory.stone_chunk || 0) + 5;
    this.inventory.iron_ore = (this.inventory.iron_ore || 0) + 3;

    if (this.inventoryPanel.visible) this.renderInventoryPage();
  }

  craftItem(recipe) {
    if (!this.canCraft(recipe)) return;
    if (this.gameMode !== 'creative') {
      Object.entries(recipe.cost).forEach(([kind, amount]) => {
        this.inventory[kind] -= amount;
      });
    }
    this.inventory[recipe.result] = (this.inventory[recipe.result] || 0) + (recipe.yield || 1);
    this.renderInventoryPage();
  }

  updateNearbyItem() {
    const pickupRange = 34;
    let nearest = null;
    let nearestDist = Infinity;

    this.items.children.iterate(item => {
      if (!item || !item.active) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
      if (d < pickupRange && d < nearestDist) {
        nearest = item;
        nearestDist = d;
      }
    });

    this.nearbyItem = nearest;

    if (!nearest) {
      return;
    }

    this.promptText.setText('Press E to pick up');
    this.promptText.setPosition(nearest.x - this.promptText.width / 2, nearest.y - nearest.displayHeight - 14);
    this.promptText.setVisible(true);

    if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
      this.inventory[nearest.itemKind] = (this.inventory[nearest.itemKind] || 0) + 1;
      if (this.inventoryPanel.visible) this.renderInventoryPage();
      nearest.destroy();
      this.nearbyItem = null;
      this.promptText.setVisible(false);
    }
  }

  createPlayer() {
    const player = this.physics.add.sprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'player');
    player.setOrigin(0.5, 0.75);
    player.setCollideWorldBounds(true);
    player.body.setSize(20, 16);
    player.body.setOffset(10, 22);
    this.player = player;

    (this.treeCollidersPending || []).forEach(zone => {
      this.physics.add.collider(player, zone);
    });
    (this.rockCollidersPending || []).forEach(zone => {
      this.physics.add.collider(player, zone);
    });

    this.generateArmorPieceTextures();
    this.armorSprites = {
      chestplate: this.add.image(player.x, player.y, 'armor-chestplate-worn-iron').setVisible(false),
      legs: this.add.image(player.x, player.y, 'armor-legs-worn-iron').setVisible(false),
      arm: this.add.image(player.x, player.y, 'armor-arm-worn-iron').setVisible(false),
      gauntlet: this.add.image(player.x, player.y, 'armor-gauntlet-worn-iron').setVisible(false),
      helmet: this.add.image(player.x, player.y, 'armor-helmet-worn-iron').setVisible(false)
    };
  }

  generateArmorPieceTextures() {
    const ironPalette = {
      base: 0x8a8e96, dark: 0x6e727a, light: 0xb5bac2, rivet: 0x3a3e46,
      stroke: 0x4a4e56, strokeDark: 0x33363c, plume: 0xffe066, plumeAlpha: 0.9
    };

    this.drawArmorSet('iron', ironPalette);
  }

  drawArmorSet(suffix, p) {
    const size = 40;
    const cx = size / 2;

    // Chestplate: layered plates over the torso with rivets and a center ridge.
    {
      const g = this.add.graphics();
      const top = size * 0.42, h = 17, w = 20;
      g.fillStyle(p.base, 1);
      g.fillRoundedRect(cx - w / 2, top, w, h, 4);
      g.fillStyle(p.dark, 1);
      g.fillRoundedRect(cx - w / 2, top, w, h * 0.4, 3);
      g.fillStyle(p.light, 1);
      g.fillRect(cx - 1.6, top + 1, 3.2, h - 2);
      g.lineStyle(0.8, p.stroke, 0.9);
      g.strokeRoundedRect(cx - w / 2, top, w, h, 4);
      g.fillStyle(p.rivet, 0.9);
      g.fillCircle(cx - w / 2 + 3, top + 3, 1);
      g.fillCircle(cx + w / 2 - 3, top + 3, 1);
      g.fillCircle(cx - w / 2 + 3, top + h - 3, 1);
      g.fillCircle(cx + w / 2 - 3, top + h - 3, 1);
      // Shoulder pauldrons.
      g.fillStyle(p.base, 1);
      g.fillCircle(cx - w / 2 - 1, top + 2, 4);
      g.fillCircle(cx + w / 2 + 1, top + 2, 4);
      g.lineStyle(0.8, p.stroke, 0.9);
      g.strokeCircle(cx - w / 2 - 1, top + 2, 4);
      g.strokeCircle(cx + w / 2 + 1, top + 2, 4);
      g.generateTexture(`armor-chestplate-worn-${suffix}`, size, size);
      g.destroy();
    }

    // Leggings and boots: greaves down each leg with articulated knee plates.
    {
      const g = this.add.graphics();
      const top = size * 0.6, h = 15;
      g.fillStyle(p.dark, 1);
      g.fillRoundedRect(cx - 8, top, 6, h, 2);
      g.fillRoundedRect(cx + 2, top, 6, h, 2);
      g.fillStyle(p.base, 1);
      g.fillRoundedRect(cx - 8, top + 2, 6, 3, 1);
      g.fillRoundedRect(cx + 2, top + 2, 6, 3, 1);
      g.fillStyle(p.rivet, 1);
      g.fillRoundedRect(cx - 8.5, top + h - 4, 7, 5, 1.5);
      g.fillRoundedRect(cx + 1.5, top + h - 4, 7, 5, 1.5);
      g.lineStyle(0.8, p.strokeDark, 0.9);
      g.strokeRoundedRect(cx - 8, top, 6, h, 2);
      g.strokeRoundedRect(cx + 2, top, 6, h, 2);
      g.generateTexture(`armor-legs-worn-${suffix}`, size, size);
      g.destroy();
    }

    // Arm piece: a vambrace on the sword-arm side.
    {
      const g = this.add.graphics();
      const x = cx + 9, top = size * 0.44, h = 13;
      g.fillStyle(p.base, 1);
      g.fillRoundedRect(x - 3, top, 6, h, 2);
      g.fillStyle(p.dark, 1);
      g.fillRect(x - 3, top + 3, 6, 1.4);
      g.fillRect(x - 3, top + 7, 6, 1.4);
      g.lineStyle(0.7, p.stroke, 0.9);
      g.strokeRoundedRect(x - 3, top, 6, h, 2);
      g.generateTexture(`armor-arm-worn-${suffix}`, size, size);
      g.destroy();
    }

    // Gauntlet: an armored fist overlay near the hand.
    {
      const g = this.add.graphics();
      const x = cx + 9, y = size * 0.62;
      g.fillStyle(p.base, 1);
      g.fillRoundedRect(x - 4, y - 3, 8, 7, 2.5);
      g.fillStyle(p.dark, 1);
      for (let i = 0; i < 3; i++) {
        g.fillRoundedRect(x - 3.5 + i * 2.7, y - 5, 2, 3.5, 1);
      }
      g.generateTexture(`armor-gauntlet-worn-${suffix}`, size, size);
      g.destroy();
    }

    // Helmet: a full metal helm replacing the bare head, with a T-slit visor.
    // Matches the player's head circle exactly (radius 10, centered at size * 0.36).
    {
      const g = this.add.graphics();
      const hcy = size * 0.36;
      const hr = 10;
      g.fillStyle(p.base, 1);
      g.fillCircle(cx, hcy, hr);
      g.fillStyle(p.dark, 1);
      g.beginPath();
      g.arc(cx, hcy, hr, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(-20));
      g.lineTo(cx + hr, hcy);
      g.closePath();
      g.fillPath();
      g.lineStyle(0.9, p.stroke, 0.9);
      g.strokeCircle(cx, hcy, hr);
      g.fillStyle(p.plume, p.plumeAlpha);
      g.fillTriangle(cx, hcy - hr - 1.5, cx - 1.7, hcy - hr + 2.5, cx + 1.7, hcy - hr + 2.5);
      // T-slit visor over the eyes/nose.
      g.fillStyle(0x1a1a1a, 1);
      g.fillRect(cx - 5.5, hcy - 1, 11, 2.1);
      g.fillRect(cx - 1.05, hcy - 1, 2.1, 5.5);
      g.generateTexture(`armor-helmet-worn-${suffix}`, size, size);
      g.destroy();
    }
  }

  drawPoolBlob(g, size, colors) {
    const cx = size / 2, cy = size / 2;
    const points = [];
    const spikes = Phaser.Math.Between(9, 12);
    for (let i = 0; i < spikes; i++) {
      const angle = (i / spikes) * Math.PI * 2;
      const radius = size * 0.42 * Phaser.Math.FloatBetween(0.82, 1);
      points.push(new Phaser.Math.Vector2(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius));
    }

    g.fillStyle(colors.shadow, 0.3);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y + 4);
    for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y + 4);
    g.closePath();
    g.fillPath();

    g.fillStyle(colors.edge, 1);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
    g.closePath();
    g.fillPath();

    g.fillStyle(colors.main, 1);
    g.beginPath();
    g.moveTo(cx + (points[0].x - cx) * 0.82, cy + (points[0].y - cy) * 0.82);
    for (let i = 1; i < points.length; i++) {
      g.lineTo(cx + (points[i].x - cx) * 0.82, cy + (points[i].y - cy) * 0.82);
    }
    g.closePath();
    g.fillPath();

    g.fillStyle(colors.highlight, colors.highlightAlpha);
    g.fillCircle(cx - size * 0.1, cy - size * 0.08, size * 0.14);
  }

  generateLavaTexture() {
    const size = 120;
    const g = this.add.graphics();
    this.drawPoolBlob(g, size, {
      shadow: 0x000000, edge: 0x6b1f0f, main: 0xd9481f, highlight: 0xffb347, highlightAlpha: 0.55
    });
    g.generateTexture('lava-pool', size, size);
    g.destroy();
  }

  generateWaterTexture() {
    const size = 120;
    const g = this.add.graphics();
    this.drawPoolBlob(g, size, {
      shadow: 0x000000, edge: 0x1e5a7a, main: 0x2f88b5, highlight: 0x8fd6f0, highlightAlpha: 0.5
    });
    g.generateTexture('water-pool', size, size);
    g.destroy();
  }

  generateObsidianTexture() {
    const size = 120;
    const g = this.add.graphics();
    this.drawPoolBlob(g, size, {
      shadow: 0x000000, edge: 0x120a1c, main: 0x241533, highlight: 0x6a4a9e, highlightAlpha: 0.4
    });
    g.generateTexture('obsidian-patch', size, size);
    g.destroy();
  }

  generateGroundTexture() {
    const size = 64;
    const g = this.add.graphics();
    g.fillStyle(0x2f5d3a, 1);
    g.fillRect(0, 0, size, size);
    g.fillStyle(0x336640, 1);
    for (let i = 0; i < 14; i++) {
      const x = Phaser.Math.Between(0, size);
      const y = Phaser.Math.Between(0, size);
      g.fillCircle(x, y, Phaser.Math.Between(1, 3));
    }
    g.fillStyle(0x2a5233, 1);
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(0, size);
      const y = Phaser.Math.Between(0, size);
      g.fillCircle(x, y, Phaser.Math.Between(1, 2));
    }
    g.generateTexture('ground', size, size);
    g.destroy();
  }

  // Draws a simple pine/round tree (trunk + canopy) into a texture sized to fit.
  drawTree(g, size, style) {
    const trunkWidth = Math.max(2, Math.round(size * 0.09));
    const trunkHeight = Math.round(size * 0.28);
    const cx = size / 2;
    const baseY = size;

    g.fillStyle(0x5b3a21, 1);
    g.fillRect(cx - trunkWidth / 2, baseY - trunkHeight, trunkWidth, trunkHeight);

    const canopyTop = baseY - trunkHeight * 0.7;

    if (style === 'pine') {
      const tiers = 3;
      const tierHeight = canopyTop / tiers * 1.05;
      for (let t = 0; t < tiers; t++) {
        const tierBottom = canopyTop - t * tierHeight * 0.62;
        const tierWidth = size * (0.9 - t * 0.22);
        const shade = t === tiers - 1 ? 0x1f4d2b : (t === 1 ? 0x27592f : 0x2e6636);
        g.fillStyle(shade, 1);
        g.beginPath();
        g.moveTo(cx, tierBottom - tierHeight);
        g.lineTo(cx - tierWidth / 2, tierBottom);
        g.lineTo(cx + tierWidth / 2, tierBottom);
        g.closePath();
        g.fillPath();
      }
    } else {
      const r = size * 0.36;
      g.fillStyle(0x1f4d2b, 1);
      g.fillCircle(cx, canopyTop - r * 0.55, r);
      g.fillStyle(0x2e6636, 1);
      g.fillCircle(cx - r * 0.4, canopyTop - r * 0.9, r * 0.75);
      g.fillCircle(cx + r * 0.45, canopyTop - r * 0.75, r * 0.65);
      g.fillStyle(0x3a7a42, 1);
      g.fillCircle(cx - r * 0.15, canopyTop - r * 1.15, r * 0.5);
    }
  }

  generateTreeTextures() {
    const sizes = [
      { key: 'tree-pine-sm', size: 48, style: 'pine' },
      { key: 'tree-pine-md', size: 80, style: 'pine' },
      { key: 'tree-pine-lg', size: 128, style: 'pine' },
      { key: 'tree-round-sm', size: 48, style: 'round' },
      { key: 'tree-round-md', size: 80, style: 'round' },
      { key: 'tree-round-lg', size: 128, style: 'round' }
    ];

    this.treeKeys = sizes.map(s => s.key);

    sizes.forEach(({ key, size, style }) => {
      const g = this.add.graphics();
      this.drawTree(g, size, style);
      g.generateTexture(key, size, size);
      g.destroy();
    });
  }

  drawRock(g, size) {
    const cx = size / 2;
    const cy = size / 2;
    const points = [];
    const spikes = Phaser.Math.Between(6, 8);
    for (let i = 0; i < spikes; i++) {
      const angle = (i / spikes) * Math.PI * 2;
      const radius = size * 0.5 * Phaser.Math.FloatBetween(0.7, 1);
      points.push(new Phaser.Math.Vector2(
        cx + Math.cos(angle) * radius,
        cy + Math.sin(angle) * radius * 0.85 + size * 0.08
      ));
    }

    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(cx, size * 0.94, size * 0.95, size * 0.2);

    g.fillStyle(0x8f8f96, 1);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
    g.closePath();
    g.fillPath();

    g.fillStyle(0xb5b5bc, 1);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      if (points[i].y < cy + size * 0.1) g.lineTo(points[i].x, points[i].y);
      else g.lineTo(cx, cy);
    }
    g.closePath();
    g.fillPath();

    g.lineStyle(Math.max(1, size * 0.03), 0x4a4a50, 0.8);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
    g.closePath();
    g.strokePath();
  }

  generateRockTextures() {
    const sizes = [
      { key: 'rock-sm', size: 20 },
      { key: 'rock-md', size: 36 },
      { key: 'rock-lg', size: 56 },
      { key: 'rock-xl', size: 84 }
    ];

    this.rockKeys = sizes.map(s => s.key);

    sizes.forEach(({ key, size }) => {
      const g = this.add.graphics();
      this.drawRock(g, size);
      g.generateTexture(key, size, size);
      g.destroy();
    });
  }

  scatterRocks() {
    const count = 220;
    this.rockPositions = [];
    this.breakableRocks = [];
    for (let i = 0; i < count; i++) {
      const key = Phaser.Utils.Array.GetRandom(this.rockKeys);
      const x = Phaser.Math.Between(20, WORLD_WIDTH - 20);
      const y = Phaser.Math.Between(20, WORLD_HEIGHT - 20);
      const rock = this.add.image(x, y, key);
      const scale = Phaser.Math.FloatBetween(0.85, 1.25);
      rock.setScale(scale);
      rock.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
      rock.setOrigin(0.5, 0.75);
      rock.setDepth(y - 1);
      this.rockPositions.push({ x, y, clearRadius: rock.displayWidth * 0.9 });

      let collider = null;
      if (scale > 0.95) {
        collider = this.add.zone(x, y - rock.displayHeight * 0.15, rock.displayWidth * 0.6, rock.displayHeight * 0.4);
        this.physics.add.existing(collider, true);
        this.rockCollidersPending = this.rockCollidersPending || [];
        this.rockCollidersPending.push(collider);
      }

      this.breakableRocks.push({ x, y, sprite: rock, collider, hits: 0 });
    }
  }

  scatterPools() {
    this.pools = [];
    const playerSpawnX = WORLD_WIDTH / 2;
    const playerSpawnY = WORLD_HEIGHT / 2;
    const minSpacing = 400;

    const placePool = (kind) => {
      let x, y, attempts = 0;
      do {
        x = Phaser.Math.Between(150, WORLD_WIDTH - 150);
        y = Phaser.Math.Between(150, WORLD_HEIGHT - 150);
        attempts++;
      } while (
        attempts < 30 && (
          Phaser.Math.Distance.Between(x, y, playerSpawnX, playerSpawnY) < 250 ||
          this.pools.some(p => Phaser.Math.Distance.Between(x, y, p.x, p.y) < minSpacing)
        )
      );

      const texture = kind === 'lava' ? 'lava-pool' : 'water-pool';
      const scale = Phaser.Math.FloatBetween(0.8, 1.3);
      const sprite = this.add.image(x, y, texture).setScale(scale).setDepth(y - 1000000);
      const radius = sprite.displayWidth * 0.38;

      const collider = this.add.zone(x, y, radius * 1.6, radius * 1.6);
      this.physics.add.existing(collider, true);
      this.physics.add.collider(this.player, collider);
      this.physics.add.collider(this.skeletonGroup, collider);

      const pool = { kind, x, y, sprite, collider, radius };
      this.pools.push(pool);
    };

    const lavaCount = Phaser.Math.Between(2, 3);
    const waterCount = Phaser.Math.Between(2, 3);
    for (let i = 0; i < lavaCount; i++) placePool('lava');
    for (let i = 0; i < waterCount; i++) placePool('water');
  }

  scatterTrees() {
    const count = 420;
    const minSpacing = 26;
    const placed = [];
    this.choppableTrees = [];

    let attempts = 0;
    let placedCount = 0;
    while (placedCount < count && attempts < count * 12) {
      attempts++;
      const x = Phaser.Math.Between(20, WORLD_WIDTH - 20);
      const y = Phaser.Math.Between(20, WORLD_HEIGHT - 20);

      let tooClose = false;
      for (let i = placed.length - 1; i >= 0; i--) {
        const p = placed[i];
        if (Phaser.Math.Distance.Between(x, y, p.x, p.y) < minSpacing) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) {
        for (let i = 0; i < this.rockPositions.length; i++) {
          const r = this.rockPositions[i];
          if (Phaser.Math.Distance.Between(x, y, r.x, r.y) < r.clearRadius) {
            tooClose = true;
            break;
          }
        }
      }
      if (tooClose) continue;

      placed.push({ x, y });
      placedCount++;

      const key = Phaser.Utils.Array.GetRandom(this.treeKeys);
      const tree = this.add.image(x, y, key);
      tree.setOrigin(0.5, 1);
      const scale = Phaser.Math.FloatBetween(0.8, 1.3);
      tree.setScale(scale);
      tree.setDepth(y);

      const trunkWidth = tree.displayWidth * 0.09 * 2.2;
      const collider = this.add.zone(x, y - trunkWidth * 0.4, trunkWidth, trunkWidth * 0.8);
      this.physics.add.existing(collider, true);
      this.treeCollidersPending = this.treeCollidersPending || [];
      this.treeCollidersPending.push(collider);

      this.choppableTrees.push({ x, y, sprite: tree, collider, hits: 0 });
    }
  }

  setupCameraControls() {
    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.15, 0.15);

    const cursors = this.input.keyboard.createCursorKeys();
    const wasd = this.input.keyboard.addKeys('W,A,S,D');
    const speed = 220;

    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      const newZoom = Phaser.Math.Clamp(cam.zoom - deltaY * 0.001, 0.3, 2);
      cam.setZoom(newZoom);
    });

    this.events.on('update', () => {
      this.updateDayNightCycle();

      if (this.playerIsDead) {
        this.player.body.setVelocity(0, 0);
        this.updateSkeletons();
        return;
      }

      if (this.seatedOn) {
        this.player.body.setVelocity(0, 0);
      } else {
        let vx = 0;
        let vy = 0;
        if (cursors.left.isDown || wasd.A.isDown) vx -= 1;
        if (cursors.right.isDown || wasd.D.isDown) vx += 1;
        if (cursors.up.isDown || wasd.W.isDown) vy -= 1;
        if (cursors.down.isDown || wasd.S.isDown) vy += 1;

        if (vx !== 0 || vy !== 0) {
          const len = Math.hypot(vx, vy);
          this.player.body.setVelocity((vx / len) * speed, (vy / len) * speed);
        } else {
          this.player.body.setVelocity(0, 0);
        }
      }

      this.player.setDepth(this.player.y);
      this.updateNearbyItem();
      this.updateSeating();
      this.updateSmelting();
      this.updateBucketFill();
      this.updateEquippedSprite();
      this.updateArmorSprites();
      this.updateToolPrompt();
      this.updateSkeletons();
      this.updateAimReticle();
      this.updateThrownPebbles();
      this.updatePlayerArrows();

      if (Phaser.Input.Keyboard.JustDown(this.keyQ)) {
        this.toggleInventoryPanel();
      }

      const numberKeys = [this.hotbarKeys.ONE, this.hotbarKeys.TWO, this.hotbarKeys.THREE, this.hotbarKeys.FOUR, this.hotbarKeys.FIVE];
      numberKeys.forEach((key, i) => {
        if (Phaser.Input.Keyboard.JustDown(key)) {
          this.activateHotbarSlot(i);
        }
      });
    });
  }
}
