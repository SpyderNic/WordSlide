import { cellsOf, compareCells, compareWords, isCharacter, lengthOf } from './characters';

export interface RevealedLetter {
  /** Counted from 1, by cell. */
  position: number;
  letter: string;
}

export interface Answer {
  word: string;
  revealed?: RevealedLetter[];
}

export interface Level {
  theme: string;
  answers: Answer[];
  finalWord: string;
  /** Level 1 is a strict tutorial (story 12, D43). */
  tutorial?: boolean;
}

export interface PoolTile {
  character: string;
  count: number;
}

export type Cell =
  | { kind: 'empty' }
  | { kind: 'placed'; character: string }
  | { kind: 'revealed'; character: string }
  | { kind: 'special'; character: string }
  /** A letter in a locked part of a split word, in a row that isn't locked yet (D48). */
  | { kind: 'locked'; character: string };

/** Ascending length, then alphabetical (D5). */
export function rowOrder(answers: Answer[]): Answer[] {
  return [...answers].sort(
    (a, b) => lengthOf(a.word) - lengthOf(b.word) || compareWords(a.word, b.word),
  );
}

export function startingCells(answer: Answer): Cell[] {
  return cellsOf(answer.word).map((cell, index) => {
    if (!isCharacter(cell)) return { kind: 'special', character: cell };
    const revealed = answer.revealed?.find((letter) => letter.position === index + 1);
    return revealed ? { kind: 'revealed', character: revealed.letter } : { kind: 'empty' };
  });
}

/** Every character in the answers, minus revealed copies (D24 keeps x0 tiles). */
export function startingPool(answers: Answer[]): PoolTile[] {
  const counts = new Map<string, number>();
  for (const answer of answers) {
    for (const cell of cellsOf(answer.word).filter(isCharacter)) {
      counts.set(cell, (counts.get(cell) ?? 0) + 1);
    }
  }
  for (const answer of answers) {
    for (const { letter } of answer.revealed ?? []) {
      if (counts.has(letter)) counts.set(letter, counts.get(letter)! - 1);
    }
  }
  return [...counts]
    .map(([character, count]) => ({ character, count }))
    .sort((a, b) => compareCells(a.character, b.character));
}

export function firstLetterOf(word: string): string | undefined {
  return cellsOf(word).find(isCharacter);
}
