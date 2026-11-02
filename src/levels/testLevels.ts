import type { Level } from '../game/level';

/** Only words already discussed, so the designer's playtest stays blind (D46). */
export const testLevels: Level[] = [
  {
    theme: 'Animals',
    // Level 1 walks the player through the game (story 12, D43).
    tutorial: true,
    answers: [{ word: 'FOX', revealed: [{ position: 1, letter: 'F' }, { position: 2, letter: 'O' }] }, { word: 'OWL', revealed: [{ position: 1, letter: 'O' }, { position: 3, letter: 'L' }] }],
    finalWord: 'OX',
  },
  {
    theme: 'Animals',
    answers: [{ word: 'ZEBRA' }, { word: 'LEMUR' }, { word: 'KANGAROO' }],
    finalWord: 'ELK',
  },
  {
    theme: 'Food',
    answers: [{ word: 'HOT DOG' }, { word: 'ICE TEA' }, { word: 'CAFÉ' }, { word: 'T-BONE' }],
    finalWord: 'TIFO',
  },
];
