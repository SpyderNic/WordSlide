import Phaser from 'phaser';
import type { Rect } from '../game/layout';
import { currentStyle } from '../style';
import { makeTile } from './tiles';

const colours = currentStyle.colours;
export const POPUP_DEPTH = 30;

function hex(colour: number): string {
  return `#${colour.toString(16).padStart(6, '0')}`;
}

export interface PopupContent {
  title: string;
  /** The golden word, if any. */
  word: string[];
  /** The button's text. The last level's popup has none (story 11, R11). */
  button: string | null;
}

/** The popup in the centre of the screen (D41). */
export function buildPopup(scene: Phaser.Scene, tile: number, content: PopupContent) {
  const { width, height } = scene.scale;
  const size = Math.min(tile, 46);
  const { word, button } = content;
  const panelWidth = Math.max(word.length * size * 1.1 + size * 2, size * 8);
  const panelHeight = size * 5.6;
  const children: Phaser.GameObjects.GameObject[] = [scene.add.rectangle(0, 0, panelWidth, panelHeight, colours.tile)];
  const addText = (text: string, y: number, fontSize: number, colour: number) =>
    children.push(
      scene.add
        .text(0, y, text, { fontFamily: currentStyle.font, fontSize: `${Math.round(fontSize)}px`, color: hex(colour) })
        .setOrigin(0.5),
    );
  addText(content.title, -size * 1.9, size * 0.7, colours.text);
  word.forEach((letter, index) => {
    const x = (index - (word.length - 1) / 2) * size * 1.1;
    children.push(makeTile(scene, x, -size * 0.4, size, colours.tileGold));
    children.push(
      scene.add
        .text(x, -size * 0.4, letter, { fontFamily: currentStyle.font, fontSize: `${Math.round(size * 0.6)}px`, color: hex(colours.text) })
        .setOrigin(0.5),
    );
  });

  let buttonRect: Rect | null = null;
  if (button) {
    const buttonWidth = size * 5.2;
    const buttonHeight = size * 1.2;
    children.push(scene.add.rectangle(0, size * 1.6, buttonWidth, buttonHeight, colours.background));
    addText(button, size * 1.6, size * 0.55, colours.highlight);
    buttonRect = { x: width / 2 - buttonWidth / 2, y: height / 2 + size * 1.6 - buttonHeight / 2, width: buttonWidth, height: buttonHeight };
  }

  const container = scene.add.container(width / 2, height / 2, children).setDepth(POPUP_DEPTH);
  return { container, buttonRect };
}
