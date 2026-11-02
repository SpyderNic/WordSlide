import { expect, type Page } from '@playwright/test';
import { createBdd, type DataTable } from 'playwright-bdd';
import { rowText, type CellView, type LevelLayout, type PoolTileView, type Rect, type RowView } from '../../../src/game/layout';
import type { Level } from '../../../src/game/level';
import { rowOrder, startingPool } from '../../../src/game/level';
import { levelContaining, levelWithRows, makeLevel, parseWords, reveal } from '../../support/levels';
import { test, type GameView, type Scenario } from './fixtures';
import { drawnIn, installProbe, screen, textAt, tileAt } from './probe';

const { Given, When, Then } = createBdd(test);

/** Gives the game a list of copies of one level, from the next page load on. Development builds only. */
export async function useLevels(page: Page, level: Level, count: number) {
  await page.addInitScript((levels) => Object.assign(window, { wordSlideTestLevels: levels }), Array.from({ length: count }, () => level));
}

/** Gives the game a list of different levels, from the next page load on. Development builds only. */
export async function useLevelList(page: Page, levels: Level[]) {
  await page.addInitScript((list) => Object.assign(window, { wordSlideTestLevels: list }), levels);
}

export async function open(page: Page, level: Level, levelNumber: number, points: number, levelCount = 12, list?: Level[]): Promise<GameView> {
  if (list) await useLevelList(page, list);
  else await useLevels(page, level, Math.max(levelCount, levelNumber));
  await page.goto('/');
  await page.waitForFunction(() => (window as unknown as { wordSlideReady?: boolean }).wordSlideReady === true);
  await installProbe(page);
  return page.evaluate(
    ({ level, levelNumber, points }) => {
      const game = (window as unknown as { wordSlide: { show: (...args: unknown[]) => void; view: () => GameView } }).wordSlide;
      game.show(level, levelNumber, points);
      return game.view();
    },
    { level, levelNumber, points },
  );
}

export async function current(page: Page): Promise<GameView> {
  return page.evaluate(() => (window as unknown as { wordSlide: { view: () => GameView } }).wordSlide.view());
}

function viewOf(scenario: Scenario): GameView {
  return scenario.views[scenario.views.length - 1];
}

function layoutOf(scenario: Scenario): LevelLayout {
  return viewOf(scenario).layout;
}

function rowOf(layout: LevelLayout, word: string): RowView {
  const row = layout.rows.find((candidate) => candidate.word === word);
  if (!row) throw new Error(`No row for ${word}`);
  return row;
}

function centreY(rect: Rect) {
  return rect.y + rect.height / 2;
}

async function topText(page: Page, scenario: Scenario, name: string) {
  const item = layoutOf(scenario).topItems.find((candidate) => candidate.name === name)!;
  return textAt(await screen(page), centreX(item), centreY(item))?.text;
}

function bottom(rect: Rect) {
  return rect.y + rect.height;
}

function right(rect: Rect) {
  return rect.x + rect.width;
}

function centreX(rect: Rect) {
  return rect.x + rect.width / 2;
}

function allCells(layout: LevelLayout): CellView[] {
  return layout.rows.flatMap((row) => row.cells);
}

function poolText(tile: PoolTileView) {
  return `${tile.character} x${tile.count}`;
}

function parseScreen(size: string) {
  const [width, height] = size.split('×').map(Number);
  return { width, height };
}

function expectOnScreen(layout: LevelLayout) {
  for (const rect of [...allCells(layout), ...layout.poolTiles]) {
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(right(rect)).toBeLessThanOrEqual(layout.width);
    expect(bottom(rect)).toBeLessThanOrEqual(layout.height);
  }
  expect(bottom(layout.rows[layout.rows.length - 1].cells[0])).toBeLessThanOrEqual(layout.poolArea.y);
  expect(layout.rows[0].cells[0].y).toBeGreaterThanOrEqual(bottom(layout.top));
}

Given(/^the player is on level (\d+) with (\d+) points$/, async ({ scenario }, level: string, points: string) => {
  scenario.levelNumber = Number(level);
  scenario.points = Number(points);
});

Given(/^a level containing the answer (.+)$/, async ({ scenario }, word: string) => {
  scenario.level = levelContaining(word);
});

Given(/^a level with (\d+) rows$/, async ({ scenario }, rows: string) => {
  scenario.level = levelWithRows(Number(rows));
});

Given(/^the answers (.+)$/, async ({ scenario }, list: string) => {
  scenario.level = makeLevel(parseWords(list));
});

Given('nothing revealed', async ({ scenario }) => {
  expect(scenario.level.answers.every((answer) => !answer.revealed?.length)).toBe(true);
});

Given(/^(\S+) revealed at position (\d+) of (.+)$/, async ({ scenario }, letter: string, position: string, word: string) => {
  const row = /^row (\d+)$/.exec(word);
  reveal(scenario.level, row ? rowOrder(scenario.level.answers)[Number(row[1]) - 1].word : word, letter, Number(position));
});

Given(/^(\S+) at position (\d+) revealed$/, async ({ scenario }, letter: string, position: string) => {
  reveal(scenario.level, scenario.level.answers[0].word, letter, Number(position));
});

Given(/^a screen of (\d+×\d+)$/, async ({ page }, size: string) => {
  await page.setViewportSize(parseScreen(size));
});

Given('one level with 8 pool tiles and one with 20', async ({ scenario }) => {
  scenario.levels = [
    makeLevel(['ONE', 'TWO', 'SIX']),
    makeLevel(['QUICKLY', 'FROZEN', 'DAMPHTS']),
  ];
});

Given('both levels have 3 rows', async ({ scenario }) => {
  expect(scenario.levels.map((level) => level.answers.length)).toEqual([3, 3]);
  expect(scenario.levels.map((level) => startingPool(level.answers).length)).toEqual([8, 20]);
});

Given('one level with 3 rows and one with 5', async ({ scenario }) => {
  scenario.levels = [levelWithRows(3), levelWithRows(5)];
});

Given('the level is open', async ({ page, scenario }) => {
  scenario.views.push(await open(page, scenario.level, 1, 0));
});

Given('the level is open on a screen of 800×450', async ({ page, scenario }) => {
  await page.setViewportSize({ width: 800, height: 450 });
  scenario.views.push(await open(page, scenario.level, 1, 0));
});

When('the level opens', async ({ page, scenario }) => {
  scenario.views.push(await open(page, scenario.level, scenario.levelNumber, scenario.points, scenario.levelCount, scenario.levelList));
});

When(/^each level opens(?: on the same screen)?$/, async ({ page, scenario }) => {
  for (const level of scenario.levels) {
    scenario.views.push(await open(page, level, 1, 0));
  }
});

When(/^the player presses the (home|shop|settings) button$/, async ({ page, scenario }, name: string) => {
  scenario.before = viewOf(scenario);
  const button = layoutOf(scenario).topItems.find((item) => item.name === name)!;
  await page.mouse.click(centreX(button), button.y + button.height / 2);
});

When(/^the device rotates to (\d+×\d+)$/, async ({ page, scenario }, size: string) => {
  const screen = parseScreen(size);
  await page.setViewportSize(screen);
  await expect
    .poll(async () => (await current(page)).layout.width)
    .toBe(screen.width);
  scenario.views.push(await current(page));
});

Then('the theme {string} is at the top of the screen', async ({ page, scenario }, theme: string) => {
  const item = layoutOf(scenario).topItems.find((candidate) => candidate.name === 'theme')!;
  expect(await topText(page, scenario, 'theme')).toBe(theme);
  expect(bottom(item)).toBeLessThanOrEqual(bottom(layoutOf(scenario).top));
});

Then('the rows are in the middle of the screen', async ({ scenario }) => {
  const layout = layoutOf(scenario);
  const first = layout.rows[0].cells[0];
  const last = layout.rows[layout.rows.length - 1].cells[0];
  expect(first.y).toBeGreaterThanOrEqual(bottom(layout.top));
  expect(bottom(last)).toBeLessThanOrEqual(layout.poolArea.y);
});

Then('the pool is at the bottom of the screen', async ({ scenario }) => {
  const layout = layoutOf(scenario);
  expect(bottom(layout.poolArea)).toBeLessThanOrEqual(layout.height);
  expect(layout.poolArea.y).toBeGreaterThan(layout.height / 2);
});

Then('the top of the screen reads, from left to right: home, level number, theme, points, shop, settings', async ({ scenario }) => {
  const items = [...layoutOf(scenario).topItems].sort((a, b) => a.x - b.x);
  expect(items.map((item) => item.name)).toEqual(['home', 'level', 'theme', 'points', 'shop', 'settings']);
  items.slice(1).forEach((item, index) => expect(item.x).toBeGreaterThanOrEqual(right(items[index])));
});

Then(/^the level number shows (\d+)$/, async ({ page, scenario }, level: string) => {
  expect(await topText(page, scenario, 'level')).toContain(String(level));
});

Then(/^the points show (\d+)$/, async ({ page, scenario }, points: string) => {
  expect(await topText(page, scenario, 'points')).toContain(String(points));
});

Then(/^the rows are (.+) from top to bottom$/, async ({ scenario }, rows: string) => {
  const layout = layoutOf(scenario);
  expect(layout.rows.map((row) => row.word)).toEqual(parseWords(rows));
  layout.rows.slice(1).forEach((row, index) => {
    expect(row.cells[0].y).toBeGreaterThan(layout.rows[index].cells[0].y);
  });
});

Then(/^the screen's centre line falls on the middle of cell (\d+) of (.+)'s row$/, async ({ scenario }, cell: string, word: string) => {
  const layout = layoutOf(scenario);
  expect(centreX(rowOf(layout, word).cells[Number(cell) - 1])).toBeCloseTo(layout.width / 2);
});

Then(/^the screen's centre line falls between cells (\d+) and (\d+) of (.+)'s row$/, async ({ scenario }, left: string, rightCell: string, word: string) => {
  const layout = layoutOf(scenario);
  const row = rowOf(layout, word);
  const middle = (right(row.cells[Number(left) - 1]) + row.cells[Number(rightCell) - 1].x) / 2;
  expect(middle).toBeCloseTo(layout.width / 2);
});

Then(/^its row has (\d+) cells$/, async ({ scenario }, cells: string) => {
  expect(rowOf(layoutOf(scenario), scenario.level.answers[0].word).cells).toHaveLength(Number(cells));
});

Then('every cell and every pool tile is on screen', async ({ scenario }) => {
  expectOnScreen(layoutOf(scenario));
});

Then(/^its row starts as (.+)$/, async ({ scenario }, row: string) => {
  expect(rowText(rowOf(layoutOf(scenario), scenario.level.answers[0].word))).toBe(row);
});

Then('the L is on a revealed-colour tile', async ({ page, scenario }) => {
  const cell = rowOf(layoutOf(scenario), 'LEMUR').cells[0];
  expect(cell.cell).toEqual({ kind: 'revealed', character: 'L' });
  const { tileRevealed, tile, tilePlaced } = viewOf(scenario).colours;
  expect(tileRevealed).not.toBe(tile);
  expect(tileRevealed).not.toBe(tilePlaced);
  const objects = await screen(page);
  expect(tileAt(objects, centreX(cell), centreY(cell))?.fill).toBe(tileRevealed);
  expect(textAt(objects, centreX(cell), centreY(cell))?.text).toBe('L');
});

Then("there's a one-cell gap between HOT and DOG", async ({ scenario }) => {
  const { cells } = rowOf(layoutOf(scenario), 'HOT DOG');
  expect(cells[3].cell).toEqual({ kind: 'special', character: ' ' });
  expect(cells[3].width).toBe(cells[2].width);
});

Then('that gap has no tile and no outline', async ({ page, scenario }) => {
  const drawn = drawnIn(await screen(page), rowOf(layoutOf(scenario), 'HOT DOG').cells[3]);
  expect(drawn.filter((object) => object.kind === 'rect')).toEqual([]);
});

Then('cell 2 shows a hyphen', async ({ scenario }) => {
  expect(rowOf(layoutOf(scenario), 'T-REX').cells[1].cell).toEqual({ kind: 'special', character: '-' });
});

Then('that cell has no tile and no outline', async ({ page, scenario }) => {
  const drawn = drawnIn(await screen(page), rowOf(layoutOf(scenario), 'T-REX').cells[1]);
  expect(drawn.filter((object) => object.kind === 'rect')).toEqual([]);
  expect(drawn.map((object) => object.text)).toEqual(['-']);
});

Then(/^the pool has (\d+) tiles holding (\d+) letters$/, async ({ scenario }, tiles: string, letters: string) => {
  const pool = layoutOf(scenario).poolTiles;
  expect(pool).toHaveLength(Number(tiles));
  expect(pool.reduce((total, tile) => total + tile.count, 0)).toBe(Number(letters));
});

Then('the pool shows these tiles in this order:', async ({ scenario }, table: DataTable) => {
  const expected = table.hashes().map((row) => `${row.tile} ${row.count}`);
  expect(layoutOf(scenario).poolTiles.map(poolText)).toEqual(expected);
});

Then("each pool tile shows its count in its bottom-right corner", async ({ page, scenario }) => {
  const { poolTiles } = layoutOf(scenario);
  expect(poolTiles.length).toBeGreaterThan(0);
  const objects = await screen(page);
  for (const tile of poolTiles) {
    const count = drawnIn(objects, tile).find((object) => object.text === `x${tile.count}`);
    expect(count, `${tile.character}'s count`).toBeDefined();
    expect(count!.x).toBeGreaterThan(centreX(tile));
    expect(count!.y).toBeGreaterThan(tile.y + tile.height / 2);
  }
});

Then(/^the pool order is (.+)$/, async ({ scenario }, order: string) => {
  expect(layoutOf(scenario).poolTiles.map((tile) => tile.character)).toEqual(order.split(', '));
});

Then(/^the pool shows (\S+) x(\d+)$/, async ({ page, scenario }, character: string, count: string) => {
  if (scenario.views.length === 0) scenario.views.push(await open(page, scenario.level, 1, 0));
  const { layout } = await current(page);
  expect(layout.poolTiles.find((tile) => tile.character === character)?.count).toBe(Number(count));
});

Then(/^the pool shows a grey (\S+) x0 tile between (\S+) and (\S+)$/, async ({ page, scenario }, character: string, before: string, after: string) => {
  const tiles = layoutOf(scenario).poolTiles;
  const grey = tiles.find((tile) => tile.character === character)!;
  expect(tileAt(await screen(page), centreX(grey), centreY(grey))?.fill).toBe(viewOf(scenario).colours.tileGrey);
  const index = tiles.findIndex((tile) => tile.character === character);
  expect(tiles[index].count).toBe(0);
  expect(tiles[index - 1].character).toBe(before);
  expect(tiles[index + 1].character).toBe(after);
});

Then('the pool area is the same size in both', async ({ scenario }) => {
  const [first, second] = scenario.views.map((view) => view.layout.poolArea);
  expect(first).toEqual(second);
});

Then('the rows are in the same place in both', async ({ scenario }) => {
  const [first, second] = scenario.views.map((view) => view.layout.rows.map((row) => row.cells[0].y));
  expect(first).toEqual(second);
});

Then('the tiles are the same size in both', async ({ scenario }) => {
  const [first, second] = scenario.views.map((view) => view.layout.tileSize);
  expect(first).toBe(second);
});

Given('a level with 26 pool tiles', async ({ scenario }) => {
  scenario.level = makeLevel(['ABCDEFGH', 'IJKLMNOP', 'QRSTUVWX', 'YZ']);
});

Then(/^the tiles are at least (\d+) pixels wide$/, async ({ scenario }, pixels: string) => {
  expect(layoutOf(scenario).tileSize).toBeGreaterThanOrEqual(Number(pixels));
});

Then('the tiles are the normal size for this screen', async ({ scenario }) => {
  expect(layoutOf(scenario).tileSize).toBe(layoutOf(scenario).usualTileSize);
});

Then('the tiles are smaller than the normal size for this screen', async ({ scenario }) => {
  expect(layoutOf(scenario).tileSize).toBeLessThan(layoutOf(scenario).usualTileSize);
});

Then(/^the pool area has room for (\d+) rows of tiles$/, async ({ scenario }, rows: string) => {
  expect(layoutOf(scenario).poolRows).toBe(Number(rows));
});

Then('the top of the screen fits with nothing overlapping', async ({ scenario }) => {
  const layout = layoutOf(scenario);
  layout.topItems.forEach((item, index) => {
    expect(item.x).toBeGreaterThanOrEqual(0);
    expect(right(item)).toBeLessThanOrEqual(layout.width);
    expect(bottom(item)).toBeLessThanOrEqual(bottom(layout.top));
    layout.topItems.slice(index + 1).forEach((other) => {
      const apart = right(item) <= other.x || right(other) <= item.x || bottom(item) <= other.y || bottom(other) <= item.y;
      expect(apart).toBe(true);
    });
  });
});

Then('the top of the screen uses the tile size', async ({ scenario }) => {
  const layout = layoutOf(scenario);
  expect(layout.topTileSize).toBeGreaterThanOrEqual(layout.tileSize * 0.95);
});

Then('the theme has its own centred line', async ({ scenario }) => {
  const layout = layoutOf(scenario);
  const theme = layout.topItems.find((item) => item.name === 'theme')!;
  expect(centreX(theme)).toBeCloseTo(layout.width / 2);
  layout.topItems.filter((item) => item !== theme).forEach((item) => {
    expect(bottom(item)).toBeLessThanOrEqual(theme.y);
  });
});

Then("there's no highlighted column", async ({ page, scenario }) => {
  expect(layoutOf(scenario)).not.toHaveProperty('column');
  expect((await screen(page)).filter((object) => object.triangles.length > 0)).toEqual([]);
});

Then('there are no row handles', async ({ page, scenario }) => {
  expect(layoutOf(scenario)).not.toHaveProperty('handles');
  // The only graphics in phase one are the Recall All arrows.
  expect((await screen(page)).filter((object) => object.kind === 'graphics')).toHaveLength(1);
});

Then('the level stays exactly as it was', async ({ page, scenario }) => {
  expect(await current(page)).toEqual(scenario.before);
});

Then("the level's data hasn't changed", async ({ scenario }) => {
  expect(viewOf(scenario).level).toEqual(scenario.level);
});

Then(/^the level is redrawn for (\d+×\d+)$/, async ({ scenario }, size: string) => {
  const screen = parseScreen(size);
  expect(layoutOf(scenario).width).toBe(screen.width);
  expect(layoutOf(scenario).height).toBe(screen.height);
});
