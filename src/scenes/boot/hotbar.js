export const hotbarMethods = {
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
        .on('pointerdown', () => this.handleHotbarSlotClick(i));

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
  },

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
  },

  assignToHotbar(kind) {
    const emptyIndex = this.hotbar.findIndex(k => k === null);
    if (emptyIndex === -1) return;
    if (this.hotbar.includes(kind)) return;

    this.hotbar[emptyIndex] = kind;
    this.renderHotbar();
  },

  clearHotbarSlot(index) {
    this.hotbar[index] = null;
    this.renderHotbar();
  },

  handleHotbarSlotClick(index) {
    const now = this.time.now;
    const isDoubleClick = this.lastHotbarClick
      && this.lastHotbarClick.index === index
      && now - this.lastHotbarClick.time < 350;

    this.lastHotbarClick = { index, time: now };

    if (isDoubleClick) {
      this.lastHotbarClick = null;
      if (this.hotbar[index]) {
        if (this.equippedItem === this.hotbar[index]) {
          this.equippedItem = null;
          this.equippedSprite.setVisible(false);
        }
        this.clearHotbarSlot(index);
      }
      return;
    }

    this.activateHotbarSlot(index);
  },

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
  },

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
  },
};
