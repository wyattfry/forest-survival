import Phaser from 'phaser';
import { playChopSound } from '../../SoundManager.js';

export const toolsMethods = {
  setupToolUse() {
    this.useRange = 60;
    this.placementKind = null;
    this.placementGhost = null;
    this.keyEsc = this.input.keyboard.addKey('ESC');
    this.input.on('pointerdown', (pointer) => {
      if (pointer.button !== 0) return;
      if (this.inventoryPanel.visible) return;
      if (this.playerIsDead) return;
      if (this.placementKind) {
        this.tryCommitPlacement(pointer);
        return;
      }
      this.useEquippedTool();
    });

    this.toolPromptText = this.add.text(0, 0, '', {
      fontFamily: 'Arial', fontSize: '13px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 6, y: 3 }
    }).setDepth(1000001).setVisible(false);
  },

  updateToolPrompt() {
    if (this.placementKind) {
      this.toolPromptText.setVisible(false);
      return;
    }

    let target = null;
    let label = '';
    let targetSprite = null;

    if (this.equippedItem === 'axe') {
      target = this.findNearestInRange(this.choppableTrees, this.useRange);
      if (target) {
        label = `Click to chop (${target.hits}/5)`;
        targetSprite = target.sprite;
      }
    } else if (this.equippedItem === 'pickaxe') {
      target = this.findNearestInRange(this.breakableRocks, this.useRange);
      if (target) {
        label = `Click to mine (${target.hits}/5)`;
        targetSprite = target.sprite;
      }
    } else if (this.equippedItem === 'sword') {
      const nearestSkeleton = this.skeletons
        .filter(s => !s.dead)
        .reduce((closest, s) => {
          const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, s.sprite.x, s.sprite.y);
          if (d < 50 && (!closest || d < closest.dist)) return { skeleton: s, dist: d };
          return closest;
        }, null);
      if (nearestSkeleton) {
        target = nearestSkeleton.skeleton;
        label = `Click to attack (${target.hits}/5)`;
        targetSprite = target.sprite;
      }
    }

    if (target && targetSprite) {
      this.toolPromptText.setText(label);
      this.toolPromptText.setPosition(targetSprite.x - this.toolPromptText.width / 2, targetSprite.y - targetSprite.displayHeight - 14);
      this.toolPromptText.setVisible(true);
    } else {
      this.toolPromptText.setVisible(false);
    }
  },

  findNearestInRange(list, range) {
    let nearest = null;
    let nearestDist = Infinity;
    list.forEach(entry => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, entry.x, entry.y);
      if (d < range && d < nearestDist) {
        nearest = entry;
        nearestDist = d;
      }
    });
    return nearest;
  },

  useEquippedTool() {
    if (this.hitInProgress) return;
    if (!this.equippedItem) return;

    const isGun = !!this.gunDefs[this.equippedItem];

    if (this.equippedItem !== 'bow' && !isGun) {
      this.swingEquippedTool();
    }

    const isGuest = this.network && !this.isMultiplayerHost;

    if (this.equippedItem === 'axe') {
      const tree = this.findNearestInRange(this.choppableTrees, this.useRange);
      if (tree) {
        if (isGuest) this.network.send('input', { inputKind: 'chop', targetId: tree.networkId });
        else this.hitTarget(tree, 'tree');
      }
    } else if (this.equippedItem === 'pickaxe') {
      const rock = this.findNearestInRange(this.breakableRocks, this.useRange);
      const obsidian = this.findNearestInRange(this.obsidianDeposits || [], this.useRange);
      if (rock && (!obsidian || Phaser.Math.Distance.Between(this.player.x, this.player.y, rock.x, rock.y) <= Phaser.Math.Distance.Between(this.player.x, this.player.y, obsidian.x, obsidian.y))) {
        if (isGuest) this.network.send('input', { inputKind: 'mine', targetId: rock.networkId });
        else this.hitTarget(rock, 'rock');
      } else if (obsidian && !isGuest) {
        this.hitObsidian(obsidian);
      }
    } else if (this.equippedItem === 'sword') {
      this.attackNearestSkeleton();
    } else if (this.equippedItem === 'bow') {
      this.firePlayerArrow();
    } else if (isGun) {
      this.fireGun();
    }
  },

  swingEquippedTool() {
    if (this.swingTween) this.swingTween.stop();

    const sprite = this.equippedSprite;
    const baseRotation = -0.6;
    sprite.setRotation(baseRotation - 1.1);

    this.swingTween = this.tweens.add({
      targets: sprite,
      rotation: baseRotation,
      duration: 140,
      ease: 'Back.easeOut'
    });
  },

  hitTarget(target, kind, grantInventory = true) {
    const maxHits = 5;
    target.hits++;
    this.hitInProgress = true;
    playChopSound(this);

    const sprite = target.sprite;
    const origX = target.x;

    // Damage shake: quick knock to one side and back.
    this.tweens.add({
      targets: sprite,
      x: origX + Phaser.Math.Between(-4, 4),
      duration: 60,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        sprite.x = origX;
        this.hitInProgress = false;
      }
    });

    // Brief flash on each hit for extra feedback.
    this.tweens.add({
      targets: sprite,
      alpha: 0.5,
      duration: 50,
      yoyo: true
    });

    if (kind === 'tree') {
      this.addTreeScratch(target);
    } else {
      this.addRockHole(target);
    }

    if (target.hits >= maxHits) {
      if (kind === 'tree') {
        this.destroyTree(target, grantInventory);
      } else {
        this.destroyRock(target, grantInventory);
      }
    }
  },

  hitObsidian(deposit) {
    const maxHits = 5;
    deposit.hits++;
    this.hitInProgress = true;

    const sprite = deposit.sprite;
    const origX = deposit.x;

    this.tweens.add({
      targets: sprite,
      x: origX + Phaser.Math.Between(-4, 4),
      duration: 60,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        sprite.x = origX;
        this.hitInProgress = false;
      }
    });
    this.tweens.add({
      targets: sprite,
      alpha: 0.5,
      duration: 50,
      yoyo: true
    });

    if (deposit.hits >= maxHits) {
      deposit.sprite.destroy();
      this.obsidianDeposits = this.obsidianDeposits.filter(d => d !== deposit);
      this.inventory.obsidian = (this.inventory.obsidian || 0) + 3;
      if (this.inventoryPanel.visible) this.renderInventoryPage();
    }
  },

  getDamageOverlay(target) {
    if (!target.damageOverlay) {
      const g = this.add.graphics();
      g.setDepth(target.sprite.depth + 1);
      target.damageOverlay = g;
    }
    return target.damageOverlay;
  },

  addTreeScratch(tree) {
    const g = this.getDamageOverlay(tree);
    const sprite = tree.sprite;
    const w = sprite.displayWidth;
    const h = sprite.displayHeight;
    const cx = sprite.x;
    const baseY = sprite.y;

    // A fresh diagonal axe-gash on the trunk, stacking upward with each hit.
    const gashY = baseY - h * Phaser.Math.FloatBetween(0.06, 0.24);
    const gashX = cx + Phaser.Math.FloatBetween(-0.06, 0.06) * w;
    const len = Math.max(4, w * 0.05);
    const angle = Phaser.Math.FloatBetween(-0.5, 0.5);

    g.lineStyle(2, 0x2a180a, 0.9);
    g.beginPath();
    g.moveTo(gashX - Math.cos(angle) * len, gashY - Math.sin(angle) * len);
    g.lineTo(gashX + Math.cos(angle) * len, gashY + Math.sin(angle) * len);
    g.strokePath();

    g.lineStyle(1, 0xe8d2a0, 0.65);
    g.beginPath();
    g.moveTo(gashX - Math.cos(angle) * len * 0.8, gashY - Math.sin(angle) * len * 0.8 - 1);
    g.lineTo(gashX + Math.cos(angle) * len * 0.8, gashY + Math.sin(angle) * len * 0.8 - 1);
    g.strokePath();
  },

  addRockHole(rock) {
    const g = this.getDamageOverlay(rock);
    const sprite = rock.sprite;
    const w = sprite.displayWidth;
    const h = sprite.displayHeight;
    const cx = sprite.x;
    const cy = sprite.y - h * 0.4;

    // A chipped-out crater at a random point on the rock face.
    const hx = cx + Phaser.Math.FloatBetween(-0.3, 0.3) * w;
    const hy = cy + Phaser.Math.FloatBetween(-0.25, 0.25) * h;
    const r = w * Phaser.Math.FloatBetween(0.08, 0.14);

    g.fillStyle(0x2c2c30, 0.75);
    g.fillCircle(hx, hy, r);
    g.fillStyle(0x1a1a1d, 0.6);
    g.fillCircle(hx - r * 0.2, hy - r * 0.2, r * 0.55);

    g.lineStyle(1, 0x4a4a50, 0.5);
    g.strokeCircle(hx, hy, r);
  },

  // grantInventory is false when applying another player's validated chop (host
  // relaying to other guests, or a guest applying a world-event for a hit it didn't
  // land itself) — only the player who actually landed the hit gets the wood.
  destroyTree(tree, grantInventory = true) {
    tree.sprite.destroy();
    if (tree.damageOverlay) tree.damageOverlay.destroy();
    if (tree.collider) tree.collider.destroy();
    this.choppableTrees.splice(this.choppableTrees.indexOf(tree), 1);

    if (grantInventory) {
      this.inventory.wood = (this.inventory.wood || 0) + 5;
      if (this.inventoryPanel.visible) this.renderInventoryPage();
    }
  },

  // See destroyTree for what grantInventory controls.
  destroyRock(rock, grantInventory = true) {
    rock.sprite.destroy();
    if (rock.shadowSprite) rock.shadowSprite.destroy();
    if (rock.damageOverlay) rock.damageOverlay.destroy();
    if (rock.collider) rock.collider.destroy();
    this.breakableRocks.splice(this.breakableRocks.indexOf(rock), 1);
    this.rockPositions = this.rockPositions.filter(r => r.x !== rock.x || r.y !== rock.y);

    if (grantInventory) {
      this.inventory.stone_chunk = (this.inventory.stone_chunk || 0) + 5;
      this.inventory.iron_ore = (this.inventory.iron_ore || 0) + 3;
      if (this.inventoryPanel.visible) this.renderInventoryPage();
    }
  },
};
