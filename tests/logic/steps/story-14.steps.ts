import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Given, Then, When } from '@cucumber/cucumber';
import { cellsOf, isCharacter, lengthOf } from '../../../src/game/characters';
import { startingCells, type Level } from '../../../src/game/level';
import { needsReordering } from '../../../src/game/reordering';
import { validateLevel } from '../../../src/game/validator';
import { approve, generate, run, type Settings } from '../../../tools/generator/generate';

/** Test word lists, made of words already discussed or everyday ones, never the prototype's lists (D46). */
const LISTS: Record<string, string[]> = {
  Animals: [
    'APE', 'BAT', 'BEAR', 'BEE', 'CAMEL', 'CAT', 'DEER', 'DOG', 'EEL', 'ELK', 'EMU', 'FOX', 'GOAT', 'HEN', 'HORSE', 'KANGAROO',
    'KOALA', 'LAMB', 'LEMUR', 'LION', 'MOOSE', 'OWL', 'OX', 'RAT', 'SHEEP', 'TIGER', 'WOLF', 'YAK', 'ZEBRA',
  ],
  // Small on purpose: FIR can only be spelled with GIFT, ICICLE and WINTER.
  Christmas: ['FIR', 'GIFT', 'ICICLE', 'WINTER'],
  Cold: ['FROST', 'ICE', 'SNOW', 'WINTER'],
};

interface GeneratorWorld {
  theme: string;
  words: string[];
  settings: Settings;
  approved: Level[];
  suggestions: Level[];
  warnings: string[];
  error?: Error;
  runs?: Level[][];
  folder: string;
  reviewFile?: string;
  levelsFile?: string;
  levelsBefore?: string;
  ticked?: Level;
  opened?: string[][];
}

const DEFAULTS: Settings = { rows: 3, shortest: 3, longest: 8, reveal: { kind: 'none' }, reordering: 'not needed' };

function world(self: GeneratorWorld): GeneratorWorld {
  self.theme ??= 'Animals';
  self.words ??= LISTS[self.theme];
  self.settings ??= { ...DEFAULTS };
  self.approved ??= [];
  self.folder ??= mkdtempSync(join(tmpdir(), 'word-slide-generator-'));
  return self;
}

function generateNow(self: GeneratorWorld) {
  const w = world(self);
  try {
    const result = run(w.theme, w.words, w.settings, w.approved, w.folder);
    w.suggestions = result.suggestions;
    w.warnings = result.warnings;
    w.reviewFile = result.reviewFile;
  } catch (error) {
    w.error = error as Error;
  }
}

/** Every check needs something to check: an empty run would pass them all. */
function suggestionsOf(self: GeneratorWorld): Level[] {
  assert.ok(self.suggestions?.length > 0, 'The generator offered nothing');
  return self.suggestions;
}

function gameLevels(): string {
  const hash = createHash('sha256');
  for (const file of readdirSync('src/levels').sort()) hash.update(file).update(readFileSync(join('src/levels', file)));
  return hash.digest('hex');
}

const wordsOf = (level: Level) => [level.finalWord, ...level.answers.map((answer) => answer.word)];
const revealedCount = (level: Level) => level.answers.reduce((count, answer) => count + (answer.revealed?.length ?? 0), 0);

// Settings

Given(/^the theme (\w+) and its word list$/, function (this: GeneratorWorld, theme: string) {
  this.theme = theme;
  this.words = LISTS[theme];
});

Given(/^the theme (\w+)$/, function (this: GeneratorWorld, theme: string) {
  this.theme = theme;
  this.words = LISTS[theme];
});

Given(/^the settings (\d+) rows, words of (\d+) to (\d+) letters, no revealed letters, reordering (needed|not needed)$/, function (this: GeneratorWorld, rows: string, shortest: string, longest: string, reordering: string) {
  this.settings = { rows: Number(rows), shortest: Number(shortest), longest: Number(longest), reveal: { kind: 'none' }, reordering: reordering as Settings['reordering'] };
});

Given(/^the setting (.+)$/, function (this: GeneratorWorld, setting: string) {
  const settings = world(this).settings;
  const rows = /^(\d+) rows$/.exec(setting);
  const random = /^(\d+) letters at random$/.exec(setting);
  if (rows) settings.rows = Number(rows[1]);
  else if (random) settings.reveal = { kind: 'random', letters: Number(random[1]) };
  else if (setting === 'first letters') settings.reveal = { kind: 'first' };
  else if (setting === 'reordering needed' || setting === 'reordering not needed') settings.reordering = setting.slice('reordering '.length) as Settings['reordering'];
  else throw new Error(`Unknown setting: ${setting}`);
});

Given('no setting for revealed letters', function (this: GeneratorWorld) {
  const { reveal: _none, ...settings } = DEFAULTS;
  this.settings = settings;
});

Given('the same settings and word list', function (this: GeneratorWorld) {
  world(this);
});

When('the generator runs', function (this: GeneratorWorld) {
  this.levelsBefore = gameLevels();
  generateNow(this);
});

When(/^the generator runs for (\w+)$/, function (this: GeneratorWorld, theme: string) {
  world(this).theme = theme;
  this.words = LISTS[theme];
  generateNow(this);
});

When('the generator runs twice', function (this: GeneratorWorld) {
  const w = world(this);
  this.runs = [generate(w.theme, w.words, w.settings, w.approved).suggestions, generate(w.theme, w.words, w.settings, w.approved).suggestions];
});

Then(/^every suggestion has (\d+) answers of (\d+) to (\d+) letters$/, function (this: GeneratorWorld, rows: string, shortest: string, longest: string) {
  for (const level of suggestionsOf(this)) {
    assert.equal(level.answers.length, Number(rows));
    for (const { word } of level.answers) assert.ok(lengthOf(word) >= Number(shortest) && lengthOf(word) <= Number(longest), word);
  }
});

Then('it stops and says the setting is outside the limits', function (this: GeneratorWorld) {
  assert.ok(this.error, 'The generator ran');
  assert.match(this.error.message, /outside the limits/);
  assert.equal(this.suggestions, undefined);
});

// The final word

Given(/^a suggestion with the final word (\w+)$/, function (this: GeneratorWorld, finalWord: string) {
  // Enough suggestions to reach this final word in alphabetical order.
  world(this).settings.count = 100;
  generateNow(this);
  this.suggestions = suggestionsOf(this).filter((level) => level.finalWord === finalWord);
  this.opened = [];
});

Then(/^(?:one|a different) answer has an? (\w)$/, function (this: GeneratorWorld, letter: string) {
  for (const level of suggestionsOf(this)) {
    const solution = validateLevel(level).solution!;
    const step = solution.find((candidate) => cellsOf(candidate.word)[candidate.position - 1] === letter);
    assert.ok(step, `No answer gives ${letter}`);
  }
  // Each letter comes from a different answer: the solution uses each answer once.
  for (const level of suggestionsOf(this)) {
    const solution = validateLevel(level).solution!;
    assert.equal(new Set(solution.map((step) => step.word)).size, solution.length);
  }
});

Then(/^every final word comes from the (\w+) word list$/, function (this: GeneratorWorld, theme: string) {
  for (const level of suggestionsOf(this)) {
    assert.ok(LISTS[theme].includes(level.finalWord), level.finalWord);
    assert.equal(level.theme, theme);
  }
});

Then('no suggestion has its final word among its answers', function (this: GeneratorWorld) {
  for (const level of suggestionsOf(this)) assert.ok(!level.answers.some((answer) => answer.word === level.finalWord));
});

// The validator

Then('every suggestion passes the validator', function (this: GeneratorWorld) {
  for (const level of suggestionsOf(this)) assert.deepEqual(validateLevel(level).errors, []);
});

Then("no suggestion gets the validator's already-solved warning", function (this: GeneratorWorld) {
  for (const level of suggestionsOf(this)) assert.deepEqual(validateLevel(level).warnings, []);
  // The map's example (R5): EMU, LION and KOALA start spelling ELK, so with only those words there's nothing to offer.
  const example = generate('Animals', ['ELK', 'EMU', 'KOALA', 'LION'], { ...DEFAULTS });
  assert.deepEqual(example.suggestions, []);
});

// Reviewing

Then("the game's levels haven't changed", function (this: GeneratorWorld) {
  suggestionsOf(this);
  assert.equal(gameLevels(), this.levelsBefore);
});

Then('it writes a Markdown file of its suggestions', function (this: GeneratorWorld) {
  assert.ok(this.reviewFile?.endsWith('.md'));
  const text = readFileSync(this.reviewFile!, 'utf8');
  for (const level of suggestionsOf(this)) assert.ok(text.includes(level.finalWord));
});

Then('each suggestion has a box to tick', function (this: GeneratorWorld) {
  const boxes = readFileSync(this.reviewFile!, 'utf8').match(/^- \[ \] /gm) ?? [];
  assert.equal(boxes.length, suggestionsOf(this).length);
});

/** Ticks the box of one suggestion in the review file. */
function tick(file: string, index: number) {
  let box = -1;
  writeFileSync(file, readFileSync(file, 'utf8').replace(/^- \[ \] /gm, (match) => (++box === index ? '- [x] ' : match)));
}

Given('a review file with one suggestion ticked', function (this: GeneratorWorld) {
  generateNow(this);
  const levels = suggestionsOf(this);
  assert.ok(levels.length > 1, 'Needs more than one suggestion to tell them apart');
  tick(this.reviewFile!, 1);
  this.ticked = levels[1];
  this.levelsFile = join(this.folder, 'levels.json');
  writeFileSync(this.levelsFile, '[]\n');
});

When('the designer approves the file', function (this: GeneratorWorld) {
  approve(this.reviewFile!, this.levelsFile!);
});

Then("only that suggestion is added to the game's levels", function (this: GeneratorWorld) {
  assert.deepEqual(JSON.parse(readFileSync(this.levelsFile!, 'utf8')), [this.ticked]);
});

// Repeatable, and without the game

Then('both runs give the same suggestions', function (this: GeneratorWorld) {
  assert.ok(this.runs![0].length > 0);
  assert.deepEqual(this.runs![0], this.runs![1]);
});

When('the generator is started from a single command', function (this: GeneratorWorld) {
  const w = world(this);
  const list = join(w.folder, 'animals.txt');
  writeFileSync(list, LISTS.Animals.join('\n'));
  execFileSync(process.execPath, ['--import', 'tsx', 'tools/generator/cli.ts', 'generate', '--theme', 'Animals', '--words', list, '--rows', '3', '--out', w.folder], { stdio: 'pipe' });
});

// Honest about what this checks: the command is Node alone, with no browser or game started.
Then('it runs without a browser', function (this: GeneratorWorld) {
  assert.ok(readdirSync(this.folder).some((file) => file.endsWith('.md')), 'No review file was written');
});

// Revealed letters

Then('no suggestion reveals a letter', function (this: GeneratorWorld) {
  for (const level of suggestionsOf(this)) assert.equal(revealedCount(level), 0);
});

Then('every answer in a suggestion has its first letter revealed', function (this: GeneratorWorld) {
  for (const level of suggestionsOf(this)) {
    for (const answer of level.answers) {
      const first = cellsOf(answer.word).findIndex(isCharacter);
      assert.deepEqual(answer.revealed, [{ position: first + 1, letter: cellsOf(answer.word)[first] }]);
    }
  }
});

Then(/^every suggestion reveals (\d+) letters$/, function (this: GeneratorWorld, letters: string) {
  for (const level of suggestionsOf(this)) assert.equal(revealedCount(level), Number(letters));
});

Given(/^an approved level with (\d+) random letters revealed$/, function (this: GeneratorWorld, letters: string) {
  world(this).settings.reveal = { kind: 'random', letters: Number(letters) };
  generateNow(this);
  suggestionsOf(this);
  tick(this.reviewFile!, 0);
  this.levelsFile = join(this.folder, 'levels.json');
  writeFileSync(this.levelsFile, '[]\n');
  approve(this.reviewFile!, this.levelsFile);
});

When('two players open that level', function (this: GeneratorWorld) {
  const show = () => {
    const [level] = JSON.parse(readFileSync(this.levelsFile!, 'utf8')) as Level[];
    return level.answers.flatMap((answer) => startingCells(answer).map((cell) => (cell.kind === 'revealed' ? cell.character : '.')));
  };
  this.opened = [show(), show()];
});

Then(/^both see the same (\d+) letters$/, function (this: GeneratorWorld, letters: string) {
  assert.deepEqual(this.opened![0], this.opened![1]);
  assert.equal(this.opened![0].filter((cell) => cell !== '.').length, Number(letters));
});

// Reordering

Then('no suggestion can be solved by sliding alone', function (this: GeneratorWorld) {
  for (const level of suggestionsOf(this)) assert.equal(needsReordering(level), true, wordsOf(level).join());
});

Then('every suggestion can be solved by sliding alone', function (this: GeneratorWorld) {
  for (const level of suggestionsOf(this)) assert.equal(needsReordering(level), false, wordsOf(level).join());
});

// Words used once per theme

Given(/^(\w+) is in an approved (\w+) level$/, function (this: GeneratorWorld, word: string, theme: string) {
  world(this).approved.push({ theme, answers: [{ word }, { word: 'PLACEHOLDER' }], finalWord: 'XX' });
});

Then(/^no suggestion uses (\w+) as an answer or final word$/, function (this: GeneratorWorld, word: string) {
  for (const level of suggestionsOf(this)) assert.ok(!wordsOf(level).includes(word));
});

Then(/^a suggestion can use (\w+)$/, function (this: GeneratorWorld, word: string) {
  assert.ok(suggestionsOf(this).some((level) => wordsOf(level).includes(word)), `No suggestion uses ${word}`);
});

Given('a theme with too few unused words for the settings', function (this: GeneratorWorld) {
  this.theme = 'Animals';
  // Only BEE, OWL and KOALA, in that order, spell ELK.
  this.words = ['BEE', 'ELK', 'KOALA', 'OWL'];
});

Then('it says so, and offers what it can', function (this: GeneratorWorld) {
  assert.ok(this.warnings.some((warning) => /too few/.test(warning)), this.warnings.join());
  assert.ok(suggestionsOf(this).length < (this.settings.count ?? 10));
});
