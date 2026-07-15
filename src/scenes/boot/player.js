import Phaser from 'phaser';
import { drawHairShape, ageToScale } from '../../HairStyles.js';
import { drawHatShape } from '../../Hats.js';
import { playFootstepSound } from '../../SoundManager.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from './constants.js';

export const playerMethods = {
  generatePlayerTexture() {
    this.drawPlayerFrame('player', 0);
    this.drawPlayerFrame('player-walk1', -4);
    this.drawPlayerFrame('player-walk2', 4);
  },

  drawPlayerFrame(key, legOffset) {
    const size = 40;
    const g = this.add.graphics();
    const cx = size / 2;
    const shirtColor = this.characterColor || 0x3f5fd6;
    const hairStyle = this.characterHair || 'short';
    const gender = this.characterGender || 'male';
    const skinTone = this.characterSkinTone || 0xe8b98a;
    const hairColor = this.characterHairColor || 0x3a2a1e;

    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, size - 4, size * 0.5, size * 0.16);

    // Legs, drawn under the torso so the hem/shirt overlaps the tops.
    // Each leg is a hinged quad: top stays fixed at the hip, bottom (foot) swings by
    // legOffset, so the leg pivots like a real stride instead of sliding as a rigid block.
    // Female legs are narrower and set closer together to fit the tapered hem.
    const hipY = size * 0.62;
    const footY = size - 2;
    const legW = gender === 'female' ? 4 : 5;
    const legInsetLeft = gender === 'female' ? cx - 6 : cx - 7;
    const legInsetRight = cx + 2;
    g.fillStyle(skinTone, 1);
    [-1, 1].forEach(side => {
      const hipLeft = side < 0 ? legInsetLeft : legInsetRight;
      const footShift = side < 0 ? legOffset : -legOffset;
      g.beginPath();
      g.moveTo(hipLeft, hipY);
      g.lineTo(hipLeft + legW, hipY);
      g.lineTo(hipLeft + legW + footShift, footY);
      g.lineTo(hipLeft + footShift, footY);
      g.closePath();
      g.fillPath();
    });
    g.fillStyle(0x5a3a20, 1);
    g.fillRoundedRect(legInsetLeft + legOffset, size - 6, legW, 4, 1.5);
    g.fillRoundedRect(legInsetRight - legOffset, size - 6, legW, 4, 1.5);

    g.fillStyle(shirtColor, 1);
    if (gender === 'female') {
      // Tapered waist with a slight skirt-like flare at the hem.
      const top = size * 0.42, bodyH = 16, shoulderW = 15, waistW = 11, hemW = 17;
      g.beginPath();
      g.moveTo(cx - shoulderW / 2, top);
      g.lineTo(cx + shoulderW / 2, top);
      g.lineTo(cx + waistW / 2, top + bodyH * 0.55);
      g.lineTo(cx + hemW / 2, top + bodyH);
      g.lineTo(cx - hemW / 2, top + bodyH);
      g.lineTo(cx - waistW / 2, top + bodyH * 0.55);
      g.closePath();
      g.fillPath();
    } else {
      // Boxier, broader-shouldered build.
      g.fillRoundedRect(cx - 10, size * 0.42, 20, 16, 3);
    }

    g.fillStyle(skinTone, 1);
    g.fillCircle(cx, size * 0.36, 10);

    this.drawHair(g, hairStyle, cx, size, hairColor);
    drawHatShape(g, this.characterHat, cx, size);

    g.fillStyle(0x2a2a2e, 1);
    g.fillCircle(cx - 3.5, size * 0.41, 1.6);
    g.fillCircle(cx + 3.5, size * 0.41, 1.6);

    g.generateTexture(key, size, size);
    g.destroy();
  },

  drawHair(g, style, cx, size, hairColor) {
    drawHairShape(g, style, cx, size, hairColor);
  },

  recalculateArmorHpBonus() {
    const newBonus = Object.values(this.equippedArmor)
      .filter(Boolean)
      .reduce((sum, kind) => sum + (this.itemDefs[kind].hpBonus || 0), 0);

    const delta = newBonus - this.armorHpBonus;
    this.armorHpBonus = newBonus;
    this.playerMaxHp += delta;
    this.playerHp = Math.min(this.playerHp + Math.max(delta, 0), this.playerMaxHp);
    this.updateHpBar();
  },

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
  },

  updateArmorSprites() {
    if (!this.armorSprites) return;

    Object.entries(this.armorSprites).forEach(([slot, sprite]) => {
      const equippedKind = this.equippedArmor[slot];
      sprite.setVisible(!!equippedKind);
      if (!equippedKind) return;

      sprite.setPosition(this.player.x, this.player.y);
      sprite.setDepth(this.player.y + (slot === 'helmet' ? 0.5 : 0.2));
    });
  },

  createPlayer() {
    const player = this.physics.add.sprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'player');
    player.setOrigin(0.5, 0.75);
    player.setCollideWorldBounds(true);
    player.body.setSize(20, 16);
    player.body.setOffset(10, 22);
    // Giant characters are exactly 100 world px tall; dwarfs retain the normal
    // age-based proportions at one-third scale.
    const normalScale = ageToScale(this.characterAge);
    player.setScale(this.characterGiant ? 2.5 : this.characterDwarf ? normalScale / 3 : normalScale);
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
  },

  generateArmorPieceTextures() {
    const ironPalette = {
      base: 0x8a8e96, dark: 0x6e727a, light: 0xb5bac2, rivet: 0x3a3e46,
      stroke: 0x4a4e56, strokeDark: 0x33363c, plume: 0xffe066, plumeAlpha: 0.9
    };

    this.drawArmorSet('iron', ironPalette);
  },

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
  },

  updateFootsteps() {
    if (this.time.now < (this.nextFootstepTime || 0)) return;
    this.nextFootstepTime = this.time.now + 320;
    playFootstepSound(this, 'grass');
  },

  updateWalkAnimation() {
    if (this.time.now < (this.nextWalkFrameTime || 0)) return;
    this.nextWalkFrameTime = this.time.now + 140;
    this.walkFrameToggle = !this.walkFrameToggle;
    this.setPlayerFrame(this.walkFrameToggle ? 'player-walk1' : 'player-walk2');
  },

  setPlayerFrame(key) {
    if (this.player.texture.key !== key) {
      this.player.setTexture(key);
    }
  },

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
          this.updateFootsteps();
          this.updateWalkAnimation();
        } else {
          this.player.body.setVelocity(0, 0);
          this.setPlayerFrame('player');
        }
      }

      this.sendLocalMovementInput();
      this.updateHostGuestStates();
      this.reconcileLocalPlayer();
      this.player.setDepth(this.player.y);
      this.updateShopInteraction();
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
      this.updateBullets();
      this.updateRemotePlayers();
      this.broadcastWorldSnapshot();
      this.updateClone();

      if (Phaser.Input.Keyboard.JustDown(this.keyQ)) {
        this.toggleInventoryPanel();
      }

      if (this.cloneMod && Phaser.Input.Keyboard.JustDown(this.keyC)) {
        this.toggleClone();
      }

      const numberKeys = [this.hotbarKeys.ONE, this.hotbarKeys.TWO, this.hotbarKeys.THREE, this.hotbarKeys.FOUR, this.hotbarKeys.FIVE];
      numberKeys.forEach((key, i) => {
        if (Phaser.Input.Keyboard.JustDown(key)) {
          this.activateHotbarSlot(i);
        }
      });
    });
  },
};
