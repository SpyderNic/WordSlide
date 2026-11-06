import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { SAVE_KEY, writeProgress } from '../../../src/game/progress';
import { DEFAULT_WORDS, makeLevel, tutorialLevel } from '../../support/levels';
import { reorderingNotTaught, test, type GameView, type Scenario } from './fixtures';
import { centreOf, hold, layoutNow, placeLetter, poolTile } from './phase-one.steps';
import { dragHandle, dragSlowlyAndRelease, openLevel, pitchOf, pointOnWord, popupParts, ready, restingX, two, waitForPopup } from './phase-two.steps';
import { screen, startRecording, stopRecording, type Drawn, type Frame } from './probe';
import { current } from './m02-02.steps';
import { openGame } from './m05-01.steps';

const { Given, When, Then } = createBdd(test);

/** The hand is drawn at this depth, its fingertip at its position. The tutorial's text, at TEXT_DEPTH. */
const HAND_DEPTH = 25;
const TEXT_DEPTH = 22;

const STEP_TEXT: Record<string, string> = {
  // M06-03 changed steps 1 and 2.
  1: 'Drag letters to complete a word',
  2: 'Each word has its own letters. Finish the grid!',
  // Reordering moved to its own tutorial (M05-04), so sliding is step 3.
  3: 'You can drag words side to side to find the word, try it!',
};

function handIn(objects: Drawn[]) {
  return objects.find((object) => object.depth === HAND_DEPTH);
}

export async function handPath(page: Page, scenario: Scenario, wait = 2600) {
  await startRecording(page);
  await page.waitForTimeout(wait);
  const frames = await stopRecording(page);
  scenario.handPath = frames.flatMap((frame: Frame) => {
    const hand = handIn(frame.screen);
    return hand && hand.alpha > 0.05 ? [{ t: frame.t, x: hand.x, y: hand.y }] : [];
  });
  return scenario.handPath;
}

export function visits(path: { x: number; y: number }[], target: { x: number; y: number }, tolerance: number) {
  return path.some((point) => Math.hypot(point.x - target.x, point.y - target.y) <= tolerance);
}

export async function tutorialText(page: Page) {
  return (await screen(page)).filter((object) => object.kind === 'text' && object.depth === TEXT_DEPTH).map((object) => object.text);
}

async function shownCount(page: Page, letter: string) {
  const { layout } = await current(page);
  const tile = poolTile(layout, letter);
  return (await screen(page)).find((object) => object.kind === 'text' && /^x\d+$/.test(object.text ?? '') && object.x > tile.x && object.x < tile.x + tile.width && object.y > tile.y && object.y < tile.y + tile.height)?.text;
}

async function lockRow(page: Page, row: number, word: string) {
  for (const [cell, letter] of [...word].entries()) {
    const { layout } = await current(page);
    if (layout.rows[row].cells[cell].cell.kind === 'empty') await placeLetter(row, cell, letter)(page);
  }
}

// The tutorial level

Given('a new player on level 1', async ({ page, scenario }) => {
  await reorderingNotTaught(page);
  const normal = makeLevel(DEFAULT_WORDS, 'ELK');
  scenario.level = tutorialLevel();
  scenario.levelList = [scenario.level, normal, normal];
  scenario.finalWordGiven = true;
});

Then('the text says {string}', async ({ page, scenario }, text: string) => {
  if (scenario.views.length === 0) await openLevel(page, scenario);
  await expect.poll(() => tutorialText(page)).toContain(text);
});

// Step 1

// M06-03: FOX starts as F _ _, so the hand goes from the O to its first empty cell.
Then("a hand animates between the O in the pool and the top word's first empty cell", async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  const path = await handPath(page, scenario);
  expect(path.length).toBeGreaterThan(10);
  expect(visits(path, centreOf(poolTile(layout, 'O')), layout.tileSize * 0.6)).toBe(true);
  expect(visits(path, centreOf(layout.rows[0].cells[1]), layout.tileSize * 0.6)).toBe(true);
});

When("the player drags the X to the top word's empty cell", async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  await hold(page, centreOf(poolTile(layout, 'X')), centreOf(layout.rows[0].cells[2]));
  await page.mouse.up();
  await page.waitForTimeout(400);
});

Then(/^(FOX|OWL) locks$/, async ({ page }, word: string) => {
  await expect.poll(async () => (await current(page)).layout.rows.find((row) => row.word === word)?.locked ?? (await current(page)).phaseTwo !== null).toBe(true);
});

When('the player drags the X and releases it anywhere else', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  await hold(page, centreOf(poolTile(layout, 'X')), centreOf(layout.rows[1].cells[1]));
  await page.mouse.up();
  await page.waitForTimeout(400);
});

Then('the X is back in the pool', async ({ page }) => {
  const { layout } = await current(page);
  expect(poolTile(layout, 'X').count).toBe(1);
  expect(await shownCount(page, 'X')).toBe('x1');
  expect(layout.rows.flatMap((row) => row.cells).some((cell) => cell.cell.kind === 'placed')).toBe(false);
});

When('the player tries to drag the W', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  await hold(page, centreOf(poolTile(layout, 'W')), centreOf(layout.rows[1].cells[1]));
  scenario.heldWord = (await current(page)).dragging !== null;
  await page.mouse.up();
});

// Step 2

Given('FOX is locked', async ({ scenario }) => {
  scenario.setup.push((page) => lockRow(page, 0, 'FOX'));
});

Then("there's no hand", async ({ page, scenario }) => {
  if (scenario.views.length === 0) await openLevel(page, scenario);
  const path = await handPath(page, scenario, 1500);
  expect(path).toEqual([]);
});

When('the player drags the W to the last empty cell', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  await hold(page, centreOf(poolTile(layout, 'W')), centreOf(layout.rows[1].cells[1]));
  await page.mouse.up();
});

Then('the phase-two ceremony plays', async ({ page }) => {
  await expect.poll(async () => (await current(page)).phaseTwo !== null).toBe(true);
  expect((await two(page)).handlesVisible).toBe(false);
});

Then('FOX is still locked', async ({ page }) => {
  expect((await current(page)).layout.rows[0].locked).toBe(true);
});

// Step 3

When('the player tries to slide OWL', async ({ page, scenario }) => {
  await ready(page, scenario);
  scenario.twoBefore = await two(page);
  await dragSlowlyAndRelease(page, 'OWL', 0, -1);
  await page.mouse.up();
  await page.waitForTimeout(400);
});

Then('a hand animates from the X of FOX to the column', async ({ page, scenario }) => {
  const view = await two(page);
  const x = await pointOnWord(page, 'FOX', 2);
  const path = await handPath(page, scenario);
  expect(visits(path, x, 20)).toBe(true);
  expect(visits(path, { x: view.column.x + view.column.width / 2, y: x.y }, 20)).toBe(true);
});

When('the player slides FOX until its X is in the column', async ({ page }) => {
  await dragSlowlyAndRelease(page, 'FOX', 0, -2);
});

When('the player slides FOX and releases it with its O in the column', async ({ page }) => {
  await dragSlowlyAndRelease(page, 'FOX', 0, -1);
});

Then('the O stays in the column', async ({ page }) => {
  const view = await two(page);
  const fox = view.rows.find((row) => row.word === 'FOX')!;
  expect(fox.columnCell).toBe(1);
  expect(fox.x).toBeCloseTo(restingX(view, 1, await pitchOf(page)));
});

Then('the hand carries on', async ({ page, scenario }) => {
  expect((await handPath(page, scenario)).length).toBeGreaterThan(10);
});

// The win

Then('the text and the hand disappear', async ({ page, scenario }) => {
  await expect.poll(async () => (await tutorialText(page)).length).toBe(0);
  expect(await handPath(page, scenario, 800)).toEqual([]);
});

Then('the celebration plays as usual', async ({ page }) => {
  await expect.poll(async () => (await two(page)).won).toBe(true);
  await waitForPopup(page);
});

Then("the popup's button says {string}", async ({ page }, text: string) => {
  expect((await popupParts(page)).map((object) => object.text)).toContain(text);
});

// Text and hands follow the current step

When('the player finishes step 1', async ({ page, scenario }) => {
  await openLevel(page, scenario);
  await lockRow(page, 0, 'FOX');
  await page.waitForTimeout(400);
});

Then("step 1's text is gone", async ({ page }) => {
  expect(await tutorialText(page)).not.toContain(STEP_TEXT[1]);
});

Then("step 2's text shows", async ({ page }) => {
  expect(await tutorialText(page)).toContain(STEP_TEXT[2]);
});

Given(/^step (\d) is showing$/, async ({ page, scenario }, step: string) => {
  await openLevel(page, scenario);
  if (Number(step) >= 2) await lockRow(page, 0, 'FOX');
  if (Number(step) >= 3) await ready(page, scenario);
  await expect.poll(() => tutorialText(page)).toContain(STEP_TEXT[step]);
});

Then('the text is above the rows and below the theme', async ({ page }) => {
  const view: GameView = await current(page);
  const theme = view.layout.topItems.find((item) => item.name === 'theme')!;
  const text = (await screen(page)).find((object) => object.kind === 'text' && object.depth === TEXT_DEPTH)!;
  const rowsTop = view.phaseTwo ? view.phaseTwo.column.y : view.layout.rows[0].cells[0].y;
  expect(text.y - text.height / 2).toBeGreaterThanOrEqual(theme.y + theme.height);
  expect(text.y + text.height / 2).toBeLessThanOrEqual(rowsTop);
});

Then('the text fits on the screen', async ({ page }) => {
  const { layout } = await current(page);
  const text = (await screen(page)).find((object) => object.kind === 'text' && object.depth === TEXT_DEPTH)!;
  expect(text.x - text.width / 2).toBeGreaterThanOrEqual(0);
  expect(text.x + text.width / 2).toBeLessThanOrEqual(layout.width);
});

When('the player waits', async ({ page, scenario }) => {
  await handPath(page, scenario, 4000);
});

Then('the hand animates again after a short pause', async ({ scenario }) => {
  const path = scenario.handPath!;
  // The hand goes back to its start at least twice, with a pause in between.
  const start = path[0];
  const returns = path.filter((point, index) => index > 0 && Math.hypot(point.x - start.x, point.y - start.y) < 3 && Math.hypot(path[index - 1].x - start.x, path[index - 1].y - start.y) >= 3);
  expect(returns.length).toBeGreaterThanOrEqual(1);
});

When('the player starts dragging the X', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  await hold(page, centreOf(poolTile(layout, 'X')), { x: centreOf(poolTile(layout, 'X')).x - 60, y: centreOf(poolTile(layout, 'X')).y - 60 });
});

Then('the hand stops', async ({ page, scenario }) => {
  expect(await handPath(page, scenario, 1500)).toEqual([]);
  await page.mouse.up();
});

// Recall All and keys

When(/^the player presses (X|W|M|Z|Backspace)$/, async ({ page, scenario }, key: string) => {
  await openLevel(page, scenario);
  scenario.acted = true;
  scenario.before = await current(page);
  await page.keyboard.press(key.length === 1 ? key.toLowerCase() : key);
  await page.waitForTimeout(300);
});

// Level 2's theme tip

async function openAfterTutorial(page: Page, scenario: Scenario, level: number) {
  await openGame(page, scenario);
  await page.evaluate(({ key, text }) => localStorage.setItem(key, text), { key: SAVE_KEY, text: writeProgress({ level, points: 1, inLevel: null }) });
  scenario.views = [];
  await openGame(page, scenario);
}

Given('the tip is showing', async ({ page, scenario }) => {
  await openAfterTutorial(page, scenario, 2);
  await expect.poll(() => tutorialText(page)).toContain('All words in a level relate to a theme.');
});

async function themeGlow(page: Page) {
  const { layout, colours } = await current(page);
  const theme = layout.topItems.find((item) => item.name === 'theme')!;
  const { x, y } = centreOf(theme);
  return (await screen(page)).find((object) => object.kind === 'rect' && object.stroke === colours.highlight && Math.abs(object.x - x) < 3 && Math.abs(object.y - y) < 3 && object.width >= theme.width);
}

Then(/^the theme is (?:still )?highlighted$/, async ({ page }) => {
  expect(await themeGlow(page)).toBeDefined();
  // It gently pulses: its brightness changes over time.
  const alphas = new Set<number>();
  for (let look = 0; look < 8; look++) {
    alphas.add(Math.round(((await themeGlow(page))?.alpha ?? 0) * 20));
    await page.waitForTimeout(120);
  }
  expect(alphas.size).toBeGreaterThan(1);
});

Then(/^the theme (?:is no longer|isn't) highlighted$/, async ({ page }) => {
  await expect.poll(() => themeGlow(page)).toBeUndefined();
});

Then('the tip is still showing', async ({ page }) => {
  expect(await tutorialText(page)).toContain('All words in a level relate to a theme.');
});

Then(/^(?:the tip is gone|there's no tip)$/, async ({ page }) => {
  await expect.poll(() => tutorialText(page)).toEqual([]);
});

Then(/^every (?:normal|phase-one) action is allowed$/, async ({ page }) => {
  const { layout } = await current(page);
  // Recall All shows, a tapped letter goes in, and a letter key types.
  const { x, y } = centreOf(layout.recall);
  expect((await screen(page)).some((object) => Math.abs(object.x - x) < 3 && Math.abs(object.y - y) < 3)).toBe(true);
  const letter = layout.poolTiles.find((tile) => tile.count > 0)!;
  await page.mouse.click(centreOf(letter).x, centreOf(letter).y);
  await page.waitForTimeout(300);
  expect((await current(page)).layout.rows.flatMap((row) => row.cells).some((cell) => cell.cell.kind === 'placed')).toBe(true);
});

When('the player places a letter', async ({ page }) => {
  const { layout } = await current(page);
  const letter = layout.poolTiles.find((tile) => tile.count > 0)!;
  await placeLetter(0, 0, letter.character)(page);
});

When("the player's first word locks", async ({ page }) => {
  const { layout } = await current(page);
  await lockRow(page, 0, layout.rows[0].word);
  await page.waitForTimeout(400);
});

