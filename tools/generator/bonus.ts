import { cellsOf, compareCells, compareWords, isCharacter } from '../../src/game/characters';
import type { Answer, Level } from '../../src/game/level';
import { designedOrder, reorderingTutorial } from '../../src/game/reordering';

/**
 * Bonus words (M07-05, R10): words from the theme's list, other than the level's answers and final word, that its rows
 * can spell, or that its column can read. They're worked out when a level is made and stored in it, so the game needs
 * no dictionary.
 */

const normalised = (word: string) => word.trim().normalize('NFC').toUpperCase();

/** A full row can only spell anagrams of its answer, with its special characters and revealed letters where they are (R2). */
function rowCanSpell(answer: Answer, word: string): boolean {
  const cells = cellsOf(answer.word);
  const candidate = cellsOf(word);
  if (candidate.length !== cells.length) return false;
  const fixed = (index: number) => !isCharacter(cells[index]) || answer.revealed?.some((letter) => letter.position === index + 1);
  if (cells.some((cell, index) => fixed(index) && candidate[index] !== cell)) return false;
  if (candidate.some((cell, index) => !fixed(index) && !isCharacter(cell))) return false;
  const free = (list: string[]) => list.filter((_, index) => !fixed(index)).sort(compareCells).join('\u0000');
  return free(cells) === free(candidate);
}

/** The column reads one letter from each row, top to bottom. */
function orderCanRead(order: string[], word: string): boolean {
  const letters = cellsOf(word);
  return letters.length === order.length && letters.every((letter, row) => isCharacter(letter) && cellsOf(order[row]).includes(letter));
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, index) => permutations([...items.slice(0, index), ...items.slice(index + 1)]).map((rest) => [item, ...rest]));
}

/** Before the reordering tutorial, rows can't move, so only their starting order counts (M05-04). */
function columnCanRead(level: Level, word: string, anyOrder: boolean): boolean {
  const orders = anyOrder ? permutations(level.answers.map((answer) => answer.word)) : [designedOrder(level)];
  return orders.some((order) => orderCanRead(order, word));
}

export function canSpell(level: Level, word: string, anyOrder: boolean): boolean {
  return level.answers.some((answer) => rowCanSpell(answer, word)) || columnCanRead(level, word, anyOrder);
}

/** Level 1, the tutorial, has none (R9). */
export function bonusWordsOf(level: Level, words: string[], anyOrder: boolean): string[] {
  if (level.tutorial) return [];
  const taken = new Set([level.finalWord, ...level.answers.map((answer) => answer.word)].map(normalised));
  const candidates = [...new Set(words.map(normalised).filter(Boolean))].filter((word) => !taken.has(word));
  return candidates.filter((word) => canSpell(level, word, anyOrder)).sort(compareWords);
}

/** Whether rows can move in a level: from the reordering tutorial on, worked out from the levels (M05-04). */
export function reorderingFrom(levels: Level[]): (index: number) => boolean {
  const tutorial = reorderingTutorial(levels);
  return (index) => tutorial !== null && index + 1 >= tutorial;
}

/** Each level with its bonus words, from its theme's word list. The levels themselves don't change. */
export function withBonusWords(levels: Level[], wordsFor: (theme: string) => string[]): Level[] {
  const anyOrder = reorderingFrom(levels);
  return levels.map((level, index) => ({ ...level, bonusWords: bonusWordsOf(level, wordsFor(level.theme), anyOrder(index)) }));
}

/** A level's stored words, keeping only those it can spell where it sits among the levels. */
export function narrowedBonusWords(level: Level, anyOrder: boolean): string[] {
  if (level.tutorial) return [];
  return (level.bonusWords ?? []).filter((word) => canSpell(level, word, anyOrder));
}
