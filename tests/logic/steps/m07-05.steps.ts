import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Given, Then, When } from '@cucumber/cucumber';
import type { Level } from '../../../src/game/level';
import { withBonusWords } from '../../../tools/generator/bonus';
import { approve, run, type Settings } from '../../../tools/generator/generate';

/**
 * Bonus words (M07-05), worked out by the generator. Every level and word list here is made up (D46).
 * BEE, LION and KOALA spell ELK by sliding. In that order, the column can also read BOA. KOB, an antelope, needs the
 * rows in another order: K from KOALA, O from LION, B from BEE.
 */
const ANIMALS = ['BEAR', 'BEE', 'BOA', 'ELK', 'FOWL', 'HEN', 'KOALA', 'KOB', 'LION', 'NEWT', 'TIGER', 'WOLF'];
const wordsFor = (theme: string) => (theme === 'Animals' ? ANIMALS : []);

const TUTORIAL: Level = { theme: 'Animals', tutorial: true, answers: [{ word: 'FOX' }, { word: 'OWL' }], finalWord: 'OX' };
/** Needs reordering: HEN has no B. The reordering tutorial is the first level like this (M05-04). */
const NEEDS_REORDERING: Level = { theme: 'Animals', answers: [{ word: 'HEN' }, { word: 'BEAR' }, { word: 'TIGER' }], finalWord: 'BEE' };
const SLIDES: Level = { theme: 'Animals', answers: [{ word: 'BEE' }, { word: 'LION' }, { word: 'KOALA' }], finalWord: 'ELK' };

interface BonusWorld {
  levels: Level[];
  /** Which of `levels` the scenario is about, counted from 0. */
  index: number;
  worked?: Level[];
  absent?: string;
  folder?: string;
  output?: string;
  reviewFile?: string;
  levelsFile?: string;
  ticked?: Level;
}

function bonusOf(self: BonusWorld): string[] {
  self.worked ??= withBonusWords(self.levels, wordsFor);
  const words = self.worked[self.index].bonusWords;
  assert.ok(Array.isArray(words), 'The level has no list of bonus words');
  return words!;
}

Given('a level after the reordering tutorial', function (this: BonusWorld) {
  this.levels = [TUTORIAL, NEEDS_REORDERING, SLIDES];
  this.index = 2;
});

Given('a level before the reordering tutorial', function (this: BonusWorld) {
  this.levels = [TUTORIAL, SLIDES, NEEDS_REORDERING];
  this.index = 1;
});

Given('an animal its column can only read with the rows in another order', function (this: BonusWorld) {
  this.absent = 'KOB';
});

Given('a level with the WOLF row', function (this: BonusWorld) {
  this.levels = [TUTORIAL, NEEDS_REORDERING, { theme: 'Animals', answers: [{ word: 'BEE' }, { word: 'WOLF' }, { word: 'KOALA' }], finalWord: 'ELK' }];
  this.index = 2;
});

Given('a level one of whose rows can spell another of its answers', function (this: BonusWorld) {
  // WOLF's row can spell FOWL, which is another of this level's answers.
  this.levels = [TUTORIAL, NEEDS_REORDERING, { theme: 'Animals', answers: [{ word: 'HEN' }, { word: 'FOWL' }, { word: 'WOLF' }], finalWord: 'HOW' }];
  this.index = 2;
  this.absent = 'FOWL';
});

When('the generator works out its bonus words', function (this: BonusWorld) {
  bonusOf(this);
});

Then("they include every word in the theme's list, other than the level's answers and final word, that the column can read with the rows in any order", function (this: BonusWorld) {
  assert.deepEqual([...bonusOf(this)].sort(), ['BOA', 'KOB']);
});

Then('that animal isn\'t among them', function (this: BonusWorld) {
  const words = bonusOf(this);
  assert.ok(!words.includes(this.absent!), `${this.absent} is stored`);
  // Not an empty list passing by accident: the column's word in the starting order is there.
  if (this.absent === 'KOB') assert.deepEqual(words, ['BOA']);
});

Then('FOWL is among them', function (this: BonusWorld) {
  assert.ok(bonusOf(this).includes('FOWL'));
});

Then('that answer isn\'t among them', function (this: BonusWorld) {
  assert.ok(!bonusOf(this).includes(this.absent!));
});

// Approving keeps them

const SETTINGS: Settings = { rows: 3, shortest: 3, longest: 5, reveal: { kind: 'none' }, reordering: 'not needed', count: 10 };

Given('a review file with a ticked suggestion', function (this: BonusWorld) {
  this.folder = mkdtempSync(join(tmpdir(), 'word-slide-bonus-'));
  const { suggestions, reviewFile } = run('Animals', ANIMALS, SETTINGS, [TUTORIAL, NEEDS_REORDERING], this.folder);
  const index = suggestions.findIndex((level) => (level.bonusWords?.length ?? 0) > 0);
  assert.ok(index !== -1, 'No suggestion has bonus words to keep');
  this.ticked = suggestions[index];
  const sections = readFileSync(reviewFile, 'utf8').split(/^### /m);
  sections[index + 1] = sections[index + 1].replace('- [ ] Keep this level', '- [x] Keep this level');
  writeFileSync(reviewFile, sections.join('### '));
  this.reviewFile = reviewFile;
  this.levelsFile = join(this.folder, 'levels.json');
  writeFileSync(this.levelsFile, JSON.stringify([TUTORIAL, NEEDS_REORDERING]));
});

When('the designer approves it', function (this: BonusWorld) {
  approve(this.reviewFile!, this.levelsFile!);
});

Then('the level added to the game has its bonus words', function (this: BonusWorld) {
  const levels = JSON.parse(readFileSync(this.levelsFile!, 'utf8')) as Level[];
  assert.equal(levels.length, 3);
  assert.deepEqual(levels[2].bonusWords, this.ticked!.bonusWords);
});

// The game's levels

const gameLevels = () => JSON.parse(readFileSync('src/levels/levels.json', 'utf8')) as Level[];

Then("the game's level 1 has no bonus words", function () {
  const [first] = gameLevels();
  assert.ok(first.tutorial, 'Level 1 is the tutorial');
  assert.deepEqual(first.bonusWords, []);
});

Then("every level in the game has a list of bonus words, even if it's empty", function () {
  const levels = gameLevels();
  // Counts only (D46): never the words.
  const missing = levels.filter((level) => !Array.isArray(level.bonusWords)).length;
  assert.equal(missing, 0, `${missing} of ${levels.length} levels have no list of bonus words`);
});

// Blind levels (R12)

When("the generator works out a level's bonus words", function (this: BonusWorld) {
  this.folder = mkdtempSync(join(tmpdir(), 'word-slide-bonus-'));
  const list = join(this.folder, 'animals.txt');
  writeFileSync(list, ANIMALS.join('\n'));
  const levelsFile = join(this.folder, 'levels.json');
  writeFileSync(levelsFile, JSON.stringify([TUTORIAL, NEEDS_REORDERING]));
  this.output = execFileSync(
    process.execPath,
    ['--import', 'tsx', 'tools/generator/cli.ts', 'generate', '--theme', 'Animals', '--words', list, '--rows', '3', '--lengths', '3-5', '--levels', levelsFile, '--out', this.folder],
    { encoding: 'utf8' },
  );
});

Then('its output gives how many there are, and never the words', function (this: BonusWorld) {
  assert.match(this.output!, /\d+ bonus words/);
  const shown = ANIMALS.filter((word) => new RegExp(`\\b${word}\\b`).test(this.output!));
  assert.deepEqual(shown, [], 'The output names words from the list');
});
