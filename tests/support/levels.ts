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

/** The designer's tutorial level (M05-03 and M06-03): F _ _ and O _ _, spelling OX. */
export function tutorialLevel(): Level {
  const level: Level = { ...makeLevel(['FOX', 'OWL'], 'OX'), tutorial: true };
  reveal(level, 'FOX', 'F', 1);
  reveal(level, 'OWL', 'O', 1);
  return level;
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
