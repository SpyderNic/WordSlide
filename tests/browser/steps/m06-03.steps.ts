import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import type { LevelLayout } from '../../../src/game/layout';
import { makeLevel, reveal } from '../../support/levels';
import { test, type Scenario } from './fixtures';
import { centreOf, hold, layoutNow, placeLetter, poolTile, rowOf } from './phase-one.steps';
import { screen, startRecording, stopRecording, tileAt, type Drawn, type Frame } from './probe';
import { current } from './m02-02.steps';
import { handPath, visits } from './m05-03.steps';

const { Given, When, Then } = createBdd(test);

/** A faded row's tiles show at about half strength (Q8). */
const FADED = 0.5;

// The level and its pools

Given(/^(LEMUR) with (\w) revealed at position (\d+)$/, async ({ scenario }, word: string, letter: string, position: string) => {
  reveal(scenario.level, word, letter, Number(position));
});

Given('a level with the answers MEAT and TEAM', async ({ scenario }) => {
  // In length order, then alphabetical, the rows are MEAT, TEAM (D5).
  scenario.level = makeLevel(['MEAT', 'TEAM'], 'EA');
});

/** "A x2, G, K" or "M, R, U, with E and L as x0": every tile, in order, with its count. */
function expectedPool(text: string): string[] {
  const [listed, empty] = text.split(/, with /);
  const tiles = listed.split(', ').map((item) => {
    const [character, count] = item.split(' x');
    return { character, count: Number(count ?? 1) };
  });
  for (const character of empty ? empty.replace(/ as x0$/, '').split(/, | and /) : []) tiles.push({ character, count: 0 });
  return tiles.sort((a, b) => a.character.localeCompare(b.character)).map((tile) => `${tile.character}x${tile.count}`);
}

// A list of two tiles or more, so M02-02's "the pool shows A x3" stays its own.
Then(/^the pool shows ([A-Z](?: x\d+)?(?:, [A-Z](?: x\d+)?)+(?:, with .+ as x0)?)$/, async ({ page, scenario }, text: string) => {
  await layoutNow(page, scenario);
  // Allow the pool's change to finish (Q3).
  await page.waitForTimeout(350);
  const { layout } = await current(page);
  expect(layout.poolTiles.map((tile) => `${tile.character}x${tile.count}`)).toEqual(expectedPool(text));
  // And it's what's drawn: each tile's letter is on screen at its place.
  const objects = await screen(page);
  for (const tile of layout.poolTiles) {
    const { x, y } = centreOf(tile);
    expect(objects.some((object) => object.kind === 'text' && object.text === tile.character && Math.abs(object.x - x) < tile.width / 2 && Math.abs(object.y - y) < tile.height / 2 && object.alpha > 0.9)).toBe(true);
  }
});

Then("the pool's E tile is grey and shows x0", async ({ page }) => {
  await page.waitForTimeout(400);
  const { layout, colours } = await current(page);
  const tile = poolTile(layout, 'E');
  expect(tile.count).toBe(0);
  const objects = await screen(page);
  const { x, y } = centreOf(tile);
  expect(tileAt(objects, x, y)?.fill).toBe(colours.tileGrey);
  expect(objects.some((object) => object.kind === 'text' && object.text === 'x0' && Math.abs(object.x - x) < tile.width / 2 && Math.abs(object.y - y) < tile.height / 2)).toBe(true);
});

// Selecting rows

async function tapRow(page: Page, scenario: Scenario, word: string) {
  const layout = await layoutNow(page, scenario);
  const row = layout.rows[rowOf(layout, word)];
  // An empty cell if there is one, so the tap selects the row and picks nothing up.
  const cell = row.cells.find(({ cell }) => cell.kind === 'empty') ?? row.cells[0];
  const { x, y } = centreOf(cell);
  await page.mouse.click(x, y);
}

When(/^the player (?:selects|taps) (\w+)'s row$/, async ({ page, scenario }, word: string) => {
  await layoutNow(page, scenario);
  scenario.acted = true;
  scenario.before = await current(page);
  await startRecording(page);
  await tapRow(page, scenario, word);
  await page.waitForTimeout(500);
  scenario.frames = await stopRecording(page);
  // Steps that read the screen as last seen see the new pool.
  scenario.views.push(await current(page));
});

When(/^the player selects (\w+)'s row, then (\w+)'s row again$/, async ({ page, scenario }, first: string, second: string) => {
  scenario.acted = true;
  await tapRow(page, scenario, first);
  await page.waitForTimeout(350);
  await tapRow(page, scenario, second);
});

/** M06-03's own check: its rows are FOX and OWL as well as the test level's. */
export async function expectSelected(page: Page, word: string) {
  const { layout, markedRow } = await current(page);
  expect(markedRow).not.toBeNull();
  expect(layout.rows[markedRow!].word).toBe(word);
}

Then(/^(FOX|OWL)'s row is selected$/, async ({ page, scenario }, word: string) => {
  await layoutNow(page, scenario);
  await expectSelected(page, word);
});

Then(/^(\w+)'s row isn't selected$/, async ({ page }, word: string) => {
  const { layout, markedRow } = await current(page);
  expect(layout.rows[markedRow!].word).not.toBe(word);
});

// Faded rows

/** The strength of a row's tiles on screen: the lowest alpha among its cells. */
function strengthOf(objects: Drawn[], layout: LevelLayout, word: string): number {
  const row = layout.rows[rowOf(layout, word)];
  // A placed letter is a filled tile, and an empty cell an outline.
  const alphas = row.cells.flatMap((cell) => {
    const { x, y } = centreOf(cell);
    const drawn = objects.find((object) => object.kind === 'rect' && (object.fill !== null || object.stroke !== null) && Math.abs(object.x - x) < 1 && Math.abs(object.y - y) < 1 && object.width < cell.width * 1.2);
    return drawn ? [drawn.alpha] : [];
  });
  expect(alphas.length).toBeGreaterThan(0);
  return Math.min(...alphas);
}

async function expectStrength(page: Page, scenario: Scenario, word: string, faded: boolean) {
  await layoutNow(page, scenario);
  await page.waitForTimeout(300);
  const { layout } = await current(page);
  const strength = strengthOf(await screen(page), layout, word);
  if (faded) expect(strength).toBeCloseTo(FADED, 1);
  else expect(strength).toBeGreaterThan(0.95);
}

Then(/^(\w+)'s and (\w+)'s rows are faded$/, async ({ page, scenario }, first: string, second: string) => {
  await expectStrength(page, scenario, first, true);
  await expectStrength(page, scenario, second, true);
});

Then(/^(\w+)'s row is faded$/, async ({ page, scenario }, word: string) => {
  await expectStrength(page, scenario, word, true);
});

Then(/^(\w+)'s row isn't faded$/, async ({ page, scenario }, word: string) => {
  await expectStrength(page, scenario, word, false);
});

/** When a row's strength stops changing, counted from the first frame. */
function settledAfter(frames: Frame[], layout: LevelLayout, word: string): number {
  const strengths = frames.map((frame) => ({ t: frame.t, strength: strengthOf(frame.screen, layout, word) }));
  const last = strengths[strengths.length - 1].strength;
  const changing = strengths.filter((sample) => Math.abs(sample.strength - last) > 0.02);
  const start = strengths.find((sample) => Math.abs(sample.strength - strengths[0].strength) > 0.02);
  expect(start, `${word}'s row didn't change`).toBeDefined();
  return changing[changing.length - 1].t - start!.t;
}

Then("ZEBRA's row comes forward and LEMUR's row fades, both in about 0.2 seconds", async ({ page, scenario }) => {
  const { layout } = await current(page);
  const frames = scenario.frames!;
  expect(strengthOf(frames[frames.length - 1].screen, layout, 'ZEBRA')).toBeGreaterThan(0.95);
  expect(strengthOf(frames[frames.length - 1].screen, layout, 'LEMUR')).toBeCloseTo(FADED, 1);
  for (const word of ['ZEBRA', 'LEMUR']) {
    const duration = settledAfter(frames, layout, word);
    expect(duration).toBeGreaterThan(120);
    expect(duration).toBeLessThan(320);
  }
});

// The pool's change (Q3)

/** Where a letter is drawn in the pool area, and how strongly, in one frame. */
function poolLetter(frame: Frame, layout: LevelLayout, character: string): Drawn | undefined {
  const area = layout.poolArea;
  return frame.screen.find((object) => object.kind === 'text' && object.text === character && object.y >= area.y && object.y <= area.y + area.height && object.alpha > 0.02);
}

/** A letter both pools have, as it's drawn in every frame of the change. */
function keptLetter(scenario: Scenario, character: string): { from: number; seen: Drawn[] } {
  const before = scenario.before!.layout;
  const frames = scenario.frames!;
  const seen = frames.map((frame) => poolLetter(frame, before, character)).filter((object): object is Drawn => object !== undefined);
  // Shown all along, at full strength.
  expect(seen.length).toBe(frames.length);
  expect(Math.min(...seen.map((object) => object.alpha))).toBeGreaterThan(0.9);
  return { from: centreOf(poolTile(before, character)).x, seen };
}

Then(/^(\w) stays in its place$/, async ({ scenario }, character: string) => {
  const { from, seen } = keptLetter(scenario, character);
  expect(seen.every((object) => Math.abs(object.x - from) < 1)).toBe(true);
});

Then(/^(\w) glides to its new place$/, async ({ scenario }, character: string) => {
  const { from, seen } = keptLetter(scenario, character);
  // It ends somewhere else, passing through places between where it was and where it goes.
  const to = seen[seen.length - 1].x;
  expect(Math.abs(to - from)).toBeGreaterThan(1);
  expect(seen.some((object) => Math.abs(object.x - from) > 1 && Math.abs(object.x - to) > 1)).toBe(true);
});

function fades(scenario: Scenario, characters: string[], direction: 'in' | 'out') {
  const layout = scenario.before!.layout;
  const frames = scenario.frames!;
  for (const character of characters) {
    const alphas = frames.map((frame) => poolLetter(frame, layout, character)?.alpha ?? 0);
    const [first, last] = [alphas[0], alphas[alphas.length - 1]];
    if (direction === 'out') {
      expect(first).toBeGreaterThan(0.9);
      expect(last).toBe(0);
    } else {
      expect(first).toBe(0);
      expect(last).toBeGreaterThan(0.95);
    }
    // Gradually, not in one step.
    expect(alphas.some((alpha) => alpha > 0.05 && alpha < 0.95)).toBe(true);
  }
}

Then(/^(\w), (\w) and (\w) fade out$/, async ({ scenario }, a: string, b: string, c: string) => {
  fades(scenario, [a, b, c], 'out');
});

Then(/^(\w), (\w) and (\w) fade in$/, async ({ scenario }, a: string, b: string, c: string) => {
  fades(scenario, [a, b, c], 'in');
});

Then('the change takes about 0.25 seconds', async ({ scenario }) => {
  const layout = scenario.before!.layout;
  const frames = scenario.frames!;
  const signature = (frame: Frame) =>
    frame.screen
      .filter((object) => object.kind === 'text' && object.y >= layout.poolArea.y && object.y <= layout.poolArea.y + layout.poolArea.height)
      .map((object) => `${object.text}:${object.x.toFixed(1)}:${object.alpha.toFixed(2)}`)
      .sort()
      .join('|');
  const changes = frames.slice(1).filter((frame, index) => signature(frame) !== signature(frames[index])).map((frame) => frame.t);
  const duration = changes[changes.length - 1] - changes[0];
  expect(duration).toBeGreaterThan(180);
  expect(duration).toBeLessThan(350);
});

// Letters only go into the selected row

When(/^the player drags (\w) from the pool onto (\w+)'s row$/, async ({ page, scenario }, character: string, word: string) => {
  const layout = await layoutNow(page, scenario);
  scenario.acted = true;
  await hold(page, centreOf(poolTile(layout, character)), centreOf(layout.rows[rowOf(layout, word)].cells[0]));
  await page.mouse.up();
  await page.waitForTimeout(500);
});

Then(/^(\w+)'s row is still empty$/, async ({ page }, word: string) => {
  const { layout } = await current(page);
  expect(layout.rows[rowOf(layout, word)].cells.every(({ cell }) => cell.kind === 'empty')).toBe(true);
});

// The selected row is LEMUR's, whose pool shows E once.
Then(/^(\w) is back in the pool$/, async ({ page }, character: string) => {
  const { layout } = await current(page);
  expect(layout.rows[layout.rows.findIndex((row) => row.word === 'LEMUR')].cells.some(({ cell }) => cell.kind === 'placed' && cell.character === character)).toBe(false);
  expect(poolTile(layout, character).count).toBe(1);
});

Given(/^(\w) is placed in (\w+)'s first cell$/, async ({ scenario }, character: string, word: string) => {
  scenario.setup.push(async (page) => {
    const { layout } = await current(page);
    await placeLetter(rowOf(layout, word), 0, character)(page);
  });
});

When(/^the player drags it (?:to (\w+)'s third cell|onto (\w+)'s row)$/, async ({ page, scenario }, third?: string, other?: string) => {
  const layout = await layoutNow(page, scenario);
  scenario.acted = true;
  const from = centreOf(layout.rows[rowOf(layout, 'LEMUR')].cells[0]);
  const to = third ? centreOf(layout.rows[rowOf(layout, third)].cells[2]) : centreOf(layout.rows[rowOf(layout, other!)].cells[0]);
  await hold(page, from, to);
  await page.mouse.up();
  await page.waitForTimeout(500);
});

Then(/^(\w) is in (\w+)'s (first|third) cell$/, async ({ page }, character: string, word: string, which: string) => {
  await page.waitForTimeout(300);
  const { layout } = await current(page);
  const cell = layout.rows[rowOf(layout, word)].cells[which === 'first' ? 0 : 2].cell;
  expect(cell.kind === 'placed' && cell.character).toBe(character);
});

// Placing and spelling

/** Places letters in a row through the game's own input: selecting the row, then pressing each key. */
async function spell(page: Page, scenario: Scenario, word: string, rowWord: string) {
  const layout = await layoutNow(page, scenario);
  const { markedRow } = await current(page);
  if (layout.rows[markedRow!].word !== rowWord) {
    await tapRow(page, scenario, rowWord);
    await page.waitForTimeout(300);
  }
  for (const character of word) await page.keyboard.press(character.toLowerCase());
}

When(/^the player places (\w) in (\w+)'s row$/, async ({ page, scenario }, character: string, word: string) => {
  scenario.acted = true;
  await spell(page, scenario, character, word);
});

Given(/^(\w) and (\w) are placed in (\w+)'s row$/, async ({ scenario }, first: string, second: string, word: string) => {
  scenario.setup.push(async (page) => {
    const { layout } = await current(page);
    const row = rowOf(layout, word);
    await placeLetter(row, 0, first)(page);
    await placeLetter(row, 1, second)(page);
  });
});

Given(/^(?:(\w+)'s row has a placed (\w)|(\w) is placed in (\w+)'s row)$/, async ({ scenario }, rowA?: string, letterA?: string, letterB?: string, rowB?: string) => {
  const [word, character] = rowA ? [rowA, letterA!] : [rowB!, letterB!];
  scenario.setup.push(async (page) => {
    const { layout } = await current(page);
    await placeLetter(rowOf(layout, word), 0, character)(page);
  });
});

Then(/^(\w) and (\w) are still in (\w+)'s row$/, async ({ page }, first: string, second: string, word: string) => {
  const { layout } = await current(page);
  const letters = layout.rows[rowOf(layout, word)].cells.flatMap(({ cell }) => (cell.kind === 'placed' ? [cell.character] : []));
  expect(letters).toEqual([first, second]);
});

Then(/^(\w) is still in (\w+)'s row$/, async ({ page }, character: string, word: string) => {
  const { layout } = await current(page);
  expect(layout.rows[rowOf(layout, word)].cells.some(({ cell }) => cell.kind === 'placed' && cell.character === character)).toBe(true);
});

Then(/^(\w) is back in (\w+)'s pool$/, async ({ page }, character: string, word: string) => {
  const { layout } = await current(page);
  expect(layout.rows[rowOf(layout, word)].cells.some(({ cell }) => cell.kind === 'placed' && cell.character === character)).toBe(false);
  // The pool on screen is the selected row's.
  expect(layout.rows[(await current(page)).markedRow!].word).toBe(word);
  expect(poolTile(layout, character).count).toBeGreaterThan(0);
});

Then("ZEBRA's Z stays", async ({ page }) => {
  const { layout } = await current(page);
  expect(layout.rows[rowOf(layout, 'ZEBRA')].cells[0].cell).toEqual({ kind: 'placed', character: 'Z' });
});

// Into the selected row, unless the step names one: "spells LEMUR", "types L, E, M, R, U", "spells TEAM in MEAT's row".
When(/^the player (?:spells|types) ([A-Z, ]+?)(?: in (\w+)'s row)?$/, async ({ page, scenario }, text: string, rowWord?: string) => {
  await layoutNow(page, scenario);
  scenario.acted = true;
  const { layout, markedRow } = await current(page);
  await startRecording(page);
  if (rowWord && layout.rows[markedRow!].word !== rowWord) {
    await tapRow(page, scenario, rowWord);
    await page.waitForTimeout(300);
  }
  scenario.before = await current(page);
  for (const character of text.replace(/[, ]/g, '')) await page.keyboard.press(character.toLowerCase());
  await page.waitForTimeout(700);
  scenario.frames = await stopRecording(page);
});

Then(/^(\w+) locks there$/, async ({ page }, word: string) => {
  const { layout } = await current(page);
  const row = layout.rows.find((candidate) => candidate.locked && candidate.cells.map(({ cell }) => (cell.kind === 'empty' ? '' : cell.character)).join('') === word);
  expect(row?.word).toBe('MEAT');
});

Then('the other row now locks with MEAT', async ({ page, scenario }) => {
  await spell(page, scenario, 'MEAT', 'TEAM');
  await page.waitForTimeout(500);
  const { layout } = await current(page);
  expect(layout.rows[rowOf(layout, 'TEAM')].locked).toBe(true);
});

Given("TEAM is locked in TEAM's row", async ({ scenario }) => {
  scenario.setup.push(async (page) => {
    const { layout } = await current(page);
    const row = rowOf(layout, 'TEAM');
    for (const [cell, character] of [...'TEAM'].entries()) await placeLetter(row, cell, character)(page);
  });
});

Then('"already found" shows', async ({ page }) => {
  await expect.poll(async () => (await current(page)).foundText).not.toBeNull();
});

Then('the letters stay in place', async ({ page, scenario }) => {
  await page.waitForTimeout(400);
  const { layout, markedRow } = await current(page);
  const row = layout.rows[markedRow!];
  expect(row.locked).toBe(false);
  expect(row.cells.every(({ cell }) => cell.kind === 'placed')).toBe(true);
  expect(scenario.before).toBeDefined();
});

Then(/^(\w+)'s row shakes$/, async ({ page, scenario }, word: string) => {
  const { layout } = await current(page);
  const row = rowOf(layout, word);
  const left = centreOf(layout.rows[row].cells[0]).x;
  const y = centreOf(layout.rows[row].cells[0]).y;
  const offsets = scenario.frames!.map((frame) => {
    const tiles = frame.screen.filter((object) => object.kind === 'rect' && object.fill !== null && Math.abs(object.y - y) < 2);
    return Math.min(...tiles.map((tile) => tile.x)) - left;
  });
  expect(Math.max(...offsets.filter(Number.isFinite))).toBeGreaterThan(2);
});


Then('the Recall All button is grey', async ({ page }) => {
  await page.waitForTimeout(300);
  const { layout, colours } = await current(page);
  const { x, y } = centreOf(layout.recall);
  expect(tileAt(await screen(page), x, y)?.fill).toBe(colours.tileGrey);
});

// Level 1

Then('the rows start as F _ _ and O _ _', async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  expect(layout.rows.map((row) => row.cells.map(({ cell }) => (cell.kind === 'empty' ? '_' : cell.character)).join(' '))).toEqual(['F _ _', 'O _ _']);
});

When(/^the player tries to drag a letter onto (OWL)'s row$/, async ({ page, scenario }, word: string) => {
  const layout = await layoutNow(page, scenario);
  scenario.acted = true;
  await hold(page, centreOf(layout.poolTiles[0]), centreOf(layout.rows[rowOf(layout, word)].cells[1]));
  await page.mouse.up();
  await page.waitForTimeout(500);
});

Then(/^nothing is placed in (OWL|FOX)'s row$/, async ({ page }, word: string) => {
  const { layout } = await current(page);
  expect(layout.rows[rowOf(layout, word)].cells.some(({ cell }) => cell.kind === 'placed')).toBe(false);
});

When(/^the player completes (FOX|OWL)$/, async ({ page, scenario }, word: string) => {
  await layoutNow(page, scenario);
  scenario.acted = true;
  const letters = word === 'FOX' ? 'OX' : 'WL';
  for (const character of letters) await page.keyboard.press(character.toLowerCase());
  await page.waitForTimeout(700);
});

Then("a hand animates between the O in the pool and FOX's first empty cell", async ({ page, scenario }) => {
  const layout = await layoutNow(page, scenario);
  const path = await handPath(page, scenario);
  expect(path.length).toBeGreaterThan(10);
  const tolerance = layout.tileSize * 0.6;
  expect(visits(path, centreOf(poolTile(layout, 'O')), tolerance)).toBe(true);
  expect(visits(path, centreOf(layout.rows[rowOf(layout, 'FOX')].cells[1]), tolerance)).toBe(true);
});

When('the player spells every word', async ({ page, scenario }) => {
  await layoutNow(page, scenario);
  scenario.acted = true;
  for (const word of ['LEMUR', 'ZEBRA', 'KANGAROO']) {
    await spell(page, scenario, word, word);
    await page.waitForTimeout(500);
  }
});

Given('ZEBRA is locked', async ({ scenario }) => {
  scenario.setup.push(async (page) => {
    const { layout } = await current(page);
    const row = rowOf(layout, 'ZEBRA');
    for (const [cell, character] of [...'ZEBRA'].entries()) await placeLetter(row, cell, character)(page);
  });
});

// A row locks all at once (R14)

Then("nothing in HOT DOG's row locks", async ({ page }) => {
  await page.waitForTimeout(500);
  const { layout } = await current(page);
  const row = layout.rows[rowOf(layout, 'HOT DOG')];
  expect(row.locked).toBe(false);
  expect(row.cells.some(({ cell }) => cell.kind === 'locked')).toBe(false);
});

Then('no feedback appears', async ({ page }) => {
  expect((await current(page)).feedback).toEqual([]);
});

Then("every tile of HOT DOG's row shakes", async ({ page, scenario }) => {
  scenario.frames ??= (await page.waitForTimeout(700), await stopRecording(page));
  const { layout } = await current(page);
  const row = layout.rows[rowOf(layout, 'HOT DOG')];
  const movement = (cell: number) => {
    const { x, y } = centreOf(row.cells[cell]);
    // Letters still flying in (M05-02) are drawn at depth 8: they aren't the row's tiles.
    const xs = scenario.frames!.flatMap((frame) => frame.screen.filter((object) => object.kind === 'rect' && object.fill !== null && object.depth !== 8 && Math.abs(object.y - y) < 3 && Math.abs(object.x - x) < layout.tileSize / 2).map((object) => object.x));
    return Math.max(...xs) - Math.min(...xs);
  };
  for (const cell of [0, 1, 2, 4, 5, 6]) expect(movement(cell), `cell ${cell + 1}`).toBeGreaterThan(2);
});

Then("HOT DOG's row locks", async ({ page }) => {
  await page.waitForTimeout(500);
  const { layout } = await current(page);
  expect(layout.rows[rowOf(layout, 'HOT DOG')].locked).toBe(true);
});
