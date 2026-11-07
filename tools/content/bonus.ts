import { readFileSync, writeFileSync } from 'node:fs';
import type { Level } from '../../src/game/level';
import { withBonusWords } from '../generator/bonus';

/**
 * Works out the bonus words (M07-05, R10) of the game's levels from `content/word-lists/`, and stores them in each
 * level. The levels themselves don't change. Run with `npm run levels:bonus`. It prints counts only (D46).
 */

const LEVELS = 'src/levels/levels.json';

export function themeWords(theme: string): string[] {
  return readFileSync(`content/word-lists/${theme.toLowerCase()}.txt`, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*/, '').trim())
    .filter(Boolean);
}

export function countsOf(levels: Level[]): string {
  const withSome = levels.filter((level) => (level.bonusWords?.length ?? 0) > 0).length;
  const total = levels.reduce((count, level) => count + (level.bonusWords?.length ?? 0), 0);
  return `${withSome} of ${levels.length} levels have bonus words, ${total} in all.`;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('tools/content/bonus.ts')) {
  const levels = withBonusWords(JSON.parse(readFileSync(LEVELS, 'utf8')) as Level[], themeWords);
  writeFileSync(LEVELS, `${JSON.stringify(levels, null, 2)}\n`);
  console.log(countsOf(levels));
}
