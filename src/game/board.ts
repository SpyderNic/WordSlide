import { cellsOf, compareCells, isCharacter } from './characters';
import { rowOrder, startingCells, startingPool, type Cell, type Level, type PoolTile } from './level';

export interface RowState {
  /** The answer designed for this row. Any answer that fits can lock here (D8). */
  word: string;
  cells: Cell[];
  locked: boolean;
}

export type BoardEvent =
  | { type: 'locked'; row: number; word: string }
  | { type: 'wrong'; row: number }
  | { type: 'alreadyFound'; row: number; lockedRow: number }
  | { type: 'hintsReturned'; row: number; letters: string[] }
  | { type: 'phaseOneOver' };

export type DragSource = 'pool' | { row: number; cell: number };

export interface Drag {
  character: string;
  source: DragSource;
}

const isFixedCell = (cell: Cell) => cell.kind === 'revealed' || cell.kind === 'special';
const cellCharacter = (cell: Cell) => (cell.kind === 'empty' ? null : cell.character);

function baseOf(character: string): string {
  return character.normalize('NFD').replace(/\p{M}/gu, '');
}

/** The state of phase one. Pure logic: nothing here knows about the screen. */
export class Board {
  readonly rows: RowState[];
  readonly pool: PoolTile[];
  private readonly unlocked: string[];
  private readonly lockedIn = new Map<string, number>();

  selectedRow: number | null = null;
  selectionHidden = false;
  drag: Drag | null = null;
  phaseOneOver = false;

  constructor(level: Level) {
    const answers = rowOrder(level.answers);
    this.rows = answers.map((answer) => ({ word: answer.word, cells: startingCells(answer), locked: false }));
    this.pool = startingPool(level.answers);
    this.unlocked = answers.map((answer) => answer.word);
  }

  countOf(character: string): number {
    return this.pool.find((tile) => tile.character === character)?.count ?? 0;
  }

  private changeCount(character: string, change: number) {
    const tile = this.pool.find((candidate) => candidate.character === character);
    if (tile) {
      tile.count += change;
    } else {
      this.pool.push({ character, count: change });
      this.pool.sort((a, b) => compareCells(a.character, b.character));
    }
  }

  isCellFixed(row: number, cell: number): boolean {
    return this.rows[row].locked || isFixedCell(this.rows[row].cells[cell]);
  }

  private isFull(row: number): boolean {
    return this.rows[row].cells.every((cell) => cell.kind !== 'empty');
  }

  private hasEmptyCell(row: number): boolean {
    return !this.rows[row].locked && !this.isFull(row);
  }

  private wordIn(row: number): string {
    return this.rows[row].cells.map(cellCharacter).join('');
  }

  hasPlacedLetters(): boolean {
    return this.rows.some((row) => !row.locked && row.cells.some((cell) => cell.kind === 'placed'));
  }

  // Dragging

  pickUpFromPool(character: string): boolean {
    if (this.drag || this.countOf(character) === 0) return false;
    this.changeCount(character, -1);
    this.drag = { character, source: 'pool' };
    this.selectionHidden = true;
    return true;
  }

  pickUpFromCell(row: number, cell: number): boolean {
    const target = this.rows[row].cells[cell];
    if (this.drag || this.rows[row].locked || target.kind !== 'placed') return false;
    this.drag = { character: target.character, source: { row, cell } };
    this.rows[row].cells[cell] = { kind: 'empty' };
    this.selectionHidden = true;
    return true;
  }

  dropOnCell(row: number, cell: number): BoardEvent[] {
    const drag = this.drag;
    if (!drag) return [];
    this.drag = null;

    if (this.isCellFixed(row, cell)) {
      this.changeCount(drag.character, 1);
      return [];
    }

    const target = this.rows[row].cells[cell];
    this.rows[row].cells[cell] = { kind: 'placed', character: drag.character };
    const touched = [row];

    if (target.kind === 'placed') {
      if (drag.source === 'pool') {
        this.changeCount(target.character, 1);
      } else {
        this.rows[drag.source.row].cells[drag.source.cell] = target;
        touched.push(drag.source.row);
      }
    }
    return this.afterDrop(touched);
  }

  private afterDrop(touched: number[]): BoardEvent[] {
    const events = this.check(touched);
    const selected = this.selectedRow;
    if (selected !== null && this.rows[selected].locked) this.moveSelectionOn(selected);
    return events;
  }

  /** Released away from any cell, or on the pool. */
  dropAway() {
    if (!this.drag) return;
    this.changeCount(this.drag.character, 1);
    this.drag = null;
  }

  /** A rotation puts the letter back where it came from (D29). */
  cancelDrag() {
    const drag = this.drag;
    if (!drag) return;
    this.drag = null;
    if (drag.source === 'pool') {
      this.changeCount(drag.character, 1);
    } else {
      this.rows[drag.source.row].cells[drag.source.cell] = { kind: 'placed', character: drag.character };
    }
  }

  // Checking

  private fits(word: string, row: RowState): boolean {
    const cells = cellsOf(word);
    return (
      cells.length === row.cells.length &&
      row.cells.every((cell, index) => !isFixedCell(cell) || cellCharacter(cell) === cells[index])
    );
  }

  private check(rows: number[]): BoardEvent[] {
    const events: BoardEvent[] = [];
    for (const row of [...new Set(rows)].sort((a, b) => a - b)) {
      if (this.rows[row].locked || !this.isFull(row)) continue;
      const word = this.wordIn(row);
      const lockedRow = this.lockedIn.get(word);
      if (this.unlocked.includes(word)) {
        events.push(...this.lock(row, word));
      } else if (lockedRow !== undefined) {
        events.push({ type: 'alreadyFound', row, lockedRow });
      } else {
        events.push({ type: 'wrong', row });
      }
    }
    return events;
  }

  private lock(row: number, word: string): BoardEvent[] {
    this.rows[row].locked = true;
    this.unlocked.splice(this.unlocked.indexOf(word), 1);
    this.lockedIn.set(word, row);
    const events: BoardEvent[] = [{ type: 'locked', row, word }, ...this.returnStrandedHints()];
    if (this.unlocked.length === 0) {
      this.phaseOneOver = true;
      this.selectedRow = null;
      events.push({ type: 'phaseOneOver' });
    }
    return events;
  }

  /** D9: hints go back when no remaining answer can fit their row. Special characters stay (D18). */
  private returnStrandedHints(): BoardEvent[] {
    const events: BoardEvent[] = [];
    this.rows.forEach((row, index) => {
      if (row.locked || this.unlocked.some((word) => this.fits(word, row))) return;
      const letters: string[] = [];
      row.cells = row.cells.map((cell) => {
        if (cell.kind !== 'revealed') return cell;
        letters.push(cell.character);
        this.changeCount(cell.character, 1);
        return { kind: 'empty' };
      });
      if (letters.length > 0) events.push({ type: 'hintsReturned', row: index, letters });
    });
    return events;
  }

  // Recall All

  recallAll(): boolean {
    if (this.drag || !this.hasPlacedLetters()) return false;
    for (const row of this.rows) {
      if (row.locked) continue;
      row.cells = row.cells.map((cell) => {
        if (cell.kind !== 'placed') return cell;
        this.changeCount(cell.character, 1);
        return { kind: 'empty' };
      });
    }
    return true;
  }

  // Selecting, tapping and typing

  get markedRow(): number | null {
    return this.selectionHidden ? null : this.selectedRow;
  }

  selectRow(row: number) {
    if (this.drag || this.rows[row].locked) return;
    this.selectedRow = row;
    this.selectionHidden = false;
  }

  private moveSelectionOn(from: number) {
    for (let step = 1; step < this.rows.length; step++) {
      const row = (from + step) % this.rows.length;
      if (this.hasEmptyCell(row)) {
        this.selectedRow = row;
        return;
      }
    }
    if (this.rows[from].locked) {
      const next = this.rows.findIndex((row) => !row.locked);
      this.selectedRow = next === -1 ? null : next;
    }
  }

  /** Tapping a pool letter, or a key that has found its tile. */
  input(character: string): BoardEvent[] {
    if (this.drag || this.countOf(character) === 0) return [];

    if (this.selectedRow === null) {
      const top = this.rows.findIndex((_, row) => this.hasEmptyCell(row));
      if (top === -1) return [];
      this.selectedRow = top;
    }
    if (!this.hasEmptyCell(this.selectedRow)) {
      this.moveSelectionOn(this.selectedRow);
      if (this.selectedRow === null || !this.hasEmptyCell(this.selectedRow)) return [];
    }
    this.selectionHidden = false;

    const row = this.selectedRow;
    const cell = this.rows[row].cells.findIndex((candidate) => candidate.kind === 'empty');
    this.changeCount(character, -1);
    this.rows[row].cells[cell] = { kind: 'placed', character };

    const events = this.check([row]);
    if (this.selectedRow !== null && this.isFull(row)) this.moveSelectionOn(row);
    return events;
  }

  /** Exact keys first. A plain key falls back to its accented letters (story 17, R14). */
  private tileForKey(key: string): string | null {
    const character = key.toUpperCase();
    if (!isCharacter(character) || Array.from(character).length !== 1) return null;
    if (this.countOf(character) > 0) return character;
    if (baseOf(character) !== character) return null;
    return this.pool.find((tile) => tile.count > 0 && baseOf(tile.character) === character)?.character ?? null;
  }

  key(key: string): BoardEvent[] {
    if (this.drag) return [];
    if (key === 'Backspace') this.backspace();
    else if (key === 'ArrowUp') this.moveSelection(-1);
    else if (key === 'ArrowDown') this.moveSelection(1);
    else {
      const character = this.tileForKey(key);
      if (character) return this.input(character);
    }
    return [];
  }

  private rightmostPlaced(row: number): number {
    return this.rows[row].cells.findLastIndex((cell) => cell.kind === 'placed');
  }

  private backspace() {
    if (this.selectedRow === null) return;
    for (let row = this.selectedRow; row >= 0; row--) {
      if (this.rows[row].locked) continue;
      const cell = this.rightmostPlaced(row);
      if (cell === -1) continue;
      const placed = this.rows[row].cells[cell] as { character: string };
      this.changeCount(placed.character, 1);
      this.rows[row].cells[cell] = { kind: 'empty' };
      this.selectedRow = row;
      this.selectionHidden = false;
      return;
    }
  }

  private moveSelection(direction: 1 | -1) {
    this.selectionHidden = false;
    if (this.selectedRow === null) {
      const top = this.rows.findIndex((row) => !row.locked);
      this.selectedRow = top === -1 ? null : top;
      return;
    }
    const count = this.rows.length;
    for (let step = 1; step < count; step++) {
      const row = (this.selectedRow + direction * step + count * step) % count;
      if (!this.rows[row].locked) {
        this.selectedRow = row;
        return;
      }
    }
  }
}
