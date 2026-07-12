import Phaser from 'phaser';

// Visual-only stand-in for another client's player: no input handling, no world
// simulation of its own — it just lerps toward the last position the host broadcast.
// Assumes the 'player' texture already exists (BootScene.generatePlayerTexture()
// generates it before any RemotePlayer is created).
export default class RemotePlayer {
  constructor(scene, x, y, color, name, isHost = false) {
    this.scene = scene;

    this.sprite = scene.add.sprite(x, y, 'player');
    if (color != null) this.sprite.setTint(color);

    this.name = name || 'Player';
    this.isHost = isHost;
    this.nameText = scene.add.text(x, y - 26, `${this.name}${isHost ? '  ♛' : ''}`, {
      fontFamily: 'Arial', fontSize: '12px', color: '#ffffff',
      backgroundColor: '#000000aa', padding: { x: 3, y: 1 }
    }).setOrigin(0.5, 1);

    this.targetX = x;
    this.targetY = y;
    this.hp = 20;
    this.dead = false;

    // Off-screen indicator: an arrow + name pinned to the viewport edge,
    // pointing toward this player when they're outside the camera view.
    this.edgeArrow = scene.add.triangle(0, 0, 0, -9, -7, 7, 7, 7, color ?? 0xffffff)
      .setScrollFactor(0).setDepth(2000000).setVisible(false);
    this.edgeLabel = scene.add.text(0, 0, this.name, {
      fontFamily: 'Arial', fontSize: '12px', color: '#ffffff',
      backgroundColor: '#000000aa', padding: { x: 3, y: 1 }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(2000000).setVisible(false);
  }

  markDead() {
    this.dead = true;
    this.sprite.setAlpha(0.4);
    this.nameText.setAlpha(0.4);
  }

  markAlive() {
    this.dead = false;
    this.sprite.setAlpha(1);
    this.nameText.setAlpha(1);
  }

  applyState(state) {
    this.targetX = state.x;
    this.targetY = state.y;
    if (state.hp != null) this.hp = state.hp;
    if (state.flipX != null) this.sprite.setFlipX(state.flipX);
  }

  update() {
    // Simple lerp toward the last broadcast position, smooths out the
    // host's ~10Hz snapshot rate without any prediction/reconciliation.
    this.sprite.x = Phaser.Math.Linear(this.sprite.x, this.targetX, 0.25);
    this.sprite.y = Phaser.Math.Linear(this.sprite.y, this.targetY, 0.25);
    this.sprite.setDepth(this.sprite.y);

    this.nameText.setPosition(this.sprite.x, this.sprite.y - 26);

    this.updateEdgeIndicator(this.sprite.x, this.sprite.y);
  }

  // Shows an arrow + name at the camera edge, pointing toward this player,
  // whenever they're outside the current viewport.
  updateEdgeIndicator(worldX, worldY) {
    const cam = this.scene.cameras.main;
    const margin = 30;
    const view = cam.worldView;

    const onScreen = worldX >= view.x && worldX <= view.right &&
      worldY >= view.y && worldY <= view.bottom;

    if (onScreen) {
      this.edgeArrow.setVisible(false);
      this.edgeLabel.setVisible(false);
      return;
    }

    const centerX = view.x + view.width / 2;
    const centerY = view.y + view.height / 2;
    const angle = Phaser.Math.Angle.Between(centerX, centerY, worldX, worldY);

    const halfW = cam.width / 2 - margin;
    const halfH = cam.height / 2 - margin;
    const scale = Math.min(
      Math.abs(halfW / Math.cos(angle)) || Infinity,
      Math.abs(halfH / Math.sin(angle)) || Infinity
    );

    const screenX = cam.width / 2 + Math.cos(angle) * scale;
    const screenY = cam.height / 2 + Math.sin(angle) * scale;

    this.edgeArrow.setPosition(screenX, screenY);
    this.edgeArrow.setRotation(angle + Math.PI / 2);
    this.edgeArrow.setVisible(true);

    this.edgeLabel.setPosition(screenX, screenY + 12);
    this.edgeLabel.setVisible(true);
  }

  destroy() {
    this.sprite.destroy();
    this.nameText.destroy();
    this.edgeArrow.destroy();
    this.edgeLabel.destroy();
  }
}
