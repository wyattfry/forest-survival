import Phaser from 'phaser';
import { WORLD_WIDTH, WORLD_HEIGHT, TERRAIN_NOISE_SCALE, ROCKINESS_NOISE_SCALE, ROCKINESS_NOISE_OFFSET, GROUND_COLOR_STOPS } from './constants.js';

export const terrainMethods = {
  scatterItems() {
    this.items = this.physics.add.group();
    const twigCount = 90;
    const pebbleCount = 110;

    const tryPlace = (keys, kind) => {
      let x, y, attempts = 0;
      do {
        x = this.rngBetween(20, WORLD_WIDTH - 20);
        y = this.rngBetween(20, WORLD_HEIGHT - 20);
        attempts++;
      } while (attempts < 8 && this.rockPositions.some(r => Phaser.Math.Distance.Between(x, y, r.x, r.y) < r.clearRadius * 0.5));

      const key = this.rngPick(keys);
      const item = this.items.create(x, y, key);
      item.itemKind = kind;
      item.setRotation(this.rngFloatBetween(0, Math.PI * 2));
      item.setDepth(y - 500);
      item.body.setSize(item.width * 0.8, item.height * 0.8);
      item.body.setAllowGravity(false);
      item.body.moves = false;
    };

    for (let i = 0; i < twigCount; i++) tryPlace(this.twigKeys, 'twig');
    for (let i = 0; i < pebbleCount; i++) tryPlace(this.pebbleKeys, 'pebble');
  },

  drawPoolBlob(g, size, colors) {
    const cx = size / 2, cy = size / 2;
    const points = [];
    const spikes = Phaser.Math.Between(9, 12);
    for (let i = 0; i < spikes; i++) {
      const angle = (i / spikes) * Math.PI * 2;
      const radius = size * 0.42 * Phaser.Math.FloatBetween(0.82, 1);
      points.push(new Phaser.Math.Vector2(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius));
    }

    g.fillStyle(colors.shadow, 0.3);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y + 4);
    for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y + 4);
    g.closePath();
    g.fillPath();

    g.fillStyle(colors.edge, 1);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
    g.closePath();
    g.fillPath();

    g.fillStyle(colors.main, 1);
    g.beginPath();
    g.moveTo(cx + (points[0].x - cx) * 0.82, cy + (points[0].y - cy) * 0.82);
    for (let i = 1; i < points.length; i++) {
      g.lineTo(cx + (points[i].x - cx) * 0.82, cy + (points[i].y - cy) * 0.82);
    }
    g.closePath();
    g.fillPath();

    g.fillStyle(colors.highlight, colors.highlightAlpha);
    g.fillCircle(cx - size * 0.1, cy - size * 0.08, size * 0.14);
  },

  generateLavaTexture() {
    const size = 120;
    const g = this.add.graphics();
    this.drawPoolBlob(g, size, {
      shadow: 0x000000, edge: 0x6b1f0f, main: 0xd9481f, highlight: 0xffb347, highlightAlpha: 0.55
    });
    g.generateTexture('lava-pool', size, size);
    g.destroy();
  },

  generateWaterTexture() {
    const size = 120;
    const g = this.add.graphics();
    this.drawPoolBlob(g, size, {
      shadow: 0x000000, edge: 0x1e5a7a, main: 0x2f88b5, highlight: 0x8fd6f0, highlightAlpha: 0.5
    });
    g.generateTexture('water-pool', size, size);
    g.destroy();
  },

  generateObsidianTexture() {
    const size = 120;
    const g = this.add.graphics();
    this.drawPoolBlob(g, size, {
      shadow: 0x000000, edge: 0x120a1c, main: 0x241533, highlight: 0x6a4a9e, highlightAlpha: 0.4
    });
    g.generateTexture('obsidian-patch', size, size);
    g.destroy();
  },

  // "rgb(r,g,b)" string for a 0xRRGGBB int, for canvas 2D fill/stroke styles.
  rgbStr(int) {
    return `rgb(${(int >> 16) & 255},${(int >> 8) & 255},${int & 255})`;
  },

  biomeColorAt(n) {
    const s = GROUND_COLOR_STOPS;
    if (n <= s[0].t) return s[0].rgb;
    for (let i = 0; i < s.length - 1; i++) {
      if (n < s[i + 1].t) {
        const f = (n - s[i].t) / (s[i + 1].t - s[i].t);
        return [
          Math.round(s[i].rgb[0] + (s[i + 1].rgb[0] - s[i].rgb[0]) * f),
          Math.round(s[i].rgb[1] + (s[i + 1].rgb[1] - s[i].rgb[1]) * f),
          Math.round(s[i].rgb[2] + (s[i + 1].rgb[2] - s[i].rgb[2]) * f)
        ];
      }
    }
    return s[s.length - 1].rgb;
  },

  // One short two-segment "blade" stroke on a raw canvas 2D context.
  drawBladeCanvas(ctx, x, y, height, lean, colorInt, alpha) {
    ctx.strokeStyle = this.rgbStr(colorInt);
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + lean * height * 0.5, y - height * 0.5);
    ctx.lineTo(x + lean * height, y - height);
    ctx.stroke();
    ctx.globalAlpha = 1;
  },

  // A small pebble: dark base circle with a lighter offset cap for a little relief.
  drawPebbleCanvas(ctx, x, y) {
    const r = Phaser.Math.Between(1, 3);
    ctx.fillStyle = this.rgbStr(0x3d2f1e);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.rgbStr(0x6b543a);
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  },

  // A short jagged dry crack.
  drawCrackCanvas(ctx, x, y) {
    ctx.strokeStyle = this.rgbStr(0x2c2013);
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const mx = x + Phaser.Math.Between(-10, 10);
    const my = y + Phaser.Math.Between(-10, 10);
    ctx.lineTo(mx, my);
    ctx.lineTo(mx + Phaser.Math.Between(-8, 8), my + Phaser.Math.Between(-8, 8));
    ctx.stroke();
    ctx.globalAlpha = 1;
  },

  // A single 1px dew/flower fleck for lush areas.
  drawFleckCanvas(ctx, x, y) {
    ctx.fillStyle = Phaser.Math.Between(0, 1) ? 'rgba(232,224,122,0.85)' : 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  },

  // Draws one biome-appropriate detail feature at (x, y) for noise value n. The
  // biome membership weights crossfade (smoothstep) across the thresholds, and the
  // feature is chosen by a weighted random draw — so near a boundary a point is
  // randomly either biome's feature, giving a soft scattered transition rather than
  // a hard line, on top of the already-continuous base color gradient.
  drawGroundDetail(ctx, x, y, n) {
    const ss = (a, b, v) => { v = Phaser.Math.Clamp((v - a) / (b - a), 0, 1); return v * v * (3 - 2 * v); };
    const dirtW = 1 - ss(0.26, 0.38, n);
    const dryW = ss(0.26, 0.38, n) * (1 - ss(0.49, 0.61, n));
    const grassW = ss(0.49, 0.61, n) * (1 - ss(0.72, 0.84, n));
    const lushW = ss(0.72, 0.84, n);

    let r = Phaser.Math.FloatBetween(0, dirtW + dryW + grassW + lushW);

    if (r < dirtW) {
      // Dirt: mostly pebbles, some cracks, the occasional stray weed.
      const roll = Phaser.Math.FloatBetween(0, 1);
      if (roll < 0.7) this.drawPebbleCanvas(ctx, x, y);
      else if (roll < 0.85) this.drawCrackCanvas(ctx, x, y);
      else this.drawBladeCanvas(ctx, x, y, Phaser.Math.Between(2, 4), Phaser.Math.FloatBetween(-0.4, 0.4), 0x6b7a3f, 0.7);
      return;
    }
    r -= dirtW;
    if (r < dryW) {
      const colors = [0xa8a24f, 0x8f8c42, 0xc4b862];
      this.drawBladeCanvas(ctx, x, y, Phaser.Math.Between(3, 6), Phaser.Math.FloatBetween(-0.5, 0.5),
        Phaser.Utils.Array.GetRandom(colors), Phaser.Math.FloatBetween(0.5, 0.85));
      return;
    }
    r -= dryW;
    if (r < grassW) {
      const colors = [0x3d7a48, 0x4a8a55, 0x2a5c38];
      this.drawBladeCanvas(ctx, x, y, Phaser.Math.Between(3, 6), Phaser.Math.FloatBetween(-0.45, 0.45),
        Phaser.Utils.Array.GetRandom(colors), Phaser.Math.FloatBetween(0.6, 0.9));
      return;
    }
    // Lush: taller denser blades, with the occasional fleck.
    const colors = [0x3d8a4a, 0x256b32, 0x4fae5e];
    this.drawBladeCanvas(ctx, x, y, Phaser.Math.Between(3, 7), Phaser.Math.FloatBetween(-0.5, 0.5),
      Phaser.Utils.Array.GetRandom(colors), Phaser.Math.FloatBetween(0.65, 0.95));
    if (Phaser.Math.FloatBetween(0, 1) < 0.12) this.drawFleckCanvas(ctx, x, y);
  },

  // No longer generates any texture — the ground is painted as a single canvas in
  // buildTerrain. Kept as a named create() step (and to hold nothing that other
  // code depends on) so the create() call order is unchanged.
  generateGroundTexture() {},

  // Paints the entire floor as one world-sized canvas texture:
  //   1. A smooth biome color GRADIENT — sampled cheaply on a downscaled grid and
  //      bilinearly upscaled, so dirt→dry→grass→lush blend continuously with no
  //      tile seams (this is the "gradient between biomes" blend).
  //   2. A detail pass that scatters biome-appropriate features (grass blades,
  //      pebbles, cracks, flecks) across the whole world in world-space, so the
  //      texture never visibly repeats and detail fades naturally at boundaries.
  // Added with default depth like the old tile ground, so it still renders behind
  // everything scattered afterward. scatterTrees/scatterRocks sample the same
  // noise field (TERRAIN_NOISE_SCALE) so entity density tracks the biome.
  buildTerrain() {
    const W = WORLD_WIDTH;
    const H = WORLD_HEIGHT;

    if (this.textures.exists('terrain')) this.textures.remove('terrain');
    const canvasTex = this.textures.createCanvas('terrain', W, H);
    const ctx = canvasTex.getContext();

    // 1. Base gradient: render the biome color field to a small canvas (one cell
    //    per `cell` world px), then upscale with smoothing for a free bilinear
    //    gradient. Small per-cell brightness jitter keeps it from looking flat.
    const cell = 8;
    const sw = Math.ceil(W / cell);
    const sh = Math.ceil(H / cell);
    const small = document.createElement('canvas');
    small.width = sw;
    small.height = sh;
    const sctx = small.getContext('2d');
    const imgData = sctx.createImageData(sw, sh);
    const d = imgData.data;
    for (let j = 0; j < sh; j++) {
      for (let i = 0; i < sw; i++) {
        const n = this.smoothNoise2D(i * cell + cell / 2, j * cell + cell / 2, TERRAIN_NOISE_SCALE);
        const rgb = this.biomeColorAt(n);
        const jitter = Phaser.Math.Between(-6, 6);
        const idx = (j * sw + i) * 4;
        d[idx] = Phaser.Math.Clamp(rgb[0] + jitter, 0, 255);
        d[idx + 1] = Phaser.Math.Clamp(rgb[1] + jitter, 0, 255);
        d[idx + 2] = Phaser.Math.Clamp(rgb[2] + jitter, 0, 255);
        d[idx + 3] = 255;
      }
    }
    sctx.putImageData(imgData, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(small, 0, 0, sw, sh, 0, 0, W, H);

    // 2. Detail scatter across the whole world (world-space, so no repetition).
    const detailCount = Math.round((W * H) / 300);
    for (let k = 0; k < detailCount; k++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const n = this.smoothNoise2D(x, y, TERRAIN_NOISE_SCALE);
      this.drawGroundDetail(ctx, x, y, n);
    }

    canvasTex.refresh();
    this.add.image(0, 0, 'terrain').setOrigin(0, 0);
  },

  // Draws a simple pine/round tree (trunk + canopy) into a texture sized to fit.
  drawTree(g, size, style) {
    const trunkWidth = Math.max(2, Math.round(size * 0.09));
    const trunkHeight = Math.round(size * 0.28);
    const cx = size / 2;
    const baseY = size;

    g.fillStyle(0x5b3a21, 1);
    g.fillRect(cx - trunkWidth / 2, baseY - trunkHeight, trunkWidth, trunkHeight);
    // Bark shading: a darker shadow stripe and a lighter highlight stripe down
    // the trunk so it doesn't read as a single flat rectangle.
    g.fillStyle(0x432c19, 0.6);
    g.fillRect(cx - trunkWidth / 2, baseY - trunkHeight, Math.max(1, trunkWidth * 0.35), trunkHeight);
    g.fillStyle(0x74502f, 0.5);
    g.fillRect(cx + trunkWidth * 0.1, baseY - trunkHeight, Math.max(1, trunkWidth * 0.25), trunkHeight * 0.85);

    const canopyTop = baseY - trunkHeight * 0.7;

    if (style === 'pine') {
      const tiers = 3;
      const tierHeight = canopyTop / tiers * 1.05;
      for (let t = 0; t < tiers; t++) {
        const tierBottom = canopyTop - t * tierHeight * 0.62;
        const tierWidth = size * (0.9 - t * 0.22);
        const shade = t === tiers - 1 ? 0x1f4d2b : (t === 1 ? 0x27592f : 0x2e6636);
        g.fillStyle(shade, 1);
        // Jittered silhouette instead of a perfect triangle, so the tiers read
        // as bristly foliage rather than flat geometric cones.
        const tipX = cx + Phaser.Math.Between(-1, 1);
        const tipY = tierBottom - tierHeight;
        g.beginPath();
        g.moveTo(tipX, tipY);
        g.lineTo(cx - tierWidth * 0.28, tierBottom - tierHeight * 0.4 + Phaser.Math.Between(-2, 2));
        g.lineTo(cx - tierWidth * 0.5, tierBottom + Phaser.Math.Between(-1, 1));
        g.lineTo(cx + tierWidth * 0.5, tierBottom + Phaser.Math.Between(-1, 1));
        g.lineTo(cx + tierWidth * 0.28, tierBottom - tierHeight * 0.4 + Phaser.Math.Between(-2, 2));
        g.closePath();
        g.fillPath();

        // Thin highlight along one flank for a bit of light direction/depth.
        g.fillStyle(0xffffff, 0.08);
        g.beginPath();
        g.moveTo(tipX, tipY);
        g.lineTo(cx + tierWidth * 0.28, tierBottom - tierHeight * 0.4);
        g.lineTo(cx + tierWidth * 0.12, tierBottom - tierHeight * 0.1);
        g.closePath();
        g.fillPath();
      }
    } else {
      const r = size * 0.36;
      // Soft undershadow first so the overlapping foliage blobs above it read
      // as one rounded mass instead of separate flat circles.
      g.fillStyle(0x163d20, 0.5);
      g.fillCircle(cx, canopyTop - r * 0.2, r * 0.85);
      g.fillStyle(0x1f4d2b, 1);
      g.fillCircle(cx, canopyTop - r * 0.55, r);
      g.fillStyle(0x2e6636, 1);
      g.fillCircle(cx - r * 0.4, canopyTop - r * 0.9, r * 0.75);
      g.fillCircle(cx + r * 0.45, canopyTop - r * 0.75, r * 0.65);
      g.fillStyle(0x3a7a42, 1);
      g.fillCircle(cx - r * 0.15, canopyTop - r * 1.15, r * 0.5);
      g.fillStyle(0xffffff, 0.12);
      g.fillCircle(cx - r * 0.25, canopyTop - r * 1.2, r * 0.22);
    }
  },

  generateTreeTextures() {
    const sizes = [
      { key: 'tree-pine-sm', size: 48, style: 'pine' },
      { key: 'tree-pine-md', size: 80, style: 'pine' },
      { key: 'tree-pine-lg', size: 128, style: 'pine' },
      { key: 'tree-round-sm', size: 48, style: 'round' },
      { key: 'tree-round-md', size: 80, style: 'round' },
      { key: 'tree-round-lg', size: 128, style: 'round' }
    ];

    this.treeKeys = sizes.map(s => s.key);

    sizes.forEach(({ key, size, style }) => {
      const g = this.add.graphics();
      this.drawTree(g, size, style);
      g.generateTexture(key, size, size);
      g.destroy();
    });
  },

  // Drawn into its own unrotated texture so the shadow always falls the same way
  // regardless of the rock body's random rotation (see scatterRocks).
  drawRockShadow(g, size) {
    const cx = size / 2;
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(cx, size * 0.94, size * 0.95, size * 0.2);
  },

  drawRock(g, size) {
    const cx = size / 2;
    const cy = size / 2;
    const points = [];
    const spikes = Phaser.Math.Between(6, 8);
    for (let i = 0; i < spikes; i++) {
      const angle = (i / spikes) * Math.PI * 2;
      const radius = size * 0.5 * Phaser.Math.FloatBetween(0.7, 1);
      points.push(new Phaser.Math.Vector2(
        cx + Math.cos(angle) * radius,
        cy + Math.sin(angle) * radius * 0.85 + size * 0.08
      ));
    }

    g.fillStyle(0x8f8f96, 1);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
    g.closePath();
    g.fillPath();

    g.fillStyle(0xb5b5bc, 1);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      if (points[i].y < cy + size * 0.1) g.lineTo(points[i].x, points[i].y);
      else g.lineTo(cx, cy);
    }
    g.closePath();
    g.fillPath();

    g.lineStyle(Math.max(1, size * 0.03), 0x4a4a50, 0.8);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
    g.closePath();
    g.strokePath();

    // Weathering detail: an occasional crack and a couple of lichen flecks so
    // rocks of the same size don't all look identically smooth.
    if (Phaser.Math.Between(0, 1) === 1) {
      const crackAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const midX = cx + Math.cos(crackAngle) * size * 0.16;
      const midY = cy + Math.sin(crackAngle) * size * 0.14;
      const endX = cx + Math.cos(crackAngle + Phaser.Math.FloatBetween(-0.6, 0.6)) * size * 0.4;
      const endY = cy + Math.sin(crackAngle + Phaser.Math.FloatBetween(-0.6, 0.6)) * size * 0.35;
      g.lineStyle(Math.max(1, size * 0.02), 0x3a3a40, 0.5);
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(midX, midY);
      g.lineTo(endX, endY);
      g.strokePath();
    }

    const lichenCount = Phaser.Math.Between(0, 2);
    for (let i = 0; i < lichenCount; i++) {
      const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const r = size * Phaser.Math.FloatBetween(0.1, 0.32);
      const lx = cx + Math.cos(a) * r;
      const ly = cy + Math.sin(a) * r * 0.85 - size * 0.05;
      g.fillStyle(0x6b8f4e, 0.6);
      g.fillCircle(lx, ly, Math.max(1, size * 0.045));
    }
  },

  generateRockTextures() {
    const sizes = [
      { key: 'rock-sm', size: 20 },
      { key: 'rock-md', size: 36 },
      { key: 'rock-lg', size: 56 },
      { key: 'rock-xl', size: 84 }
    ];

    this.rockKeys = sizes.map(s => s.key);

    sizes.forEach(({ key, size }) => {
      const shadowG = this.add.graphics();
      this.drawRockShadow(shadowG, size);
      shadowG.generateTexture(`${key}-shadow`, size, size);
      shadowG.destroy();

      const g = this.add.graphics();
      this.drawRock(g, size);
      g.generateTexture(key, size, size);
      g.destroy();
    });
  },

  // Samples an independent "rockiness" noise field (offset far from the terrain
  // noise's coordinate range so it reads as an unrelated pattern) and maps it to
  // an accept probability, so rocks cluster into rocky outcrops rather than
  // scattering uniformly across the whole world.
  rockDensityAt(x, y) {
    const r = this.smoothNoise2D(x + ROCKINESS_NOISE_OFFSET, y + ROCKINESS_NOISE_OFFSET, ROCKINESS_NOISE_SCALE);
    return Phaser.Math.Clamp((r - 0.35) / 0.45, 0.12, 1);
  },

  scatterRocks() {
    const count = 220;
    this.rockPositions = [];
    this.breakableRocks = [];

    let attempts = 0;
    let placedCount = 0;
    while (placedCount < count && attempts < count * 20) {
      attempts++;
      const x = this.rngBetween(20, WORLD_WIDTH - 20);
      const y = this.rngBetween(20, WORLD_HEIGHT - 20);

      if (this.rngFloatBetween(0, 1) > this.rockDensityAt(x, y)) continue;

      const key = this.rngPick(this.rockKeys);
      const scale = this.rngFloatBetween(0.85, 1.25);

      // Shadow is a separate, never-rotated sprite so it always falls the same
      // direction regardless of the rock body's random rotation below.
      const shadow = this.add.image(x, y, `${key}-shadow`);
      shadow.setScale(scale);
      shadow.setOrigin(0.5, 0.75);
      shadow.setDepth(y - 1.1);

      const rock = this.add.image(x, y, key);
      rock.setScale(scale);
      rock.setRotation(this.rngFloatBetween(0, Math.PI * 2));
      rock.setOrigin(0.5, 0.75);
      rock.setDepth(y - 1);
      this.rockPositions.push({ x, y, clearRadius: rock.displayWidth * 0.9 });

      let collider = null;
      if (scale > 0.95) {
        collider = this.add.zone(x, y - rock.displayHeight * 0.15, rock.displayWidth * 0.6, rock.displayHeight * 0.4);
        this.physics.add.existing(collider, true);
        this.rockCollidersPending = this.rockCollidersPending || [];
        this.rockCollidersPending.push(collider);
      }

      this.breakableRocks.push({ x, y, sprite: rock, shadowSprite: shadow, collider, hits: 0, networkId: `rock-${placedCount}` });
      placedCount++;
    }
  },

  scatterPools() {
    this.pools = [];
    const playerSpawnX = WORLD_WIDTH / 2;
    const playerSpawnY = WORLD_HEIGHT / 2;
    const minSpacing = 400;

    const placePool = (kind) => {
      let x, y, attempts = 0;
      do {
        x = this.rngBetween(150, WORLD_WIDTH - 150);
        y = this.rngBetween(150, WORLD_HEIGHT - 150);
        attempts++;
      } while (
        attempts < 30 && (
          Phaser.Math.Distance.Between(x, y, playerSpawnX, playerSpawnY) < 250 ||
          this.pools.some(p => Phaser.Math.Distance.Between(x, y, p.x, p.y) < minSpacing)
        )
      );

      const texture = kind === 'lava' ? 'lava-pool' : 'water-pool';
      const scale = this.rngFloatBetween(0.8, 1.3);
      const sprite = this.add.image(x, y, texture).setScale(scale).setDepth(y - 1000000);
      const radius = sprite.displayWidth * 0.38;

      const collider = this.add.zone(x, y, radius * 1.6, radius * 1.6);
      this.physics.add.existing(collider, true);
      this.physics.add.collider(this.player, collider);
      this.physics.add.collider(this.skeletonGroup, collider);

      const pool = { kind, x, y, sprite, collider, radius };
      this.pools.push(pool);
    };

    const lavaCount = this.rngBetween(2, 3);
    const waterCount = this.rngBetween(2, 3);
    for (let i = 0; i < lavaCount; i++) placePool('lava');
    for (let i = 0; i < waterCount; i++) placePool('water');
  },

  // Maps the shared terrain noise value (same field buildTerrain uses to pick
  // ground biome) to a tree-placement accept probability, so dirt clearings stay
  // sparse and lush patches grow dense forest — density visually tracks biome.
  treeDensityAt(x, y) {
    const n = this.smoothNoise2D(x, y, TERRAIN_NOISE_SCALE);
    return Phaser.Math.Clamp((n - 0.15) / 0.75, 0.12, 1);
  },

  scatterTrees() {
    const count = 420;
    const minSpacing = 26;
    const placed = [];
    this.choppableTrees = [];

    let attempts = 0;
    let placedCount = 0;
    while (placedCount < count && attempts < count * 20) {
      attempts++;
      const x = this.rngBetween(20, WORLD_WIDTH - 20);
      const y = this.rngBetween(20, WORLD_HEIGHT - 20);

      if (this.rngFloatBetween(0, 1) > this.treeDensityAt(x, y)) continue;

      let tooClose = false;
      for (let i = placed.length - 1; i >= 0; i--) {
        const p = placed[i];
        if (Phaser.Math.Distance.Between(x, y, p.x, p.y) < minSpacing) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) {
        for (let i = 0; i < this.rockPositions.length; i++) {
          const r = this.rockPositions[i];
          if (Phaser.Math.Distance.Between(x, y, r.x, r.y) < r.clearRadius) {
            tooClose = true;
            break;
          }
        }
      }
      if (tooClose) continue;

      placed.push({ x, y });
      const treeIndex = placedCount;
      placedCount++;

      const key = this.rngPick(this.treeKeys);
      const tree = this.add.image(x, y, key);
      tree.setOrigin(0.5, 1);
      const scale = this.rngFloatBetween(0.8, 1.3);
      tree.setScale(scale);
      tree.setDepth(y);

      const trunkWidth = tree.displayWidth * 0.09 * 2.2;
      const collider = this.add.zone(x, y - trunkWidth * 0.4, trunkWidth, trunkWidth * 0.8);
      this.physics.add.existing(collider, true);
      this.treeCollidersPending = this.treeCollidersPending || [];
      this.treeCollidersPending.push(collider);

      this.choppableTrees.push({ x, y, sprite: tree, collider, hits: 0, networkId: `tree-${treeIndex}` });
    }
  },
};
