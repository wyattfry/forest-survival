import Phaser from 'phaser';

export const modsMethods = {
  // Gun Mod: called once, only for a brand-new world (not on load, so a player who
  // drops/loses a gun doesn't have it silently re-granted every time they reload).
  grantStartingGuns() {
    ['ak47', 'famas', 'glock17'].forEach(kind => {
      this.inventory[kind] = 1;
      this.assignToHotbar(kind);
    });
    this.renderHotbar();
  },

  // Clone Mod: press C to spawn (or despawn) a purely visual companion that mirrors
  // the player's own appearance and follows a short distance behind. No AI decisions,
  // no combat — just a mirror that tags along.
  setupCloneMod() {
    if (!this.cloneMod) return;

    this.clone = null;
    this.keyC = this.input.keyboard.addKey('C');

    this.cloneModBtn = this.add.text(0, 0, 'Clone (C)', {
      fontFamily: 'Arial', fontSize: '13px', color: '#ffffff',
      backgroundColor: 'rgba(58,58,107,0.85)', padding: { x: 8, y: 5 }
    }).setScrollFactor(0).setDepth(2500000)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleClone());

    const position = () => this.cloneModBtn.setPosition(12, this.roomCode ? 46 : 12);
    position();
    this.scale.on('resize', position);
  },

  toggleClone() {
    if (this.clone) {
      this.despawnClone();
    } else {
      this.spawnClone();
    }
    if (this.cloneModBtn) {
      this.cloneModBtn.setText(this.clone ? 'Despawn Clone (C)' : 'Clone (C)');
    }
  },

  spawnClone() {
    if (this.clone) return;

    const offsetX = Phaser.Math.Between(-40, -24) * (Phaser.Math.Between(0, 1) ? 1 : -1);
    const sprite = this.add.sprite(this.player.x + offsetX, this.player.y, this.player.texture.key);
    sprite.setDepth(this.player.y);

    const nameText = this.add.text(sprite.x, sprite.y - 26, 'Clone', {
      fontFamily: 'Arial', fontSize: '11px', color: '#ffe066',
      backgroundColor: '#000000aa', padding: { x: 3, y: 1 }
    }).setOrigin(0.5, 1);

    this.clone = { sprite, nameText };
  },

  despawnClone() {
    if (!this.clone) return;
    this.clone.sprite.destroy();
    this.clone.nameText.destroy();
    this.clone = null;
  },

  updateClone() {
    if (!this.clone) return;
    const { sprite, nameText } = this.clone;

    const followDistance = 34;
    const d = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.player.x, this.player.y);
    if (d > followDistance) {
      const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, this.player.x, this.player.y);
      const speed = Phaser.Math.Clamp((d - followDistance) * 4, 0, 200);
      sprite.x += Math.cos(angle) * speed * (this.game.loop.delta / 1000);
      sprite.y += Math.sin(angle) * speed * (this.game.loop.delta / 1000);
    }

    sprite.setTexture(this.player.texture.key);
    sprite.setDepth(sprite.y);
    nameText.setPosition(sprite.x, sprite.y - 26);
  },
};
