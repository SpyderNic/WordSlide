import Phaser from 'phaser';
import type { Rect } from '../game/layout';
import { currentStyle } from '../style';

const colours = currentStyle.colours;

export type HintName = 'letter' | 'ordering' | 'reveal';

/** A hint's button on screen, for tests too. */
export interface HintButton {
  name: HintName;
  rect: Rect;
  enabled: boolean;
}

/**
 * Draws a hint's button with its icon: placeholders drawn in code, which the designer can replace (story 19, Q1).
 * A lightbulb for the Letter hint, arrows up and down for the Ordering hint, and an eye for the Reveal hint.
 */
export function drawHintButton(scene: Phaser.Scene, { name, rect, enabled }: HintButton, depth = 0): Phaser.GameObjects.GameObject[] {
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  const size = Math.min(rect.width, rect.height);
  const background = scene.add.rectangle(x, y, rect.width, rect.height, enabled ? colours.tile : colours.tileGrey).setDepth(depth);
  const icon = scene.add.graphics({ lineStyle: { width: 3, color: colours.text } }).setDepth(depth);
  // Drawn from straight lines, so every icon is easy to draw again in another style.
  const outline = (points: [number, number][]) => points.forEach(([px, py], index) => {
    const [nx, ny] = points[(index + 1) % points.length];
    icon.lineBetween(x + px * size, y + py * size, x + nx * size, y + ny * size);
  });
  const parts: Phaser.GameObjects.GameObject[] = [background, icon];
  if (name === 'letter') {
    // A bulb, as an octagon, over its base.
    outline([[-0.08, -0.3], [0.08, -0.3], [0.2, -0.18], [0.2, -0.02], [0.08, 0.12], [-0.08, 0.12], [-0.2, -0.02], [-0.2, -0.18]]);
    icon.lineBetween(x - size * 0.09, y + size * 0.2, x + size * 0.09, y + size * 0.2);
    icon.lineBetween(x - size * 0.06, y + size * 0.28, x + size * 0.06, y + size * 0.28);
  } else if (name === 'ordering') {
    const half = size * 0.16;
    icon.lineBetween(x, y - size * 0.3, x, y + size * 0.3);
    icon.lineBetween(x - half, y - size * 0.3 + half, x, y - size * 0.3);
    icon.lineBetween(x + half, y - size * 0.3 + half, x, y - size * 0.3);
    icon.lineBetween(x - half, y + size * 0.3 - half, x, y + size * 0.3);
    icon.lineBetween(x + half, y + size * 0.3 - half, x, y + size * 0.3);
  } else {
    // An eye: an almond outline and a square pupil.
    outline([[-0.3, 0], [-0.15, -0.14], [0.15, -0.14], [0.3, 0], [0.15, 0.14], [-0.15, 0.14]]);
    parts.push(scene.add.rectangle(x, y, size * 0.14, size * 0.14, colours.text).setDepth(depth));
  }
  return parts;
}

export function isInside(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}
