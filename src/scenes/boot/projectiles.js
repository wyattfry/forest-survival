import Phaser from 'phaser';
import { playArrowShootSound, playArrowHitSound } from '../../SoundManager.js';

export const projectilesMethods = {
  setupThrowing() {
    this.thrownPebbleSpeed = 320;
    this.thrownPebbleDamage = 1;
    this.thrownPebbles = [];
    this.thrownPebbleGroup = this.physics.add.group();

    this.aimReticle = this.add.circle(0, 0, 7, 0x000000, 0)
      .setStrokeStyle(2, 0xffe066, 0.9)
      .setDepth(1900000)
      .setVisible(false);
    this.aimReticleCross1 = this.add.line(0, 0, -4, 0, 4, 0, 0xffe066, 0.9).setDepth(1900001).setVisible(false);
    this.aimReticleCross2 = this.add.line(0, 0, 0, -4, 0, 4, 0xffe066, 0.9).setDepth(1900001).setVisible(false);

    this.physics.add.overlap(this.skeletonGroup, this.thrownPebbleGroup, (skeletonSprite, pebbleSprite) => {
      this.handleThrownPebbleHit(skeletonSprite.enemyRef, pebbleSprite.thrownRef);
    });

    this.playerArrowSpeed = 380;
    this.playerArrows = [];
    this.playerArrowGroup = this.physics.add.group();

    this.physics.add.overlap(this.skeletonGroup, this.playerArrowGroup, (skeletonSprite, arrowSprite) => {
      this.handlePlayerArrowHit(skeletonSprite.enemyRef, arrowSprite.playerArrowRef);
    });

    this.setupGuns();
  },

  // Gun Mod weapons: unlimited ammo, reuse the arrow-style hitscan-ish projectile
  // pattern but with per-gun fire rate/damage/speed so each of the three guns feels
  // distinct. Bullets are their own group so they don't touch arrow inventory/sound.
  setupGuns() {
    this.gunDefs = {
      ak47: { damage: 2, fireDelay: 220, bulletSpeed: 620, color: 0xffcf4a },
      famas: { damage: 1, fireDelay: 110, bulletSpeed: 600, color: 0x8fd6ff },
      glock17: { damage: 1, fireDelay: 320, bulletSpeed: 560, color: 0xffffff }
    };

    this.bullets = [];
    this.bulletGroup = this.physics.add.group();
    this.lastGunFireTime = 0;

    this.physics.add.overlap(this.skeletonGroup, this.bulletGroup, (skeletonSprite, bulletSprite) => {
      this.handleBulletHit(skeletonSprite.enemyRef, bulletSprite.bulletRef);
    });
  },

  fireGun() {
    const def = this.gunDefs[this.equippedItem];
    if (!def) return;
    if (this.time.now - this.lastGunFireTime < def.fireDelay) return;
    this.lastGunFireTime = this.time.now;

    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

    const bulletSprite = this.add.circle(this.player.x, this.player.y - 10, 2.5, def.color, 1);
    this.physics.add.existing(bulletSprite);
    this.bulletGroup.add(bulletSprite);
    bulletSprite.body.setAllowGravity(false);
    bulletSprite.body.setCircle(2.5);
    bulletSprite.body.setVelocity(Math.cos(angle) * def.bulletSpeed, Math.sin(angle) * def.bulletSpeed);

    const bullet = { sprite: bulletSprite, hit: false, spawnTime: this.time.now, damage: def.damage };
    bulletSprite.bulletRef = bullet;
    this.bullets.push(bullet);
  },

  updateBullets() {
    if (!this.bullets) return;
    const maxLifetime = 900;
    this.bullets.forEach(bullet => {
      if (bullet.hit) return;
      bullet.sprite.setDepth(bullet.sprite.y + 100000);
      if (this.time.now - bullet.spawnTime > maxLifetime) {
        this.destroyBullet(bullet);
      }
    });
  },

  destroyBullet(bullet) {
    if (bullet.destroyed) return;
    bullet.destroyed = true;
    bullet.sprite.destroy();
    this.bullets = this.bullets.filter(b => b !== bullet);
  },

  handleBulletHit(skeleton, bullet) {
    if (!bullet || bullet.hit || !skeleton || skeleton.dead) return;

    bullet.hit = true;
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, skeleton.sprite.x, skeleton.sprite.y);
    playArrowHitSound(this, dist);
    this.damageSkeleton(skeleton, bullet.damage);
    this.destroyBullet(bullet);
  },

  firePlayerArrow() {
    if ((this.inventory.arrow_item || 0) <= 0) return;

    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

    this.inventory.arrow_item--;
    this.renderHotbar();
    if (this.inventoryPanel.visible) this.renderInventoryPage();
    playArrowShootSound(this);

    const arrowSprite = this.physics.add.sprite(this.player.x, this.player.y - 10, 'arrow');
    this.playerArrowGroup.add(arrowSprite);
    arrowSprite.setRotation(angle);
    arrowSprite.body.setAllowGravity(false);
    arrowSprite.body.setSize(10, 6);
    arrowSprite.body.setVelocity(Math.cos(angle) * this.playerArrowSpeed, Math.sin(angle) * this.playerArrowSpeed);

    const arrow = { sprite: arrowSprite, hit: false, spawnTime: this.time.now };
    arrowSprite.playerArrowRef = arrow;
    this.playerArrows.push(arrow);
  },

  updatePlayerArrows() {
    const maxLifetime = 2000;
    this.playerArrows.forEach(arrow => {
      if (arrow.hit) return;
      arrow.sprite.setDepth(arrow.sprite.y + 100000);
      if (this.time.now - arrow.spawnTime > maxLifetime) {
        this.destroyPlayerArrow(arrow);
      }
    });
  },

  destroyPlayerArrow(arrow) {
    if (arrow.destroyed) return;
    arrow.destroyed = true;
    arrow.sprite.destroy();
    this.playerArrows = this.playerArrows.filter(a => a !== arrow);
  },

  handlePlayerArrowHit(skeleton, arrow) {
    if (!arrow || arrow.hit || !skeleton || skeleton.dead) return;

    arrow.hit = true;
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, skeleton.sprite.x, skeleton.sprite.y);
    playArrowHitSound(this, dist);
    this.damageSkeleton(skeleton);
    this.destroyPlayerArrow(arrow);
  },

  updateAimReticle() {
    const hasThrowable = this.hotbar.includes('pebble');
    const hasBow = this.equippedItem === 'bow';
    const hasGun = !!this.gunDefs[this.equippedItem];
    const hasCampfire = this.hotbar.includes('campfire');
    const hasBucket = this.hotbar.includes('bucket_water') || this.hotbar.includes('bucket_lava');
    if ((!hasThrowable && !hasBow && !hasGun && !hasCampfire && !hasBucket) || this.playerIsDead) {
      this.aimReticle.setVisible(false);
      this.aimReticleCross1.setVisible(false);
      this.aimReticleCross2.setVisible(false);
      return;
    }

    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    this.aimReticle.setPosition(worldPoint.x, worldPoint.y).setVisible(true);
    this.aimReticleCross1.setTo(worldPoint.x - 4, worldPoint.y, worldPoint.x + 4, worldPoint.y).setVisible(true);
    this.aimReticleCross2.setTo(worldPoint.x, worldPoint.y - 4, worldPoint.x, worldPoint.y + 4).setVisible(true);
  },

  throwPebble() {
    if ((this.inventory.pebble || 0) <= 0) return;

    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

    this.inventory.pebble--;
    this.renderHotbar();
    if (this.inventoryPanel.visible) this.renderInventoryPage();

    const pebbleSprite = this.physics.add.sprite(this.player.x, this.player.y - 12, 'pebble-md');
    this.thrownPebbleGroup.add(pebbleSprite);
    pebbleSprite.body.setAllowGravity(false);
    pebbleSprite.body.setSize(8, 8);
    pebbleSprite.body.setVelocity(Math.cos(angle) * this.thrownPebbleSpeed, Math.sin(angle) * this.thrownPebbleSpeed);

    const pebble = { sprite: pebbleSprite, hit: false, spawnTime: this.time.now };
    pebbleSprite.thrownRef = pebble;
    this.thrownPebbles.push(pebble);
  },

  updateThrownPebbles() {
    const maxLifetime = 2000;
    this.thrownPebbles.forEach(pebble => {
      if (pebble.hit) return;
      pebble.sprite.setDepth(pebble.sprite.y + 100000);
      pebble.sprite.rotation += 0.3;
      if (this.time.now - pebble.spawnTime > maxLifetime) {
        this.destroyThrownPebble(pebble);
      }
    });
  },

  destroyThrownPebble(pebble) {
    if (pebble.destroyed) return;
    pebble.destroyed = true;
    pebble.sprite.destroy();
    this.thrownPebbles = this.thrownPebbles.filter(p => p !== pebble);
  },

  handleThrownPebbleHit(skeleton, pebble) {
    if (!pebble || pebble.hit || !skeleton || skeleton.dead) return;

    pebble.hit = true;
    this.damageSkeleton(skeleton);
    this.destroyThrownPebble(pebble);
  },
};
