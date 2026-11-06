import { readFileSync, writeFileSync } from 'node:fs';
import { lengthOf } from '../../src/game/characters';
import type { Level } from '../../src/game/level';
import { designedOrder, needsReordering } from '../../src/game/reordering';
import { validateLevel } from '../../src/game/validator';
import { generate, type Settings } from '../generator/generate';

/**
 * Drafts the prototype's 40 levels (M06-02) with the level generator (M06-01), and Claude's picks in place of
 * the designer's (R7). Run with `npm run levels:draft`. It prints numbers only: the designer plays blind (D46).
 */

const LEVELS = 'src/levels/levels.json';
const THEMES = ['Animals', 'Food', 'Space', 'Sports'];
/** Each theme's rows, as far as its words allow (R12). */
const PATTERN = [2, 2, 3, 3, 3, 3, 4, 4, 4, 5];
/** Levels 2 to 20 don't need reordering, and level 21 teaches it (M05-04, R6). */
const REORDERING_TUTORIAL = 21;

function wordList(theme: string): string[] {
  return readFileSync(`content/word-lists/${theme.toLowerCase()}.txt`, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*/, '').trim())
    .filter(Boolean);
}

/** Answers grow with the rows (Q13). */
function lengths(rows: number): Pick<Settings, 'shortest' | 'longest'> {
  if (rows <= 3) return { shortest: 3, longest: 5 };
  if (rows === 4) return { shortest: 3, longest: 6 };
  return { shortest: 4, longest: 7 };
}

/** No way of locking avoids the move: a longer row sits above a shorter one in the solution (Q14). */
function longerAboveShorter(level: Level): boolean {
  const order = designedOrder(level);
  return order.some((word, row) => order.slice(row + 1).some((below) => lengthOf(below) < lengthOf(word)));
}

/** A fixed pick among the suggestions, so drafting again gives the same levels. */
function pick<T>(items: T[], number: number): T {
  return items[(number * 7919) % items.length];
}

function draft(): Level[] {
  const tutorial = (JSON.parse(readFileSync(LEVELS, 'utf8')) as Level[]).find((level) => level.tutorial);
  if (!tutorial) throw new Error('Level 1, the tutorial, is missing from levels.json.');
  const levels: Level[] = [tutorial];

  for (const theme of THEMES) {
    const words = wordList(theme);
    const seenRows = new Set<number>(theme === tutorial.theme ? [tutorial.answers.length] : []);
    for (const [slot, planned] of PATTERN.entries()) {
      if (theme === tutorial.theme && slot === 0) continue;
      const number = levels.length + 1;
      let level: Level | undefined;
      // With no short final word left, a level takes one more row (R12). Claude flags a theme that needs 4.
      for (let rows = planned; rows <= 5 && !level; rows++) {
        const firstAtRows = !seenRows.has(rows) && number !== REORDERING_TUTORIAL;
        const needed = number >= REORDERING_TUTORIAL && !firstAtRows;
        const settings: Settings = { rows, ...lengths(rows), reordering: needed ? 'needed' : 'not needed', count: 60 };
        let { suggestions } = generate(theme, words, settings, levels);
        if (number === REORDERING_TUTORIAL) suggestions = suggestions.filter(longerAboveShorter);
        // Claude's review (R7): a final word inside one of its answers, or the other way round, gives the puzzle away.
        suggestions = suggestions.filter((candidate) => !candidate.answers.some(({ word }) => word.includes(candidate.finalWord) || candidate.finalWord.includes(word)));
        if (suggestions.length > 0) level = pick(suggestions, number);
        if (!level && rows > planned + 1 && planned <= 3) console.log(`FLAG: ${theme} has no final words short enough for level ${number}.`);
      }
      if (!level) throw new Error(`No level fits slot ${slot + 1} of ${theme} (level ${number}).`);
      seenRows.add(level.answers.length);
      levels.push(level);
    }
  }

  for (const [index, level] of levels.entries()) {
    if (validateLevel(level).errors.length > 0) throw new Error(`Level ${index + 1} fails the validator.`);
  }
  return levels;
}

const levels = draft();
writeFileSync(LEVELS, `${JSON.stringify(levels, null, 2)}\n`);
for (const [index, level] of levels.entries()) {
  console.log(`${index + 1}\t${level.theme}\t${level.answers.length} rows\t${needsReordering(level) ? 'needs reordering' : 'slides only'}`);
}
