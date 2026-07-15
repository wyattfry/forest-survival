import Phaser from 'phaser';

export const buildingMethods = {
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
  },

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
  },

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
  },

  sitDown(seat) {
    seat.occupied = true;
    this.seatedOn = seat;
    this.player.body.setVelocity(0, 0);
    this.player.setPosition(seat.x, seat.y - 2);
    this.promptText.setVisible(false);

    this.skipStartedNight = this.isNight;
  },

  standUp() {
    if (!this.seatedOn) return;
    this.seatedOn.occupied = false;
    this.seatedOn = null;
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

  convertLavaToObsidian(lavaPool) {
    lavaPool.sprite.destroy();
    if (lavaPool.collider) lavaPool.collider.destroy();
    this.pools = this.pools.filter(p => p !== lavaPool);

    const obsidianSprite = this.add.image(lavaPool.x, lavaPool.y, 'obsidian-patch')
      .setScale(lavaPool.sprite.scaleX)
      .setDepth(lavaPool.y - 1000000);

    this.obsidianDeposits = this.obsidianDeposits || [];
    this.obsidianDeposits.push({ x: lavaPool.x, y: lavaPool.y, sprite: obsidianSprite, hits: 0 });
  },

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
  },

  positionFurnacePanel() {
    const { width, height } = this.scale;
    const { width: pw, height: ph } = this.furnacePanelSize;
    this.furnacePanel.setPosition(width / 2 - pw / 2, height / 2 - ph / 2);
  },

  openFurnacePanel(furnace) {
    if (!this.furnacePanel) this.setupFurnacePanel();
    this.activeFurnace = furnace;
    furnace.slots = furnace.slots || { wood: 0, iron_ore: 0, output: 0 };
    this.furnaceSlots = furnace.slots;
    this.renderFurnacePanel();
    this.furnacePanel.setVisible(true);
    this.promptText.setVisible(false);
  },

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
  },

  addToFurnaceSlot(kind) {
    if ((this.inventory[kind] || 0) <= 0) return;
    this.inventory[kind]--;
    this.furnaceSlots[kind]++;
    this.renderFurnacePanel();
    if (this.inventoryPanel.visible) this.renderInventoryPage();
  },

  renderFurnacePanel() {
    const { woodCountLabel, oreCountLabel, outputCountLabel, resultLabel } = this.furnacePanelUI;
    woodCountLabel.setText(`x${this.furnaceSlots.wood}`);
    oreCountLabel.setText(`x${this.furnaceSlots.iron_ore}`);
    outputCountLabel.setText(`x${this.furnaceSlots.output}`);
    resultLabel.setText(`Iron Ingots in inventory: ${this.inventory.iron_ingot || 0}`);
  },

  smeltAtFurnace() {
    if (this.furnaceSlots.wood <= 0 || this.furnaceSlots.iron_ore <= 0) return;

    this.furnaceSlots.wood--;
    this.furnaceSlots.iron_ore--;
    this.furnaceSlots.output++;

    this.renderFurnacePanel();
  },

  collectFurnaceOutput() {
    if (this.furnaceSlots.output <= 0) return;

    this.inventory.iron_ingot = (this.inventory.iron_ingot || 0) + this.furnaceSlots.output;
    this.furnaceSlots.output = 0;

    this.renderFurnacePanel();
    if (this.inventoryPanel.visible) this.renderInventoryPage();
  },
};
