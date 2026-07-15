import Phaser from 'phaser';
import { playArrowShootSound } from '../../SoundManager.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from './constants.js';

export const skeletonsMethods = {
  spawnSkeletons() {
    if (this.peaceful) {
      this.skeletons = [];
      this.skeletonBases = [];
      return;
    }
    this.nextSkeletonNetworkId = 1;
    const baseCount = 3;
    const spawnSafeRadius = 100;
    const playerSpawnX = WORLD_WIDTH / 2;
    const playerSpawnY = WORLD_HEIGHT / 2;
    const minBaseSpacing = 500;

    this.skeletonBases = [];
    const baseCenters = [];

    for (let b = 0; b < baseCount; b++) {
      let bx, by, attempts = 0;
      do {
        bx = this.rngBetween(160, WORLD_WIDTH - 160);
        by = this.rngBetween(160, WORLD_HEIGHT - 160);
        attempts++;
      } while (
        attempts < 30 && (
          Phaser.Math.Distance.Between(bx, by, playerSpawnX, playerSpawnY) < spawnSafeRadius + 200 ||
          baseCenters.some(c => Phaser.Math.Distance.Between(bx, by, c.x, c.y) < minBaseSpacing)
        )
      );

      baseCenters.push({ x: bx, y: by });
      const base = this.buildSkeletonBase(bx, by);
      this.skeletonBases.push(base);

      this.spawnSkeletonAt(bx, by, base, 'melee', 5, 80);
      this.spawnSkeletonAt(bx, by, base, 'archer', 3, 80);
      this.spawnSkeletonAt(bx, by, base, 'knight', 4, 80);
    }

    this.spawnSkeletonRiders(5, playerSpawnX, playerSpawnY, spawnSafeRadius + 200);
  },

  // Skeleton horse riders roam freely across the whole map rather than being tied
  // to a base, so they're scattered independently of the base-spawning loop above.
  spawnSkeletonRiders(count, playerSpawnX, playerSpawnY, safeRadius) {
    if (this.peaceful) return;
    for (let i = 0; i < count; i++) {
      let x, y, attempts = 0;
      do {
        x = this.rngBetween(60, WORLD_WIDTH - 60);
        y = this.rngBetween(60, WORLD_HEIGHT - 60);
        attempts++;
      } while (attempts < 30 && Phaser.Math.Distance.Between(x, y, playerSpawnX, playerSpawnY) < safeRadius);

      this.spawnSkeletonAt(x, y, null, 'rider', 1, 0);
    }
  },

  buildSkeletonBase(cx, cy) {
    const radius = 130;
    const wallSize = 20;
    const gateWidth = 40;
    const circumference = 2 * Math.PI * radius;
    const segmentCount = Math.floor(circumference / wallSize);
    const gateAngle = 0;
    const gateHalfSpan = (gateWidth / radius) / 2;

    const walls = [];
    for (let i = 0; i < segmentCount; i++) {
      const angle = (i / segmentCount) * Math.PI * 2;
      let diff = Phaser.Math.Angle.Wrap(angle - gateAngle);
      if (Math.abs(diff) < gateHalfSpan) continue;

      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const sprite = this.add.image(x, y, 'wall-segment').setDepth(y).setRotation(angle + Math.PI / 2);
      const collider = this.add.zone(x, y, wallSize, wallSize);
      this.physics.add.existing(collider, true);
      this.physics.add.collider(this.player, collider);
      this.physics.add.collider(this.skeletonGroup, collider);
      walls.push({ sprite, collider });
    }

    const gateX = cx + Math.cos(gateAngle) * radius;
    const gateY = cy + Math.sin(gateAngle) * radius;
    const gateSprite = this.add.image(gateX, gateY, 'base-gate').setDepth(gateY).setRotation(gateAngle + Math.PI / 2);

    return { x: cx, y: cy, radius, walls, gateSprite };
  },

  spawnSkeletonAt(baseX, baseY, base, type, count, spreadRadius) {
    if (this.peaceful) return;
    const textureKey = type === 'archer' ? 'skeleton-archer' : type === 'knight' ? 'skeleton-knight' : type === 'rider' ? 'skeleton-rider' : 'skeleton';
    const maxHp = type === 'knight' ? 10 : type === 'rider' ? 6 : 5;
    const touchDamage = type === 'knight' ? 2 : type === 'rider' ? 2 : 1;
    const speedMultiplier = type === 'rider' ? 3 : 1;

    for (let i = 0; i < count; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.FloatBetween(0, spreadRadius);
      const x = Phaser.Math.Clamp(baseX + Math.cos(angle) * dist, 40, WORLD_WIDTH - 40);
      const y = Phaser.Math.Clamp(baseY + Math.sin(angle) * dist, 40, WORLD_HEIGHT - 40);

      const sprite = this.physics.add.sprite(x, y, textureKey);
      if (type === 'rider') {
        sprite.setOrigin(0.5, 0.85);
        sprite.body.setSize(40, 18);
        sprite.body.setOffset(8, 16);
      } else {
        sprite.setOrigin(0.5, 0.85);
        sprite.body.setSize(18, 14);
        sprite.body.setOffset(9, 20);
      }
      this.skeletonGroup.add(sprite);

      const skeleton = {
        networkId: `skeleton-${this.nextSkeletonNetworkId++}`,
        sprite,
        hp: maxHp,
        maxHp,
        hits: 0,
        dead: false,
        type,
        touchDamage,
        speedMultiplier,
        homeBase: base,
        lastAttackTime: 0,
        lastShotTime: 0,
        wanderTarget: null,
        nextWanderTime: 0
      };
      sprite.enemyRef = skeleton;

      const hpBarBg = this.add.rectangle(x, y, 28, 4, 0x1a1a1a, 0.8).setOrigin(0.5, 1);
      const hpBarFill = this.add.rectangle(x - 13, y, 26, 3, 0xd9432e, 1).setOrigin(0, 1);
      skeleton.hpBarBg = hpBarBg;
      skeleton.hpBarFill = hpBarFill;

      this.skeletons.push(skeleton);

      (this.treeCollidersPending || []).forEach(zone => this.physics.add.collider(sprite, zone));
      (this.rockCollidersPending || []).forEach(zone => this.physics.add.collider(sprite, zone));
    }
  },

  updateSkeletons() {
    if (this.network && !this.isMultiplayerHost) {
      this.updateGuestSkeletons();
      return;
    }

    const nightMult = this.nightSpeedMultiplier || 1;
    const stopRange = 24;
    const speed = 70 * nightMult;

    const archerEngageRange = 260;
    const archerRetreatRange = 100;
    const archerSpeed = 60 * nightMult;
    const archerShotCooldown = 1600;

    this.skeletons.forEach(skeleton => {
      if (skeleton.dead) return;
      const sprite = skeleton.sprite;
      const skeletonSpeed = speed * (skeleton.speedMultiplier || 1);

      if (skeleton.hostileTarget) {
        if (skeleton.hostileTarget.dead) {
          skeleton.hostileTarget = null;
        } else {
          this.updateHostileSkeleton(skeleton, skeletonSpeed, stopRange);
          sprite.setDepth(sprite.y);
          skeleton.hpBarBg.setPosition(sprite.x, sprite.y - sprite.displayHeight - 6).setDepth(sprite.y + 1);
          skeleton.hpBarFill.setPosition(sprite.x - 13, sprite.y - sprite.displayHeight - 6).setDepth(sprite.y + 2);
          const hostileRatio = Phaser.Math.Clamp(skeleton.hp / skeleton.maxHp, 0, 1);
          skeleton.hpBarFill.width = 26 * hostileRatio;
          this.updateRiderWalkFrame(skeleton);
          return;
        }
      }

      const nearFire = this.findNearestCampfire(sprite.x, sprite.y, this.campfireScareRadius);
      if (nearFire) {
        const angle = Phaser.Math.Angle.Between(nearFire.x, nearFire.y, sprite.x, sprite.y);
        sprite.body.setVelocity(Math.cos(angle) * this.campfireFleeSpeed, Math.sin(angle) * this.campfireFleeSpeed);
        sprite.setDepth(sprite.y);
        skeleton.hpBarBg.setPosition(sprite.x, sprite.y - sprite.displayHeight - 6).setDepth(sprite.y + 1);
        skeleton.hpBarFill.setPosition(sprite.x - 13, sprite.y - sprite.displayHeight - 6).setDepth(sprite.y + 2);
        this.updateRiderWalkFrame(skeleton);
        return;
      }

      const d = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.player.x, this.player.y);

      if (skeleton.type === 'archer') {
        if (d < archerRetreatRange) {
          // Too close: back away from the player.
          const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, sprite.x, sprite.y);
          sprite.body.setVelocity(Math.cos(angle) * archerSpeed, Math.sin(angle) * archerSpeed);
        } else if (d < archerEngageRange) {
          // In range: hold position and fire.
          sprite.body.setVelocity(0, 0);
          if (this.time.now - skeleton.lastShotTime > archerShotCooldown) {
            skeleton.lastShotTime = this.time.now;
            this.fireArrow(skeleton);
          }
        } else {
          // Always close the distance until the player is within bow range.
          const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, this.player.x, this.player.y);
          sprite.body.setVelocity(Math.cos(angle) * archerSpeed, Math.sin(angle) * archerSpeed);
        }
      } else if (d > stopRange) {
        // Melee, knight, and rider skeletons pursue the player globally.
        const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, this.player.x, this.player.y);
        sprite.body.setVelocity(Math.cos(angle) * skeletonSpeed, Math.sin(angle) * skeletonSpeed);
      } else if (d <= stopRange) {
        sprite.body.setVelocity(0, 0);
      }

      sprite.setDepth(sprite.y);
      skeleton.hpBarBg.setPosition(sprite.x, sprite.y - sprite.displayHeight - 6).setDepth(sprite.y + 1);
      skeleton.hpBarFill.setPosition(sprite.x - 13, sprite.y - sprite.displayHeight - 6).setDepth(sprite.y + 2);
      const ratio = Phaser.Math.Clamp(skeleton.hp / skeleton.maxHp, 0, 1);
      skeleton.hpBarFill.width = 26 * ratio;
      this.updateRiderWalkFrame(skeleton);
    });

    this.updateArrows();
  },

  updateGuestSkeletons() {
    this.skeletons.forEach((skeleton) => {
      const sprite = skeleton.sprite;
      sprite.body.setVelocity(0, 0);
      if (typeof skeleton.networkTargetX === 'number') {
        sprite.x = Phaser.Math.Linear(sprite.x, skeleton.networkTargetX, 0.35);
        sprite.y = Phaser.Math.Linear(sprite.y, skeleton.networkTargetY, 0.35);
      }
      sprite.setDepth(sprite.y);
      skeleton.hpBarBg.setPosition(sprite.x, sprite.y - sprite.displayHeight - 6).setDepth(sprite.y + 1);
      skeleton.hpBarFill.setPosition(sprite.x - 13, sprite.y - sprite.displayHeight - 6).setDepth(sprite.y + 2);
      skeleton.hpBarFill.width = 26 * Phaser.Math.Clamp(skeleton.hp / skeleton.maxHp, 0, 1);
      this.updateRiderWalkFrame(skeleton);
    });
  },

  // Swaps the skeleton-rider texture between idle and two gallop frames based on
  // whether it's currently moving, mirroring the player's walk-cycle approach.
  updateRiderWalkFrame(skeleton) {
    if (skeleton.type !== 'rider') return;
    const sprite = skeleton.sprite;
    const isMoving = sprite.body.speed > 5;

    if (!isMoving) {
      if (sprite.texture.key !== 'skeleton-rider') sprite.setTexture('skeleton-rider');
      return;
    }

    if (this.time.now < (skeleton.nextWalkFrameTime || 0)) return;
    skeleton.nextWalkFrameTime = this.time.now + 110;
    skeleton.walkFrameToggle = !skeleton.walkFrameToggle;
    sprite.setTexture(skeleton.walkFrameToggle ? 'skeleton-rider-walk1' : 'skeleton-rider-walk2');
  },

  updateHostileSkeleton(skeleton, speed, stopRange) {
    const sprite = skeleton.sprite;
    const target = skeleton.hostileTarget;
    const targetSprite = target.sprite;
    const d = Phaser.Math.Distance.Between(sprite.x, sprite.y, targetSprite.x, targetSprite.y);

    if (d > stopRange) {
      const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, targetSprite.x, targetSprite.y);
      sprite.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    } else {
      sprite.body.setVelocity(0, 0);
      const now = this.time.now;
      if (!skeleton.lastAttackTime || now - skeleton.lastAttackTime > this.skeletonAttackCooldown) {
        skeleton.lastAttackTime = now;
        this.damageSkeleton(target);
      }
    }
  },

  wanderSkeleton(skeleton, speed) {
    const sprite = skeleton.sprite;
    if (!skeleton.wanderTarget || this.time.now > skeleton.nextWanderTime) {
      if (skeleton.homeBase) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist = Phaser.Math.FloatBetween(0, skeleton.homeBase.radius * 0.7);
        skeleton.wanderTarget = {
          x: skeleton.homeBase.x + Math.cos(angle) * dist,
          y: skeleton.homeBase.y + Math.sin(angle) * dist
        };
      } else if (skeleton.type === 'rider') {
        // Riders have no home base — they roam freely across the whole map.
        skeleton.wanderTarget = {
          x: Phaser.Math.Between(60, WORLD_WIDTH - 60),
          y: Phaser.Math.Between(60, WORLD_HEIGHT - 60)
        };
      } else {
        skeleton.wanderTarget = {
          x: sprite.x + Phaser.Math.Between(-100, 100),
          y: sprite.y + Phaser.Math.Between(-100, 100)
        };
      }
      skeleton.nextWanderTime = this.time.now + Phaser.Math.Between(2000, 4000);
    }
    const wd = Phaser.Math.Distance.Between(sprite.x, sprite.y, skeleton.wanderTarget.x, skeleton.wanderTarget.y);
    if (wd > 8) {
      const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, skeleton.wanderTarget.x, skeleton.wanderTarget.y);
      sprite.body.setVelocity(Math.cos(angle) * speed * 0.4, Math.sin(angle) * speed * 0.4);
    } else {
      sprite.body.setVelocity(0, 0);
    }
  },

  fireArrow(skeleton) {
    const sprite = skeleton.sprite;
    const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, this.player.x, this.player.y);
    playArrowShootSound(this);

    const arrowSprite = this.physics.add.sprite(sprite.x, sprite.y - sprite.displayHeight * 0.4, 'arrow');
    this.arrowGroup.add(arrowSprite);
    arrowSprite.setRotation(angle);
    arrowSprite.body.setAllowGravity(false);
    arrowSprite.body.setSize(10, 6);
    arrowSprite.body.setVelocity(Math.cos(angle) * this.arrowSpeed, Math.sin(angle) * this.arrowSpeed);

    const arrow = { sprite: arrowSprite, hit: false, spawnTime: this.time.now, source: skeleton };
    arrowSprite.arrowRef = arrow;
    this.arrows.push(arrow);
  },

  updateArrows() {
    const maxLifetime = 3000;
    this.arrows.forEach(arrow => {
      if (arrow.hit) return;
      arrow.sprite.setDepth(arrow.sprite.y + 100000);
      if (this.time.now - arrow.spawnTime > maxLifetime) {
        this.destroyArrow(arrow);
      }
    });
  },

  destroyArrow(arrow) {
    if (arrow.destroyed) return;
    arrow.destroyed = true;
    arrow.sprite.destroy();
    this.arrows = this.arrows.filter(a => a !== arrow);
  },

  attackNearestSkeleton() {
    const range = 50;
    let nearest = null;
    let nearestDist = Infinity;
    this.skeletons.forEach(skeleton => {
      if (skeleton.dead) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, skeleton.sprite.x, skeleton.sprite.y);
      if (d < range && d < nearestDist) {
        nearest = skeleton;
        nearestDist = d;
      }
    });
    if (!nearest) return;

    if (this.network && !this.isMultiplayerHost) {
      // Guest: send the attack as an intent for the host to validate and apply;
      // the host's next snapshot will reflect the resulting hp/removal.
      this.network.send('input', { inputKind: 'attack', targetId: nearest.networkId });
      return;
    }

    this.damageSkeleton(nearest);
  },

  damageSkeleton(skeleton, amount = 1) {
    // Until guest combat is represented as an intent handled by the host, do not
    // let a guest temporarily mutate or destroy an authoritative mob locally.
    if (this.network && !this.isMultiplayerHost) return;

    skeleton.hits += amount;
    skeleton.hp = Math.max(0, skeleton.maxHp - skeleton.hits);

    const sprite = skeleton.sprite;
    this.tweens.add({
      targets: sprite,
      x: sprite.x + Phaser.Math.Between(-6, 6),
      duration: 50,
      yoyo: true,
      repeat: 1
    });
    this.tweens.add({
      targets: sprite,
      alpha: 0.4,
      duration: 60,
      yoyo: true
    });

    if (skeleton.hits >= skeleton.maxHp) {
      this.killSkeleton(skeleton);
    }
  },

  killSkeleton(skeleton) {
    if (!skeleton || skeleton.dead) return;
    skeleton.dead = true;
    const rewards = { melee: 1, archer: 2, knight: 3, rider: 5 };
    this.addCoins(rewards[skeleton.type] || 1);
    this.spawnBoneFragments(skeleton.sprite.x, skeleton.sprite.y);
    this.removeSkeleton(skeleton);
  },

  removeSkeleton(skeleton) {
    skeleton.dead = true;
    skeleton.sprite.destroy();
    skeleton.hpBarBg.destroy();
    skeleton.hpBarFill.destroy();
    this.skeletons = this.skeletons.filter(s => s !== skeleton);
  },

  spawnBoneFragments(x, y) {
    const count = Phaser.Math.Between(3, 5);

    for (let i = 0; i < count; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const flyDist = 10;
      const targetX = x + Math.cos(angle) * flyDist;
      const targetY = y + Math.sin(angle) * flyDist;

      const bone = this.add.image(x, y, 'icon-bone')
        .setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2))
        .setDepth(y + 100000);

      this.tweens.add({
        targets: bone,
        x: targetX,
        y: targetY,
        rotation: bone.rotation + Phaser.Math.FloatBetween(-2, 2),
        duration: 220,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          bone.destroy();

          const item = this.items.create(targetX, targetY, 'icon-bone');
          item.itemKind = 'bone';
          item.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
          item.setDepth(targetY - 500);
          item.body.setSize(item.width * 0.8, item.height * 0.8);
          item.body.setAllowGravity(false);
          item.body.moves = false;
        }
      });
    }
  },
};
