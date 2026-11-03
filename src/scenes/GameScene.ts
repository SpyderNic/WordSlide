import Phaser from 'phaser';
import { Board, type BoardEvent, type BoardSnapshot } from '../game/board';
import { PhaseTwo, type PhaseTwoSnapshot } from '../game/phaseTwo';
import { hitTest, layoutLevel, type CellView, type Hit, type LevelLayout, type PoolTileView, type Rect, type TopItem } from '../game/layout';
import type { Cell, Level } from '../game/level';
import { NEW_PLAYER, readProgress, SAVE_KEY, winLevel, writeProgress, type Progress } from '../game/progress';
import { pickedLevel, resetAsked } from '../game/startingLevel';
import { testLevels } from '../levels/testLevels';
import { createPlatform } from '../platform';
import type { Platform } from '../platform/Platform';
import { currentStyle } from '../style';
import { PhaseTwoView, type PhaseTwoRules } from './PhaseTwoView';
import { loadHand, makeGuideText, makeHand, moveHand } from './guide';
import { designedOrder, hasHandles, reorderingTutorial, rowsInDesignedOrder } from '../game/reordering';
import { firstReorderingMove, tutorialPlan, tutorialStep, type ReorderingMove, type TutorialPlan, type TutorialStep } from '../game/tutorial';
import { buildPopup } from './popup';
import { makeTile, paintTile } from './tiles';

const colours = currentStyle.colours;
const timings = currentStyle.timings;
const SHAKE_DISTANCE = 6;
const POINTS_PULSE = 1.2;
/** Letters flying between the pool and the cells are drawn above the board, below a dragged tile. */
const TRAVEL_DEPTH = 8;
/** Several letters going back to the pool leave this far apart, in milliseconds (story 16, R7). */
const TRAVEL_STAGGER = 30;
/** Level 2's outline around the theme sits just above the top of the screen's items (story 12, R12). */
const TOP_GLOW_DEPTH = 21;

interface Point {
  x: number;
  y: number;
}

/** A pulse or a shake that's still playing, so a redraw can carry it on with the new tiles. */
type Effect =
  | { kind: 'pulse'; row: number; cells: number[]; before: Cell['kind'][]; start: number }
  | { kind: 'shake'; row: number; cells: number[]; start: number };

/** The letter in a cell, if it holds one. */
function letterIn(cell: Cell): string | null {
  return cell.kind === 'placed' || cell.kind === 'revealed' || cell.kind === 'locked' ? cell.character : null;
}

interface Press {
  pointerId: number;
  x: number;
  y: number;
  hit: Hit;
  dragging: boolean;
  /** Nothing to pick up here, so moving doesn't start a drag. */
  dead: boolean;
}

/** What a cell is drawn with: an outline, a bevelled tile, or a letter. */
type CellPart = Phaser.GameObjects.Rectangle | Phaser.GameObjects.Container | Phaser.GameObjects.Text;

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
  private rowObjects = new Map<number, CellPart[]>();
  /** Each cell's objects, by "row:cell", so a locking part can pulse alone (D48). */
  private cellObjects = new Map<string, CellPart[]>();
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
  /** Cells waiting for a travelling letter, by "row:cell", and when it lands (story 16, R6). */
  private arriving = new Map<string, number>();
  /** Letters flying back to the pool, by letter: their tile's count goes up when they land (story 16, R7). */
  private incoming = new Map<string, number>();
  /** The tutorial, on a level marked as one (story 12). */
  private tutorial: TutorialPlan | null = null;
  /** The reordering tutorial's move, on the first level that needs reordering (story 21). */
  private reordering: ReorderingMove | null = null;
  /** Set once the move is made: after it, the player plays freely. */
  private reorderingDone = false;
  private guideText: Phaser.GameObjects.Text | null = null;
  private hand: Phaser.GameObjects.Container | null = null;
  private themeGlow: Phaser.GameObjects.Rectangle | null = null;
  /** What the guide shows now, so a redraw only rebuilds it when it changes. */
  private guideShown = '';
  /** Pulses and shakes still playing: moving on never cuts them short (D37). */
  private effects: Effect[] = [];
  private pointsText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('GameScene');
  }

  preload() {
    loadHand(this);
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
          place: (row: number, cell: number, character: string) =>
            this.act(() => {
              this.board.pickUpFromPool(character);
              return this.board.dropOnCell(row, cell);
            }),
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
    this.incoming.clear();
    this.arriving.clear();
    this.effects = [];
    this.clearGuide();
    this.tutorial = level?.tutorial ? tutorialPlan(level) : null;
    this.reordering = null;
    this.reorderingDone = false;
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
    // The guide is only rebuilt when its step changes, so a new layout needs it rebuilt here.
    this.guideShown = '';
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
    this.updateGuide();
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
    this.replayEffects();
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
    const parts: CellPart[] = [];
    if (cell.kind === 'special') {
      parts.push(this.drawText(cell.character, cellCentre.x, cellCentre.y, height * 0.6, locked ? colours.tileLocked : colours.highlight));
    } else if (cell.kind === 'empty') {
      parts.push(this.keep(this.add.rectangle(cellCentre.x, cellCentre.y, width, height).setStrokeStyle(2, colours.column)));
    } else {
      const fill = locked ? colours.tileLocked : cell.kind === 'revealed' ? colours.tileRevealed : colours.tilePlaced;
      const text = cell.kind === 'revealed' && !locked ? colours.highlight : colours.text;
      parts.push(this.keep(makeTile(this, cellCentre.x, cellCentre.y, width, fill)));
      parts.push(this.drawText(cell.character, cellCentre.x, cellCentre.y, height * 0.6, text));
    }
    this.rowObjects.set(row, [...(this.rowObjects.get(row) ?? []), ...parts]);
    this.cellObjects.set(`${row}:${cellIndex}`, parts);
    // A letter still flying to this cell shows up when it lands.
    const key = `${row}:${cellIndex}`;
    const landing = this.arriving.get(key) ?? 0;
    if (landing > this.time.now) {
      parts.forEach((part) => part.setAlpha(0));
      this.time.delayedCall(landing - this.time.now, () => parts.forEach((part) => part.active && part.setAlpha(1)));
    } else {
      this.arriving.delete(key);
    }
  }

  private drawPoolTile({ character, count: total, x, y, width, height }: PoolTileView) {
    const count = total - (this.incoming.get(character) ?? 0);
    const colour = count === 0 ? colours.tileGrey : colours.tile;
    this.poolObjects.push(makeTile(this, x + width / 2, y + height / 2, width, colour));
    this.poolObjects.push(this.drawPoolText(character, x + width / 2, y + height * 0.45, height * 0.55));
    // Never smaller than the style's minimum, so counts stay readable on small screens (story 16, R4).
    this.poolObjects.push(this.drawPoolText(`x${count}`, x + width * 0.78, y + height * 0.8, Math.max(height * 0.26, currentStyle.minText)));
  }

  private drawPoolText(text: string, x: number, y: number, size: number) {
    return this.add
      .text(x, y, text, { fontFamily: currentStyle.font, fontSize: `${Math.round(size)}px`, color: hex(colours.text) })
      .setOrigin(0.5);
  }

  private drawRecall() {
    // Each tutorial step is dragging only, so there's no Recall All in it (story 12, R10).
    if (this.tutorial) return;
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
    // The hand stops while the player is dragging (story 12, R9).
    this.hand?.setVisible(false);
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
    // In the tutorial, only the step's letters can be picked up, and only from the pool (story 12, R2).
    const allowed = this.tutorialLetters();
    if (hit.kind === 'pool' && hit.character && (!allowed || allowed.includes(hit.character))) started = this.board.pickUpFromPool(hit.character);
    if (hit.kind === 'cell' && !allowed) started = this.board.pickUpFromCell(hit.row, hit.cell);
    if (!started) return false;
    press.dragging = true;
    this.redraw();
    this.createDragTile(this.board.drag!.character);
    return true;
  }

  private createDragTile(character: string) {
    const size = this.layoutNow.tileSize;
    const tile = makeTile(this, 0, 0, size, colours.tilePlaced);
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
    this.time.delayedCall(0, () => this.updateGuide(true));
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
      // A dropped letter travels on from where it was released (story 16, R6).
      const origin = { character: this.board.drag!.character, x: pointer.x, y: pointer.y };
      const target = hit.kind === 'cell' && this.tutorialAllowsCell(hit.row, hit.cell) ? hit : null;
      if (target) this.act(() => this.board.dropOnCell(target.row, target.cell), origin);
      else this.act(() => this.board.dropAway(), origin);
    } else if (!press.dead && this.tutorialAllowsTap(press.hit)) {
      this.tap(press.hit);
    }
  }

  private tap(hit: Hit) {
    if (hit.kind === 'pool' && hit.character) {
      this.act(() => this.board.input(hit.character!));
    } else if (hit.kind === 'cell') {
      this.board.selectRow(hit.row);
      this.redraw();
    } else if (hit.kind === 'recall') {
      this.act(() => void this.board.recallAll());
    }
  }

  private onKey(event: KeyboardEvent) {
    if (this.allDone) return;
    if (this.phaseTwo) {
      this.phaseTwo.onKey(event);
      return;
    }
    if (event.key === 'Backspace' || event.key.startsWith('Arrow')) event.preventDefault();
    if (!this.tutorialAllowsKey(event.key)) return;
    this.act(() => this.board.key(event.key));
  }

  // The tutorial (story 12)

  private tutorialStepNow(): TutorialStep | null {
    if (this.tutorial) return tutorialStep(this.tutorial, this.board, this.phaseTwo?.phaseState ?? null);
    const phase = this.phaseTwo?.phaseState;
    if (!this.reordering || this.reorderingDone || !phase || phase.won) return null;
    if (phase.rows[this.reordering.to]?.word === this.reordering.word) {
      this.reorderingDone = true;
      return null;
    }
    return 'reorder';
  }

  /** The empty cells the current step fills. */
  private tutorialCells(): { row: number; cell: number }[] | null {
    const step = this.tutorialStepNow();
    if (step === 1) return this.tutorial!.first.cells.map((cell) => ({ row: this.tutorial!.first.row, cell }));
    if (step === 2) {
      return this.board.rows.flatMap((row, rowIndex) => row.cells.flatMap((cell, cellIndex) => (cell.kind === 'empty' ? [{ row: rowIndex, cell: cellIndex }] : [])));
    }
    return null;
  }

  /** The letters the current step uses: the answers' letters for its cells. Null outside the tutorial. */
  private tutorialLetters(): string[] | null {
    const cells = this.tutorialCells();
    if (!this.tutorialStepNow()) return null;
    return (cells ?? []).map(({ row, cell }) => Array.from(this.board.rows[row].word)[cell]);
  }

  /** In steps 1 and 2, typing the step's letter works like dragging it (story 12, R10). */
  private tutorialAllowsKey(key: string): boolean {
    const step = this.tutorialStepNow();
    if (!step) return true;
    return (step === 1 || step === 2) && key.length === 1 && this.tutorialLetters()!.includes(key.toUpperCase());
  }

  /** In steps 1 and 2, tapping the step's letter in the pool works too (story 12, R10). */
  private tutorialAllowsTap(hit: Hit): boolean {
    const step = this.tutorialStepNow();
    if (!step) return true;
    return (step === 1 || step === 2) && hit.kind === 'pool' && !!hit.character && this.tutorialLetters()!.includes(hit.character);
  }

  private tutorialAllowsCell(row: number, cell: number): boolean {
    const cells = this.tutorialCells();
    if (!this.tutorialStepNow()) return true;
    return (cells ?? []).some((target) => target.row === row && target.cell === cell);
  }

  /** Handles appear from the reordering tutorial on (story 21, R1). Tests can play as if it were already behind the player. */
  private reorderingTaught(): boolean {
    const taught = (window as unknown as { wordSlideReorderingTaught?: boolean }).wordSlideReorderingTaught;
    if (import.meta.env.DEV && taught) return true;
    return hasHandles(this.levels, this.levelNumber);
  }

  /** The first level that needs reordering teaches it (story 21, R1). */
  private isReorderingTutorial(): boolean {
    const taught = (window as unknown as { wordSlideReorderingTaught?: boolean }).wordSlideReorderingTaught;
    if (import.meta.env.DEV && taught) return false;
    return reorderingTutorial(this.levels) === this.levelNumber;
  }

  private phaseTwoRules(): PhaseTwoRules {
    const step = () => this.tutorialStepNow();
    const move = () => this.reordering!;
    return {
      handle: (word) => !step() || (step() === 'reorder' && word === move().word),
      slide: (word) => !step() || (step() === 3 && word === this.tutorial!.slide.word),
      slot: (word, slot) => !step() || (step() === 'reorder' && word === move().word && Math.sign(slot - move().from) === Math.sign(move().to - move().from)),
      keys: () => !step(),
    };
  }

  private clearGuide() {
    this.guideText?.destroy();
    this.guideText = null;
    if (this.hand) this.tweens.killTweensOf(this.hand);
    this.hand?.destroy(true);
    this.hand = null;
    if (this.themeGlow) this.tweens.killTweensOf(this.themeGlow);
    this.themeGlow?.destroy();
    this.themeGlow = null;
    this.guideShown = '';
  }

  /** The text, the hand and level 2's tip for where the player is now. Rebuilt only when that changes. */
  private updateGuide(force = false) {
    const step = this.tutorialStepNow();
    const view = this.phaseTwo;
    const afterTutorial = this.levels[this.levelNumber - 2]?.tutorial === true && !this.tutorial && !view && !this.allDone;
    const tip = afterTutorial && !this.board.rows.some((row) => row.locked);
    const waiting = view && !view.ready;
    const shown = waiting ? 'ceremony' : step ? `step ${step}` : tip ? 'tip' : '';
    if (!force && shown === this.guideShown && this.guideText?.active !== false) {
      this.guideText?.setDepth(this.guideText.depth);
      return;
    }
    this.clearGuide();
    this.guideShown = shown;
    if (!shown || shown === 'ceremony') return;

    const texts: Record<string, string> = {
      'step 1': 'Drag a letter to complete a word',
      'step 2': 'Finish the grid!',
      'step 3': 'You can drag words side to side to find the word, try it!',
      'step reorder': 'To find the vertical final word, you can reorder the words',
      tip: 'All words in a level relate to a theme.',
    };
    const layout = this.layoutNow;
    const rowsTop = view ? view.rowsTopEdge : layout.rows[0].cells[0].y;
    const y = (layout.top.height + rowsTop) / 2;
    this.guideText = makeGuideText(this, texts[shown], layout.width / 2, y, layout.tileSize * 0.42, layout.width * 0.9);

    if (shown === 'tip') {
      const theme = layout.topItems.find((item) => item.name === 'theme')!;
      this.themeGlow = this.add
        .rectangle(theme.x + theme.width / 2, theme.y + theme.height / 2, theme.width + 8, theme.height + 4)
        .setStrokeStyle(3, colours.highlight)
        .setDepth(TOP_GLOW_DEPTH);
      this.tweens.add({ targets: this.themeGlow, alpha: 0.3, duration: timings.themeGlow, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return;
    }

    const plan = this.tutorial;
    const move = this.reordering;
    let from: { x: number; y: number } | null = null;
    let to: { x: number; y: number } | null = null;
    if (step === 1 && plan) {
      const tile = layout.poolTiles.find((candidate) => candidate.character === plan.first.letters[0]);
      if (tile) from = centre(tile);
      to = centre(layout.rows[plan.first.row].cells[plan.first.cells[0]]);
    } else if (step === 3 && plan && view) {
      from = view.letterCentre(plan.slide.word, plan.slide.cell);
      to = { x: view.columnCentre, y: from.y };
    } else if (step === 'reorder' && move && view) {
      from = view.handleCentre(move.word);
      to = { x: from.x, y: from.y + (move.to - move.from) * view.rowPitch };
    }
    if (!from || !to) return;
    this.hand = makeHand(this, layout.tileSize);
    moveHand(this, this.hand, from, to);
  }

  // Letters travelling (story 16, R6 and R7)

  /** Runs a change to the board, then flies each letter that moved from where it was to where it went. */
  private act(change: () => BoardEvent[] | void, origin?: { character: string } & Point) {
    const before = this.board.snapshot();
    const events = change() ?? [];
    const flights = this.flightsSince(before, origin);
    const landing = this.time.now + timings.letterTravel;
    flights.forEach((flight) => {
      if (flight.cell) this.arriving.set(flight.cell, landing);
      else this.incoming.set(flight.character, (this.incoming.get(flight.character) ?? 0) + 1);
    });
    this.applied(events, flights.some((flight) => flight.cell));
    flights.forEach((flight) => this.fly(flight));
  }

  /** Which letters left which cells, and which arrived, and where each one comes from and goes to. */
  private flightsSince(before: BoardSnapshot, origin?: { character: string } & Point) {
    const cellAt = (row: number, cell: number) => centre(this.layoutNow.rows[row].cells[cell]);
    const poolAt = (character: string) => {
      const tile = this.layoutNow.poolTiles.find((candidate) => candidate.character === character);
      return tile ? centre(tile) : null;
    };
    const left: { character: string; from: Point }[] = [];
    const arrived: { character: string; to: Point; cell: string }[] = [];
    this.board.rows.forEach((row, rowIndex) =>
      row.cells.forEach((cell, cellIndex) => {
        const was = letterIn(before.rows[rowIndex].cells[cellIndex]);
        const now = letterIn(cell);
        if (was === now) return;
        if (was) left.push({ character: was, from: cellAt(rowIndex, cellIndex) });
        if (now) arrived.push({ character: now, to: cellAt(rowIndex, cellIndex), cell: `${rowIndex}:${cellIndex}` });
      }),
    );
    let fromHand = origin;
    const flights: { character: string; from: Point; to: Point; cell?: string; delay: number }[] = [];
    for (const arrival of arrived) {
      // A dropped letter comes from the pointer, a swapped one from the cell it left, and the rest from the pool.
      let from: Point | null = null;
      if (fromHand && fromHand.character === arrival.character) {
        from = fromHand;
        fromHand = undefined;
      } else {
        const swapped = left.findIndex((departure) => departure.character === arrival.character);
        if (swapped !== -1) from = left.splice(swapped, 1)[0].from;
        else from = poolAt(arrival.character);
      }
      if (from) flights.push({ character: arrival.character, from, to: arrival.to, cell: arrival.cell, delay: 0 });
    }
    const home = [...left, ...(fromHand ? [{ character: fromHand.character, from: fromHand as Point }] : [])];
    home.forEach((departure, index) => {
      const to = poolAt(departure.character);
      if (to) flights.push({ character: departure.character, from: departure.from, to, delay: home.length > 1 ? index * TRAVEL_STAGGER : 0 });
    });
    return flights;
  }

  private fly({ character, from, to, cell, delay }: { character: string; from: Point; to: Point; cell?: string; delay: number }) {
    const tile = makeTile(this, from.x, from.y, this.layoutNow.tileSize, colours.tilePlaced, { text: character, colour: colours.text }).setDepth(TRAVEL_DEPTH);
    const board = this.board;
    this.tweens.add({
      targets: tile,
      x: to.x,
      y: to.y,
      delay,
      duration: timings.letterTravel,
      ease: 'Sine.easeOut',
      onComplete: () => {
        tile.destroy(true);
        if (cell || this.board !== board) return;
        this.incoming.set(character, (this.incoming.get(character) ?? 1) - 1);
        this.redrawPool();
      },
    });
  }

  private redrawPool() {
    if (this.phaseTwo || this.allDone) return;
    this.fadePoolNow();
    this.layoutNow.poolTiles.forEach((tile) => this.drawPoolTile(tile));
    this.drawRecall();
  }

  // Feedback

  /** Feedback waits until a travelling letter has landed, so it plays where the player is looking. */
  private applied(events: BoardEvent[], travelled = false) {
    this.redraw();
    this.saveLevel();
    this.feedback.push(...events);
    const wait = travelled ? timings.letterTravel : 0;
    for (const event of events) {
      if (event.type === 'locked') {
        // Parts that had already locked don't celebrate again (D48).
        const fresh = this.board.rows[event.row].cells.flatMap((cell, index) => (cell.kind === 'locked' ? [] : [index]));
        this.pulse(event.row, fresh, fresh.map((cell) => this.board.rows[event.row].cells[cell].kind), wait);
      }
      if (event.type === 'partLocked') this.pulse(event.row, event.cells, event.before, wait);
      if (event.type === 'wrong') this.shake(event.row, wait);
      if (event.type === 'alreadyFound') this.time.delayedCall(wait, () => this.showAlreadyFound(event.lockedRow));
      if (event.type === 'phaseOneOver') {
        const board = this.board;
        this.time.delayedCall(wait + timings.lockPulseGrow + timings.lockPulseShrink, () => {
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
    let from = this.layoutNow.rows.map((row) => ({ x: row.cells[0].x + row.cells[0].width / 2, y: row.cells[0].y + row.cells[0].height / 2 }));
    let words = this.board.rows.map((row) => row.cells.map((cell) => (cell.kind === 'empty' ? '' : cell.character)).join(''));
    const canReorder = this.reorderingTaught();
    if (canReorder && !this.tutorial && this.isReorderingTutorial()) {
      this.reordering = firstReorderingMove(words, designedOrder(this.level));
    }
    if (!canReorder) {
      // Each row glides from where it was in phase one to its designed slot.
      const rows = rowsInDesignedOrder(this.level, words);
      from = rows.map((row) => from[row]);
      words = rows.map((row) => words[row]);
    }
    const phase = (saved && PhaseTwo.restore(saved, words, this.level.finalWord, canReorder)) || new PhaseTwo(words, this.level.finalWord, canReorder);
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
      this.phaseTwoRules(),
    );
    this.phaseTwo = view;

    const pool = this.poolObjects;
    this.poolObjects = [];
    if (reopening) pool.forEach((object) => object.destroy());
    else this.tweens.add({ targets: pool, alpha: 0, duration: timings.ceremony, onComplete: () => pool.forEach((object) => object.destroy()) });

    this.redraw();
    const finished = () => {
      view.checkInstantWin();
      this.updateGuide(true);
    };
    view.setPendingFinish(finished);
    view.playCeremony(from, finished);
    if (reopening) view.skipCeremony();
  }

  /** Saved before the celebration, so closing during it loses nothing (story 11, R5). */
  private won(view: PhaseTwoView) {
    this.clearGuide();
    this.guideShown = 'won';
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
  private pulse(row: number, cells: number[], before: Cell['kind'][], wait = 0) {
    const effect: Effect = { kind: 'pulse', row, cells, before, start: this.time.now + wait };
    this.effects.push(effect);
    this.playPulse(effect);
  }

  /** A redraw makes new tiles: each pulse or shake still playing carries on with them, from where it had got to. */
  private replayEffects() {
    const { lockPulseGrow, lockPulseShrink, wrongShake } = timings;
    this.effects = this.effects.filter((effect) => this.time.now < effect.start + (effect.kind === 'pulse' ? lockPulseGrow + lockPulseShrink : wrongShake));
    for (const effect of this.effects) {
      if (effect.kind === 'pulse') this.playPulse(effect);
      else this.playShake(effect);
    }
  }

  private playPulse({ row, cells, before, start }: Extract<Effect, { kind: 'pulse' }>) {
    const grow = timings.lockPulseGrow;
    const shrink = timings.lockPulseShrink;
    const peak = currentStyle.pulseScale;
    const elapsed = this.time.now - start;
    const targets: CellPart[] = [];
    const finish: (() => void)[] = [];
    cells.forEach((cell, index) => {
      const parts = this.cellObjects.get(`${row}:${cell}`) ?? [];
      targets.push(...parts);
      for (const part of parts) {
        if (part instanceof Phaser.GameObjects.Container) {
          const locked = (part.list[0] as Phaser.GameObjects.Rectangle).fillColor;
          paintTile(part, before[index] === 'revealed' ? colours.tileRevealed : colours.tilePlaced);
          finish.push(() => paintTile(part, locked));
        } else if (part instanceof Phaser.GameObjects.Text) {
          const locked = part.style.color;
          if (before[index] === 'revealed' || before[index] === 'special') part.setColor(hex(colours.highlight));
          finish.push(() => part.setColor(locked));
        }
      }
    });
    const shrinkBack = (from: number) => {
      finish.forEach((step) => step());
      targets.forEach((part) => part.setScale(from));
      this.tweens.add({ targets, scale: 1, duration: grow + shrink - Math.max(elapsed, grow), ease: 'Sine.easeIn' });
    };
    if (elapsed >= grow) {
      shrinkBack(peak - ((peak - 1) * (elapsed - grow)) / shrink);
      return;
    }
    targets.forEach((part) => part.setScale(1 + ((peak - 1) * Math.max(elapsed, 0)) / grow));
    this.tweens.add({
      targets,
      scale: peak,
      delay: Math.max(-elapsed, 0),
      duration: grow - Math.max(elapsed, 0),
      ease: 'Sine.easeOut',
      onComplete: () => shrinkBack(peak),
    });
  }

  /** Only the letters that didn't lock move. Locked parts and special characters stay still (D37). */
  private shake(row: number, wait = 0) {
    const cells = this.board.rows[row].cells.flatMap((cell, index) => (cell.kind === 'locked' || cell.kind === 'special' ? [] : [index]));
    const effect: Effect = { kind: 'shake', row, cells, start: this.time.now + wait };
    this.effects.push(effect);
    this.playShake(effect);
  }

  private playShake({ row, cells, start }: Extract<Effect, { kind: 'shake' }>) {
    const elapsed = this.time.now - start;
    const moving = cells.flatMap((cell) => this.cellObjects.get(`${row}:${cell}`) ?? []);
    this.tweens.add({
      targets: moving,
      x: `+=${SHAKE_DISTANCE}`,
      delay: Math.max(-elapsed, 0),
      duration: (timings.wrongShake - Math.max(elapsed, 0)) / 4,
      yoyo: true,
      repeat: 1,
    });
  }

  private showAlreadyFound(lockedRow: number) {
    this.tweens.add({
      targets: this.rowObjects.get(lockedRow)?.filter((part) => part instanceof Phaser.GameObjects.Container),
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
