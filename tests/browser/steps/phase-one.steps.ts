import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import type { LevelLayout, Rect } from '../../../src/game/layout';
import { levelWithRows, makeLevel } from '../../support/levels';
import { test, type GameView, type Scenario } from './fixtures';
import { drawnIn, outlineOf, screen, startRecording, stopRecording, textAt, tileAt, type Drawn, type Frame } from './probe';
import { current, open } from './story-02.steps';

const { Given, When, Then } = createBdd(test);

export function centreOf(rect: Rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/** Opens the level and applies the set-up steps, once. */
export async function ready(page: Page, scenario: Scenario) {
  if (scenario.views.length === 0) scenario.views.push(await open(page, scenario.level, 1, 0));
  for (const step of scenario.setup.splice(0)) await step(page);
}

export async function layoutNow(page: Page, scenario: Scenario): Promise<LevelLayout> {
  await ready(page, scenario);
  return (await current(page)).layout;
}

export function placeLetter(row: number, cell: number, character: string) {
  return async (page: Page) => {
    await page.evaluate(
      ({ row, cell, character }) => {
        (window as unknown as { wordSlide: { place: (...args: unknown[]) => void } }).wordSlide.place(row, cell, character);
      },
      { row, cell, character },
    );
  };
}

export function rowOf(layout: LevelLayout, word: string): number {
  const row = layout.rows.findIndex((candidate) => candidate.word === word);
  if (row === -1) throw new Error(`No row for ${word}`);
  return row;
}

export function poolTile(layout: LevelLayout, character: string) {
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
export async function hold(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
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

export function themePoint(layout: LevelLayout) {
  return centreOf(layout.topItems.find((item) => item.name === 'theme')!);
}

async function touch(page: Page, scenario: Scenario, type: 'touchStart' | 'touchMove' | 'touchEnd', points: { x: number; y: number }[]) {
  scenario.touch ??= await page.context().newCDPSession(page);
  await scenario.touch.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: points.map((point, id) => ({ ...point, id })),
  });
}

/** The frames recorded so far, once the feedback has had time to play. */
async function recorded(page: Page, scenario: Scenario): Promise<Frame[]> {
  if (!scenario.frames) {
    // Long enough for a letter to land (story 16) and its feedback to finish.
    await page.waitForTimeout(700);
    scenario.frames = await stopRecording(page);
  }
  return scenario.frames;
}

/** The tiles in a row, in one frame. */
function rowTiles(frame: Frame, layout: LevelLayout, row: number): Drawn[] {
  const y = centreOf(layout.rows[row].cells[0]).y;
  return frame.screen.filter((object) => object.kind === 'rect' && object.fill !== null && Math.abs(object.y - y) < 2);
}

async function expectRowColour(page: Page, row: number, fill: number) {
  const { layout } = await current(page);
  const objects = await screen(page);
  for (const cell of layout.rows[row].cells) {
    const { x, y } = centreOf(cell);
    expect(tileAt(objects, x, y)?.fill).toBe(fill);
  }
}

/** Every tile-sized highlight on the screen. */
async function highlightsDrawn(page: Page) {
  const { layout, colours } = await current(page);
  return (await screen(page)).filter(
    (object) => object.kind === 'rect' && object.stroke === colours.highlight && Math.abs(object.width - layout.tileSize) < 2,
  );
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

async function expectHighlight(page: Page, row: number, cell: number) {
  const { highlighted, layout, colours } = await current(page);
  expect(highlighted).toEqual({ kind: 'cell', row, cell });
  expect(outlineOf(await screen(page), layout.rows[row].cells[cell], colours.highlight)).toBeDefined();
}

Then(/^cell (\d+) is highlighted$/, async ({ page }, cell: string) => {
  const { layout } = await current(page);
  await expectHighlight(page, rowOf(layout, 'ZEBRA'), Number(cell) - 1);
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
  await expectHighlight(page, scenario.tileRef!.row, scenario.tileRef!.cell);
});

Then('no cell is highlighted', async ({ page }) => {
  expect((await current(page)).highlighted).toBeNull();
  expect(await highlightsDrawn(page)).toEqual([]);
});

Then(/^the (grey )?Z tile is highlighted$/, async ({ page, scenario }, grey?: string) => {
  if ((await current(page).catch(() => null))?.dragging !== 'Z') {
    await ready(page, scenario);
    await placeLetter(0, 0, 'Z')(page);
    const layout = (await current(page)).layout;
    await hold(page, centreOf(layout.rows[0].cells[0]), centreOf(layout.poolTiles[0]));
  }
  const { highlighted, layout, colours } = await current(page);
  expect(highlighted).toEqual({ kind: 'pool', character: 'Z' });
  const tile = poolTile(layout, 'Z');
  const objects = await screen(page);
  expect(outlineOf(objects, tile, colours.highlight)).toBeDefined();
  if (grey) {
    expect(tile.count).toBe(0);
    expect(tileAt(objects, centreOf(tile).x, centreOf(tile).y)?.fill).toBe(colours.tileGrey);
  }
});

Then('no other tile is highlighted', async ({ page }) => {
  expect(await highlightsDrawn(page)).toHaveLength(1);
});

Then("the Z tile isn't highlighted", async ({ page }) => {
  expect((await current(page)).highlighted).toBeNull();
  expect(await highlightsDrawn(page)).toEqual([]);
});

// Board state

Then(/^cell (\d+) of (.+)'s row holds an? (\S+)$/, async ({ page, scenario }, cell: string, word: string, character: string) => {
  const layout = await layoutNow(page, scenario);
  const target = layout.rows[rowOf(layout, word)].cells[Number(cell) - 1];
  expect(target.cell).toEqual({ kind: 'placed', character });
  expect(textAt(await screen(page), centreOf(target).x, centreOf(target).y)?.text).toBe(character);
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
    const row = (view: GameView) => view.phaseTwo!.rows.find((candidate) => candidate.word === 'LEMUR')!;
    const before = row(await current(page));
    await touch(page, scenario, 'touchMove', [{ x: scenario.touchPoint!.x - 10, y: scenario.touchPoint!.y + 5 }, scenario.secondFinger!]);
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
  const view = await current(page);
  expect(view.dragging).toBeNull();
  if (view.phaseTwo) expect(view.phaseTwo.dragging).toBe(false);
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
  const { recall } = (await current(page)).layout;
  const lines = (await screen(page)).filter((object) => object.kind === 'graphics').flatMap((object) => object.lines);
  const inside = lines.filter((line) => line.x1 >= recall.x && line.x2 <= recall.x + recall.width && line.y1 >= recall.y && line.y2 <= recall.y + recall.height);
  expect(inside).toHaveLength(4);
  // Each arrow is two strokes that meet at a point below their other ends.
  for (const [left, right] of [inside.slice(0, 2), inside.slice(2)]) {
    expect([left.x2, left.y2]).toEqual([right.x1, right.y1]);
    expect(left.y2).toBeGreaterThan(left.y1);
    expect(right.y1).toBeGreaterThan(right.y2);
  }
});

Then('it has no text', async ({ page }) => {
  const { recall } = (await current(page)).layout;
  expect(drawnIn(await screen(page), recall).filter((object) => object.kind === 'text')).toEqual([]);
});

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
  await startRecording(page);
  await fillRow(rowOf(layout, 'ZEBRA'), 'ZEBRE')(page);
  scenario.before = await current(page);
});

Then('the row shakes a little sideways', async ({ page, scenario }) => {
  const { layout } = await current(page);
  const left = centreOf(layout.rows[1].cells[0]).x;
  const offsets = (await recorded(page, scenario)).map((frame) => Math.min(...rowTiles(frame, layout, 1).map((tile) => tile.x)) - left);
  const furthest = Math.max(...offsets.filter(Number.isFinite));
  expect(furthest).toBeGreaterThan(2);
  expect(furthest).toBeLessThan(layout.tileSize / 2);
  expect(offsets[offsets.length - 1]).toBeCloseTo(0);
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
  await startRecording(page);
  await fillRow(1, 'TEAM')(page);
  scenario.before = await current(page);
});

Then('row 1 highlights briefly', async ({ page, scenario }) => {
  const { layout } = await current(page);
  const alphas = (await recorded(page, scenario)).map((frame) => Math.min(...rowTiles(frame, layout, 0).map((tile) => tile.alpha)));
  expect(Math.min(...alphas)).toBeLessThan(0.9);
  expect(alphas[alphas.length - 1]).toBe(1);
});

Then('"Already found" appears on a background in the centre of the screen', async ({ page, scenario }) => {
  const { layout } = await current(page);
  const first = (await recorded(page, scenario)).find((frame) => frame.screen.some((object) => object.text === 'Already found'))!;
  const text = first.screen.find((object) => object.text === 'Already found')!;
  expect(text.x).toBeCloseTo(layout.width / 2);
  expect(Math.abs(text.y - layout.height / 2)).toBeLessThan(3);
  const background = tileAt(first.screen.filter((object) => object.depth === text.depth), text.x, text.y);
  expect(background).toBeDefined();
  expect(background!.width).toBeGreaterThan(text.width);
});

Then('row 2 still reads T E A M', async ({ page }) => {
  const { layout } = await current(page);
  const letters = layout.rows[1].cells.map(({ cell }) => (cell.kind === 'empty' ? '_' : cell.character));
  expect(letters.join(' ')).toBe('T E A M');
});

When('"Already found" appears', async ({ page, scenario }) => {
  await ready(page, scenario);
  await fillRow(1, 'TEAM')(page);
  // The message appears once the last letter has landed (story 16).
  await expect.poll(async () => (await current(page)).foundText).not.toBeNull();
  scenario.before = await current(page);
});

Then('it gently rises and fades out', async ({ page, scenario }) => {
  const first = scenario.before!.foundText!;
  // Watches the message while it exists: once it has gone, there's nothing left to have risen or faded.
  const seen = [first];
  for (let look = 0; look < 100; look++) {
    const { foundText } = await current(page);
    if (!foundText) break;
    seen.push(foundText);
    await page.waitForTimeout(30);
  }
  expect((await current(page)).foundText).toBeNull();
  expect(Math.min(...seen.map((found) => found.y))).toBeLessThan(first.y);
  expect(Math.min(...seen.map((found) => found.alpha))).toBeLessThan(first.alpha);
});

When('LEMUR locks', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  scenario.pulse = { row: rowOf(layout, 'LEMUR'), cells: layout.rows[rowOf(layout, 'LEMUR')].cells.map((_, cell) => cell) };
  await startRecording(page);
  await fillRow(rowOf(layout, 'LEMUR'), 'LEMUR')(page);
});

Then('its row pulses briefly', async ({ page, scenario }) => {
  const { layout } = await current(page);
  const scales = (await recorded(page, scenario)).map((frame) => Math.max(...rowTiles(frame, layout, 0).map((tile) => tile.scale)));
  expect(Math.max(...scales)).toBeGreaterThan(1.02);
  expect(scales[scales.length - 1]).toBe(1);
});

Then(/^all 5 tiles take the locked colour$/, async ({ page, scenario }) => {
  await recorded(page, scenario);
  await recordedColours(page);
});

Then('the L takes the locked colour', async ({ page, scenario }) => {
  await recorded(page, scenario);
  const { layout } = await current(page);
  expect(layout.rows[0].cells[0].cell.kind).toBe('revealed');
  await recordedColours(page);
});

async function recordedColours(page: Page) {
  const { colours } = await current(page);
  await expectRowColour(page, 0, colours.tileLocked);
}

// Tapping and dragging stay separate

When('the player presses and releases a pool tile without moving it', async ({ page, scenario }) => {
  const point = centreOf(poolTile(await layoutNow(page, scenario), 'K'));
  await page.mouse.click(point.x, point.y);
});

Then("its letter goes to ZEBRA's row", async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  expect(layout.rows[rowOf(layout, 'ZEBRA')].cells[0].cell).toEqual({ kind: 'placed', character: 'K' });
});

When('the player presses a pool tile, wobbles less than 15% of a tile and releases it', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  const point = centreOf(poolTile(layout, 'K'));
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + layout.tileSize * 0.1, point.y);
  await page.mouse.up();
});

When('the player presses a pool tile and moves it just over 15% of a tile', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  const point = centreOf(poolTile(layout, 'K'));
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + layout.tileSize * 0.2, point.y);
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

// Split words (D48)

/** The first part's cells in a row: its letters before the first special character. */
function firstPart(layout: LevelLayout, row: number): number[] {
  const cells = layout.rows[row].cells;
  const end = cells.findIndex((cell) => cell.cell.kind === 'special');
  return cells.slice(0, end === -1 ? cells.length : end).map((_, index) => index);
}

function placeFirstPart(word: string, part: string) {
  return async (page: Page) => {
    const { layout } = await current(page);
    const row = rowOf(layout, word);
    const cells = firstPart(layout, row);
    for (const [index, cell] of cells.entries()) await placeLetter(row, cell, part[index])(page);
  };
}

When('the player places H, O and T in the first three cells of HOT DOG\'s row', async ({ page, scenario }) => {
  await ready(page, scenario);
  const { layout } = await current(page);
  scenario.pulse = { row: rowOf(layout, 'HOT DOG'), cells: firstPart(layout, rowOf(layout, 'HOT DOG')) };
  await startRecording(page);
  await placeFirstPart('HOT DOG', 'HOT')(page);
  await page.waitForTimeout(600);
  scenario.frames = await stopRecording(page);
});

/** The cells after the first special character: DOG in HOT DOG. */
function lastPart(layout: LevelLayout, row: number): number[] {
  const cells = layout.rows[row].cells;
  const start = cells.findIndex((cell) => cell.cell.kind === 'special');
  return cells.map((_, index) => index).slice(start + 1);
}

When("the player places D, O and G in the last three cells of HOT DOG's row", async ({ page, scenario }) => {
  await ready(page, scenario);
  const { layout } = await current(page);
  const row = rowOf(layout, 'HOT DOG');
  scenario.pulse = { row, cells: lastPart(layout, row) };
  await startRecording(page);
  for (const [index, cell] of lastPart(layout, row).entries()) await placeLetter(row, cell, 'DOG'[index])(page);
  await page.waitForTimeout(600);
  scenario.frames = await stopRecording(page);
});

Then(/^only (HOT|DOG)'s tiles pulse$/, async ({ page, scenario }, word: string) => {
  const { layout } = await current(page);
  const row = rowOf(layout, 'HOT DOG');
  const part = word === 'HOT' ? firstPart(layout, row) : lastPart(layout, row);
  // The space between the parts isn't a tile: it's left out of both checks.
  const rest = layout.rows[row].cells.flatMap((cell, index) => (part.includes(index) || cell.cell.kind === 'special' ? [] : [index]));
  const scaleAt = (frame: Frame, cell: number) => {
    const { x, y } = centreOf(layout.rows[row].cells[cell]);
    return Math.max(1, ...frame.screen.filter((object) => Math.abs(object.x - x) < 3 && Math.abs(object.y - y) < 3).map((object) => object.scale));
  };
  for (const cell of part) expect(Math.max(...scenario.frames!.map((frame) => scaleAt(frame, cell)))).toBeGreaterThan(1.02);
  for (const cell of rest) expect(Math.max(...scenario.frames!.map((frame) => scaleAt(frame, cell)))).toBeLessThan(1.001);
});

Then("HOT's tiles take the locked colour", async ({ page }) => {
  const { layout, colours } = await current(page);
  const row = rowOf(layout, 'HOT DOG');
  const objects = await screen(page);
  for (const cell of firstPart(layout, row)) {
    const { x, y } = centreOf(layout.rows[row].cells[cell]);
    expect(tileAt(objects, x, y)?.fill).toBe(colours.tileLocked);
  }
});

Given("HOT is locked in HOT DOG's row", async ({ scenario }) => {
  scenario.setup.push(placeFirstPart('HOT DOG', 'HOT'));
});

Then("HOT is still locked in HOT DOG's row", async ({ page }) => {
  const { layout, colours } = await current(page);
  const row = rowOf(layout, 'HOT DOG');
  const objects = await screen(page);
  for (const cell of firstPart(layout, row)) {
    expect(layout.rows[row].cells[cell].cell).toEqual({ kind: 'locked', character: 'HOT'[cell] });
    const { x, y } = centreOf(layout.rows[row].cells[cell]);
    expect(tileAt(objects, x, y)?.fill).toBe(colours.tileLocked);
  }
});

// The lock pulse (story 6, R14) and the split-word shake (R6)

interface PulseSample {
  t: number;
  scale: number;
  fill: number | null;
  x: number;
  y: number;
  letter?: { x: number; y: number };
}

/** Each pulsing cell's tile, frame by frame, found at the cell's resting centre. */
function pulseSamples(frames: Frame[], layout: LevelLayout, row: number, cells: number[]): PulseSample[][] {
  return cells.map((cell) => {
    const { x, y } = centreOf(layout.rows[row].cells[cell]);
    return frames.flatMap((frame) => {
      const near = frame.screen.filter((object) => Math.abs(object.x - x) < 3 && Math.abs(object.y - y) < 3);
      const tile = near.find((object) => object.kind === 'rect' && object.fill !== null);
      if (!tile) return [];
      const letter = near.find((object) => object.kind === 'text');
      return [{ t: frame.t, scale: tile.scale, fill: tile.fill, x: tile.x, y: tile.y, letter: letter && { x: letter.x, y: letter.y } }];
    });
  });
}

async function pulses(page: Page, scenario: Scenario) {
  const frames = await recorded(page, scenario);
  const { layout } = await current(page);
  return pulseSamples(frames, layout, scenario.pulse!.row, scenario.pulse!.cells);
}

function peakOf(samples: PulseSample[]) {
  return samples.reduce((peak, sample, index) => (sample.scale > samples[peak].scale ? index : peak), 0);
}

Then('its tiles keep their colour while they grow', async ({ page, scenario }) => {
  const { colours } = await current(page);
  for (const samples of await pulses(page, scenario)) {
    const growing = samples.slice(0, peakOf(samples)).filter((sample) => sample.scale > 1.001 && sample.scale < 1.12);
    expect(growing.length).toBeGreaterThan(1);
    growing.forEach((sample) => expect(sample.fill).not.toBe(colours.tileLocked));
  }
});

Then('they take the locked colour at their biggest', async ({ page, scenario }) => {
  const { colours } = await current(page);
  for (const samples of await pulses(page, scenario)) {
    const peak = peakOf(samples);
    samples.slice(peak).forEach((sample) => expect(sample.fill).toBe(colours.tileLocked));
  }
});

Then(/^its tiles grow 15% in about 0\.15 seconds$/, async ({ page, scenario }) => {
  for (const samples of await pulses(page, scenario)) {
    const peak = peakOf(samples);
    const start = samples.findIndex((sample) => sample.scale > 1.001);
    expect(samples[peak].scale).toBeGreaterThan(1.13);
    expect(samples[peak].scale).toBeLessThan(1.16);
    expect(samples[peak].t - samples[start].t).toBeGreaterThan(90);
    expect(samples[peak].t - samples[start].t).toBeLessThan(230);
  }
});

Then(/^they shrink back in about 0\.2 seconds$/, async ({ page, scenario }) => {
  for (const samples of await pulses(page, scenario)) {
    const peak = peakOf(samples);
    const end = samples.findIndex((sample, index) => index > peak && sample.scale <= 1.001);
    expect(end).toBeGreaterThan(peak);
    expect(samples[end].t - samples[peak].t).toBeGreaterThan(140);
    expect(samples[end].t - samples[peak].t).toBeLessThan(300);
  }
});

Then('each tile and its letter keep their centre while they pulse', async ({ page, scenario }) => {
  const { layout } = await current(page);
  const all = await pulses(page, scenario);
  all.forEach((samples, index) => {
    const { x, y } = centreOf(layout.rows[scenario.pulse!.row].cells[scenario.pulse!.cells[index]]);
    expect(samples.some((sample) => sample.scale > 1.1)).toBe(true);
    for (const sample of samples) {
      expect(Math.abs(sample.x - x)).toBeLessThan(0.5);
      expect(Math.abs(sample.y - y)).toBeLessThan(0.5);
      expect(Math.abs(sample.letter!.x - x)).toBeLessThan(0.5);
      expect(Math.abs(sample.letter!.y - y)).toBeLessThan(0.5);
    }
  });
});

When("the player fills HOT DOG's row with HON DOG", async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  await startRecording(page);
  await fillRow(rowOf(layout, 'HOT DOG'), 'HON DOG')(page);
});

Then('DOG locks', async ({ page }) => {
  const { layout } = await current(page);
  const row = layout.rows[rowOf(layout, 'HOT DOG')];
  expect(row.cells.slice(4).map((cell) => cell.cell)).toEqual([...'DOG'].map((character) => ({ kind: 'locked', character })));
});

Then("only HON's tiles shake", async ({ page, scenario }) => {
  const frames = await recorded(page, scenario);
  const { layout } = await current(page);
  const row = rowOf(layout, 'HOT DOG');
  const movement = (cell: number) => {
    const { x, y } = centreOf(layout.rows[row].cells[cell]);
    // Letters still flying in (story 16) aren't the row's tiles: they're drawn at depth 8.
    const xs = frames.flatMap((frame) => frame.screen.filter((object) => object.kind === 'rect' && object.fill !== null && object.depth !== 8 && Math.abs(object.y - y) < 3 && Math.abs(object.x - x) < layout.tileSize / 2).map((object) => object.x));
    return Math.max(...xs) - Math.min(...xs);
  };
  for (const cell of [0, 1, 2]) expect(movement(cell)).toBeGreaterThan(2);
  for (const cell of [4, 5, 6]) expect(movement(cell)).toBeLessThan(0.5);
  const space = centreOf(layout.rows[row].cells[3]);
  const atSpace = frames.flatMap((frame) => frame.screen.filter((object) => object.depth !== 8 && object.kind !== 'bevel' && Math.abs(object.y - space.y) < 3 && Math.abs(object.x - space.x) < layout.tileSize / 2));
  expect(atSpace.every((object) => Math.abs(object.x - space.x) < 0.5)).toBe(true);
});
