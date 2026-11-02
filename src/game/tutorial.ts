import type { Board } from './board';
import { cellsOf } from './characters';
import { rowOrder, type Level } from './level';
import type { PhaseTwo } from './phaseTwo';
import { validateLevel } from './validator';

/**
 * Level 1 walks the player through the game, one step at a time (D43, story 12).
 * The steps come from the level's solution, so a new tutorial level needs no new code.
 */
export type TutorialStep = 1 | 2 | 3 | 4;

export interface TutorialPlan {
  /** Step 1: the top word's empty cells, and the letters they take. */
  first: { row: number; cells: number[]; letters: string[] };
  /** Step 3: the one row that moves, by its handle, and the slot it goes to. */
  move: { word: string; from: number; to: number };
  /** Step 4: the one word that slides, and the cell that goes in the column. */
  slide: { word: string; cell: number };
}

export function tutorialPlan(level: Level): TutorialPlan | null {
  const solution = validateLevel(level).solution;
  if (!solution) return null;
  const rows = rowOrder(level.answers).map((answer) => answer.word);
  const top = rowOrder(level.answers)[0];
  const revealed = new Set((top.revealed ?? []).map((letter) => letter.position - 1));
  const letters = cellsOf(top.word);
  const cells = letters.flatMap((letter, index) => (revealed.has(index) || !/[\p{L}\p{Nd}]/u.test(letter) ? [] : [index]));

  // The one move that puts the rows in the solution's order. The top-most row moves if more than one could.
  const order = solution.map((step) => step.word);
  let move: TutorialPlan['move'] | null = null;
  for (let from = 0; from < rows.length && !move; from++) {
    for (let to = 0; to < rows.length; to++) {
      if (to === from) continue;
      const moved = [...rows];
      const [word] = moved.splice(from, 1);
      moved.splice(to, 0, word);
      if (moved.join() === order.join()) {
        move = { word, from, to };
        break;
      }
    }
  }
  // The one word whose column letter isn't its first.
  const sliding = solution.find((step) => step.position !== 1 + cellsOf(step.word).findIndex((cell) => /[\p{L}\p{Nd}]/u.test(cell)));
  if (!move || !sliding) return null;
  return {
    first: { row: 0, cells, letters: cells.map((cell) => letters[cell]) },
    move,
    slide: { word: sliding.word, cell: sliding.position - 1 },
  };
}

/** Which step the board is at, worked out from the board, so reopening carries on at the same step. */
export function tutorialStep(plan: TutorialPlan, board: Board, phase: PhaseTwo | null): TutorialStep | null {
  if (!phase) return board.rows[plan.first.row].locked ? 2 : 1;
  if (phase.won) return null;
  const row = phase.rows.findIndex((candidate) => candidate.word === plan.move.word);
  return row === plan.move.to ? 4 : 3;
}
