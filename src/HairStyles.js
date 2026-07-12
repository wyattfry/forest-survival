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

export function drawHairShape(g, style, cx, size, hairColor) {
  hairColor = hairColor || 0x3a2a1e;
  g.fillStyle(hairColor, 1);

  switch (style) {
    case 'bald':
      // No hair drawn; scalp shows through.
      break;

    case 'buzz':
      g.fillEllipse(cx, size * 0.29, 19, 9);
      break;

    case 'crew':
      g.fillEllipse(cx, size * 0.28, 20, 10);
      break;

    case 'spiky':
      g.fillEllipse(cx, size * 0.29, 19, 10);
      for (let i = -2; i <= 2; i++) {
        g.fillTriangle(
          cx + i * 4 - 2, size * 0.25,
          cx + i * 4 + 2, size * 0.25,
          cx + i * 4, size * 0.14
        );
      }
      break;

    case 'messy':
      g.fillEllipse(cx, size * 0.27, 21, 12);
      g.fillEllipse(cx - 8, size * 0.19, 6, 6);
      g.fillEllipse(cx + 6, size * 0.18, 7, 7);
      g.fillEllipse(cx + 1, size * 0.16, 6, 6);
      break;

    case 'mohawk':
      g.fillEllipse(cx, size * 0.31, 19, 7);
      g.fillRoundedRect(cx - 2.5, size * 0.1, 5, size * 0.22, 2);
      break;

    case 'fauxhawk':
      g.fillEllipse(cx, size * 0.29, 20, 9);
      g.fillRoundedRect(cx - 3.5, size * 0.16, 7, size * 0.16, 2);
      break;

    case 'slick':
      g.fillEllipse(cx, size * 0.27, 20, 11);
      g.fillTriangle(cx - 10, size * 0.28, cx - 2, size * 0.22, cx - 10, size * 0.34);
      break;

    case 'undercut':
      g.fillEllipse(cx, size * 0.24, 17, 8);
      g.fillTriangle(cx - 9, size * 0.26, cx + 2, size * 0.2, cx - 9, size * 0.32);
      break;

    case 'curly':
      g.fillCircle(cx - 8, size * 0.26, 6);
      g.fillCircle(cx, size * 0.22, 7);
      g.fillCircle(cx + 8, size * 0.26, 6);
      g.fillCircle(cx - 4, size * 0.32, 5.5);
      g.fillCircle(cx + 4, size * 0.32, 5.5);
      break;

    case 'afro':
    case 'afro-puff':
      g.fillCircle(cx, size * 0.27, 13);
      break;

    case 'man-bun':
      g.fillEllipse(cx, size * 0.27, 20, 11);
      g.fillCircle(cx, size * 0.14, 5);
      break;

    case 'long':
      g.fillEllipse(cx, size * 0.27, 21, 13);
      g.fillEllipse(cx - 9, size * 0.42, 5, 10);
      g.fillEllipse(cx + 9, size * 0.42, 5, 10);
      break;

    case 'ponytail':
      g.fillEllipse(cx, size * 0.28, 20, 12);
      g.fillEllipse(cx + 10, size * 0.36, 4, 9);
      break;

    case 'high-ponytail':
      g.fillEllipse(cx, size * 0.28, 20, 12);
      g.fillEllipse(cx + 3, size * 0.16, 4, 8);
      break;

    case 'bob':
      g.fillEllipse(cx, size * 0.29, 21, 14);
      g.fillRoundedRect(cx - 11, size * 0.29, 22, 8, 3);
      break;

    case 'pigtails':
      g.fillEllipse(cx, size * 0.28, 20, 12);
      g.fillEllipse(cx - 12, size * 0.4, 4, 9);
      g.fillEllipse(cx + 12, size * 0.4, 4, 9);
      break;

    case 'bun':
      g.fillEllipse(cx, size * 0.28, 20, 12);
      g.fillCircle(cx, size * 0.16, 6);
      break;

    case 'braid':
      g.fillEllipse(cx, size * 0.28, 20, 12);
      g.fillRoundedRect(cx + 7, size * 0.36, 4, 12, 2);
      break;

    case 'curly-long':
      g.fillCircle(cx - 9, size * 0.28, 6);
      g.fillCircle(cx, size * 0.22, 7);
      g.fillCircle(cx + 9, size * 0.28, 6);
      g.fillCircle(cx - 10, size * 0.4, 5);
      g.fillCircle(cx + 10, size * 0.4, 5);
      break;

    case 'wavy':
      g.fillEllipse(cx, size * 0.27, 21, 13);
      g.fillEllipse(cx - 10, size * 0.38, 5, 9);
      g.fillEllipse(cx + 10, size * 0.44, 5, 9);
      break;

    case 'pixie':
      g.fillEllipse(cx, size * 0.26, 18, 10);
      break;

    case 'side-swept':
      g.fillEllipse(cx, size * 0.27, 20, 12);
      g.fillTriangle(cx - 9, size * 0.24, cx + 6, size * 0.18, cx - 2, size * 0.32);
      break;

    case 'short':
    default:
      g.fillEllipse(cx, size * 0.28, 20, 12);
      break;
  }
}
