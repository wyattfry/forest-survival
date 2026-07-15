import Phaser from 'phaser';

export const enemyTexturesMethods = {
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
  },

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
  },

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
  },

  // Skeleton horse rider: a wide horizontal texture (horse skeleton body + legs)
  // with a small skeleton rider silhouette on top, facing right by default.
  generateSkeletonRiderTexture() {
    this.drawSkeletonRiderFrame('skeleton-rider', 0);
    this.drawSkeletonRiderFrame('skeleton-rider-walk1', -3);
    this.drawSkeletonRiderFrame('skeleton-rider-walk2', 3);
  },

  // legOffset swings the front and back leg pairs in opposite directions for a
  // simple gallop cycle, matching the player's hinged-leg walk animation pattern.
  drawSkeletonRiderFrame(key, legOffset) {
    const w = 56;
    const h = 40;
    const g = this.add.graphics();
    const cx = w / 2;
    const groundY = h * 0.88;

    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, h - 3, w * 0.42, h * 0.1);

    // Horse legs (bone-white, thin double-stroke like the biped skeletons).
    // Front legs (right pair) and back legs (left pair) swing in opposite phase.
    g.lineStyle(3, 0xe0dccf, 1);
    const legDefs = [
      { x: w * 0.22, phase: -1 },
      { x: w * 0.34, phase: -1 },
      { x: w * 0.62, phase: 1 },
      { x: w * 0.74, phase: 1 }
    ];
    legDefs.forEach(({ x: lx, phase }) => {
      const footShift = legOffset * phase;
      g.beginPath();
      g.moveTo(lx, h * 0.62);
      g.lineTo(lx + footShift, groundY);
      g.strokePath();
    });

    // Ribcage / barrel of the horse body.
    g.fillStyle(0xe8e4d8, 1);
    g.fillRoundedRect(w * 0.16, h * 0.42, w * 0.62, h * 0.24, 6);
    g.lineStyle(1, 0xb0aa98, 0.8);
    for (let i = 0; i < 4; i++) {
      const lx = w * 0.22 + i * 8;
      g.beginPath();
      g.moveTo(lx, h * 0.44);
      g.lineTo(lx, h * 0.64);
      g.strokePath();
    }

    // Neck rising to the skull.
    g.fillStyle(0xe8e4d8, 1);
    g.fillRoundedRect(w * 0.68, h * 0.2, w * 0.12, h * 0.3, 4);

    // Horse skull (elongated), with dark eye sockets and a jaw line.
    g.fillStyle(0xf0ece0, 1);
    g.fillRoundedRect(w * 0.74, h * 0.06, w * 0.22, h * 0.22, 4);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(w * 0.82, h * 0.14, 2);
    g.lineStyle(1, 0x8a8478, 0.8);
    g.beginPath();
    g.moveTo(w * 0.74, h * 0.22);
    g.lineTo(w * 0.94, h * 0.22);
    g.strokePath();

    // Tail, back-left.
    g.lineStyle(2, 0xd8d2c4, 0.9);
    g.beginPath();
    g.moveTo(w * 0.16, h * 0.48);
    g.lineTo(w * 0.04, h * 0.66);
    g.strokePath();

    // Skeleton rider torso + skull, seated on the horse's back.
    g.fillStyle(0xe8e4d8, 1);
    g.fillRoundedRect(cx - 6, h * 0.12, 12, 16, 3);
    g.fillStyle(0xf0ece0, 1);
    g.fillCircle(cx, h * 0.06, 7);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(cx - 2.4, h * 0.05, 1.5);
    g.fillCircle(cx + 2.4, h * 0.05, 1.5);

    g.generateTexture(key, w, h);
    g.destroy();
  },

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
  },
};
