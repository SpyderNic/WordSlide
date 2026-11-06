import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import type { Rect } from '../../../src/game/layout';
import { DEFAULT_WORDS, makeLevel } from '../../support/levels';
import { reorderingNotTaught, test } from './fixtures';
import { centreOf, layoutNow, rowOf } from './phase-one.steps';
import { dragHandle, popupParts, ready, two, waitForPopup, win } from './phase-two.steps';
import { screen, type Drawn } from './probe';
import { current } from './m02-02.steps';
import { finishAd, pretendAd, setEconomy } from './m07-02.steps';

const { Given, When, Then } = createBdd(test);

type HintName = 'letter' | 'ordering' | 'reveal';
interface HintView {
  name: HintName;
  rect: Rect;
  enabled: boolean;
}

/** What M07-03 adds to the game's test view: the "Not enough coins" popup, while it's open. */
interface NoCoinsView {
  noCoins: { lines: string[]; close: Rect; ad: Rect | null; adButton: { ready: boolean; text: string } | null } | null;
}

const NAMES: Record<string, HintName> = { Letter: 'letter', Ordering: 'ordering', Reveal: 'reveal' };

async function hints(page: Page): Promise<HintView[]> {
  const view = (await current(page)) as unknown as { hints?: HintView[]; phaseTwo: { hints?: HintView[] } | null };
  return (view.phaseTwo ? view.phaseTwo.hints : view.hints) ?? [];
}

async function noCoins(page: Page) {
  return ((await current(page)) as unknown as NoCoinsView).noCoins;
}

function inside(rect: Rect, point: { x: number; y: number }) {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

// Settings (D52)

const PRICE_SETTING: Record<string, string> = { Letter: 'letterPrice', Reveal: 'revealPrice', Ordering: 'orderingPrice' };

Given(/^the (Letter|Reveal|Ordering) price is (\d+)$/, async ({ page, scenario }, name: string, price: string) => {
  await setEconomy(page, { [PRICE_SETTING[name]]: Number(price) });
  // The feature's level is won with ELK, unless a scenario gives its own, even when it opens in phase one first.
  if (!scenario.finalWordGiven) {
    scenario.level.finalWord = 'ELK';
    scenario.finalWordGiven = true;
  }
});

Given(/^the price step is (\d+)% and the price cap is (\d+) times$/, async ({ page }, step: string, cap: string) => {
  await setEconomy(page, { priceStep: Number(step) / 100, priceCap: Number(cap) });
});

// In length order (D5), LEMUR, ZEBRA, KANGAROO spell EEN by sliding alone, so with reordering not taught, there are no
// handles and phase two offers the Reveal hint (M07-01, R7).
Given("a level whose rows can't be reordered", async ({ page, scenario }) => {
  await reorderingNotTaught(page);
  scenario.level = makeLevel(DEFAULT_WORDS, 'EEN');
  scenario.finalWordGiven = true;
});

Given('the Letter hint will pick the first cell', async ({ page }) => {
  await page.addInitScript(() => Object.assign(window, { wordSlideHintRandom: 0 }));
});

// The price on the button (R2)

Then(/^the (Letter|Ordering|Reveal) hint's button shows a coin and "(\d+)" under its icon$/, async ({ page }, name: string, price: string) => {
  await page.waitForTimeout(300);
  const button = (await hints(page)).find((hint) => hint.name === NAMES[name]);
  expect(button, `No ${name} hint button`).toBeDefined();
  const { rect } = button!;
  const objects = await screen(page);
  const label = objects.find((object) => object.kind === "text" && object.text === String(price) && inside(rect, object));
  expect(label, `"${price}" on the ${name} hint`).toBeDefined();
  expect(label!.y).toBeGreaterThan(rect.y + rect.height / 2);
  const coin = objects.find((object) => object.kind === 'graphics' && object.lines.length === 8 && object.lines.every((line) => inside(rect, { x: line.x1, y: line.y1 })));
  expect(coin, `a coin on the ${name} hint`).toBeDefined();
});

// Levels

When('the player wins the level and plays the next one', async ({ page, scenario }) => {
  const levelNumber = async () => ((await current(page)) as unknown as { levelNumber: number }).levelNumber;
  const before = await levelNumber();
  await win(page, scenario);
  await waitForPopup(page);
  await page.waitForTimeout(400);
  const button = (await popupParts(page)).find((object) => object.text?.startsWith('Play Level'))!;
  await page.mouse.click(button.x, button.y);
  await expect.poll(levelNumber).toBe(before + 1);
  await page.waitForTimeout(600);
});

// Saving (R7)

When('the player uses the Letter hint and the game closes straight away', async ({ page, scenario }) => {
  await layoutNow(page, scenario);
  scenario.acted = true;
  const button = (await hints(page)).find((hint) => hint.name === 'letter')!;
  const { x, y } = centreOf(button.rect);
  await page.mouse.click(x, y);
  await page.goto('about:blank');
  scenario.views = [];
});

// The reordering tutorial (R8, R13)

async function moveTopRowDown(page: Page, slots: number) {
  await dragHandle(page, (await two(page)).rows[0].word, slots);
  await page.mouse.up();
  await page.waitForTimeout(500);
}

// The 2-row test level needs its top row moved down one; the 3-row one, the top row to the bottom, then the new top row
// down one (M05-04).
When(/^the player makes the reordering tutorial's moves?$/, async ({ page, scenario }) => {
  await ready(page, scenario);
  const rows = (await two(page)).rows.length;
  await moveTopRowDown(page, rows - 1);
  if (rows === 3) await moveTopRowDown(page, 1);
  scenario.twoBefore = await two(page);
});

Then('the rows stay in the order the move made', async ({ page, scenario }) => {
  await page.waitForTimeout(600);
  const order = (await two(page)).rows.map((row) => row.word);
  expect(order).toEqual(scenario.twoBefore!.rows.map((row) => row.word));
  // There's no handle to drag.
  await dragHandle(page, order[0], 1).catch(() => undefined);
  await page.mouse.up();
  await page.waitForTimeout(400);
  expect((await two(page)).rows.map((row) => row.word)).toEqual(order);
});

// Not enough coins (R9)

async function popupTexts(page: Page): Promise<Drawn[]> {
  return (await screen(page)).filter((object) => object.kind === 'text' && object.depth >= 35);
}

Then(/^"Not enough coins" opens, with a "Watch an ad for \+(\d+)" button and Close$/, async ({ page }, reward: string) => {
  await expect.poll(async () => (await noCoins(page)) !== null).toBe(true);
  const texts = (await popupTexts(page)).map((object) => object.text);
  expect(texts).toContain('Not enough coins');
  expect(texts).toContain(`Watch an ad for +${reward}`);
  expect(texts).toContain('Close');
  expect((await noCoins(page))!.adButton).toEqual({ ready: true, text: `Watch an ad for +${reward}` });
});

Then("none of LEMUR's cells is locked", async ({ page }) => {
  const { layout } = await current(page);
  const row = layout.rows[rowOf(layout, 'LEMUR')];
  expect(row.cells.filter(({ cell }) => cell.kind === 'revealed' || cell.kind === 'locked')).toEqual([]);
});

When('closes "Not enough coins"', async ({ page }) => {
  const popup = (await noCoins(page))!;
  const { x, y } = centreOf(popup.close);
  await page.mouse.click(x, y);
  await page.waitForTimeout(300);
});

Then('the level is as it was before the hint was tapped', async ({ page, scenario }) => {
  expect(await noCoins(page)).toBeNull();
  expect((await popupTexts(page)).map((object) => object.text)).not.toContain('Not enough coins');
  expect((await current(page)).layout.rows).toEqual(scenario.before!.layout.rows);
});

When("watches the popup's ad to the end", async ({ page, scenario }) => {
  const popup = (await noCoins(page))!;
  const { x, y } = centreOf(popup.ad!);
  await page.mouse.click(x, y);
  await finishAd(page, scenario);
});

Then(/^"Not enough coins" opens, with its ad button greyed out and reading "(\d:\d\d)"$/, async ({ page }, time: string) => {
  await expect.poll(async () => (await noCoins(page)) !== null).toBe(true);
  expect((await noCoins(page))!.adButton).toEqual({ ready: false, text: time });
  const popup = (await noCoins(page))!;
  const label = (await popupTexts(page)).find((object) => object.text === time);
  expect(label).toBeDefined();
  expect(inside(popup.ad!, label!)).toBe(true);
  expect(label!.alpha).toBeLessThan(0.6);
  // Pressing it plays nothing.
  await page.mouse.click(label!.x, label!.y);
  await page.waitForTimeout(300);
  await expect(pretendAd(page)).toBeHidden();
});

Then('"Not enough coins" says {string}', async ({ page }, line: string) => {
  await expect.poll(async () => (await noCoins(page)) !== null).toBe(true);
  const texts = (await popupTexts(page)).map((object) => object.text);
  expect(texts).toContain('Not enough coins');
  expect(texts).toContain(line);
});

Then('it has Close and no ad button', async ({ page }) => {
  const popup = (await noCoins(page))!;
  expect(popup.ad).toBeNull();
  expect(popup.adButton).toBeNull();
  const texts = (await popupTexts(page)).map((object) => object.text ?? '');
  expect(texts).toContain('Close');
  expect(texts.filter((text) => /watch an ad for/i.test(text))).toEqual([]);
});

// Spending (R10)

Then(/^the coin counter counts down from (\d+) to (\d+)$/, async ({ page, scenario }, from: string, to: string) => {
  const { layout } = await current(page);
  const counter = layout.topItems.find((item) => item.name === 'coins')!;
  const values = scenario.frames!.map((frame) => frame.screen.find((object) => object.kind === 'text' && inside(counter, object) && /^\d+$/.test(object.text ?? ''))?.text).filter((text): text is string => !!text).map(Number);
  expect(values[0]).toBe(Number(from));
  expect(values[values.length - 1]).toBe(Number(to));
  values.slice(1).forEach((value, index) => expect(value).toBeLessThanOrEqual(values[index]));
  expect(new Set(values).size).toBeGreaterThan(2);
});

// The Letter hint confirming a letter (R11)

Then("LEMUR's first cell holds L, locked", async ({ page }) => {
  const { layout } = await current(page);
  const cell = layout.rows[rowOf(layout, 'LEMUR')].cells[0].cell;
  expect(cell).toEqual({ kind: 'revealed', character: 'L' });
});


// For other stories' scenarios that use hints, once the level may already be open (M07-01, changed by M07-03).
Given(/^the player has (\d+) coins to spend$/, async ({ page, scenario }, coins: string) => {
  if (scenario.views.length === 0) {
    await page.addInitScript((value) => Object.assign(window, { wordSlideTestCoins: value }), Number(coins));
    return;
  }
  await page.evaluate((value) => (window as unknown as { wordSlide: { setCoins: (coins: number) => void } }).wordSlide.setCoins(value), Number(coins));
});
