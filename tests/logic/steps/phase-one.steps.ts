import assert from 'node:assert/strict';
import { BeforeStep, Given, Then, When } from '@cucumber/cucumber';
import { Board, type BoardEvent } from '../../../src/game/board';
import { cellsOf } from '../../../src/game/characters';
import { rowOrder, type Level } from '../../../src/game/level';
import { DEFAULT_WORDS, makeLevel, reveal } from '../../support/levels';

interface World {
  level?: Level;
  board?: Board;
  events: BoardEvent[];
  before?: string;
  stepType?: string;
  rowRef?: number;
  cellRef?: number;
  notedPool?: string;
  marks?: { row: number; cell: number }[];
}

BeforeStep(function (this: World, { pickleStep }) {
  this.stepType = pickleStep.type;
  this.events ??= [];
});

function boardOf(world: World): Board {
  world.level ??= makeLevel(DEFAULT_WORDS);
  world.board ??= new Board(world.level);
  return world.board;
}

function isSetup(world: World) {
  return world.stepType === 'Context';
}

function snapshot(world: World): string {
  const board = boardOf(world);
  return JSON.stringify({ rows: board.rows, pool: board.pool, pools: board.snapshot().pools, selected: board.selectedRow });
}

function poolOf(world: World): string {
  return JSON.stringify(boardOf(world).pool);
}

/** How many more copies of a letter are in the selected row than before the last action: its pool is the one shown. */
function placedCopiesAdded(world: World, character: string): number {
  const row = boardOf(world).selectedRow ?? 0;
  const placed = (rows: Board['rows']) => rows[row].cells.filter((cell) => cell.kind === 'placed' && cell.character === character).length;
  const change = placed(boardOf(world).rows) - placed(JSON.parse(world.before!).rows);
  return Math.max(change, 0);
}

/** A letter's count in the selected row's pool before the last action. A letter only revealed has no tile, so 0. */
function countBefore(world: World, character: string): number {
  const pools = JSON.parse(world.before!).pools as { character: string; count: number }[][];
  return pools[boardOf(world).selectedRow ?? 0].find((tile) => tile.character === character)?.count ?? 0;
}

function act(world: World, action: (board: Board) => BoardEvent[] | void) {
  world.before = snapshot(world);
  world.events = action(boardOf(world)) ?? [];
}

function rowIndex(world: World, reference: string): number {
  const board = boardOf(world);
  if (reference === 'the top row') return 0;
  if (reference === 'that row' || reference === 'its row') {
    const word = world.level!.answers[0].word;
    return board.rows.findIndex((row) => row.word === word);
  }
  const numbered = /^row (\d+)$/.exec(reference);
  if (numbered) return Number(numbered[1]) - 1;
  const word = reference.replace(/'s row$/, '');
  const index = board.rows.findIndex((row) => row.word === word);
  assert.notEqual(index, -1, `No row for ${reference}`);
  return index;
}

/** Sets up the board. Placing a letter leaves its row selected, as it would for the player (story 23). */
function quietly(world: World, setup: (board: Board) => void) {
  setup(boardOf(world));
}

/** Each row has its own pool (story 23). With no row named, a letter comes from a row whose pool has it. */
function rowWith(board: Board, character: string): number | null {
  if (board.countOf(character) > 0) return board.selectedRow;
  const selected = board.selectedRow;
  for (let row = 0; row < board.rows.length; row++) {
    board.selectRow(row);
    if (board.countOf(character) > 0) return row;
  }
  if (selected !== null) board.selectRow(selected);
  return null;
}

function pickUp(board: Board, character: string): boolean {
  rowWith(board, character);
  return board.pickUpFromPool(character);
}

function place(world: World, row: number, cell: number, character: string): BoardEvent[] {
  const board = boardOf(world);
  board.selectRow(row);
  assert.ok(board.pickUpFromPool(character), `No ${character} left in the pool`);
  return board.dropOnCell(row, cell);
}

function fillRow(world: World, row: number, word: string): BoardEvent[] {
  const board = boardOf(world);
  const events: BoardEvent[] = [];
  cellsOf(word).forEach((character, cell) => {
    if (board.rows[row].cells[cell].kind === 'empty') events.push(...place(world, row, cell, character));
  });
  return events;
}

function fillRowWrongly(world: World, row: number) {
  const word = cellsOf(boardOf(world).rows[row].word).reverse().join('');
  quietly(world, () => fillRow(world, row, word));
}

function setRow(world: World, row: number, text: string) {
  quietly(world, (board) => {
    text.split(' ').forEach((character, cell) => {
      if (character !== '_' && board.rows[row].cells[cell].kind === 'empty') place(world, row, cell, character);
    });
  });
}

function rowText(world: World, row: number): string {
  return boardOf(world)
    .rows[row].cells.map((cell) => {
      if (cell.kind === 'empty') return '_';
      return cell.character === ' ' ? '␣' : cell.character;
    })
    .join(' ');
}

function characterIn(world: World, row: number, cell: number): string | null {
  const target = boardOf(world).rows[row].cells[cell];
  return target.kind === 'empty' ? null : target.character;
}

function findPlaced(world: World, character: string): { row: number; cell: number } {
  const board = boardOf(world);
  for (let row = 0; row < board.rows.length; row++) {
    const cell = board.rows[row].cells.findIndex((candidate) => candidate.kind === 'placed' && candidate.character === character);
    if (cell !== -1) return { row, cell };
  }
  throw new Error(`${character} isn't placed`);
}

function findCell(world: World, character: string): { row: number; cell: number } {
  const board = boardOf(world);
  for (let row = 0; row < board.rows.length; row++) {
    const cell = board.rows[row].cells.findIndex((candidate) => candidate.kind !== 'empty' && candidate.character === character);
    if (cell !== -1) return { row, cell };
  }
  throw new Error(`${character} isn't on the board`);
}

function placeSomewhere(world: World, character: string) {
  quietly(world, (board) => {
    const selected = board.selectedRow;
    const rows = [...board.rows.keys()].reverse();
    for (const row of selected === null ? rows : [selected, ...rows.filter((candidate) => candidate !== selected)]) {
      const cell = board.rows[row].cells.findLastIndex((candidate) => candidate.kind === 'empty');
      board.selectRow(row);
      if (cell !== -1 && board.countOf(character) > 0) {
        place(world, row, cell, character);
        return;
      }
    }
  });
}

function drag(world: World, from: { row: number; cell: number }, to: { row: number; cell: number }) {
  act(world, (board) => {
    assert.ok(board.pickUpFromCell(from.row, from.cell));
    return board.dropOnCell(to.row, to.cell);
  });
}

function swap(world: World, a: { row: number; cell: number }, b: { row: number; cell: number }) {
  drag(world, a, b);
}

function hasLock(world: World, word: string) {
  return world.events.some((event) => event.type === 'locked' && event.word === word);
}

const isLocked = (world: World, word: string) =>
  boardOf(world).rows.some((row) => row.locked && row.cells.map((cell) => (cell.kind === 'empty' ? '' : cell.character)).join('') === word);

// The pool

Given(/^the pool shows (?!these)(.+)$/, function (this: World, text: string) {
  const parts = text.split(/, | and /).map((part) => {
    const match = /^(?:a grey )?(\S+) x(\d+)$/.exec(part);
    assert.ok(match, `Can't read ${part}`);
    return { character: match[1], count: Number(match[2]) };
  });
  if (isSetup(this) && parts.some((part) => part.character === 'É')) {
    this.level ??= makeLevel(['NÉE', 'CAT']);
    rowWith(boardOf(this), 'É');
  }
  for (const { character, count } of parts) {
    const board = boardOf(this);
    if (isSetup(this)) {
      // Bounded, so a count that never falls fails the check below instead of looping forever.
      for (let tries = board.countOf(character); tries > count; tries--) placeSomewhere(this, character);
    }
    assert.equal(board.countOf(character), count, `${character} count`);
  }
});

Then(/^the (\S+) tile isn't grey$/, function (this: World, character: string) {
  assert.ok(boardOf(this).countOf(character) > 0);
});

Then(/^the (\S+) and (\S+) tiles aren't grey$/, function (this: World, first: string, second: string) {
  assert.ok(boardOf(this).countOf(first) > 0 && boardOf(this).countOf(second) > 0);
});

Then(/^the (\S+) count goes up by one$/, function (this: World, character: string) {
  const before = countBefore(this, character);
  // Building a word in the same move uses up copies of the letter.
  const used = placedCopiesAdded(this, character);
  assert.equal(boardOf(this).countOf(character), before - used + 1);
});

Then(/^the (\S+) count drops by one$/, function (this: World, character: string) {
  const before = countBefore(this, character);
  assert.equal(boardOf(this).countOf(character), before - 1);
});

Then(/^the (\S+) count hasn't changed$/, function (this: World, character: string) {
  const before = countBefore(this, character);
  assert.equal(boardOf(this).countOf(character), before);
});

Then("the pool hasn't changed", function (this: World) {
  assert.equal(JSON.stringify(JSON.parse(this.before!).pool), poolOf(this));
});

Then(/^the pool holds (.+)$/, function (this: World, letters: string) {
  const actual = boardOf(this).pool.flatMap((tile) => Array<string>(tile.count).fill(tile.character)).sort();
  assert.deepEqual(actual, letters.split(', ').sort());
});

Then(/^another (\S+) can still be dragged$/, function (this: World, character: string) {
  const board = boardOf(this);
  board.dropOnCell(0, 0);
  assert.ok(pickUp(board, character));
});

Then(/^the (\S+) can be dragged again$/, function (this: World, character: string) {
  assert.ok(pickUp(boardOf(this), character));
});

Then('the E goes back to the pool', function (this: World) {
  assert.equal(boardOf(this).countOf('E'), 1);
});

Then(/^the (\S+) is back in the pool$/, function (this: World, character: string) {
  assert.ok(boardOf(this).countOf(character) > 0);
});

// Placing

Given(/^an? (\S+) placed in cell (\d+) of (.+)$/, function (this: World, character: string, cell: string, reference: string) {
  const row = rowIndex(this, reference);
  this.rowRef = row;
  this.cellRef = Number(cell) - 1;
  quietly(this, () => place(this, row, this.cellRef!, character));
});

Given(/^an? (\S+) placed in a cell$/, function (this: World, character: string) {
  if (boardOf(this).rows.some((row) => row.cells.some((cell) => cell.kind === 'placed' && cell.character === character))) return;
  placeSomewhere(this, character);
});

Given(/^a Z placed in (LEMUR's|ZEBRA's) row$/, function (this: World, word: string) {
  const row = rowIndex(this, `${word} row`);
  quietly(this, () => place(this, row, 0, 'Z'));
  this.marks = [{ row, cell: 0 }];
});

Given("an A and an N placed in KANGAROO's row", function (this: World) {
  const row = rowIndex(this, "KANGAROO's row");
  quietly(this, () => {
    place(this, row, 1, 'A');
    place(this, row, 2, 'N');
  });
  this.marks!.push({ row, cell: 1 }, { row, cell: 2 });
});

Given(/^an? (\S+), an? (\S+) and an? (\S+) placed in (.+)'s row$/, function (this: World, a: string, b: string, c: string, word: string) {
  const row = rowIndex(this, `${word}'s row`);
  for (const character of [a, b, c]) {
    const cell = boardOf(this).rows[row].cells.findIndex((candidate) => candidate.kind === 'empty');
    quietly(this, () => place(this, row, cell, character));
  }
});

Given('no placed letters', function (this: World) {
  assert.equal(boardOf(this).hasPlacedLetters(), false);
});

When(/^the player drags (\S+) from the pool to cell (\d+) of (.+)'s row$/, function (this: World, character: string, cell: string, word: string) {
  const row = rowIndex(this, `${word}'s row`);
  act(this, () => place(this, row, Number(cell) - 1, character));
});

When(/^the player drags (\S+) from the pool to that cell$/, function (this: World, character: string) {
  act(this, () => place(this, this.rowRef!, this.cellRef!, character));
});

When(/^the player drags (\S+) from the pool onto the (\S+)$/, function (this: World, character: string, target: string) {
  const { row, cell } = target === 'last' ? { row: 0, cell: 0 } : findCell(this, target);
  act(this, () => place(this, row, cell, character));
});

When("the player drags A from the pool onto the last E", function (this: World) {
  const row = rowIndex(this, "ZEBRA's row");
  act(this, () => place(this, row, 4, 'A'));
});

When("the player drags A from the pool onto LEMUR's M", function (this: World) {
  act(this, () => place(this, rowIndex(this, "LEMUR's row"), 2, 'A'));
});

When(/^the player drags (\S+) from the pool and releases it over the theme$/, function (this: World, character: string) {
  act(this, (board) => {
    pickUp(board, character);
    board.dropAway();
  });
});

When(/^the player drags the (\S+) onto the (\S+)$/, function (this: World, character: string, target: string) {
  const to = target === 'hyphen' ? findCell(this, '-') : findPlaced(this, target);
  drag(this, findPlaced(this, character), to);
});

When(/^the player drags the (\S+) to cell (\d+) of (.+)'s row$/, function (this: World, character: string, cell: string, word: string) {
  drag(this, findPlaced(this, character), { row: rowIndex(this, `${word}'s row`), cell: Number(cell) - 1 });
});

When(/^the player drags the (\S+) and releases it on the A tile$/, function (this: World, character: string) {
  const from = findPlaced(this, character);
  act(this, (board) => {
    board.pickUpFromCell(from.row, from.cell);
    board.dropAway();
  });
});

When(/^the player picks up the (\S+) and releases it over cell 1 of LEMUR's row$/, function (this: World, character: string) {
  const from = findPlaced(this, character);
  drag(this, from, from);
});

When(/^the player picks up (?:an?|the) (\S+)$/, function (this: World, character: string) {
  act(this, (board) => void pickUp(board, character));
});

When(/^the player picks up the placed (\S+)$/, function (this: World, character: string) {
  const { row, cell } = findPlaced(this, character);
  act(this, (board) => void board.pickUpFromCell(row, cell));
});

Given(/^the player is dragging a placed (\S+)$/, function (this: World, character: string) {
  const { row, cell } = findPlaced(this, character);
  boardOf(this).pickUpFromCell(row, cell);
});

Given(/^the player is dragging a (\S+)$/, function (this: World, character: string) {
  pickUp(boardOf(this), character);
});

When('the player releases it over the pool', function (this: World) {
  act(this, (board) => board.dropAway());
});

When(/^the player returns the (\S+) to the pool$/, function (this: World, character: string) {
  const { row, cell } = findPlaced(this, character);
  act(this, (board) => {
    board.pickUpFromCell(row, cell);
    board.dropAway();
  });
});

When(/^the player tries to drag the (\S+)$/, function (this: World, name: string) {
  const character = name === 'hyphen' ? '-' : name;
  act(this, (board) => {
    const onBoard = board.rows.some((row) =>
      row.cells.some((cell) => (cell.kind === 'revealed' || cell.kind === 'special') && cell.character === character),
    );
    if (onBoard) {
      const { row, cell } = findCell(this, character);
      board.pickUpFromCell(row, cell);
    } else {
      pickUp(board, character);
    }
  });
});

When('the player tries to drag one of its letters', function (this: World) {
  act(this, (board) => void board.pickUpFromCell(rowIndex(this, "LEMUR's row"), 0));
});

When('the player tries to drag its M', function (this: World) {
  act(this, (board) => void board.pickUpFromCell(rowIndex(this, "LEMUR's row"), 2));
});

When('the player places a letter', function (this: World) {
  const board = boardOf(this);
  const row = board.selectedRow!;
  const letter = board.pool.find((tile) => tile.count > 0)!.character;
  act(this, () => place(this, row, board.rows[row].cells.findIndex((cell) => cell.kind === 'empty'), letter));
});

Then('nothing is picked up', function (this: World) {
  assert.equal(boardOf(this).drag, null);
});

Then(/^cell (\d+) of (.+)'s row holds an? (\S+)$/, function (this: World, cell: string, word: string, character: string) {
  assert.equal(characterIn(this, rowIndex(this, `${word}'s row`), Number(cell) - 1), character);
});

Then(/^cell (\d+) of that row holds an? (\S+)$/, function (this: World, cell: string, character: string) {
  assert.equal(characterIn(this, rowIndex(this, 'that row'), Number(cell) - 1), character);
});

Then(/^that cell holds an? (\S+)$/, function (this: World, character: string) {
  assert.equal(characterIn(this, this.rowRef!, this.cellRef!), character);
});

Then(/^cell (\d+) of (.+)'s row is empty$/, function (this: World, cell: string, word: string) {
  assert.equal(characterIn(this, rowIndex(this, `${word}'s row`), Number(cell) - 1), null);
});

Then("nothing tells the player whether it's right", function (this: World) {
  assert.deepEqual(this.events, []);
});

Then('the L is still in its cell', function (this: World) {
  assert.equal(characterIn(this, rowIndex(this, "LEMUR's row"), 0), 'L');
});

Then('no cell has changed', function (this: World) {
  assert.deepEqual(boardOf(this).rows, JSON.parse(this.before!).rows);
});

// Recall All

When('the player presses Recall All', function (this: World) {
  act(this, (board) => void board.recallAll());
});

Then('those three cells are empty', function (this: World) {
  this.marks!.forEach(({ row, cell }) => assert.equal(characterIn(this, row, cell), null));
});

Then(/^(?!cell)(.+)'s row is empty$/, function (this: World, word: string) {
  const row = boardOf(this).rows[rowIndex(this, `${word}'s row`)];
  assert.ok(row.cells.every((cell) => cell.kind === 'empty'));
});

Then('the Recall All button is grey', function (this: World) {
  assert.equal(boardOf(this).hasPlacedLetters(), false);
});

Then('the Recall All button is active', function (this: World) {
  assert.equal(boardOf(this).hasPlacedLetters(), true);
});

Then('nothing changes', function (this: World) {
  assert.equal(snapshot(this), this.before);
});

Then('no confirmation appears', function (this: World) {
  assert.equal(boardOf(this).hasPlacedLetters(), false);
});

// Words

Given(/^(.+) is locked$/, function (this: World, word: string) {
  quietly(this, () => fillRow(this, rowIndex(this, `${word}'s row`), word));
});

Given(/^LEMUR and ZEBRA are locked$/, function (this: World) {
  ['LEMUR', 'ZEBRA'].forEach((word) => quietly(this, () => fillRow(this, rowIndex(this, `${word}'s row`), word)));
});

Given(/^(.+) is locked in row (\d+)$/, function (this: World, word: string, row: string) {
  quietly(this, () => fillRow(this, Number(row) - 1, word));
});

Given(/^(.+) (?:rows? )?is full but wrong$/, function (this: World, reference: string) {
  fillRowWrongly(this, rowIndex(this, reference));
});

Given(/^(.+)'s row is full$/, function (this: World, word: string) {
  fillRowWrongly(this, rowIndex(this, `${word}'s row`));
});

Given("LEMUR's and ZEBRA's rows are full", function (this: World) {
  fillRowWrongly(this, rowIndex(this, "LEMUR's row"));
  fillRowWrongly(this, rowIndex(this, "ZEBRA's row"));
});

Given(/^(.+?) (?:still )?reads (.+)$/, function (this: World, reference: string, text: string) {
  const row = rowIndex(this, reference);
  if (isSetup(this)) setRow(this, row, text);
  else assert.equal(rowText(this, row), text);
});

Given(/^(row \d+|that row) starts as (.+)$/, function (this: World, reference: string, text: string) {
  if (reference === 'that row') {
    setRow(this, rowIndex(this, reference), text);
    return;
  }
  const level = this.level!;
  const word = rowOrder(level.answers)[Number(reference.split(' ')[1]) - 1].word;
  text.split(' ').forEach((character, cell) => {
    if (character !== '_' && character !== '␣') reveal(level, word, character, cell + 1);
  });
});

Given(/^a row with T revealed first$/, function (this: World) {
  const level = this.level!;
  const answer = level.answers.find((candidate) => candidate.word.startsWith('T'))!;
  reveal(level, answer.word, 'T', 1);
  this.rowRef = rowOrder(level.answers).findIndex((candidate) => candidate.word === answer.word);
});

Given('a level containing the answers HOT DOG and TOASTER', function (this: World) {
  this.level = makeLevel(['HOT DOG', 'TOASTER', 'DOG']);
});

When(/^the player fills (the top row|its row|ZEBRA's row) with (.+)$/, function (this: World, which: string, word: string) {
  act(this, (board) => {
    const row =
      which === 'the top row' ? 0 : which === "ZEBRA's row" ? rowIndex(this, which) : board.rows.findIndex((candidate) => cellsOf(candidate.word).length === cellsOf(word).length);
    return fillRow(this, row, word);
  });
});

When(/^the player fills that row with (.+)$/, function (this: World, word: string) {
  act(this, () => fillRow(this, this.rowRef!, word));
});

When(/^the player builds (.+) in row (\d+)$/, function (this: World, word: string, row: string) {
  act(this, () => fillRow(this, Number(row) - 1, word));
});

Given(/^the player has built (.+) in row (\d+)$/, function (this: World, word: string, row: string) {
  quietly(this, () => fillRow(this, Number(row) - 1, word));
});

When('the player places R in its last cell', function (this: World) {
  act(this, () => place(this, 0, 4, 'R'));
});

When('the player swaps the R and the U', function (this: World) {
  swap(this, { row: 0, cell: 3 }, { row: 0, cell: 4 });
});

// Row 2 reads T E A M. Dropping the M on the T moves T, E and A aside: M T E A. Then the T onto the A: M E A T (story 24, R6).
When('the player drags the M onto the T, then the T onto the A', function (this: World) {
  swap(this, { row: 1, cell: 3 }, { row: 1, cell: 0 });
  swap(this, { row: 1, cell: 1 }, { row: 1, cell: 3 });
});

// ZEBRA's row reads Z E B A R.
When('the player swaps the A and the R', function (this: World) {
  const row = rowIndex(this, "ZEBRA's row");
  swap(this, { row, cell: 3 }, { row, cell: 4 });
});

When('the player swaps the T and the M', function (this: World) {
  swap(this, { row: 1, cell: 0 }, { row: 1, cell: 3 });
});

When("the player swaps the A and the last R of ZEBRA's row", function (this: World) {
  swap(this, { row: 0, cell: 4 }, { row: rowIndex(this, "ZEBRA's row"), cell: 4 });
});

Given('the pool counts are noted after placing the R', function (this: World) {
  pickUp(boardOf(this), 'R');
  this.notedPool = JSON.stringify(boardOf(this).snapshot().pools[0]);
});

Then('the word locks', function (this: World) {
  if (this.stepType === 'Action') act(this, (board) => board.dropOnCell(0, 4));
  assert.ok(this.events.some((event) => event.type === 'locked'), JSON.stringify(this.events));
});

Then('the pool counts are the same', function (this: World) {
  assert.equal(JSON.stringify(boardOf(this).snapshot().pools[0]), this.notedPool);
});

Given(/^the player has spelled a wrong word (\d+) times$/, function (this: World, times: string) {
  for (let attempt = 0; attempt < Number(times); attempt++) {
    fillRowWrongly(this, 0);
    boardOf(this).recallAll();
  }
});

When('the player spells the right word', function (this: World) {
  act(this, () => fillRow(this, 0, 'LEMUR'));
});

Then(/^(?!an input|the word locks$|nothing locks$)(.+?) locks(?: in row (\d+))?$/, function (this: World, word: string, row?: string) {
  if (this.stepType === 'Action') {
    act(this, () => fillRow(this, rowIndex(this, `${word}'s row`), word));
    return;
  }
  assert.ok(hasLock(this, word), JSON.stringify(this.events));
  if (row) assert.ok(boardOf(this).rows[Number(row) - 1].locked);
});

Then("the word doesn't lock", function (this: World) {
  assert.ok(!this.events.some((event) => event.type === 'locked'));
});

Then('LEMUR locks first', function (this: World) {
  const locks = this.events.filter((event) => event.type === 'locked');
  assert.deepEqual(locks.map((event) => event.type === 'locked' && event.word), ['LEMUR', 'ZEBRA']);
});

Then('ZEBRA locks second', function (this: World) {
  assert.ok(hasLock(this, 'ZEBRA'));
});

Then('LEMUR is still locked', function (this: World) {
  assert.ok(isLocked(this, 'LEMUR'));
});

Then('LEMUR is unchanged', function (this: World) {
  assert.ok(isLocked(this, 'LEMUR'));
});

Then('nothing locks and no feedback appears', function (this: World) {
  assert.deepEqual(this.events, []);
  assert.equal(boardOf(this).rows[0].locked, false);
});

Then('the row gets the wrong-word feedback', function (this: World) {
  assert.ok(this.events.some((event) => event.type === 'wrong'));
});

Then(/^(.+) can't be placed in (?:that row|HOT DOG's row), because its (?:first cell is taken|space takes a cell)$/, function (this: World, word: string) {
  const board = boardOf(this);
  const row = this.rowRef ?? rowIndex(this, "HOT DOG's row");
  const cells = cellsOf(word);
  const blocked = board.rows[row].cells.some(
    (cell, index) => (cell.kind === 'revealed' || cell.kind === 'special') && cell.character !== cells[index],
  );
  assert.ok(blocked);
});

Then(/^the (\S+) disappears from row (\d+)$/, function (this: World, _letter: string, row: string) {
  assert.ok(!boardOf(this).rows[Number(row) - 1].cells.some((cell) => cell.kind === 'revealed'));
});

Then('phase one ends', function (this: World) {
  assert.equal(boardOf(this).phaseOneOver, true);
});

Then('phase one continues', function (this: World) {
  assert.equal(boardOf(this).phaseOneOver, false);
});

// Selecting, tapping and typing

Given(/^(.+)'s row is full and selected$/, function (this: World, word: string) {
  const row = rowIndex(this, `${word}'s row`);
  fillRowWrongly(this, row);
  boardOf(this).selectRow(row);
});

Given(/^(?!a row|no row)(.+?) is (?:still )?selected$/, function (this: World, reference: string) {
  const row = rowIndex(this, reference);
  if (isSetup(this)) boardOf(this).selectRow(row);
  else assert.equal(boardOf(this).selectedRow, row);
});

Given(/^(.+)'s row is selected and has no placed letters$/, function (this: World, word: string) {
  boardOf(this).selectRow(rowIndex(this, `${word}'s row`));
});

Given(/^(.+)'s row was selected before a drag$/, function (this: World, word: string) {
  const board = boardOf(this);
  board.selectRow(rowIndex(this, `${word}'s row`));
});

Given('a letter was placed by that drag', function (this: World) {
  placeSomewhere(this, 'A');
});

Given('no row is selected', function (this: World) {
  assert.equal(boardOf(this).selectedRow, null);
});

Given('no other row has a placed letter', function (this: World) {
  assert.equal(boardOf(this).hasPlacedLetters(), false);
});

// The selected row, if it has empty cells: the pool's letters are its own.
Given('a row with empty cells is selected', function (this: World) {
  const board = boardOf(this);
  const empty = (row: number) => board.rows[row].cells.some((cell) => cell.kind === 'empty');
  if (board.selectedRow === null || !empty(board.selectedRow)) board.selectRow(board.rows.findIndex((_, row) => empty(row)));
});

Then(/^the (\S+) and the (\S+) stay placed$/, function (this: World, first: string, second: string) {
  for (const character of [first, second]) findPlaced(this, character);
});

Given(/^(.+)'s row has an empty cell$/, function (this: World, word: string) {
  assert.ok(boardOf(this).rows[rowIndex(this, `${word}'s row`)].cells.some((cell) => cell.kind === 'empty'));
});

Given(/^(.+)'s row has a placed letter$/, function (this: World, word: string) {
  quietly(this, () => place(this, rowIndex(this, `${word}'s row`), 0, word === 'LEMUR' ? 'L' : 'K'));
});

Given('the player has dragged an A to KANGAROO\'s row', function (this: World) {
  const board = boardOf(this);
  pickUp(board, 'A');
  board.dropOnCell(rowIndex(this, "KANGAROO's row"), 1);
});

When(/^the player taps a cell of (.+)'s row$/, function (this: World, word: string) {
  act(this, (board) => board.selectRow(rowIndex(this, `${word}'s row`)));
});

When(/^the player taps (\S+) in the pool$/, function (this: World, character: string) {
  act(this, (board) => board.input(character));
});

When(/^the player presses the (\S+) key$/, function (this: World, key: string) {
  act(this, (board) => board.key(key));
});

When(/^the player presses (Backspace|Up|Down)$/, function (this: World, key: string) {
  const name = key === 'Backspace' ? key : `Arrow${key}`;
  act(this, (board) => board.key(name));
});

When('the player quickly types ZEBRA', function (this: World) {
  act(this, (board) => [...'ZEBRA'].flatMap((key) => board.key(key)));
});

When(/^an input fills (.+)'s last empty cell(?: with a wrong letter)?$/, function (this: World, word: string) {
  const row = rowIndex(this, `${word}'s row`);
  const wrong = cellsOf(word).reverse();
  quietly(this, () => wrong.slice(0, -1).forEach((character, cell) => place(this, row, cell, character)));
  act(this, (board) => board.input(wrong[wrong.length - 1]));
});

When('an input completes KANGAROO, which locks', function (this: World) {
  const row = rowIndex(this, "KANGAROO's row");
  const word = cellsOf('KANGAROO');
  quietly(this, () => word.slice(0, -1).forEach((character, cell) => place(this, row, cell, character)));
  act(this, (board) => board.input('O'));
});

When('the player starts dragging a letter', function (this: World) {
  act(this, (board) => void pickUp(board, 'A'));
});

When(/^the player's input fills it with (.+)$/, function (this: World, word: string) {
  act(this, (board) => cellsOf(word).flatMap((character) => board.input(character)));
});

When(/^the level opens$/, function (this: World) {
  boardOf(this);
});

Then(/^(.+)'s row is marked as selected$/, function (this: World, word: string) {
  assert.equal(boardOf(this).markedRow, rowIndex(this, `${word}'s row`));
});

Then("ZEBRA's row isn't", function (this: World) {
  assert.notEqual(boardOf(this).markedRow, rowIndex(this, "ZEBRA's row"));
});

Then('no row is marked as selected', function (this: World) {
  assert.equal(boardOf(this).markedRow, null);
});

Then('the selection moves on, as in story 17', function (this: World) {
  assert.equal(boardOf(this).selectedRow, 1);
});

Then('the next input goes to its cell 1', function (this: World) {
  const row = boardOf(this).selectedRow!;
  boardOf(this).input('Z');
  assert.equal(characterIn(this, row, 0), 'Z');
});

Then(/^the (\S+) is in cell (\d+) of (.+)'s row$/, function (this: World, character: string, cell: string, word: string) {
  assert.equal(characterIn(this, rowIndex(this, `${word}'s row`), Number(cell) - 1), character);
});

Then(/^the (\S+) is in its cell (\d+)$/, function (this: World, character: string, cell: string) {
  assert.equal(characterIn(this, boardOf(this).selectedRow!, Number(cell) - 1), character);
});

Then(/^the (\S+) is in (?!cell)(.+)'s row$/, function (this: World, character: string, word: string) {
  const row = boardOf(this).rows[rowIndex(this, `${word}'s row`)];
  assert.ok(row.cells.some((cell) => cell.kind === 'placed' && cell.character === character));
});

Then("ZEBRA's row hasn't changed", function (this: World) {
  const row = rowIndex(this, "ZEBRA's row");
  assert.deepEqual(boardOf(this).rows[row], JSON.parse(this.before!).rows[row]);
});

Then('another letter can be tapped straight away', function (this: World) {
  assert.deepEqual(boardOf(this).input('E'), []);
  assert.equal(rowText(this, rowIndex(this, "ZEBRA's row")), 'Z E _ _ _');
});

Then(/^the (E|É) is used$/, function (this: World, character: string) {
  const placed = boardOf(this).rows.flatMap((row) => row.cells).filter((cell) => cell.kind === 'placed');
  assert.equal(placed[placed.length - 1].character, character);
});

Then('only the drag carries on', function (this: World) {
  assert.ok(boardOf(this).drag);
  assert.equal(snapshot(this), this.before);
});

Then('its rightmost placed letter goes back to the pool', function (this: World) {
  assert.equal(boardOf(this).countOf('L'), JSON.parse(this.before!).pool.find((tile: { character: string }) => tile.character === 'L').count + 1);
});

// Split words (D48)

/** The cells of each part of a row: runs of letters between special characters. */
function partsOf(world: World, row: number): number[][] {
  const parts: number[][] = [[]];
  boardOf(world).rows[row].cells.forEach((cell, index) => {
    if (cell.kind === 'special') parts.push([]);
    else parts[parts.length - 1].push(index);
  });
  return parts.filter((part) => part.length > 0);
}

/** The cells of the part of a row's designed answer that spells this text. */
function partCells(world: World, row: number, text: string): number[] {
  const letters = cellsOf(boardOf(world).rows[row].word);
  const part = partsOf(world, row).find((cells) => cells.map((cell) => letters[cell]).join('') === text);
  assert.ok(part, `No part ${text} in row ${row + 1}`);
  return part;
}

function partIsLocked(world: World, row: number, text: string) {
  const { cells } = boardOf(world).rows[row];
  return partCells(world, row, text).every((cell) => cells[cell].kind === 'locked');
}

function placeAll(world: World, row: number, cells: number[], characters: string[]): BoardEvent[] {
  return cells.flatMap((cell, index) => place(world, row, cell, characters[index]));
}

When(/^the player places (.+?) in the (first|last) (?:(\w+) cells|cell) of (.+)'s row$/, function (this: World, list: string, end: string, count: string | undefined, word: string) {
  const row = rowIndex(this, `${word}'s row`);
  const letters = partsOf(this, row).flat();
  const size = count ? ['one', 'two', 'three', 'four', 'five'].indexOf(count) + 1 : 1;
  const cells = end === 'first' ? letters.slice(0, size) : letters.slice(-size);
  this.rowRef = row;
  act(this, () => placeAll(this, row, cells, list.split(/, | and /)));
});

When(/^the player fills (HOT DOG|T-REX)'s row with (.+)$/, function (this: World, word: string, filling: string) {
  const row = rowIndex(this, `${word}'s row`);
  this.rowRef = row;
  act(this, () => fillRow(this, row, filling));
});

Given(/^the player has filled (.+)'s row with (.+), so (\S+) locked$/, function (this: World, word: string, filling: string, part: string) {
  const row = rowIndex(this, `${word}'s row`);
  quietly(this, () => fillRow(this, row, filling));
  assert.ok(partIsLocked(this, row, part), rowText(this, row));
});

Given(/^(\S+) is locked in (.+)'s row$/, function (this: World, part: string, word: string) {
  const row = rowIndex(this, `${word}'s row`);
  this.rowRef = row;
  quietly(this, () => placeAll(this, row, partCells(this, row, part), [...part]));
  assert.ok(partIsLocked(this, row, part), rowText(this, row));
});

Then(/^(\S+) is still locked in (.+)'s row$/, function (this: World, part: string, word: string) {
  assert.ok(partIsLocked(this, rowIndex(this, `${word}'s row`), part));
});

When('the player tries to drag its H', function (this: World) {
  const row = this.rowRef!;
  const cell = boardOf(this).rows[row].cells.findIndex((candidate) => candidate.kind !== 'empty' && candidate.character === 'H');
  act(this, (board) => void board.pickUpFromCell(row, cell));
});

When(/^the player builds (.+) in (.+)'s row$/, function (this: World, word: string, target: string) {
  act(this, () => fillRow(this, rowIndex(this, `${target}'s row`), word));
});

Then(/^(.+) locks in (.+)'s row$/, function (this: World, word: string, target: string) {
  assert.ok(hasLock(this, word), JSON.stringify(this.events));
  assert.ok(boardOf(this).rows[rowIndex(this, `${target}'s row`)].locked);
});

Then(/^(\S+)'s cells? stays? empty$/, function (this: World, part: string) {
  const { cells } = boardOf(this).rows[this.rowRef!];
  assert.ok(partCells(this, this.rowRef!, part).every((cell) => cells[cell].kind === 'empty'), rowText(this, this.rowRef!));
});

Then('the D stays placed', function (this: World) {
  assert.ok(boardOf(this).rows[this.rowRef!].cells.some((cell) => cell.kind === 'placed' && cell.character === 'D'));
});

Then('nothing locks', function (this: World) {
  assert.ok(!this.events.some((event) => event.type === 'locked'), JSON.stringify(this.events));
  assert.ok(boardOf(this).rows.every((row) => !row.locked && row.cells.every((cell) => cell.kind !== 'locked')));
});
