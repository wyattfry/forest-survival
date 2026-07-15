import Phaser from 'phaser';
import { playArrowHitSound } from '../../SoundManager.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from './constants.js';

export const combatMethods = {
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
    this.generateSkeletonRiderTexture();
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
  },

  positionDeathScreen() {
    const { width, height } = this.scale;
    this.deathScreen.setPosition(width / 2, height / 2);
  },

  positionHpBar() {
    const { width } = this.scale;
    const x = width - this.hpBarMargin - this.hpBarWidth;
    const y = this.hpBarMargin;
    this.hpBarBg.setPosition(x, y);
    this.hpBarFill.setPosition(x + 3, y + 3);
    this.hpBarText.setPosition(x + this.hpBarWidth / 2, y + this.hpBarHeight / 2);
  },

  updateHpBar() {
    const ratio = Phaser.Math.Clamp(this.playerHp / this.playerMaxHp, 0, 1);
    this.hpBarFill.width = (this.hpBarWidth - 6) * ratio;
    this.hpBarText.setText(`HP: ${this.playerHp} / ${this.playerMaxHp}`);
  },

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
  },

  handleSkeletonTouch(skeleton) {
    if (!skeleton || skeleton.dead) return;
    const now = this.time.now;
    if (skeleton.lastAttackTime && now - skeleton.lastAttackTime < this.skeletonAttackCooldown) return;
    skeleton.lastAttackTime = now;

    this.damagePlayer(skeleton.touchDamage || 1);
  },

  handleArrowHit(arrow) {
    if (!arrow || arrow.hit) return;
    arrow.hit = true;

    playArrowHitSound(this, 0);
    this.damagePlayer(this.arrowDamage);
    this.destroyArrow(arrow);
  },

  handleArrowSkeletonHit(skeleton, arrow) {
    if (!arrow || arrow.hit || !skeleton || skeleton.dead) return;
    // All arrows in arrowGroup are fired by skeleton archers. Let them pass
    // through every skeleton without damage or retaliation.
    if (arrow.source) return;

    arrow.hit = true;
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, skeleton.sprite.x, skeleton.sprite.y);
    playArrowHitSound(this, dist);
    this.damageSkeleton(skeleton);
    this.destroyArrow(arrow);

  },

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
  },

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
  },

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
  },

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
  },
};
