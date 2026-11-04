import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { cellsOf } from '../../../src/game/characters';
import { layoutLevel } from '../../../src/game/layout';
import { rowOrder, startingCells, startingPool, type Answer, type Cell, type Level } from '../../../src/game/level';
import { validateLevel, type ValidationResult } from '../../../src/game/validator';
import { DEFAULT_WORDS, levelContaining, levelWithRows, makeLevel, parseWords, reveal } from '../../support/levels';

interface World {
  level?: Level;
  answer?: Answer;
  answers?: Answer[];
  cells?: Cell[];
  result?: ValidationResult;
  rows?: string[];
  centre?: number;
}

function levelOf(world: World): Level {
  world.level ??= makeLevel(DEFAULT_WORDS);
  return world.level;
}

Given('a level with the theme {string}', function (this: World, theme: string) {
  levelOf(this).theme = theme;
});

Given('a level with no theme', function (this: World) {
  levelOf(this).theme = '';
});

Given('a level with no final word', function (this: World) {
  levelOf(this).finalWord = '';
});

Given(/^a level with (\d+) rows$/, function (this: World, rows: string) {
  this.level = levelWithRows(Number(rows));
});

Given(/^a level containing the answer (.+)$/, function (this: World, word: string) {
  this.level = levelContaining(word);
});

Given(/^the answers (.+)$/, function (this: World, list: string) {
  const theme = this.level?.theme;
  this.level = makeLevel(parseWords(list));
  if (theme) this.level.theme = theme;
});

Given(/^the final word (.+)$/, function (this: World, finalWord: string) {
  levelOf(this).finalWord = finalWord;
});

Given(/^the answer (.+) with (.+) revealed at position (\d+)$/, function (this: World, word: string, letter: string, position: string) {
  this.level = levelContaining(word);
  reveal(this.level, word, letter, Number(position));
});

Given(/^the answer (?!.* revealed)(.+)$/, function (this: World, word: string) {
  this.level = levelContaining(word);
  this.answer = this.level.answers[0];
});

Given('no revealed letters', function (this: World) {
  assert.ok(levelOf(this).answers.every((answer) => !answer.revealed?.length));
});

Given(/^(.+) revealed at position (\d+) of (.+)$/, function (this: World, letter: string, position: string, word: string) {
  const level = levelOf(this);
  const row = /^row (\d+)$/.exec(word);
  reveal(level, row ? rowOrder(level.answers)[Number(row[1]) - 1].word : word, letter, Number(position));
});

When('the validator checks the level', function (this: World) {
  this.result = validateLevel(levelOf(this));
});

When('the pool is worked out', function (this: World) {
  this.answers = levelOf(this).answers;
});

When('the level starts', function (this: World) {
  this.cells = startingCells(this.answer!);
});

When('the row order is worked out', function (this: World) {
  this.rows = rowOrder(levelOf(this).answers).map((answer) => answer.word);
});

When('its position is worked out', function (this: World) {
  // The screen's centre line, counted in cells from the middle of cell 1.
  const layout = layoutLevel(levelOf(this), 1, 0, 1600, 900);
  const { cells } = layout.rows.find((row) => row.word === this.answer!.word)!;
  const middleOf = (index: number) => cells[index].x + cells[index].width / 2;
  this.centre = (layout.width / 2 - middleOf(0)) / (middleOf(1) - middleOf(0));
});

Then('the level passes', function (this: World) {
  assert.deepEqual(this.result!.errors, []);
});

Then(/^the level is rejected because (.+)$/, function (this: World, reason: string) {
  assert.ok(this.result!.errors.includes(reason), `Errors were: ${this.result!.errors.join('; ')}`);
});

Then('the validator reports one solution for the level', function (this: World) {
  const level = levelOf(this);
  const solution = this.result!.solution!;
  const spelled = solution.map((step) => cellsOf(step.word)[step.position - 1]).join('');
  assert.equal(spelled, level.finalWord);
  assert.equal(new Set(solution.map((step) => step.word)).size, level.answers.length);
});

Then('the validator warns that the level starts already solved', function (this: World) {
  assert.deepEqual(this.result!.warnings, ['the level starts already solved']);
});

Then('the validator gives no warning', function (this: World) {
  assert.deepEqual(this.result!.warnings, []);
});

function poolOf(world: World) {
  return startingPool(world.answers!);
}

function lettersIn(world: World) {
  return poolOf(world).reduce((total, tile) => total + tile.count, 0);
}

Then(/^the pool has (\d+) letters$/, function (this: World, letters: string) {
  assert.equal(lettersIn(this), Number(letters));
});

Then(/^the pool has no (.+)$/, function (this: World, character: string) {
  assert.equal(poolOf(this).find((tile) => tile.character === character)?.count ?? 0, 0);
});

Then(/^the pool has two copies of (.+)$/, function (this: World, character: string) {
  assert.equal(poolOf(this).find((tile) => tile.character === character)?.count, 2);
});

Then(/^the pool order is (.+)$/, function (this: World, order: string) {
  assert.deepEqual(poolOf(this).map((tile) => tile.character), order.split(', '));
});

Then(/^its row starts as (.+)$/, function (this: World, row: string) {
  const shown = this.cells!.map((cell) => {
    if (cell.kind === 'empty') return '_';
    return cell.character === ' ' ? '␣' : cell.character;
  });
  assert.equal(shown.join(' '), row);
});

Then(/^the pool gets (.+) from that answer$/, function (this: World, letters: string) {
  const pool = startingPool([this.answer!]);
  const expected = letters.split(', ').sort();
  const actual = pool.flatMap((tile) => Array<string>(tile.count).fill(tile.character)).sort();
  assert.deepEqual(actual, expected);
});

Then(/^the rows are (.+)$/, function (this: World, rows: string) {
  assert.deepEqual(this.rows, parseWords(rows));
});

Then(/^(.+) comes before (.+)$/, function (this: World, first: string, second: string) {
  assert.ok(this.rows!.indexOf(first) < this.rows!.indexOf(second), `Rows were: ${this.rows!.join(', ')}`);
});

Then(/^the screen's centre line falls on the middle of cell (\d+)$/, function (this: World, cell: string) {
  assert.ok(Math.abs(this.centre! - (Number(cell) - 1)) < 0.001, `Centre was ${this.centre}`);
});

Then(/^the screen's centre line falls between cells (\d+) and (\d+)$/, function (this: World, left: string, right: string) {
  const expected = (Number(left) - 1 + Number(right) - 1) / 2;
  assert.ok(Math.abs(this.centre! - expected) < 0.001, `Centre was ${this.centre}`);
});
