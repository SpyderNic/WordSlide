import Phaser from 'phaser';
import { Board, type BoardEvent } from '../game/board';
import { PhaseTwo } from '../game/phaseTwo';
import { hitTest, layoutLevel, type CellView, type Hit, type LevelLayout, type PoolTileView, type Rect, type TopItem } from '../game/layout';
import type { Level } from '../game/level';
import { startingLevelNumber } from '../game/startingLevel';
import { testLevels } from '../levels/testLevels';
import { currentStyle } from '../style';
import { PhaseTwoView } from './PhaseTwoView';

const colours = currentStyle.colours;
const timings = currentStyle.timings;
const PULSE_SCALE = 1.08;
const SHAKE_DISTANCE = 6;

interface Press {
  pointerId: number;
  x: number;
  y: number;
  hit: Hit;
  dragging: boolean;
  /** Nothing to pick up here, so moving doesn't start a drag. */
  dead: boolean;
}

function hex(colour: number): string {
  return `#${colour.toString(16).padStart(6, '0')}`;
}

function centre(rect: Rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

export class GameScene extends Phaser.Scene {
  private level!: Level;
  private board!: Board;
  private levelNumber = 1;
  private points = 0;
  private layoutNow!: LevelLayout;
  private drawn: Phaser.GameObjects.GameObject[] = [];
  private rowObjects = new Map<number, (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text)[]>();
  private press: Press | null = null;
  private dragTile: Phaser.GameObjects.Container | null = null;
  private highlight: Phaser.GameObjects.Rectangle | null = null;
  private highlighted: { kind: 'cell'; row: number; cell: number } | { kind: 'pool'; character: string } | null = null;
  private feedback: BoardEvent[] = [];
  private foundText: Phaser.GameObjects.Container | null = null;
  private poolObjects: Phaser.GameObjects.GameObject[] = [];
  private phaseTwo: PhaseTwoView | null = null;

  constructor() {
    super('GameScene');
  }

  create() {
    this.levelNumber = startingLevelNumber(window.location.search, testLevels.length, import.meta.env.DEV);
    this.show(testLevels[this.levelNumber - 1], this.levelNumber, 0);
    this.scale.on(Phaser.Scale.Events.RESIZE, () => this.onResize());

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => this.onPointerDown(pointer));
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => this.onPointerMove(pointer));
    this.input.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => this.onPointerUp(pointer));
    this.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, (pointer: Phaser.Input.Pointer) => this.onPointerUp(pointer));
    this.input.addPointer(1);
    // Straight from the browser: the engine's keyboard queue mishandles keys that land in one frame.
    window.addEventListener('keydown', (event) => this.onKey(event));

    if (import.meta.env.DEV) {
      Object.assign(window, {
        wordSlide: {
          scene: this,
          show: (level: Level, levelNumber = 1, points = 0) => this.show(level, levelNumber, points),
          view: () => this.testView(),
          place: (row: number, cell: number, character: string) => {
            this.board.pickUpFromPool(character);
            this.applied(this.board.dropOnCell(row, cell));
          },
          solve: () => this.solveForTests(),
          skipCeremony: () => this.phaseTwo?.skipCeremony(),
          arrange: (order: string[], cells: Record<string, number>) => this.phaseTwo?.arrange(order, cells),
          select: (row: number) => this.phaseTwo?.select(row),
        },
        wordSlideReady: true,
      });
    }
  }

  private testView() {
    const board = this.board;
    return {
      layout: this.layoutNow,
      level: this.level,
      colours,
      markedRow: board.markedRow,
      dragging: board.drag?.character ?? null,
      dragTile: this.dragTile ? { x: this.dragTile.x, y: this.dragTile.y } : null,
      highlighted: this.highlighted,
      feedback: this.feedback,
      foundText: this.foundText ? { y: this.foundText.y, alpha: this.foundText.alpha } : null,
      levelNumber: this.levelNumber,
      phaseTwo: this.phaseTwo?.testView() ?? null,
    };
  }

  private show(level: Level, levelNumber: number, points: number) {
    this.phaseTwo?.destroy();
    this.phaseTwo = null;
    this.level = level;
    this.board = new Board(level);
    this.levelNumber = levelNumber;
    this.points = points;
    this.feedback = [];
    this.redraw();
  }

  private onResize() {
    this.board.cancelDrag();
    this.endDragVisuals();
    this.press = null;
    if (this.phaseTwo) {
      this.phaseTwo.skipCeremony();
      this.phaseTwo.onResize();
      this.fadePoolNow();
    }
    this.redraw();
  }

  private fadePoolNow() {
    this.poolObjects.forEach((object) => {
      this.tweens.killTweensOf(object);
      object.destroy();
    });
    this.poolObjects = [];
  }

  // Drawing

  private redraw() {
    this.drawn.forEach((object) => {
      this.tweens.killTweensOf(object);
      object.destroy();
    });
    this.drawn = [];
    this.rowObjects.clear();
    this.layoutNow = layoutLevel(this.level, this.levelNumber, this.points, this.scale.width, this.scale.height, this.board);

    this.layoutNow.topItems.forEach((item) => this.drawTopItem(item));
    if (this.phaseTwo) return;

    this.fadePoolNow();
    this.drawSelection();
    this.layoutNow.rows.forEach((row, index) => row.cells.forEach((cell) => this.drawCell(cell, index, row.locked)));
    this.layoutNow.poolTiles.forEach((tile) => this.drawPoolTile(tile));
    this.drawRecall();
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
    const size = this.layoutNow.topTileSize * 0.42;
    const { x, y } = centre(item);
    if (item.isButton) {
      // The buttons do nothing yet (D30).
      this.keep(this.add.rectangle(x, y, item.width, item.height, colours.tile));
    }
    this.drawText(item.text, x, y, size, item.isButton ? colours.text : colours.highlight);
  }

  private drawSelection() {
    const row = this.board.markedRow;
    if (row === null) return;
    const { cells } = this.layoutNow.rows[row];
    const first = cells[0];
    const last = cells[cells.length - 1];
    const pad = first.height * 0.06;
    const width = last.x + last.width - first.x + pad * 2;
    const height = first.height + pad * 2;
    this.keep(
      this.add
        .rectangle(first.x - pad + width / 2, first.y - pad + height / 2, width, height)
        .setStrokeStyle(3, colours.highlight),
    );
  }

  private drawCell({ cell, x, y, width, height }: CellView, row: number, locked: boolean) {
    const cellCentre = centre({ x, y, width, height });
    const parts: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text)[] = [];
    if (cell.kind === 'special') {
      parts.push(this.drawText(cell.character, cellCentre.x, cellCentre.y, height * 0.6, locked ? colours.tileLocked : colours.highlight));
    } else if (cell.kind === 'empty') {
      parts.push(this.keep(this.add.rectangle(cellCentre.x, cellCentre.y, width, height).setStrokeStyle(2, colours.column)));
    } else {
      const fill = locked ? colours.tileLocked : cell.kind === 'revealed' ? colours.tileRevealed : colours.tilePlaced;
      const text = cell.kind === 'revealed' && !locked ? colours.highlight : colours.text;
      parts.push(this.keep(this.add.rectangle(cellCentre.x, cellCentre.y, width, height, fill)));
      parts.push(this.drawText(cell.character, cellCentre.x, cellCentre.y, height * 0.6, text));
    }
    this.rowObjects.set(row, [...(this.rowObjects.get(row) ?? []), ...parts]);
  }

  private drawPoolTile({ character, count, x, y, width, height }: PoolTileView) {
    const colour = count === 0 ? colours.tileGrey : colours.tile;
    this.poolObjects.push(this.add.rectangle(x + width / 2, y + height / 2, width, height, colour));
    this.poolObjects.push(this.drawPoolText(character, x + width / 2, y + height * 0.45, height * 0.55));
    this.poolObjects.push(this.drawPoolText(`x${count}`, x + width * 0.78, y + height * 0.82, height * 0.26));
  }

  private drawPoolText(text: string, x: number, y: number, size: number) {
    return this.add
      .text(x, y, text, { fontFamily: currentStyle.font, fontSize: `${Math.round(size)}px`, color: hex(colours.text) })
      .setOrigin(0.5);
  }

  private drawRecall() {
    const { recall } = this.layoutNow;
    const active = this.board.hasPlacedLetters();
    const { x, y } = centre(recall);
    this.poolObjects.push(this.add.rectangle(x, y, recall.width, recall.height, active ? colours.tile : colours.tileGrey));
    const arrows = this.add.graphics({ lineStyle: { width: 3, color: colours.text } });
    this.poolObjects.push(arrows);
    const half = recall.width * 0.22;
    for (const top of [y - recall.height * 0.2, y + recall.height * 0.02]) {
      arrows.lineBetween(x - half, top, x, top + half * 0.8);
      arrows.lineBetween(x, top + half * 0.8, x + half, top);
    }
  }

  // Input

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    if (this.phaseTwo) {
      this.phaseTwo.onPointerDown(pointer);
      return;
    }
    if (this.press) return;
    const hit = hitTest(this.layoutNow, pointer.x, pointer.y);
    this.press = { pointerId: pointer.id, x: pointer.x, y: pointer.y, hit, dragging: false, dead: false };
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (this.phaseTwo) {
      this.phaseTwo.onPointerMove(pointer);
      return;
    }
    const press = this.press;
    if (!press || press.pointerId !== pointer.id || press.dead) return;
    if (!press.dragging) {
      const moved = Phaser.Math.Distance.Between(press.x, press.y, pointer.x, pointer.y);
      if (moved < this.layoutNow.tileSize * 0.15) return;
      if (!this.startDrag(press)) {
        press.dead = true;
        return;
      }
    }
    this.dragTile?.setPosition(pointer.x, pointer.y);
    this.updateHighlight(pointer.x, pointer.y);
  }

  private startDrag(press: Press): boolean {
    const { hit } = press;
    let started = false;
    if (hit.kind === 'pool' && hit.character) started = this.board.pickUpFromPool(hit.character);
    if (hit.kind === 'cell') started = this.board.pickUpFromCell(hit.row, hit.cell);
    if (!started) return false;
    press.dragging = true;
    this.redraw();
    this.createDragTile(this.board.drag!.character);
    return true;
  }

  private createDragTile(character: string) {
    const size = this.layoutNow.tileSize;
    const tile = this.add.rectangle(0, 0, size, size, colours.tilePlaced);
    const text = this.add
      .text(0, 0, character, { fontFamily: currentStyle.font, fontSize: `${Math.round(size * 0.6)}px`, color: hex(colours.text) })
      .setOrigin(0.5);
    this.dragTile = this.add.container(0, 0, [tile, text]).setDepth(10);
  }

  private updateHighlight(x: number, y: number) {
    const hit = hitTest(this.layoutNow, x, y);
    const board = this.board;
    this.highlight?.destroy();
    this.highlight = null;
    this.highlighted = null;

    if (hit.kind === 'cell' && !board.isCellFixed(hit.row, hit.cell)) {
      this.highlighted = hit;
      this.drawHighlight(this.layoutNow.rows[hit.row].cells[hit.cell]);
    } else if (hit.kind === 'pool' && board.drag && board.drag.source !== 'pool') {
      const character = board.drag.character;
      const tile = this.layoutNow.poolTiles.find((candidate) => candidate.character === character);
      if (tile) {
        this.highlighted = { kind: 'pool', character };
        this.drawHighlight(tile);
      }
    }
  }

  private drawHighlight(rect: Rect) {
    const { x, y } = centre(rect);
    this.highlight = this.add.rectangle(x, y, rect.width, rect.height).setStrokeStyle(4, colours.highlight).setDepth(5);
  }

  private endDragVisuals() {
    this.dragTile?.destroy(true);
    this.dragTile = null;
    this.highlight?.destroy();
    this.highlight = null;
    this.highlighted = null;
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (this.phaseTwo) {
      this.phaseTwo.onPointerUp(pointer);
      return;
    }
    const press = this.press;
    if (!press || press.pointerId !== pointer.id) return;
    this.press = null;

    if (press.dragging) {
      const hit = hitTest(this.layoutNow, pointer.x, pointer.y);
      this.endDragVisuals();
      if (hit.kind === 'cell') {
        this.applied(this.board.dropOnCell(hit.row, hit.cell));
      } else {
        this.board.dropAway();
        this.redraw();
      }
    } else if (!press.dead) {
      this.tap(press.hit);
    }
  }

  private tap(hit: Hit) {
    if (hit.kind === 'pool' && hit.character) {
      this.applied(this.board.input(hit.character));
    } else if (hit.kind === 'cell') {
      this.board.selectRow(hit.row);
      this.redraw();
    } else if (hit.kind === 'recall') {
      this.board.recallAll();
      this.redraw();
    }
  }

  private onKey(event: KeyboardEvent) {
    if (this.phaseTwo) {
      this.phaseTwo.onKey(event);
      return;
    }
    if (event.key === 'Backspace' || event.key.startsWith('Arrow')) event.preventDefault();
    this.applied(this.board.key(event.key));
  }

  // Feedback

  private applied(events: BoardEvent[]) {
    this.redraw();
    this.feedback.push(...events);
    for (const event of events) {
      if (event.type === 'locked') this.pulse(event.row);
      if (event.type === 'wrong') this.shake(event.row);
      if (event.type === 'alreadyFound') this.showAlreadyFound(event.lockedRow);
      if (event.type === 'phaseOneOver') this.time.delayedCall(timings.lockPulse, () => this.startCeremony());
    }
  }

  // Phase two

  private solveForTests() {
    const answers = [...this.board.rows];
    answers.forEach((row, index) => {
      Array.from(row.word).forEach((character, cell) => {
        if (this.board.rows[index].cells[cell].kind === 'empty') {
          this.board.pickUpFromPool(character);
          this.applied(this.board.dropOnCell(index, cell));
        }
      });
    });
  }

  private startCeremony() {
    if (this.phaseTwo) return;
    const from = this.layoutNow.rows.map((row) => ({ x: row.cells[0].x + row.cells[0].width / 2, y: row.cells[0].y + row.cells[0].height / 2 }));
    const words = this.board.rows.map((row) => row.cells.map((cell) => (cell.kind === 'empty' ? '' : cell.character)).join(''));
    const phase = new PhaseTwo(words, this.level.finalWord);
    const view = new PhaseTwoView(
      this,
      phase,
      this.level,
      this.levelNumber + 1,
      {
        onWon: () => view.celebrate(),
        onNextLevel: () => this.nextLevel(),
      },
      this.layoutNow,
    );
    this.phaseTwo = view;

    const pool = this.poolObjects;
    this.poolObjects = [];
    this.tweens.add({ targets: pool, alpha: 0, duration: timings.ceremony, onComplete: () => pool.forEach((object) => object.destroy()) });

    this.redraw();
    const finished = () => view.checkInstantWin();
    view.setPendingFinish(finished);
    view.playCeremony(from, finished);
  }

  private nextLevel() {
    const next = this.levelNumber + 1;
    this.show(testLevels[(next - 1) % testLevels.length], next, this.points);
  }

  private pulse(row: number) {
    this.tweens.add({
      targets: this.rowObjects.get(row),
      scale: PULSE_SCALE,
      duration: timings.lockPulse / 2,
      yoyo: true,
    });
  }

  private shake(row: number) {
    this.tweens.add({
      targets: this.rowObjects.get(row),
      x: `+=${SHAKE_DISTANCE}`,
      duration: timings.wrongShake / 4,
      yoyo: true,
      repeat: 1,
    });
  }

  private showAlreadyFound(lockedRow: number) {
    this.tweens.add({
      targets: this.rowObjects.get(lockedRow)?.filter((part) => part instanceof Phaser.GameObjects.Rectangle),
      alpha: 0.5,
      duration: timings.lockPulse / 2,
      yoyo: true,
    });

    const size = this.layoutNow.tileSize;
    const text = this.add
      .text(0, 0, 'Already found', { fontFamily: currentStyle.font, fontSize: `${Math.round(size * 0.55)}px`, color: hex(colours.text) })
      .setOrigin(0.5);
    const background = this.add.rectangle(0, 0, text.width + size, text.height + size * 0.4, colours.highlight);
    this.foundText?.destroy(true);
    const message = this.add.container(this.scale.width / 2, this.scale.height / 2, [background, text]).setDepth(20);
    this.foundText = message;
    this.tweens.add({
      targets: message,
      y: message.y - size * 1.5,
      alpha: 0,
      duration: timings.alreadyFound,
      ease: 'Sine.easeIn',
      onComplete: () => {
        message.destroy(true);
        if (this.foundText === message) this.foundText = null;
      },
    });
  }
}
