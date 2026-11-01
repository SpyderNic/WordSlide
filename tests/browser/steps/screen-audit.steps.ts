import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import type { LevelLayout, Rect } from '../../../src/game/layout';
import { test, type GameView } from './fixtures';
import { screen, textAt, tileAt } from './probe';
import { current, open } from './story-02.steps';

const { Given, When, Then } = createBdd(test);

function centre(rect: Rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function zTile(layout: LevelLayout) {
  return layout.poolTiles.find((tile) => tile.character === 'Z')!;
}

async function fillAt(page: Parameters<typeof screen>[0], rect: Rect) {
  const { x, y } = centre(rect);
  return tileAt(await screen(page), x, y)?.fill;
}

Given('the player is holding the Z from the pool', async ({ page, scenario }) => {
  scenario.views.push(await open(page, scenario.level, 1, 0));
  const { layout } = await current(page);
  const { x, y } = centre(zTile(layout));
  scenario.pointer = { x: x - 60, y: y - 60 };
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(scenario.pointer.x, scenario.pointer.y, { steps: 4 });
});

When("the player clicks a cell of ZEBRA's row", async ({ page, scenario }) => {
  const { layout } = await current(page);
  const { x, y } = centre(layout.rows.find((row) => row.word === 'ZEBRA')!.cells[0]);
  await page.mouse.click(x, y);
  scenario.acted = true;
});

Then('the Z tile is drawn grey', async ({ page }) => {
  const { layout, colours }: GameView = await current(page);
  expect(await fillAt(page, zTile(layout))).toBe(colours.tileGrey);
});

Then('the Z tile is drawn in its ordinary colour', async ({ page }) => {
  const { layout, colours }: GameView = await current(page);
  expect(await fillAt(page, zTile(layout))).toBe(colours.tile);
});

Then('the Recall All button is drawn grey', async ({ page }) => {
  const { layout, colours }: GameView = await current(page);
  expect(await fillAt(page, layout.recall)).toBe(colours.tileGrey);
});

Then('the Recall All button is drawn in its ordinary colour', async ({ page }) => {
  const { layout, colours }: GameView = await current(page);
  expect(await fillAt(page, layout.recall)).toBe(colours.tile);
});

Then('no row is drawn as selected', async ({ page }) => {
  const { layout, colours }: GameView = await current(page);
  const wide = (await screen(page)).filter(
    (object) => object.kind === 'rect' && object.stroke === colours.highlight && object.width > layout.tileSize * 1.5,
  );
  expect(wide).toEqual([]);
});

Then('a tile showing Z is under the pointer', async ({ page, scenario }) => {
  const objects = await screen(page);
  const { x, y } = scenario.pointer!;
  expect(textAt(objects, x, y, 3)?.text).toBe('Z');
});
