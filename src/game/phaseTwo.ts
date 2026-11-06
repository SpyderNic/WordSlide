import { cellsOf, isCharacter } from './characters';

export interface SlidingRow {
  /** The word in this row, which may not be the row's designed answer (D8). */
  word: string;
  cells: string[];
  /** Which of the word's cells is in the column. Always a letter (M04-02, R5). */
  columnCell: number;
  /** Put in place by the Reveal hint: gold, and it can't slide again (M07-01, R6). */
  fixed?: boolean;
}

/** Each word in row order, and which of its cells is in the column (M05-01, R10). */
export interface PhaseTwoSnapshot {
  words: string[];
  cells: number[];
  /** Rows the Reveal hint fixed (M07-01, R9). */
  fixed?: boolean[];
  /** The Ordering hint was used: the order is fixed, and the handles are gone. */
  ordered?: boolean;
}

/** The state of phase two. Pure logic: nothing here knows about the screen. */
export class PhaseTwo {
  readonly rows: SlidingRow[];
  selectedRow: number | null = null;
  selectionHidden = false;
  won = false;

  constructor(
    words: string[],
    private readonly finalWord: string,
    /** Handles only appear once reordering has been taught (D45), and go after the Ordering hint (M07-01, R5). */
    public canReorder = true,
  ) {
    this.rows = words.map((word) => {
      const cells = cellsOf(word);
      return { word, cells, columnCell: cells.findIndex(isCharacter) };
    });
  }

  snapshot(): PhaseTwoSnapshot {
    return { words: this.rows.map((row) => row.word), cells: this.rows.map((row) => row.columnCell), fixed: this.rows.map((row) => !!row.fixed), ordered: this.ordered };
  }

  /** Whether the Ordering hint has fixed the order. */
  ordered = false;

  /** The rows stay in the order they're in: no more reordering (M07-03, R13). Saved like the Ordering hint's. */
  fixOrder() {
    this.canReorder = false;
    this.ordered = true;
  }

  /** Saved positions for these words, or null if they don't match. */
  static restore(snapshot: PhaseTwoSnapshot, words: string[], finalWord: string, canReorder = true): PhaseTwo | null {
    const saved = snapshot?.words;
    if (!Array.isArray(saved) || saved.length !== words.length || [...saved].sort().join() !== [...words].sort().join()) return null;
    const phase = new PhaseTwo(saved, finalWord, canReorder && !snapshot.ordered);
    phase.ordered = !!snapshot.ordered;
    const cells = snapshot.cells ?? [];
    phase.rows.forEach((row, index) => {
      if (phase.letterCells(index).includes(cells[index])) row.columnCell = cells[index];
      if (snapshot.fixed?.[index]) row.fixed = true;
    });
    return phase;
  }

  private letterCells(row: number): number[] {
    const { cells } = this.rows[row];
    return cells.flatMap((cell, index) => (isCharacter(cell) ? [index] : []));
  }

  /** The first and last cells that can be in the column (D13). */
  rangeOf(row: number): { first: number; last: number } {
    const letters = this.letterCells(row);
    return { first: letters[0], last: letters[letters.length - 1] };
  }

  /** A word snaps to its nearest letter. A position between cells is allowed here. */
  nearestLetter(row: number, position: number): number {
    return this.letterCells(row).reduce((nearest, cell) =>
      Math.abs(cell - position) < Math.abs(nearest - position) ? cell : nearest,
    );
  }

  snapTo(row: number, position: number) {
    this.rows[row].columnCell = this.nearestLetter(row, position);
  }

  get markedRow(): number | null {
    return this.selectionHidden ? null : this.selectedRow;
  }

  /** A word's row can change, so the selection follows the word. */
  moveRow(from: number, to: number) {
    if (!this.canReorder || from === to) return;
    const selected = this.selectedRow === null ? null : this.rows[this.selectedRow];
    const [moved] = this.rows.splice(from, 1);
    this.rows.splice(to, 0, moved);
    if (selected) this.selectedRow = this.rows.indexOf(selected);
  }

  columnText(): string {
    return this.rows.map((row) => row.cells[row.columnCell]).join('');
  }

  // Hints (M07-01)

  private spells(order: SlidingRow[]): boolean {
    const letters = cellsOf(this.finalWord);
    return order.every((row, index) => row.cells.includes(letters[index]));
  }

  /** Every order of the rows that can spell the final word. */
  private solutionOrders(): SlidingRow[][] {
    const orders: SlidingRow[][] = [];
    const build = (left: SlidingRow[], taken: SlidingRow[]) => {
      if (left.length === 0) {
        if (this.spells(taken)) orders.push(taken);
        return;
      }
      left.forEach((row, index) => build([...left.slice(0, index), ...left.slice(index + 1)], [...taken, row]));
    };
    build(this.rows, []);
    return orders;
  }

  get orderingHintAvailable(): boolean {
    return this.canReorder && !this.won;
  }

  /**
   * Puts the rows in the order that needs the fewest moves, and fixes it: no more handles (M07-01, R5, Q3). Rows
   * already in order just lose their handles.
   */
  orderingHint(): boolean {
    if (!this.orderingHintAvailable) return false;
    const moves = (order: SlidingRow[]) => order.filter((row, index) => this.rows[index] !== row).length;
    const best = this.solutionOrders().sort((a, b) => moves(a) - moves(b))[0];
    const selected = this.selectedRow === null ? null : this.rows[this.selectedRow];
    if (best) this.rows.splice(0, this.rows.length, ...best);
    if (selected) this.selectedRow = this.rows.indexOf(selected);
    this.canReorder = false;
    this.ordered = true;
    return true;
  }

  /** Rows whose column letter isn't right yet, and that can be put right where they are. */
  private revealable(): number[] {
    const letters = cellsOf(this.finalWord);
    return this.rows.flatMap((row, index) => (!row.fixed && row.cells[row.columnCell] !== letters[index] && row.cells.includes(letters[index]) ? [index] : []));
  }

  /** Only when the rows can't be reordered (M07-01, R7). */
  get revealHintAvailable(): boolean {
    return !this.canReorder && !this.won && this.revealable().length > 0;
  }

  /**
   * Slides a word, picked at random among those not right yet (Q4), to its column letter, the nearer one if it has
   * two, and fixes it there (R6). Returns the row, or null.
   */
  revealHint(random: () => number = Math.random): number | null {
    if (!this.revealHintAvailable) return null;
    const candidates = this.revealable();
    const index = candidates[Math.floor(random() * candidates.length)];
    const row = this.rows[index];
    const letter = cellsOf(this.finalWord)[index];
    const places = row.cells.flatMap((cell, position) => (cell === letter ? [position] : []));
    row.columnCell = places.reduce((nearest, place) => (Math.abs(place - row.columnCell) < Math.abs(nearest - row.columnCell) ? place : nearest));
    row.fixed = true;
    return index;
  }

  /** Called once a word or row has settled, never during a drag (M04-04, R1). */
  checkWin(): boolean {
    if (this.columnText() === this.finalWord) this.won = true;
    return this.won;
  }

  private slideOneLetter(direction: 1 | -1) {
    const row = this.selectedRow!;
    if (this.rows[row].fixed) return;
    const letters = this.letterCells(row);
    const next = letters[letters.indexOf(this.rows[row].columnCell) + direction];
    if (next !== undefined) this.rows[row].columnCell = next;
  }

  /** Returns true if a word or row moved. */
  key(key: string, shift: boolean): boolean {
    if (this.won || !key.startsWith('Arrow')) return false;
    const firstSelection = this.selectedRow === null;
    this.selectionHidden = false;
    this.selectedRow ??= 0;
    const row = this.selectedRow;
    const before = JSON.stringify(this.rows);

    if (key === 'ArrowLeft') this.slideOneLetter(1);
    else if (key === 'ArrowRight') this.slideOneLetter(-1);
    else {
      const direction = key === 'ArrowDown' ? 1 : -1;
      if (shift) {
        const target = row + direction;
        if (target >= 0 && target < this.rows.length) this.moveRow(row, target);
      } else if (!firstSelection) {
        const count = this.rows.length;
        this.selectedRow = (row + direction + count) % count;
      }
    }
    return JSON.stringify(this.rows) !== before;
  }
}
