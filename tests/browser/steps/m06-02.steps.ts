import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import type { Level } from '../../../src/game/level';
import { DEFAULT_WORDS, makeLevel } from '../../support/levels';
import { test, type Scenario } from './fixtures';
import { screen, startRecording, stopRecording, type Drawn } from './probe';
import { current } from './m02-02.steps';
import { waitForPopup, win } from './phase-two.steps';

const { Given, When, Then } = createBdd(test);

/** The interstitial is drawn above everything else, the popup included (M06-02, R11). */
const INTERSTITIAL_DEPTH = 40;

/** Test levels, never the prototype's (D46): 10 Animals levels, then Food. */
export function themedLevels(): Level[] {
  const level = (theme: string): Level => ({ ...makeLevel(DEFAULT_WORDS, 'ELK'), theme });
  return [...Array.from({ length: 10 }, () => level('Animals')), level('Food'), level('Food')];
}

const interstitialIn = (objects: Drawn[]) => objects.filter((object) => object.depth >= INTERSTITIAL_DEPTH && object.alpha > 0.01);
const levelNumber = async (page: Page) => ((await current(page)) as unknown as { levelNumber: number }).levelNumber;

async function pressPlay(page: Page) {
  const button = (await screen(page)).find((object) => object.kind === 'text' && object.text?.startsWith('Play Level'))!;
  await page.mouse.click(button.x, button.y);
}

/** Presses the popup's button and records the screen for 3 seconds, long enough for any interstitial. */
export async function pressPlayAndRecord(page: Page, scenario: Scenario) {
  await startRecording(page);
  await pressPlay(page);
  await page.waitForTimeout(3000);
  scenario.frames = await stopRecording(page);
}

When('the next level opens', async ({ page }) => {
  const level = await levelNumber(page);
  await pressPlay(page);
  await expect.poll(() => levelNumber(page)).toBe(level + 1);
  await page.waitForTimeout(2500);
});

Then(/^a full-screen interstitial names the theme (\w+)$/, async ({ page, scenario }, theme: string) => {
  const { width, height } = page.viewportSize()!;
  const shown = scenario.frames!.map((frame) => interstitialIn(frame.screen)).filter((objects) => objects.length > 0);
  expect(shown.length).toBeGreaterThan(0);
  const full = shown.find((objects) => objects.some((object) => object.kind === 'rect' && object.alpha > 0.99))!;
  expect(full, 'The interstitial never covers the screen').toBeDefined();
  const cover = full.find((object) => object.kind === 'rect')!;
  expect(cover.width).toBeGreaterThanOrEqual(width);
  expect(cover.height).toBeGreaterThanOrEqual(height);
  expect(full.some((object) => object.kind === 'text' && object.text === theme)).toBe(true);
});

Then('it fades in and out over about 2 seconds', async ({ scenario }) => {
  const frames = scenario.frames!.map((frame) => ({ t: frame.t, alpha: Math.max(0, ...interstitialIn(frame.screen).filter((object) => object.kind === 'rect').map((object) => object.alpha)) }));
  const visible = frames.filter((frame) => frame.alpha > 0.01);
  const duration = visible[visible.length - 1].t - visible[0].t;
  expect(duration).toBeGreaterThan(1700);
  expect(duration).toBeLessThan(2400);
  // It rises to fully covering, then falls away.
  const peak = visible.findIndex((frame) => frame.alpha > 0.99);
  expect(peak).toBeGreaterThan(0);
  expect(visible[0].alpha).toBeLessThan(0.5);
  expect(visible[visible.length - 1].alpha).toBeLessThan(0.5);
});

Then(/^level (\d+) appears$/, async ({ page, scenario }, number: string) => {
  expect(await levelNumber(page)).toBe(Number(number));
  expect(interstitialIn(await screen(page))).toEqual([]);
  const last = scenario.frames![scenario.frames!.length - 1];
  expect(interstitialIn(last.screen)).toEqual([]);
});

Then('no interstitial appears', async ({ scenario }) => {
  expect(scenario.frames!.filter((frame) => interstitialIn(frame.screen).length > 0)).toEqual([]);
});

/** Gets to the middle of the interstitial: level 10 won, "Play Level 11" pressed, and the screen fully covered. */
async function duringInterstitial(page: Page, scenario: Scenario) {
  scenario.levelList = themedLevels();
  scenario.level = scenario.levelList[9];
  scenario.levelNumber = 10;
  await win(page, scenario);
  await waitForPopup(page);
  await pressPlay(page);
  await expect.poll(async () => interstitialIn(await screen(page)).some((object) => object.kind === 'rect' && object.alpha > 0.99)).toBe(true);
  await expect.poll(() => levelNumber(page)).toBe(11);
}

// Given and When share this text. Keeping the screen as it was lets "nothing changes" compare with it.
Given('the interstitial is showing', async ({ page, scenario }) => {
  await duringInterstitial(page, scenario);
  scenario.before = await current(page);
});

/** "It has no button" is M05-01's step too, which calls this for M06-02. */
export async function expectInterstitialHasNoButton(page: Page) {
  const shown = interstitialIn(await screen(page));
  const texts = shown.filter((object) => object.kind === 'text').map((object) => object.text);
  expect(texts).toEqual(['Food']);
}

When('the player presses a key', async ({ page }) => {
  for (const key of ['Enter', ' ', 'f', 'ArrowDown', 'Backspace']) await page.keyboard.press(key);
  const { width, height } = page.viewportSize()!;
  await page.mouse.click(width / 2, height * 0.8);
  await page.waitForTimeout(300);
});
