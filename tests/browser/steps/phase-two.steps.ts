import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import type { PhaseTwoTestView } from '../../../src/scenes/PhaseTwoView';
import { parseWords } from '../../support/levels';
import { test, type GameView, type Scenario } from './fixtures';
import { drawnIn, lastMove, pointing, screen, startRecording, stopRecording, textAt, tileAt, tweens, type Drawn, type Frame } from './probe';
import { current, open } from './story-02.steps';

const { Given, When, Then } = createBdd(test);

type TwoView = GameView & { phaseTwo: PhaseTwoTestView; levelNumber: number };

const POPUP_DEPTH = 30;

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

export async function two(page: Page): Promise<PhaseTwoTestView> {
  return ((await current(page)) as TwoView).phaseTwo;
}

function unsolvedFinalWord(words: string[]) {
  return words.map((word) => Array.from(word)[word.length > 1 ? 1 : 0]).reverse().join('');
}

/** Opens the level and applies the set-up steps, once. */
export async function openLevel(page: Page, scenario: Scenario) {
  if (scenario.views.length === 0) {
    if (!scenario.finalWordGiven) {
      scenario.level.finalWord = 'ELK';
      if (!scenario.level.answers.some((answer) => answer.word === 'ZEBRA')) {
        scenario.level.finalWord = unsolvedFinalWord(scenario.level.answers.map((answer) => answer.word));
      }
    }
    scenario.views.push(await open(page, scenario.level, scenario.levelNumber, scenario.points, scenario.levelCount, scenario.levelList));
  }
  for (const step of scenario.setup.splice(0)) await step(page);
}

/** Solves the rows, starting the ceremony. */
export async function solve(page: Page, scenario: Scenario) {
  await openLevel(page, scenario);
  await page.evaluate(() => (window as unknown as { wordSlide: Hooks }).wordSlide.solve());
  await page.waitForFunction(() => (window as unknown as { wordSlide: { view: () => { phaseTwo: unknown } } }).wordSlide.view().phaseTwo !== null);
}

/** Gets to phase two, past the ceremony. */
export async function ready(page: Page, scenario: Scenario) {
  if (scenario.views.length > 0 && ((await current(page)) as TwoView).phaseTwo?.ceremonyDone) return;
  await solve(page, scenario);
  await page.evaluate(() => (window as unknown as { wordSlide: Hooks }).wordSlide.skipCeremony());
  await expect.poll(async () => (await two(page)).ceremonyDone).toBe(true);
}

/** Plays the ceremony for real, recording it. */
async function playCeremony(page: Page, scenario: Scenario) {
  await openLevel(page, scenario);
  await startRecording(page);
  await solve(page, scenario);
  await expect.poll(async () => (await two(page)).ceremonyDone, { timeout: 3000 }).toBe(true);
  scenario.frames = await stopRecording(page);
}

export function fillRow(row: number, word: string) {
  return (page: Page) =>
    page.evaluate(
      ({ row, word }) => {
        const game = (window as unknown as { wordSlide: { place: (row: number, cell: number, character: string) => void } }).wordSlide;
        [...word].forEach((character, cell) => game.place(row, cell, character));
      },
      { row, word },
    );
}

/** Where the word's first cell is when one of its letters is in the column. */
export function restingX(view: PhaseTwoTestView, cell: number, pitch: number) {
  return view.column.x + view.column.width / 2 - cell * pitch;
}

/** Frames from when phase two began, which is when the ceremony starts. */
function ceremonyFrames(scenario: Scenario): (Frame & { two: PhaseTwoTestView })[] {
  return scenario.frames!.filter((frame): frame is Frame & { two: PhaseTwoTestView } => frame.two !== null);
}

export function columnGraphics(objects: Drawn[]) {
  return objects.find((object) => object.kind === 'graphics' && object.triangles.length === 2);
}

export async function popupParts(page: Page) {
  return (await screen(page)).filter((object) => object.depth === POPUP_DEPTH);
}

/** The board's tiles, leaving out the popup, the handles and the top of the screen. */
function boardTiles(frame: Frame, fill: number) {
  return frame.screen.filter((object) => object.kind === 'rect' && object.fill === fill && object.depth === 1);
}

function handleTiles(frame: Frame, fill: number) {
  return frame.screen.filter((object) => object.kind === 'rect' && object.fill === fill && object.depth === 3);
}

/** Each tile that turned gold, in the order it did. */
function goldLetters(frames: Frame[], gold: number) {
  const found = new Map<number, { letter: string; t: number; pulsed: boolean }>();
  for (const frame of frames) {
    for (const tile of boardTiles(frame, gold)) {
      const row = Math.round(tile.y);
      const seen = found.get(row);
      if (seen) seen.pulsed ||= tile.scale > 1.02;
      else found.set(row, { letter: textAt(frame.screen, tile.x, tile.y, 3)!.text!, t: frame.t, pulsed: tile.scale > 1.02 });
    }
  }
  return [...found.values()];
}

export async function arrange(page: Page, order: string[], cells: Record<string, number>) {
  await page.evaluate(({ order, cells }) => (window as unknown as { wordSlide: Hooks }).wordSlide.arrange(order, cells), { order, cells });
}

export function rowOf(view: PhaseTwoTestView, word: string) {
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

export async function pitchOf(page: Page) {
  return (await tileSize(page)) * 1.08;
}

/** Where a word's cell is on screen right now. */
export async function pointOnWord(page: Page, word: string, cell: number) {
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

export async function dragSlowlyAndRelease(page: Page, word: string, cell: number, cells: number) {
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

export async function dragHandle(page: Page, word: string, slots: number) {
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

async function expectRowMarked(page: Page, row: GameView['layout']['rows'][number]) {
  const { colours } = await current(page);
  const [first, last] = [row.cells[0], row.cells[row.cells.length - 1]];
  const middle = (first.x + last.x + last.width) / 2;
  const outline = (await screen(page)).find(
    (object) => object.kind === 'rect' && object.stroke === colours.highlight && Math.abs(object.x - middle) < 2 && Math.abs(object.y - (first.y + first.height / 2)) < 2,
  );
  expect(outline).toBeDefined();
}

// Story 7

Given('LEMUR and ZEBRA are locked', async ({ scenario }) => {
  scenario.setup.push(fillRow(0, 'LEMUR'), fillRow(1, 'ZEBRA'));
});

Given('a small screen', async ({ page }) => {
  await page.setViewportSize({ width: 450, height: 800 });
});

Given('ZEBRA is locked in the top row', async ({ scenario }) => {
  scenario.setup.push(fillRow(0, 'ZEBRA'));
});

Given('LEMUR is locked in the middle row', async ({ scenario }) => {
  scenario.setup.push(fillRow(1, 'LEMUR'));
});

Given('all the words are locked', async ({ scenario }) => {
  scenario.setup.push((page) => page.evaluate(() => (window as unknown as { wordSlide: Hooks }).wordSlide.solve()));
});

Given("KANGAROO's row was selected", async ({ scenario }) => {
  scenario.setup.push(async (page) => {
    const { layout } = await current(page);
    const cell = layout.rows[2].cells[0];
    await page.mouse.click(cell.x + 5, cell.y + 5);
    expect((await current(page)).markedRow).toBe(2);
  });
});

Given('the ceremony has ended', async ({ page, scenario }) => {
  await ready(page, scenario);
});

Given('the ceremony is playing', async ({ page, scenario }) => {
  await solve(page, scenario);
});

When('KANGAROO locks', async ({ page, scenario }) => {
  await openLevel(page, scenario);
  await startRecording(page);
  await fillRow(2, 'KANGAROO')(page);
  await expect.poll(async () => ((await current(page)) as TwoView).phaseTwo?.handlesVisible, { timeout: 3000 }).toBe(true);
  scenario.frames = await stopRecording(page);
});

function pulseFrames(scenario: Scenario) {
  const row = scenario.views[0].layout.rows[2].cells[0];
  return scenario.frames!.filter((frame) =>
    frame.two === null && frame.screen.some((object) => object.kind === 'rect' && object.y === row.y + row.height / 2 && object.scale > 1.01),
  );
}

Then('its lock pulse plays', async ({ scenario }) => {
  expect(pulseFrames(scenario).length).toBeGreaterThan(0);
});

Then('the ceremony starts after that', async ({ scenario }) => {
  const pulses = pulseFrames(scenario);
  const ceremony = ceremonyFrames(scenario)[0];
  expect(ceremony.t).toBeGreaterThanOrEqual(pulses[pulses.length - 1].t);
  expect(ceremony.t - pulses[0].t).toBeGreaterThan(200);
});

When('the ceremony plays', async ({ page, scenario }) => {
  await playCeremony(page, scenario);
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
  const tile = await tileSize(page);
  expect(row.x + 7 * pitch + tile / 2).toBeGreaterThan((await current(page)).layout.width);
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

async function notches(page: Page) {
  const { column } = await two(page);
  const { triangles } = columnGraphics(await screen(page))!;
  const middle = column.x + column.width / 2;
  for (const triangle of triangles) expect((triangle[0] + triangle[2]) / 2).toBeCloseTo(middle);
  const [top, bottom] = [...triangles].sort((a, b) => a[1] - b[1]);
  expect(top[1]).toBeLessThan(column.y);
  expect(bottom[1]).toBeGreaterThan(column.y + column.height);
  return { top, bottom };
}

Then('the column has a down-arrow notch at the top', async ({ page }) => {
  expect(pointing((await notches(page)).top)).toBe('down');
});

Then('it has an up-arrow notch at the bottom', async ({ page }) => {
  expect(pointing((await notches(page)).bottom)).toBe('up');
});

Then(/^there are (\d+) handles$/, async ({ page }, handles: string) => {
  expect((await two(page)).handles).toHaveLength(Number(handles));
});

Then('the handles appear once the words have stopped', async ({ scenario }) => {
  const frames = ceremonyFrames(scenario);
  const firstWithHandles = frames.findIndex((frame) => frame.two.handlesVisible);
  expect(firstWithHandles).toBeGreaterThan(0);
  const final = frames[frames.length - 1].two.rows;
  const lastMoving = frames.findLastIndex((frame) => frame.two.rows.some((row, index) => row.x !== final[index].x || row.y !== final[index].y));
  expect(firstWithHandles).toBeGreaterThan(lastMoving);
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
  const { poolArea } = (await current(page)).layout;
  // Phase two's hint buttons sit along the bottom, where the pool was (story 19): they aren't the pool.
  const hints = (await two(page)).hints.map((hint) => hint.rect);
  const isHint = (x: number, y: number) => hints.some((rect) => x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height);
  await expect.poll(async () => drawnIn(await screen(page), poolArea).filter((object) => !isHint(object.x, object.y)).length).toBe(0);
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

Then('the words slide, the rows centre, and the column and pool fade at the same time', async ({ scenario }) => {
  const frames = ceremonyFrames(scenario);
  const { poolArea } = scenario.views[0].layout;
  const [first, last] = [frames[0], frames[frames.length - 1]];
  const middle = frames.find((frame) => frame.t - first.t >= 500)!;
  const between = (value: number, a: number, b: number) => value > Math.min(a, b) && value < Math.max(a, b);

  expect(middle.two.handlesVisible).toBe(false);
  expect(between(middle.two.rows[2].x, first.two.rows[2].x, last.two.rows[2].x)).toBe(true);
  expect(between(middle.two.rows[2].y, first.two.rows[2].y, last.two.rows[2].y)).toBe(true);
  expect(between(columnGraphics(middle.screen)!.alpha, 0, 1)).toBe(true);
  expect(between(drawnIn(middle.screen, poolArea)[0].alpha, 0, 1)).toBe(true);
});

Then('home, level number, ad button, coins, settings and theme are as they were', async ({ page, scenario }) => {
  expect((await current(page)).layout.topItems).toEqual(scenario.views[0].layout.topItems);
});

Then("there's no Recall All button", async ({ page }) => {
  const { recall } = (await current(page)).layout;
  await expect.poll(async () => drawnIn(await screen(page), recall).length).toBe(0);
  const lines = (await screen(page)).flatMap((object) => object.lines);
  expect(lines.filter((line) => line.y1 > recall.y && line.x1 > recall.x)).toEqual([]);
});

Then('no row is marked as selected', async ({ page }) => {
  const now = await current(page);
  if (now.phaseTwo) {
    expect(now.phaseTwo.rows.filter((row) => row.selected)).toEqual([]);
    return;
  }
  expect(now.markedRow).toBeNull();
  const wide = (await screen(page)).filter((object) => object.kind === 'rect' && object.stroke === now.colours.highlight && object.width > now.layout.tileSize * 1.5);
  expect(wide).toEqual([]);
});

When('the player presses a letter key', async ({ page, scenario }) => {
  scenario.twoBefore = await two(page);
  await page.keyboard.press('a');
});

Then('nothing changes', async ({ page, scenario }) => {
  const now = await current(page);
  if (!now.phaseTwo && scenario.before) {
    expect(now.layout).toEqual(scenario.before.layout);
    return;
  }
  expect(await two(page)).toEqual(scenario.twoBefore);
});

Then('it takes about 1 second', async ({ scenario }) => {
  const frames = ceremonyFrames(scenario);
  const ending = frames.find((frame) => frame.two.handlesVisible)!;
  const length = ending.t - frames[0].t;
  expect(length).toBeGreaterThan(850);
  expect(length).toBeLessThan(1250);
});

Then('nothing is picked up', async ({ scenario }) => {
  expect(scenario.heldWord).toBe(false);
});

Then('the win follows', async ({ page }) => {
  await expect.poll(async () => (await two(page)).won).toBe(true);
});

Then('the finished phase-two layout appears for the new orientation', async ({ page }) => {
  await expect.poll(async () => (await two(page)).handlesVisible).toBe(true);
  const { layout } = await current(page);
  expect(layout.width).toBe(450);
  const view = await two(page);
  expect(view.column.x + view.column.width / 2).toBeCloseTo(225);
  const pitch = await pitchOf(page);
  view.rows.forEach((row) => expect(row.x).toBeCloseTo(restingX(view, row.columnCell, pitch)));
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
  const pitch = await pitchOf(page);
  await dragWord(page, word, start, end === 'T' ? 4 : -12);
  // Held past the end, the word stretches from that letter, not from the special character beyond it.
  const held = await two(page);
  const cell = Array.from(word).indexOf(end);
  expect(Math.abs(rowOf(held, word).x - restingX(held, cell, pitch))).toBeLessThan(pitch * 0.45);
  await page.waitForTimeout(200);
  await page.mouse.up();
  await settle(page);
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
  expect(Math.abs(row.x - (rowOf(scenario.twoBefore!, 'LEMUR').x - 30))).toBeLessThan(1.5);
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
  expect(await lastMove(page)).toMatchObject({ ease: 'Bounce.easeOut', duration: 100 });
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
  // On this screen only its first three cells are fully off, which is less than the wording says.
  const lastOffScreen = rowOf(await two(page), 'KANGAROO').x + 2 * (await pitchOf(page)) + (await tileSize(page)) / 2;
  expect(lastOffScreen).toBeLessThan(0);
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
  const view = await two(page);
  const row = rowOf(view, 'LEMUR');
  expect(row.columnCell).toBe(0);
  expect(row.x).toBeCloseTo(restingX(view, 0, await pitchOf(page)));
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
  await dragWord(page, 'LEMUR', 0, 3);
});

Then('it moves a little', async ({ page, scenario }) => {
  const view = await two(page);
  const word = scenario.stretchWord ?? 'LEMUR';
  const before = rowOf(scenario.twoBefore!, word);
  const now = rowOf(view, word);
  expect(Math.hypot(now.x - before.x, now.y - before.y)).toBeGreaterThan(0);
  expect(Math.hypot(now.x - before.x, now.y - before.y)).toBeLessThan((await pitchOf(page)) / 2);
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
  expect((await lastMove(page)).duration).toBeGreaterThan(100);
  const { x } = rowOf(await two(page), 'LEMUR');
  await page.waitForTimeout(120);
  expect(rowOf(await two(page), 'LEMUR').x).not.toBe(x);
});

Then('it eases to a stop over 0.25 seconds, with no bounce', async ({ page }) => {
  expect(await lastMove(page)).toMatchObject({ ease: 'Sine.easeOut', duration: 250 });
});

Then('then it snaps to its nearest letter', async ({ page }) => {
  await settle(page);
  const view = await two(page);
  const row = rowOf(view, 'LEMUR');
  expect(row.x).toBeCloseTo(restingX(view, row.columnCell, await pitchOf(page)));
});

When('the player flicks KANGAROO hard to the left', async ({ page, scenario }) => {
  await ready(page, scenario);
  // Short enough that only the glide can carry the word all the way to the end of its range.
  await flick(page, 'KANGAROO', 3, -200);
});

Then('it stops with its last O in the column at the furthest', async ({ page }) => {
  await settle(page);
  const view = await two(page);
  const row = rowOf(view, 'KANGAROO');
  expect(row.columnCell).toBe(7);
  expect(row.x).toBeCloseTo(restingX(view, 7, await pitchOf(page)));
});

When('the player drags LEMUR slowly and releases it', async ({ page, scenario }) => {
  await ready(page, scenario);
  const point = await pointOnWord(page, 'LEMUR', 2);
  await grab(page, point);
  for (let step = 1; step <= 10; step++) {
    await page.mouse.move(point.x - step * 5, point.y);
    await page.waitForTimeout(40);
  }
  await page.mouse.up();
  await settle(page);
});

When('the player swings LEMUR fast, stops, and releases it', async ({ page, scenario }) => {
  await ready(page, scenario);
  const point = await pointOnWord(page, 'LEMUR', 2);
  await grab(page, point);
  for (let step = 1; step <= 4; step++) {
    await page.mouse.move(point.x - step * 15, point.y);
    await page.waitForTimeout(20);
  }
  await page.waitForTimeout(150);
  await page.mouse.up();
  await settle(page);
});

Then('it snaps without gliding', async ({ page }) => {
  expect(await lastMove(page)).toMatchObject({ ease: 'Bounce.easeOut', duration: 100 });
});

When('a letter is in the column', async ({ page, scenario }) => {
  await ready(page, scenario);
});

Then('it looks like any other tile', async ({ page }) => {
  const view = await two(page);
  const objects = await screen(page);
  const pitch = await pitchOf(page);
  const middle = view.column.x + view.column.width / 2;
  for (const row of view.rows) {
    expect(tileAt(objects, middle, row.y)!.fill).toBe(tileAt(objects, middle + pitch, row.y)!.fill);
  }
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

When(/^the player presses (Up|Down|Left|Right|Shift\+Up|Shift\+Down)$/, async ({ page, scenario, $uri }, key: string) => {
  if ($uri.includes('story-12') || $uri.includes('story-23')) {
    scenario.acted = true;
    await openLevel(page, scenario);
    scenario.before = await current(page);
    await page.keyboard.press(`Arrow${key}`);
    await page.waitForTimeout(300);
    return;
  }
  await ready(page, scenario);
  scenario.twoBefore = await two(page);
  scenario.acted = true;
  scenario.lastKey = key;
  await press(page, key);
});

Then(/^(LEMUR|ZEBRA|KANGAROO)'s row is (?:still )?(?:selected|marked as selected)$/, async ({ page, scenario, $uri }, word: string) => {
  const story23Check = $uri.includes('story-23') && scenario.views.length > 0;
  if (!scenario.acted && !story23Check) {
    // These stories select a row in phase one, by tapping it.
    if (['story-02', 'story-03', 'story-04', 'story-17', 'story-11', 'story-16', 'story-23', 'story-20'].some((story) => $uri.includes(story))) {
      scenario.setup.push(async (page) => {
        const { layout } = await current(page);
        const cell = layout.rows.find((row) => row.word === word)!.cells[0];
        await page.mouse.click(cell.x + cell.width / 2, cell.y + cell.height / 2);
      });
      return;
    }
    await ready(page, scenario);
    const index = (await order(page)).indexOf(word);
    await page.evaluate((row) => (window as unknown as { wordSlide: Hooks }).wordSlide.select(row), index);
    return;
  }
  const view = (await current(page)) as TwoView;
  if (!view.phaseTwo) {
    const row = view.layout.rows[view.markedRow!];
    expect(row.word).toBe(word);
    await expectRowMarked(page, row);
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
  expect(await lastMove(page)).toMatchObject({ ease: 'Bounce.easeOut', duration: 100 });
});

When("the player starts dragging KANGAROO", async ({ page, scenario }) => {
  await ready(page, scenario);
  await dragWord(page, 'KANGAROO', 0, -0.3);
});

Then('the selection is marked again, and the arrow takes effect from ZEBRA\'s row', async ({ page, scenario }) => {
  const view = await two(page);
  const selected = { Up: 'LEMUR', Down: 'KANGAROO', Left: 'ZEBRA', Right: 'ZEBRA' }[scenario.lastKey!];
  expect(view.rows.filter((row) => row.selected).map((row) => row.word)).toEqual([selected]);
  const moved = rowOf(view, 'ZEBRA').columnCell - rowOf(scenario.twoBefore!, 'ZEBRA').columnCell;
  expect(moved).toBe(scenario.lastKey === 'Left' ? 1 : 0);
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
  const makingWay = (await tweens(page)).filter((tween) => tween.props.includes('y'));
  expect(makingWay[makingWay.length - 1].duration).toBe(100);
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
  const objects = await screen(page);
  for (const handle of (await two(page)).handles) {
    const drawn = tileAt(objects, handle.x + handle.width / 2, handle.y + handle.height / 2)!;
    expect(drawn.width).toBeGreaterThanOrEqual(tile);
    expect(drawn.height).toBeGreaterThanOrEqual(tile);
  }
});

Then('each handle shows three short horizontal lines', async ({ page }) => {
  const objects = await screen(page);
  const grips = objects.filter((object) => object.depth === 3 && object.kind === 'graphics');
  const { handles } = await two(page);
  expect(grips).toHaveLength(handles.length);
  grips.forEach((grip, index) => {
    const handle = handles[index];
    expect(grip.lines).toHaveLength(3);
    for (const line of grip.lines) {
      expect(line.y1).toBe(line.y2);
      expect(Math.abs(line.x2 - line.x1)).toBeLessThan(handle.width);
      expect(line.y1).toBeGreaterThan(handle.y);
      expect(line.y1).toBeLessThan(handle.y + handle.height);
    }
    expect(new Set(grip.lines.map((line) => line.y1)).size).toBe(3);
  });
});

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
  await dragHandle(page, word, direction === 'up' ? -3 : 3);
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

Given('the rest of the column reads L, K', async ({ page }) => {
  expect((await two(page)).columnText.slice(1)).toBe('LK');
});

Given('a flicked word glides through the winning position and stops elsewhere', async ({ page, scenario }) => {
  await ready(page, scenario);
  await arrange(page, ['ZEBRA', 'LEMUR', 'KANGAROO'], { ZEBRA: 0, LEMUR: 0, KANGAROO: 0 });
  await flick(page, 'ZEBRA', 0, -170);
  expect((await lastMove(page)).duration).toBeGreaterThan(100);
  await settle(page);
  expect(rowOf(await two(page), 'ZEBRA').columnCell).toBeGreaterThan(1);
});

Given(/^the final word (?:is )?(.+)$/, async ({ scenario }, word: string) => {
  scenario.level.finalWord = word;
  scenario.finalWordGiven = true;
});

function plan(scenario: Scenario, text: string, rows: string[], cells: Record<string, number>) {
  scenario.columnPlan ??= {};
  scenario.columnPlan[text] = { order: rows, cells };
}

When(/^the column (?:reads|spells) (.+?)(?: from top to bottom)?$/, async ({ page, scenario, $uri }, text: string) => {
  await ready(page, scenario);
  const key = text === 'the final word' ? 'ELK' : text.split(', ').join('');
  if ($uri.includes('story-12') && key === 'OX') {
    await arrange(page, ['OWL', 'FOX'], { OWL: 0, FOX: 1 });
    await startRecording(page);
    await dragSlowlyAndRelease(page, 'FOX', 1, -1);
    return;
  }
  // Only story 10 uses this as an action. Everywhere else it's a check, and must never arrange anything.
  if (!$uri.includes('story-10')) {
    expect((await two(page)).columnText).toBe(key);
    return;
  }
  if ((await two(page)).columnText === key) return;
  if (text === 'the final word') await startRecording(page);
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

Then('the E pulses and turns gold first', async ({ page, scenario }) => {
  await expect.poll(async () => (await two(page)).won).toBe(true);
  await page.waitForTimeout(900);
  scenario.goldLetters = goldLetters(await stopRecording(page), (await current(page)).colours.tileGold);
  expect(scenario.goldLetters[0]).toMatchObject({ letter: 'E', pulsed: true });
});

Then('then the L does', async ({ scenario }) => {
  const [first, second] = scenario.goldLetters!;
  expect(second).toMatchObject({ letter: 'L', pulsed: true });
  expect(second.t).toBeGreaterThan(first.t + 100);
});

Then('then the K does', async ({ scenario }) => {
  const [, second, third] = scenario.goldLetters!;
  expect(third).toMatchObject({ letter: 'K', pulsed: true });
  expect(third.t).toBeGreaterThan(second.t + 100);
});

When('the top letter of the column turns gold', async ({ page, scenario }) => {
  await ready(page, scenario);
  await arrange(page, ['ZEBRA', 'LEMUR', 'KANGAROO'], { ZEBRA: 0, LEMUR: 0, KANGAROO: 0 });
  await startRecording(page);
  await dragSlowlyAndRelease(page, 'ZEBRA', 0, -1);
  await page.waitForTimeout(600);
  scenario.frames = await stopRecording(page);
});

/** Whether a set of tiles starts fading as the top letter turns gold. */
async function expectFadeFromFirstGold(page: Page, scenario: Scenario, tilesIn: (frame: Frame, colours: GameView['colours']) => Drawn[]) {
  const { colours } = await current(page);
  const frames = scenario.frames!;
  const gold = frames.findIndex((frame) => boardTiles(frame, colours.tileGold).length > 0);
  expect(gold).toBeGreaterThan(0);
  const alpha = (frame: Frame) => Math.max(...tilesIn(frame, colours).map((tile) => tile.alpha));
  expect(alpha(frames[gold - 1])).toBe(1);
  const soon = frames.find((frame) => frame.t - frames[gold].t >= 150)!;
  expect(alpha(soon)).toBeLessThan(1);
}

Then('the tiles outside the column start to fade away', async ({ page, scenario }) => {
  const view = await two(page);
  const middle = view.column.x + view.column.width / 2;
  await expectFadeFromFirstGold(page, scenario, (frame, colours) =>
    boardTiles(frame, colours.tileLocked).filter((tile) => Math.abs(tile.x - middle) > 2),
  );
});

Then('the handles start to fade away', async ({ page, scenario }) => {
  await expectFadeFromFirstGold(page, scenario, (frame, colours) => handleTiles(frame, colours.tile));
});

Then('the gold word ends up alone in the column', async ({ page, scenario }) => {
  const { colours, layout } = await current(page);
  const last = scenario.frames![scenario.frames!.length - 1];
  const board = last.screen.filter((object) => object.y > layout.top.height && object.kind !== 'graphics' && object.alpha > 0.01);
  expect(board.filter((object) => object.kind === 'text').map((object) => object.text).sort()).toEqual(['E', 'K', 'L']);
  expect(board.filter((object) => object.kind === 'rect' && object.stroke === null).map((object) => object.fill)).toEqual([colours.tileGold, colours.tileGold, colours.tileGold]);
  expect(last.two!.popup).toBeNull();
});

export async function win(page: Page, scenario: Scenario) {
  await ready(page, scenario);
  await arrange(page, ['ZEBRA', 'LEMUR', 'KANGAROO'], { ZEBRA: 0, LEMUR: 0, KANGAROO: 0 });
  await dragSlowlyAndRelease(page, 'ZEBRA', 0, -1);
}

export async function waitForPopup(page: Page) {
  await expect.poll(async () => (await two(page)).popup !== null, { timeout: 4000 }).toBe(true);
}

When('the popup appears', async ({ page, scenario }) => {
  // "The player has won level N" may have won already.
  if (scenario.views.length === 0 || !(await two(page)).won) await win(page, scenario);
  await waitForPopup(page);
});

Then('the gold word and the column fade away', async ({ page }) => {
  const { colours } = await current(page);
  await expect
    .poll(async () => {
      const objects = await screen(page);
      const gold = objects.filter((object) => object.fill === colours.tileGold && object.depth !== POPUP_DEPTH);
      return Math.max(columnGraphics(objects)?.alpha ?? 0, ...gold.map((object) => object.alpha));
    })
    .toBeLessThan(0.01);
});

Then('the top of the screen stays', async ({ page, scenario }) => {
  const { layout } = await current(page);
  expect(layout.topItems).toEqual(scenario.views[0].layout.topItems);
  // Everything drawn in the top bar and the theme's line stays at full strength.
  const objects = await screen(page);
  const inside = (object: Drawn) => layout.topItems.some((item) => object.x >= item.x && object.x <= item.x + item.width && object.y >= item.y && object.y <= item.y + item.height);
  const parts = objects.filter((object) => object.depth < POPUP_DEPTH && object.kind !== 'graphics' && inside(object));
  expect(parts.length).toBeGreaterThan(layout.topItems.length);
  parts.forEach((part) => expect(part.alpha).toBe(1));
});

When(/^the player (presses an arrow key|tries to drag a word)$/, async ({ page, scenario }, action: string) => {
  if (action.includes('arrow')) {
    await page.keyboard.press('ArrowRight');
  } else {
    const view = await two(page);
    const pitch = await pitchOf(page);
    const slot = view.rows.findIndex((row) => row.word === 'LEMUR');
    // A row is pressed at its final slot, so aim there even while the word is still flying in.
    const point = { x: (await pointOnWord(page, 'LEMUR', 2)).x, y: view.column.y + view.column.width / 2 + slot * pitch };
    await grab(page, point);
    await page.mouse.move(point.x - 100, point.y, { steps: 3 });
    scenario.heldWord = (await two(page)).dragging;
    await page.mouse.up();
  }
  await settle(page);
});

// Test audit

Then('each handle is drawn at its full size', async ({ page }) => {
  const objects = await screen(page);
  const { handles } = await two(page);
  for (const handle of handles) {
    const tile = tileAt(objects, handle.x + handle.width / 2, handle.y + handle.height / 2)!;
    expect(tile.width).toBeCloseTo(handle.width);
    expect(tile.height).toBeCloseTo(handle.height);
  }
});

Given("ZEBRA's row is selected in slot 2", async ({ page }) => {
  await page.evaluate(() => (window as unknown as { wordSlide: Hooks }).wordSlide.select(1));
});

When(/^the player drags LEMUR far past its (first|last) letter$/, async ({ page, scenario }, end: string) => {
  await ready(page, scenario);
  scenario.stretchCell = end === 'first' ? 0 : 4;
  await arrange(page, ['LEMUR', 'ZEBRA', 'KANGAROO'], { LEMUR: scenario.stretchCell });
  await dragWord(page, 'LEMUR', scenario.stretchCell, end === 'first' ? 3 : -3);
});

Then('it stretches less than half a cell past that letter', async ({ page, scenario }) => {
  const view = await two(page);
  const pitch = await pitchOf(page);
  const stretch = Math.abs(rowOf(view, 'LEMUR').x - restingX(view, scenario.stretchCell!, pitch));
  expect(stretch).toBeGreaterThan(0);
  expect(stretch).toBeLessThan(pitch / 2);
});

Then('nothing moves', async ({ page, scenario }) => {
  const now = await two(page);
  const positions = (view: PhaseTwoTestView) => view.rows.map((row) => [row.word, row.columnCell, row.x]);
  expect(positions(now)).toEqual(positions(scenario.twoBefore!));
});

Then('the popup appears about 1.5 seconds later', async ({ page }) => {
  await waitForPopup(page);
  const frames = await stopRecording(page);
  const won = frames.find((frame) => frame.two!.won)!;
  const shown = frames.find((frame) => frame.two!.popup !== null)!;
  expect(shown.t - won.t).toBeGreaterThan(1350);
  expect(shown.t - won.t).toBeLessThan(1750);
});

Then("it's in the centre of the screen", async ({ page }) => {
  const [panel] = await popupParts(page);
  const { layout } = await current(page);
  expect(panel).toMatchObject({ x: layout.width / 2, y: layout.height / 2 });
});

Then('it shows {string}', async ({ page }, text: string) => {
  expect((await popupParts(page)).map((object) => object.text)).toContain(text);
});

Then('it shows ELK in gold', async ({ page }) => {
  const { colours } = await current(page);
  const parts = await popupParts(page);
  const gold = parts.filter((object) => object.fill === colours.tileGold).sort((a, b) => a.x - b.x);
  expect(gold.map((tile) => textAt(parts, tile.x, tile.y)?.text)).toEqual(['E', 'L', 'K']);
});

Then('its button says {string}', async ({ page }, text: string) => {
  expect((await popupParts(page)).map((object) => object.text)).toContain(text);
});

Given('the popup is showing', async ({ page, scenario }) => {
  await win(page, scenario);
  await waitForPopup(page);
});

When('the player presses its button', async ({ page }) => {
  const button = (await popupParts(page)).find((object) => object.text?.startsWith('Play Level'))!;
  await page.mouse.click(button.x, button.y);
});

When(/^the player presses (Enter|Space)$/, async ({ page }, key: string) => {
  await page.keyboard.press(key);
});

Then('the next level starts', async ({ page }) => {
  await expect.poll(async () => ((await current(page)) as TwoView).levelNumber).toBe(2);
  expect((await current(page)).phaseTwo).toBeNull();
  expect(await popupParts(page)).toEqual([]);
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
  // Well inside the 1.5 second wait, which would bring the popup up by itself anyway.
  await expect.poll(async () => (await two(page)).popup !== null, { timeout: 700 }).toBe(true);
  const [panel] = await popupParts(page);
  expect(panel.x).toBe(225);
});

// The gold wave pulses like a lock (story 10, R6)

/** Each column tile, frame by frame, grouped by row. */
function columnPulses(frames: Frame[]) {
  const rows = new Map<number, { t: number; scale: number; fill: number | null }[]>();
  for (const frame of frames) {
    if (!frame.two) continue;
    const x = frame.two.column.x + frame.two.column.width / 2;
    for (const tile of frame.screen.filter((object) => object.kind === 'rect' && object.fill !== null && object.depth === 1 && Math.abs(object.x - x) < 3)) {
      const key = Math.round(tile.y);
      rows.set(key, [...(rows.get(key) ?? []), { t: frame.t, scale: tile.scale, fill: tile.fill }]);
    }
  }
  return [...rows.values()].filter((samples) => samples.some((sample) => sample.scale > 1.05));
}

Then('each letter keeps its colour while it grows', async ({ page, scenario }) => {
  await page.waitForTimeout(900);
  scenario.frames = await stopRecording(page);
  const { colours } = await current(page);
  const rows = columnPulses(scenario.frames);
  expect(rows.length).toBe(3);
  for (const samples of rows) {
    const peak = samples.reduce((best, sample, index) => (sample.scale > samples[best].scale ? index : best), 0);
    const growing = samples.slice(0, peak).filter((sample) => sample.scale > 1.001 && sample.scale < 1.12);
    expect(growing.length).toBeGreaterThan(1);
    growing.forEach((sample) => expect(sample.fill).not.toBe(colours.tileGold));
  }
});

Then('turns gold at its biggest', async ({ page, scenario }) => {
  const { colours } = await current(page);
  for (const samples of columnPulses(scenario.frames!)) {
    const peak = samples.reduce((best, sample, index) => (sample.scale > samples[best].scale ? index : best), 0);
    samples.slice(peak).forEach((sample) => expect(sample.fill).toBe(colours.tileGold));
  }
});

When('the player lifts a row by its handle', async ({ page, scenario }) => {
  await ready(page, scenario);
  // Held part of the way, so the row stays lifted between slots.
  await dragHandle(page, (await two(page)).rows[0].word, 0.4);
});
