import Phaser from 'phaser';
import { currentStyle } from '../style';
import { hex } from './tiles';

const colours = currentStyle.colours;
/** The hand sits above the board and popups' parts below; its fingertip is at its position. */
export const HAND_DEPTH = 25;
export const TEXT_DEPTH = 22;

export interface Point {
  x: number;
  y: number;
}

/** A simple pointing hand, drawn in code (story 12, Q9). Its fingertip is at (0, 0). */
export function makeHand(scene: Phaser.Scene, size: number) {
  const s = size / 40;
  const hand = scene.add.graphics();
  hand.lineStyle(2, colours.text, 1).fillStyle(colours.highlight, 1);
  // The pointing finger, with a rounded-looking tip, then the palm with lines between its folded fingers.
  hand.fillTriangle(-4 * s, 4 * s, 4 * s, 4 * s, 0, 0);
  hand.fillRect(-4 * s, 4 * s, 8 * s, 18 * s).strokeRect(-4 * s, 4 * s, 8 * s, 18 * s);
  hand.fillRect(-9 * s, 16 * s, 24 * s, 22 * s).strokeRect(-9 * s, 16 * s, 24 * s, 22 * s);
  for (const x of [4, 9]) hand.lineBetween(x * s, 18 * s, x * s, 28 * s);
  return scene.add.container(0, 0, [hand]).setDepth(HAND_DEPTH);
}

/** The hand glides from one point to another, pauses, and starts again, until its step is done (story 12, R9). */
export function moveHand(scene: Phaser.Scene, hand: Phaser.GameObjects.Container, from: Point, to: Point) {
  scene.tweens.killTweensOf(hand);
  hand.setPosition(from.x, from.y).setAlpha(1);
  scene.tweens.add({
    targets: hand,
    x: to.x,
    y: to.y,
    duration: currentStyle.timings.handMove,
    ease: 'Sine.easeInOut',
    hold: currentStyle.timings.handPause / 2,
    repeatDelay: currentStyle.timings.handPause / 2,
    repeat: -1,
  });
}

/** The tutorial's text, or level 2's tip: above the rows, below the theme (story 12, R8). */
export function makeGuideText(scene: Phaser.Scene, text: string, x: number, y: number, size: number, width: number) {
  return scene.add
    .text(x, y, text, {
      fontFamily: currentStyle.font,
      fontSize: `${Math.round(Math.max(size, currentStyle.minText))}px`,
      color: hex(colours.highlight),
      align: 'center',
      wordWrap: { width },
    })
    .setOrigin(0.5)
    .setDepth(TEXT_DEPTH);
}
