import { cellsOf } from './characters';
import { rowOrder, type Level } from './level';
import { validateLevel } from './validator';

/** A level needs reordering if its rows, in their starting order (D5), can't spell the final word by sliding (story 21, R1). */
export function needsReordering(level: Level): boolean {
  const letters = cellsOf(level.finalWord);
  return !rowOrder(level.answers).every((answer, row) => cellsOf(answer.word).includes(letters[row]));
}

/**
 * The reordering tutorial's level number, counted from 1, or null if no level needs reordering.
 * It's the first level that needs reordering, worked out from the levels, so it moves when the content changes.
 * Level 1's tutorial never counts: it teaches sliding only, and its ceremony puts its rows in order.
 */
export function reorderingTutorial(levels: Level[]): number | null {
  const index = levels.findIndex((level) => !level.tutorial && needsReordering(level));
  return index === -1 ? null : index + 1;
}

/** The order that spells the final word: the starting order if it does, or else the solution's. */
export function designedOrder(level: Level): string[] {
  if (!needsReordering(level)) return rowOrder(level.answers).map((answer) => answer.word);
  return validateLevel(level).solution?.map((step) => step.word) ?? rowOrder(level.answers).map((answer) => answer.word);
}

/**
 * Before the reordering tutorial, the ceremony puts the rows in the designed order (story 21, R2).
 * Words lock in any row of the same length (D8), so this only ever swaps same-length rows.
 * Returns, for each new row, the row it comes from.
 */
export function rowsInDesignedOrder(level: Level, words: string[]): number[] {
  const order = designedOrder(level);
  const from = words.map((_, row) => row);
  return from.sort((a, b) => order.indexOf(words[a]) - order.indexOf(words[b]));
}

/** Handles appear from the reordering tutorial on (D45). */
export function hasHandles(levels: Level[], levelNumber: number): boolean {
  const tutorial = reorderingTutorial(levels);
  return tutorial !== null && levelNumber >= tutorial;
}
