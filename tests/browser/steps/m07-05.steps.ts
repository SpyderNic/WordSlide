import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import type { Level } from '../../../src/game/level';
import { makeLevel } from '../../support/levels';
import { test, type Scenario } from './fixtures';
import { current } from './m02-02.steps';
import { setEconomy } from './m07-02.steps';
import { centreOf, layoutNow, rowOf as layoutRowOf } from './phase-one.steps';
import { arrange, dragSlowlyAndRelease, popupParts, ready, rowOf, two, waitForPopup } from './phase-two.steps';
import { screen, startRecording, stopRecording, type Drawn, type Frame } from './probe';

const { Before, Given, When, Then } = createBdd(test);

/**
 * Bonus words (M07-05). Every level here is made up (D46).
 * The usual level: NEWT, WOLF and CAMEL, in that order, spell EWE. WOLF's letters also spell FOWL. With WOLF above NEWT,
 * the column can read OWL: O from WOLF, W from NEWT, L from CAMEL. WENT isn't an animal.
 */
function usualLevel(): Level {
  return { ...makeLevel(['NEWT', 'WOLF', 'CAMEL'], 'EWE'), bonusWords: ['FOWL', 'OWL'] };
}

/** CAT, OTTER and WHALE start phase two with their first letters in the column: COW. */
function cowLevel(): Level {
  return { ...makeLevel(['CAT', 'OTTER', 'WHALE'], 'TEA'), bonusWords: ['COW'] };
}

/** FOX, WOLF, NEWT and CAMEL, in that order, spell FLEA, and the column can also read FOWL, which WOLF's row can spell. */
function fowlLevel(): Level {
  return { ...makeLevel(['FOX', 'NEWT', 'WOLF', 'CAMEL'], 'FLEA'), bonusWords: ['FOWL'] };
}

const BONUS = 'Bonus word!';
const FIRST_LINE = 'Not the answer, but well spotted!';
/** Flying coins are octagons drawn above everything (M07-02). */
const FLIGHT_DEPTH = 32;

type Story = Scenario & { filled?: string; recordingUntil?: number; slidWhileShowing?: { word: string; before: number } };

Before(async ({ $uri, scenario }) => {
  if (!$uri.includes('m07-05')) return;
  scenario.level = usualLevel();
  scenario.finalWordGiven = true;
});

// Seeing it

const visibleText = (objects: Drawn[], text: string) => objects.filter((object) => object.kind === 'text' && object.text === text && object.alpha > 0.05);
const shows = (frame: Frame, text: string) => visibleText(frame.screen, text).length > 0;

/** The feedback and the coins' flight are over well within this (style timings). */
const FEEDBACK_TIME = 2600;

/**
 * Starts recording the screen and plays an action. Recording carries on, so the next step can act while the
 * feedback still shows, until a step reads the frames.
 */
async function recordWhile(page: Page, scenario: Scenario, action: () => Promise<void>) {
  const story = scenario as Story;
  if (story.recordingUntil !== undefined) await framesOf(page, scenario);
  await startRecording(page);
  await action();
  story.recordingUntil = Date.now() + FEEDBACK_TIME;
}

/** The frames recorded since the last action, once its feedback has gone. */
async function framesOf(page: Page, scenario: Scenario): Promise<Frame[]> {
  const story = scenario as Story;
  if (story.recordingUntil !== undefined) {
    await page.waitForTimeout(Math.max(0, story.recordingUntil - Date.now()));
    story.recordingUntil = undefined;
    scenario.frames = await stopRecording(page);
  }
  return scenario.frames!;
}

async function framesShowing(page: Page, scenario: Scenario, text: string) {
  return (await framesOf(page, scenario)).filter((frame) => shows(frame, text));
}

// Phase one: filling a row

async function fill(page: Page, scenario: Scenario, word: string, letters: string) {
  (scenario as Story).filled = word;
  const layout = await layoutNow(page, scenario);
  const row = layoutRowOf(layout, word);
  const { x, y } = centreOf(layout.rows[row].cells.find(({ cell }) => cell.kind === 'empty')!);
  await page.mouse.click(x, y);
  await expect.poll(async () => (await current(page)).markedRow).toBe(row);
  await page.evaluate(
    ({ row, letters }) => {
      const game = (window as unknown as { wordSlide: { place: (row: number, cell: number, character: string) => void } }).wordSlide;
      [...letters].forEach((character, cell) => game.place(row, cell, character));
    },
    { row, letters },
  );
}

const lettersOf = (list: string) => list.split(', ').join('');

When(/^the player fills (\w+)'s row with ([A-Z](?:, [A-Z])+)$/, async ({ page, scenario }, word: string, list: string) => {
  await layoutNow(page, scenario);
  scenario.before = await current(page);
  await recordWhile(page, scenario, () => fill(page, scenario, word, lettersOf(list)));
});

When(/^the player fills (\w+)'s row with ([A-Z](?:, [A-Z])+) and the game closes straight away$/, async ({ page, scenario }, word: string, list: string) => {
  await fill(page, scenario, word, lettersOf(list));
  await page.goto('about:blank');
  scenario.views = [];
});

Given(/^the player has filled (\w+)'s row with ([A-Z](?:, [A-Z])+)$/, async ({ page, scenario }, word: string, list: string) => {
  await layoutNow(page, scenario);
  await recordWhile(page, scenario, () => fill(page, scenario, word, lettersOf(list)));
  expect((await framesShowing(page, scenario, BONUS)).length, 'the word was found').toBeGreaterThan(0);
});

Given("the player has found one of the level's bonus words", async ({ page, scenario }) => {
  await layoutNow(page, scenario);
  await recordWhile(page, scenario, () => fill(page, scenario, 'WOLF', 'FOWL'));
  expect((await framesShowing(page, scenario, BONUS)).length, 'the word was found').toBeGreaterThan(0);
});

When(/^the player empties (\w+)'s row and fills it with ([A-Z](?:, [A-Z])+) again$/, async ({ page, scenario }, word: string, list: string) => {
  const { layout } = await current(page);
  const { x, y } = centreOf(layout.recall);
  await page.mouse.click(x, y);
  await expect.poll(async () => (await current(page)).layout.rows[layoutRowOf(layout, word)].cells.every(({ cell }) => cell.kind === 'empty')).toBe(true);
  await page.waitForTimeout(400);
  scenario.before = await current(page);
  await recordWhile(page, scenario, () => fill(page, scenario, word, lettersOf(list)));
});

async function rowY(page: Page, word: string) {
  const { layout } = await current(page);
  return centreOf(layout.rows[layoutRowOf(layout, word)].cells[0]).y;
}

/** The left edge of a row's tiles, frame by frame, against where it rests. */
async function rowOffsets(page: Page, scenario: Scenario) {
  const { layout } = scenario.before!;
  const row = layout.rows[layoutRowOf(layout, (scenario as Story).filled!)];
  const left = centreOf(row.cells[0]).x;
  const y = centreOf(row.cells[0]).y;
  return (await framesOf(page, scenario)).flatMap((frame) => {
    const tiles = frame.screen.filter((object) => object.kind === 'rect' && object.fill !== null && object.depth < 8 && Math.abs(object.y - y) < 2);
    return tiles.length ? [Math.min(...tiles.map((tile) => tile.x)) - left] : [];
  });
}

Then('the row shakes', async ({ page, scenario }) => {
  expect(Math.max(...(await rowOffsets(page, scenario)))).toBeGreaterThan(2);
});

Then("the row doesn't shake", async ({ page, scenario }) => {
  const offsets = await rowOffsets(page, scenario);
  expect(offsets.length).toBeGreaterThan(5);
  for (const offset of offsets) expect(Math.abs(offset)).toBeLessThan(0.5);
});

/** How many times tiles on a line grew and shrank back. */
function pulsesOn(frames: Frame[], y: number, x?: number) {
  let pulses = 0;
  let growing = false;
  for (const frame of frames) {
    const tiles = frame.screen.filter((object) => object.kind === 'rect' && object.fill !== null && object.depth < 8 && Math.abs(object.y - y) < object.height / 2 && (x === undefined || Math.abs(object.x - x) < 2));
    const grown = tiles.some((tile) => tile.scale > 1.02);
    if (grown && !growing) pulses++;
    growing = grown;
  }
  return pulses;
}

Then("the row's letters pulse once", async ({ page, scenario }) => {
  const { layout } = scenario.before!;
  const word = (scenario as Story).filled!;
  const y = centreOf(layout.rows[layoutRowOf(layout, word)].cells[0]).y;
  expect(pulsesOn((await framesOf(page, scenario)), y)).toBe(1);
  expect(await rowY(page, word)).toBeCloseTo(y);
});

Then(/^(\w+)'s row still reads (\w+)$/, async ({ page }, word: string, reads: string) => {
  const { layout } = await current(page);
  const row = layout.rows[layoutRowOf(layout, word)];
  expect(row.locked).toBe(false);
  expect(row.cells.map(({ cell }) => (cell.kind === 'empty' ? '' : cell.character)).join('')).toBe(reads);
});

// "Bonus word!"

Then('"Bonus word!" appears', async ({ page, scenario }) => {
  const frames = await framesShowing(page, scenario, BONUS);
  expect(frames.length).toBeGreaterThan(0);
  // Above the rows (R4), in either phase: its background clears the top row's tiles.
  const { layout, phaseTwo } = await current(page);
  const top = phaseTwo ? phaseTwo.rows[0].y - layout.tileSize / 2 : layout.rows[0].cells[0].y;
  const text = visibleText(frames[0].screen, BONUS)[0];
  const box = frames[0].screen.find((object) => object.kind === 'rect' && object.depth === text.depth && Math.abs(object.x - text.x) < 1 && object.width > text.width)!;
  expect(box, 'its background').toBeDefined();
  expect(box.y + box.height / 2).toBeLessThanOrEqual(top);
});

Then('"Bonus word!" doesn\'t appear', async ({ page, scenario }) => {
  expect((await framesOf(page, scenario)).length).toBeGreaterThan(5);
  expect(await framesShowing(page, scenario, BONUS)).toEqual([]);
});

Then('"Bonus word!" doesn\'t appear again', async ({ page, scenario }) => {
  expect((await framesOf(page, scenario)).length).toBeGreaterThan(5);
  expect(await framesShowing(page, scenario, BONUS)).toEqual([]);
});

Then('"Bonus word!" appears above the rows, rises and fades', async ({ page, scenario }) => {
  const frames = await framesShowing(page, scenario, BONUS);
  expect(frames.length).toBeGreaterThan(5);
  const topRow = (await two(page)).rows[0].y;
  const tile = (await current(page)).layout.tileSize;
  const texts = frames.map((frame) => visibleText(frame.screen, BONUS)[0]);
  expect(texts[0].y).toBeLessThan(topRow - tile / 2);
  expect(texts[texts.length - 1].y).toBeLessThan(texts[0].y);
  expect(texts[texts.length - 1].alpha).toBeLessThan(texts[0].alpha);
  // And it's gone by the end.
  const all = await framesOf(page, scenario);
  expect(shows(all[all.length - 1], BONUS)).toBe(false);
});

Then(`"${FIRST_LINE}" appears under "Bonus word!"`, async ({ page, scenario }) => {
  const frame = (await framesShowing(page, scenario, BONUS)).find((candidate) => shows(candidate, FIRST_LINE));
  expect(frame, 'the line shows with "Bonus word!"').toBeDefined();
  expect(visibleText(frame!.screen, FIRST_LINE)[0].y).toBeGreaterThan(visibleText(frame!.screen, BONUS)[0].y);
});

Then('"Bonus word!" appears without the line under it', async ({ page, scenario }) => {
  expect((await framesShowing(page, scenario, BONUS)).length).toBeGreaterThan(0);
  expect(await framesShowing(page, scenario, FIRST_LINE)).toEqual([]);
});

Given('the player has never found a bonus word', async ({ page }) => {
  expect(await page.context().storageState()).toMatchObject({ origins: [] });
});

/** Wins the usual level: NEWT, WOLF and CAMEL with E, W and E in the column. */
export async function winUsualLevel(page: Page, scenario: Scenario) {
  await ready(page, scenario);
  await arrange(page, ['NEWT', 'WOLF', 'CAMEL'], { NEWT: 0, WOLF: 0, CAMEL: 3 });
  await dragSlowlyAndRelease(page, 'NEWT', 0, -1);
}

Given('the player has found a bonus word in an earlier level', async ({ page, scenario }) => {
  await layoutNow(page, scenario);
  await recordWhile(page, scenario, () => fill(page, scenario, 'WOLF', 'FOWL'));
  expect((await framesShowing(page, scenario, FIRST_LINE)).length, 'the first bonus word was found').toBeGreaterThan(0);
  await winUsualLevel(page, scenario);
  await waitForPopup(page);
  const button = (await popupParts(page)).find((object) => object.text?.startsWith('Play Level'))!;
  await page.mouse.click(button.x, button.y);
  await expect.poll(async () => ((await current(page)) as unknown as { levelNumber: number }).levelNumber).toBe(2);
});

// Phase two: the column

async function columnTo(page: Page, scenario: Scenario, target: string) {
  await ready(page, scenario);
  if (target === 'FOWL') {
    await arrange(page, ['FOX', 'WOLF', 'NEWT', 'CAMEL'], { FOX: 0, WOLF: 0, NEWT: 2, CAMEL: 4 });
    await dragSlowlyAndRelease(page, 'WOLF', 0, -1);
    return;
  }
  // WOLF above NEWT, with W, W and L in the column. One cell along, WOLF puts its O there: OWL. Two cells, its L: LWL.
  await arrange(page, ['WOLF', 'NEWT', 'CAMEL'], { WOLF: 0, NEWT: 2, CAMEL: 4 });
  await dragSlowlyAndRelease(page, 'WOLF', 0, target === "the column's bonus word" ? -1 : -2);
}

When(/^the player slides the words until the column reads (the column's bonus word|a word that isn't in the bonus list|FOWL)$/, async ({ page, scenario }, target: string) => {
  await ready(page, scenario);
  scenario.twoBefore = await two(page);
  await recordWhile(page, scenario, () => columnTo(page, scenario, target));
  const expected = target === 'FOWL' ? 'FOWL' : target === "the column's bonus word" ? 'OWL' : 'LWL';
  expect((await two(page)).columnText).toBe(expected);
});

Given("the player has slid the words until the column reads the column's bonus word", async ({ page, scenario }) => {
  await ready(page, scenario);
  await recordWhile(page, scenario, () => columnTo(page, scenario, "the column's bonus word"));
  expect((await framesShowing(page, scenario, BONUS)).length, 'the word was found').toBeGreaterThan(0);
});

When('the player drags a word through the position that reads the column\'s bonus word, and lets go further on', async ({ page, scenario }) => {
  await ready(page, scenario);
  await arrange(page, ['WOLF', 'NEWT', 'CAMEL'], { WOLF: 0, NEWT: 2, CAMEL: 4 });
  // From W, past O (OWL), to L.
  await recordWhile(page, scenario, () => dragSlowlyAndRelease(page, 'WOLF', 0, -2));
  expect((await two(page)).columnText).toBe('LWL');
});

When('the player slides a word away and back again', async ({ page, scenario }) => {
  await recordWhile(page, scenario, async () => {
    await dragSlowlyAndRelease(page, 'WOLF', 1, -1);
    expect((await two(page)).columnText).toBe('LWL');
    await dragSlowlyAndRelease(page, 'WOLF', 2, 1);
  });
  expect((await two(page)).columnText).toBe('OWL');
});

When('the player slides another word while "Bonus word!" is showing', async ({ page, scenario }) => {
  const story = scenario as Story;
  await expect.poll(async () => visibleText(await screen(page), BONUS).length, { message: '"Bonus word!" is showing', timeout: 1000 }).toBeGreaterThan(0);
  const before = rowOf(await two(page), 'CAMEL').columnCell;
  story.slidWhileShowing = { word: 'CAMEL', before };
  await dragSlowlyAndRelease(page, 'CAMEL', before, 1);
});

Then('that word moves', async ({ page, scenario }) => {
  const { word, before } = (scenario as Story).slidWhileShowing!;
  expect(rowOf(await two(page), word).columnCell).toBe(before - 1);
});

Then("the column's letters pulse once and keep their colour", async ({ page, scenario }) => {
  const view = await two(page);
  const middle = view.column.x + view.column.width / 2;
  const { colours } = await current(page);
  for (const row of view.rows) {
    expect(pulsesOn((await framesOf(page, scenario)), row.y, middle), `${row.word}'s column letter pulses once`).toBe(1);
    const fills = new Set(
      (await framesOf(page, scenario)).flatMap((frame) => frame.screen.filter((object) => object.kind === 'rect' && object.depth < 8 && Math.abs(object.y - row.y) < 2 && Math.abs(object.x - middle) < 2).map((object) => object.fill)),
    );
    expect(fills.has(colours.tileGold)).toBe(false);
    expect(fills.size).toBe(1);
  }
});

// Phase two starting on a bonus word

Given('a level whose column reads a bonus word when phase two starts', async ({ scenario }) => {
  scenario.level = cowLevel();
});

Given("a level where FOWL is in WOLF's letters and can also be read in the column", async ({ scenario }) => {
  scenario.level = fowlLevel();
});

Then('"Bonus word!" appears once the ceremony has ended', async ({ page }) => {
  await expect.poll(async () => visibleText(await screen(page), BONUS).length, { timeout: 2000 }).toBeGreaterThan(0);
  const view = await two(page);
  expect(view.ceremonyDone).toBe(true);
  expect(view.columnText).toBe('COW');
});

// Coins

function flyingCoins(frame: Frame) {
  return frame.screen.filter((object) => object.kind === 'graphics' && object.depth === FLIGHT_DEPTH && object.lines.length === 8);
}

function centreOfLines(object: Drawn) {
  return { x: object.lines.reduce((sum, line) => sum + line.x1, 0) / object.lines.length, y: object.lines.reduce((sum, line) => sum + line.y1, 0) / object.lines.length };
}

async function expectCoinsFrom(page: Page, scenario: Scenario, from: { x: number; y: number }, reach: { x: number; y: number }) {
  const { layout } = await current(page);
  const counter = layout.topItems.find((item) => item.name === 'coins')!;
  const target = centreOf(counter);
  const frames = (await framesOf(page, scenario)).filter((frame) => flyingCoins(frame).length > 0);
  expect(frames.length).toBeGreaterThan(5);
  const first = centreOfLines(flyingCoins(frames[0])[0]);
  expect(Math.abs(first.x - from.x)).toBeLessThan(reach.x);
  expect(Math.abs(first.y - from.y)).toBeLessThan(reach.y);
  const last = flyingCoins(frames[frames.length - 1]).map(centreOfLines);
  expect(last.some((point) => Math.hypot(point.x - target.x, point.y - target.y) < layout.tileSize)).toBe(true);
  const all = await framesOf(page, scenario);
  expect(flyingCoins(all[all.length - 1])).toEqual([]);
}

Then('coins fly from the column to the coin counter', async ({ page, scenario }) => {
  const { column } = await two(page);
  const tile = (await current(page)).layout.tileSize;
  await expectCoinsFrom(page, scenario, centreOf(column), { x: tile, y: column.height / 2 + tile / 2 });
});

Then(/^coins fly from (\w+)'s row to the coin counter$/, async ({ page, scenario }, word: string) => {
  const { layout } = await current(page);
  const cells = layout.rows[layoutRowOf(layout, word)].cells;
  const first = centreOf(cells[0]);
  const last = centreOf(cells[cells.length - 1]);
  await expectCoinsFrom(page, scenario, { x: (first.x + last.x) / 2, y: first.y }, { x: (last.x - first.x) / 2 + layout.tileSize / 2, y: layout.tileSize });
});

Given('a bonus word reward of {int}', async ({ page }, reward: number) => {
  await setEconomy(page, { bonusWordReward: reward });
});

Then('the coin counter counts up from {int} to {int}', async ({ page, scenario }, from: number, to: number) => {
  const { layout } = await current(page);
  const counter = layout.topItems.find((item) => item.name === 'coins')!;
  const inside = (object: Drawn) => object.x >= counter.x && object.x <= counter.x + counter.width && object.y >= counter.y && object.y <= counter.y + counter.height;
  const values = (await framesOf(page, scenario)).map((frame) => frame.screen.find((object) => object.kind === 'text' && inside(object) && /^\d+$/.test(object.text ?? ''))?.text).filter((text): text is string => !!text).map(Number);
  expect(values[0]).toBe(from);
  expect(values[values.length - 1]).toBe(to);
  values.slice(1).forEach((value, index) => expect(value).toBeGreaterThanOrEqual(values[index]));
  expect(new Set(values).size).toBeGreaterThan(2);
});

// Nothing to miss (R8)

Then('nothing on screen mentions bonus words, found or left', async ({ page, scenario }) => {
  await waitForPopup(page);
  // The win step records from the move that wins.
  const frames = [...(await stopRecording(page)), { t: 0, screen: await screen(page), two: null }];
  const mentions = frames.flatMap((frame) => frame.screen.filter((object) => object.kind === 'text' && /bonus|found|left|missed/i.test(object.text ?? '')));
  expect(mentions.map((object) => object.text)).toEqual([]);
});

