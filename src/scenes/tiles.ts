import Phaser from 'phaser';
import { currentStyle } from '../style';

const colours = currentStyle.colours;

export function hex(colour: number): string {
  return `#${colour.toString(16).padStart(6, '0')}`;
}

function shade(colour: number, amount: number): number {
  const base = Phaser.Display.Color.IntegerToColor(colour);
  return (amount > 0 ? base.clone().lighten(amount) : base.clone().darken(-amount)).color;
}

/**
 * A wooden tile with a soft bevel: lighter top and left edges, darker bottom and right edges, so it looks raised (story 16, R8).
 * Its parts sit around its centre, so it grows and shakes as one block.
 */
export function makeTile(scene: Phaser.Scene, x: number, y: number, size: number, fill: number, letter?: { text: string; colour: number }) {
  const body = scene.add.rectangle(0, 0, size, size, fill);
  // Named, so tests can tell the edges from the tile itself.
  const top = scene.add.rectangle(0, 0, size, 1, fill).setName('bevel');
  const bottom = scene.add.rectangle(0, 0, size, 1, fill).setName('bevel');
  const left = scene.add.rectangle(0, 0, 1, size, fill).setName('bevel');
  const right = scene.add.rectangle(0, 0, 1, size, fill).setName('bevel');
  const children: Phaser.GameObjects.GameObject[] = [body, top, bottom, left, right];
  if (letter) {
    children.push(
      scene.add
        .text(0, 0, letter.text, { fontFamily: currentStyle.font, fontSize: `${Math.round(size * 0.6)}px`, color: hex(letter.colour) })
        .setOrigin(0.5),
    );
  }
  const tile = scene.add.container(x, y, children);
  sizeTile(tile, size);
  paintTile(tile, fill);
  return tile;
}

export function tileBody(tile: Phaser.GameObjects.Container) {
  return tile.list[0] as Phaser.GameObjects.Rectangle;
}

export function tileLetter(tile: Phaser.GameObjects.Container) {
  return tile.list[5] as Phaser.GameObjects.Text | undefined;
}

export function paintTile(tile: Phaser.GameObjects.Container, fill: number) {
  const [body, top, bottom, left, right] = tile.list as Phaser.GameObjects.Rectangle[];
  body.setFillStyle(fill);
  for (const edge of [top, left]) edge.setFillStyle(shade(fill, currentStyle.bevel.light));
  for (const edge of [bottom, right]) edge.setFillStyle(shade(fill, -currentStyle.bevel.dark));
}

export function sizeTile(tile: Phaser.GameObjects.Container, size: number) {
  const [body, top, bottom, left, right] = tile.list as Phaser.GameObjects.Rectangle[];
  const edge = Math.max(1, Math.round(size * currentStyle.bevel.edge));
  body.setSize(size, size);
  top.setSize(size, edge).setY(-size / 2 + edge / 2);
  bottom.setSize(size, edge).setY(size / 2 - edge / 2);
  // The sides stop short of the top and bottom edges, so the corners don't double up.
  left.setSize(edge, size - edge * 2).setX(-size / 2 + edge / 2);
  right.setSize(edge, size - edge * 2).setX(size / 2 - edge / 2);
  tileLetter(tile)?.setFontSize(Math.round(size * 0.6));
}

export { colours };
