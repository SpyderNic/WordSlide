import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { When, Then } = createBdd();

const errors = new WeakMap<object, string[]>();

When('the game opens', async ({ page }) => {
  const seen: string[] = [];
  errors.set(page, seen);
  page.on('pageerror', (error) => seen.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') seen.push(message.text());
  });
  await page.goto('/');
  await page.waitForFunction(() => (window as unknown as { wordSlideReady?: boolean }).wordSlideReady === true);
});

When('the player types L on the keyboard', async ({ page }) => {
  await page.keyboard.press('l');
});

Then('the first row shows L', async ({ page }) => {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const game = (window as unknown as { wordSlide: { view: () => { layout: { rows: { cells: { cell: unknown }[] }[] } } } }).wordSlide;
        return game.view().layout.rows[0].cells[0].cell;
      }),
    )
    .toEqual({ kind: 'placed', character: 'L' });
});

Then('the screen fills the window', async ({ page }) => {
  const box = await page.locator('canvas').boundingBox();
  expect(box).toMatchObject({ x: 0, y: 0, width: 800, height: 450 });
});

Then('there are no errors', async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});
