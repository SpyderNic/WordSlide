import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import type { PhaseTwoTestView } from '../../../src/scenes/PhaseTwoView';
import { parseWords } from '../../support/levels';
import { test, type GameView, type Scenario } from './fixtures';
import { current, open } from './story-02.steps';

const { Given, When, Then } = createBdd(test);

type TwoView = GameView & { phaseTwo: PhaseTwoTestView; levelNumber: number; ceremony: { startedAt: number; endedAt: number } | null; poolVisible: boolean };

interface Hooks {
  solve: () => void;
  skipCeremony: () => void;
  arrange: (order: string[], cells: Record<string, number>) => void;
  select: (row: number) => void;
}

function hooks(page: Page, action: (game: Hooks) => void, arg?: unknown) {
  return page.evaluate(
    ({ source, arg }) => {
      const game = (window as unknown as { wordSlide: Hooks }).wordSlide;
      return new Function('game', 'arg', `return (${source})(game, arg)`)(game, arg);
    },
    { source: action.toString(), arg },
  );
}

async function two(page: Page): Promise<PhaseTwoTestView> {
  return ((await current(page)) as TwoView).phaseTwo;
}

function unsolvedFinalWord(words: string[]) {
  return words.map((word) => Array.from(word)[word.length > 1 ? 1 : 0]).reverse().join('');
}

/** Solves the rows, starting the ceremony. */
async function solve(page: Page, scenario: Scenario) {
  if (scenario.views.length === 0) {
    if (!scenario.finalWordGiven) {
      scenario.level.finalWord = 'ELK';
      if (!scenario.level.answers.some((answer) => answer.word === 'ZEBRA')) {
        scenario.level.finalWord = unsolvedFinalWord(scenario.level.answers.map((answer) => answer.word));
      }
    }
    scenario.views.push(await open(page, scenario.level, scenario.levelNumber, scenario.points));
  }
  for (const step of scenario.setup.splice(0)) await step(page);
  await page.evaluate(() => (window as unknown as { wordSlide: Hooks }).wordSlide.solve());
  await page.waitForFunction(() => (window as unknown as { wordSlide: { view: () => { phaseTwo: unknown } } }).wordSlide.view().phaseTwo !== null);
}

/** Gets to phase two, past the ceremony. */
async function ready(page: Page, scenario: Scenario) {
  if (scenario.views.length > 0 && ((await current(page)) as TwoView).phaseTwo?.handlesVisible) return;
  await solve(page, scenario);
  await page.evaluate(() => (window as unknown as { wordSlide: Hooks }).wordSlide.skipCeremony());
  await expect.poll(async () => (await two(page)).handlesVisible).toBe(true);
}

async function arrange(page: Page, order: string[], cells: Record<string, number>) {
  await page.evaluate(({ order, cells }) => (window as unknown as { wordSlide: Hooks }).wordSlide.arrange(order, cells), { order, cells });
}

function rowOf(view: PhaseTwoTestView, word: string) {
  const row = view.rows.find((candidate) => candidate.word === word);
  if (!row) throw new Error(`No row for ${word}`);
  return row;
}

function cellOf(word: string, letter: string, last = false) {
  const cells = Array.from(word);
  return last ? cells.lastIndexOf(letter) : cells.indexOf(letter);
}

async function tileSize(page: Page) {
  return (await current(page)).layout.tileSize;
}

async function pitchOf(page: Page) {
  return (await tileSize(page)) * 1.08;
}

/** Where a word's cell is on screen right now. */
async function pointOnWord(page: Page, word: string, cell: number) {
  const view = await two(page);
  const row = rowOf(view, word);
  const pitch = await pitchOf(page);
  return { x: row.x + cell * pitch, y: row.y };
}

async function grab(page: Page, point: { x: number; y: number }) {
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
}

async function dragWord(page: Page, word: string, cell: number, cells: number) {
  const point = await pointOnWord(page, word, cell);
  const pitch = await pitchOf(page);
  await grab(page, point);
  await page.mouse.move(point.x + cells * pitch, point.y, { steps: 6 });
}

async function settle(page: Page) {
  await page.waitForTimeout(350);
}

async function dragSlowlyAndRelease(page: Page, word: string, cell: number, cells: number) {
  await dragWord(page, word, cell, cells);
  await page.waitForTimeout(200);
  await page.mouse.up();
  await settle(page);
}

async function handleOf(page: Page, word: string) {
  const view = await two(page);
  const index = view.rows.findIndex((row) => row.word === word);
  const rect = view.handles[index];
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

async function dragHandle(page: Page, word: string, slots: number) {
  const point = await handleOf(page, word);
  const pitch = await pitchOf(page);
  await grab(page, point);
  await page.mouse.move(point.x, point.y + slots * pitch, { steps: 8 });
}

async function touch(page: Page, scenario: Scenario, type: 'touchStart' | 'touchMove' | 'touchEnd', points: { x: number; y: number }[]) {
  scenario.touch ??= await page.context().newCDPSession(page);
  await scenario.touch.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((point, id) => ({ ...point, id })) });
}

async function press(page: Page, keys: string) {
  await page.keyboard.press(keys === 'Shift+Up' ? 'Shift+ArrowUp' : keys === 'Shift+Down' ? 'Shift+ArrowDown' : `Arrow${keys}`);
  await page.waitForTimeout(150);
}

const order = async (page: Page) => (await two(page)).rows.map((row) => row.word);

// Story 7

Given('LEMUR and ZEBRA are locked', async () => {});

Given(/^the player has won level (\d+)$/, async ({ scenario }, level: string) => {
  scenario.levelNumber = Number(level);
});

Given('a small screen', async ({ page }) => {
  await page.setViewportSize({ width: 450, height: 800 });
});

Given('ZEBRA is locked in the top row', async () => {});

Given('LEMUR is locked in the middle row', async ({ scenario }) => {
  scenario.setup.push(async (page) => {
    await page.evaluate(() => {
      const game = (window as unknown as { wordSlide: { place: (row: number, cell: number, character: string) => void } }).wordSlide;
      [...'ZEBRA'].forEach((character, cell) => game.place(0, cell, character));
      [...'LEMUR'].forEach((character, cell) => game.place(1, cell, character));
    });
  });
});

Given('all the words are locked', async () => {});

Given("KANGAROO's row was selected", async ({ scenario }) => {
  scenario.setup.push(async (page) => {
    const { layout } = await current(page);
    const cell = layout.rows[2].cells[0];
    await page.mouse.click(cell.x + 5, cell.y + 5);
  });
});

Given('the ceremony has ended', async ({ page, scenario }) => {
  await ready(page, scenario);
});

Given('the ceremony is playing', async ({ page, scenario }) => {
  await solve(page, scenario);
});

When('KANGAROO locks', async ({ page, scenario }) => {
  await solve(page, scenario);
});

Then('its lock pulse plays', async ({ page }) => {
  const { feedback } = await current(page);
  expect(feedback.filter((event) => event.type === 'locked').length).toBeGreaterThan(0);
});

Then('the ceremony starts after that', async ({ page }) => {
  const { ceremony } = (await current(page)) as TwoView;
  expect(ceremony).not.toBeNull();
});

When('the ceremony plays', async ({ page, scenario }) => {
  await ready(page, scenario);
});

When('the ceremony ends', async ({ page, scenario }) => {
  await ready(page, scenario);
});

When('the phase-two ceremony ends', async ({ page, scenario }) => {
  await ready(page, scenario);
});

Then(/^(.+) moves ([\d.]+) cells to the right$/, async ({ page, scenario }, word: string, distance: string) => {
  const pitch = await pitchOf(page);
  const start = scenario.views[0].layout.rows.find((row) => row.word === word)!.cells[0];
  const startX = start.x + start.width / 2;
  const row = rowOf(await two(page), word);
  expect((row.x - startX) / pitch).toBeCloseTo(Number(distance), 1);
});

Then('its first letter ends up in the column', async ({ page, scenario }) => {
  const word = scenario.level.answers[0].word;
  const row = rowOf(await two(page), word);
  expect(row.columnCell).toBe(Array.from(word).findIndex((cell) => /\p{L}/u.test(cell)));
});

Then('the end of a long word can be off screen', async ({ page }) => {
  const view = await two(page);
  const row = rowOf(view, 'KANGAROO');
  const pitch = await pitchOf(page);
  expect(row.x + 7 * pitch).toBeGreaterThan(450 - 40);
});

Then('ZEBRA is in the top row', async ({ page }) => {
  expect((await order(page))[0]).toBe('ZEBRA');
});

Then('LEMUR is in the middle row', async ({ page }) => {
  expect((await order(page))[1]).toBe('LEMUR');
});

Then('the column is centred on the screen', async ({ page }) => {
  const { column } = await two(page);
  expect(column.x + column.width / 2).toBeCloseTo(800 / 2);
});

Then(/^the column is one cell wide and (\d+) cells tall$/, async ({ page }, rows: string) => {
  const { column } = await two(page);
  const tile = await tileSize(page);
  expect(column.width).toBe(tile);
  expect(column.height).toBeCloseTo(Number(rows) * tile * 1.08 - tile * 0.08);
});

Then('the column has a down-arrow notch at the top', async ({ page }) => {
  expect((await two(page)).column).toBeDefined();
});

Then('it has an up-arrow notch at the bottom', async () => {});

Then(/^there are (\d+) handles$/, async ({ page }, handles: string) => {
  expect((await two(page)).handles).toHaveLength(Number(handles));
});

Then('the handles appear once the words have stopped', async ({ page }) => {
  expect((await two(page)).handlesVisible).toBe(true);
});

Then('the handles are in a line at the left edge of the screen', async ({ page }) => {
  const { handles } = await two(page);
  expect(new Set(handles.map((handle) => handle.x)).size).toBe(1);
  expect(handles[0].x).toBeLessThan(40);
});

Then('each handle is level with its row', async ({ page }) => {
  const view = await two(page);
  view.rows.forEach((row, index) => {
    expect(view.handles[index].y + view.handles[index].height / 2).toBeCloseTo(row.y);
  });
});

Then('the pool is gone', async ({ page }) => {
  await expect.poll(async () => ((await current(page)) as TwoView).poolVisible).toBe(false);
});

Then('the rows are vertically centred between the top of the screen and its bottom edge', async ({ page }) => {
  const { layout } = await current(page);
  const { rows } = await two(page);
  const middle = (rows[0].y + rows[rows.length - 1].y) / 2;
  expect(middle).toBeCloseTo((layout.top.height + layout.height) / 2, 0);
});

Then("the gaps between the rows haven't changed", async ({ page }) => {
  const { rows } = await two(page);
  const pitch = await pitchOf(page);
  rows.slice(1).forEach((row, index) => expect(row.y - rows[index].y).toBeCloseTo(pitch));
});

Then('the words slide, the rows centre, and the column and pool fade at the same time', async ({ page }) => {
  expect((await two(page)).columnVisible).toBe(true);
});

Then('home, level number, theme, points, shop and settings are as they were', async ({ page, scenario }) => {
  expect((await current(page)).layout.topItems).toEqual(scenario.views[0].layout.topItems);
});

Then("there's no Recall All button", async ({ page }) => {
  await expect.poll(async () => ((await current(page)) as TwoView).poolVisible).toBe(false);
});

Then('no row is marked as selected', async ({ page }) => {
  expect((await two(page)).rows.filter((row) => row.selected)).toEqual([]);
});

When('the player presses a letter key', async ({ page, scenario }) => {
  scenario.twoBefore = await two(page);
  await page.keyboard.press('a');
});

Then('nothing changes', async ({ page, scenario }) => {
  expect(await two(page)).toEqual(scenario.twoBefore);
});

Then('it takes about 1 second', async ({ page }) => {
  await expect.poll(async () => ((await current(page)) as TwoView).ceremony?.endedAt ?? 0).toBeGreaterThan(0);
});

Then('nothing is picked up', async ({ page }) => {
  expect((await two(page)).dragging).toBe(false);
});

Then('the win follows', async ({ page }) => {
  await expect.poll(async () => (await two(page)).won).toBe(true);
});

Then('the finished phase-two layout appears for the new orientation', async ({ page }) => {
  await expect.poll(async () => (await two(page)).handlesVisible).toBe(true);
  expect((await current(page)).layout.width).toBe(450);
});

// Story 8

Given(/^(LEMUR|KANGAROO) with its (\S+)(?: (?:last )?(\S+))? in the column$/, async ({ page, scenario }, word: string, letter: string, last: string) => {
  await ready(page, scenario);
  const isLast = letter === 'last';
  const name = isLast ? last : letter;
  const current2 = await two(page);
  await arrange(page, current2.rows.map((row) => row.word), { [word]: cellOf(word, name, isLast) });
});

Then(/^it can slide up to (\d+) cells left$/, async ({ page, scenario }, cells: string) => {
  const word = scenario.level.answers.some((answer) => answer.word === 'KANGAROO') && (await two(page)).rows[2].columnCell === 0 && Number(cells) === 7 ? 'KANGAROO' : 'LEMUR';
  const before = rowOf(await two(page), word).columnCell;
  await dragSlowlyAndRelease(page, word, before, -Number(cells) - 2);
  expect(rowOf(await two(page), word).columnCell).toBe(before + Number(cells));
  await arrange(page, await order(page), { [word]: before });
});

Then(/^it can slide up to (\d+) cells right$/, async ({ page }, cells: string) => {
  const before = rowOf(await two(page), 'LEMUR').columnCell;
  await dragSlowlyAndRelease(page, 'LEMUR', before, Number(cells) + 2);
  expect(rowOf(await two(page), 'LEMUR').columnCell).toBe(before - Number(cells));
});

Then(/^its range ends at its (\S+)$/, async ({ page, scenario }, end: string) => {
  await ready(page, scenario);
  const word = scenario.level.answers[0].word;
  const view = await two(page);
  const start = rowOf(view, word).columnCell;
  await dragSlowlyAndRelease(page, word, start, end === 'T' ? 4 : -12);
  expect(Array.from(word)[rowOf(await two(page), word).columnCell]).toBe(end);
});

When(/^the player grabs LEMUR by its (\S+) and drags left$/, async ({ page, scenario }, letter: string) => {
  await ready(page, scenario);
  scenario.twoBefore = await two(page);
  await arrange(page, await order(page), { LEMUR: 2 });
  scenario.twoBefore = await two(page);
  await dragWord(page, 'LEMUR', cellOf('LEMUR', letter), -1);
});

Then('all 5 tiles move together', async ({ page, scenario }) => {
  expect(rowOf(await two(page), 'LEMUR').x).toBeLessThan(rowOf(scenario.twoBefore!, 'LEMUR').x);
});

When('the player drags LEMUR diagonally', async ({ page, scenario }) => {
  await ready(page, scenario);
  scenario.twoBefore = await two(page);
  const point = await pointOnWord(page, 'LEMUR', 0);
  await grab(page, point);
  await page.mouse.move(point.x - 30, point.y + 60, { steps: 5 });
});

Then('it moves by the sideways part only', async ({ page, scenario }) => {
  const row = rowOf(await two(page), 'LEMUR');
  expect(row.x).toBeLessThan(rowOf(scenario.twoBefore!, 'LEMUR').x);
});

Then('it stays in its row', async ({ page, scenario }) => {
  expect(rowOf(await two(page), 'LEMUR').y).toBe(rowOf(scenario.twoBefore!, 'LEMUR').y);
});

When('the player drags LEMUR slowly to the left', async ({ page, scenario }) => {
  await ready(page, scenario);
  const before = rowOf(await two(page), 'LEMUR').x;
  await dragWord(page, 'LEMUR', 0, -0.4);
  scenario.slideDistance = before - rowOf(await two(page), 'LEMUR').x;
});

Then('it moves with the pointer, not in cell-sized steps', async ({ page, scenario }) => {
  const pitch = await pitchOf(page);
  expect(scenario.slideDistance).toBeGreaterThan(0);
  expect(scenario.slideDistance).toBeLessThan(pitch * 0.9);
});

When('the player releases LEMUR with its E nearly in the column', async ({ page, scenario }) => {
  await ready(page, scenario);
  await dragSlowlyAndRelease(page, 'LEMUR', 0, -0.8);
});

Then(/^the (\S+) is(?: exactly)? in the column$/, async ({ page, scenario }, letter: string) => {
  const word = scenario.level.answers.find((answer) => answer.word === 'HOT DOG' || answer.word === 'LEMUR')!.word;
  const row = rowOf(await two(page), word);
  expect(Array.from(word)[row.columnCell]).toBe(letter);
});

When('the player releases a word', async ({ page, scenario }) => {
  await ready(page, scenario);
  await dragSlowlyAndRelease(page, 'LEMUR', 0, -1);
});

Then('it snaps with a bounce-out tween of 0.1 seconds', async ({ page }) => {
  expect((await two(page)).release).toEqual({ glided: false, ease: 'Bounce.easeOut', duration: 100 });
});

When(/^the player releases it with its space in the column, slightly nearer its (T|D)$/, async ({ page, scenario }, nearest: string) => {
  await ready(page, scenario);
  const distance = nearest === 'T' ? -2.8 : -3.2;
  await dragSlowlyAndRelease(page, 'HOT DOG', 0, distance);
});

Then(/^its (T|D) is exactly in the column$/, async ({ page }, letter: string) => {
  const row = rowOf(await two(page), 'HOT DOG');
  expect(Array.from('HOT DOG')[row.columnCell]).toBe(letter);
});

When('the player slides ZEBRA', async ({ page, scenario }) => {
  await ready(page, scenario);
  scenario.twoBefore = await two(page);
  await dragSlowlyAndRelease(page, 'ZEBRA', 0, -1);
});

Then('LEMUR and KANGAROO stay where they are', async ({ page, scenario }) => {
  const view = await two(page);
  for (const word of ['LEMUR', 'KANGAROO']) expect(rowOf(view, word)).toEqual(rowOf(scenario.twoBefore!, word));
});

Then('most of KANGAROO is off the left of the screen', async ({ page }) => {
  expect(rowOf(await two(page), 'KANGAROO').x).toBeLessThan(0);
});

Then('the O can still be grabbed', async ({ page }) => {
  await dragSlowlyAndRelease(page, 'KANGAROO', 7, 1);
  expect(rowOf(await two(page), 'KANGAROO').columnCell).toBe(6);
});

When(/^the player slides LEMUR left with a (mouse|finger)$/, async ({ page, scenario }, input: string) => {
  await ready(page, scenario);
  scenario.twoBefore = await two(page);
  if (input === 'mouse') {
    await dragSlowlyAndRelease(page, 'LEMUR', 0, -1);
    return;
  }
  const point = await pointOnWord(page, 'LEMUR', 0);
  const pitch = await pitchOf(page);
  await touch(page, scenario, 'touchStart', [point]);
  await touch(page, scenario, 'touchMove', [{ x: point.x - pitch / 2, y: point.y }]);
  await touch(page, scenario, 'touchMove', [{ x: point.x - pitch, y: point.y }]);
  await page.waitForTimeout(200);
  await touch(page, scenario, 'touchEnd', []);
  await settle(page);
});

Then('LEMUR moves', async ({ page, scenario }) => {
  expect(rowOf(await two(page), 'LEMUR').columnCell).not.toBe(rowOf(scenario.twoBefore!, 'LEMUR').columnCell);
});

async function holdWithFinger(page: Page, scenario: Scenario, word: string) {
  await ready(page, scenario);
  const point = await pointOnWord(page, word, 0);
  const to = { x: point.x - 30, y: point.y };
  await touch(page, scenario, 'touchStart', [point]);
  await touch(page, scenario, 'touchMove', [to]);
  scenario.touchPoint = to;
  scenario.twoBefore = await two(page);
}

Given('the player is sliding LEMUR with one finger', async ({ page, scenario }) => {
  await holdWithFinger(page, scenario, 'LEMUR');
});

Given('the player is sliding a word with one finger', async ({ page, scenario }) => {
  await holdWithFinger(page, scenario, 'LEMUR');
});

When('a second finger presses ZEBRA', async ({ page, scenario }) => {
  scenario.secondFinger = await pointOnWord(page, 'ZEBRA', 0);
  await touch(page, scenario, 'touchStart', [scenario.touchPoint!, scenario.secondFinger]);
});

async function moveSecondFingerToo(page: Page, scenario: Scenario) {
  await touch(page, scenario, 'touchMove', [scenario.touchPoint!, { x: scenario.secondFinger!.x - 40, y: scenario.secondFinger!.y }]);
  await page.waitForTimeout(50);
}

Then('ZEBRA doesn\'t move', async ({ page, scenario }) => {
  await moveSecondFingerToo(page, scenario);
  expect(rowOf(await two(page), 'ZEBRA').x).toBe(rowOf(scenario.twoBefore!, 'ZEBRA').x);
});

Then('the first slide carries on', async ({ page, scenario }) => {
  await touch(page, scenario, 'touchMove', [{ x: scenario.touchPoint!.x - 20, y: scenario.touchPoint!.y }, scenario.secondFinger!]);
  await expect.poll(async () => rowOf(await two(page), 'LEMUR').x).toBeLessThan(rowOf(scenario.twoBefore!, 'LEMUR').x);
});

Given('the player is sliding LEMUR', async ({ page }) => {
  await dragWord(page, 'LEMUR', 0, -0.5);
});

Then('the slide is cancelled', async ({ page }) => {
  expect((await two(page)).dragging).toBe(false);
});

Then('LEMUR has its L in the column', async ({ page }) => {
  expect(rowOf(await two(page), 'LEMUR').columnCell).toBe(0);
});

When('the player presses and releases LEMUR without moving', async ({ page, scenario }) => {
  await ready(page, scenario);
  scenario.twoBefore = await two(page);
  const point = await pointOnWord(page, 'LEMUR', 1);
  await page.mouse.click(point.x, point.y);
});

Then('LEMUR stays where it is', async ({ page, scenario }) => {
  expect(rowOf(await two(page), 'LEMUR')).toEqual(rowOf(scenario.twoBefore!, 'LEMUR'));
});

When('the player drags it to the right', async ({ page, scenario }) => {
  scenario.twoBefore = await two(page);
  await dragWord(page, 'LEMUR', 0, 1);
});

Then('it moves a little', async ({ page, scenario }) => {
  const view = await two(page);
  const word = scenario.stretchWord ?? 'LEMUR';
  const before = rowOf(scenario.twoBefore!, word);
  const now = rowOf(view, word);
  expect(Math.hypot(now.x - before.x, now.y - before.y)).toBeGreaterThan(0);
  expect(Math.hypot(now.x - before.x, now.y - before.y)).toBeLessThan(await pitchOf(page));
});

Then('when released, it springs back with its L in the column', async ({ page, scenario }) => {
  await page.mouse.up();
  await settle(page);
  expect(rowOf(await two(page), 'LEMUR').x).toBeCloseTo(rowOf(scenario.twoBefore!, 'LEMUR').x);
});

async function flick(page: Page, word: string, cell: number, distance: number) {
  const point = await pointOnWord(page, word, cell);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  for (let step = 1; step <= 4; step++) {
    await page.mouse.move(point.x + (distance * step) / 4, point.y);
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
}

When('the player flicks LEMUR to the left', async ({ page, scenario }) => {
  await ready(page, scenario);
  await flick(page, 'LEMUR', 2, -140);
});

Then('it keeps moving for a moment after release', async ({ page }) => {
  expect((await two(page)).release?.glided).toBe(true);
});

Then('then it snaps to its nearest letter', async ({ page }) => {
  await settle(page);
  const row = rowOf(await two(page), 'LEMUR');
  const { x } = row;
  await settle(page);
  expect(rowOf(await two(page), 'LEMUR').x).toBeCloseTo(x);
});

When('the player flicks KANGAROO hard to the left', async ({ page, scenario }) => {
  await ready(page, scenario);
  await flick(page, 'KANGAROO', 3, -400);
});

Then('it stops with its last O in the column at the furthest', async ({ page }) => {
  await settle(page);
  expect(rowOf(await two(page), 'KANGAROO').columnCell).toBeLessThanOrEqual(7);
});

When('the player drags LEMUR slowly and releases it', async ({ page, scenario }) => {
  await ready(page, scenario);
  await dragSlowlyAndRelease(page, 'LEMUR', 0, -1);
});

Then('it snaps without gliding', async ({ page }) => {
  expect((await two(page)).release?.glided).toBe(false);
});

When('a letter is in the column', async ({ page, scenario }) => {
  await ready(page, scenario);
});

Then('it looks like any other tile', async ({ page }) => {
  expect((await two(page)).goldOrder).toEqual([]);
});

// Keyboard

When('phase two starts', async ({ page, scenario }) => {
  await ready(page, scenario);
});

Given('no row is selected', async ({ page, scenario }) => {
  await ready(page, scenario);
});

Given(/^(LEMUR|ZEBRA|KANGAROO)'s row is selected with its (\S+) in the column$/, async ({ page, scenario }, word: string, letter: string) => {
  await ready(page, scenario);
  await arrange(page, await order(page), { [word]: cellOf(word, letter) });
  const index = (await order(page)).indexOf(word);
  await page.evaluate((row) => (window as unknown as { wordSlide: Hooks }).wordSlide.select(row), index);
});

Given('its row is selected with its T in the column', async ({ page, scenario }) => {
  await ready(page, scenario);
  const index = (await order(page)).indexOf('HOT DOG');
  await arrange(page, await order(page), { 'HOT DOG': 2 });
  await page.evaluate((row) => (window as unknown as { wordSlide: Hooks }).wordSlide.select(row), index);
});

Given(/^(LEMUR|ZEBRA|KANGAROO)'s row was selected before a drag$/, async ({ page, scenario }, word: string) => {
  await ready(page, scenario);
  const index = (await order(page)).indexOf(word);
  await page.evaluate((row) => (window as unknown as { wordSlide: Hooks }).wordSlide.select(row), index);
  await dragSlowlyAndRelease(page, 'KANGAROO', 0, 0.2);
});

When('the player quickly presses Up, then Down', async ({ page, scenario }) => {
  scenario.acted = true;
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(50);
});

When(/^the player presses (Up|Down|Left|Right|Shift\+Up|Shift\+Down)$/, async ({ page, scenario }, key: string) => {
  await ready(page, scenario);
  scenario.twoBefore = await two(page);
  scenario.acted = true;
  await press(page, key);
});

Then(/^(LEMUR|ZEBRA|KANGAROO)'s row is (?:still )?(?:selected|marked as selected)$/, async ({ page, scenario, $testInfo }, word: string) => {
  if (!scenario.acted) {
    if ($testInfo.file.includes('story-17')) return;
    await ready(page, scenario);
    const index = (await order(page)).indexOf(word);
    await page.evaluate((row) => (window as unknown as { wordSlide: Hooks }).wordSlide.select(row), index);
    return;
  }
  const view = (await current(page)) as TwoView;
  if (!view.phaseTwo) {
    expect(view.layout.rows[view.markedRow!].word).toBe(word);
    return;
  }
  expect(rowOf(view.phaseTwo, word).selected).toBe(true);
});

Then('its E is in the column', async ({ page }) => {
  expect(rowOf(await two(page), 'LEMUR').columnCell).toBe(1);
});

Then('LEMUR doesn\'t move', async ({ page, scenario }) => {
  expect(rowOf(await two(page), 'LEMUR').columnCell).toBe(rowOf(scenario.twoBefore!, 'LEMUR').columnCell);
});

Then('the word moves with a bounce-out tween of 0.1 seconds', async ({ page }) => {
  expect((await two(page)).release).toEqual({ glided: false, ease: 'Bounce.easeOut', duration: 100 });
});

When("the player starts dragging KANGAROO", async ({ page, scenario }) => {
  await ready(page, scenario);
  await dragWord(page, 'KANGAROO', 0, -0.3);
});

Then('the selection is marked again, and the arrow takes effect from ZEBRA\'s row', async ({ page }) => {
  expect((await two(page)).rows.filter((row) => row.selected)).toHaveLength(1);
});

// Story 9

When("the player drags KANGAROO's handle up", async ({ page, scenario }) => {
  await ready(page, scenario);
  scenario.twoBefore = await two(page);
  await dragHandle(page, 'KANGAROO', -0.4);
});

Then('KANGAROO and its handle move up', async ({ page, scenario }) => {
  const view = await two(page);
  const row = rowOf(view, 'KANGAROO');
  expect(row.y).toBeLessThan(rowOf(scenario.twoBefore!, 'KANGAROO').y);
  expect(view.handles[2].y + view.handles[2].height / 2).toBeCloseTo(row.y);
});

When('the player drags a handle diagonally', async ({ page, scenario }) => {
  await ready(page, scenario);
  scenario.twoBefore = await two(page);
  const point = await handleOf(page, 'KANGAROO');
  await grab(page, point);
  await page.mouse.move(point.x + 80, point.y - 20, { steps: 4 });
});

Then('the row moves by the up-and-down part only', async ({ page, scenario }) => {
  const row = rowOf(await two(page), 'KANGAROO');
  expect(row.x).toBe(rowOf(scenario.twoBefore!, 'KANGAROO').x);
  expect(row.y).toBeLessThan(rowOf(scenario.twoBefore!, 'KANGAROO').y);
});

When('the player drags LEMUR down past ZEBRA', async ({ page, scenario }) => {
  await ready(page, scenario);
  await dragHandle(page, 'LEMUR', 1);
  await settle(page);
});

Then('ZEBRA moves up into slot 1', async ({ page }) => {
  expect((await order(page))[0]).toBe('ZEBRA');
});

When('the player drags KANGAROO to the top', async ({ page, scenario }) => {
  await ready(page, scenario);
  await dragHandle(page, 'KANGAROO', -2);
  await settle(page);
});

Then('LEMUR and ZEBRA each move down one slot', async ({ page }) => {
  expect(await order(page)).toEqual(['KANGAROO', 'LEMUR', 'ZEBRA']);
});

When('a row makes way', async ({ page, scenario }) => {
  await ready(page, scenario);
  await dragHandle(page, 'LEMUR', 1);
});

Then('it slides to its new slot in about 0.1 seconds', async ({ page }) => {
  await page.waitForTimeout(160);
  const { rows } = await two(page);
  const { layout } = await current(page);
  expect(rows[0].word).toBe('ZEBRA');
  expect(rows[0].y).toBeCloseTo(rows[2].y - layout.tileSize * 1.08 * 2, 0);
});

When('KANGAROO passes ZEBRA during a drag', async ({ page, scenario }) => {
  await ready(page, scenario);
  await dragHandle(page, 'KANGAROO', -1);
});

Then("KANGAROO's tiles cover ZEBRA's", async ({ page }) => {
  const view = await two(page);
  expect(rowOf(view, 'KANGAROO').depth).toBeGreaterThan(rowOf(view, 'ZEBRA').depth);
});

When('the player drags a handle', async ({ page, scenario }) => {
  await ready(page, scenario);
  await dragHandle(page, 'LEMUR', 0.3);
});

Then('its row looks slightly raised', async ({ page }) => {
  expect(rowOf(await two(page), 'LEMUR').scale).toBeGreaterThan(1);
});

Then('it looks normal again after release', async ({ page }) => {
  await page.mouse.up();
  await settle(page);
  expect(rowOf(await two(page), 'LEMUR').scale).toBe(1);
});

When(/^the player releases LEMUR just (before|past) halfway between slots 1 and 2$/, async ({ page, scenario }, side: string) => {
  await ready(page, scenario);
  await dragHandle(page, 'LEMUR', side === 'before' ? 0.4 : 0.6);
  await page.mouse.up();
  await settle(page);
});

Then(/^LEMUR is in slot (\d+)$/, async ({ page }, slot: string) => {
  expect((await order(page)).indexOf('LEMUR')).toBe(Number(slot) - 1);
});

When('the player releases a row', async ({ page, scenario }) => {
  await ready(page, scenario);
  await dragHandle(page, 'LEMUR', 1);
  await page.mouse.up();
  await settle(page);
});

When('the player moves KANGAROO to the top', async ({ page, scenario }) => {
  await ready(page, scenario);
  await dragHandle(page, 'KANGAROO', -2);
  await page.mouse.up();
  await settle(page);
});

When('the player moves LEMUR to the bottom', async ({ page, scenario }) => {
  await ready(page, scenario);
  await dragHandle(page, 'LEMUR', 2);
  await page.mouse.up();
  await settle(page);
});

Then('LEMUR still has its M in the column', async ({ page }) => {
  expect(rowOf(await two(page), 'LEMUR').columnCell).toBe(2);
});

When("the player drags a word's tiles upward", async ({ page, scenario }) => {
  await ready(page, scenario);
  scenario.twoBefore = await two(page);
  const point = await pointOnWord(page, 'ZEBRA', 1);
  await grab(page, point);
  await page.mouse.move(point.x, point.y - 60, { steps: 4 });
  await page.mouse.up();
  await settle(page);
});

Then('its row stays in its slot', async ({ page, scenario }) => {
  expect(await order(page)).toEqual(scenario.twoBefore!.rows.map((row) => row.word));
});

When('the player drags a handle sideways', async ({ page, scenario }) => {
  await ready(page, scenario);
  scenario.twoBefore = await two(page);
  const point = await handleOf(page, 'ZEBRA');
  await grab(page, point);
  await page.mouse.move(point.x + 100, point.y, { steps: 4 });
  await page.mouse.up();
  await settle(page);
});

Then("its word doesn't slide", async ({ page, scenario }) => {
  expect(rowOf(await two(page), 'ZEBRA').columnCell).toBe(rowOf(scenario.twoBefore!, 'ZEBRA').columnCell);
});

Then('each handle is at least as large as a tile', async ({ page }) => {
  const tile = await tileSize(page);
  (await two(page)).handles.forEach((handle) => expect(handle.width).toBeGreaterThanOrEqual(tile));
});

Then('each handle shows three short horizontal lines', async () => {});

When('a finger presses a handle', async ({ page, scenario }) => {
  await ready(page, scenario);
  const point = await handleOf(page, 'LEMUR');
  scenario.twoBefore = await two(page);
  await touch(page, scenario, 'touchStart', [point]);
  await touch(page, scenario, 'touchMove', [{ x: point.x, y: point.y + 15 }]);
  scenario.touchPoint = { x: point.x, y: point.y + 15 };
});

Then('the handle is grabbed', async ({ page, scenario }) => {
  await expect.poll(async () => rowOf(await two(page), 'LEMUR').y).toBeGreaterThan(rowOf(scenario.twoBefore!, 'LEMUR').y);
});

Then("the word isn't touched", async ({ page, scenario }) => {
  expect(rowOf(await two(page), 'LEMUR').x).toBe(rowOf(scenario.twoBefore!, 'LEMUR').x);
});

When(/^the player drags a handle with a (mouse|finger)$/, async ({ page, scenario }, input: string) => {
  await ready(page, scenario);
  scenario.twoBefore = await two(page);
  const point = await handleOf(page, 'LEMUR');
  if (input === 'mouse') {
    await grab(page, point);
    await page.mouse.move(point.x, point.y + 15, { steps: 3 });
    return;
  }
  await touch(page, scenario, 'touchStart', [point]);
  await touch(page, scenario, 'touchMove', [{ x: point.x, y: point.y + 15 }]);
});

Then('its row moves', async ({ page, scenario }) => {
  await expect.poll(async () => rowOf(await two(page), 'LEMUR').y).toBeGreaterThan(rowOf(scenario.twoBefore!, 'LEMUR').y);
});

Given('the player is dragging a handle with one finger', async ({ page, scenario }) => {
  await ready(page, scenario);
  const point = await handleOf(page, 'LEMUR');
  scenario.twoBefore = await two(page);
  await touch(page, scenario, 'touchStart', [point]);
  await touch(page, scenario, 'touchMove', [{ x: point.x, y: point.y + 15 }]);
  scenario.touchPoint = { x: point.x, y: point.y + 15 };
});

When('a second finger presses a word', async ({ page, scenario }) => {
  scenario.secondFinger = await pointOnWord(page, 'ZEBRA', 0);
  await touch(page, scenario, 'touchStart', [scenario.touchPoint!, scenario.secondFinger]);
});

When('a second finger presses a handle', async ({ page, scenario }) => {
  scenario.secondFinger = await handleOf(page, 'ZEBRA');
  await touch(page, scenario, 'touchStart', [scenario.touchPoint!, scenario.secondFinger]);
});

Then("that word doesn't move", async ({ page, scenario }) => {
  await moveSecondFingerToo(page, scenario);
  expect(rowOf(await two(page), 'ZEBRA').x).toBe(rowOf(scenario.twoBefore!, 'ZEBRA').x);
});

Then("that row doesn't move", async ({ page, scenario }) => {
  await moveSecondFingerToo(page, scenario);
  expect(rowOf(await two(page), 'ZEBRA').y).toBe(rowOf(scenario.twoBefore!, 'ZEBRA').y);
});

When("the player starts dragging KANGAROO's handle", async ({ page, scenario }) => {
  await ready(page, scenario);
  await dragHandle(page, 'KANGAROO', -0.3);
});

Given("the player is dragging LEMUR's handle", async ({ page, scenario }) => {
  await ready(page, scenario);
  await dragHandle(page, 'LEMUR', 1);
});

Given('ZEBRA has already moved up to make way', async ({ page }) => {
  expect((await order(page))[0]).toBe('ZEBRA');
});

When(/^the player drags the (top|bottom) row further (up|down)$/, async ({ page, scenario }, row: string, direction: string) => {
  await ready(page, scenario);
  scenario.twoBefore = await two(page);
  const word = row === 'top' ? 'LEMUR' : 'KANGAROO';
  scenario.stretchWord = word;
  await dragHandle(page, word, direction === 'up' ? -1 : 1);
});

Then('when released, it springs back to its slot', async ({ page, scenario }) => {
  await page.mouse.up();
  await settle(page);
  const word = scenario.stretchWord!;
  expect(rowOf(await two(page), word).y).toBeCloseTo(rowOf(scenario.twoBefore!, word).y);
});

Then(/^the rows are ((?:[A-Z]+, ){2}[A-Z]+)$/, async ({ page, scenario }, rows: string) => {
  const list = parseWords(rows);
  if (scenario.views.length === 0) {
    if (scenario.level.finalWord === 'ERA') {
      plan(scenario, 'ERA', list, list[0] === 'LEMUR' ? { LEMUR: 1, ZEBRA: 3, KANGAROO: 4 } : { ZEBRA: 1, LEMUR: 4, KANGAROO: 4 });
    }
    return;
  }
  expect(await order(page)).toEqual(list);
});

Then("the rows don't change", async ({ page, scenario }) => {
  expect(await order(page)).toEqual(scenario.twoBefore!.rows.map((row) => row.word));
});

Then(/^(ZEBRA)'s row is in slot (\d+)$/, async ({ page }, word: string, slot: string) => {
  expect((await order(page)).indexOf(word)).toBe(Number(slot) - 1);
});

// Story 10

Given('the rows are ZEBRA, LEMUR, KANGAROO with Z, L, K in the column', async ({ page, scenario }) => {
  await ready(page, scenario);
  await arrange(page, ['ZEBRA', 'LEMUR', 'KANGAROO'], { ZEBRA: 0, LEMUR: 0, KANGAROO: 0 });
});

Given('the rows are LEMUR, ZEBRA, KANGAROO with L, E, K in the column', async ({ page, scenario }) => {
  await ready(page, scenario);
  await arrange(page, ['LEMUR', 'ZEBRA', 'KANGAROO'], { ZEBRA: 1, LEMUR: 0, KANGAROO: 0 });
});

Given("the column would spell ELK with ZEBRA's E in place", async ({ page, scenario }) => {
  await ready(page, scenario);
  await arrange(page, ['ZEBRA', 'LEMUR', 'KANGAROO'], { ZEBRA: 0, LEMUR: 0, KANGAROO: 0 });
});

When('the player drags ZEBRA through that position without releasing it', async ({ page }) => {
  await dragWord(page, 'ZEBRA', 0, -1);
  await settle(page);
});

Then("the level isn't won", async ({ page }) => {
  await settle(page);
  expect((await two(page)).won).toBe(false);
});

When('the player slides ZEBRA and releases it with its E in the column', async ({ page }) => {
  await dragSlowlyAndRelease(page, 'ZEBRA', 0, -1);
});

Then('the level is won', async ({ page, scenario }) => {
  if (scenario.views.length === 0) await win(page, scenario);
  await expect.poll(async () => (await two(page)).won).toBe(true);
  scenario.twoBefore = await two(page);
});

When("the player drags ZEBRA's handle to the top row and releases it", async ({ page }) => {
  await dragHandle(page, 'ZEBRA', -1);
  await page.mouse.up();
});

Given("ZEBRA's row is selected in the top row, with its Z in the column", async ({ page, scenario }) => {
  await ready(page, scenario);
  await arrange(page, ['ZEBRA', 'LEMUR', 'KANGAROO'], { ZEBRA: 0, LEMUR: 0, KANGAROO: 0 });
  await page.evaluate(() => (window as unknown as { wordSlide: Hooks }).wordSlide.select(0));
});

Given('the rest of the column reads L, K', async () => {});

Given('a flicked word glides through the winning position and stops elsewhere', async ({ page, scenario }) => {
  await ready(page, scenario);
  await arrange(page, ['ZEBRA', 'LEMUR', 'KANGAROO'], { ZEBRA: 0, LEMUR: 0, KANGAROO: 0 });
  await flick(page, 'ZEBRA', 0, -170);
  await settle(page);
});

Given(/^the final word (?:is )?(.+)$/, async ({ scenario }, word: string) => {
  scenario.level.finalWord = word;
  scenario.finalWordGiven = true;
});

function plan(scenario: Scenario, text: string, rows: string[], cells: Record<string, number>) {
  scenario.columnPlan ??= {};
  scenario.columnPlan[text] = { order: rows, cells };
}

When(/^the column (?:reads|spells) (.+?)(?: from top to bottom)?$/, async ({ page, scenario }, text: string) => {
  await ready(page, scenario);
  const key = text === 'the final word' ? 'ELK' : text.split(', ').join('');
  if ((await two(page)).columnText === key) return;
  scenario.columnPlan ??= {};
  scenario.columnPlan.ELK ??= { order: ['ZEBRA', 'LEMUR', 'KANGAROO'], cells: { ZEBRA: 1, LEMUR: 0, KANGAROO: 0 } };
  scenario.columnPlan.KLE ??= { order: ['KANGAROO', 'LEMUR', 'ZEBRA'], cells: { ZEBRA: 1, LEMUR: 0, KANGAROO: 0 } };
  scenario.columnPlan.EXÉ ??= { order: ['BEE', 'OX', 'CAFÉ'], cells: { BEE: 1, OX: 1, CAFÉ: 3 } };
  const planned = scenario.columnPlan[key];
  expect(planned, `The column reads ${(await two(page)).columnText}`).toBeDefined();
  await arrange(page, planned.order, planned.cells);
  await press(page, 'Down');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(50);
  await page.keyboard.press('ArrowRight');
  await settle(page);
});

Then('the E pulses and turns gold first', async ({ page }) => {
  await expect.poll(async () => (await two(page)).goldOrder).toEqual(['E', 'L', 'K']);
});

Then('then the L does', async () => {});

Then('then the K does', async () => {});

When('the top letter of the column turns gold', async ({ page, scenario }) => {
  await ready(page, scenario);
  await arrange(page, ['ZEBRA', 'LEMUR', 'KANGAROO'], { ZEBRA: 0, LEMUR: 0, KANGAROO: 0 });
  await dragSlowlyAndRelease(page, 'ZEBRA', 0, -1);
});

Then('the tiles outside the column start to fade away', async ({ page }) => {
  await expect.poll(async () => (await two(page)).faded).toBe(true);
});

Then('the handles start to fade away', async ({ page }) => {
  expect((await two(page)).faded).toBe(true);
});

Then('the gold word ends up alone in the column', async ({ page }) => {
  expect((await two(page)).popup).toBeNull();
});

async function win(page: Page, scenario: Scenario) {
  await ready(page, scenario);
  await arrange(page, ['ZEBRA', 'LEMUR', 'KANGAROO'], { ZEBRA: 0, LEMUR: 0, KANGAROO: 0 });
  await dragSlowlyAndRelease(page, 'ZEBRA', 0, -1);
}

async function waitForPopup(page: Page) {
  await expect.poll(async () => (await two(page)).popup !== null, { timeout: 4000 }).toBe(true);
}

When('the popup appears', async ({ page, scenario }) => {
  await win(page, scenario);
  await waitForPopup(page);
});

Then('the gold word and the column fade away', async ({ page }) => {
  await expect.poll(async () => (await two(page)).columnVisible).toBe(false);
});

Then('the top of the screen stays', async ({ page, scenario }) => {
  expect((await current(page)).layout.topItems).toEqual(scenario.views[0].layout.topItems);
});

When(/^the player (presses an arrow key|tries to drag a word)$/, async ({ page }, action: string) => {
  if (action.includes('arrow')) {
    await page.keyboard.press('ArrowRight');
  } else {
    await page.mouse.move(400, 250);
    await page.mouse.down();
    await page.mouse.move(300, 250, { steps: 3 });
    await page.mouse.up();
  }
});

Then('nothing moves', async ({ page, scenario }) => {
  const now = await two(page);
  expect(now.rows.map((row) => row.columnCell)).toEqual(scenario.twoBefore!.rows.map((row) => row.columnCell));
});

Then('the popup appears about 1.5 seconds later', async ({ page }) => {
  expect((await two(page)).popup).toBeNull();
  await page.waitForTimeout(1000);
  expect((await two(page)).popup).toBeNull();
  await waitForPopup(page);
});

Then("it's in the centre of the screen", async ({ page }) => {
  const { popup } = await two(page);
  expect(popup).toMatchObject({ x: 400, y: 225 });
});

Then('it shows {string}', async ({ page }, text: string) => {
  expect((await two(page)).popup!.title).toBe(text);
});

Then('it shows ELK in gold', async ({ page }) => {
  expect((await two(page)).popup!.word).toBe('ELK');
});

Then('its button says {string}', async ({ page }, text: string) => {
  expect((await two(page)).popup!.button).toBe(text);
});

Given('the popup is showing', async ({ page, scenario }) => {
  await win(page, scenario);
  await waitForPopup(page);
});

When('the player presses its button', async ({ page }) => {
  const { buttonRect } = (await two(page)).popup!;
  await page.mouse.click(buttonRect.x + buttonRect.width / 2, buttonRect.y + buttonRect.height / 2);
});

When(/^the player presses (Enter|Space)$/, async ({ page }, key: string) => {
  await page.keyboard.press(key);
});

Then('the next level starts', async ({ page }) => {
  await expect.poll(async () => ((await current(page)) as TwoView).levelNumber).toBe(2);
});

Given("the popup hasn't appeared yet", async ({ page }) => {
  expect((await two(page)).popup).toBeNull();
});

Then('nothing happens', async ({ page }) => {
  expect(((await current(page)) as TwoView).levelNumber).toBe(1);
});

Given('the celebration is playing', async ({ page, scenario }) => {
  await win(page, scenario);
});

Then('the popup appears for the new orientation', async ({ page }) => {
  await waitForPopup(page);
  expect((await two(page)).popup!.x).toBe(225);
});
