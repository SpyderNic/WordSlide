import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import type { Rect, TopItem } from '../../../src/game/layout';
import { DEFAULT_WORDS, makeLevel, tutorialLevel } from '../../support/levels';
import { reorderingNotTaught, test, type Scenario } from './fixtures';
import { centreOf, rowOf } from './phase-one.steps';
import { openLevel, popupParts, two, waitForPopup, win } from './phase-two.steps';
import { installProbe, screen, startRecording, stopRecording, type Drawn, type Frame } from './probe';
import { current } from './story-02.steps';
import { openGame } from './story-11.steps';

const { Given, When, Then } = createBdd(test);

/** What story 20 adds to the game's test view. */
interface CoinsView {
  coins: number;
  /** The ad button, as drawn now: null when it's hidden. */
  adButton: { ready: boolean; text: string } | null;
  levelNumber: number;
}

type Story20 = Scenario & { coinsGiven?: boolean };

/** Development builds read these before the game starts (D52): the economy's settings, ads and the clock. */
async function setEconomy(page: Page, values: Record<string, number>) {
  await page.addInitScript((values) => {
    const target = window as unknown as { wordSlideEconomy?: Record<string, number> };
    target.wordSlideEconomy = { ...target.wordSlideEconomy, ...values };
  }, values);
}

async function setAds(page: Page, values: Record<string, boolean>) {
  await page.addInitScript((values) => {
    const target = window as unknown as { wordSlideAds?: Record<string, boolean> };
    target.wordSlideAds = { ...target.wordSlideAds, ...values };
  }, values);
}

/** A clock the tests move by hand, so a countdown reads exactly (development builds only). */
async function useTestClock(page: Page) {
  await page.addInitScript(() => Object.assign(window, { wordSlideTime: 0 }));
}

async function coinsView(page: Page): Promise<CoinsView> {
  return (await current(page)) as unknown as CoinsView;
}

async function adLog(page: Page): Promise<string[]> {
  return page.evaluate(() => [...((window as unknown as { wordSlideAdLog?: string[] }).wordSlideAdLog ?? [])]);
}

function item(items: TopItem[], name: string): TopItem {
  const found = items.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`No ${name} in the top bar`);
  return found;
}

function inside(rect: Rect, object: { x: number; y: number }) {
  return object.x >= rect.x && object.x <= rect.x + rect.width && object.y >= rect.y && object.y <= rect.y + rect.height;
}

/** Icons are drawn from lines: the house and cog as outlines, the coin as an octagon, the video as a frame with a play triangle. */
function graphicsIn(objects: Drawn[], rect: Rect) {
  return objects.filter((object) => object.kind === 'graphics' && object.lines.length > 0 && object.lines.every((line) => inside(rect, { x: line.x1, y: line.y1 })));
}

function textsIn(objects: Drawn[], rect: Rect) {
  return objects.filter((object) => object.kind === 'text' && inside(rect, object)).map((object) => object.text);
}

async function topItems(page: Page) {
  return (await current(page)).layout.topItems;
}

/** Opens the level once, as the other stories do. */
async function opened(page: Page, scenario: Story20) {
  await openLevel(page, scenario);
}

async function adButtonRect(page: Page) {
  return item(await topItems(page), 'ad');
}

async function pressAdButton(page: Page, scenario: Story20) {
  await opened(page, scenario);
  scenario.before = await current(page);
  const button = await adButtonRect(page);
  await page.mouse.click(button.x + button.width / 2, button.y + button.height / 2);
  await page.waitForTimeout(150);
}

const pretendAd = (page: Page) => page.locator('#pretend-ad');

async function finishAd(page: Page, scenario: Story20) {
  await expect(pretendAd(page)).toBeVisible();
  await startRecording(page);
  await pretendAd(page).getByRole('button', { name: 'Finish' }).click();
  await page.waitForTimeout(1500);
  scenario.frames = await stopRecording(page);
}

async function closeAd(page: Page) {
  await expect(pretendAd(page)).toBeVisible();
  await pretendAd(page).getByRole('button', { name: 'Close' }).click();
  await page.waitForTimeout(300);
}

// Settings (D52)

Given(/^the ad reward is (\d+)$/, async ({ page }, value: string) => {
  await setEconomy(page, { adReward: Number(value) });
});

Given(/^the starting coins are (\d+)$/, async ({ page }, value: string) => {
  await setEconomy(page, { startingCoins: Number(value) });
});

Given(/^the rewarded ad wait is (\d+) minutes$/, async ({ page }, value: string) => {
  await setEconomy(page, { rewardedAdWait: Number(value) * 60_000 });
  await useTestClock(page);
});

Given(/^the first midgame level is (\d+)$/, async ({ page }, value: string) => {
  await setEconomy(page, { firstMidgameLevel: Number(value) });
});

// Given and Then share this text: before the game opens it sets the balance, after that it checks it.
Given(/^the player has (\d+) coins$/, async ({ page, scenario }, value: string) => {
  const story = scenario as Story20;
  if (scenario.views.length === 0) {
    // Once per test, so reopening the game reads the saved balance instead.
    await page.addInitScript((coins) => {
      if (sessionStorage.getItem('wordSlideTestCoinsSet')) return;
      sessionStorage.setItem('wordSlideTestCoinsSet', 'yes');
      Object.assign(window, { wordSlideTestCoins: coins });
    }, Number(value));
    story.coinsGiven = true;
    return;
  }
  await expect.poll(async () => (await coinsView(page)).coins).toBe(Number(value));
  const counter = item(await topItems(page), 'coins');
  await expect.poll(async () => textsIn(await screen(page), counter)).toContain(String(value));
});

Given('the player has never played', async ({ page }) => {
  expect(await page.context().storageState()).toMatchObject({ origins: [] });
});

Given(/^the player has (\d+) points$/, async ({ scenario }, points: string) => {
  scenario.points = Number(points);
});

Given('no ad can play', async ({ page }) => {
  await setAds(page, { available: false });
});

Given('the next ad will fail to load', async ({ page }) => {
  await setAds(page, { failNext: true });
});

Given('the platform will play no midgame ad', async ({ page }) => {
  await setAds(page, { noMidgame: true });
});

Given("the reordering tutorial hasn't been taught", async ({ page }) => {
  await reorderingNotTaught(page);
});

// Opening

When("level 1's tutorial starts", async ({ page, scenario }) => {
  await reorderingNotTaught(page);
  scenario.level = tutorialLevel();
  scenario.levelList = [scenario.level, makeLevel(DEFAULT_WORDS, 'ELK')];
  scenario.finalWordGiven = true;
  await openGame(page, scenario);
});

When('the first level that needs reordering opens', async ({ page, scenario }) => {
  // Only ZEBRA's E and LEMUR's L spell ELK, so ZEBRA must move above LEMUR: this level teaches reordering (story 21).
  scenario.level = makeLevel(DEFAULT_WORDS, 'ELK');
  scenario.finalWordGiven = true;
  await opened(page, scenario);
});

// The top bar

Then(/^the top bar reads, left to right: a house button, "Level (\d+)", the "\+(\d+)" ad button, (\d+) coins and a cog button$/, async ({ page }, level: string, reward: string, coins: string) => {
  const { layout } = await current(page);
  const bar = layout.topItems.filter((candidate) => candidate.name !== 'theme').sort((a, b) => a.x - b.x);
  expect(bar.map((candidate) => candidate.name)).toEqual(['home', 'level', 'ad', 'coins', 'settings']);
  bar.slice(1).forEach((candidate, index) => expect(candidate.x).toBeGreaterThanOrEqual(bar[index].x + bar[index].width));
  const objects = await screen(page);
  expect(graphicsIn(objects, item(bar, 'home')).length).toBeGreaterThan(0);
  expect(textsIn(objects, item(bar, 'level'))).toContain(`Level ${level}`);
  expect(textsIn(objects, item(bar, 'ad'))).toContain(`+${reward}`);
  expect(textsIn(objects, item(bar, 'coins'))).toContain(String(coins));
  expect(graphicsIn(objects, item(bar, 'settings')).length).toBeGreaterThan(0);
});

Then('the ad button is centred on the screen', async ({ page }) => {
  const { layout } = await current(page);
  expect(centreOf(item(layout.topItems, 'ad')).x).toBeCloseTo(layout.width / 2, 0);
});

Then('there are no points and no shop button in the top bar', async ({ page }) => {
  const { layout } = await current(page);
  expect(layout.topItems.map((candidate) => candidate.name)).not.toContain('points');
  expect(layout.topItems.map((candidate) => candidate.name)).not.toContain('shop');
  const texts = (await screen(page)).filter((object) => object.kind === 'text' && object.y < layout.top.y + layout.top.height).map((object) => object.text ?? '');
  expect(texts.filter((text) => /points|shop/i.test(text))).toEqual([]);
});

Then('the theme is centred just below the top bar, above the rows', async ({ page }) => {
  const { layout, level } = await current(page);
  const theme = item(layout.topItems, 'theme');
  const bar = layout.topItems.filter((candidate) => candidate.name !== 'theme');
  const barBottom = Math.max(...bar.map((candidate) => candidate.y + candidate.height));
  expect(theme.y).toBeGreaterThanOrEqual(barBottom);
  expect(theme.y + theme.height).toBeLessThanOrEqual(layout.rows[0].cells[0].y);
  expect(centreOf(theme).x).toBeCloseTo(layout.width / 2, 0);
  expect(textsIn(await screen(page), theme)).toContain(level.theme);
});

Then(/^the ad button shows "\+(\d+)", a coin icon and a video icon$/, async ({ page }, reward: string) => {
  const button = await adButtonRect(page);
  const objects = await screen(page);
  expect(textsIn(objects, button)).toContain(`+${reward}`);
  const icons = graphicsIn(objects, button);
  // The coin: an octagon. The video: a frame of four lines and a play triangle.
  expect(icons.some((icon) => icon.lines.length === 8 && icon.triangles.length === 0)).toBe(true);
  expect(icons.some((icon) => icon.lines.length === 4 && icon.triangles.length === 1)).toBe(true);
});

Then("there's no ad button", async ({ page }) => {
  await page.waitForTimeout(300);
  expect((await coinsView(page)).adButton).toBeNull();
  const button = await adButtonRect(page);
  expect((await screen(page)).filter((object) => object.alpha > 0 && inside(button, object) && object.kind !== 'graphics')).toEqual([]);
  expect(graphicsIn(await screen(page), button)).toEqual([]);
});

// Rewarded ads

When('the player presses the ad button', async ({ page, scenario }) => {
  await pressAdButton(page, scenario);
});

When(/^(?:the player )?watches (?:the|an) ad to the end$/, async ({ page, scenario }) => {
  if (!(await pretendAd(page).isVisible())) await pressAdButton(page, scenario);
  await finishAd(page, scenario);
});

When('closes the ad early', async ({ page }) => {
  await closeAd(page);
});

Then('the player can still place a letter', async ({ page }) => {
  const { layout } = await current(page);
  const placed = () => layout.rows.flatMap((row) => row.cells).filter(({ cell }) => cell.kind === 'placed').length;
  const before = placed();
  await page.keyboard.press(layout.poolTiles[0].character);
  await page.waitForTimeout(300);
  const after = (await current(page)).layout.rows.flatMap((row) => row.cells).filter(({ cell }) => cell.kind === 'placed').length;
  expect(after).toBe(before + 1);
});

When('the player plays the level through to the end without pressing the ad button', async ({ page, scenario }) => {
  await win(page, scenario);
  await waitForPopup(page);
});

Then('no rewarded ad was asked for', async ({ page }) => {
  expect(await adLog(page)).not.toContain('rewarded');
});

When('the game is closed and opened again', async ({ page, scenario }) => {
  await page.reload();
  await page.waitForFunction(() => (window as unknown as { wordSlideReady?: boolean }).wordSlideReady === true);
  await installProbe(page);
  scenario.views.push(await current(page));
});

// The wait

When(/^(\d+) (seconds|minutes) pass$/, async ({ page }, amount: string, unit: string) => {
  const ms = Number(amount) * (unit === 'seconds' ? 1000 : 60_000);
  await page.evaluate((ms) => {
    const target = window as unknown as { wordSlideTime: number };
    target.wordSlideTime += ms;
  }, ms);
  await page.waitForTimeout(300);
});

async function adButtonParts(page: Page) {
  const button = await adButtonRect(page);
  return (await screen(page)).filter((object) => inside(button, object) || (object.kind === 'graphics' && object.lines.length > 0 && object.lines.every((line) => inside(button, { x: line.x1, y: line.y1 }))));
}

Then(/^the ad button is greyed out and (?:reads|counts down from) "(\d:\d\d)"$/, async ({ page }, time: string) => {
  expect((await coinsView(page)).adButton).toEqual({ ready: false, text: time });
  const parts = await adButtonParts(page);
  expect(parts.map((part) => part.text)).toContain(time);
  expect(parts.some((part) => part.text?.startsWith('+'))).toBe(false);
  parts.forEach((part) => expect(part.alpha).toBeLessThan(0.6));
});

Then('pressing it plays no ad', async ({ page }) => {
  const before = await adLog(page);
  const button = await adButtonRect(page);
  await page.mouse.click(button.x + button.width / 2, button.y + button.height / 2);
  await page.waitForTimeout(300);
  expect(await adLog(page)).toEqual(before);
  await expect(pretendAd(page)).toBeHidden();
});

Then(/^the ad button shows "\+(\d+)"$/, async ({ page }, reward: string) => {
  expect((await coinsView(page)).adButton).toEqual({ ready: true, text: `+${reward}` });
  const parts = await adButtonParts(page);
  expect(parts.map((part) => part.text)).toContain(`+${reward}`);
  parts.forEach((part) => expect(part.alpha).toBeGreaterThan(0.95));
});

Then('pressing it plays an ad', async ({ page }) => {
  const button = await adButtonRect(page);
  await page.mouse.click(button.x + button.width / 2, button.y + button.height / 2);
  await expect(pretendAd(page)).toBeVisible();
});

// Coins flying

/** A flying coin is an octagon drawn above the board (FLIGHT_DEPTH). */
const FLIGHT_DEPTH = 26;

Then('coins fly from the centre of the screen to the coin counter', async ({ page, scenario }) => {
  const { layout } = await current(page);
  const counter = centreOf(item(layout.topItems, 'coins'));
  const flying = (frame: Frame) => frame.screen.filter((object) => object.kind === 'graphics' && object.depth === FLIGHT_DEPTH && object.lines.length === 8);
  const frames = scenario.frames!.filter((frame) => flying(frame).length > 0);
  expect(frames.length).toBeGreaterThan(5);
  const centreOfLines = (object: Drawn) => ({
    x: object.lines.reduce((sum, line) => sum + line.x1, 0) / object.lines.length,
    y: object.lines.reduce((sum, line) => sum + line.y1, 0) / object.lines.length,
  });
  const first = centreOfLines(flying(frames[0])[0]);
  expect(Math.hypot(first.x - layout.width / 2, first.y - layout.height / 2)).toBeLessThan(layout.tileSize);
  const last = flying(frames[frames.length - 1]).map(centreOfLines);
  expect(last.some((point) => Math.hypot(point.x - counter.x, point.y - counter.y) < layout.tileSize)).toBe(true);
  // They're all gone once they've landed.
  expect(flying(scenario.frames![scenario.frames!.length - 1])).toEqual([]);
});

Then(/^the counter counts up from (\d+) to (\d+) as they land$/, async ({ page, scenario }, from: string, to: string) => {
  const { layout } = await current(page);
  const counter = item(layout.topItems, 'coins');
  const values = scenario.frames!.map((frame) => frame.screen.find((object) => object.kind === 'text' && inside(counter, object) && /^\d+$/.test(object.text ?? ''))?.text).filter((text): text is string => !!text).map(Number);
  expect(values[0]).toBe(Number(from));
  expect(values[values.length - 1]).toBe(Number(to));
  values.slice(1).forEach((value, index) => expect(value).toBeGreaterThanOrEqual(values[index]));
  expect(new Set(values).size).toBeGreaterThan(2);
});

// Midgame ads

When(/^the player completes level (\d+) and presses "Play Level \d+"$/, async ({ page, scenario }, level: string) => {
  scenario.levelNumber = Number(level);
  await win(page, scenario);
  await waitForPopup(page);
  await page.waitForTimeout(500);
  const button = (await popupParts(page)).find((object) => object.text?.startsWith('Play Level'))!;
  await page.mouse.click(button.x, button.y);
  await page.waitForTimeout(200);
});

Then('no midgame ad was asked for', async ({ page }) => {
  expect(await adLog(page)).not.toContain('midgame');
  await expect(pretendAd(page)).toBeHidden();
});

Then('a midgame ad plays', async ({ page }) => {
  await expect(pretendAd(page)).toBeVisible();
  await expect(pretendAd(page)).toContainText('midgame');
  expect(await adLog(page)).toContain('midgame');
});

Then(/^level (\d+) opens once it ends$/, async ({ page }, level: string) => {
  await page.waitForTimeout(500);
  expect((await coinsView(page)).levelNumber).toBe(Number(level) - 1);
  await pretendAd(page).getByRole('button', { name: 'Finish' }).click();
  await expect.poll(async () => (await coinsView(page)).levelNumber, { timeout: 3000 }).toBe(Number(level));
  expect((await two(page))).toBeNull();
});

Then(/^level (\d+) opens straight away$/, async ({ page }, level: string) => {
  await expect.poll(async () => (await coinsView(page)).levelNumber, { timeout: 1000 }).toBe(Number(level));
  await expect(pretendAd(page)).toBeHidden();
});

// While an ad plays

When('presses L while the ad plays', async ({ page }) => {
  await expect(pretendAd(page)).toBeVisible();
  await page.keyboard.press('l');
  await page.keyboard.press('L');
  await page.waitForTimeout(200);
});

Then("LEMUR's row is as it was before the ad", async ({ page, scenario }) => {
  const before = scenario.before!.layout;
  const after = (await current(page)).layout;
  const row = rowOf(before, 'LEMUR');
  expect(after.rows[row].cells.map(({ cell }) => cell.kind)).toEqual(before.rows[row].cells.map(({ cell }) => cell.kind));
});

// The pretend ad

Then('a pretend rewarded ad shows, with Finish and Close buttons', async ({ page }) => {
  await expect(pretendAd(page)).toBeVisible();
  await expect(pretendAd(page)).toContainText(/pretend rewarded ad/i);
  await expect(pretendAd(page).getByRole('button', { name: 'Finish' })).toBeVisible();
  await expect(pretendAd(page).getByRole('button', { name: 'Close' })).toBeVisible();
});

// Points on the popup

function popupText(frame: Frame, pattern: RegExp) {
  return frame.screen.filter((object) => object.kind === 'text' && object.depth >= 30 && pattern.test(object.text ?? ''));
}

Then('the Level complete popup shows "Points: {int}" under the golden word', async ({ page, scenario }, points: number) => {
  await waitForPopup(page);
  await page.waitForTimeout(1200);
  scenario.frames = await stopRecording(page);
  const shown = scenario.frames.filter((frame) => popupText(frame, /^Points: /).length > 0);
  expect(shown.length).toBeGreaterThan(0);
  expect(popupText(shown[0], /^Points: /)[0].text).toBe(`Points: ${points}`);
  const { colours } = await current(page);
  const gold = shown[0].screen.filter((object) => object.kind === 'rect' && object.fill === colours.tileGold && object.depth >= 30);
  expect(gold.length).toBeGreaterThan(0);
  expect(popupText(shown[0], /^Points: /)[0].y).toBeGreaterThan(Math.max(...gold.map((tile) => tile.y)));
});

Then('it counts up to "Points: {int}"', async ({ scenario }, points: number) => {
  const shown = scenario.frames!.filter((frame) => popupText(frame, /^Points: /).length > 0);
  expect(popupText(shown[shown.length - 1], /^Points: /)[0].text).toBe(`Points: ${points}`);
});

// From playing: a pause, then a pulse

async function pointsPause(page: Page): Promise<number> {
  const pause = ((await current(page)) as unknown as { timings: { pointsPause?: number } }).timings.pointsPause;
  expect(pause, 'the style has a points pause').toBeGreaterThan(0);
  return pause!;
}

Then('the popup shows "Points: {int}" until the points pause has passed', async ({ page, scenario }, points: number) => {
  await waitForPopup(page);
  const pause = await pointsPause(page);
  await page.waitForTimeout(pause + 1500);
  scenario.frames = await stopRecording(page);
  const shown = scenario.frames.filter((frame) => popupText(frame, /^Points: /).length > 0);
  const start = shown[0].t;
  const waiting = shown.filter((frame) => frame.t < start + pause * 0.9);
  expect(waiting.length).toBeGreaterThan(5);
  waiting.forEach((frame) => expect(popupText(frame, /^Points: /)[0].text).toBe(`Points: ${points}`));
});

Then('then "Points: {int}", with a small pulse', async ({ scenario }, points: number) => {
  const after = scenario.frames!.map((frame) => popupText(frame, /^Points: /)[0]).filter((text) => text?.text === `Points: ${points}`);
  expect(after.length).toBeGreaterThan(5);
  expect(Math.max(...after.map((text) => text.scale))).toBeGreaterThan(1.05);
  expect(after[after.length - 1].scale).toBeCloseTo(1, 2);
});
