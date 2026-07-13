import Phaser from 'phaser';

export function ageToScale(age) {
  const a = Phaser.Math.Clamp(age || 25, 1, 100);
  if (a <= 18) {
    // Children/teens scale up from small to full adult size.
    return 0.55 + (a / 18) * 0.45;
  }
  if (a >= 65) {
    // Elderly characters shrink slightly with age.
    return 1 - Math.min((a - 65) / 35, 1) * 0.12;
  }
  return 1;
}

export const MALE_HAIR_STYLES = [
  { id: 'short', label: 'Short' },
  { id: 'buzz', label: 'Buzz Cut' },
  { id: 'spiky', label: 'Spiky' },
  { id: 'messy', label: 'Messy' },
  { id: 'mohawk', label: 'Mohawk' },
  { id: 'crew', label: 'Crew Cut' },
  { id: 'slick', label: 'Slicked Back' },
  { id: 'curly', label: 'Curly' },
  { id: 'afro', label: 'Afro' },
  { id: 'fauxhawk', label: 'Faux Hawk' },
  { id: 'undercut', label: 'Undercut' },
  { id: 'long', label: 'Long' },
  { id: 'man-bun', label: 'Man Bun' },
  { id: 'bald', label: 'Bald' }
];

export const FEMALE_HAIR_STYLES = [
  { id: 'short', label: 'Short' },
  { id: 'long', label: 'Long' },
  { id: 'ponytail', label: 'Ponytail' },
  { id: 'bob', label: 'Bob' },
  { id: 'pigtails', label: 'Pigtails' },
  { id: 'bun', label: 'Bun' },
  { id: 'braid', label: 'Braid' },
  { id: 'curly-long', label: 'Curly Long' },
  { id: 'wavy', label: 'Wavy' },
  { id: 'pixie', label: 'Pixie' },
  { id: 'side-swept', label: 'Side Swept' },
  { id: 'high-ponytail', label: 'High Ponytail' },
  { id: 'afro-puff', label: 'Afro Puff' },
  { id: 'bald', label: 'Bald' }
];

export const HAIR_COLORS = [
  0x3a2a1e, 0x1a1a1a, 0x6b4a2a, 0xb8860b, 0xd6b370,
  0xc94f4f, 0x9a4fd6, 0x4f8fd6, 0x4fd6a0, 0xe8e8e8
];

export const SKIN_TONES = [
  0xffe0bd, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0x5c3317
];

// Derives a shade of `color` by multiplying each RGB channel toward black (factor < 1)
// or toward white (factor > 1), used to build shadow/highlight tones from the player's
// chosen hair color so every style gets consistent, colored shading rather than flat fills.
function shadeColor(color, factor) {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
  if (factor <= 1) {
    return (clamp(r * factor) << 16) | (clamp(g * factor) << 8) | clamp(b * factor);
  }
  const t = factor - 1;
  return (clamp(r + (255 - r) * t) << 16) | (clamp(g + (255 - g) * t) << 8) | clamp(b + (255 - b) * t);
}

// A few thin highlight strokes across the main mass, angled with the hairline, to
// suggest individual strands catching light. Shared by most styles.
function drawStrands(g, cx, topY, width, rows, highlight) {
  g.lineStyle(0.8, highlight, 0.55);
  for (let i = 0; i < rows; i++) {
    const y = topY + i * (width * 0.09);
    const spread = width * 0.5 * (1 - i * 0.12);
    g.beginPath();
    g.moveTo(cx - spread, y + 1);
    g.lineTo(cx - spread * 0.3, y - 1);
    g.strokePath();
    g.beginPath();
    g.moveTo(cx + spread * 0.2, y - 1);
    g.lineTo(cx + spread * 0.75, y + 1.5);
    g.strokePath();
  }
}

export function drawHairShape(g, style, cx, size, hairColor) {
  hairColor = hairColor || 0x3a2a1e;
  const dark = shadeColor(hairColor, 0.62);
  const light = shadeColor(hairColor, 1.45);
  const stroke = shadeColor(hairColor, 0.4);

  g.fillStyle(hairColor, 1);

  switch (style) {
    case 'bald':
      // No hair drawn; scalp shows through.
      break;

    case 'buzz':
      g.fillEllipse(cx, size * 0.29, 19, 9);
      g.fillStyle(dark, 0.5);
      g.fillEllipse(cx, size * 0.32, 18, 5);
      g.lineStyle(1, stroke, 0.7);
      g.strokeEllipse(cx, size * 0.29, 19, 9);
      drawStrands(g, cx, size * 0.25, 16, 2, light);
      break;

    case 'crew':
      g.fillEllipse(cx, size * 0.28, 20, 10);
      g.fillStyle(light, 0.5);
      g.fillEllipse(cx - 3, size * 0.24, 10, 5);
      g.fillStyle(dark, 0.5);
      g.fillEllipse(cx, size * 0.32, 18, 5);
      g.lineStyle(1, stroke, 0.7);
      g.strokeEllipse(cx, size * 0.28, 20, 10);
      break;

    case 'spiky':
      g.fillEllipse(cx, size * 0.29, 19, 10);
      g.fillStyle(dark, 0.5);
      g.fillEllipse(cx, size * 0.33, 18, 5);
      g.fillStyle(hairColor, 1);
      for (let i = -2; i <= 2; i++) {
        g.fillTriangle(
          cx + i * 4 - 2, size * 0.25,
          cx + i * 4 + 2, size * 0.25,
          cx + i * 4, size * 0.14
        );
        g.lineStyle(0.8, light, 0.7);
        g.beginPath();
        g.moveTo(cx + i * 4 - 1, size * 0.24);
        g.lineTo(cx + i * 4, size * 0.16);
        g.strokePath();
      }
      g.lineStyle(1, stroke, 0.6);
      g.strokeEllipse(cx, size * 0.29, 19, 10);
      break;

    case 'messy':
      g.fillEllipse(cx, size * 0.27, 21, 12);
      g.fillEllipse(cx - 8, size * 0.19, 6, 6);
      g.fillEllipse(cx + 6, size * 0.18, 7, 7);
      g.fillEllipse(cx + 1, size * 0.16, 6, 6);
      g.fillStyle(dark, 0.45);
      g.fillEllipse(cx, size * 0.32, 19, 6);
      g.fillStyle(light, 0.5);
      g.fillEllipse(cx - 5, size * 0.2, 5, 4);
      g.fillEllipse(cx + 4, size * 0.15, 4, 3.5);
      g.lineStyle(1, stroke, 0.6);
      g.strokeEllipse(cx, size * 0.27, 21, 12);
      break;

    case 'mohawk':
      g.fillEllipse(cx, size * 0.31, 19, 7);
      g.fillRoundedRect(cx - 2.5, size * 0.1, 5, size * 0.22, 2);
      g.fillStyle(light, 0.6);
      g.fillRoundedRect(cx - 1.2, size * 0.11, 1.6, size * 0.19, 1);
      g.fillStyle(dark, 0.5);
      g.fillEllipse(cx, size * 0.33, 17, 4);
      g.lineStyle(1, stroke, 0.7);
      g.strokeRoundedRect(cx - 2.5, size * 0.1, 5, size * 0.22, 2);
      break;

    case 'fauxhawk':
      g.fillEllipse(cx, size * 0.29, 20, 9);
      g.fillRoundedRect(cx - 3.5, size * 0.16, 7, size * 0.16, 2);
      g.fillStyle(light, 0.55);
      g.fillRoundedRect(cx - 1.8, size * 0.17, 2, size * 0.13, 1);
      g.fillStyle(dark, 0.45);
      g.fillEllipse(cx, size * 0.32, 18, 5);
      g.lineStyle(1, stroke, 0.6);
      g.strokeEllipse(cx, size * 0.29, 20, 9);
      break;

    case 'slick':
      g.fillEllipse(cx, size * 0.27, 20, 11);
      g.fillTriangle(cx - 10, size * 0.28, cx - 2, size * 0.22, cx - 10, size * 0.34);
      g.fillStyle(light, 0.6);
      g.beginPath();
      g.moveTo(cx - 8, size * 0.24);
      g.lineTo(cx + 6, size * 0.2);
      g.lineTo(cx + 8, size * 0.23);
      g.lineTo(cx - 6, size * 0.27);
      g.closePath();
      g.fillPath();
      g.fillStyle(dark, 0.4);
      g.fillEllipse(cx + 2, size * 0.32, 14, 5);
      g.lineStyle(1, stroke, 0.6);
      g.strokeEllipse(cx, size * 0.27, 20, 11);
      break;

    case 'undercut':
      g.fillEllipse(cx, size * 0.24, 17, 8);
      g.fillTriangle(cx - 9, size * 0.26, cx + 2, size * 0.2, cx - 9, size * 0.32);
      g.fillStyle(light, 0.55);
      g.fillEllipse(cx - 2, size * 0.21, 8, 3.5);
      g.fillStyle(dark, 0.45);
      g.fillEllipse(cx, size * 0.27, 14, 4);
      g.lineStyle(1, stroke, 0.65);
      g.strokeEllipse(cx, size * 0.24, 17, 8);
      break;

    case 'curly':
      [[-8, 0.26, 6], [0, 0.22, 7], [8, 0.26, 6], [-4, 0.32, 5.5], [4, 0.32, 5.5]].forEach(([dx, fy, r]) => {
        g.fillStyle(hairColor, 1);
        g.fillCircle(cx + dx, size * fy, r);
        g.fillStyle(dark, 0.4);
        g.fillCircle(cx + dx + r * 0.3, size * fy + r * 0.3, r * 0.7);
        g.fillStyle(light, 0.6);
        g.fillCircle(cx + dx - r * 0.35, size * fy - r * 0.35, r * 0.35);
        g.lineStyle(0.7, stroke, 0.5);
        g.strokeCircle(cx + dx, size * fy, r);
      });
      break;

    case 'afro':
    case 'afro-puff': {
      const r = 13;
      g.fillStyle(hairColor, 1);
      g.fillCircle(cx, size * 0.27, r);
      g.fillStyle(dark, 0.35);
      g.fillCircle(cx, size * 0.27 + r * 0.35, r * 0.75);
      g.fillStyle(light, 0.35);
      g.fillCircle(cx - r * 0.35, size * 0.27 - r * 0.4, r * 0.4);
      // Fuzzy edge texture: a ring of tiny bumps around the silhouette.
      g.fillStyle(hairColor, 1);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        g.fillCircle(cx + Math.cos(a) * r * 0.92, size * 0.27 + Math.sin(a) * r * 0.92, r * 0.22);
      }
      g.lineStyle(0.8, stroke, 0.5);
      g.strokeCircle(cx, size * 0.27, r);
      break;
    }

    case 'man-bun':
      g.fillEllipse(cx, size * 0.27, 20, 11);
      g.fillCircle(cx, size * 0.14, 5);
      g.fillStyle(dark, 0.45);
      g.fillEllipse(cx, size * 0.31, 17, 5);
      g.fillCircle(cx + 1.5, size * 0.16, 2.5);
      g.fillStyle(light, 0.55);
      g.fillEllipse(cx - 5, size * 0.22, 6, 4);
      g.fillCircle(cx - 1.5, size * 0.12, 1.8);
      g.lineStyle(1, stroke, 0.6);
      g.strokeEllipse(cx, size * 0.27, 20, 11);
      g.strokeCircle(cx, size * 0.14, 5);
      drawStrands(g, cx, size * 0.23, 16, 2, light);
      break;

    case 'long':
      g.fillEllipse(cx, size * 0.27, 21, 13);
      g.fillEllipse(cx - 9, size * 0.42, 5, 10);
      g.fillEllipse(cx + 9, size * 0.42, 5, 10);
      g.fillStyle(dark, 0.4);
      g.fillEllipse(cx, size * 0.33, 18, 6);
      g.fillEllipse(cx - 9, size * 0.48, 3.5, 6);
      g.fillEllipse(cx + 9, size * 0.48, 3.5, 6);
      g.fillStyle(light, 0.5);
      g.fillEllipse(cx - 5, size * 0.21, 6, 4);
      g.lineStyle(1, stroke, 0.55);
      g.strokeEllipse(cx, size * 0.27, 21, 13);
      drawStrands(g, cx, size * 0.22, 18, 3, light);
      break;

    case 'ponytail':
      g.fillEllipse(cx, size * 0.28, 20, 12);
      g.fillEllipse(cx + 10, size * 0.36, 4, 9);
      g.fillStyle(dark, 0.4);
      g.fillEllipse(cx, size * 0.33, 17, 5);
      g.fillEllipse(cx + 10, size * 0.41, 3, 5);
      g.fillStyle(light, 0.5);
      g.fillEllipse(cx - 5, size * 0.22, 6, 4);
      g.lineStyle(1, stroke, 0.6);
      g.strokeEllipse(cx, size * 0.28, 20, 12);
      drawStrands(g, cx, size * 0.23, 16, 2, light);
      break;

    case 'high-ponytail':
      g.fillEllipse(cx, size * 0.28, 20, 12);
      g.fillEllipse(cx + 3, size * 0.16, 4, 8);
      g.fillStyle(dark, 0.4);
      g.fillEllipse(cx, size * 0.33, 17, 5);
      g.fillEllipse(cx + 3, size * 0.19, 3, 5);
      g.fillStyle(light, 0.5);
      g.fillEllipse(cx - 5, size * 0.22, 6, 4);
      g.lineStyle(1, stroke, 0.6);
      g.strokeEllipse(cx, size * 0.28, 20, 12);
      break;

    case 'bob':
      g.fillEllipse(cx, size * 0.29, 21, 14);
      g.fillRoundedRect(cx - 11, size * 0.29, 22, 8, 3);
      g.fillStyle(dark, 0.4);
      g.fillRoundedRect(cx - 11, size * 0.33, 22, 4, 2);
      g.fillStyle(light, 0.5);
      g.fillEllipse(cx - 6, size * 0.22, 7, 5);
      g.lineStyle(1, stroke, 0.55);
      g.strokeEllipse(cx, size * 0.29, 21, 14);
      g.strokeRoundedRect(cx - 11, size * 0.29, 22, 8, 3);
      drawStrands(g, cx, size * 0.24, 18, 2, light);
      break;

    case 'pigtails':
      g.fillEllipse(cx, size * 0.28, 20, 12);
      g.fillEllipse(cx - 12, size * 0.4, 4, 9);
      g.fillEllipse(cx + 12, size * 0.4, 4, 9);
      g.fillStyle(dark, 0.4);
      g.fillEllipse(cx, size * 0.33, 17, 5);
      g.fillEllipse(cx - 12, size * 0.45, 3, 5);
      g.fillEllipse(cx + 12, size * 0.45, 3, 5);
      g.fillStyle(light, 0.5);
      g.fillEllipse(cx - 5, size * 0.22, 6, 4);
      g.lineStyle(1, stroke, 0.6);
      g.strokeEllipse(cx, size * 0.28, 20, 12);
      break;

    case 'bun':
      g.fillEllipse(cx, size * 0.28, 20, 12);
      g.fillCircle(cx, size * 0.16, 6);
      g.fillStyle(dark, 0.4);
      g.fillEllipse(cx, size * 0.33, 17, 5);
      g.fillCircle(cx + 1.5, size * 0.18, 3);
      g.fillStyle(light, 0.5);
      g.fillEllipse(cx - 5, size * 0.22, 6, 4);
      g.fillCircle(cx - 2, size * 0.13, 2);
      g.lineStyle(1, stroke, 0.6);
      g.strokeEllipse(cx, size * 0.28, 20, 12);
      g.strokeCircle(cx, size * 0.16, 6);
      break;

    case 'braid':
      g.fillEllipse(cx, size * 0.28, 20, 12);
      g.fillRoundedRect(cx + 7, size * 0.36, 4, 12, 2);
      g.fillStyle(dark, 0.4);
      g.fillEllipse(cx, size * 0.33, 17, 5);
      // Braid crossover pattern.
      g.lineStyle(0.9, dark, 0.7);
      for (let i = 0; i < 3; i++) {
        const y = size * 0.38 + i * 3.4;
        g.beginPath();
        g.moveTo(cx + 7, y);
        g.lineTo(cx + 11, y + 1.7);
        g.strokePath();
      }
      g.fillStyle(light, 0.5);
      g.fillEllipse(cx - 5, size * 0.22, 6, 4);
      g.lineStyle(1, stroke, 0.6);
      g.strokeEllipse(cx, size * 0.28, 20, 12);
      g.strokeRoundedRect(cx + 7, size * 0.36, 4, 12, 2);
      break;

    case 'curly-long':
      [[-9, 0.28, 6], [0, 0.22, 7], [9, 0.28, 6], [-10, 0.4, 5], [10, 0.4, 5]].forEach(([dx, fy, r]) => {
        g.fillStyle(hairColor, 1);
        g.fillCircle(cx + dx, size * fy, r);
        g.fillStyle(dark, 0.35);
        g.fillCircle(cx + dx + r * 0.3, size * fy + r * 0.3, r * 0.65);
        g.fillStyle(light, 0.55);
        g.fillCircle(cx + dx - r * 0.35, size * fy - r * 0.35, r * 0.35);
        g.lineStyle(0.7, stroke, 0.5);
        g.strokeCircle(cx + dx, size * fy, r);
      });
      break;

    case 'wavy':
      g.fillEllipse(cx, size * 0.27, 21, 13);
      g.fillEllipse(cx - 10, size * 0.38, 5, 9);
      g.fillEllipse(cx + 10, size * 0.44, 5, 9);
      g.fillStyle(dark, 0.4);
      g.fillEllipse(cx, size * 0.33, 18, 6);
      g.fillStyle(light, 0.5);
      g.fillEllipse(cx - 5, size * 0.21, 6, 4);
      g.lineStyle(0.9, light, 0.5);
      for (let i = 0; i < 3; i++) {
        const y = size * (0.36 + i * 0.06);
        g.beginPath();
        g.moveTo(cx - 11 + (i % 2) * 3, y);
        g.lineTo(cx - 4 - (i % 2) * 3, y + 2);
        g.strokePath();
      }
      g.lineStyle(1, stroke, 0.55);
      g.strokeEllipse(cx, size * 0.27, 21, 13);
      break;

    case 'pixie':
      g.fillEllipse(cx, size * 0.26, 18, 10);
      g.fillStyle(dark, 0.4);
      g.fillEllipse(cx, size * 0.3, 15, 5);
      g.fillStyle(light, 0.55);
      g.fillEllipse(cx - 5, size * 0.21, 6, 4);
      g.lineStyle(1, stroke, 0.65);
      g.strokeEllipse(cx, size * 0.26, 18, 10);
      drawStrands(g, cx, size * 0.22, 14, 2, light);
      break;

    case 'side-swept':
      g.fillEllipse(cx, size * 0.27, 20, 12);
      g.fillTriangle(cx - 9, size * 0.24, cx + 6, size * 0.18, cx - 2, size * 0.32);
      g.fillStyle(light, 0.55);
      g.beginPath();
      g.moveTo(cx - 7, size * 0.22);
      g.lineTo(cx + 4, size * 0.19);
      g.lineTo(cx - 3, size * 0.27);
      g.closePath();
      g.fillPath();
      g.fillStyle(dark, 0.4);
      g.fillEllipse(cx + 2, size * 0.33, 15, 5);
      g.lineStyle(1, stroke, 0.6);
      g.strokeEllipse(cx, size * 0.27, 20, 12);
      break;

    case 'short':
    default:
      g.fillEllipse(cx, size * 0.28, 20, 12);
      g.fillStyle(dark, 0.45);
      g.fillEllipse(cx, size * 0.32, 17, 5);
      g.fillStyle(light, 0.5);
      g.fillEllipse(cx - 5, size * 0.22, 7, 4.5);
      g.lineStyle(1, stroke, 0.6);
      g.strokeEllipse(cx, size * 0.28, 20, 12);
      drawStrands(g, cx, size * 0.23, 16, 2, light);
      break;
  }
}
