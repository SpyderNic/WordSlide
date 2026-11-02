import { cellsOf, isCharacter } from './characters';

export interface SlidingRow {
  /** The word in this row, which may not be the row's designed answer (D8). */
  word: string;
  cells: string[];
  /** Which of the word's cells is in the column. Always a letter (story 8, R5). */
  columnCell: number;
}

/** Each word in row order, and which of its cells is in the column (story 11, R10). */
export interface PhaseTwoSnapshot {
  words: string[];
  cells: number[];
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
    /** Handles only appear once the reordering tutorial has been shown (D45). */
    readonly canReorder = true,
  ) {
    this.rows = words.map((word) => {
      const cells = cellsOf(word);
      return { word, cells, columnCell: cells.findIndex(isCharacter) };
    });
  }

  snapshot(): PhaseTwoSnapshot {
    return { words: this.rows.map((row) => row.word), cells: this.rows.map((row) => row.columnCell) };
  }

  /** Saved positions for these words, or null if they don't match. */
  static restore(snapshot: PhaseTwoSnapshot, words: string[], finalWord: string, canReorder = true): PhaseTwo | null {
    const saved = snapshot?.words;
    if (!Array.isArray(saved) || saved.length !== words.length || [...saved].sort().join() !== [...words].sort().join()) return null;
    const phase = new PhaseTwo(saved, finalWord, canReorder);
    const cells = snapshot.cells ?? [];
    phase.rows.forEach((row, index) => {
      if (phase.letterCells(index).includes(cells[index])) row.columnCell = cells[index];
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

  /** Called once a word or row has settled, never during a drag (story 10, R1). */
  checkWin(): boolean {
    if (this.columnText() === this.finalWord) this.won = true;
    return this.won;
  }

  private slideOneLetter(direction: 1 | -1) {
    const row = this.selectedRow!;
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
