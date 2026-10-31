import { cellsOf, isCharacter, lengthOf } from './characters';
import { firstLetterOf, rowOrder, type Level } from './level';

export const MIN_ROWS = 2;
export const MAX_ROWS = 5;
export const MIN_LENGTH = 2;
export const MAX_LENGTH = 8;

export interface SolutionStep {
  word: string;
  /** Counted from 1, by cell. */
  position: number;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
  /** One step per final-word letter, or null if the level can't be solved. */
  solution: SolutionStep[] | null;
}

/** Any working match of final-word letters to answers will do (D4). */
function findSolution(level: Level): SolutionStep[] | null {
  const letters = cellsOf(level.finalWord);
  const steps: SolutionStep[] = [];
  const used = new Set<number>();

  const match = (index: number): boolean => {
    if (index === letters.length) return true;
    for (let row = 0; row < level.answers.length; row++) {
      if (used.has(row)) continue;
      const word = level.answers[row].word;
      const position = cellsOf(word).indexOf(letters[index]);
      if (position === -1) continue;
      used.add(row);
      steps.push({ word, position: position + 1 });
      if (match(index + 1)) return true;
      steps.pop();
      used.delete(row);
    }
    return false;
  };

  return match(0) ? steps : null;
}

function startsSolved(level: Level): boolean {
  const column = rowOrder(level.answers).map((answer) => firstLetterOf(answer.word) ?? '');
  return column.join('') === level.finalWord;
}

export function validateLevel(level: Level): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let solution: SolutionStep[] | null = null;

  if (!level.theme) errors.push('the theme is missing');

  if (level.answers.length < MIN_ROWS) errors.push('it has too few rows');
  if (level.answers.length > MAX_ROWS) errors.push('it has too many rows');

  const seen = new Set<string>();
  for (const { word, revealed } of level.answers) {
    if (lengthOf(word) < MIN_LENGTH) errors.push(`${word} is too short`);
    if (lengthOf(word) > MAX_LENGTH) errors.push(`${word} is too long`);
    if (seen.has(word)) errors.push(`${word} appears twice`);
    seen.add(word);

    const cells = cellsOf(word);
    for (const { position, letter } of revealed ?? []) {
      if (cells[position - 1] !== letter) errors.push("a revealed letter doesn't match its answer");
    }
  }

  if (!level.finalWord) {
    errors.push('the final word is missing');
  } else {
    const letters = cellsOf(level.finalWord);
    if (!letters.every(isCharacter)) errors.push('the final word contains a special character');
    if (letters.length !== level.answers.length) {
      errors.push("the final word doesn't have one character per row");
    } else {
      solution = findSolution(level);
      if (!solution) errors.push('no solution exists');
    }
    if (startsSolved(level)) warnings.push('the level starts already solved');
  }

  return { errors, warnings, solution };
}
