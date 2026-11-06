import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Given, Then, When } from '@cucumber/cucumber';
import { cellsOf, lengthOf } from '../../../src/game/characters';
import type { Level } from '../../../src/game/level';
import { designedOrder, needsReordering, reorderingTutorial } from '../../../src/game/reordering';
import { validateLevel } from '../../../src/game/validator';
import { levels } from '../../../src/levels';

/**
 * M06-02 checks the prototype's real levels. The designer plays them blind (D46),
 * so no message here ever names a word: only level numbers, themes and counts.
 */

interface ContentWorld {
  checked: { number: number; level: Level }[];
  themes: string[];
}

const numbered = () => levels.map((level, index) => ({ number: index + 1, level }));
const THEMES = ['Animals', 'Food', 'Space', 'Sports'];

function wordList(theme: string): string[] {
  return readFileSync(`content/word-lists/${theme.toLowerCase()}.txt`, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*/, '').trim().toUpperCase())
    .filter(Boolean);
}

/** The levels of a theme, in order. */
const ofTheme = (theme: string) => numbered().filter(({ level }) => level.theme === theme);

When('the validator checks all the levels', function (this: ContentWorld) {
  this.checked = numbered();
});

Then('every level passes', function (this: ContentWorld) {
  const failing = this.checked.filter(({ level }) => validateLevel(level).errors.length > 0).map(({ number }) => number);
  assert.deepEqual(failing, [], `Levels that fail: ${failing.join(', ')}`);
});

When(/^level (\d+) is (?:read|checked)$/, function (this: ContentWorld, number: string) {
  this.checked = [numbered()[Number(number) - 1]];
});

Then(/^its theme is (\w+)$/, function (this: ContentWorld, theme: string) {
  assert.equal(this.checked[0].level.theme, theme);
});

// Level 1 is the only level whose words can be shared.
Then(/^its answers are (\w+) and (\w+)$/, function (this: ContentWorld, first: string, second: string) {
  assert.deepEqual(this.checked[0].level.answers.map((answer) => answer.word).sort(), [first, second].sort());
});

Then(/^its final word is (\w+)$/, function (this: ContentWorld, word: string) {
  assert.equal(this.checked[0].level.finalWord, word);
});

Then("it's marked as the tutorial", function (this: ContentWorld) {
  assert.equal(this.checked[0].level.tutorial, true);
});

When('all the levels are counted', function (this: ContentWorld) {
  this.checked = numbered();
});

Then(/^there are (\d+) levels$/, function (this: ContentWorld, count: string) {
  assert.equal(this.checked.length, Number(count));
});

When(/^levels (\d+) to (\d+) are (?:read|checked)$/, function (this: ContentWorld, from: string, to: string) {
  this.checked = numbered().slice(Number(from) - 1, Number(to));
  assert.equal(this.checked.length, Number(to) - Number(from) + 1, 'Some of those levels are missing');
});

Then(/^all 10 have the theme (\w+)$/, function (this: ContentWorld, theme: string) {
  const other = this.checked.filter(({ level }) => level.theme !== theme).map(({ number }) => number);
  assert.deepEqual(other, [], `Levels with another theme: ${other.join(', ')}`);
});

When("the words in a theme's levels are compared", function (this: ContentWorld) {
  this.themes = THEMES;
});

Then('no answer or final word appears twice', function (this: ContentWorld) {
  for (const theme of this.themes) {
    const words = ofTheme(theme).flatMap(({ level }) => [level.finalWord, ...level.answers.map((answer) => answer.word)]);
    assert.equal(new Set(words).size, words.length, `A word appears twice in ${theme}`);
  }
});

Then('none of them needs reordering', function (this: ContentWorld) {
  const needing = this.checked.filter(({ level }) => needsReordering(level)).map(({ number }) => number);
  assert.deepEqual(needing, [], `Levels that need reordering: ${needing.join(', ')}`);
});

When('the levels are checked', function (this: ContentWorld) {
  this.checked = numbered();
});

Then(/^the first level that needs reordering is level (\d+)$/, function (this: ContentWorld, number: string) {
  assert.equal(reorderingTutorial(levels), Number(number));
});

When('the Space and Sports levels are checked', function (this: ContentWorld) {
  this.themes = ['Space', 'Sports'];
});

/** In each theme, the first level with each number of rows, apart from level 21, the reordering tutorial. */
function easing(themes: string[]): { firsts: number[]; others: number[] } {
  const firsts: number[] = [];
  const others: number[] = [];
  for (const theme of themes) {
    const seen = new Set<number>();
    for (const { number, level } of ofTheme(theme)) {
      const rows = level.answers.length;
      if (!seen.has(rows) && number !== 21) firsts.push(number);
      else others.push(number);
      seen.add(rows);
    }
  }
  return { firsts, others };
}

Then(/^in each theme, the first level with each number of rows doesn't need reordering, apart from level 21$/, function (this: ContentWorld) {
  const wrong = easing(this.themes).firsts.filter((number) => needsReordering(levels[number - 1]));
  assert.deepEqual(wrong, [], `Levels that should slide only: ${wrong.join(', ')}`);
});

Then('every other level does', function (this: ContentWorld) {
  const wrong = easing(this.themes).others.filter((number) => !needsReordering(levels[number - 1]));
  assert.deepEqual(wrong, [], `Levels that should need reordering: ${wrong.join(', ')}`);
});

Then('none of them has a revealed letter', function (this: ContentWorld) {
  const revealing = this.checked.filter(({ level }) => level.answers.some((answer) => (answer.revealed?.length ?? 0) > 0)).map(({ number }) => number);
  assert.deepEqual(revealing, [], `Levels with revealed letters: ${revealing.join(', ')}`);
});

// Answer lengths (Q13) and level 21 (Q14)

When(/^the levels with (\d+) rows are checked$/, function (this: ContentWorld, rows: string) {
  this.checked = numbered().filter(({ level }) => level.answers.length === Number(rows));
  assert.ok(this.checked.length > 0, `No level has ${rows} rows`);
});

Then(/^their answers have (\d+) to (\d+) letters$/, function (this: ContentWorld, shortest: string, longest: string) {
  const wrong = this.checked
    .filter(({ level }) => level.answers.some((answer) => lengthOf(answer.word) < Number(shortest) || lengthOf(answer.word) > Number(longest)))
    .map(({ number }) => number);
  assert.deepEqual(wrong, [], `Levels with answers of another length: ${wrong.join(', ')}`);
});

Then('its solution has a longer word above a shorter one', function (this: ContentWorld) {
  const order = designedOrder(this.checked[0].level);
  assert.ok(order.some((word, row) => order.slice(row + 1).some((below) => lengthOf(below) < lengthOf(word))));
});

// The rows' pattern (R12)

Given('a theme with no 2-letter final words left', function (this: ContentWorld) {
  this.themes = THEMES.filter((theme) => !wordList(theme).some((word) => cellsOf(word).length === 2));
  assert.ok(this.themes.length > 0, 'Every theme has a 2-letter word');
});

Given('Animals, whose only 2-letter final word is used by the tutorial', function (this: ContentWorld) {
  const short = wordList('Animals').filter((word) => cellsOf(word).length === 2);
  assert.deepEqual(short, [levels[0].finalWord]);
  this.themes = ['Animals'];
});

Then(/^its levels have ((?:\d, )+\d) rows$/, function (this: ContentWorld, pattern: string) {
  for (const theme of this.themes) {
    assert.deepEqual(ofTheme(theme).map(({ level }) => level.answers.length).join(', '), pattern, `${theme}'s rows`);
  }
});
