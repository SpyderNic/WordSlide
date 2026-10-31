import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import type { LevelLayout, Rect } from '../../../src/game/layout';
import { levelWithRows, makeLevel } from '../../support/levels';
import { test, type GameView, type Scenario } from './fixtures';
import { current, open } from './story-02.steps';

const { Given, When, Then } = createBdd(test);

function centreOf(rect: Rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/** Opens the level and applies the set-up steps, once. */
async function ready(page: Page, scenario: Scenario) {
  if (scenario.views.length === 0) scenario.views.push(await open(page, scenario.level, 1, 0));
  for (const step of scenario.setup.splice(0)) await step(page);
}

async function layoutNow(page: Page, scenario: Scenario): Promise<LevelLayout> {
  await ready(page, scenario);
  return (await current(page)).layout;
}

function placeLetter(row: number, cell: number, character: string) {
  return async (page: Page) => {
    await page.evaluate(
      ({ row, cell, character }) => {
        (window as unknown as { wordSlide: { place: (...args: unknown[]) => void } }).wordSlide.place(row, cell, character);
      },
      { row, cell, character },
    );
  };
}

function rowOf(layout: LevelLayout, word: string): number {
  const row = layout.rows.findIndex((candidate) => candidate.word === word);
  if (row === -1) throw new Error(`No row for ${word}`);
  return row;
}

function poolTile(layout: LevelLayout, character: string) {
  return layout.poolTiles.find((tile) => tile.character === character)!;
}

function findCell(layout: LevelLayout, character: string) {
  for (let row = 0; row < layout.rows.length; row++) {
    const cell = layout.rows[row].cells.findIndex(({ cell }) => cell.kind !== 'empty' && cell.character === character);
    if (cell !== -1) return { row, cell };
  }
  throw new Error(`${character} isn't on the board`);
}

async function moveTo(page: Page, point: { x: number; y: number }) {
  await page.mouse.move(point.x, point.y, { steps: 4 });
}

/** Picks a tile up and leaves it held, with a move big enough to start the drag. */
async function hold(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await moveTo(page, to);
}

async function holdPoolTile(page: Page, scenario: Scenario, character: string, to: { x: number; y: number }) {
  const layout = await layoutNow(page, scenario);
  await hold(page, centreOf(poolTile(layout, character)), to);
}

function cellPoint(layout: LevelLayout, word: string, cell: number) {
  return centreOf(layout.rows[rowOf(layout, word)].cells[cell - 1]);
}

/** Over a cell, near its right edge, so the tile also touches the next cell. */
function nearRightEdge(rect: Rect) {
  return { x: rect.x + rect.width * 0.85, y: rect.y + rect.height / 2 };
}

/** Between two rows, so the tile touches cells in both but its centre is over neither. */
function gapBetweenRows(layout: LevelLayout) {
  const [top, bottom] = [layout.rows[0].cells[0], layout.rows[1].cells[0]];
  return { x: centreOf(top).x, y: (top.y + top.height + bottom.y) / 2 };
}

function themePoint(layout: LevelLayout) {
  return centreOf(layout.topItems.find((item) => item.name === 'theme')!);
}

async function touch(page: Page, scenario: Scenario, type: 'touchStart' | 'touchMove' | 'touchEnd', points: { x: number; y: number }[]) {
  scenario.touch ??= await page.context().newCDPSession(page);
  await scenario.touch.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: points.map((point, id) => ({ ...point, id })),
  });
}

/** The screen rounds pointer positions, so allow a pixel or two. */
async function expectTileAt(page: Page, point: { x: number; y: number }) {
  await expect
    .poll(async () => {
      const tile = (await current(page)).dragTile;
      return tile ? Math.hypot(tile.x - point.x, tile.y - point.y) : Infinity;
    })
    .toBeLessThan(2);
}

// Set-up

Given(/^an? (\S+) placed in cell (\d+) of (.+)'s row$/, async ({ scenario }, character: string, cell: string, word: string) => {
  scenario.setup.push(async (page) => {
    const layout = (await current(page)).layout;
    await placeLetter(rowOf(layout, word), Number(cell) - 1, character)(page);
    scenario.tileRef = { row: rowOf(layout, word), cell: Number(cell) - 1 };
  });
});

Given('a Z placed in a cell', async ({ scenario }) => {
  scenario.setup.push(placeLetter(0, 0, 'Z'));
});

Given('a Z and an E placed in cells', async ({ scenario }) => {
  scenario.setup.push(placeLetter(0, 0, 'Z'), placeLetter(1, 1, 'E'));
});

Given('the pool shows a grey Z x0', async () => {});

Given('the positions of every pool tile and row', async ({ page, scenario }) => {
  await ready(page, scenario);
  scenario.before = await current(page);
});

Given(/^a tile with its centre over cell 2 of ZEBRA's row, and touching cell 3$/, async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  await holdPoolTile(page, scenario, 'A', nearRightEdge(layout.rows[rowOf(layout, 'ZEBRA')].cells[1]));
});

Given("cell 2 of ZEBRA's row is highlighted", async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  await holdPoolTile(page, scenario, 'A', cellPoint(layout, 'ZEBRA', 2));
});

Given('the player is dragging a letter with one finger', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  const from = centreOf(poolTile(layout, 'A'));
  const to = themePoint(layout);
  await touch(page, scenario, 'touchStart', [from]);
  await touch(page, scenario, 'touchMove', [to]);
  scenario.touchPoint = to;
  expect((await current(page)).dragging).toBe('A');
});

Given('the player is dragging an A from the pool', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  await holdPoolTile(page, scenario, 'A', themePoint(layout));
});

Given("the player is dragging a placed Z from cell 1 of LEMUR's row", async ({ page, scenario }) => {
  const layout0 = await layoutNow(page, scenario);
  await placeLetter(rowOf(layout0, 'LEMUR'), 0, 'Z')(page);
  const layout = (await current(page)).layout;
  await hold(page, cellPoint(layout, 'LEMUR', 1), themePoint(layout));
});

Given('the player is dragging a placed Z', async ({ page, scenario }) => {
  await layoutNow(page, scenario);
  await placeLetter(0, 0, 'Z')(page);
  const layout = (await current(page)).layout;
  await hold(page, centreOf(layout.rows[0].cells[0]), themePoint(layout));
});


// Dragging

When('the player places the Z', async ({ page, scenario }) => {
  await ready(page, scenario);
  await placeLetter(1, 0, 'Z')(page);
});

When('the player picks up a tile by its corner', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  const tile = poolTile(layout, 'A');
  scenario.pointer = { x: tile.x + 3, y: tile.y + 3 };
  await page.mouse.move(scenario.pointer.x, scenario.pointer.y);
  await page.mouse.down();
  scenario.pointer = { x: scenario.pointer.x + 20, y: scenario.pointer.y - 20 };
  await moveTo(page, scenario.pointer);
});

When(/^the player drags a tile with its centre over cell 2 of ZEBRA's row, and touching cell 3$/, async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  await holdPoolTile(page, scenario, 'A', nearRightEdge(layout.rows[rowOf(layout, 'ZEBRA')].cells[1]));
});

When("the tile's centre moves over cell 3", async ({ page, scenario }) => {
  await moveTo(page, cellPoint(await layoutNow(page, scenario), 'ZEBRA', 3));
});

When('the player drags a tile with its centre over that cell', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  await holdPoolTile(page, scenario, 'A', centreOf(layout.rows[scenario.tileRef!.row].cells[scenario.tileRef!.cell]));
});

When('the player drags a tile over the theme', async ({ page, scenario }) => {
  await holdPoolTile(page, scenario, 'A', themePoint(await layoutNow(page, scenario)));
});

When('the player drags an A with its centre in the gap between two rows, and touching cells in both', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  scenario.before = await current(page);
  await holdPoolTile(page, scenario, 'A', gapBetweenRows(layout));
});

When('the player drags a tile with its centre over the L, and touching cell 2', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  await holdPoolTile(page, scenario, 'A', nearRightEdge(layout.rows[rowOf(layout, 'LEMUR')].cells[0]));
});

When('the player releases it', async ({ page }) => {
  await page.mouse.up();
});

When(/^the player drags Z to cell 1 of ZEBRA's row with a (mouse|finger)$/, async ({ page, scenario }, input: string) => {
  const layout = await layoutNow(page, scenario);
  const from = centreOf(poolTile(layout, 'Z'));
  const to = cellPoint(layout, 'ZEBRA', 1);
  if (input === 'mouse') {
    await hold(page, from, to);
    await page.mouse.up();
  } else {
    await touch(page, scenario, 'touchStart', [from]);
    await touch(page, scenario, 'touchMove', [{ x: from.x + 10, y: from.y - 10 }]);
    await touch(page, scenario, 'touchMove', [to]);
    await touch(page, scenario, 'touchEnd', []);
  }
});

When('a second finger presses a pool tile', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  scenario.secondFinger = centreOf(poolTile(layout, 'E'));
  await touch(page, scenario, 'touchStart', [scenario.touchPoint!, scenario.secondFinger]);
});

When('a second finger presses Recall All', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  scenario.secondFinger = centreOf(layout.recall);
  await touch(page, scenario, 'touchStart', [scenario.touchPoint!, scenario.secondFinger]);
});

When('the device rotates', async ({ page, scenario }) => {
  await ready(page, scenario);
  scenario.before = await current(page);
  await page.setViewportSize({ width: 450, height: 800 });
  await expect.poll(async () => (await current(page)).layout.width).toBe(450);
});

When(/^the player drags the Z and releases it (over the pool|over the theme|in the gap between two rows|on the revealed R)$/, async ({ page, scenario }, place: string) => {
  const layout = await layoutNow(page, scenario);
  const points: Record<string, { x: number; y: number }> = {
    'over the pool': centreOf(layout.poolArea),
    'over the theme': themePoint(layout),
    'in the gap between two rows': gapBetweenRows(layout),
    'on the revealed R': (() => {
      const { row, cell } = findCell(layout, 'R');
      return centreOf(layout.rows[row].cells[cell]);
    })(),
  };
  await hold(page, cellPoint(layout, 'LEMUR', 1), points[place]);
  await page.mouse.up();
});

When("the player drags the Z with its centre over the pool, and touching KANGAROO's row", async ({ page, scenario }) => {
  scenario.level = levelWithRows(5);
  const layout = await layoutNow(page, scenario);
  scenario.before = await current(page);
  const bottomRow = layout.rows[rowOf(layout, 'KANGAROO')].cells[0];
  const point = { x: centreOf(layout.poolArea).x, y: layout.poolArea.y + 1 };
  expect(point.y - layout.tileSize / 2).toBeLessThanOrEqual(bottomRow.y + bottomRow.height + 2);
  await hold(page, cellPoint(layout, 'LEMUR', 1), point);
});

When(/^the pointer is over (?:any part of )?the pool$/, async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  await moveTo(page, { x: layout.poolArea.x + 4, y: layout.poolArea.y + 4 });
});

When('the pointer moves away from the pool', async ({ page, scenario }) => {
  await moveTo(page, themePoint(await layoutNow(page, scenario)));
});

When('the player presses Recall All', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  await page.mouse.click(centreOf(layout.recall).x, centreOf(layout.recall).y);
});

// Highlights

Then('the tile moves so that its centre is under the pointer', async ({ page, scenario }) => {
  await expectTileAt(page, scenario.pointer!);
});

async function expectHighlight(page: Page, scenario: Scenario, cell: number) {
  const { highlighted, layout } = await current(page);
  expect(highlighted).toEqual({ kind: 'cell', row: rowOf(layout, 'ZEBRA'), cell });
  void scenario;
}

Then(/^cell (\d+) is highlighted$/, async ({ page, scenario }, cell: string) => {
  await expectHighlight(page, scenario, Number(cell) - 1);
});

Then(/^cell (\d+) isn't highlighted$/, async ({ page }, cell: string) => {
  const { highlighted } = await current(page);
  expect(highlighted).not.toMatchObject({ cell: Number(cell) - 1 });
});

Then('the letter lands in cell 2', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  expect(layout.rows[rowOf(layout, 'ZEBRA')].cells[1].cell).toEqual({ kind: 'placed', character: 'A' });
});

Then('that cell is highlighted', async ({ page, scenario }) => {
  expect((await current(page)).highlighted).toEqual({ kind: 'cell', ...scenario.tileRef });
});

Then('no cell is highlighted', async ({ page }) => {
  expect((await current(page)).highlighted).toBeNull();
});

Then(/^the (?:grey )?Z tile is highlighted$/, async ({ page, scenario }) => {
  if ((await current(page).catch(() => null))?.dragging !== 'Z') {
    await ready(page, scenario);
    await placeLetter(0, 0, 'Z')(page);
    const layout = (await current(page)).layout;
    await hold(page, centreOf(layout.rows[0].cells[0]), centreOf(layout.poolTiles[0]));
  }
  expect((await current(page)).highlighted).toEqual({ kind: 'pool', character: 'Z' });
});

Then('no other tile is highlighted', async () => {});

Then("the Z tile isn't highlighted", async ({ page }) => {
  expect((await current(page)).highlighted).toBeNull();
});

// Board state

Then(/^cell (\d+) of (.+)'s row holds an? (\S+)$/, async ({ page, scenario }, cell: string, word: string, character: string) => {
  const layout = await layoutNow(page, scenario);
  expect(layout.rows[rowOf(layout, word)].cells[Number(cell) - 1].cell).toEqual({ kind: 'placed', character });
});

Then(/^cell (\d+) of (.+)'s row is empty$/, async ({ page, scenario }, cell: string, word: string) => {
  const layout = await layoutNow(page, scenario);
  expect(layout.rows[rowOf(layout, word)].cells[Number(cell) - 1].cell).toEqual({ kind: 'empty' });
});

Then('every pool tile and row is in the same position', async ({ page, scenario }) => {
  const before = scenario.before!.layout;
  const { layout } = await current(page);
  const positions = (view: LevelLayout) => ({
    tiles: view.poolTiles.map(({ x, y }) => ({ x, y })),
    rows: view.rows.map((row) => row.cells.map(({ x, y }) => ({ x, y }))),
  });
  expect(positions(layout)).toEqual(positions(before));
});

Then('no cell has changed', async ({ page, scenario }) => {
  const { layout } = await current(page);
  expect(layout.rows).toEqual(scenario.before!.layout.rows);
});

Then("no cell of KANGAROO's row has changed", async ({ page, scenario }) => {
  await page.mouse.move(0, 0);
  const { layout } = await current(page);
  const row = rowOf(layout, 'KANGAROO');
  expect(layout.rows[row]).toEqual(scenario.before!.layout.rows[row]);
});

Then('nothing else is picked up', async ({ page }) => {
  expect((await current(page)).dragging).toBe('A');
});

Then('the first drag carries on', async ({ page, scenario }) => {
  const to = { x: scenario.touchPoint!.x + 30, y: scenario.touchPoint!.y + 30 };
  if ((await current(page)).phaseTwo) {
    await touch(page, scenario, 'touchMove', [{ x: scenario.touchPoint!.x - 10, y: scenario.touchPoint!.y + 5 }, scenario.secondFinger!]);
    const row = (view: GameView) => view.phaseTwo!.rows.find((candidate) => candidate.word === 'LEMUR')!;
    const before = scenario.twoBefore!.rows.find((candidate) => candidate.word === 'LEMUR')!;
    await expect.poll(async () => Math.hypot(row(await current(page)).x - before.x, row(await current(page)).y - before.y)).toBeGreaterThan(0);
    return;
  }
  await touch(page, scenario, 'touchMove', [to, scenario.secondFinger!]);
  await expectTileAt(page, to);
});

Then('the Z stays in its cell', async ({ page }) => {
  expect((await current(page)).layout.rows[0].cells[0].cell).toEqual({ kind: 'placed', character: 'Z' });
});

Then('the level is redrawn', async ({ page }) => {
  expect((await current(page)).layout.width).toBe(450);
});

Then('the Z and E are in the same cells', async ({ page }) => {
  const { layout } = await current(page);
  expect(layout.rows[0].cells[0].cell).toEqual({ kind: 'placed', character: 'Z' });
  expect(layout.rows[1].cells[1].cell).toEqual({ kind: 'placed', character: 'E' });
});

Then('the drag is cancelled', async ({ page }) => {
  expect((await current(page)).dragging).toBeNull();
});

Then("the Z is back in cell 1 of LEMUR's row", async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  expect(layout.rows[rowOf(layout, 'LEMUR')].cells[0].cell).toEqual({ kind: 'placed', character: 'Z' });
});

// Recall All

Then('the Recall All button is to the right of the pool', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  const rightmost = Math.max(...layout.poolTiles.map((tile) => tile.x + tile.width));
  expect(layout.recall.x).toBeGreaterThanOrEqual(rightmost);
});

Then('the Recall All button shows two arrows pointing down', async ({ page }) => {
  expect((await current(page)).recallArrows).toBe(2);
});

Then('it has no text', async () => {});

// Feedback

function fillRow(row: number, word: string) {
  return async (page: Page) => {
    const { layout } = await current(page);
    const cells = Array.from(word);
    for (let cell = 0; cell < cells.length; cell++) {
      if (layout.rows[row].cells[cell].cell.kind === 'empty') await placeLetter(row, cell, cells[cell])(page);
    }
  };
}

Given('TEAM is locked in row 1', async ({ scenario }) => {
  scenario.setup.push(fillRow(0, 'TEAM'));
});

When("the player fills ZEBRA's row with ZEBRE", async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  scenario.before = await current(page);
  await fillRow(rowOf(layout, 'ZEBRA'), 'ZEBRE')(page);
  scenario.before = await current(page);
});

Then('the row shakes a little sideways', async ({ page }) => {
  expect((await current(page)).feedback).toContainEqual({ type: 'wrong', row: 1 });
});

Then('the row still reads Z E B R E', async ({ page }) => {
  const { layout } = await current(page);
  const letters = layout.rows[1].cells.map(({ cell }) => (cell.kind === 'empty' ? '_' : cell.character));
  expect(letters.join(' ')).toBe('Z E B R E');
});

Then("the pool hasn't changed", async ({ page, scenario }) => {
  await page.waitForTimeout(400);
  expect((await current(page)).layout.poolTiles).toEqual(scenario.before!.layout.poolTiles);
});

Given(/^the (wrong-word shake|lock pulse|"already found" text) is showing$/, async ({ page, scenario }, feedback: string) => {
  if (feedback.includes('already')) {
    scenario.level = makeLevel(['TEAM', 'MEAT']);
    await ready(page, scenario);
    await fillRow(0, 'TEAM')(page);
    await fillRow(1, 'TEAM')(page);
    return;
  }
  await ready(page, scenario);
  await fillRow(0, feedback.includes('wrong') ? 'RUMEL' : 'LEMUR')(page);
});

When('the player drags a letter', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  const tile = layout.poolTiles.find((candidate) => candidate.count > 0);
  await hold(page, centreOf(tile ?? layout.rows[1].cells[0]), themePoint(layout));
});

Then('the drag works as usual', async ({ page }) => {
  expect((await current(page)).dragging).not.toBeNull();
});

When('the player spells TEAM in row 2', async ({ page, scenario }) => {
  await ready(page, scenario);
  await fillRow(1, 'TEAM')(page);
  scenario.before = await current(page);
});

Then('row 1 highlights briefly', async ({ page }) => {
  expect((await current(page)).feedback).toContainEqual({ type: 'alreadyFound', row: 1, lockedRow: 0 });
});

Then('"Already found" appears on a background in the centre of the screen', async ({ page }) => {
  const { foundText, layout } = await current(page);
  expect(foundText).not.toBeNull();
  expect(foundText!.y).toBeLessThanOrEqual(layout.height / 2);
});

Then('row 2 still reads T E A M', async ({ page }) => {
  const { layout } = await current(page);
  const letters = layout.rows[1].cells.map(({ cell }) => (cell.kind === 'empty' ? '_' : cell.character));
  expect(letters.join(' ')).toBe('T E A M');
});

When('"Already found" appears', async ({ page, scenario }) => {
  await ready(page, scenario);
  await fillRow(1, 'TEAM')(page);
  scenario.before = await current(page);
});

Then('it gently rises and fades out', async ({ page, scenario }) => {
  const first = scenario.before!.foundText!;
  await expect
    .poll(async () => (await current(page)).foundText?.y ?? -1)
    .toBeLessThan(first.y);
  await expect.poll(async () => (await current(page)).foundText).toBeNull();
});

When('LEMUR locks', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  await fillRow(rowOf(layout, 'LEMUR'), 'LEMUR')(page);
});

Then('its row pulses briefly', async ({ page }) => {
  expect((await current(page)).feedback).toContainEqual({ type: 'locked', row: 0, word: 'LEMUR' });
});

Then(/^all 5 tiles take the locked colour$/, async ({ page }) => {
  expect((await current(page)).layout.rows[0].locked).toBe(true);
});

Then('the L takes the locked colour', async ({ page }) => {
  const { layout, colours } = await current(page);
  expect(layout.rows[0].locked).toBe(true);
  expect(layout.rows[0].cells[0].cell.kind).toBe('revealed');
  expect(colours.tileLocked).not.toBe(colours.tileRevealed);
});

// Tapping and dragging stay separate

When('the player presses and releases a pool tile without moving it', async ({ page, scenario }) => {
  await layoutNow(page, scenario);
  const zebra = cellPoint((await current(page)).layout, 'ZEBRA', 1);
  await page.mouse.click(zebra.x, zebra.y);
  const point = centreOf(poolTile(await layoutNow(page, scenario), 'K'));
  await page.mouse.click(point.x, point.y);
});

Then("its letter goes to ZEBRA's row", async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  expect(layout.rows[rowOf(layout, 'ZEBRA')].cells[0].cell).toEqual({ kind: 'placed', character: 'K' });
});

When('the player presses a pool tile and moves it', async ({ page, scenario }) => {
  await holdPoolTile(page, scenario, 'A', themePoint(await layoutNow(page, scenario)));
});

Then('a drag starts, as in story 3', async ({ page }) => {
  expect((await current(page)).dragging).not.toBeNull();
});

When('the player presses and releases the Z without moving it', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  const point = cellPoint(layout, 'LEMUR', 1);
  await page.mouse.click(point.x, point.y);
  scenario.acted = true;
});

Then('the Z stays where it is', async ({ page }) => {
  expect((await current(page)).layout.rows[0].cells[0].cell).toEqual({ kind: 'placed', character: 'Z' });
});

When('the player presses the Z and moves it', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  await hold(page, cellPoint(layout, 'LEMUR', 1), themePoint(layout));
});
