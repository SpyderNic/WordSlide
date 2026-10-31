import { firstLetterOf, type Answer, type Level } from '../../src/game/level';

export const DEFAULT_WORDS = ['ZEBRA', 'LEMUR', 'KANGAROO'];
const SPARE_WORDS = ['ZEBRA', 'LEMUR', 'KANGAROO', 'CAT', 'DOG', 'OWL'];

/** "ZEBRA, LEMUR and KANGAROO" becomes three words. */
export function parseWords(list: string): string[] {
  return list.split(/, | and /);
}

/** A level that's valid unless a scenario says otherwise. */
export function makeLevel(words: string[], finalWord?: string): Level {
  const answers: Answer[] = words.map((word) => ({ word }));
  return {
    theme: 'Animals',
    answers,
    finalWord: finalWord ?? words.map((word) => firstLetterOf(word) ?? '').join(''),
  };
}

export function levelWithRows(rows: number): Level {
  return makeLevel(SPARE_WORDS.slice(0, rows));
}

export function levelContaining(word: string): Level {
  return makeLevel([word, 'HEN', 'DOG']);
}

export function reveal(level: Level, word: string, letter: string, position: number) {
  const answer = level.answers.find((candidate) => candidate.word === word);
  if (!answer) throw new Error(`${word} isn't in the level`);
  answer.revealed = [...(answer.revealed ?? []), { position, letter }];
}
