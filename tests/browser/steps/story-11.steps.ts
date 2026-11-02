import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { rowOrder } from '../../../src/game/level';
import { SAVE_KEY, writeProgress } from '../../../src/game/progress';
import { DEFAULT_WORDS, makeLevel } from '../../support/levels';
import { test, type GameView, type Scenario } from './fixtures';
import { installProbe, screen, startRecording, stopRecording, type Drawn, type Frame } from './probe';
import { columnGraphics, openLevel, pitchOf, popupParts, ready, restingX, solve, two, waitForPopup, win } from './phase-two.steps';
import { watchErrors } from './foundation.steps';
import { current, useLevelList, useLevels } from './story-02.steps';

const { Given, When, Then } = createBdd(test);

type View = GameView & { levelNumber: number };

/** The level every story 11 scenario plays, unless it says otherwise: ELK wins it. */
function prepareLevel(scenario: Scenario) {
  if (!scenario.finalWordGiven) scenario.level.finalWord = 'ELK';
}

/** Loads the game as a player would: from saved progress, not from a test hook. */
export async function openGame(page: Page, scenario: Scenario, address = '/') {
  prepareLevel(scenario);
  if (!scenario.levelsGiven) {
    if (scenario.levelList) await useLevelList(page, scenario.levelList);
    else await useLevels(page, scenario.level, scenario.levelCount);
    scenario.levelsGiven = true;
  }
  await page.goto(address);
  await waitUntilOpen(page, scenario);
}

async function waitUntilOpen(page: Page, scenario: Scenario) {
  await page.waitForFunction(() => (window as unknown as { wordSlideReady?: boolean }).wordSlideReady === true);
  await installProbe(page);
  scenario.views.push(await current(page));
}

async function view(page: Page): Promise<View> {
  return (await current(page)) as View;
}

async function savedPoints(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null')?.points ?? null, SAVE_KEY);
}

async function pressPopupButton(page: Page) {
  const button = (await popupParts(page)).find((object) => object.text?.startsWith('Play Level'))!;
  await page.mouse.click(button.x, button.y);
}

/** Every top-of-screen item, and the keys a player might try. */
async function tryEveryWayOut(page: Page) {
  const { layout } = await view(page);
  for (const item of layout.topItems) await page.mouse.click(item.x + item.width / 2, item.y + item.height / 2);
  for (const key of ['Escape', 'Home', 'PageDown', 'Tab']) await page.keyboard.press(key);
}

async function wonLevel(page: Page, scenario: Scenario, level: number) {
  scenario.levelNumber = level;
  await win(page, scenario);
  await waitForPopup(page);
}

function placedCells(layout: GameView['layout']) {
  return layout.rows.flatMap((row, rowIndex) =>
    row.cells.flatMap((cell, cellIndex) => (cell.cell.kind === 'placed' ? [{ row: rowIndex, cell: cellIndex, character: cell.cell.character }] : [])),
  );
}

function poolCounts(layout: GameView['layout']) {
  return layout.poolTiles.map((tile) => `${tile.character}x${tile.count}`);
}

function pointsText(frame: Frame) {
  return frame.screen.find((object: Drawn) => object.kind === 'text' && object.text?.startsWith('Points'));
}

// Levels and points

Given(/^the player is on level (\d+)$/, async ({ scenario }, level: string) => {
  scenario.levelNumber = Number(level);
});

Given('the player is on the last level', async ({ scenario }) => {
  scenario.levelCount = 3;
  scenario.levelNumber = 3;
});

// Given and Then share this text: before the game opens it sets the points, after that it checks the saved total.
Given(/^the player has (\d+) points? in total$/, async ({ page, scenario }, points: string) => {
  if (scenario.views.length === 0) scenario.points = Number(points);
  else await expect.poll(() => savedPoints(page)).toBe(Number(points));
});

Given('a level that starts phase two already solved', async ({ scenario }) => {
  scenario.level = makeLevel(DEFAULT_WORDS);
  scenario.level.finalWord = rowOrder(scenario.level.answers).map((answer) => answer.word[0]).join('');
  scenario.finalWordGiven = true;
});

When(/^the player wins (?:the level|a level|level (\d+))$/, async ({ page, scenario }, level?: string) => {
  if (level) scenario.levelNumber = Number(level);
  if (scenario.views.length === 0) await openLevel(page, scenario);
  await startRecording(page);
  await win(page, scenario);
});

Then("there's no way to reach level 6", async ({ page, scenario }) => {
  await openLevel(page, scenario);
  await tryEveryWayOut(page);
  expect((await view(page)).levelNumber).toBe(5);
  expect((await view(page)).phaseTwo).toBeNull();
});

Given(/^the player has won level (\d+)$/, async ({ page, scenario, $uri }, level: string) => {
  if ($uri.includes('story-12')) {
    scenario.wonTutorial = true;
    return;
  }
  await wonLevel(page, scenario, Number(level));
});

Given('the player has won the last level', async ({ page, scenario }) => {
  scenario.levelCount = 3;
  await wonLevel(page, scenario, 3);
});

Then("there's no way to open level 4", async ({ page }) => {
  await tryEveryWayOut(page);
  await pressPopupButton(page);
  await expect.poll(async () => (await view(page)).levelNumber).toBe(5);
  await page.reload();
  await page.waitForFunction(() => (window as unknown as { wordSlideReady?: boolean }).wordSlideReady === true);
  expect((await view(page)).levelNumber).toBe(5);
});

// The next level

When('the player presses "Play Level 5"', async ({ page, scenario }) => {
  if (scenario.views.length === 0) await wonLevel(page, scenario, 4);
  await page.evaluate(() => {
    const camera = (window as unknown as { wordSlide: { scene: { cameras: { main: { fadeEffect: { alpha: number; isRunning: boolean } } } } } }).wordSlide.scene.cameras.main;
    const samples: { t: number; alpha: number; running: boolean }[] = [];
    const start = performance.now();
    const tick = () => {
      samples.push({ t: performance.now() - start, alpha: camera.fadeEffect.alpha, running: camera.fadeEffect.isRunning });
      if (performance.now() - start < 1200) requestAnimationFrame(tick);
    };
    tick();
    Object.assign(window, { fadeSamples: samples });
  });
  await pressPopupButton(page);
  await page.waitForTimeout(1300);
  scenario.fadeSamples = await page.evaluate(() => (window as unknown as { fadeSamples: { t: number; alpha: number; running: boolean }[] }).fadeSamples);
});

Then(/^level (\d+) opens in phase one$/, async ({ page }, level: string) => {
  await expect.poll(async () => (await view(page)).levelNumber).toBe(Number(level));
  expect((await view(page)).phaseTwo).toBeNull();
  expect(await popupParts(page)).toEqual([]);
});

Then('no letters are placed', async ({ page }) => {
  const { layout } = await view(page);
  expect(placedCells(layout)).toEqual([]);
  expect(layout.rows.every((row) => !row.locked)).toBe(true);
});

Then(/^level 5 appears with a fade of about 0\.3 seconds$/, async ({ page, scenario }) => {
  expect((await view(page)).levelNumber).toBe(5);
  const running = scenario.fadeSamples!.filter((sample) => sample.running);
  expect(running.length).toBeGreaterThan(3);
  expect(running[0].alpha).toBeGreaterThan(0.8);
  const length = running[running.length - 1].t - running[0].t;
  expect(length).toBeGreaterThan(220);
  expect(length).toBeLessThan(420);
  const after = scenario.fadeSamples!.filter((sample) => sample.t > running[running.length - 1].t);
  expect(after.every((sample) => sample.alpha === 0 || !sample.running)).toBe(true);
});

// In story 12, this opens the level after the tutorial, as a player who has won level 1 would.
Then(/^level (\d+) opens$/, async ({ page, scenario, $uri }, level: string) => {
  if ($uri.includes('story-12') && scenario.views.length === 0) {
    await openGame(page, scenario);
    await page.evaluate(({ key, text }) => localStorage.setItem(key, text), { key: SAVE_KEY, text: writeProgress({ level: Number(level), points: Number(level) - 1, inLevel: null }) });
    scenario.views = [];
    await openGame(page, scenario);
  }
  expect((await view(page)).levelNumber).toBe(Number(level));
  expect((await view(page)).phaseTwo).toBeNull();
});

Then('level 2 opens as usual', async ({ page }) => {
  await waitForPopup(page);
  await pressPopupButton(page);
  await expect.poll(async () => (await view(page)).levelNumber).toBe(2);
  expect((await view(page)).phaseTwo).toBeNull();
});

// Opening and closing

Given('the game has never been played on this device', async ({ page }) => {
  expect(await page.context().storageState()).toMatchObject({ origins: [] });
});

When(/^the game opens(?: again)?$/, async ({ page, scenario }) => {
  watchErrors(page);
  await openGame(page, scenario);
});

When('the game closes before the popup appears', async ({ page }) => {
  expect((await two(page)).popup).toBeNull();
  await page.goto('about:blank');
});

Given(/^level (\d+) reached and (\d+) points saved$/, async ({ page, scenario }, level: string, points: string) => {
  await openGame(page, scenario);
  await page.evaluate(({ key, text }) => localStorage.setItem(key, text), { key: SAVE_KEY, text: writeProgress({ level: Number(level), points: Number(points), inLevel: null }) });
  scenario.views = [];
});

When('the page reloads', async ({ page, scenario }) => {
  await page.reload();
  await waitUntilOpen(page, scenario);
});

Given('saving is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Saving is blocked', 'SecurityError');
    };
  });
});

Given('the player has reached level 2', async ({ page, scenario }) => {
  await wonLevel(page, scenario, 1);
  await pressPopupButton(page);
  await expect.poll(async () => (await view(page)).levelNumber).toBe(2);
});

When(/^the game closes and opens again$/, async ({ page, scenario }) => {
  if (scenario.views.length === 0) await openLevel(page, scenario);
  scenario.before = await current(page);
  await page.reload();
  await waitUntilOpen(page, scenario);
  scenario.reopened = true;
});

// Progress within a level

Given('LEMUR is locked', async ({ scenario }) => {
  scenario.setup.push(async (page) => {
    const before = placedCells((await current(page)).layout);
    await page.evaluate(() => {
      const game = (window as unknown as { wordSlide: { view: () => GameView; place: (row: number, cell: number, character: string) => void } }).wordSlide;
      const row = game.view().layout.rows.findIndex((candidate) => candidate.word === 'LEMUR');
      [...'LEMUR'].forEach((character, cell) => game.place(row, cell, character));
    });
    // Locking LEMUR can push a letter placed in its row back to the pool. Put it in another row, so both hold.
    const { layout } = await current(page);
    for (const letter of before) {
      if (placedCells(layout).some((placed) => placed.character === letter.character)) continue;
      const row = layout.rows.findIndex((candidate) => candidate.word === 'ZEBRA');
      await page.evaluate(({ row, character }) => (window as unknown as { wordSlide: { place: (row: number, cell: number, character: string) => void } }).wordSlide.place(row, 0, character), { row, character: letter.character });
    }
    const after = (await current(page)).layout;
    expect(after.rows.find((candidate) => candidate.word === 'LEMUR')!.locked).toBe(true);
    expect(placedCells(after).filter((placed) => !after.rows[placed.row].locked).length).toBe(before.length);
  });
});

Then('the Z is in the same cell', async ({ page, scenario }) => {
  const was = placedCells(scenario.before!.layout).find((placed) => placed.character === 'Z' && !scenario.before!.layout.rows[placed.row].locked)!;
  const { layout } = await view(page);
  expect(layout.rows[was.row].cells[was.cell].cell).toEqual({ kind: 'placed', character: 'Z' });
});

Then('LEMUR is still locked', async ({ page }) => {
  const { layout } = await view(page);
  expect(layout.rows.find((row) => row.word === 'LEMUR')!.locked).toBe(true);
});

Then('the pool counts are the same', async ({ page, scenario }) => {
  expect(poolCounts((await view(page)).layout)).toEqual(poolCounts(scenario.before!.layout));
});

Given(/^the player has built (\S+) in row (\d+)$/, async ({ scenario }, word: string, row: string) => {
  scenario.setup.push(async (page) => {
    await page.evaluate(
      ({ word, row }) => {
        const game = (window as unknown as { wordSlide: { place: (row: number, cell: number, character: string) => void } }).wordSlide;
        [...word].forEach((character, cell) => game.place(row, cell, character));
      },
      { word, row: Number(row) - 1 },
    );
    expect((await current(page)).layout.rows[Number(row) - 1].locked).toBe(true);
  });
});

Then(/^row (\d+) reads (.+)$/, async ({ page }, row: string, text: string) => {
  const { layout } = await view(page);
  const cells = layout.rows[Number(row) - 1].cells.map((cell) => (cell.cell.kind === 'empty' ? '_' : cell.cell.character));
  expect(cells.join(' ')).toBe(text);
});

Then(/^the pool holds (.+)$/, async ({ page }, list: string) => {
  const { layout } = await view(page);
  const letters = layout.poolTiles.flatMap((tile) => Array.from({ length: tile.count }, () => tile.character));
  // "Holds" is about which letters, not their order: the pool keeps its own order.
  expect([...letters].sort()).toEqual(list.split(', ').sort());
});

Given('phase two has started', async ({ page, scenario }) => {
  await ready(page, scenario);
});

// Given and Then share this text: first it slides and moves KANGAROO by keyboard, after reopening it checks.
Given('KANGAROO has its N in the column, in the top row', async ({ page, scenario }) => {
  if (!scenario.reopened) {
    const slot = (await two(page)).rows.findIndex((row) => row.word === 'KANGAROO');
    await page.evaluate((row) => (window as unknown as { wordSlide: { select: (row: number) => void } }).wordSlide.select(row), slot);
    for (let step = 0; step < slot; step++) {
      await page.keyboard.press('Shift+ArrowUp');
      await page.waitForTimeout(250);
    }
    for (let step = 0; step < 2; step++) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(250);
    }
  }
  const now = await two(page);
  expect(now.rows[0].word).toBe('KANGAROO');
  expect(now.rows[0].columnCell).toBe(2);
  expect(now.rows[0].x).toBeCloseTo(restingX(now, 2, await pitchOf(page)));
});

Then('the game is in phase two', async ({ page }) => {
  expect((await view(page)).phaseTwo).not.toBeNull();
});

Then('the column and handles are showing', async ({ page }) => {
  expect((await two(page)).handlesVisible).toBe(true);
  expect(columnGraphics(await screen(page))?.alpha).toBe(1);
});

Given('the player is dragging a Z from the pool', async ({ page, scenario }) => {
  await openLevel(page, scenario);
  const tile = (await current(page)).layout.poolTiles.find((candidate) => candidate.character === 'Z')!;
  await page.mouse.move(tile.x + tile.width / 2, tile.y + tile.height / 2);
  await page.mouse.down();
  await page.mouse.move(tile.x - 40, tile.y - 40, { steps: 4 });
  expect((await current(page)).dragging).toBe('Z');
});

Then('the Z is back in the pool', async ({ page }) => {
  const { layout } = await view(page);
  expect(layout.poolTiles.find((tile) => tile.character === 'Z')!.count).toBe(1);
  expect(placedCells(layout)).toEqual([]);
});

Given('the phase-two ceremony is playing', async ({ page, scenario }) => {
  await solve(page, scenario);
  expect((await two(page)).handlesVisible).toBe(false);
});

Then('the finished phase-two layout appears', async ({ page }) => {
  const now = await two(page);
  expect(now.handlesVisible).toBe(true);
  const pitch = await pitchOf(page);
  now.rows.forEach((row) => expect(row.x).toBeCloseTo(restingX(now, row.columnCell, pitch)));
});

// The last level

When('the popup appears after the win', async ({ page, scenario }) => {
  await win(page, scenario);
  await waitForPopup(page);
});

Then('it has no button', async ({ page }) => {
  expect((await popupParts(page)).some((object) => object.text?.startsWith('Play'))).toBe(false);
  expect((await two(page)).popup?.buttonRect).toBeNull();
});

Then('the popup shows {string}', async ({ page }, text: string) => {
  await expect.poll(async () => (await popupParts(page)).map((object) => object.text)).toContain(text);
});

// The new point

Then(/^the points still show (\d+) until the popup appears$/, async ({ page, scenario }, points: string) => {
  await waitForPopup(page);
  await page.waitForTimeout(700);
  scenario.frames = await stopRecording(page);
  const before = scenario.frames.filter((frame) => frame.two && frame.two.popup === null);
  expect(before.length).toBeGreaterThan(10);
  before.forEach((frame) => expect(pointsText(frame)?.text).toBe(`Points ${points}`));
});

Then(/^the points show (\d+) with a small pulse as it appears$/, async ({ scenario }, points: string) => {
  const from = scenario.frames!.findIndex((frame) => frame.two?.popup);
  const after = scenario.frames!.slice(from);
  expect(pointsText(after[0])?.text).toBe(`Points ${points}`);
  const scales = after.map((frame) => pointsText(frame)!.scale);
  expect(Math.max(...scales.slice(0, 30))).toBeGreaterThan(1.05);
  expect(scales[scales.length - 1]).toBe(1);
});

Then("it doesn't mention points", async ({ page }) => {
  expect((await popupParts(page)).filter((object) => /point/i.test(object.text ?? ''))).toEqual([]);
});

// Development builds

Given('a development build', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => 'wordSlide' in window)).toBe(true);
});

When(/^the designer picks level (\d+)$/, async ({ page, scenario }, level: string) => {
  await openGame(page, scenario, `/?level=${level}`);
});

When('the designer resets progress', async ({ page, scenario }) => {
  await openGame(page, scenario, '/?reset');
  // A reset clears the saved progress, not just this visit: open the plain address again.
  await openGame(page, scenario);
});
