import Phaser from 'phaser';

export const rngMethods = {
  // A seeded RNG used only for one-time WORLD LAYOUT (tree/rock/pool/base positions),
  // so a multiplayer host and its guests independently generate the identical static
  // world without transmitting any positions over the wire. Seeded from the room code
  // when in multiplayer (host and guest always know the same code); otherwise random,
  // since single-player has no one else to stay in sync with.
  //
  // Only the four layout methods (scatterItems, scatterRocks, scatterPools,
  // scatterTrees, and the base-position loop in spawnSkeletons) should read from
  // this.worldRng. Everything else (damage-shake jitter, decoration, mob wander/combat
  // AI, item-drop scatter) intentionally keeps using the unseeded Phaser.Math global,
  // since none of that needs to match between clients.
  setupWorldRng() {
    const seed = this.network && this.roomCode ? this.roomCode : `${Date.now()}-${Math.random()}`;
    this.worldRng = new Phaser.Math.RandomDataGenerator([seed]);
    // Separate integer seed for the terrain noise hash below, derived from the same
    // seeded RNG so it stays in sync across multiplayer host/guests.
    this.terrainNoiseSeed = this.worldRng.integerInRange(1, 999999);
  },

  rngBetween(min, max) {
    return this.worldRng.between(min, max);
  },

  rngFloatBetween(min, max) {
    return this.worldRng.realInRange(min, max);
  },

  rngPick(array) {
    return this.worldRng.pick(array);
  },

  // Deterministic hash -> [0, 1), used as the lattice value source for smoothNoise2D.
  // Pure function of (ix, iy, terrainNoiseSeed) so every client computes identical
  // terrain without transmitting tile data.
  hashNoise2D(ix, iy) {
    let h = (ix * 374761393 + iy * 668265263 + this.terrainNoiseSeed * 2654435761) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = h ^ (h >>> 16);
    return ((h >>> 0) % 100000) / 100000;
  },

  // Smoothly-interpolated value noise at world position (x, y). `scale` is the
  // approximate feature size in pixels — larger scale means broader, gentler patches.
  smoothNoise2D(x, y, scale) {
    const sx = x / scale;
    const sy = y / scale;
    const x0 = Math.floor(sx);
    const y0 = Math.floor(sy);
    const tx = sx - x0;
    const ty = sy - y0;
    const fx = tx * tx * (3 - 2 * tx);
    const fy = ty * ty * (3 - 2 * ty);

    const n00 = this.hashNoise2D(x0, y0);
    const n10 = this.hashNoise2D(x0 + 1, y0);
    const n01 = this.hashNoise2D(x0, y0 + 1);
    const n11 = this.hashNoise2D(x0 + 1, y0 + 1);

    const nx0 = Phaser.Math.Linear(n00, n10, fx);
    const nx1 = Phaser.Math.Linear(n01, n11, fx);
    return Phaser.Math.Linear(nx0, nx1, fy);
  },
};
