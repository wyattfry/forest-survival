import Phaser from 'phaser';

export const itemTexturesMethods = {
  generateItemTextures() {
    // Twigs: thin curved brown sticks.
    const twigSizes = [
      { key: 'twig-sm', size: 16 },
      { key: 'twig-md', size: 24 }
    ];
    twigSizes.forEach(({ key, size }) => {
      const g = this.add.graphics();
      const cy = size / 2;
      g.lineStyle(Math.max(1.5, size * 0.12), 0x6b4526, 1);
      g.beginPath();
      g.moveTo(size * 0.12, cy + size * 0.12);
      g.lineTo(size * 0.5, cy - size * 0.1);
      g.lineTo(size * 0.88, cy + size * 0.08);
      g.strokePath();
      g.lineStyle(Math.max(1, size * 0.05), 0x4a3018, 0.8);
      g.beginPath();
      g.moveTo(size * 0.35, cy - size * 0.02);
      g.lineTo(size * 0.45, cy - size * 0.22);
      g.strokePath();
      g.generateTexture(key, size, size);
      g.destroy();
    });
    this.twigKeys = twigSizes.map(s => s.key);

    // Pebbles: small rounded stones.
    const pebbleSizes = [
      { key: 'pebble-sm', size: 10 },
      { key: 'pebble-md', size: 14 }
    ];
    pebbleSizes.forEach(({ key, size }) => {
      const g = this.add.graphics();
      const cx = size / 2;
      const cy = size / 2;
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(cx, size * 0.85, size * 0.7, size * 0.2);
      g.fillStyle(0x8a8378, 1);
      g.fillEllipse(cx, cy, size * 0.8, size * 0.62);
      g.fillStyle(0xaba497, 1);
      g.fillEllipse(cx - size * 0.12, cy - size * 0.1, size * 0.4, size * 0.28);
      g.generateTexture(key, size, size);
      g.destroy();
    });
    this.pebbleKeys = pebbleSizes.map(s => s.key);

    // Campfire icon: stacked logs with flame.
    {
      const size = 28;
      const g = this.add.graphics();
      const cx = size / 2;
      g.lineStyle(3, 0x6b4526, 1);
      g.beginPath();
      g.moveTo(size * 0.15, size * 0.85);
      g.lineTo(size * 0.85, size * 0.6);
      g.strokePath();
      g.beginPath();
      g.moveTo(size * 0.85, size * 0.85);
      g.lineTo(size * 0.15, size * 0.6);
      g.strokePath();
      g.fillStyle(0xffa726, 1);
      g.fillTriangle(cx, size * 0.1, cx - size * 0.16, size * 0.55, cx + size * 0.16, size * 0.55);
      g.fillStyle(0xffe066, 1);
      g.fillTriangle(cx, size * 0.28, cx - size * 0.08, size * 0.55, cx + size * 0.08, size * 0.55);
      g.generateTexture('icon-campfire', size, size);
      g.destroy();
    }

    // Stone axe icon: handle + wedge head.
    {
      const size = 28;
      const g = this.add.graphics();
      g.lineStyle(3, 0x6b4526, 1);
      g.beginPath();
      g.moveTo(size * 0.3, size * 0.9);
      g.lineTo(size * 0.75, size * 0.2);
      g.strokePath();
      g.fillStyle(0x9a9aa0, 1);
      g.beginPath();
      g.moveTo(size * 0.55, size * 0.35);
      g.lineTo(size * 0.9, size * 0.15);
      g.lineTo(size * 0.85, size * 0.45);
      g.lineTo(size * 0.6, size * 0.5);
      g.closePath();
      g.fillPath();
      g.generateTexture('icon-axe', size, size);
      g.destroy();
    }

    // Stone pickaxe icon: handle + double-pointed head.
    {
      const size = 28;
      const g = this.add.graphics();
      g.lineStyle(3, 0x6b4526, 1);
      g.beginPath();
      g.moveTo(size * 0.3, size * 0.9);
      g.lineTo(size * 0.7, size * 0.25);
      g.strokePath();
      g.fillStyle(0x9a9aa0, 1);
      g.beginPath();
      g.moveTo(size * 0.35, size * 0.2);
      g.lineTo(size * 0.7, size * 0.35);
      g.lineTo(size * 0.95, size * 0.15);
      g.lineTo(size * 0.6, size * 0.08);
      g.closePath();
      g.fillPath();
      g.generateTexture('icon-pickaxe', size, size);
      g.destroy();
    }

    // Stone sword icon: handle + crossguard + stone blade.
    {
      const size = 28;
      const g = this.add.graphics();
      const cx = size / 2;
      g.lineStyle(3, 0x6b4526, 1);
      g.beginPath();
      g.moveTo(cx, size * 0.9);
      g.lineTo(cx, size * 0.55);
      g.strokePath();
      g.lineStyle(3, 0x8a8378, 1);
      g.beginPath();
      g.moveTo(cx - size * 0.22, size * 0.58);
      g.lineTo(cx + size * 0.22, size * 0.58);
      g.strokePath();
      g.fillStyle(0xb5b5bc, 1);
      g.beginPath();
      g.moveTo(cx - size * 0.1, size * 0.55);
      g.lineTo(cx + size * 0.1, size * 0.55);
      g.lineTo(cx + size * 0.06, size * 0.12);
      g.lineTo(cx, size * 0.05);
      g.lineTo(cx - size * 0.06, size * 0.12);
      g.closePath();
      g.fillPath();
      g.lineStyle(1, 0x8f8f96, 0.8);
      g.beginPath();
      g.moveTo(cx, size * 0.5);
      g.lineTo(cx, size * 0.12);
      g.strokePath();
      g.generateTexture('icon-sword', size, size);
      g.destroy();
    }

    // Bow icon: curved wood limb + taut string.
    {
      const size = 28;
      const g = this.add.graphics();
      const cx = size / 2;
      g.lineStyle(3, 0x8a5a34, 1);
      g.beginPath();
      g.arc(cx - size * 0.05, size / 2, size * 0.42, Phaser.Math.DegToRad(-70), Phaser.Math.DegToRad(70));
      g.strokePath();
      g.lineStyle(1.2, 0xe8e4d8, 0.9);
      g.beginPath();
      g.moveTo(cx + size * 0.09, size * 0.14);
      g.lineTo(cx + size * 0.09, size * 0.86);
      g.strokePath();
      g.generateTexture('icon-bow', size, size);
      g.destroy();
    }

    // AK-47 icon: distinctive curved magazine + wood furniture, side profile.
    {
      const w = 32, h = 20;
      const g = this.add.graphics();
      const cy = h * 0.5;
      // Barrel + receiver.
      g.fillStyle(0x2a2a2a, 1);
      g.fillRect(w * 0.08, cy - 2, w * 0.8, 3.5);
      // Wood stock (rear).
      g.fillStyle(0x8a5a34, 1);
      g.fillRect(w * 0.02, cy - 1, w * 0.16, 6);
      // Wood handguard (front, under barrel).
      g.fillStyle(0x8a5a34, 1);
      g.fillRect(w * 0.58, cy + 1.5, w * 0.22, 3);
      // Pistol grip.
      g.fillStyle(0x3a2a1e, 1);
      g.fillTriangle(w * 0.34, cy + 1.5, w * 0.34, cy + 8, w * 0.42, cy + 1.5);
      // Curved banana magazine.
      g.fillStyle(0x4a4a4a, 1);
      g.beginPath();
      g.moveTo(w * 0.42, cy + 2);
      g.lineTo(w * 0.5, cy + 2);
      g.lineTo(w * 0.46, cy + 11);
      g.lineTo(w * 0.4, cy + 10);
      g.closePath();
      g.fillPath();
      // Front sight post.
      g.fillStyle(0x1a1a1a, 1);
      g.fillRect(w * 0.86, cy - 6, 1.6, 4.5);
      g.generateTexture('icon-ak47', w, h);
      g.destroy();
    }

    // FAMAS icon: bullpup silhouette, boxy carry handle, mag behind the grip.
    {
      const w = 32, h = 20;
      const g = this.add.graphics();
      const cy = h * 0.5;
      // Main body, chunky bullpup shape.
      g.fillStyle(0x3a3f3a, 1);
      g.fillRoundedRect(w * 0.08, cy - 2.5, w * 0.6, 6, 2);
      // Carry handle on top.
      g.fillStyle(0x2a2f2a, 1);
      g.fillRect(w * 0.28, cy - 7, w * 0.22, 4.5);
      // Barrel.
      g.fillStyle(0x1a1a1a, 1);
      g.fillRect(w * 0.62, cy - 1, w * 0.3, 2.5);
      // Grip.
      g.fillStyle(0x2a2f2a, 1);
      g.fillTriangle(w * 0.42, cy + 3, w * 0.42, cy + 9, w * 0.5, cy + 3);
      // Straight magazine, behind the grip (bullpup layout).
      g.fillStyle(0x4a4a4a, 1);
      g.fillRect(w * 0.2, cy + 3, 3.5, 9);
      g.generateTexture('icon-famas', w, h);
      g.destroy();
    }

    // Glock-17 icon: compact pistol silhouette.
    {
      const w = 22, h = 18;
      const g = this.add.graphics();
      const cy = h * 0.42;
      // Slide + barrel.
      g.fillStyle(0x2a2a2a, 1);
      g.fillRoundedRect(w * 0.1, cy - 2.5, w * 0.75, 5, 1.5);
      // Frame/grip, angled down-back.
      g.fillStyle(0x1a1a1a, 1);
      g.fillTriangle(w * 0.2, cy + 2, w * 0.16, h * 0.95, w * 0.5, cy + 2);
      // Trigger guard.
      g.lineStyle(1.4, 0x1a1a1a, 1);
      g.strokeCircle(w * 0.42, cy + 3, 2.6);
      g.generateTexture('icon-glock17', w, h);
      g.destroy();
    }

    // Craftable arrow icon (matches the enemy arrow projectile look).
    {
      const size = 24;
      const g = this.add.graphics();
      const cy = size / 2;
      g.lineStyle(2, 0x6b4526, 1);
      g.beginPath();
      g.moveTo(size * 0.12, cy + 4);
      g.lineTo(size * 0.82, cy - 4);
      g.strokePath();
      g.fillStyle(0x8f8f96, 1);
      g.fillTriangle(size * 0.78, cy - 8, size * 0.82, cy - 4, size * 0.68, cy - 2);
      g.fillStyle(0xd8c39a, 1);
      g.fillTriangle(size * 0.1, cy + 1, size * 0.16, cy + 9, size * 0.22, cy + 3);
      g.generateTexture('icon-arrow-item', size, size);
      g.destroy();
    }

    // String icon: a small coiled fiber loop.
    {
      const size = 20;
      const g = this.add.graphics();
      const cx = size / 2;
      const cy = size / 2;
      g.lineStyle(1.6, 0xe8e0c8, 1);
      g.strokeEllipse(cx, cy, size * 0.6, size * 0.36);
      g.strokeEllipse(cx, cy, size * 0.36, size * 0.6);
      g.generateTexture('icon-string', size, size);
      g.destroy();
    }

    // Log seat icon: a short cut log viewed from the side.
    {
      const size = 24;
      const g = this.add.graphics();
      const cy = size / 2;
      g.fillStyle(0x8a5a34, 1);
      g.fillRoundedRect(2, cy - 5, size - 4, 10, 3);
      g.fillStyle(0xd8a86a, 1);
      g.fillEllipse(4, cy, 4, 8);
      g.fillStyle(0xd8a86a, 1);
      g.fillEllipse(size - 4, cy, 4, 8);
      g.generateTexture('icon-log-seat', size, size);
      g.destroy();
    }

    // World log seat (top-down bench, wider than the icon).
    {
      const w = 44, h = 20;
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(w / 2, h - 3, w * 0.85, h * 0.3);
      g.fillStyle(0x8a5a34, 1);
      g.fillRoundedRect(2, 2, w - 4, h - 6, 4);
      g.fillStyle(0xd8a86a, 1);
      g.fillEllipse(6, h / 2 - 1, 6, h - 8);
      g.fillEllipse(w - 6, h / 2 - 1, 6, h - 8);
      g.fillStyle(0xa87848, 1);
      g.fillEllipse(6, h / 2 - 1, 3, (h - 8) * 0.6);
      g.fillEllipse(w - 6, h / 2 - 1, 3, (h - 8) * 0.6);
      g.generateTexture('log-seat-world', w, h);
      g.destroy();
    }

    // Furnace kit icon: stone blocks with a fiery opening.
    {
      const size = 24;
      const g = this.add.graphics();
      const cx = size / 2;
      g.fillStyle(0x7a7a80, 1);
      g.fillRoundedRect(2, 2, size - 4, size - 4, 3);
      g.fillStyle(0x2a2a2e, 1);
      g.fillRect(cx - 5, size - 10, 10, 8);
      g.fillStyle(0xffa726, 1);
      g.fillTriangle(cx, size - 9, cx - 3, size - 3, cx + 3, size - 3);
      g.generateTexture('icon-furnace', size, size);
      g.destroy();
    }

    // World furnace (top-down, larger stone structure with glowing opening).
    {
      const w = 40, h = 40;
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.3);
      g.fillEllipse(w / 2, h - 4, w * 0.8, h * 0.22);
      g.fillStyle(0x6e6e74, 1);
      g.fillRoundedRect(2, 2, w - 4, h - 4, 5);
      g.fillStyle(0x59595e, 1);
      g.fillRoundedRect(6, 6, w - 12, h - 12, 4);
      g.fillStyle(0x2a2a2e, 1);
      g.fillRect(w / 2 - 8, h / 2 - 4, 16, 12);
      g.fillStyle(0xffa726, 0.9);
      g.fillTriangle(w / 2, h / 2 - 2, w / 2 - 5, h / 2 + 6, w / 2 + 5, h / 2 + 6);
      g.generateTexture('furnace-world', w, h);
      g.destroy();
    }

    // Crafting table kit icon: a small wooden workbench with tools.
    {
      const size = 24;
      const g = this.add.graphics();
      const cx = size / 2;
      g.fillStyle(0x8a5a34, 1);
      g.fillRoundedRect(2, size * 0.35, size - 4, size * 0.3, 2);
      g.fillStyle(0x6b4526, 1);
      g.fillRect(3, size * 0.62, 3, size * 0.3);
      g.fillRect(size - 6, size * 0.62, 3, size * 0.3);
      g.lineStyle(1.5, 0x9a9aa0, 1);
      g.beginPath();
      g.moveTo(cx - 4, size * 0.42);
      g.lineTo(cx + 3, size * 0.28);
      g.strokePath();
      g.generateTexture('icon-crafting-table', size, size);
      g.destroy();
    }

    // World crafting table (top-down wooden workbench).
    {
      const w = 40, h = 30;
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(w / 2, h - 3, w * 0.85, h * 0.22);
      g.fillStyle(0x8a5a34, 1);
      g.fillRoundedRect(2, 2, w - 4, h - 8, 4);
      g.fillStyle(0xa8764a, 1);
      g.fillRoundedRect(4, 4, w - 8, (h - 8) * 0.4, 3);
      g.lineStyle(1, 0x5c3a1e, 0.8);
      g.strokeRoundedRect(2, 2, w - 4, h - 8, 4);
      g.fillStyle(0x6b4526, 1);
      g.fillRect(4, h - 8, 4, 8);
      g.fillRect(w - 8, h - 8, 4, 8);
      g.lineStyle(2, 0x9a9aa0, 1);
      g.beginPath();
      g.moveTo(w * 0.62, h * 0.25);
      g.lineTo(w * 0.82, h * 0.08);
      g.strokePath();
      g.generateTexture('crafting-table-world', w, h);
      g.destroy();
    }

    // Wall icon + world piece: a solid wooden plank panel.
    {
      const size = 22;
      const g = this.add.graphics();
      g.fillStyle(0x8a5a34, 1);
      g.fillRect(2, 2, size - 4, size - 4);
      g.lineStyle(1, 0x5c3a1e, 0.8);
      for (let i = 1; i < 4; i++) {
        g.beginPath();
        g.moveTo(2 + i * (size - 4) / 4, 2);
        g.lineTo(2 + i * (size - 4) / 4, size - 2);
        g.strokePath();
      }
      g.strokeRect(2, 2, size - 4, size - 4);
      g.generateTexture('icon-wall', size, size);
      g.destroy();
    }
    {
      const w = 40, h = 40;
      const g = this.add.graphics();
      g.fillStyle(0x8a5a34, 1);
      g.fillRect(2, 2, w - 4, h - 4);
      g.lineStyle(1.5, 0x5c3a1e, 0.85);
      for (let i = 1; i < 5; i++) {
        g.beginPath();
        g.moveTo(2 + i * (w - 4) / 5, 2);
        g.lineTo(2 + i * (w - 4) / 5, h - 2);
        g.strokePath();
      }
      g.strokeRect(2, 2, w - 4, h - 4);
      g.generateTexture('wall-world', w, h);
      g.destroy();
    }

    // Door icon + world piece: a wooden door with a handle.
    {
      const size = 22;
      const g = this.add.graphics();
      g.fillStyle(0x7a5230, 1);
      g.fillRoundedRect(3, 2, size - 6, size - 4, 2);
      g.fillStyle(0x2a2a2e, 1);
      g.fillCircle(size - 7, size / 2, 1.4);
      g.generateTexture('icon-door', size, size);
      g.destroy();
    }
    {
      const w = 40, h = 12;
      const g = this.add.graphics();
      g.fillStyle(0x7a5230, 1);
      g.fillRoundedRect(1, 1, w - 2, h - 2, 2);
      g.lineStyle(1, 0x3f2814, 0.8);
      g.strokeRoundedRect(1, 1, w - 2, h - 2, 2);
      g.fillStyle(0x2a2a2e, 1);
      g.fillCircle(w - 7, h / 2, 1.6);
      g.generateTexture('door-world', w, h);
      g.destroy();
    }

    // Roof icon + world piece: an angled shingled panel (semi-transparent so it's see-through in world).
    {
      const size = 22;
      const g = this.add.graphics();
      g.fillStyle(0xa8442e, 1);
      g.fillTriangle(size / 2, 2, 2, size - 2, size - 2, size - 2);
      g.lineStyle(1, 0x7a2e1c, 0.8);
      g.strokeTriangle(size / 2, 2, 2, size - 2, size - 2, size - 2);
      g.generateTexture('icon-roof', size, size);
      g.destroy();
    }
    {
      const w = 44, h = 44;
      const g = this.add.graphics();
      g.fillStyle(0xa8442e, 0.55);
      g.fillRoundedRect(2, 2, w - 4, h - 4, 4);
      g.lineStyle(1, 0x7a2e1c, 0.6);
      for (let i = 1; i < 5; i++) {
        g.beginPath();
        g.moveTo(2, i * (h - 4) / 5 + 2);
        g.lineTo(w - 2, i * (h - 4) / 5 + 2);
        g.strokePath();
      }
      g.strokeRoundedRect(2, 2, w - 4, h - 4, 4);
      g.generateTexture('roof-world', w, h);
      g.destroy();
    }

    // Chair icon + world piece: a small wooden chair viewed from above.
    {
      const size = 20;
      const g = this.add.graphics();
      const cx = size / 2;
      g.fillStyle(0x8a5a34, 1);
      g.fillRoundedRect(cx - 6, cx - 6, 12, 12, 2);
      g.fillStyle(0x6b4526, 1);
      g.fillRect(cx - 6, cx - 8, 12, 3);
      g.generateTexture('icon-chair', size, size);
      g.destroy();
    }
    {
      const w = 24, h = 24;
      const g = this.add.graphics();
      const cx = w / 2;
      g.fillStyle(0x000000, 0.2);
      g.fillEllipse(cx, h - 4, w * 0.7, h * 0.2);
      g.fillStyle(0x8a5a34, 1);
      g.fillRoundedRect(3, 6, w - 6, h - 10, 2);
      g.fillStyle(0x6b4526, 1);
      g.fillRoundedRect(3, 2, w - 6, 5, 2);
      g.generateTexture('chair-world', w, h);
      g.destroy();
    }

    // Table icon + world piece: a square wooden table.
    {
      const size = 22;
      const g = this.add.graphics();
      g.fillStyle(0x8a5a34, 1);
      g.fillRoundedRect(2, 2, size - 4, size - 4, 3);
      g.fillStyle(0xa8764a, 1);
      g.fillRoundedRect(4, 4, size - 8, size - 8, 2);
      g.generateTexture('icon-table', size, size);
      g.destroy();
    }
    {
      const w = 34, h = 34;
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(w / 2, h - 4, w * 0.85, h * 0.2);
      g.fillStyle(0x8a5a34, 1);
      g.fillRoundedRect(2, 2, w - 4, h - 6, 4);
      g.fillStyle(0xa8764a, 1);
      g.fillRoundedRect(5, 5, w - 10, h - 12, 3);
      g.generateTexture('table-world', w, h);
      g.destroy();
    }

    // Steps icon + world piece: a small stone staircase.
    {
      const size = 22;
      const g = this.add.graphics();
      g.fillStyle(0x9a9aa0, 1);
      g.fillRect(2, size * 0.6, size - 4, size * 0.3);
      g.fillStyle(0xb5b5bc, 1);
      g.fillRect(5, size * 0.3, size - 10, size * 0.3);
      g.fillStyle(0xcfcfd4, 1);
      g.fillRect(8, 2, size - 16, size * 0.3);
      g.generateTexture('icon-steps', size, size);
      g.destroy();
    }
    {
      const w = 32, h = 32;
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.2);
      g.fillEllipse(w / 2, h - 3, w * 0.8, h * 0.15);
      g.fillStyle(0x9a9aa0, 1);
      g.fillRect(2, h * 0.62, w - 4, h * 0.3);
      g.fillStyle(0xb5b5bc, 1);
      g.fillRect(6, h * 0.32, w - 12, h * 0.3);
      g.fillStyle(0xcfcfd4, 1);
      g.fillRect(10, 2, w - 20, h * 0.3);
      g.generateTexture('steps-world', w, h);
      g.destroy();
    }

    // Iron ore icon: grey rock with rust-colored flecks.
    {
      const size = 20;
      const g = this.add.graphics();
      const cx = size / 2, cy = size / 2;
      g.fillStyle(0x8f8f96, 1);
      g.fillCircle(cx, cy, size * 0.42);
      g.fillStyle(0xb5734a, 1);
      g.fillCircle(cx - 3, cy - 2, 2.4);
      g.fillCircle(cx + 3, cy + 1, 2);
      g.fillCircle(cx, cy + 4, 1.8);
      g.generateTexture('icon-iron-ore', size, size);
      g.destroy();
    }

    // Iron ingot icon: a shiny metal bar.
    {
      const size = 22;
      const g = this.add.graphics();
      const cx = size / 2, cy = size / 2;
      g.fillStyle(0x9aa0a8, 1);
      g.fillRoundedRect(cx - 8, cy - 4, 16, 8, 2);
      g.fillStyle(0xc8ced4, 1);
      g.fillRoundedRect(cx - 8, cy - 4, 16, 3, 1.5);
      g.generateTexture('icon-iron-ingot', size, size);
      g.destroy();
    }

    // Iron chestplate icon.
    {
      const size = 22;
      const g = this.add.graphics();
      const cx = size / 2;
      g.fillStyle(0x9aa0a8, 1);
      g.fillRoundedRect(cx - 8, 4, 16, 15, 3);
      g.fillStyle(0xc8ced4, 1);
      g.fillRect(cx - 1.5, 4, 3, 15);
      g.fillStyle(0x7a808a, 1);
      g.fillCircle(cx - 8, 7, 2.5);
      g.fillCircle(cx + 8, 7, 2.5);
      g.generateTexture('icon-iron-chestplate', size, size);
      g.destroy();
    }

    // Iron helmet icon.
    {
      const size = 22;
      const g = this.add.graphics();
      const cx = size / 2, cy = size / 2;
      g.fillStyle(0x9aa0a8, 1);
      g.beginPath();
      g.arc(cx, cy - 2, 8, Phaser.Math.DegToRad(190), Phaser.Math.DegToRad(-10));
      g.lineTo(cx + 8, cy - 2);
      g.closePath();
      g.fillPath();
      g.fillRect(cx - 8, cy - 2, 16, 3);
      g.fillStyle(0xc8ced4, 1);
      g.fillTriangle(cx, cy - 9, cx - 1.4, cy - 4, cx + 1.4, cy - 4);
      g.generateTexture('icon-iron-helmet', size, size);
      g.destroy();
    }

    // Iron arm piece icon (vambrace).
    {
      const size = 22;
      const g = this.add.graphics();
      const cx = size / 2;
      g.fillStyle(0x9aa0a8, 1);
      g.fillRoundedRect(cx - 3, 3, 6, 16, 2);
      g.fillStyle(0x7a808a, 1);
      g.fillRect(cx - 3, 7, 6, 2);
      g.fillRect(cx - 3, 12, 6, 2);
      g.generateTexture('icon-iron-arm', size, size);
      g.destroy();
    }

    // Iron gauntlet icon (fist).
    {
      const size = 22;
      const g = this.add.graphics();
      const cx = size / 2, cy = size / 2;
      g.fillStyle(0x9aa0a8, 1);
      g.fillRoundedRect(cx - 6, cy - 4, 12, 10, 3);
      g.fillStyle(0x7a808a, 1);
      for (let i = 0; i < 3; i++) {
        g.fillRoundedRect(cx - 5 + i * 4, cy - 8, 3, 5, 1.5);
      }
      g.generateTexture('icon-iron-gauntlet', size, size);
      g.destroy();
    }

    // Iron leggings & boots icon.
    {
      const size = 22;
      const g = this.add.graphics();
      const cx = size / 2;
      g.fillStyle(0x9aa0a8, 1);
      g.fillRoundedRect(cx - 6, 3, 5, 12, 2);
      g.fillRoundedRect(cx + 1, 3, 5, 12, 2);
      g.fillStyle(0x5c5c62, 1);
      g.fillRoundedRect(cx - 7, 14, 6, 5, 1.5);
      g.fillRoundedRect(cx + 1, 14, 6, 5, 1.5);
      g.generateTexture('icon-iron-leggings', size, size);
      g.destroy();
    }

    // Full iron armor set icon (chestplate with a shine).
    {
      const size = 22;
      const g = this.add.graphics();
      const cx = size / 2;
      g.fillStyle(0x9aa0a8, 1);
      g.fillRoundedRect(cx - 8, 4, 16, 15, 3);
      g.fillStyle(0xc8ced4, 1);
      g.fillRect(cx - 1.5, 4, 3, 15);
      g.fillStyle(0x7a808a, 1);
      g.fillCircle(cx - 8, 7, 2.5);
      g.fillCircle(cx + 8, 7, 2.5);
      g.fillStyle(0xffe066, 0.9);
      g.fillCircle(cx + 5, 8, 1.6);
      g.generateTexture('icon-iron-armor', size, size);
      g.destroy();
    }

    // Empty bucket icon.
    {
      const size = 20;
      const g = this.add.graphics();
      const cx = size / 2;
      g.lineStyle(2, 0x9aa0a8, 1);
      g.beginPath();
      g.moveTo(cx - 6, 5);
      g.lineTo(cx - 5, size - 4);
      g.lineTo(cx + 5, size - 4);
      g.lineTo(cx + 6, 5);
      g.strokePath();
      g.lineStyle(1.5, 0x7a808a, 1);
      g.beginPath();
      g.arc(cx, 5, 6, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(-20));
      g.strokePath();
      g.lineStyle(1.2, 0x5c5c62, 0.9);
      g.beginPath();
      g.moveTo(cx - 6, 2);
      g.lineTo(cx + 6, 2);
      g.strokePath();
      g.generateTexture('icon-bucket-empty', size, size);
      g.destroy();
    }

    // Water bucket icon.
    {
      const size = 20;
      const g = this.add.graphics();
      const cx = size / 2;
      g.lineStyle(2, 0x9aa0a8, 1);
      g.beginPath();
      g.moveTo(cx - 6, 5);
      g.lineTo(cx - 5, size - 4);
      g.lineTo(cx + 5, size - 4);
      g.lineTo(cx + 6, 5);
      g.strokePath();
      g.fillStyle(0x2f88b5, 1);
      g.fillRect(cx - 5, 8, 10, size - 12);
      g.fillStyle(0x8fd6f0, 0.7);
      g.fillCircle(cx - 2, 10, 1.6);
      g.lineStyle(1.5, 0x7a808a, 1);
      g.beginPath();
      g.arc(cx, 5, 6, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(-20));
      g.strokePath();
      g.generateTexture('icon-bucket-water', size, size);
      g.destroy();
    }

    // Lava bucket icon.
    {
      const size = 20;
      const g = this.add.graphics();
      const cx = size / 2;
      g.lineStyle(2, 0x9aa0a8, 1);
      g.beginPath();
      g.moveTo(cx - 6, 5);
      g.lineTo(cx - 5, size - 4);
      g.lineTo(cx + 5, size - 4);
      g.lineTo(cx + 6, 5);
      g.strokePath();
      g.fillStyle(0xd9481f, 1);
      g.fillRect(cx - 5, 8, 10, size - 12);
      g.fillStyle(0xffb347, 0.8);
      g.fillCircle(cx - 2, 10, 1.6);
      g.lineStyle(1.5, 0x7a808a, 1);
      g.beginPath();
      g.arc(cx, 5, 6, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(-20));
      g.strokePath();
      g.generateTexture('icon-bucket-lava', size, size);
      g.destroy();
    }

    // Obsidian chunk icon.
    {
      const size = 20;
      const g = this.add.graphics();
      const cx = size / 2, cy = size / 2;
      g.fillStyle(0x241533, 1);
      g.fillTriangle(cx - 7, cy + 6, cx - 1, cy - 7, cx + 4, cy + 5);
      g.fillStyle(0x3a2454, 1);
      g.fillTriangle(cx, cy + 6, cx + 6, cy - 5, cx + 9, cy + 6);
      g.fillStyle(0x6a4a9e, 0.6);
      g.fillCircle(cx - 3, cy - 2, 1.4);
      g.generateTexture('icon-obsidian', size, size);
      g.destroy();
    }


    // Bone icon: a small skeletal fragment (double-knuckle bone shape).
    {
      const size = 16;
      const g = this.add.graphics();
      const cx = size / 2, cy = size / 2;
      g.fillStyle(0xe8e4d8, 1);
      g.fillRoundedRect(cx - 5, cy - 1.6, 10, 3.2, 1.6);
      g.fillCircle(cx - 5, cy - 1.6, 2.2);
      g.fillCircle(cx - 5, cy + 1.6, 2.2);
      g.fillCircle(cx + 5, cy - 1.6, 2.2);
      g.fillCircle(cx + 5, cy + 1.6, 2.2);
      g.generateTexture('icon-bone', size, size);
      g.destroy();
    }

    // Wood icon: a cut log with visible rings.
    {
      const size = 24;
      const g = this.add.graphics();
      const cx = size / 2;
      const cy = size / 2;
      g.fillStyle(0x8a5a34, 1);
      g.fillRoundedRect(2, cy - 6, size - 4, 12, 3);
      g.fillStyle(0xd8a86a, 1);
      g.fillCircle(4, cy, 5);
      g.fillStyle(0xa87848, 1);
      g.fillCircle(4, cy, 3);
      g.fillStyle(0xd8a86a, 1);
      g.fillCircle(size - 4, cy, 5);
      g.fillStyle(0xa87848, 1);
      g.fillCircle(size - 4, cy, 3);
      g.generateTexture('icon-wood', size, size);
      g.destroy();
    }

    // Stone chunk icon: small cluster of grey shards.
    {
      const size = 24;
      const g = this.add.graphics();
      const cx = size / 2;
      const cy = size / 2;
      g.fillStyle(0x8f8f96, 1);
      g.fillTriangle(cx - 8, cy + 6, cx - 2, cy - 7, cx + 3, cy + 5);
      g.fillStyle(0xb5b5bc, 1);
      g.fillTriangle(cx - 1, cy + 6, cx + 5, cy - 5, cx + 9, cy + 6);
      g.generateTexture('icon-stone-chunk', size, size);
      g.destroy();
    }
  },

  generateArrowTexture() {
    const size = 20;
    const g = this.add.graphics();
    const cy = size / 2;

    g.lineStyle(2, 0x6b4526, 1);
    g.beginPath();
    g.moveTo(size * 0.1, cy);
    g.lineTo(size * 0.75, cy);
    g.strokePath();

    g.fillStyle(0x8f8f96, 1);
    g.fillTriangle(size * 0.75, cy - 4, size * 0.75, cy + 4, size * 0.98, cy);

    g.fillStyle(0xd8c39a, 1);
    g.fillTriangle(size * 0.1, cy - 4, size * 0.1, cy + 4, size * 0, cy);

    g.generateTexture('arrow', size, size);
    g.destroy();
  },
};
