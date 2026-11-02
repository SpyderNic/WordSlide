import Phaser from 'phaser';
import { Board, type BoardEvent } from '../game/board';
import { PhaseTwo, type PhaseTwoSnapshot } from '../game/phaseTwo';
import { hitTest, layoutLevel, type CellView, type Hit, type LevelLayout, type PoolTileView, type Rect, type TopItem } from '../game/layout';
import type { Cell, Level } from '../game/level';
import { NEW_PLAYER, readProgress, SAVE_KEY, winLevel, writeProgress, type Progress } from '../game/progress';
import { pickedLevel, resetAsked } from '../game/startingLevel';
import { testLevels } from '../levels/testLevels';
import { createPlatform } from '../platform';
import type { Platform } from '../platform/Platform';
import { currentStyle } from '../style';
import { PhaseTwoView } from './PhaseTwoView';
import { buildPopup } from './popup';

const colours = currentStyle.colours;
const timings = currentStyle.timings;
const SHAKE_DISTANCE = 6;
const POINTS_PULSE = 1.2;

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
  /** Each cell's objects, by "row:cell", so a locking part can pulse alone (D48). */
  private cellObjects = new Map<string, (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text)[]>();
  private press: Press | null = null;
  private dragTile: Phaser.GameObjects.Container | null = null;
  private highlight: Phaser.GameObjects.Rectangle | null = null;
  private highlighted: { kind: 'cell'; row: number; cell: number } | { kind: 'pool'; character: string } | null = null;
  private feedback: BoardEvent[] = [];
  private foundText: Phaser.GameObjects.Container | null = null;
  private poolObjects: Phaser.GameObjects.GameObject[] = [];
  private phaseTwo: PhaseTwoView | null = null;
  private levels: Level[] = testLevels;
  private progress: Progress = NEW_PLAYER;
  private platform!: Platform;
  /** False while the designer peeks at a level picked in the address (story 11, R13). */
  private saving = true;
  /** After the last level, only the top of the screen and a popup show (story 11, R11). */
  private allDone = false;
  private allComplete: Phaser.GameObjects.Container | null = null;
  private pointsText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('GameScene');
  }

  create() {
    const development = import.meta.env.DEV;
    const testList = (window as unknown as { wordSlideTestLevels?: Level[] }).wordSlideTestLevels;
    if (development && testList) this.levels = testList;
    this.platform = createPlatform();
    const search = window.location.search;
    void this.platform.load(SAVE_KEY).then((text) => {
      let progress = readProgress(text);
      if (resetAsked(search, development)) {
        progress = NEW_PLAYER;
        this.save(progress);
      }
      const picked = pickedLevel(search, this.levels.length, development);
      if (picked !== null) {
        this.saving = false;
        progress = { level: picked, points: progress.points, inLevel: null };
      }
      this.progress = progress;
      this.startLevel();
      this.listen();
    });
  }

  private listen() {
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
      points: this.points,
      phaseTwo: this.phaseTwo?.testView() ?? null,
    };
  }

  /** For tests: opens a level as if the player had reached it. */
  private show(level: Level, levelNumber: number, points: number) {
    this.progress = { level: levelNumber, points, inLevel: null };
    this.startLevel(level);
  }

  /** Opens the player's current level, as they left it (story 11, R6 and R10). */
  private startLevel(level: Level | undefined = this.levels[this.progress.level - 1], fade = false) {
    this.phaseTwo?.destroy();
    this.phaseTwo = null;
    this.allComplete?.destroy(true);
    this.allComplete = null;
    this.allDone = false;
    this.press = null;
    this.endDragVisuals();
    this.levelNumber = this.progress.level;
    this.points = this.progress.points;
    this.feedback = [];
    if (!level) {
      this.showAllComplete();
      return;
    }
    this.level = level;
    const saved = this.progress.inLevel;
    this.board = (saved && Board.restore(level, saved.board)) || new Board(level);
    this.redraw();
    if (this.board.phaseOneOver) this.startCeremony(saved?.phaseTwo ?? null, true);
    if (fade) {
      const colour = Phaser.Display.Color.IntegerToColor(colours.background);
      this.cameras.main.fadeIn(timings.levelFade, colour.red, colour.green, colour.blue);
    }
  }

  /** Reopening after the last level shows its popup again (story 11, R11). */
  private showAllComplete() {
    this.level = this.levels[this.levels.length - 1];
    this.levelNumber = this.levels.length;
    this.board = new Board(this.level);
    this.allDone = true;
    this.redraw();
  }

  // Saving

  private save(progress: Progress = this.progress) {
    if (this.saving) void this.platform.save(SAVE_KEY, writeProgress(progress));
  }

  /** After every change that settles (story 11, R10). */
  private saveLevel() {
    if (this.allDone || this.board.drag) return;
    this.progress = { ...this.progress, inLevel: { board: this.board.snapshot(), phaseTwo: this.phaseTwo?.snapshot() ?? null } };
    this.save();
  }

  private onResize() {
    if (!this.board) return;
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
    this.cellObjects.clear();
    this.layoutNow = layoutLevel(this.level, this.levelNumber, this.points, this.scale.width, this.scale.height, this.board);

    this.pointsText = null;
    this.layoutNow.topItems.forEach((item) => this.drawTopItem(item));
    if (this.allDone) {
      this.fadePoolNow();
      this.allComplete?.destroy(true);
      this.allComplete = buildPopup(this, this.layoutNow.tileSize, { title: 'All levels complete!', word: [], button: null }).container;
      return;
    }
    if (this.phaseTwo) return;

    this.fadePoolNow();
    this.drawSelection();
    this.layoutNow.rows.forEach((row, index) => row.cells.forEach((cell, cellIndex) => this.drawCell(cell, index, cellIndex, row.locked)));
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
    const text = this.drawText(item.text, x, y, size, item.isButton ? colours.text : colours.highlight);
    if (item.name === 'points') this.pointsText = text;
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

  private drawCell({ cell, x, y, width, height }: CellView, row: number, cellIndex: number, rowLocked: boolean) {
    const locked = rowLocked || cell.kind === 'locked';
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
    this.cellObjects.set(`${row}:${cellIndex}`, parts);
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
    if (this.allDone) return;
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
        this.saveLevel();
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
      this.saveLevel();
    }
  }

  private onKey(event: KeyboardEvent) {
    if (this.allDone) return;
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
    this.saveLevel();
    this.feedback.push(...events);
    for (const event of events) {
      if (event.type === 'locked') {
        // Parts that had already locked don't celebrate again (D48).
        const fresh = this.board.rows[event.row].cells.flatMap((cell, index) => (cell.kind === 'locked' ? [] : [index]));
        this.pulse(event.row, fresh, fresh.map((cell) => this.board.rows[event.row].cells[cell].kind));
      }
      if (event.type === 'partLocked') this.pulse(event.row, event.cells, event.before);
      if (event.type === 'wrong') this.shake(event.row);
      if (event.type === 'alreadyFound') this.showAlreadyFound(event.lockedRow);
      if (event.type === 'phaseOneOver') {
        const board = this.board;
        this.time.delayedCall(timings.lockPulseGrow + timings.lockPulseShrink, () => {
          if (this.board === board) this.startCeremony();
        });
      }
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

  /** Reopening goes straight to the finished layout, with any saved positions (story 11, R10). */
  private startCeremony(saved: PhaseTwoSnapshot | null = null, reopening = false) {
    if (this.phaseTwo) return;
    const from = this.layoutNow.rows.map((row) => ({ x: row.cells[0].x + row.cells[0].width / 2, y: row.cells[0].y + row.cells[0].height / 2 }));
    const words = this.board.rows.map((row) => row.cells.map((cell) => (cell.kind === 'empty' ? '' : cell.character)).join(''));
    const phase = (saved && PhaseTwo.restore(saved, words, this.level.finalWord)) || new PhaseTwo(words, this.level.finalWord);
    const next = this.levelNumber < this.levels.length ? this.levelNumber + 1 : null;
    const view = new PhaseTwoView(
      this,
      phase,
      this.level,
      next,
      {
        onWon: () => this.won(view),
        onSettled: () => this.saveLevel(),
        onPopup: () => this.showNewPoints(),
        onNextLevel: () => this.nextLevel(),
      },
      this.layoutNow,
    );
    this.phaseTwo = view;

    const pool = this.poolObjects;
    this.poolObjects = [];
    if (reopening) pool.forEach((object) => object.destroy());
    else this.tweens.add({ targets: pool, alpha: 0, duration: timings.ceremony, onComplete: () => pool.forEach((object) => object.destroy()) });

    this.redraw();
    const finished = () => view.checkInstantWin();
    view.setPendingFinish(finished);
    view.playCeremony(from, finished);
    if (reopening) view.skipCeremony();
  }

  /** Saved before the celebration, so closing during it loses nothing (story 11, R5). */
  private won(view: PhaseTwoView) {
    this.progress = winLevel(this.progress);
    this.save();
    view.celebrate();
  }

  /** The points go up with a small pulse as the popup appears (story 11, R12). */
  private showNewPoints() {
    this.points = this.progress.points;
    this.redraw();
    if (this.pointsText) {
      this.tweens.add({ targets: this.pointsText, scale: POINTS_PULSE, duration: timings.lockPulseGrow, yoyo: true });
    }
  }

  private nextLevel() {
    this.startLevel(undefined, true);
  }

  /**
   * A locking word or part (D48): its tiles grow from their centre, take the locked colour at their biggest,
   * then shrink back (D37). They're drawn locked already, so they show their old colours while they grow.
   */
  private pulse(row: number, cells: number[], before: Cell['kind'][]) {
    const targets: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text)[] = [];
    const finish: (() => void)[] = [];
    cells.forEach((cell, index) => {
      const parts = this.cellObjects.get(`${row}:${cell}`) ?? [];
      targets.push(...parts);
      for (const part of parts) {
        if (part instanceof Phaser.GameObjects.Rectangle) {
          const locked = part.fillColor;
          part.setFillStyle(before[index] === 'revealed' ? colours.tileRevealed : colours.tilePlaced);
          finish.push(() => part.setFillStyle(locked));
        } else {
          const locked = part.style.color;
          if (before[index] === 'revealed' || before[index] === 'special') part.setColor(hex(colours.highlight));
          finish.push(() => part.setColor(locked));
        }
      }
    });
    this.tweens.add({
      targets,
      scale: currentStyle.pulseScale,
      duration: timings.lockPulseGrow,
      ease: 'Sine.easeOut',
      onComplete: () => {
        finish.forEach((step) => step());
        this.tweens.add({ targets, scale: 1, duration: timings.lockPulseShrink, ease: 'Sine.easeIn' });
      },
    });
  }

  /** Only the letters that didn't lock move. Locked parts and special characters stay still (D37). */
  private shake(row: number) {
    const moving = this.board.rows[row].cells.flatMap((cell, index) =>
      cell.kind === 'locked' || cell.kind === 'special' ? [] : (this.cellObjects.get(`${row}:${index}`) ?? []),
    );
    this.tweens.add({
      targets: moving,
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
      duration: timings.lockPulseGrow,
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
