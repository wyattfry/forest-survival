import Phaser from 'phaser';
import { WORLD_WIDTH, WORLD_HEIGHT, SHOP_ITEMS_PER_PAGE, SHOP_PRICES } from './constants.js';

export const shopMethods = {
  setupWorldShop() {
    const rng = new Phaser.Math.RandomDataGenerator([
      `shop-${this.roomCode || this.worldId || this.worldName || 'world'}`
    ]);
    const playerSpawn = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
    let x = 300;
    let y = 300;
    for (let attempt = 0; attempt < 60; attempt++) {
      const candidateX = rng.between(160, WORLD_WIDTH - 160);
      const candidateY = rng.between(160, WORLD_HEIGHT - 160);
      const awayFromSpawn = Phaser.Math.Distance.Between(candidateX, candidateY, playerSpawn.x, playerSpawn.y) > 380;
      const awayFromTrees = !(this.choppableTrees || []).some(tree =>
        Phaser.Math.Distance.Between(candidateX, candidateY, tree.x, tree.y) < 100
      );
      const awayFromRocks = !(this.rockPositions || []).some(rock =>
        Phaser.Math.Distance.Between(candidateX, candidateY, rock.x, rock.y) < 100
      );
      if (awayFromSpawn && awayFromTrees && awayFromRocks) {
        x = candidateX;
        y = candidateY;
        break;
      }
    }

    const depth = y;
    const building = this.add.rectangle(x, y, 100, 62, 0x8b5a2b)
      .setStrokeStyle(3, 0x4b2d16).setDepth(depth);
    const roof = this.add.triangle(x, y - 44, 0, 36, 50, 0, 100, 36, 0xb94132)
      .setStrokeStyle(3, 0x70251e).setDepth(depth + 1);
    const counter = this.add.rectangle(x, y + 22, 76, 18, 0x5b351c)
      .setStrokeStyle(2, 0x321b0e).setDepth(depth + 2);
    const merchant = this.add.circle(x, y - 2, 10, 0xe0ac69).setDepth(depth + 2);
    const sign = this.add.text(x, y - 31, 'SHOP', {
      fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', color: '#ffe58a',
      backgroundColor: '#3b2414', padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setDepth(depth + 3);

    const collider = this.add.zone(x, y, 96, 58);
    this.physics.add.existing(collider, true);
    this.physics.add.collider(this.player, collider);
    this.worldShop = { x, y, building, roof, counter, merchant, sign, collider };
    this.shopInteractionPoint = { x, y: y + 58 };

    this.shopPromptText = this.add.text(x, y + 64, 'Press E to shop', {
      fontFamily: 'Arial', fontSize: '13px', color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)', padding: { x: 7, y: 4 }
    }).setOrigin(0.5, 0).setDepth(depth + 4).setVisible(false);

    this.createShopPanel();
  },

  createShopPanel() {
    const panelWidth = 430;
    const panelHeight = 430;
    this.shopPage = 0;
    this.shopPanel = this.add.container(0, 0).setScrollFactor(0).setDepth(2800000).setVisible(false);
    this.shopPanelSize = { width: panelWidth, height: panelHeight };

    const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x171717, 0.96)
      .setOrigin(0, 0).setStrokeStyle(2, 0xffd84a, 0.8);
    const title = this.add.text(18, 14, 'TRAVELING SHOP', {
      fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold', color: '#ffd84a'
    });
    this.shopCoinText = this.add.text(panelWidth - 55, 18, '', {
      fontFamily: 'Arial', fontSize: '14px', color: '#ffd84a'
    }).setOrigin(1, 0);
    const closeHit = this.add.rectangle(panelWidth - 40, 10, 28, 26, 0x4a3030)
      .setOrigin(0, 0).setInteractive({ useHandCursor: true });
    const close = this.add.text(panelWidth - 26, 23, 'X', {
      fontFamily: 'Arial', fontSize: '14px', color: '#ffffff'
    }).setOrigin(0.5);

    this.shopRows = this.add.container(18, 58);
    this.shopMessageText = this.add.text(panelWidth / 2, panelHeight - 60, '', {
      fontFamily: 'Arial', fontSize: '12px', color: '#aaaaaa'
    }).setOrigin(0.5);
    this.shopPrevHit = this.add.rectangle(18, panelHeight - 42, 82, 30, 0x343434)
      .setOrigin(0, 0).setInteractive({ useHandCursor: true });
    this.shopPrevBtn = this.add.text(59, panelHeight - 27, '< Prev', {
      fontFamily: 'Arial', fontSize: '13px', color: '#ffffff'
    }).setOrigin(0.5);
    this.shopPageText = this.add.text(panelWidth / 2, panelHeight - 34, '', {
      fontFamily: 'Arial', fontSize: '13px', color: '#cccccc'
    }).setOrigin(0.5);
    this.shopNextHit = this.add.rectangle(panelWidth - 100, panelHeight - 42, 82, 30, 0x343434)
      .setOrigin(0, 0).setInteractive({ useHandCursor: true });
    this.shopNextBtn = this.add.text(panelWidth - 59, panelHeight - 27, 'Next >', {
      fontFamily: 'Arial', fontSize: '13px', color: '#ffffff'
    }).setOrigin(0.5);

    this.shopPanel.add([
      bg, title, this.shopCoinText, closeHit, close, this.shopRows, this.shopMessageText,
      this.shopPrevHit, this.shopPrevBtn, this.shopPageText, this.shopNextHit, this.shopNextBtn
    ]);
    this.shopCursorKeys = this.input.keyboard.createCursorKeys();
    this.shopPointerHandler = (pointer) => this.handleShopPointerDown(pointer);
    this.input.on('pointerdown', this.shopPointerHandler);
    this.events.once('shutdown', () => {
      this.input.off('pointerdown', this.shopPointerHandler);
      this.shopPointerHandler = null;
    });
    this.positionShopPanel();
    this.scale.on('resize', () => this.positionShopPanel());
    this.renderShopPage();
  },

  positionShopPanel() {
    if (!this.shopPanel) return;
    this.shopPanel.setPosition(
      (this.scale.width - this.shopPanelSize.width) / 2,
      (this.scale.height - this.shopPanelSize.height) / 2
    );
  },

  updateShopInteraction() {
    if (!this.worldShop || !this.player) return;
    const distance = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.shopInteractionPoint.x, this.shopInteractionPoint.y
    );
    const nearby = distance < 85;
    this.shopPromptText.setVisible(nearby && !this.shopPanel.visible);
    if (nearby && Phaser.Input.Keyboard.JustDown(this.keyE)) {
      if (this.shopPanel.visible) this.closeShop();
      else this.openShop();
    } else if (!nearby && this.shopPanel.visible) {
      this.closeShop();
    }
    if (this.shopPanel.visible && Phaser.Input.Keyboard.JustDown(this.shopCursorKeys.left)) {
      this.changeShopPage(-1);
    }
    if (this.shopPanel.visible && Phaser.Input.Keyboard.JustDown(this.shopCursorKeys.right)) {
      this.changeShopPage(1);
    }
  },

  openShop() {
    this.shopMessageText.setText('');
    this.renderShopPage();
    this.shopPanel.setVisible(true);
    this.shopPromptText.setVisible(false);
  },

  closeShop() {
    if (this.shopPanel) this.shopPanel.setVisible(false);
  },

  changeShopPage(delta) {
    const totalPages = Math.ceil(Object.keys(this.itemDefs).length / SHOP_ITEMS_PER_PAGE);
    this.shopPage = Phaser.Math.Clamp(this.shopPage + delta, 0, totalPages - 1);
    this.shopMessageText.setText('');
    this.renderShopPage();
  },

  handleShopPointerDown(pointer) {
    if (!this.shopPanel?.visible) return;
    const localX = pointer.x - this.shopPanel.x;
    const localY = pointer.y - this.shopPanel.y;
    const { width, height } = this.shopPanelSize;

    if (localX >= width - 40 && localX <= width - 12 && localY >= 10 && localY <= 36) {
      this.closeShop();
      return;
    }
    if (localY >= height - 42 && localY <= height - 12) {
      if (localX >= 18 && localX <= 100) {
        this.changeShopPage(-1);
        return;
      }
      if (localX >= width - 100 && localX <= width - 18) {
        this.changeShopPage(1);
        return;
      }
    }

    const rowsX = localX - 18;
    const rowsY = localY - 58;
    if (rowsX < 318 || rowsX > 376 || rowsY < 0) return;
    const rowIndex = Math.floor(rowsY / 43);
    const withinRowY = rowsY - rowIndex * 43;
    if (rowIndex < 0 || rowIndex >= SHOP_ITEMS_PER_PAGE || withinRowY < 4 || withinRowY > 33) return;

    const kinds = Object.keys(this.itemDefs);
    const kind = kinds[this.shopPage * SHOP_ITEMS_PER_PAGE + rowIndex];
    if (kind) this.buyShopItem(kind);
  },

  renderShopPage() {
    if (!this.shopRows) return;
    this.shopRows.removeAll(true);
    const kinds = Object.keys(this.itemDefs);
    const totalPages = Math.max(1, Math.ceil(kinds.length / SHOP_ITEMS_PER_PAGE));
    this.shopPage = Phaser.Math.Clamp(this.shopPage, 0, totalPages - 1);
    const visibleKinds = kinds.slice(
      this.shopPage * SHOP_ITEMS_PER_PAGE,
      (this.shopPage + 1) * SHOP_ITEMS_PER_PAGE
    );

    visibleKinds.forEach((kind, index) => {
      const def = this.itemDefs[kind];
      const price = SHOP_PRICES[kind] ?? 10;
      const y = index * 43;
      const rowBg = this.add.rectangle(0, y, 394, 37, index % 2 ? 0x242424 : 0x202020)
        .setOrigin(0, 0);
      const icon = this.add.image(20, y + 18, def.icon).setDisplaySize(24, 24);
      const label = this.add.text(42, y + 9, def.label, {
        fontFamily: 'Arial', fontSize: '13px', color: '#ffffff'
      });
      const priceText = this.add.text(292, y + 9, `${price}c`, {
        fontFamily: 'Arial', fontSize: '13px', color: '#ffd84a'
      }).setOrigin(1, 0);
      const canAfford = this.coins >= price;
      const buyHit = this.add.rectangle(318, y + 4, 58, 29, canAfford ? 0x3a6b3a : 0x3a3a3a)
        .setOrigin(0, 0).setInteractive({ useHandCursor: true });
      const buy = this.add.text(347, y + 18, 'Buy', {
        fontFamily: 'Arial', fontSize: '13px', color: canAfford ? '#ffffff' : '#888888'
      }).setOrigin(0.5);
      this.shopRows.add([rowBg, icon, label, priceText, buyHit, buy]);
    });

    this.shopCoinText.setText(`● ${this.coins}`);
    this.shopPageText.setText(`Page ${this.shopPage + 1} / ${totalPages}`);
    this.shopPrevBtn.setAlpha(this.shopPage === 0 ? 0.35 : 1);
    this.shopPrevHit.setAlpha(this.shopPage === 0 ? 0.35 : 1);
    this.shopNextBtn.setAlpha(this.shopPage === totalPages - 1 ? 0.35 : 1);
    this.shopNextHit.setAlpha(this.shopPage === totalPages - 1 ? 0.35 : 1);
  },

  buyShopItem(kind) {
    const def = this.itemDefs[kind];
    if (!def) return;
    const price = SHOP_PRICES[kind] ?? 10;
    if (this.coins < price) {
      this.shopMessageText.setColor('#ff7777').setText(`Need ${price - this.coins} more coins`);
      return;
    }
    this.setCoins(this.coins - price);
    this.inventory[kind] = (this.inventory[kind] || 0) + 1;
    this.shopMessageText.setColor('#77dd88').setText(`Bought ${def.label}`);
    if (this.inventoryPanel.visible) this.renderInventoryPage();
    this.renderShopPage();
  },
};
