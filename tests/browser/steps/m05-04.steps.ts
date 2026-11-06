import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import type { Level } from '../../../src/game/level';
import { DEFAULT_WORDS, makeLevel } from '../../support/levels';
import { reorderingNotTaught, test, type Scenario } from './fixtures';
import { arrange, dragHandle, dragSlowlyAndRelease, fillRow, pitchOf, ready, two, waitForPopup } from './phase-two.steps';
import { handPath, tutorialText, visits } from './m05-03.steps';
import { current } from './m02-02.steps';

const { Given, When, Then } = createBdd(test);

// In length order (D5), LEMUR, ZEBRA, KANGAROO spell EEN by sliding alone.
const slidesOnly = (): Level => makeLevel(DEFAULT_WORDS, 'EEN');
// Only ZEBRA's E and LEMUR's L work, so ZEBRA must sit above LEMUR. Locked that way round (D8), the rows spell ELK by sliding.
const needsReordering = (): Level => makeLevel(DEFAULT_WORDS, 'ELK');


/** The levels slide only, need reordering, then slide only: the 2nd is the reordering tutorial. */
async function onLevel(page: Page, scenario: Scenario, levelNumber: number) {
  await reorderingNotTaught(page);
  scenario.levelList = [slidesOnly(), needsReordering(), slidesOnly()];
  scenario.level = scenario.levelList[levelNumber - 1];
  scenario.levelNumber = levelNumber;
  scenario.finalWordGiven = true;
}

Given('a level before the first level that needs reordering', async ({ page, scenario }) => {
  await onLevel(page, scenario, 1);
});

Given('a level before the first level that needs reordering, in phase two', async ({ page, scenario }) => {
  await onLevel(page, scenario, 1);
  await ready(page, scenario);
});

Given('the first level that needs reordering', async ({ page, scenario }) => {
  await onLevel(page, scenario, 2);
});

// Saved with the player's progress, as the game saves it once the tutorial's move is made (Q12).
Given('the player has been taught reordering', async ({ page }) => {
  await reorderingNotTaught(page);
  await page.addInitScript(() => localStorage.setItem('wordSlide.progress', JSON.stringify({ level: 1, points: 0, inLevel: null, reorderingTaught: true })));
});

Given("a level that doesn't need reordering", async ({ page, scenario }) => {
  await onLevel(page, scenario, 3);
});

Then(/^(?:no row has a handle|there are no handles)$/, async ({ page }) => {
  const view = await two(page);
  expect(view.ceremonyDone).toBe(true);
  expect(view.handlesVisible).toBe(false);
});

Then('every row has its handle', async ({ page }) => {
  const view = await two(page);
  expect(view.handlesVisible).toBe(true);
  expect(view.handles).toHaveLength(view.rows.length);
});

// The ceremony and the designed order

Given('FOX and OWL are locked as FOX, OWL', async ({ scenario }) => {
  scenario.setup.push(async (page) => {
    expect((await current(page)).layout.rows.map((row) => row.word)).toEqual(['FOX', 'OWL']);
  });
});

Given('a level before the first level that needs reordering, with two same-length answers', async ({ page, scenario }) => {
  await onLevel(page, scenario, 1);
});

Given('a level with two same-length answers', async ({ page, scenario }) => {
  await onLevel(page, scenario, 3);
});

// LEMUR and ZEBRA have the same length. In length order, they spell EEN with KANGAROO.
Given('they are locked in the designed order', async ({ scenario }) => {
  scenario.setup.push(fillRow(0, 'LEMUR'), fillRow(1, 'ZEBRA'));
});

Given('they are locked in the other order from the designed one', async ({ scenario }) => {
  scenario.setup.push(fillRow(0, 'ZEBRA'), fillRow(1, 'LEMUR'));
});

Then("the rows haven't changed order", async ({ page }) => {
  expect((await two(page)).rows.map((row) => row.word)).toEqual(['LEMUR', 'ZEBRA', 'KANGAROO']);
});

Then('the rows are in the order they were locked', async ({ page }) => {
  expect((await two(page)).rows.map((row) => row.word)).toEqual(['ZEBRA', 'LEMUR', 'KANGAROO']);
});

Then('the rows move into place at the same time and speed as the words left-align', async ({ scenario }) => {
  const frames = scenario.frames!.filter((frame) => frame.two !== null);
  const at = (frame: (typeof frames)[number], word: string) => frame.two!.rows.find((row) => row.word === word)!;
  const first = frames[0];
  const last = frames[frames.length - 1];
  // OWL starts below FOX, where it was in phase one, and ends above it.
  expect(at(first, 'OWL').y).toBeGreaterThan(at(first, 'FOX').y);
  expect(at(last, 'OWL').y).toBeLessThan(at(last, 'FOX').y);
  // Its vertical and sideways moves start and stop together, within a tenth of the ceremony (frames are sampled, and the easing ends slowly).
  const changes = (value: (frame: (typeof frames)[number]) => number) => {
    const times = frames.slice(1).filter((frame, index) => Math.abs(value(frame) - value(frames[index])) > 0.01).map((frame) => frame.t);
    return { start: times[0], end: times[times.length - 1] };
  };
  const y = changes((frame) => at(frame, 'OWL').y);
  const x = changes((frame) => at(frame, 'OWL').x);
  const tenth = (last.t - first.t) / 10;
  expect(Math.abs(y.start - x.start)).toBeLessThan(tenth);
  expect(Math.abs(y.end - x.end)).toBeLessThan(tenth);
});

Then('the rows are OWL, FOX', async ({ page }) => {
  expect((await two(page)).rows.map((row) => row.word)).toEqual(['OWL', 'FOX']);
});

// The reordering tutorial

// D5 puts CAT above DOG, but only DOG has an O: CAT must move down, and DOG slide to its O.
const twoRows = (): Level => makeLevel(['CAT', 'DOG'], 'OC');
// D5 gives CAT, DOG, OWL. Only OWL has a W, DOG a D and CAT a C: CAT goes to the bottom, then OWL above DOG.
const threeRows = (): Level => makeLevel(['CAT', 'DOG', 'OWL'], 'WDC');

async function asTutorial(page: Page, scenario: Scenario, level: Level) {
  await reorderingNotTaught(page);
  scenario.levelList = [level, slidesOnly()];
  scenario.level = level;
  scenario.levelNumber = 1;
  scenario.finalWordGiven = true;
}

Given('the first level that needs reordering is a 2-row test level, whose solution needs its top row moved down', async ({ page, scenario }) => {
  await asTutorial(page, scenario, twoRows());
});

Given(
  'the first level that needs reordering is a 3-row test level, whose solution needs the top row moved to the bottom and then the new top two rows swapped',
  async ({ page, scenario }) => {
    await asTutorial(page, scenario, threeRows());
  },
);

Given("the reordering tutorial's ceremony has ended", async ({ page, scenario }) => {
  await asTutorial(page, scenario, twoRows());
  await ready(page, scenario);
});

Then("there's no tutorial text and no hand", async ({ page, scenario }) => {
  expect(await tutorialText(page)).toEqual([]);
  expect(await handPath(page, scenario, 800)).toEqual([]);
});

/** The hand goes from the top row's handle to the given number of slots below it. */
async function expectHandFromTopHandle(page: Page, scenario: Scenario, slots: number) {
  const view = await two(page);
  const handle = view.handles[0];
  const start = { x: handle.x + handle.width / 2, y: handle.y + handle.height / 2 };
  const path = await handPath(page, scenario);
  const pitch = await pitchOf(page);
  expect(visits(path, start, handle.width * 0.6)).toBe(true);
  expect(visits(path, { x: start.x, y: start.y + slots * pitch }, handle.width * 0.6)).toBe(true);
}

Then(/^(?:a hand starts on the top row's handle and shows|the hand shows) the row being dragged down$/, async ({ page, scenario }) => {
  await expectHandFromTopHandle(page, scenario, 1);
});

Then("a hand starts on the top row's handle and shows it being dragged to the bottom", async ({ page, scenario }) => {
  await expectHandFromTopHandle(page, scenario, 2);
});

When(/^the player tries to (drag the bottom row's handle|slide the top word|slide the bottom word)$/, async ({ page, scenario }, action: string) => {
  await ready(page, scenario);
  scenario.twoBefore = await two(page);
  const rows = scenario.twoBefore.rows.map((row) => row.word);
  if (action.includes('handle')) await dragHandle(page, rows[rows.length - 1], -1);
  else await dragSlowlyAndRelease(page, action.includes('top') ? rows[0] : rows[rows.length - 1], 0, -1);
  await page.mouse.up();
  await page.waitForTimeout(400);
});

async function moveTopRowDown(page: Page, slots: number) {
  await dragHandle(page, (await two(page)).rows[0].word, slots);
  await page.mouse.up();
  await page.waitForTimeout(400);
}

When("the player drags the top row's handle down", async ({ page, scenario }) => {
  await ready(page, scenario);
  scenario.twoBefore = await two(page);
  await moveTopRowDown(page, 1);
});

Then('the rows have swapped', async ({ page, scenario }) => {
  expect((await two(page)).rows.map((row) => row.word)).toEqual(scenario.twoBefore!.rows.map((row) => row.word).reverse());
});

// In both test levels, the shown move takes the top row to the bottom.
// On a level needing several moves, the tutorial then shows the next one (M07-03, R13), so this waits for the move.
Given('the player has made the shown move', async ({ page, scenario }) => {
  await ready(page, scenario);
  const rows = (await two(page)).rows;
  await moveTopRowDown(page, rows.length - 1);
  await expect.poll(async () => (await two(page)).rows[rows.length - 1].word).toBe(rows[0].word);
  if (rows.length === 2) await expect.poll(async () => (await tutorialText(page)).length).toBe(0);
});

// The bottom word, so the column doesn't spell the final word and win.
When('the player slides a word', async ({ page, scenario }) => {
  scenario.twoBefore = await two(page);
  await dragSlowlyAndRelease(page, scenario.twoBefore.rows[1].word, 0, -1);
  await page.waitForTimeout(400);
});

Then('the word slides', async ({ page, scenario }) => {
  expect((await two(page)).rows[1].columnCell).not.toBe(scenario.twoBefore!.rows[1].columnCell);
});


When('the player swaps the top two rows', async ({ page }) => {
  await dragHandle(page, (await two(page)).rows[1].word, -1);
  await page.mouse.up();
  await page.waitForTimeout(400);
});

Then("the rows are in the solution's order", async ({ page }) => {
  expect((await two(page)).rows.map((row) => row.word)).toEqual(['OWL', 'DOG', 'CAT']);
});

// M04-01: the fixtures already play as if the reordering tutorial were behind the player. This says so.
Given('the reordering tutorial has been shown', async ({ page }) => {
  await page.addInitScript(() => Object.assign(window, { wordSlideReorderingTaught: true }));
});

// The tutorial waits (Q12)

Given('its same-length words are locked so that the rows spell the final word by sliding', async ({ scenario }) => {
  scenario.setup.push(fillRow(0, 'ZEBRA'), fillRow(1, 'LEMUR'));
});

/** Wins the level on screen, presses the popup's button, and gets the next level past its ceremony. */
async function winAndGoOn(page: Page, scenario: Scenario, order: string[], cells: Record<string, number>) {
  await arrange(page, order, cells);
  // As M04-04 does: select the top word, then nudge it away and back, so it settles on the winning column.
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(150);
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(50);
  await page.keyboard.press('ArrowRight');
  await waitForPopup(page);
  const levelNumber = async () => ((await current(page)) as unknown as { levelNumber: number }).levelNumber;
  const level = await levelNumber();
  await page.keyboard.press('Enter');
  await expect.poll(levelNumber).toBe(level + 1);
  await page.waitForTimeout(600);
  await ready(page, scenario);
}

Given('the player locked the first level that needs reordering so that no move was needed', async ({ page, scenario }) => {
  await reorderingNotTaught(page);
  scenario.levelList = [slidesOnly(), needsReordering(), twoRows(), slidesOnly()];
  scenario.level = scenario.levelList[1];
  scenario.levelNumber = 2;
  scenario.finalWordGiven = true;
  scenario.setup.push(fillRow(0, 'ZEBRA'), fillRow(1, 'LEMUR'));
  await ready(page, scenario);
  expect(await tutorialText(page)).toEqual([]);
});

When('the player wins it and the next level, which needs reordering, reaches phase two', async ({ page, scenario }) => {
  await winAndGoOn(page, scenario, ['ZEBRA', 'LEMUR', 'KANGAROO'], { ZEBRA: 1, LEMUR: 0, KANGAROO: 0 });
});

// After the move, DOG is above CAT: DOG's O and CAT's C spell OC.
When('the player wins the level and the next level reaches phase two', async ({ page, scenario }) => {
  await winAndGoOn(page, scenario, ['DOG', 'CAT'], { DOG: 1, CAT: 0 });
});
