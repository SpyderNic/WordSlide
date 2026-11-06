import type { Board } from './board';
import { cellsOf } from './characters';
import { rowOrder, type Level } from './level';
import type { PhaseTwo } from './phaseTwo';
import { validateLevel } from './validator';

/**
 * Level 1 walks the player through the game, one step at a time (D43, M05-03).
 * The steps come from the level's solution, so a new tutorial level needs no new code.
 * Reordering has its own tutorial, on the first level that needs it (M05-04): its one step is "reorder".
 */
export type TutorialStep = 1 | 2 | 3 | 'reorder';

export interface TutorialPlan {
  /** Step 1: the top word's empty cells, and the letters they take. */
  first: { row: number; cells: number[]; letters: string[] };
  /** Step 3: the one word that slides, and the cell that goes in the column. */
  slide: { word: string; cell: number };
}

export function tutorialPlan(level: Level): TutorialPlan | null {
  const solution = validateLevel(level).solution;
  if (!solution) return null;
  const top = rowOrder(level.answers)[0];
  const revealed = new Set((top.revealed ?? []).map((letter) => letter.position - 1));
  const letters = cellsOf(top.word);
  const cells = letters.flatMap((letter, index) => (revealed.has(index) || !/[\p{L}\p{Nd}]/u.test(letter) ? [] : [index]));

  // The one word whose column letter isn't its first.
  const sliding = solution.find((step) => step.position !== 1 + cellsOf(step.word).findIndex((cell) => /[\p{L}\p{Nd}]/u.test(cell)));
  if (!sliding) return null;
  return {
    first: { row: 0, cells, letters: cells.map((cell) => letters[cell]) },
    slide: { word: sliding.word, cell: sliding.position - 1 },
  };
}

/** Which step the board is at, worked out from the board, so reopening carries on at the same step. */
export function tutorialStep(plan: TutorialPlan, board: Board, phase: PhaseTwo | null): TutorialStep | null {
  if (!phase) return board.rows[plan.first.row].locked ? 2 : 1;
  if (phase.won) return null;
  return 3;
}

/** The reordering tutorial's one move: a row, by its handle, from one slot to another. */
export interface ReorderingMove {
  word: string;
  from: number;
  to: number;
}

/** The first move towards the designed order: the top-most row that isn't in its slot goes to it (M05-04, Q11). */
export function firstReorderingMove(rows: string[], order: string[]): ReorderingMove | null {
  const from = rows.findIndex((word, row) => order[row] !== word);
  if (from === -1) return null;
  return { word: rows[from], from, to: order.indexOf(rows[from]) };
}
