import Phaser from 'phaser';
import type { Rect } from '../game/layout';
import { currentStyle } from '../style';
import { drawCoin, drawVideo } from './topIcons';

const colours = currentStyle.colours;
/** The ad button while it waits (M07-02, R13). */
export const AD_WAITING_ALPHA = 0.5;

/**
 * The ad button: its label, then a coin and a video icon, greyed out while the rewarded ad wait runs. One piece,
 * used in the top bar and in "Not enough coins", and later in a shop (M07-02, R13; M07-03, R9).
 */
export function drawAdButton(
  scene: Phaser.Scene,
  rect: Rect,
  label: string,
  ready: boolean,
  fontSize: number,
  depth = 0,
  /** On a panel of the same colour, as in "Not enough coins", an outline shows it as a button. */
  outline = false,
): Phaser.GameObjects.GameObject[] {
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  const icon = Math.min(rect.height * 0.35, rect.width * 0.2);
  const iconsWidth = icon * 2.6;
  const textX = rect.x + (rect.width - iconsWidth) / 2;
  const parts: Phaser.GameObjects.GameObject[] = [
    scene.add.rectangle(x, y, rect.width, rect.height, colours.tile).setDepth(depth),
    scene.add
      .text(textX, y, label, { fontFamily: currentStyle.font, fontSize: `${Math.round(fontSize)}px`, color: `#${colours.text.toString(16).padStart(6, '0')}` })
      .setOrigin(0.5)
      .setDepth(depth),
    drawCoin(scene, rect.x + rect.width - iconsWidth + icon * 0.5, y, icon, colours.tileGold).setDepth(depth),
    drawVideo(scene, rect.x + rect.width - icon * 0.9, y, icon, colours.text).setDepth(depth),
  ];
  if (outline) (parts[0] as Phaser.GameObjects.Rectangle).setStrokeStyle(3, colours.text);
  if (!ready) parts.forEach((part) => (part as unknown as Phaser.GameObjects.Components.Alpha).setAlpha(AD_WAITING_ALPHA));
  return parts;
}
