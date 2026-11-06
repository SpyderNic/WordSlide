import Phaser from 'phaser';

/**
 * The top bar's icons (M07-02, R12 and R14), drawn from lines like the hint icons, as placeholders.
 * Each is drawn around (x, y), about `size` across.
 */

function outline(scene: Phaser.Scene, points: [number, number][], colour: number, width: number) {
  const graphics = scene.add.graphics();
  graphics.lineStyle(width, colour);
  graphics.beginPath();
  points.forEach(([px, py], index) => (index === 0 ? graphics.moveTo(px, py) : graphics.lineTo(px, py)));
  graphics.lineTo(points[0][0], points[0][1]);
  graphics.strokePath();
  return graphics;
}

export function drawHouse(scene: Phaser.Scene, x: number, y: number, size: number, colour: number) {
  const h = size / 2;
  return outline(scene, [[x - h, y - h * 0.1], [x, y - h], [x + h, y - h * 0.1], [x + h * 0.7, y - h * 0.1], [x + h * 0.7, y + h], [x - h * 0.7, y + h], [x - h * 0.7, y - h * 0.1]], colour, Math.max(2, size * 0.08));
}

/** A cog: a ring of eight teeth. */
export function drawCog(scene: Phaser.Scene, x: number, y: number, size: number, colour: number) {
  const points: [number, number][] = [];
  for (let tooth = 0; tooth < 8; tooth++) {
    for (const [angle, radius] of [[-0.18, 0.5], [0.18, 0.5], [0.3, 0.34], [0.6, 0.34]] as const) {
      const a = ((tooth + angle) / 8) * Math.PI * 2;
      points.push([x + Math.cos(a) * size * radius, y + Math.sin(a) * size * radius]);
    }
  }
  return outline(scene, points, colour, Math.max(2, size * 0.07));
}

/** A coin: an octagon of eight lines. */
export function drawCoin(scene: Phaser.Scene, x: number, y: number, size: number, colour: number) {
  const points: [number, number][] = [];
  for (let side = 0; side < 8; side++) {
    const a = ((side + 0.5) / 8) * Math.PI * 2;
    points.push([x + Math.cos(a) * size / 2, y + Math.sin(a) * size / 2]);
  }
  return outline(scene, points, colour, Math.max(2, size * 0.16));
}

/** A video: a frame of four lines with a play triangle inside. */
export function drawVideo(scene: Phaser.Scene, x: number, y: number, size: number, colour: number) {
  const w = size / 2;
  const h = size * 0.36;
  const graphics = outline(scene, [[x - w, y - h], [x + w, y - h], [x + w, y + h], [x - w, y + h]], colour, Math.max(2, size * 0.08));
  graphics.fillStyle(colour);
  graphics.fillTriangle(x - w * 0.3, y - h * 0.5, x - w * 0.3, y + h * 0.5, x + w * 0.4, y);
  return graphics;
}
