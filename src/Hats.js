export const HAT_STYLES = [
  { id: 'cap', label: 'Cap' },
  { id: 'crown', label: 'Crown' },
  { id: 'cowboy', label: 'Cowboy' },
  { id: 'top-hat', label: 'Top Hat' },
  { id: 'wizard', label: 'Wizard' },
  { id: 'beanie', label: 'Beanie' },
  { id: 'party', label: 'Party' },
  { id: 'halo', label: 'Halo' },
  { id: 'viking', label: 'Viking' },
  { id: 'pirate', label: 'Pirate' }
];

export function drawHatShape(g, style, cx, size) {
  const headTop = size * 0.12;
  const brimY = size * 0.23;

  switch (style) {
    case 'cap':
      g.fillStyle(0x2878d0, 1);
      g.fillRoundedRect(cx - 9, headTop, 17, 7, 4);
      g.fillStyle(0x174f91, 1);
      g.fillRect(cx + 2, brimY, 11, 2.5);
      break;
    case 'crown':
      g.fillStyle(0xffcc22, 1);
      g.fillTriangle(cx - 10, brimY + 2, cx - 10, 1, cx - 4, brimY - 3);
      g.fillTriangle(cx - 6, brimY + 2, cx, 0, cx + 5, brimY + 2);
      g.fillTriangle(cx + 4, brimY + 2, cx + 10, 1, cx + 10, brimY + 2);
      g.fillRect(cx - 10, brimY, 20, 4);
      break;
    case 'cowboy':
      g.fillStyle(0x8b572a, 1);
      g.fillRoundedRect(cx - 7, 2, 14, 9, 3);
      g.fillStyle(0x5e3519, 1);
      g.fillRoundedRect(cx - 14, brimY, 28, 4, 2);
      break;
    case 'top-hat':
      g.fillStyle(0x17171c, 1);
      g.fillRect(cx - 7, 0, 14, 10);
      g.fillRect(cx - 12, brimY, 24, 3);
      g.fillStyle(0xb02035, 1);
      g.fillRect(cx - 7, 7, 14, 3);
      break;
    case 'wizard':
      g.fillStyle(0x6539a8, 1);
      g.fillTriangle(cx - 10, brimY + 2, cx + 1, 0, cx + 9, brimY + 2);
      g.fillStyle(0x492278, 1);
      g.fillRoundedRect(cx - 13, brimY, 26, 4, 2);
      g.fillStyle(0xffdf55, 1);
      g.fillCircle(cx + 1, 5, 1.5);
      break;
    case 'beanie':
      g.fillStyle(0xe24747, 1);
      g.fillCircle(cx, 2, 2.5);
      g.fillStyle(0x3ba66b, 1);
      g.fillRoundedRect(cx - 9, 3, 18, 9, 5);
      g.fillStyle(0x27764a, 1);
      g.fillRect(cx - 10, brimY, 20, 3);
      break;
    case 'party':
      g.fillStyle(0xff4fa3, 1);
      g.fillTriangle(cx - 9, brimY + 2, cx + 1, 0, cx + 9, brimY + 2);
      g.fillStyle(0x48d9ff, 1);
      g.fillCircle(cx + 1, 1, 2);
      g.fillStyle(0xffed4a, 1);
      g.fillCircle(cx, 6, 1.5);
      break;
    case 'halo':
      g.lineStyle(2.5, 0xffe76a, 1);
      g.strokeEllipse(cx, 3, 21, 6);
      break;
    case 'viking':
      g.fillStyle(0x8a9099, 1);
      g.fillRoundedRect(cx - 9, 4, 18, 10, 5);
      g.fillStyle(0xe5d7b5, 1);
      g.fillTriangle(cx - 8, 8, cx - 15, 1, cx - 13, 10);
      g.fillTriangle(cx + 8, 8, cx + 15, 1, cx + 13, 10);
      break;
    case 'pirate':
      g.fillStyle(0x24222b, 1);
      g.fillEllipse(cx, 7, 25, 10);
      g.fillRect(cx - 10, 7, 20, 6);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(cx, 8, 1.7);
      break;
    default:
      break;
  }
}
