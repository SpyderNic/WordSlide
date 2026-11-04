import { cellsOf, compareCells, isCharacter } from './characters';
import { rowOrder, startingCells, startingPool, type Cell, type Level, type PoolTile } from './level';

export interface RowState {
  /** The answer designed for this row. An answer made of the same letters can lock here too (D8, story 23 R6). */
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

/** The board after the last change that settled. A drag is never part of it (story 11, R10). */
export interface BoardSnapshot {
  rows: { cells: Cell[]; locked: boolean }[];
  /** Each row's own pool (story 23, R1). */
  pools: PoolTile[][];
  unlocked: string[];
  lockedIn: [string, number][];
  selected: number | null;
}

export type DragSource = 'pool' | { row: number; cell: number };

export interface Drag {
  character: string;
  source: DragSource;
  /** The row whose letter it is: a letter only goes back to its own row's pool, or into its own row (story 23, R5). */
  row: number;
}

const isFixedCell = (cell: Cell) => cell.kind === 'revealed' || cell.kind === 'special' || cell.kind === 'locked';
const cellCharacter = (cell: Cell) => (cell.kind === 'empty' ? null : cell.character);

function baseOf(character: string): string {
  return character.normalize('NFD').replace(/\p{M}/gu, '');
}

/** The state of phase one. Pure logic: nothing here knows about the screen. */
export class Board {
  readonly rows: RowState[];
  /** One pool per row, with that row's answer's letters (story 23, R1). */
  private readonly pools: PoolTile[][];
  private readonly unlocked: string[];
  private readonly lockedIn = new Map<string, number>();

  /** A row is always selected in phase one (story 23, R2). */
  selectedRow: number | null = 0;
  drag: Drag | null = null;
  phaseOneOver = false;

  constructor(level: Level) {
    const answers = rowOrder(level.answers);
    this.rows = answers.map((answer) => ({ word: answer.word, cells: startingCells(answer), locked: false }));
    // A row's pool has its answer's letters minus revealed ones, so a letter that's only revealed has no tile (story 23, R1).
    this.pools = answers.map((answer) => startingPool([answer]).filter((tile) => tile.count > 0));
    this.unlocked = answers.map((answer) => answer.word);
  }

  /** The selected row's pool: the only one on screen. */
  get pool(): PoolTile[] {
    return this.selectedRow === null ? [] : this.pools[this.selectedRow];
  }

  snapshot(): BoardSnapshot {
    return structuredClone({
      rows: this.rows.map((row) => ({ cells: row.cells, locked: row.locked })),
      pools: this.pools,
      unlocked: this.unlocked,
      lockedIn: [...this.lockedIn],
      selected: this.selectedRow,
    });
  }

  /** A saved board for this level, or null if it doesn't match the level. */
  static restore(level: Level, snapshot: BoardSnapshot): Board | null {
    const board = new Board(level);
    const rows = snapshot?.rows;
    if (!Array.isArray(rows) || rows.length !== board.rows.length) return null;
    if (rows.some((row, index) => !Array.isArray(row?.cells) || row.cells.length !== board.rows[index].cells.length)) return null;
    // A board saved before each row had its own pool starts again.
    if (!Array.isArray(snapshot.pools) || snapshot.pools.length !== board.rows.length) return null;
    const saved = structuredClone(snapshot);
    saved.rows.forEach((row, index) => {
      board.rows[index].cells = row.cells;
      board.rows[index].locked = row.locked;
      board.pools[index].splice(0, board.pools[index].length, ...saved.pools[index]);
    });
    board.unlocked.splice(0, board.unlocked.length, ...saved.unlocked);
    saved.lockedIn.forEach(([word, row]) => board.lockedIn.set(word, row));
    board.phaseOneOver = board.unlocked.length === 0;
    const selected = saved.selected;
    board.selectedRow = board.phaseOneOver ? null : selected !== null && board.rows[selected] && !board.rows[selected].locked ? selected : board.topUnfinished();
    return board;
  }

  private topUnfinished(): number | null {
    const row = this.rows.findIndex((candidate) => !candidate.locked);
    return row === -1 ? null : row;
  }

  countOf(character: string): number {
    return this.pool.find((tile) => tile.character === character)?.count ?? 0;
  }

  private changeCount(row: number, character: string, change: number) {
    const pool = this.pools[row];
    const tile = pool.find((candidate) => candidate.character === character);
    if (tile) {
      tile.count += change;
    } else {
      pool.push({ character, count: change });
      pool.sort((a, b) => compareCells(a.character, b.character));
    }
  }

  isCellFixed(row: number, cell: number): boolean {
    return this.rows[row].locked || isFixedCell(this.rows[row].cells[cell]);
  }

  private isFull(row: number): boolean {
    return this.rows[row].cells.every((cell) => cell.kind !== 'empty');
  }

  private wordIn(row: number): string {
    return this.rows[row].cells.map(cellCharacter).join('');
  }

  /** Whether the selected row has letters to recall (story 23, R13). */
  hasPlacedLetters(): boolean {
    const row = this.selectedRow === null ? null : this.rows[this.selectedRow];
    return !!row && !row.locked && row.cells.some((cell) => cell.kind === 'placed');
  }

  // Dragging

  pickUpFromPool(character: string): boolean {
    if (this.drag || this.selectedRow === null || this.countOf(character) === 0) return false;
    this.changeCount(this.selectedRow, character, -1);
    this.drag = { character, source: 'pool', row: this.selectedRow };
    return true;
  }

  /** A placed letter in another row selects that row as it's picked up. */
  pickUpFromCell(row: number, cell: number): boolean {
    const target = this.rows[row].cells[cell];
    if (this.drag || this.rows[row].locked || target.kind !== 'placed') return false;
    this.selectedRow = row;
    this.drag = { character: target.character, source: { row, cell }, row };
    this.rows[row].cells[cell] = { kind: 'empty' };
    return true;
  }

  dropOnCell(row: number, cell: number): BoardEvent[] {
    const drag = this.drag;
    if (!drag) return [];
    this.drag = null;

    // A letter only goes into its own row (story 23, R5). Anywhere else, it goes back to the pool.
    if (row !== drag.row || this.isCellFixed(row, cell)) {
      this.changeCount(drag.row, drag.character, 1);
      return [];
    }

    const target = this.rows[row].cells[cell];
    this.rows[row].cells[cell] = { kind: 'placed', character: drag.character };

    if (target.kind === 'placed') {
      if (drag.source === 'pool') this.changeCount(row, target.character, 1);
      else this.rows[row].cells[drag.source.cell] = target;
    }
    return this.check(row);
  }

  /** Released away from any cell, or on the pool. */
  dropAway() {
    if (!this.drag) return;
    this.changeCount(this.drag.row, this.drag.character, 1);
    this.drag = null;
  }

  /** A rotation puts the letter back where it came from (D29). */
  cancelDrag() {
    const drag = this.drag;
    if (!drag) return;
    this.drag = null;
    if (drag.source === 'pool') {
      this.changeCount(drag.row, drag.character, 1);
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

/** A row is checked once it's full, and locks all at once or not at all (story 23, R14). A wrong row stays selected (R7). */
  private check(row: number): BoardEvent[] {
    if (this.rows[row].locked || !this.isFull(row)) return [];
    const word = this.wordIn(row);
    const lockedRow = this.lockedIn.get(word);
    if (this.unlocked.includes(word)) return this.lock(row, word);
    return [lockedRow !== undefined ? { type: 'alreadyFound', row, lockedRow } : { type: 'wrong', row }];
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
    } else {
      this.moveSelectionOn(row);
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
        if (cell.kind !== 'revealed' && cell.kind !== 'locked') return cell;
        letters.push(cell.character);
        this.changeCount(index, cell.character, 1);
        return { kind: 'empty' };
      });
      if (letters.length > 0) events.push({ type: 'hintsReturned', row: index, letters });
    });
    return events;
  }

  // Recall All

  /** Empties the selected row (story 23, R13). */
  recallAll(): boolean {
    if (this.drag || !this.hasPlacedLetters()) return false;
    const index = this.selectedRow!;
    const row = this.rows[index];
    row.cells = row.cells.map((cell) => {
      if (cell.kind !== 'placed') return cell;
      this.changeCount(index, cell.character, 1);
      return { kind: 'empty' };
    });
    return true;
  }

  // Selecting, tapping and typing

  /** The selected row always shows (story 23, R2). */
  get markedRow(): number | null {
    return this.selectedRow;
  }

  selectRow(row: number) {
    if (this.drag || this.rows[row].locked) return;
    this.selectedRow = row;
  }

  /** After a lock: the next unfinished row below, wrapping to the top (story 23, R8). */
  private moveSelectionOn(from: number) {
    for (let step = 1; step <= this.rows.length; step++) {
      const row = (from + step) % this.rows.length;
      if (!this.rows[row].locked) {
        this.selectedRow = row;
        return;
      }
    }
    this.selectedRow = null;
  }

  /** Tapping a pool letter, or a key that has found its tile: it goes to the selected row's first empty cell. */
  input(character: string): BoardEvent[] {
    const row = this.selectedRow;
    if (this.drag || row === null || this.countOf(character) === 0) return [];
    const cell = this.rows[row].cells.findIndex((candidate) => candidate.kind === 'empty');
    if (this.rows[row].locked || cell === -1) return [];
    this.changeCount(row, character, -1);
    this.rows[row].cells[cell] = { kind: 'placed', character };
    return this.check(row);
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

  /** Takes back the selected row's last placed letter (story 23, R9). */
  private backspace() {
    const row = this.selectedRow;
    if (row === null || this.rows[row].locked) return;
    const cell = this.rows[row].cells.findLastIndex((candidate) => candidate.kind === 'placed');
    if (cell === -1) return;
    const placed = this.rows[row].cells[cell] as { character: string };
    this.changeCount(row, placed.character, 1);
    this.rows[row].cells[cell] = { kind: 'empty' };
  }

  private moveSelection(direction: 1 | -1) {
    if (this.selectedRow === null) {
      this.selectedRow = this.topUnfinished();
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
