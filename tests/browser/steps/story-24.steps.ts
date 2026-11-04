import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import type { LevelLayout } from '../../../src/game/layout';
import { test, type Scenario } from './fixtures';
import { centreOf, hold, layoutNow, placeLetter, poolTile, rowOf } from './phase-one.steps';
import { screen, startRecording, stopRecording, type Frame } from './probe';
import { current } from './story-02.steps';
import { handPath, visits } from './story-12.steps';

const { Given, When, Then } = createBdd(test);

const CELLS: Record<string, number> = { first: 0, second: 1, third: 2, fourth: 3 };

// Level 1's step 1 (R2)

Then(/^a hand animates between the (O|X) in the pool and FOX's (second|third) cell$/, async ({ page, scenario }, letter: string, which: string) => {
  const layout = await layoutNow(page, scenario);
  const path = await handPath(page, scenario);
  expect(path.length).toBeGreaterThan(10);
  const tolerance = layout.tileSize * 0.6;
  expect(visits(path, centreOf(poolTile(layout, letter)), tolerance)).toBe(true);
  expect(visits(path, centreOf(layout.rows[rowOf(layout, 'FOX')].cells[CELLS[which]]), tolerance)).toBe(true);
});

When("the player drags the O onto FOX's third cell", async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  scenario.acted = true;
  await hold(page, centreOf(poolTile(layout, 'O')), centreOf(layout.rows[rowOf(layout, 'FOX')].cells[2]));
  await page.mouse.up();
  await page.waitForTimeout(500);
});

Then("FOX's third cell is empty", async ({ page }) => {
  const { layout } = await current(page);
  expect(layout.rows[rowOf(layout, 'FOX')].cells[2].cell.kind).toBe('empty');
});

Given("the O is in FOX's second cell", async ({ scenario }) => {
  scenario.setup.push(placeLetter(0, 1, 'O'));
});

When(/^the player (presses|taps) the X first$/, async ({ page, scenario }, input: string) => {
  const layout = await layoutNow(page, scenario);
  scenario.acted = true;
  if (input === 'presses') await page.keyboard.press('x');
  else {
    const { x, y } = centreOf(poolTile(layout, 'X'));
    await page.mouse.click(x, y);
  }
  await page.waitForTimeout(500);
});

// Highlights (R3)

When("the player drags E from LEMUR's pool over ZEBRA's row", async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  scenario.acted = true;
  await hold(page, centreOf(poolTile(layout, 'E')), centreOf(layout.rows[rowOf(layout, 'ZEBRA')].cells[1]));
  await page.waitForTimeout(200);
});

// A small pool on one line (R4)

/** The pool's tiles, line by line from the top. */
function poolLines(layout: LevelLayout) {
  const lines = new Map<number, number[]>();
  for (const tile of layout.poolTiles) lines.set(Math.round(tile.y), [...(lines.get(Math.round(tile.y)) ?? []), tile.x]);
  return [...lines.entries()].sort((a, b) => a[0] - b[0]).map(([, xs]) => xs.sort((a, b) => a - b));
}

Then("the pool's tiles are side by side, on one line", async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  const lines = poolLines(layout);
  expect(layout.poolTiles.length).toBeGreaterThan(1);
  expect(lines).toHaveLength(1);
  // Drawn there too: each tile's letter is on screen at its place.
  const objects = await screen(page);
  for (const tile of layout.poolTiles) {
    const { x, y } = centreOf(tile);
    expect(objects.some((object) => object.kind === 'text' && object.text === tile.character && Math.abs(object.x - x) < 2 && Math.abs(object.y - y) < tile.height / 2)).toBe(true);
  }
});

Given('a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 300, height: 600 });
});

Then("the pool's first line is full before the next one starts", async ({ page }) => {
  await page.waitForTimeout(350);
  const { layout } = await current(page);
  const lines = poolLines(layout);
  // Something to check: the pool must need more than one line on this screen.
  expect(lines.length).toBeGreaterThan(1);
  lines.slice(1).forEach((line) => expect(line.length).toBeLessThanOrEqual(lines[0].length));
  // The first line takes as many tiles as fit: one more wouldn't.
  const pitch = lines[0].length > 1 ? lines[0][1] - lines[0][0] : layout.tileSize;
  expect(lines[0].length * pitch + layout.tileSize).toBeGreaterThan(layout.poolArea.width);
});

// Letters moving aside (R6)

function readsOf(layout: LevelLayout, word: string): string {
  return layout.rows[rowOf(layout, word)].cells.map(({ cell }) => (cell.kind === 'empty' ? '_' : cell.character === ' ' ? '␣' : cell.character)).join(' ');
}

// Given and Then share this text: before the level opens it places the letters, after it checks them.
Given(/^(LEMUR|HOT DOG|OWL)'s row reads (.+)$/, async ({ page, scenario }, word: string, text: string) => {
  if (scenario.views.length === 0 && !scenario.acted) {
    scenario.setup.push(async (page) => {
      const { layout } = await current(page);
      const row = rowOf(layout, word);
      for (const [cell, character] of text.split(' ').entries()) {
        if (character === '_' || character === '␣' || layout.rows[row].cells[cell].cell.kind !== 'empty') continue;
        await placeLetter(row, cell, character)(page);
      }
      expect(readsOf((await current(page)).layout, word)).toBe(text);
    });
    return;
  }
  await page.waitForTimeout(400);
  expect(readsOf((await current(page)).layout, word)).toBe(text);
});

/** The cells of a letter in a row: the last one first when asked for "the last". */
function cellOfLetter(layout: LevelLayout, row: number, letter: string, last: boolean): number {
  const cells = layout.rows[row].cells.map(({ cell }) => (cell.kind === 'placed' ? cell.character : null));
  return last ? cells.lastIndexOf(letter) : cells.indexOf(letter);
}

async function dragOnto(page: Page, scenario: Scenario, letter: string, target: string, last: boolean, release: boolean) {
  const layout = await layoutNow(page, scenario);
  scenario.acted = true;
  const row = layout.rows.findIndex((candidate) => candidate.cells.some(({ cell }) => cell.kind === 'placed' && cell.character === letter));
  const from = cellOfLetter(layout, row, letter, last);
  const to = layout.rows[row].cells.findIndex(({ cell }) => cell.kind !== 'empty' && cell.character === target);
  await hold(page, centreOf(layout.rows[row].cells[from]), centreOf(layout.rows[row].cells[to]));
  if (!release) return;
  await page.mouse.up();
  await page.waitForTimeout(400);
}

When(/^the player drags the (last )?(\S) onto the (\S)$/, async ({ page, scenario }, last: string | undefined, letter: string, target: string) => {
  await dragOnto(page, scenario, letter, target, !!last, true);
});

When(/^the player drags the (\S) to LEMUR's (fourth) cell$/, async ({ page, scenario }, letter: string, which: string) => {
  const layout = await layoutNow(page, scenario);
  scenario.acted = true;
  const row = layout.rows[rowOf(layout, 'LEMUR')];
  const from = row.cells.findIndex(({ cell }) => cell.kind === 'placed' && cell.character === letter);
  await hold(page, centreOf(row.cells[from]), centreOf(row.cells[CELLS[which]]));
  await page.mouse.up();
  await page.waitForTimeout(400);
});

When('the player holds the U over the M', async ({ page, scenario }) => {
  await layoutNow(page, scenario);
  scenario.before = await current(page);
  await startRecording(page);
  await dragOnto(page, scenario, 'U', 'M', false, false);
  await page.waitForTimeout(400);
  scenario.frames = await stopRecording(page);
});

/** Where a row's letter is drawn in one frame, ignoring the dragged tile (drawn higher up). */
function letterX(frame: Frame, y: number, letter: string, tile: number): number | undefined {
  return frame.screen.find((object) => object.kind === 'text' && object.text === letter && Math.abs(object.y - y) < tile / 4 && object.depth < 8)?.x;
}

Then('L, E and M slide one cell left in about 0.1 seconds', async ({ page, scenario }) => {
  const layout = scenario.before!.layout;
  const row = layout.rows[rowOf(layout, 'LEMUR')];
  const pitch = row.cells[1].x - row.cells[0].x;
  const y = centreOf(row.cells[0]).y;
  const frames = scenario.frames!;
  // Still held: nothing is dropped yet.
  expect((await current(page)).dragging).toBe('U');
  for (const [index, letter] of ['L', 'E', 'M'].entries()) {
    const start = centreOf(row.cells[index + 1]).x;
    const xs = frames.map((frame) => ({ t: frame.t, x: letterX(frame, y, letter, layout.tileSize) })).filter((sample): sample is { t: number; x: number } => sample.x !== undefined);
    const end = xs[xs.length - 1].x;
    expect(end, letter).toBeCloseTo(start - pitch, 0);
    const moving = xs.filter((sample) => Math.abs(sample.x - start) > 1 && Math.abs(sample.x - end) > 1);
    // It glides through places in between, briefly.
    expect(moving.length, letter).toBeGreaterThan(0);
    expect(moving[moving.length - 1].t - moving[0].t, letter).toBeLessThan(200);
  }
});

// OWL's step lets the player make mistakes (R7)

When(/^the player drags the (L|W) to OWL's (second|third) cell$/, async ({ page, scenario }, letter: string, which: string) => {
  const layout = await layoutNow(page, scenario);
  scenario.acted = true;
  await startRecording(page);
  await hold(page, centreOf(poolTile(layout, letter)), centreOf(layout.rows[rowOf(layout, 'OWL')].cells[CELLS[which]]));
  await page.mouse.up();
  await page.waitForTimeout(700);
  scenario.frames = await stopRecording(page);
});

// Given and Then share this text: before the level opens it places the L, after it checks it.
Given("the L is in OWL's second cell", async ({ page, scenario }) => {
  if (scenario.views.length === 0 && !scenario.acted) {
    scenario.setup.push(placeLetter(1, 1, 'L'));
    return;
  }
  const { layout } = await current(page);
  expect(layout.rows[rowOf(layout, 'OWL')].cells[1].cell).toEqual({ kind: 'placed', character: 'L' });
});

Then("OWL's second cell is empty", async ({ page }) => {
  const { layout } = await current(page);
  expect(layout.rows[rowOf(layout, 'OWL')].cells[1].cell.kind).toBe('empty');
});
