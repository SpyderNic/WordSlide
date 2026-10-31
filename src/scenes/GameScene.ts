import Phaser from 'phaser';
import { layoutLevel, type CellView, type LevelLayout, type PoolTileView, type TopItem } from '../game/layout';
import type { Level } from '../game/level';
import { testLevels } from '../levels/testLevels';
import { currentStyle } from '../style';

const colours = currentStyle.colours;

function hex(colour: number): string {
  return `#${colour.toString(16).padStart(6, '0')}`;
}

function firstLevelNumber(): number {
  const requested = Number(new URLSearchParams(window.location.search).get('level'));
  return requested >= 1 && requested <= testLevels.length ? requested : 1;
}

export class GameScene extends Phaser.Scene {
  private level!: Level;
  private levelNumber = 1;
  private points = 0;
  private layoutNow!: LevelLayout;
  private drawn: Phaser.GameObjects.GameObject[] = [];
  private countPositions: { x: number; y: number }[] = [];

  constructor() {
    super('GameScene');
  }

  create() {
    this.levelNumber = firstLevelNumber();
    this.show(testLevels[this.levelNumber - 1], this.levelNumber, 0);
    this.scale.on(Phaser.Scale.Events.RESIZE, () => this.redraw());

    if (import.meta.env.DEV) {
      Object.assign(window, {
        wordSlide: {
          show: (level: Level, levelNumber = 1, points = 0) => this.show(level, levelNumber, points),
          view: () => ({ layout: this.layoutNow, level: this.level, colours }),
          countPositions: () => this.countPositions,
        },
        wordSlideReady: true,
      });
    }
  }

  private show(level: Level, levelNumber: number, points: number) {
    this.level = level;
    this.levelNumber = levelNumber;
    this.points = points;
    this.redraw();
  }

  private redraw() {
    this.drawn.forEach((object) => object.destroy());
    this.drawn = [];
    this.countPositions = [];
    this.layoutNow =layoutLevel(this.level, this.levelNumber, this.points, this.scale.width, this.scale.height);

    this.layoutNow.topItems.forEach((item) => this.drawTopItem(item));
    this.layoutNow.rows.forEach((row) => row.cells.forEach((cell) => this.drawCell(cell)));
    this.layoutNow.poolTiles.forEach((tile) => this.drawPoolTile(tile));
  }

  private keep<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.drawn.push(object);
    return object;
  }

  private drawText(text: string, x: number, y: number, size: number, colour: number) {
    return this.keep(
      this.add
        .text(x, y, text, { fontFamily: currentStyle.font, fontSize: `${Math.round(size)}px`, color: hex(colour) })
        .setOrigin(0.5),
    );
  }

  private drawTopItem(item: TopItem) {
    const size = this.layoutNow.tileSize * 0.42;
    const centreX = item.x + item.width / 2;
    const centreY = item.y + item.height / 2;
    if (item.isButton) {
      // The buttons do nothing yet (D30).
      this.keep(this.add.rectangle(centreX, centreY, item.width, item.height, colours.tile).setInteractive());
    }
    this.drawText(item.text, centreX, centreY, size, item.isButton ? colours.text : colours.highlight);
  }

  private drawCell({ cell, x, y, width, height }: CellView) {
    const centreX = x + width / 2;
    const centreY = y + height / 2;
    if (cell.kind === 'special') {
      this.drawText(cell.character, centreX, centreY, height * 0.6, colours.highlight);
      return;
    }
    if (cell.kind === 'revealed') {
      this.keep(this.add.rectangle(centreX, centreY, width, height, colours.tileRevealed));
      this.drawText(cell.character, centreX, centreY, height * 0.6, colours.highlight);
      return;
    }
    this.keep(this.add.rectangle(centreX, centreY, width, height).setStrokeStyle(2, colours.column));
  }

  private drawPoolTile({ character, count, x, y, width, height }: PoolTileView) {
    const colour = count === 0 ? colours.tileGrey : colours.tile;
    this.keep(this.add.rectangle(x + width / 2, y + height / 2, width, height, colour));
    this.drawText(character, x + width / 2, y + height * 0.45, height * 0.55, colours.text);
    const position = { x: x + width * 0.78, y: y + height * 0.82 };
    this.countPositions.push(position);
    this.drawText(`x${count}`, position.x, position.y, height * 0.26, colours.text);
  }
}
