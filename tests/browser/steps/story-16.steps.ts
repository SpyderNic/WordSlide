import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { styles } from '../../../src/style';
import { makeLevel, reveal } from '../../support/levels';
import { test, type Scenario } from './fixtures';
import { centreOf, hold, layoutNow, placeLetter, poolTile, ready, rowOf, themePoint } from './phase-one.steps';
import { waitForPopup, win } from './phase-two.steps';
import { screen, startRecording, stopRecording, tweens, type Frame } from './probe';
import { current } from './story-02.steps';

const { Given, When, Then } = createBdd(test);

/** Letters on their way between the pool and the cells are drawn at this depth. */
const TRAVEL_DEPTH = 8;
const MIN_TEXT = 12;

interface Point {
  t: number;
  x: number;
  y: number;
}

/**
 * Each journey of a travelling letter, frame by frame. The same letter can travel twice at once,
 * say an R placed while a hinted R goes home, so a point joins the journey it's nearest to.
 */
function journeys(frames: Frame[], letter: string): Point[][] {
  const found: Point[][] = [];
  for (const frame of frames) {
    const open = found.filter((journey) => frame.t - journey[journey.length - 1].t < 100);
    const points = frame.screen
      .filter((object) => object.kind === 'text' && object.depth === TRAVEL_DEPTH && object.text === letter)
      .map((object) => ({ t: frame.t, x: object.x, y: object.y }));
    // The closest pairs first, so a letter that's just appeared doesn't take over another's journey.
    const pairs = open
      .flatMap((journey) => points.map((point) => ({ journey, point, gap: distance(journey[journey.length - 1], point) })))
      .filter((pair) => pair.gap < 80)
      .sort((a, b) => a.gap - b.gap);
    const used = new Set<Point[]>();
    const placed = new Set<Point>();
    for (const { journey, point } of pairs) {
      if (used.has(journey) || placed.has(point)) continue;
      journey.push(point);
      used.add(journey);
      placed.add(point);
    }
    points.filter((point) => !placed.has(point)).forEach((point) => found.push([point]));
  }
  return found;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** The journey that starts near a point, and where it ends. */
function journeyFrom(frames: Frame[], letter: string, from: { x: number; y: number }, tolerance: number) {
  const journey = journeys(frames, letter).find((points) => distance(points[0], from) <= tolerance);
  expect(journey, `No ${letter} travelling from ${Math.round(from.x)}, ${Math.round(from.y)}`).toBeDefined();
  return journey!;
}

function near(point: Point, target: { x: number; y: number }, tolerance: number) {
  return Math.hypot(point.x - target.x, point.y - target.y) <= tolerance;
}

async function record(page: Page, scenario: Scenario, action: () => Promise<void>, wait = 700) {
  await startRecording(page);
  await action();
  await page.waitForTimeout(wait);
  scenario.frames = await stopRecording(page);
}

async function useStyle(page: Page, name: string) {
  await page.addInitScript((style) => Object.assign(window, { wordSlideStyle: style }), name);
}

async function clickCell(page: Page, scenario: Scenario, word: string, cell: number) {
  const layout = await layoutNow(page, scenario);
  const { x, y } = centreOf(layout.rows[rowOf(layout, word)].cells[cell]);
  await page.mouse.click(x, y);
}

// Travel to a cell

Given('a row is selected', async ({ page, scenario }) => {
  await clickCell(page, scenario, 'LEMUR', 0);
});

When('the player taps a letter in the pool', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  const from = centreOf(poolTile(layout, 'L'));
  scenario.travel = { letter: 'L', from, to: centreOf(layout.rows[rowOf(layout, 'LEMUR')].cells[0]) };
  await record(page, scenario, () => page.mouse.click(from.x, from.y));
});

Then(/^the letter travels to its cell in about 0\.15 seconds$/, async ({ page, scenario }) => {
  const { tileSize } = (await current(page)).layout;
  const path = journeyFrom(scenario.frames!, scenario.travel!.letter, scenario.travel!.from, tileSize / 2);
  expect(near(path[path.length - 1], scenario.travel!.to, tileSize / 2)).toBe(true);
  const length = path[path.length - 1].t - path[0].t;
  expect(length).toBeGreaterThan(90);
  expect(length).toBeLessThan(230);
});

When('the player quickly types ZEBRA', async ({ page, scenario }) => {
  await ready(page, scenario);
  await startRecording(page);
  for (const key of 'zebra') await page.keyboard.press(key);
  scenario.placedAtOnce = (await current(page)).layout.rows[rowOf((await current(page)).layout, 'ZEBRA')].cells.map((cell) => (cell.cell.kind === 'empty' ? '_' : cell.cell.character)).join('');
  await page.waitForTimeout(700);
  scenario.frames = await stopRecording(page);
});

Then('every letter counts as placed straight away', async ({ scenario }) => {
  expect(scenario.placedAtOnce).toBe('ZEBRA');
});

Then('the letters arrive in order', async ({ scenario }) => {
  const arrivals = [...'ZEBRA'].map((letter) => {
    const [path] = journeys(scenario.frames!, letter);
    expect(path, letter).toBeDefined();
    return path[path.length - 1].t;
  });
  arrivals.slice(1).forEach((t, index) => expect(t).toBeGreaterThanOrEqual(arrivals[index]));
});

// Travel back to the pool

When(/^a letter goes back to the pool through (Recall All|Backspace|a hint leaving its row|a drop on a fixed cell)$/, async ({ page, scenario }, cause: string) => {
  if (cause === 'a hint leaving its row') {
    scenario.level = makeLevel(['TART', 'TREE']);
    reveal(scenario.level, 'TART', 'R', 3);
  }
  if (cause === 'a drop on a fixed cell') reveal(scenario.level, 'LEMUR', 'L', 1);
  const layout = await layoutNow(page, scenario);
  const pool = (letter: string) => centreOf(poolTile(layout, letter));
  if (cause === 'Recall All') {
    await placeLetter(rowOf(layout, 'ZEBRA'), 0, 'Z')(page);
    await page.waitForTimeout(400);
    scenario.travel = { letter: 'Z', from: centreOf(layout.rows[rowOf(layout, 'ZEBRA')].cells[0]), to: pool('Z') };
    const recall = centreOf(layout.recall);
    await record(page, scenario, () => page.mouse.click(recall.x, recall.y));
  } else if (cause === 'Backspace') {
    await clickCell(page, scenario, 'LEMUR', 0);
    await page.keyboard.press('l');
    await page.waitForTimeout(400);
    scenario.travel = { letter: 'L', from: centreOf(layout.rows[rowOf(layout, 'LEMUR')].cells[0]), to: pool('L') };
    await record(page, scenario, () => page.keyboard.press('Backspace'));
  } else if (cause === 'a hint leaving its row') {
    // Row 1 can only take TART, because of its R. Building TART in row 2 sends the R back (D9).
    const row1 = layout.rows[0];
    scenario.travel = { letter: 'R', from: centreOf(row1.cells[2]), to: pool('R') };
    // T, A and R land first, so the R going home can't be mistaken for the R arriving.
    for (const [cell, letter] of [...'TAR'].entries()) await placeLetter(1, cell, letter)(page);
    await page.waitForTimeout(400);
    await record(page, scenario, () => placeLetter(1, 3, 'T')(page));
  } else {
    // A drop on the revealed L sends the A back to the pool from where it was dropped.
    const target = centreOf(layout.rows[rowOf(layout, 'LEMUR')].cells[0]);
    scenario.travel = { letter: 'A', from: target, to: pool('A') };
    await record(page, scenario, async () => {
      await hold(page, pool('A'), target);
      await page.mouse.up();
    });
  }
});

Then('it travels back to its tile', async ({ page, scenario }) => {
  const { tileSize } = (await current(page)).layout;
  const path = journeyFrom(scenario.frames!, scenario.travel!.letter, scenario.travel!.from, tileSize / 2);
  const all = journeys(scenario.frames!, scenario.travel!.letter).map((j) => [j[0], j[j.length - 1]].map((p) => Math.round(p.x) + ',' + Math.round(p.y)).join(' to '));
  expect(near(path[path.length - 1], scenario.travel!.to, tileSize / 2), JSON.stringify({ to: scenario.travel!.to, all })).toBe(true);
});

Given('letters placed in three cells', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  // One letter in each row, so the order is easy to see: E in the top row, B in the middle, K at the bottom.
  await placeLetter(rowOf(layout, 'KANGAROO'), 0, 'K')(page);
  await placeLetter(rowOf(layout, 'LEMUR'), 1, 'E')(page);
  await placeLetter(rowOf(layout, 'ZEBRA'), 2, 'B')(page);
  await page.waitForTimeout(400);
  await startRecording(page);
});

Then(/^they leave one after another, 0\.03 seconds apart, from the top row down$/, async ({ page, scenario }) => {
  await page.waitForTimeout(600);
  scenario.frames = await stopRecording(page);
  // A letter leaves when it starts to move from its cell.
  const starts = ['E', 'B', 'K'].map((letter) => {
    const [path] = journeys(scenario.frames!, letter);
    expect(path, letter).toBeDefined();
    return path.find((point) => distance(point, path[0]) > 2)!.t;
  });
  for (let index = 1; index < starts.length; index++) {
    expect(starts[index] - starts[index - 1]).toBeGreaterThan(15);
    expect(starts[index] - starts[index - 1]).toBeLessThan(70);
  }
});

// Travel from a drop

When('the player releases a letter with its centre over a cell', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  const cell = centreOf(layout.rows[rowOf(layout, 'ZEBRA')].cells[0]);
  const drop = { x: cell.x + layout.tileSize * 0.25, y: cell.y + layout.tileSize * 0.25 };
  scenario.travel = { letter: 'Z', from: drop, to: cell };
  await record(page, scenario, async () => {
    await hold(page, centreOf(poolTile(layout, 'Z')), drop);
    await page.mouse.up();
  });
});

Then('it travels from there into the cell', async ({ page, scenario }) => {
  const { tileSize } = (await current(page)).layout;
  const path = journeyFrom(scenario.frames!, 'Z', scenario.travel!.from, 4);
  expect(near(path[path.length - 1], scenario.travel!.to, tileSize / 4)).toBe(true);
});

When('the player releases a letter away from any cell', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  const drop = themePoint(layout);
  scenario.travel = { letter: 'Z', from: drop, to: centreOf(poolTile(layout, 'Z')) };
  await record(page, scenario, async () => {
    await hold(page, centreOf(poolTile(layout, 'Z')), drop);
    await page.mouse.up();
  });
});

Then('it travels from there to its tile in the pool', async ({ page, scenario }) => {
  const { tileSize } = (await current(page)).layout;
  const path = journeyFrom(scenario.frames!, 'Z', scenario.travel!.from, 4);
  expect(near(path[path.length - 1], scenario.travel!.to, tileSize / 2)).toBe(true);
});

// Readable text, and x0

When('a level opens', async ({ page, scenario }) => {
  await ready(page, scenario);
});

Then('the pool counts are at least the minimum readable size', async ({ page }) => {
  const counts = (await screen(page)).filter((object) => object.kind === 'text' && /^x\d+$/.test(object.text ?? ''));
  expect(counts.length).toBeGreaterThan(0);
  counts.forEach((count) => expect(count.fontSize).toBeGreaterThanOrEqual(MIN_TEXT));
});

When('a letter has no copies left', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  await placeLetter(rowOf(layout, 'ZEBRA'), 0, 'Z')(page);
});

Then('its tile shows x0', async ({ page }) => {
  const { layout, colours } = await current(page);
  const tile = poolTile(layout, 'Z');
  const objects = await screen(page);
  const inside = objects.filter((object) => object.x > tile.x && object.x < tile.x + tile.width && object.y > tile.y && object.y < tile.y + tile.height);
  expect(inside.some((object) => object.kind === 'rect' && object.fill === colours.tileGrey)).toBe(true);
  expect(inside.some((object) => object.text === 'x0')).toBe(true);
});

// One style, used everywhere

When(/^the (gold colour|tile font|letter travel time) is changed in the style file$/, async ({ page, scenario }, setting: string) => {
  scenario.setting = setting;
  await useStyle(page, 'test');
});

Then('every use of it changes', async ({ page, scenario }) => {
  const test = styles.test;
  const original = styles.woodAndBrass;
  if (scenario.setting === 'gold colour') {
    await win(page, scenario);
    await waitForPopup(page);
    await page.waitForTimeout(800);
    const fills = (await screen(page)).map((object) => object.fill);
    expect(fills).toContain(test.colours.tileGold);
    expect(fills).not.toContain(original.colours.tileGold);
  } else if (scenario.setting === 'tile font') {
    await ready(page, scenario);
    const texts = (await screen(page)).filter((object) => object.kind === 'text');
    expect(texts.length).toBeGreaterThan(10);
    texts.forEach((text) => expect(text.font).toBe(test.font));
  } else {
    const layout = await layoutNow(page, scenario);
    await clickCell(page, scenario, 'LEMUR', 0);
    const from = centreOf(poolTile(layout, 'L'));
    await record(page, scenario, () => page.mouse.click(from.x, from.y), 900);
    const [path] = journeys(scenario.frames!, 'L');
    expect(path).toBeDefined();
    const length = path[path.length - 1].t - path[0].t;
    expect(length).toBeGreaterThan(test.timings.letterTravel - 80);
    expect(length).toBeLessThan(test.timings.letterTravel + 100);
    const moves = (await tweens(page)).filter((tween) => tween.props.includes('x'));
    expect(moves.some((tween) => tween.duration === test.timings.letterTravel)).toBe(true);
  }
});

When('a second style file is added', async ({ page }) => {
  expect(Object.keys(styles).length).toBeGreaterThan(1);
  await useStyle(page, 'test');
});

Then('the game can use it with no change to its rules or code', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  expect((await current(page)).colours).toEqual(styles.test.colours);
  await placeLetter(rowOf(layout, 'ZEBRA'), 0, 'Z')(page);
  const { x, y } = centreOf(layout.rows[rowOf(layout, 'ZEBRA')].cells[0]);
  const tile = (await screen(page)).find((object) => object.kind === 'rect' && object.fill !== null && Math.abs(object.x - x) < 2 && Math.abs(object.y - y) < 2);
  expect(tile?.fill).toBe(styles.test.colours.tilePlaced);
});


// Raised tiles, the column's sides, and pool counts (from playing milestone 5)

function brightness(colour: number) {
  return ((colour >> 16) & 255) * 0.299 + ((colour >> 8) & 255) * 0.587 + (colour & 255) * 0.114;
}

async function edgesOfFirstCell(page: Page, scenario: Scenario) {
  const layout = await layoutNow(page, scenario);
  const cell = layout.rows[0].cells[0];
  const { x, y } = centreOf(cell);
  const objects = await screen(page);
  const body = objects.find((object) => object.kind === 'rect' && object.fill !== null && Math.abs(object.x - x) < 2 && Math.abs(object.y - y) < 2)!;
  const edges = objects.filter((object) => object.kind === 'bevel' && Math.abs(object.x - x) < cell.width / 2 + 1 && Math.abs(object.y - y) < cell.height / 2 + 1);
  const edge = (side: 'top' | 'bottom' | 'left' | 'right') =>
    edges.find((object) =>
      side === 'top' ? object.y < y - cell.height * 0.3 && object.width > cell.width * 0.5
      : side === 'bottom' ? object.y > y + cell.height * 0.3 && object.width > cell.width * 0.5
      : side === 'left' ? object.x < x - cell.width * 0.3 && object.height > cell.height * 0.5
      : object.x > x + cell.width * 0.3 && object.height > cell.height * 0.5,
    );
  return { body, edge };
}

Then("its tile's top and left edges are lighter than it", async ({ page, scenario }) => {
  const { body, edge } = await edgesOfFirstCell(page, scenario);
  for (const side of ['top', 'left'] as const) {
    expect(edge(side), side).toBeDefined();
    expect(brightness(edge(side)!.fill!)).toBeGreaterThan(brightness(body.fill!));
  }
});

Then('its bottom and right edges are darker', async ({ page, scenario }) => {
  const { body, edge } = await edgesOfFirstCell(page, scenario);
  for (const side of ['bottom', 'right'] as const) {
    expect(edge(side), side).toBeDefined();
    expect(brightness(edge(side)!.fill!)).toBeLessThan(brightness(body.fill!));
  }
});

Then("the column's sides are drawn above the words", async ({ page }) => {
  const objects = await screen(page);
  const sides = objects.find((object) => object.kind === 'graphics' && object.triangles.length === 2)!;
  const letters = objects.filter((object) => object.kind === 'text' && object.depth === 1);
  expect(letters.length).toBeGreaterThan(5);
  // Two upright lines, one each side of the column, drawn over the words' depth.
  expect(sides.lines.filter((line) => Math.abs(line.x1 - line.x2) < 0.5 && Math.abs(line.y2 - line.y1) > 40).length).toBeGreaterThanOrEqual(2);
  expect(sides.depth).toBeGreaterThan(1);
});

Then('its tinted strip is drawn behind them', async ({ page }) => {
  const objects = await screen(page);
  const strip = objects.filter((object) => object.kind === 'graphics' && object.triangles.length === 0 && object.depth < 1);
  expect(strip.length).toBeGreaterThan(0);
});

/** The count shown on a letter's pool tile, as drawn. */
async function shownCount(page: Page, letter: string) {
  const { layout } = await current(page);
  const tile = poolTile(layout, letter);
  const objects = await screen(page);
  return objects.find((object) => object.kind === 'text' && /^x\d+$/.test(object.text ?? '') && object.x > tile.x && object.x < tile.x + tile.width && object.y > tile.y && object.y < tile.y + tile.height)?.text;
}

async function travelling(page: Page, letter: string) {
  return (await screen(page)).some((object) => object.kind === 'text' && object.depth === TRAVEL_DEPTH && object.text === letter);
}

Then('the Z tile shows x0 until the Z lands', async ({ page }) => {
  expect(await travelling(page, 'Z')).toBe(true);
  expect(await shownCount(page, 'Z')).toBe('x0');
});

Then('then it shows x1', async ({ page }) => {
  await expect.poll(() => travelling(page, 'Z')).toBe(false);
  expect(await shownCount(page, 'Z')).toBe('x1');
});

When('the player taps the Z in the pool', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  const { x, y } = centreOf(poolTile(layout, 'Z'));
  await page.mouse.click(x, y);
});

Then('the Z tile shows x0 straight away', async ({ page }) => {
  expect(await travelling(page, 'Z')).toBe(true);
  expect(await shownCount(page, 'Z')).toBe('x0');
});

Then('so is its glass line', async ({ page }) => {
  const objects = await screen(page);
  const sides = objects.find((object) => object.kind === 'graphics' && object.triangles.length === 2)!;
  const upright = sides.lines.filter((line) => Math.abs(line.x1 - line.x2) < 0.5 && Math.abs(line.y2 - line.y1) > 40).map((line) => line.x1);
  const [left, right] = [Math.min(...upright), Math.max(...upright)];
  // A third upright line, inside the column rather than on its edges.
  expect(upright.some((x) => x > left + 2 && x < right - 2)).toBe(true);
});
