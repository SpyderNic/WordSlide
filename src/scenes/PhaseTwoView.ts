import Phaser from 'phaser';
import { drawHintButton, isInside, type HintButton } from './hintButtons';
import { layoutLevel, type LevelLayout, type Rect } from '../game/layout';
import type { Level } from '../game/level';
import type { PhaseTwo, PhaseTwoSnapshot } from '../game/phaseTwo';
import { currentStyle } from '../style';
import { buildPopup } from './popup';
import { makeTile, paintTile, sizeTile } from './tiles';

const colours = currentStyle.colours;
const timings = currentStyle.timings;

const GAP = 0.08;
const RAISED_SCALE = 1.05;
/** How far past the end of its range a word or row stretches, in cells, and how much it resists. */
const STRETCH_LIMIT = 0.4;
const STRETCH_RESISTANCE = 0.25;
/** Pixels per millisecond: a release faster than this counts as a flick. */
const FLICK_SPEED = 0.6;
const FLICK_GLIDE_TIME = 150;
const FLICK_MAX_PAUSE = 80;
const GOLD_STAGGER = 180;
const WIN_FADE = 300;

function hex(colour: number): string {
  return `#${colour.toString(16).padStart(6, '0')}`;
}

interface RowView {
  container: Phaser.GameObjects.Container;
  tiles: Phaser.GameObjects.Container[];
  letters: Phaser.GameObjects.Text[];
  selection: Phaser.GameObjects.Rectangle;
  handle: Phaser.GameObjects.Container;
}

type Press =
  | { kind: 'slide'; pointerId: number; row: number; startX: number; startPosition: number; position: number; moved: boolean; lastX: number; lastTime: number; speed: number; before: number }
  | { kind: 'reorder'; pointerId: number; row: number; startY: number; startRowY: number; moved: boolean; startOrder: number };

/** What the player may do in phase two. Outside the tutorial, everything (story 12, R2). */
export interface PhaseTwoRules {
  handle: (word: string) => boolean;
  slide: (word: string) => boolean;
  /** Whether a row lifted by its handle may go to this slot. */
  slot: (word: string, slot: number) => boolean;
  keys: () => boolean;
  /** Whether hints are offered: not during a tutorial's step (story 19, R10). */
  hints: () => boolean;
}

const FREE: PhaseTwoRules = { handle: () => true, slide: () => true, slot: () => true, keys: () => true, hints: () => true };

export interface PhaseTwoCallbacks {
  /** The ceremony has finished, or a word or row has settled, and the column spells the word. */
  onWon: () => void;
  /** A word or row has settled without winning (story 11, R10). */
  onSettled: () => void;
  /** The popup has just appeared after a win (story 11, R12). */
  onPopup: () => void;
  /** The player's points before and after this level's win, for the popup (story 20, R11). */
  points: () => { from: number; to: number };
  onNextLevel: () => void;
}

export interface PhaseTwoTestView {
  column: Rect;
  rows: { word: string; columnCell: number; x: number; y: number; scale: number; depth: number; selected: boolean; fixed: boolean }[];
  handles: Rect[];
  handlesVisible: boolean;
  ceremonyDone: boolean;
  hints: HintButton[];
  columnText: string;
  won: boolean;
  dragging: boolean;
  popup: { buttonRect: Rect | null } | null;
}

export class PhaseTwoView {
  private readonly rowViews: RowView[] = [];
  /** The tinted strip, behind the words. */
  private column!: Phaser.GameObjects.Graphics;
  /** The brass sides and notches, above the words, so letters slide under them (story 16, R8). */
  private columnSides!: Phaser.GameObjects.Graphics;
  /** The grey glass line, above every word, even one lifted by its handle (story 16, R8). */
  private columnGlass!: Phaser.GameObjects.Graphics;
  private press: Press | null = null;
  private tile = 0;
  private pitch = 0;
  private columnX = 0;
  private rowsTop = 0;
  private handlesVisible = false;
  /** The hint buttons along the bottom (story 19, R2), and what's drawn for them. */
  private hintButtons: HintButton[] = [];
  private hintObjects: Phaser.GameObjects.GameObject[] = [];
  private ceremonyDone = false;
  private popup: Phaser.GameObjects.Container | null = null;
  private popupInfo: PhaseTwoTestView['popup'] = null;
  private celebrating: Phaser.Time.TimerEvent | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly phase: PhaseTwo,
    private readonly level: Level,
    /** Null after the last level (story 11, R11). */
    private readonly nextLevelNumber: number | null,
    private readonly callbacks: PhaseTwoCallbacks,
    private layout: LevelLayout,
    private readonly rules: PhaseTwoRules = FREE,
  ) {}

  // Where the tutorial's hand goes (story 12)

  get ready(): boolean {
    return this.ceremonyDone;
  }

  handleCentre(word: string) {
    const row = this.phase.rows.findIndex((candidate) => candidate.word === word);
    return { x: this.handleRect().x, y: this.rowY(row) };
  }

  /** Where one of a word's letters is now, and the column's middle, on the same line. */
  letterCentre(word: string, cell: number) {
    const row = this.phase.rows.findIndex((candidate) => candidate.word === word);
    return { x: this.rowViews[row].container.x + cell * this.pitch, y: this.rowY(row) };
  }

  get columnCentre() {
    return this.columnX;
  }

  get rowPitch() {
    return this.pitch;
  }

  /** The top of the column's strip, for the tutorial's text to sit above. */
  get rowsTopEdge() {
    return this.rowsTop - this.tile / 2;
  }

  get phaseState() {
    return this.phase;
  }

  private measure() {
    const { width, height } = this.scene.scale;
    this.layout = layoutLevel(this.level, 1, 0, width, height);
    this.tile = this.layout.tileSize;
    this.pitch = this.tile * (1 + GAP);
    this.columnX = width / 2;
    const space = height - this.layout.top.height;
    const rowsHeight = this.phase.rows.length * this.pitch - this.tile * GAP;
    this.rowsTop = this.layout.top.height + (space - rowsHeight) / 2 + this.tile / 2;
  }

  private rowY(row: number): number {
    return this.rowsTop + row * this.pitch;
  }

  /** The x of the word's first cell, for a position in cells. */
  private wordX(position: number): number {
    return this.columnX - position * this.pitch;
  }

  private handleRect(): { x: number; size: number } {
    const size = Math.max(this.tile, 44);
    return { x: this.tile * 0.2 + size / 2, size };
  }

  // Building

  /** Starts from where the rows were in phase one, then plays the ceremony (story 7). */
  playCeremony(from: { x: number; y: number }[], onFinished: () => void) {
    this.measure();
    this.column = this.scene.add.graphics().setAlpha(0).setDepth(0);
    // Above the words (depth 1), below a row lifted to be moved (depth 2).
    this.columnSides = this.scene.add.graphics().setAlpha(0).setDepth(1.5);
    // Above a lifted row (depth 2), below the handles (depth 3).
    this.columnGlass = this.scene.add.graphics().setAlpha(0).setDepth(2.5);
    this.drawColumn();
    this.phase.rows.forEach((row, index) => this.buildRow(index, from[index]));

    this.scene.tweens.add({ targets: [this.column, this.columnSides, this.columnGlass], alpha: 1, duration: timings.ceremony });
    this.rowViews.forEach((view, index) => {
      this.scene.tweens.add({
        targets: view.container,
        x: this.wordX(this.phase.rows[index].columnCell),
        y: this.rowY(index),
        duration: timings.ceremony,
        ease: 'Sine.easeInOut',
      });
    });
    this.scene.time.delayedCall(timings.ceremony, () => this.finishCeremony(onFinished));
  }

  private finishCeremony(onFinished: () => void) {
    if (this.ceremonyDone) return;
    this.ceremonyDone = true;
    this.placeEverything();
    this.column.setAlpha(1);
    this.columnSides.setAlpha(1);
    this.columnGlass.setAlpha(1);
    if (this.phase.canReorder) {
      this.handlesVisible = true;
      this.rowViews.forEach((view) => view.handle.setVisible(true));
    }
    this.drawHints();
    onFinished();
  }

  /** Rotating during the ceremony jumps to its end (story 7, R14). */
  skipCeremony() {
    if (this.ceremonyDone) return;
    this.rowViews.forEach((view) => this.scene.tweens.killTweensOf(view.container));
    this.scene.tweens.killTweensOf([this.column, this.columnSides, this.columnGlass]);
    this.finishCeremony(this.pendingFinish);
  }

  private pendingFinish: () => void = () => {};

  setPendingFinish(onFinished: () => void) {
    this.pendingFinish = onFinished;
  }

  private drawColumn() {
    const rows = this.phase.rows.length;
    const notch = this.tile * 0.25;
    const pad = this.tile * 0.08;
    const left = this.columnX - this.tile / 2 - pad;
    const right = this.columnX + this.tile / 2 + pad;
    const top = this.rowsTop - this.tile / 2 - pad;
    const bottom = top + rows * this.pitch - this.tile * GAP + pad * 2;
    this.column
      .clear()
      .fillStyle(colours.column, 0.45)
      .fillRect(left, top, right - left, bottom - top);
    const glass = left + pad * 2;
    this.columnSides
      .clear()
      .lineStyle(3, colours.column)
      .lineBetween(left, top, left, bottom)
      .lineBetween(right, top, right, bottom)
      .lineBetween(left, top, right, top)
      .lineBetween(left, bottom, right, bottom)
      .fillStyle(colours.column)
      .fillTriangle(this.columnX - notch, top - notch, this.columnX + notch, top - notch, this.columnX, top)
      .fillTriangle(this.columnX - notch, bottom + notch, this.columnX + notch, bottom + notch, this.columnX, bottom);
    // A grey sheen down the column, like glass (story 16, R8).
    this.columnGlass
      .clear()
      .lineStyle(Math.max(2, this.tile * 0.06), 0xffffff, 0.25)
      .lineBetween(glass, top + pad, glass, bottom - pad);
  }

  private buildRow(index: number, from: { x: number; y: number }) {
    const { cells } = this.phase.rows[index];
    const tiles: Phaser.GameObjects.Container[] = [];
    const letters: Phaser.GameObjects.Text[] = [];
    const children: Phaser.GameObjects.GameObject[] = [];
    const size = this.tile;
    const selection = this.scene.add
      .rectangle((cells.length - 1) * this.pitch * 0.5, 0, cells.length * this.pitch, size * 1.08)
      .setStrokeStyle(3, colours.highlight)
      .setVisible(false);
    children.push(selection);

    cells.forEach((cell, position) => {
      const x = position * this.pitch;
      const isLetter = cell !== ' ' && /[\p{L}\p{Nd}]/u.test(cell);
      if (isLetter) {
        const tile = makeTile(this.scene, x, 0, size, colours.tileLocked);
        tiles.push(tile);
        children.push(tile);
      }
      const text = this.scene.add
        .text(x, 0, cell, {
          fontFamily: currentStyle.font,
          fontSize: `${Math.round(size * 0.6)}px`,
          color: hex(isLetter ? colours.text : colours.tileLocked),
        })
        .setOrigin(0.5);
      letters.push(text);
      children.push(text);
    });

    const container = this.scene.add.container(from.x, from.y, children).setDepth(1);
    const handle = this.buildHandle();
    this.rowViews.push({ container, tiles, letters, selection, handle });
  }

  private buildHandle(): Phaser.GameObjects.Container {
    const background = this.scene.add.rectangle(0, 0, 0, 0, colours.tile);
    const lines = this.scene.add.graphics({ lineStyle: { width: 3, color: colours.text } });
    const handle = this.scene.add.container(0, 0, [background, lines]).setDepth(3).setVisible(false);
    this.sizeHandle(handle);
    return handle;
  }

  private sizeHandle(handle: Phaser.GameObjects.Container) {
    const { size } = this.handleRect();
    const [background, lines] = handle.list as [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Graphics];
    background.setSize(size, size);
    lines.clear();
    for (const offset of [-size * 0.2, 0, size * 0.2]) {
      lines.lineBetween(-size * 0.28, offset, size * 0.28, offset);
    }
  }

  private placeEverything() {
    this.rowViews.forEach((view, index) => {
      view.container.setPosition(this.wordX(this.phase.rows[index].columnCell), this.rowY(index));
      view.handle.setPosition(this.handleRect().x, this.rowY(index));
      view.selection.setVisible(this.phase.markedRow === index);
    });
    this.paintFixed();
    if (this.ceremonyDone) this.drawHints();
  }

  // Hints (story 19)

  /** A word the Reveal hint put in place shows its column letter in gold (R6), and its other letters faded (R12). */
  private paintFixed() {
    this.rowViews.forEach((view, index) => {
      const row = this.phase.rows[index];
      if (!row.fixed) return;
      const gold = this.tileAtCell(view, row.cells, row.columnCell);
      paintTile(gold, colours.tileGold);
      view.tiles.forEach((tile) => tile.setAlpha(tile === gold ? 1 : currentStyle.fadedRow));
      view.letters.forEach((letter, cell) => letter.setAlpha(cell === row.columnCell ? 1 : currentStyle.fadedRow));
    });
  }

  /** The buttons along the bottom: Ordering while the rows can be reordered, Reveal once they can't (R2, R7). */
  drawHints() {
    this.hintObjects.forEach((object) => object.destroy());
    this.hintObjects = [];
    this.hintButtons = [];
    if (!this.ceremonyDone || this.phase.won || !this.rules.hints()) return;
    const names: HintButton['name'][] = this.phase.canReorder ? ['ordering'] : ['reveal'];
    const { size } = this.handleRect();
    const gap = size * 0.25;
    const { width, height } = this.scene.scale;
    const total = names.length * size + (names.length - 1) * gap;
    names.forEach((name, index) => {
      const rect = { x: width / 2 - total / 2 + index * (size + gap), y: height - size - this.tile * 0.2, width: size, height: size };
      const enabled = name === 'ordering' ? this.phase.orderingHintAvailable : this.phase.revealHintAvailable;
      const button: HintButton = { name, rect, enabled };
      this.hintButtons.push(button);
      // Above the handles (depth 3).
      this.hintObjects.push(...drawHintButton(this.scene, button, 4));
    });
  }

  private useHint(button: HintButton) {
    if (!button.enabled) return;
    if (button.name === 'ordering') this.orderRows();
    else this.revealWord();
  }

  /** The rows glide into the solution's order, and the handles fade away (R5). */
  private orderRows() {
    const order = this.phase.rows.slice();
    if (!this.phase.orderingHint()) return;
    const views = this.phase.rows.map((row) => this.rowViews[order.indexOf(row)]);
    this.rowViews.splice(0, this.rowViews.length, ...views);
    this.updateSelection();
    this.handlesVisible = false;
    this.rowViews.forEach((view, index) => {
      this.scene.tweens.add({ targets: [view.container, view.handle], y: this.rowY(index), duration: timings.snap * 2, ease: 'Sine.easeInOut' });
      this.scene.tweens.add({ targets: view.handle, alpha: 0, duration: timings.snap * 2, onComplete: () => view.handle.setVisible(false).setAlpha(1) });
    });
    this.drawHints();
    this.scene.time.delayedCall(timings.snap * 2, () => this.checkWin());
  }

  /** A word glides to its column letter, which turns gold, and stays there (R6). */
  private revealWord() {
    const row = this.phase.revealHint();
    if (row === null) return;
    const view = this.rowViews[row];
    this.drawHints();
    this.scene.tweens.add({
      targets: view.container,
      x: this.wordX(this.phase.rows[row].columnCell),
      duration: timings.snap * 2,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.paintFixed();
        this.checkWin();
      },
    });
  }

  private updateSelection() {
    this.rowViews.forEach((view, index) => view.selection.setVisible(this.phase.markedRow === index));
  }

  // Resizing

  onResize() {
    this.cancelPress();
    this.measure();
    this.rowViews.forEach((view, index) => this.rebuildForSize(view, index));
    this.drawColumn();
    this.placeEverything();
    if (this.celebrating) this.jumpToPopup();
    else if (this.popup) this.showPopup(false);
  }

  private rebuildForSize(view: RowView, index: number) {
    const size = this.tile;
    const fontSize = `${Math.round(size * 0.6)}px`;
    const { cells } = this.phase.rows[index];
    let tile = 0;
    cells.forEach((cell, position) => {
      const x = position * this.pitch;
      view.letters[position].setPosition(x, 0).setFontSize(fontSize);
      if (/[\p{L}\p{Nd}]/u.test(cell)) {
        sizeTile(view.tiles[tile].setPosition(x, 0), size);
        tile++;
      }
    });
    view.selection.setPosition((cells.length - 1) * this.pitch * 0.5, 0).setSize(cells.length * this.pitch, size * 1.08);
    this.sizeHandle(view.handle);
  }

  private cancelPress() {
    const press = this.press;
    if (!press) return;
    this.press = null;
    this.scene.tweens.killTweensOf(this.rowViews.map((view) => view.container));
    if (press.kind === 'slide') {
      this.phase.rows[press.row].columnCell = press.before;
    } else {
      this.moveRowView(press.row, press.startOrder);
      this.rowViews[press.startOrder].container.setScale(1).setDepth(1);
    }
    this.placeEverything();
  }

  // Input

  private hitRow(x: number, y: number): number | null {
    for (let row = 0; row < this.rowViews.length; row++) {
      if (Math.abs(y - this.rowY(row)) > this.tile / 2) continue;
      const left = this.rowViews[row].container.x - this.tile / 2;
      const right = left + this.phase.rows[row].cells.length * this.pitch;
      if (x >= left && x <= right) return row;
    }
    return null;
  }

  private hitHandle(x: number, y: number): number | null {
    if (!this.handlesVisible) return null;
    const handle = this.handleRect();
    if (Math.abs(x - handle.x) > handle.size / 2) return null;
    const row = this.rowViews.findIndex((_, index) => Math.abs(y - this.rowY(index)) <= handle.size / 2);
    return row === -1 ? null : row;
  }

  onPointerDown(pointer: Phaser.Input.Pointer) {
    if (this.popupInfo?.buttonRect && this.isInside(this.popupInfo.buttonRect, pointer.x, pointer.y)) {
      this.callbacks.onNextLevel();
      return;
    }
    if (this.press || !this.ceremonyDone || this.phase.won) return;
    const hint = this.hintButtons.find((button) => isInside(button.rect, pointer.x, pointer.y));
    if (hint) {
      this.useHint(hint);
      return;
    }
    const handle = this.hitHandle(pointer.x, pointer.y);
    if (handle !== null && !this.rules.handle(this.phase.rows[handle].word)) return;
    if (handle !== null) {
      this.press = { kind: 'reorder', pointerId: pointer.id, row: handle, startY: pointer.y, startRowY: this.rowY(handle), moved: false, startOrder: handle };
      return;
    }
    const row = this.hitRow(pointer.x, pointer.y);
    // A word the Reveal hint put in place can't slide again (story 19, R6).
    if (row === null || !this.rules.slide(this.phase.rows[row].word) || this.phase.rows[row].fixed) return;
    const position = this.phase.rows[row].columnCell;
    this.press = {
      kind: 'slide',
      pointerId: pointer.id,
      row,
      startX: pointer.x,
      startPosition: position,
      position,
      moved: false,
      lastX: pointer.x,
      lastTime: this.scene.time.now,
      speed: 0,
      before: position,
    };
  }

  private isInside(rect: Rect, x: number, y: number) {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }

  onPointerMove(pointer: Phaser.Input.Pointer) {
    const press = this.press;
    if (!press || press.pointerId !== pointer.id) return;
    if (press.kind === 'slide') this.moveSlide(press, pointer);
    else this.moveReorder(press, pointer);
  }

  private stretched(value: number, low: number, high: number): number {
    if (value < low) return low - Math.min((low - value) * STRETCH_RESISTANCE, STRETCH_LIMIT);
    if (value > high) return high + Math.min((value - high) * STRETCH_RESISTANCE, STRETCH_LIMIT);
    return value;
  }

  private moveSlide(press: Extract<Press, { kind: 'slide' }>, pointer: Phaser.Input.Pointer) {
    if (!press.moved) {
      press.moved = true;
      this.hideSelection();
    }
    const now = this.scene.time.now;
    const elapsed = now - press.lastTime;
    if (elapsed > 0) press.speed = (pointer.x - press.lastX) / elapsed;
    press.lastX = pointer.x;
    press.lastTime = now;

    const { first, last } = this.phase.rangeOf(press.row);
    press.position = this.stretched(press.startPosition - (pointer.x - press.startX) / this.pitch, first, last);
    this.rowViews[press.row].container.x = this.wordX(press.position);
  }

  private hideSelection() {
    this.phase.selectionHidden = true;
    this.updateSelection();
  }

  private moveRowView(from: number, to: number) {
    if (from === to) return;
    this.phase.moveRow(from, to);
    const [moved] = this.rowViews.splice(from, 1);
    this.rowViews.splice(to, 0, moved);
  }

  private moveReorder(press: Extract<Press, { kind: 'reorder' }>, pointer: Phaser.Input.Pointer) {
    const view = this.rowViews[press.row];
    if (!press.moved) {
      press.moved = true;
      this.hideSelection();
      view.container.setScale(RAISED_SCALE).setDepth(2);
    }
    const lastRow = this.rowViews.length - 1;
    const y = press.startRowY + pointer.y - press.startY;
    const position = this.stretched((y - this.rowsTop) / this.pitch, 0, lastRow);
    view.container.y = this.rowsTop + position * this.pitch;
    view.handle.y = view.container.y;

    const slot = Phaser.Math.Clamp(Math.round(position), 0, lastRow);
    if (slot !== press.row && this.rules.slot(this.phase.rows[press.row].word, slot)) {
      this.moveRowView(press.row, slot);
      press.row = slot;
      this.rowViews.forEach((other, index) => {
        if (index === slot) return;
        this.scene.tweens.add({
          targets: [other.container, other.handle],
          y: this.rowY(index),
          duration: timings.rowMakeWay,
        });
      });
    }
  }

  onPointerUp(pointer: Phaser.Input.Pointer) {
    const press = this.press;
    if (!press || press.pointerId !== pointer.id) return;
    this.press = null;
    if (!press.moved) return;
    if (press.kind === 'slide') this.releaseSlide(press);
    else this.releaseRow(press);
  }

  private releaseSlide(press: Extract<Press, { kind: 'slide' }>) {
    // A word that stopped moving before the release isn't a flick.
    const speed = this.scene.time.now - press.lastTime > FLICK_MAX_PAUSE ? 0 : Math.abs(press.speed);
    const glided = speed > FLICK_SPEED;
    const { first, last } = this.phase.rangeOf(press.row);
    const glide = glided ? (press.speed * FLICK_GLIDE_TIME) / this.pitch : 0;
    const target = Phaser.Math.Clamp(press.position - glide, first, last);
    this.phase.snapTo(press.row, target);
    this.settle(press.row, glided);
  }

  private settle(row: number, glided = false) {
    const ease = 'Bounce.easeOut';
    const duration = timings.snap + (glided ? FLICK_GLIDE_TIME : 0);
    this.scene.tweens.add({
      targets: this.rowViews[row].container,
      x: this.wordX(this.phase.rows[row].columnCell),
      duration,
      ease: glided ? 'Sine.easeOut' : ease,
      onComplete: () => this.checkWin(),
    });
  }

  private releaseRow(press: Extract<Press, { kind: 'reorder' }>) {
    const view = this.rowViews[press.row];
    view.container.setScale(1).setDepth(1);
    this.scene.tweens.add({
      targets: [view.container, view.handle],
      y: this.rowY(press.row),
      duration: timings.snap,
      ease: 'Bounce.easeOut',
      onComplete: () => this.checkWin(),
    });
  }

  onKey(event: KeyboardEvent) {
    if (this.popupInfo?.buttonRect && (event.key === 'Enter' || event.key === ' ')) {
      this.callbacks.onNextLevel();
      return;
    }
    if (!this.ceremonyDone || this.press || this.phase.won || !this.rules.keys()) return;
    if (!event.key.startsWith('Arrow')) return;
    event.preventDefault();
    // A move the rules don't allow only selects the row: a slide by Left or Right (story 24, R8), or a row move by
    // Shift with Up or Down (R9).
    const sliding = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
    const target = this.phase.selectedRow ?? 0;
    const word = this.phase.rows[target].word;
    const to = target + (event.key === 'ArrowDown' ? 1 : -1);
    const moving = event.shiftKey && !sliding && to >= 0 && to < this.phase.rows.length;
    if ((sliding && !this.rules.slide(word)) || (moving && (!this.rules.handle(word) || !this.rules.slot(word, to)))) {
      this.select(target);
      return;
    }

    const order = this.phase.rows.slice();
    const moved = this.phase.key(event.key, event.shiftKey);
    const views = this.phase.rows.map((row) => this.rowViews[order.indexOf(row)]);
    this.rowViews.splice(0, this.rowViews.length, ...views);
    this.updateSelection();
    if (!moved) return;

    const row = this.phase.selectedRow!;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      this.settle(row);
      return;
    }
    this.rowViews.forEach((view, index) => {
      this.scene.tweens.add({
        targets: [view.container, view.handle],
        y: this.rowY(index),
        duration: timings.snap,
        ease: 'Bounce.easeOut',
        onComplete: index === row ? () => this.checkWin() : undefined,
      });
    });
  }

  private checkWin() {
    if (this.phase.won) return;
    if (this.phase.checkWin()) {
      this.drawHints();
      this.callbacks.onWon();
    } else {
      this.drawHints();
      this.callbacks.onSettled();
    }
  }

  snapshot(): PhaseTwoSnapshot {
    return this.phase.snapshot();
  }

  /** The instant win (D7): the column spelled the word before any move. */
  checkInstantWin() {
    this.checkWin();
  }

  // Winning

  celebrate() {
    this.phase.selectionHidden = true;
    this.updateSelection();
    this.rowViews.forEach((view, index) => {
      const row = this.phase.rows[index];
      const cell = row.columnCell;
      const letter = view.letters[cell];
      const tile = this.tileAtCell(view, row.cells, cell);
      // Each letter pulses like a locking tile, turning gold at its biggest (D41).
      this.scene.time.delayedCall(index * GOLD_STAGGER, () => {
        this.scene.tweens.add({
          targets: [tile, letter],
          scale: currentStyle.pulseScale,
          duration: timings.lockPulseGrow,
          ease: 'Sine.easeOut',
          onComplete: () => {
            paintTile(tile, colours.tileGold);
            if (index === 0) this.fadeOthers();
            this.scene.tweens.add({ targets: [tile, letter], scale: 1, duration: timings.lockPulseShrink, ease: 'Sine.easeIn' });
          },
        });
      });
    });
    this.celebrating = this.scene.time.delayedCall(timings.popupDelay, () => this.showPopup());
  }

  private tileAtCell(view: RowView, cells: string[], cell: number) {
    const before = cells.slice(0, cell).filter((candidate) => /[\p{L}\p{Nd}]/u.test(candidate)).length;
    return view.tiles[before];
  }

  private fadeOthers() {
    const others: Phaser.GameObjects.GameObject[] = [];
    this.rowViews.forEach((view, index) => {
      const row = this.phase.rows[index];
      const keepTile = this.tileAtCell(view, row.cells, row.columnCell);
      const keepLetter = view.letters[row.columnCell];
      others.push(...view.tiles.filter((tile) => tile !== keepTile), ...view.letters.filter((letter) => letter !== keepLetter), view.handle);
    });
    this.scene.tweens.add({ targets: others, alpha: 0, duration: WIN_FADE });
  }

  private jumpToPopup() {
    this.celebrating?.remove();
    this.showPopup();
  }

  private showPopup(justWon = true) {
    this.celebrating = null;
    this.popup?.destroy(true);
    const targets: Phaser.GameObjects.GameObject[] = [this.column, this.columnSides, this.columnGlass];
    this.rowViews.forEach((view) => targets.push(view.container));
    this.scene.tweens.add({ targets, alpha: 0, duration: WIN_FADE });

    const last = this.nextLevelNumber === null;
    const points = this.callbacks.points();
    const { container, buttonRect, pointsText } = buildPopup(this.scene, this.tile, {
      title: last ? 'All levels complete!' : 'Level complete',
      word: last ? [] : this.phase.rows.map((row) => row.cells[row.columnCell]),
      button: last ? null : `Play Level ${this.nextLevelNumber}`,
      points: last ? undefined : justWon ? points.from : points.to,
    });
    // The old points show for a moment, then the new ones pulse in, like a locking tile (story 20, R11).
    if (pointsText && justWon) {
      this.scene.time.delayedCall(timings.pointsPause, () => {
        if (!pointsText.active) return;
        pointsText.setText(`Points: ${points.to}`);
        this.scene.tweens.add({ targets: pointsText, scale: currentStyle.pulseScale, duration: timings.lockPulseGrow, yoyo: true });
      });
    }
    this.popup = container;
    this.popupInfo = { buttonRect };
    if (justWon) this.callbacks.onPopup();
  }

  destroy() {
    this.hintObjects.forEach((object) => object.destroy());
    this.celebrating?.remove();
    this.column?.destroy();
    this.columnSides?.destroy();
    this.columnGlass?.destroy();
    this.popup?.destroy(true);
    this.rowViews.forEach((view) => {
      view.container.destroy(true);
      view.handle.destroy(true);
    });
  }

  // For tests

  arrange(order: string[], cells: Record<string, number>) {
    order.forEach((word, index) => {
      const from = this.phase.rows.findIndex((row) => row.word === word);
      this.moveRowView(from, index);
    });
    this.phase.rows.forEach((row) => {
      if (cells[row.word] !== undefined) row.columnCell = cells[row.word];
    });
    this.placeEverything();
  }

  select(row: number) {
    this.phase.selectedRow = row;
    this.phase.selectionHidden = false;
    this.updateSelection();
  }

  testView(): PhaseTwoTestView {
    const handle = this.handleRect();
    const rows = this.phase.rows.length;
    return {
      column: {
        x: this.columnX - this.tile / 2,
        y: this.rowsTop - this.tile / 2,
        width: this.tile,
        height: rows * this.pitch - this.tile * GAP,
      },
      rows: this.rowViews.map((view, index) => ({
        word: this.phase.rows[index].word,
        columnCell: this.phase.rows[index].columnCell,
        x: view.container.x,
        y: view.container.y,
        scale: view.container.scale,
        depth: view.container.depth,
        selected: view.selection.visible,
        fixed: !!this.phase.rows[index].fixed,
      })),
      handles: this.rowViews.map((view) => ({
        x: handle.x - handle.size / 2,
        y: view.handle.y - handle.size / 2,
        width: handle.size,
        height: handle.size,
      })),
      handlesVisible: this.rowViews.some((view) => view.handle.visible),
      hints: this.hintButtons.map((button) => ({ ...button, rect: { ...button.rect } })),
      ceremonyDone: this.ceremonyDone,
      columnText: this.phase.columnText(),
      won: this.phase.won,
      dragging: this.press !== null,
      popup: this.popupInfo,
    };
  }
}
