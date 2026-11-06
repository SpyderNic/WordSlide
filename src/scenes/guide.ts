import Phaser from 'phaser';
import { currentStyle } from '../style';
import { hex } from './tiles';
import pointerUrl from '../../assets/Pointer.png';

const HAND_KEY = 'pointer';

const colours = currentStyle.colours;
/** The hand sits above the board and popups' parts below; its fingertip is at its position. */
export const HAND_DEPTH = 25;
export const TEXT_DEPTH = 22;

export interface Point {
  x: number;
  y: number;
}

/** The designer's pointing hand. It's pixel art, so it's scaled without smoothing. */
export function loadHand(scene: Phaser.Scene) {
  scene.load.image(HAND_KEY, pointerUrl);
  scene.load.once(Phaser.Loader.Events.COMPLETE, () => scene.textures.get(HAND_KEY).setFilter(Phaser.Textures.FilterMode.NEAREST));
}

/** A pointing hand about a tile tall (M05-03, Q9). Its fingertip is at (0, 0). */
export function makeHand(scene: Phaser.Scene, size: number) {
  // In the 128-pixel image, the fingertip is at (64, 8) and the hand is 112 pixels tall.
  const hand = scene.add.image(0, 0, HAND_KEY).setOrigin(64 / 128, 8 / 128).setScale(size / 112);
  return scene.add.container(0, 0, [hand]).setDepth(HAND_DEPTH);
}

/** The hand glides from one point to another, pauses, and starts again, until its step is done (M05-03, R9). */
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

/** The tutorial's text, or level 2's tip: above the rows, below the theme (M05-03, R8). */
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
