import Phaser from 'phaser';

export const daynightMethods = {
  setupDayNightCycle() {
    this.dayLengthMs = 90000;
    this.nightLengthMs = 90000;
    this.cycleLengthMs = this.dayLengthMs + this.nightLengthMs;
    this.cycleStartTime = this.time.now;
    this.isNight = false;

    this.nightOverlay = this.add.rectangle(0, 0, 4000, 4000, 0x0a1030, 0)
      .setScrollFactor(0)
      .setDepth(1800000);

    this.dayNightLabel = this.add.text(0, 0, '', {
      fontFamily: 'Arial', fontSize: '12px', color: '#cccccc'
    }).setScrollFactor(0).setDepth(1800001);

    this.positionDayNightUI();
    this.scale.on('resize', () => this.positionDayNightUI());
  },

  positionDayNightUI() {
    const { width, height } = this.scale;
    this.nightOverlay.setPosition(width / 2, height / 2);
    this.dayNightLabel.setPosition(width / 2 - 30, this.hpBarMargin + this.hpBarHeight + 6);
  },

  updateDayNightCycle() {
    // Guests never drive their own cycleStartTime — the host is authoritative for
    // day/night (including the campfire time-skip) and broadcasts cycleStartTime in
    // its world-snapshot; applyWorldSnapshot() applies it directly to this.cycleStartTime.
    // Guests just render from whatever value that leaves them with each frame.
    const isGuest = this.network && !this.isMultiplayerHost;

    if (!isGuest && this.seatedOn && this.isNight === this.skipStartedNight) {
      const skipSpeed = 40;
      this.cycleStartTime -= this.game.loop.delta * (skipSpeed - 1);
    }

    const elapsed = (this.time.now - this.cycleStartTime) % this.cycleLengthMs;
    const inDay = elapsed < this.dayLengthMs;

    let darkness;
    if (inDay) {
      // Ramp darkness up over the last third of the day, fully dark at night start.
      const dayProgress = elapsed / this.dayLengthMs;
      darkness = dayProgress > 0.7 ? Phaser.Math.Clamp((dayProgress - 0.7) / 0.3, 0, 1) * 0.75 : 0;
    } else {
      const nightElapsed = elapsed - this.dayLengthMs;
      const nightProgress = nightElapsed / this.nightLengthMs;
      // Fade back out over the last third of the night.
      darkness = nightProgress > 0.7 ? 0.75 * (1 - Phaser.Math.Clamp((nightProgress - 0.7) / 0.3, 0, 1)) : 0.75;
    }

    this.nightOverlay.setFillStyle(0x0a1030, darkness);

    const wasNight = this.isNight;
    this.isNight = darkness > 0.4;
    if (this.isNight !== wasNight) {
      this.onDayNightChanged();
    }

    const isSkipping = this.seatedOn && this.isNight === this.skipStartedNight;
    this.dayNightLabel.setText((this.isNight ? 'Night' : 'Day') + (isSkipping ? ' (skipping...)' : ''));
  },

  onDayNightChanged() {
    const speedMultiplier = this.isNight ? 1.4 : 1;
    this.skeletonAttackCooldown = this.isNight ? 550 : 800;
    this.nightSpeedMultiplier = speedMultiplier;
  },

  findNearestCampfire(x, y, range) {
    if (!this.placedCampfires || this.placedCampfires.length === 0) return null;
    let nearest = null;
    let nearestDist = Infinity;
    this.placedCampfires.forEach(fire => {
      const d = Phaser.Math.Distance.Between(x, y, fire.x, fire.y);
      if (d < range && d < nearestDist) {
        nearest = fire;
        nearestDist = d;
      }
    });
    return nearest;
  },
};
