import Phaser from 'phaser';

export const inventoryMethods = {
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
      ak47: { label: 'AK-47', icon: 'icon-ak47', equippable: true, handIcon: 'icon-ak47' },
      famas: { label: 'FAMAS', icon: 'icon-famas', equippable: true, handIcon: 'icon-famas' },
      glock17: { label: 'Glock-17', icon: 'icon-glock17', equippable: true, handIcon: 'icon-glock17' },
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
  },

  setInventoryTab(tab) {
    this.activeTab = tab;
    this.itemsTabBtn.setStyle(tab === 'items' ? this.tabStyleOn : this.tabStyleOff);
    this.craftTabBtn.setStyle(tab === 'craft' ? this.tabStyleOn : this.tabStyleOff);
    this.equipTabBtn.setStyle(tab === 'equip' ? this.tabStyleOn : this.tabStyleOff);
    this.invPage = 0;
    this.renderInventoryPage();
  },

  positionInventoryPanel() {
    const { width, height } = this.scale;
    const { width: pw, height: ph } = this.inventoryPanelSize;
    this.inventoryPanel.setPosition(width / 2 - pw / 2, height / 2 - ph / 2);
  },

  getInventoryEntries() {
    return Object.keys(this.itemDefs)
      .map(kind => ({ kind, count: this.inventory[kind] || 0, ...this.itemDefs[kind] }))
      .filter(entry => entry.count > 0);
  },

  toggleInventoryPanel() {
    const opening = !this.inventoryPanel.visible;
    this.inventoryPanel.setVisible(opening);
    if (opening) {
      this.invPage = 0;
      this.renderInventoryPage();
    }
  },

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
  },

  renderInventoryPage() {
    if (this.activeTab === 'craft') {
      this.renderCraftPage();
    } else if (this.activeTab === 'equip') {
      this.renderEquipPage();
    } else {
      this.renderItemsPage();
    }
  },

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
  },

  canCraft(recipe) {
    const hasMaterials = Object.entries(recipe.cost).every(([kind, amount]) => (this.inventory[kind] || 0) >= amount);
    if (!hasMaterials) return false;
    if (recipe.requiresCraftingTable && !this.isNearCraftingTable()) return false;
    return true;
  },

  isNearCraftingTable() {
    if (!this.craftingTables || this.craftingTables.length === 0) return false;
    return this.craftingTables.some(t => Phaser.Math.Distance.Between(this.player.x, this.player.y, t.x, t.y) < 80);
  },

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
  },

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
  },

  toggleEquip(kind) {
    this.equippedItem = this.equippedItem === kind ? null : kind;

    if (this.equippedItem) {
      this.equippedSprite.setTexture(this.itemDefs[this.equippedItem].handIcon);
      this.equippedSprite.setVisible(true);
    } else {
      this.equippedSprite.setVisible(false);
    }

    this.renderInventoryPage();
  },

  toggleArmorPiece(kind) {
    const slot = this.itemDefs[kind].armorSlot;
    this.equippedArmor[slot] = this.equippedArmor[slot] === kind ? null : kind;
    this.recalculateArmorHpBonus();
    this.renderInventoryPage();
  },

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
  },

  craftItem(recipe) {
    if (!this.canCraft(recipe)) return;
    if (this.gameMode !== 'creative') {
      Object.entries(recipe.cost).forEach(([kind, amount]) => {
        this.inventory[kind] -= amount;
      });
    }
    this.inventory[recipe.result] = (this.inventory[recipe.result] || 0) + (recipe.yield || 1);
    this.renderInventoryPage();
  },

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
  },
};
