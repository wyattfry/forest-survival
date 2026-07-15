import { writeWorld } from '../../SaveManager.js';

export const persistenceMethods = {
  setupAutosave() {
    if (!this.worldId) return;

    this.time.addEvent({ delay: 15000, loop: true, callback: () => this.saveGame() });
    this.events.on('shutdown', () => this.saveGame());

    this.beforeUnloadHandler = () => this.saveGame();
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    this.events.once('shutdown', () => window.removeEventListener('beforeunload', this.beforeUnloadHandler));
  },

  saveGame() {
    if (!this.player || !this.worldId) return;

    writeWorld(this.worldId, {
      version: 1,
      player: { x: this.player.x, y: this.player.y },
      inventory: this.inventory,
      coins: this.coins,
      hotbar: this.hotbar,
      equippedItem: this.equippedItem,
      equippedArmor: this.equippedArmor,
      playerHp: this.playerHp,
      playerMaxHp: this.playerMaxHp,
      armorHpBonus: this.armorHpBonus,
      gameMode: this.gameMode,
      cycleElapsed: (this.time.now - this.cycleStartTime) % this.cycleLengthMs
    });
  },

  exitToMenu() {
    this.saveGame();
    this.scene.start('MenuScene');
  },

  applySaveData(data) {
    if (!data) return;

    if (data.player) {
      this.player.setPosition(data.player.x, data.player.y);
      this.cameras.main.centerOn(data.player.x, data.player.y);
    }

    if (data.inventory) this.inventory = data.inventory;
    if (typeof data.coins === 'number') this.setCoins(data.coins);

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
  },
};
