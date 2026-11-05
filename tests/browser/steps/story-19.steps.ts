import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import type { Rect } from '../../../src/game/layout';
import { test, type Scenario } from './fixtures';
import { centreOf, layoutNow, rowOf } from './phase-one.steps';
import { dragSlowlyAndRelease, ready, two } from './phase-two.steps';
import { screen, tileAt } from './probe';
import { current } from './story-02.steps';

const { Given, When, Then } = createBdd(test);

type HintName = 'letter' | 'ordering' | 'reveal';
interface HintView {
  name: HintName;
  rect: Rect;
  enabled: boolean;
}

/** The hint buttons on screen now: phase one's, or phase two's. */
async function hints(page: Page): Promise<HintView[]> {
  const view = (await current(page)) as unknown as { hints?: HintView[]; phaseTwo: { hints?: HintView[] } | null };
  return (view.phaseTwo ? view.phaseTwo.hints : view.hints) ?? [];
}

const NAMES: Record<string, HintName> = { Letter: 'letter', Ordering: 'ordering', Reveal: 'reveal' };

async function pressHint(page: Page, scenario: Scenario, name: string, times = 1) {
  if (name === 'Letter') await layoutNow(page, scenario);
  scenario.acted = true;
  for (let time = 0; time < times; time++) {
    const button = (await hints(page)).find((hint) => hint.name === NAMES[name]);
    expect(button, `No ${name} hint button`).toBeDefined();
    const { x, y } = centreOf(button!.rect);
    await page.mouse.click(x, y);
    await page.waitForTimeout(600);
  }
}

// Placement (R2)

Then("the Letter hint's button is just above Recall All", async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  const button = (await hints(page)).find((hint) => hint.name === 'letter')!;
  expect(button).toBeDefined();
  const recall = layout.recall;
  expect(Math.abs(centreOf(button.rect).x - centreOf(recall).x)).toBeLessThan(2);
  const gap = recall.y - (button.rect.y + button.rect.height);
  expect(gap).toBeGreaterThanOrEqual(0);
  expect(gap).toBeLessThan(recall.height * 0.5);
  // Drawn there.
  const { x, y } = centreOf(button.rect);
  expect(tileAt(await screen(page), x, y)).toBeDefined();
});

Then('the hint buttons are centred along the bottom of the screen', async ({ page }) => {
  const buttons = await hints(page);
  expect(buttons.length).toBeGreaterThan(0);
  const { width, height } = page.viewportSize()!;
  const left = Math.min(...buttons.map((button) => button.rect.x));
  const right = Math.max(...buttons.map((button) => button.rect.x + button.rect.width));
  expect(Math.abs((left + right) / 2 - width / 2)).toBeLessThan(2);
  for (const button of buttons) {
    expect(button.rect.y + button.rect.height).toBeLessThanOrEqual(height);
    expect(button.rect.y + button.rect.height).toBeGreaterThan(height - button.rect.height * 0.6);
  }
});

Then("the Reveal hint's button shows", async ({ page }) => {
  expect((await hints(page)).some((hint) => hint.name === 'reveal' && hint.enabled)).toBe(true);
});

Then(/^(?:the Ordering hint's button is gone|there's no Ordering hint button)$/, async ({ page }) => {
  await page.waitForTimeout(300);
  expect((await hints(page)).some((hint) => hint.name === 'ordering')).toBe(false);
});

Then('there are no hint buttons', async ({ page, scenario }) => {
  await ready(page, scenario).catch(() => undefined);
  expect(await hints(page)).toEqual([]);
});

// Using hints

When(/^the player uses the (Letter|Ordering|Reveal) hint(?: (\d+) times)?$/, async ({ page, scenario }, name: string, times?: string) => {
  if (name === 'Letter') await layoutNow(page, scenario);
  else await ready(page, scenario);
  scenario.before = await current(page);
  if (name !== 'Letter') scenario.twoBefore = await two(page);
  await pressHint(page, scenario, name, Number(times ?? 1));
});

Given(/^the player has used the (Letter|Ordering|Reveal) hint$/, async ({ page, scenario }, name: string) => {
  if (name === 'Letter') await layoutNow(page, scenario);
  else await ready(page, scenario);
  scenario.before = await current(page);
  if (name !== 'Letter') scenario.twoBefore = await two(page);
  await pressHint(page, scenario, name);
});

// The Letter hint (R3, R4)

async function lemurCells(page: Page) {
  const { layout } = await current(page);
  return layout.rows[rowOf(layout, 'LEMUR')].cells.map(({ cell }) => cell);
}

Then(/^(\d+) of LEMUR's cells are locked$/, async ({ page }, count: string) => {
  const cells = await lemurCells(page);
  const locked = cells.filter((cell, index) => cell.kind === 'revealed' && cell.character === 'LEMUR'[index]);
  expect(locked).toHaveLength(Number(count));
});

Then("one of LEMUR's cells holds its right letter, locked", async ({ page, scenario }) => {
  const cells = await lemurCells(page);
  const locked = cells.flatMap((cell, index) => (cell.kind === 'revealed' ? [index] : []));
  expect(locked).toHaveLength(1);
  expect((cells[locked[0]] as { character: string }).character).toBe('LEMUR'[locked[0]]);
  scenario.tileRef = { row: rowOf((await current(page)).layout, 'LEMUR'), cell: locked[0] };
});

Then("that letter's tile in the pool has one fewer", async ({ page, scenario }) => {
  const letter = 'LEMUR'[scenario.tileRef!.cell];
  const count = (layout: { poolTiles: { character: string; count: number }[] }) => layout.poolTiles.find((tile) => tile.character === letter)!.count;
  expect(count((await current(page)).layout)).toBe(count(scenario.before!.layout) - 1);
});

Then("LEMUR's letters, on the board and in its pool, are still L, E, M, U and R", async ({ page }) => {
  const { layout, markedRow } = await current(page);
  const row = rowOf(layout, 'LEMUR');
  expect(markedRow).toBe(row);
  const onBoard = layout.rows[row].cells.flatMap(({ cell }) => (cell.kind === 'empty' ? [] : [cell.character]));
  const inPool = layout.poolTiles.flatMap((tile) => Array<string>(tile.count).fill(tile.character));
  expect([...onBoard, ...inPool].sort()).toEqual([...'LEMUR'].sort());
});

Then("the U is still in LEMUR's fourth cell, and can't be dragged", async ({ page }) => {
  await page.waitForTimeout(400);
  const { layout } = await current(page);
  const row = layout.rows[rowOf(layout, 'LEMUR')];
  const cell = row.cells[3].cell;
  expect(cell.kind !== 'empty' && cell.character).toBe('U');
  // Fixed either way: locked by the hint, or by the whole word locking.
  expect(row.locked || cell.kind === 'revealed').toBe(true);
});

// The Ordering hint (R5)

Then('ZEBRA moves', async ({ page, scenario }) => {
  const zebra = (view: Awaited<ReturnType<typeof two>>) => view.rows.find((row) => row.word === 'ZEBRA')!.columnCell;
  expect(zebra(await two(page))).not.toBe(zebra(scenario.twoBefore!));
});

// The Reveal hint (R6)

type Two = Awaited<ReturnType<typeof two>> & { rows: { word: string; columnCell: number; fixed?: boolean }[] };

/** Which rows have the final word's letter in the column. */
function rightRows(view: Two, finalWord: string): string[] {
  return view.rows.flatMap((row, index) => ([...row.word][row.columnCell] === finalWord[index] ? [row.word] : []));
}

Then('one more word has its column letter in place, in gold', async ({ page, scenario }) => {
  const { level, colours } = await current(page);
  const now = (await two(page)) as Two;
  const before = scenario.twoBefore as Two;
  expect(rightRows(now, level.finalWord).length).toBe(rightRows(before, level.finalWord).length + 1);
  const fixed = now.rows.filter((row) => row.fixed);
  expect(fixed).toHaveLength(1);
  scenario.stretchWord = fixed[0].word;
  // Its letter in the column is gold.
  const index = now.rows.indexOf(fixed[0]);
  const column = now.column;
  const y = now.rows[index].y;
  const tile = tileAt(await screen(page), column.x + column.width / 2, y);
  expect(tile?.fill).toBe(colours.tileGold);
});

Then('that word can\'t be slid', async ({ page, scenario }) => {
  const word = scenario.stretchWord!;
  const before = ((await two(page)) as Two).rows.find((row) => row.word === word)!.columnCell;
  await dragSlowlyAndRelease(page, word, 0, 1);
  await page.waitForTimeout(400);
  expect(((await two(page)) as Two).rows.find((row) => row.word === word)!.columnCell).toBe(before);
});

// Saving (R9)

Then('the hinted letter is still locked in its cell', async ({ page }) => {
  const cells = await lemurCells(page);
  const locked = cells.flatMap((cell, index) => (cell.kind === 'revealed' && cell.character === 'LEMUR'[index] ? [index] : []));
  expect(locked).toHaveLength(1);
});

Then('the revealed word is still at its column letter, in gold, and can\'t be slid', async ({ page, scenario }) => {
  await ready(page, scenario);
  const { level, colours } = await current(page);
  const now = (await two(page)) as Two;
  const fixed = now.rows.filter((row) => row.fixed);
  expect(fixed).toHaveLength(1);
  expect(rightRows(now, level.finalWord)).toContain(fixed[0].word);
  const index = now.rows.indexOf(fixed[0]);
  const tile = tileAt(await screen(page), now.column.x + now.column.width / 2, now.rows[index].y);
  expect(tile?.fill).toBe(colours.tileGold);
});
