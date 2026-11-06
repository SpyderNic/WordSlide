import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import type { Rect } from '../../../src/game/layout';
import type { Level } from '../../../src/game/level';
import { SAVE_KEY } from '../../../src/game/progress';
import { DEFAULT_WORDS, makeLevel, tutorialLevel } from '../../support/levels';
import { test, type Scenario } from './fixtures';
import { installProbe, screen, startRecording, stopRecording, type Drawn, type Frame } from './probe';
import { current } from './m02-02.steps';
import { openGame } from './m05-01.steps';
import { dragSlowlyAndRelease, ready, two, win } from './phase-two.steps';
import { setEconomy } from './m07-02.steps';
import { themedLevels } from './m06-02.steps';

const { Given, When, Then, Before } = createBdd(test);

/** The Level complete screen is drawn at the popup's depth (M07-04, R3); the coin counter and flying coins above it. */
const SCREEN_DEPTH = 30;
const FLIGHT_DEPTH = 32;
const INTERSTITIAL_DEPTH = 40;

interface ScreenInfo {
  buttonRect: Rect | null;
  /** Everything on the screen has played: the button, or "All levels complete!", shows. */
  done: boolean;
  /** The progress bar's track, while the screen shows. */
  bar: Rect | null;
}

type Story = Scenario & { recordingFrom?: number };

const visible = (object: Drawn) => object.alpha > 0.01;
const onScreen = (objects: Drawn[]) => objects.filter((object) => object.depth === SCREEN_DEPTH && visible(object));
const texts = (objects: Drawn[]) => onScreen(objects).filter((object) => object.kind === 'text');
const textNamed = (objects: Drawn[], text: string) => texts(objects).find((object) => object.text === text);
const countText = (objects: Drawn[]) => texts(objects).find((object) => /^\d+ \/ \d+$/.test(object.text ?? ''))?.text ?? null;
const levelNumber = async (page: Page) => ((await current(page)) as unknown as { levelNumber: number }).levelNumber;
const coins = async (page: Page) => ((await current(page)) as unknown as { coins: number }).coins;

/** The Level complete screen after a win, or after the last level once the game reopens (R12). */
async function screenInfo(page: Page): Promise<ScreenInfo | null> {
  const view = (await current(page)) as unknown as { phaseTwo: { popup: ScreenInfo | null } | null; complete: ScreenInfo | null };
  return view.phaseTwo?.popup ?? view.complete ?? null;
}

function infoOf(frame: Frame): ScreenInfo | null {
  return (frame.two?.popup as ScreenInfo | null) ?? null;
}

/** The bar's gold fill: the screen's rectangle inside the track, other than the track itself. */
function barFill(objects: Drawn[], bar: Rect): Drawn | undefined {
  const middle = bar.y + bar.height / 2;
  return onScreen(objects).find(
    (object) => object.kind === 'rect' && Math.abs(object.y - middle) < 1 && object.height <= bar.height + 0.5 && object.height >= bar.height * 0.5 && object.width < bar.width + 0.5 && !(Math.abs(object.width - bar.width) < 0.5 && Math.abs(object.x - (bar.x + bar.width / 2)) < 0.5),
  );
}

/** How full the bar is drawn, from 0 to 1. */
function fullness(frame: Frame): number | null {
  const bar = infoOf(frame)?.bar;
  if (!bar) return null;
  return (barFill(frame.screen, bar)?.width ?? 0) / bar.width;
}

/** Development builds read these before the game starts: the levels' series, and the style's timings. */
async function setSeries(page: Page, series: { name: string; length: number }[]) {
  await page.addInitScript((list) => Object.assign(window, { wordSlideTestSeries: list }), series);
}

async function setTimings(page: Page, values: Record<string, number>) {
  await page.addInitScript((values) => {
    const target = window as unknown as { wordSlideTimings?: Record<string, number> };
    target.wordSlideTimings = { ...target.wordSlideTimings, ...values };
  }, values);
}

/** Waits for the Level complete screen to finish playing, and keeps what was recorded. */
async function finished(page: Page, scenario: Scenario) {
  await expect.poll(async () => (await screenInfo(page))?.done ?? false, { timeout: 12000 }).toBe(true);
  const frames = await stopRecording(page);
  if (frames.length > 0) scenario.frames = frames;
}

/** Frames from when the Level complete screen appeared: drawn, and starting to fade in. */
function screenFrames(scenario: Scenario): Frame[] {
  const frames = scenario.frames!;
  const first = frames.findIndex((frame) => infoOf(frame) !== null && onScreen(frame.screen).length > 0);
  return first === -1 ? [] : frames.slice(first);
}

async function wins(page: Page, scenario: Scenario, level: number) {
  scenario.levelNumber = level;
  await ready(page, scenario);
  await startRecording(page);
  await win(page, scenario);
}

// The series

Given(/^the series are "([^"]+)" of (\d+) levels, then "([^"]+)" of (\d+)$/, async ({ page }, first: string, firstLength: string, second: string, secondLength: string) => {
  await setSeries(page, [
    { name: first, length: Number(firstLength) },
    { name: second, length: Number(secondLength) },
  ]);
});

Given('the series reward per level is {int}', async ({ page }, coins: number) => {
  await setEconomy(page, { seriesRewardPerLevel: coins });
});

Given('the last series has {int} levels and ends on the last level', async ({ page, scenario }, length: number) => {
  await setSeries(page, [{ name: 'Last Lap', length }]);
  scenario.levelCount = length;
});

// The level the scenario needs comes first when it needs a tutorial (R7, Q19).
Before(async ({ $testInfo, scenario }) => {
  if ($testInfo.title === "The first series isn't announced") {
    scenario.levelList = [tutorialLevel(), ...Array.from({ length: 11 }, () => makeLevel(DEFAULT_WORDS, 'ELK'))];
  }
});

// Progress (R2)

Given('a save from before this story, on level {int}', async ({ page, scenario }, level: number) => {
  await openGame(page, scenario);
  // What the game saved before M07-04: no series, nothing about rewards.
  await page.evaluate(({ key, level }) => localStorage.setItem(key, JSON.stringify({ level, points: level - 1, inLevel: null, coins: 100 })), { key: SAVE_KEY, level });
  scenario.views = [];
  await openGame(page, scenario);
  scenario.levelNumber = level;
});

Then(/^the bar fills from "(\d+) \/ (\d+)" to "(\d+) \/ \d+"$/, async ({ page, scenario }, from: string, length: string, to: string) => {
  await finished(page, scenario);
  const frames = screenFrames(scenario);
  expect(countText(frames[0].screen)).toBe(`${from} / ${length}`);
  expect(fullness(frames[0])).toBeCloseTo(Number(from) / Number(length), 2);
  const last = frames[frames.length - 1];
  expect(countText(last.screen)).toBe(`${to} / ${length}`);
  expect(fullness(last)).toBeCloseTo(Number(to) / Number(length), 2);
  // It fills on screen, not in one jump.
  const between = frames.map(fullness).filter((value): value is number => value !== null && value > Number(from) / Number(length) + 0.005 && value < Number(to) / Number(length) - 0.005);
  expect(between.length).toBeGreaterThan(2);
});

// The screen (R3)

When('the player wins level {int}, whose final word is ELK', async ({ page, scenario }, level: number) => {
  await wins(page, scenario, level);
});

When('the Level complete screen has finished playing', async ({ page, scenario }) => {
  await finished(page, scenario);
});

Then(/^it reads, top to bottom: "Level (\d+) Complete", ELK in gold, "Points: (\d+)", "([^"]+)", a bar showing "(\d+ \/ \d+)", and a "Play Level (\d+)" button$/, async ({ page }, level: string, points: string, name: string, count: string, next: string) => {
  const { colours } = await current(page);
  const objects = await screen(page);
  const shown = texts(objects);
  const title = textNamed(objects, `Level ${level} Complete`)!;
  const pointsText = textNamed(objects, `Points: ${points}`)!;
  const series = textNamed(objects, name)!;
  const counted = shown.find((object) => object.text === count)!;
  const button = textNamed(objects, `Play Level ${next}`)!;
  [title, pointsText, series, counted, button].forEach((object) => expect(object).toBeDefined());
  const gold = onScreen(objects).filter((object) => object.kind === 'rect' && object.fill === colours.tileGold && Math.abs(object.width - object.height) < 1);
  expect(gold).toHaveLength(3);
  const letters = gold.map((tile) => shown.find((object) => Math.abs(object.x - tile.x) < 2 && Math.abs(object.y - tile.y) < 2)?.text);
  expect(letters).toEqual(['E', 'L', 'K']);
  const bar = (await screenInfo(page))!.bar!;
  const ys = [title.y, gold[0].y, pointsText.y, series.y, bar.y + bar.height / 2, button.y];
  ys.slice(1).forEach((y, index) => expect(y).toBeGreaterThan(ys[index]));
  expect(Math.abs(counted.y - (bar.y + bar.height / 2))).toBeLessThan(bar.height);
});

Then('it covers the whole screen', async ({ page }) => {
  const { width, height } = page.viewportSize()!;
  const cover = onScreen(await screen(page)).find((object) => object.kind === 'rect' && object.width >= width && object.height >= height);
  expect(cover, 'nothing on the screen covers it whole').toBeDefined();
  expect(cover!.alpha).toBeGreaterThan(0.99);
});

When('the Level complete screen is showing', async ({ page, scenario }) => {
  await wins(page, scenario, 3);
  await finished(page, scenario);
});

Then('the coin counter shows {int} where it is in the top bar', async ({ page }, value: number) => {
  const { layout } = await current(page);
  const counter = layout.topItems.find((item) => item.name === 'coins')!;
  // Graphics draw from their own origin: where a coin is drawn is the middle of its lines.
  const at = (object: Drawn) => (object.kind === 'graphics' && object.lines.length > 0 ? centreOfLines(object) : object);
  const inside = (object: Drawn) => at(object).x >= counter.x && at(object).x <= counter.x + counter.width && at(object).y >= counter.y && at(object).y <= counter.y + counter.height;
  const drawn = (await screen(page)).filter((object) => visible(object) && object.depth > SCREEN_DEPTH && inside(object));
  expect(drawn.filter((object) => object.kind === 'text').map((object) => object.text)).toEqual([String(value)]);
  expect(drawn.some((object) => object.kind === 'graphics')).toBe(true);
});

Then('the house button, the level number, the ad button and the cog button are hidden', async ({ page }) => {
  const { layout } = await current(page);
  const objects = (await screen(page)).filter((object) => visible(object) && object.depth !== SCREEN_DEPTH);
  for (const name of ['home', 'level', 'ad', 'settings']) {
    const item = layout.topItems.find((candidate) => candidate.name === name);
    if (!item) continue;
    const inside = objects.filter((object) => object.x >= item.x && object.x <= item.x + item.width && object.y >= item.y && object.y <= item.y + item.height);
    expect(inside, `${name} is still drawn`).toEqual([]);
  }
});

Then('the Level complete screen starts fading in about 1.5 seconds later', async ({ page, scenario }) => {
  await finished(page, scenario);
  const { width, height } = page.viewportSize()!;
  const cover = (frame: Frame) => onScreen(frame.screen).find((object) => object.kind === 'rect' && object.width >= width && object.height >= height);
  const won = scenario.frames!.find((frame) => frame.two?.won)!;
  const appearing = scenario.frames!.filter((frame) => cover(frame));
  const first = appearing[0];
  expect(first.t - won.t).toBeGreaterThan(1350);
  expect(first.t - won.t).toBeLessThan(1750);
  // It fades in: not covering at first, then covering.
  expect(cover(first)!.alpha).toBeLessThan(0.9);
  expect(appearing.some((frame) => cover(frame)!.alpha > 0.99)).toBe(true);
  (scenario as Story).recordingFrom = first.t;
});

Then('the level fades out under it', async ({ scenario }) => {
  const from = (scenario as Story).recordingFrom!;
  const column = (frame: Frame) => frame.screen.find((object) => object.kind === 'graphics' && object.triangles.length === 2 && object.depth < SCREEN_DEPTH);
  const alphas = scenario.frames!.filter((frame) => frame.t >= from).map((frame) => column(frame)?.alpha ?? 0);
  expect(alphas[0]).toBeGreaterThan(0.5);
  expect(alphas[alphas.length - 1]).toBeLessThan(0.01);
});

Given('the Level complete screen for level {int} has finished playing', async ({ page, scenario }, level: number) => {
  await wins(page, scenario, level);
  await finished(page, scenario);
});

When('the player presses the "Play Level {int}" button', async ({ page }, _level: number) => {
  const button = textNamed(await screen(page), `Play Level ${_level}`)!;
  await page.mouse.click(button.x, button.y);
});

Then('level {int} starts', async ({ page }, level: number) => {
  await expect.poll(() => levelNumber(page)).toBe(level);
  expect(await two(page)).toBeNull();
  expect(onScreen(await screen(page))).toEqual([]);
});

// The order (R4)

When('the Level complete screen for level {int} appears', async ({ page, scenario }, level: number) => {
  await wins(page, scenario, level);
  await expect.poll(async () => (await screenInfo(page)) !== null, { timeout: 4000 }).toBe(true);
});

Then(/^it shows "Points: (\d+)", "([^"]+)" and the bar at "(\d+) \/ (\d+)"$/, async ({ page }, points: string, name: string, won: string, length: string) => {
  const objects = await screen(page);
  expect(textNamed(objects, `Points: ${points}`)).toBeDefined();
  expect(textNamed(objects, name)).toBeDefined();
  expect(countText(objects)).toBe(`${won} / ${length}`);
  const bar = (await screenInfo(page))!.bar!;
  expect((barFill(objects, bar)?.width ?? 0) / bar.width).toBeCloseTo(Number(won) / Number(length), 2);
});

Then("there's no button", async ({ page }) => {
  const objects = await screen(page);
  expect(texts(objects).filter((object) => object.text?.startsWith('Play Level'))).toEqual([]);
  expect((await screenInfo(page))?.buttonRect ?? null).toBeNull();
});

Given('the points pause is {float} seconds', async ({ page }, seconds: number) => {
  await setTimings(page, { pointsPause: seconds * 1000 });
});

Given('the series bar pause is {float} seconds', async ({ page }, seconds: number) => {
  await setTimings(page, { seriesBarPause: seconds * 1000 });
});

Given('the series bar fill is {float} seconds', async ({ page }, seconds: number) => {
  await setTimings(page, { seriesBarFill: seconds * 1000 });
});

/** When each thing on the screen happened, counted from the screen appearing. */
function timeline(scenario: Scenario, points: number) {
  const frames = screenFrames(scenario);
  const start = frames[0].t;
  const start0 = fullness(frames[0]) ?? 0;
  const at = (test: (frame: Frame) => boolean) => {
    const frame = frames.find(test);
    return frame ? frame.t - start : null;
  };
  return {
    frames,
    start,
    points: at((frame) => textNamed(frame.screen, `Points: ${points}`) !== undefined),
    filling: at((frame) => (fullness(frame) ?? 0) > start0 + 0.002),
    full: (target: number) => at((frame) => Math.abs((fullness(frame) ?? 0) - target) < 0.002),
    button: at((frame) => texts(frame.screen).some((object) => object.text?.startsWith('Play Level'))),
  };
}

Then('the points change to "Points: {int}" after {float} seconds', async ({ page, scenario }, points: number, seconds: number) => {
  await finished(page, scenario);
  const { points: changed } = timeline(scenario, points);
  expect(changed).not.toBeNull();
  expect(changed!).toBeGreaterThan(seconds * 1000 - 100);
  expect(changed!).toBeLessThan(seconds * 1000 + 150);
  (scenario as Story).recordingFrom = points;
});

Then('{float} seconds later the bar starts filling', async ({ scenario }, seconds: number) => {
  const line = timeline(scenario, (scenario as Story).recordingFrom!);
  const gap = line.filling! - line.points!;
  expect(gap).toBeGreaterThan(seconds * 1000 - 100);
  expect(gap).toBeLessThan(seconds * 1000 + 150);
});

Then(/^it reaches "(\d+) \/ (\d+)" over ([\d.]+) seconds, its count counting up with it$/, async ({ scenario }, won: string, length: string, seconds: string) => {
  const line = timeline(scenario, (scenario as Story).recordingFrom!);
  const full = line.full(Number(won) / Number(length))!;
  expect(full - line.filling!).toBeGreaterThan(Number(seconds) * 1000 - 150);
  expect(full - line.filling!).toBeLessThan(Number(seconds) * 1000 + 150);
  const counts = line.frames.map((frame) => countText(frame.screen)).filter((text): text is string => text !== null);
  expect(counts[counts.length - 1]).toBe(`${won} / ${length}`);
  counts.slice(1).forEach((text, index) => expect(parseInt(text)).toBeGreaterThanOrEqual(parseInt(counts[index])));
  // The count reaches the new progress with the bar, not before it starts.
  const reached = line.frames.find((frame) => countText(frame.screen) === `${won} / ${length}`)!.t - line.start;
  expect(reached).toBeGreaterThan(line.filling!);
});

Then('then the "Play Level {int}" button shows', async ({ page, scenario }, level: number) => {
  // Frames were kept by an earlier step of the scenario, once the screen had finished.
  if (!scenario.frames || screenFrames(scenario).length === 0) await finished(page, scenario);
  const frames = screenFrames(scenario);
  const shown = frames.findIndex((frame) => textNamed(frame.screen, `Play Level ${level}`) !== undefined);
  expect(shown).toBeGreaterThan(0);
  // Nothing was still moving on the screen when it showed: the bar was done, and no coins were flying.
  const before = frames[shown - 1];
  const after = frames.slice(shown);
  expect(after.every((frame) => frame.screen.every((object) => object.depth !== FLIGHT_DEPTH))).toBe(true);
  expect(fullness(frames[shown])).toBeCloseTo(fullness(frames[frames.length - 1])!, 3);
  expect(fullness(before)).toBeCloseTo(fullness(frames[frames.length - 1])!, 3);
  const info = infoOf(frames[frames.length - 1])!;
  expect(info.buttonRect).not.toBeNull();
});

Given('the Level complete screen for level {int} is still filling the bar', async ({ page, scenario }, level: number) => {
  await setTimings(page, { seriesBarFill: 3000 });
  await setSeries(page, [{ name: 'First Steps', length: 10 }, { name: 'Second Wind', length: 15 }]);
  await wins(page, scenario, level);
  const bar = async () => {
    const info = await screenInfo(page);
    return info?.bar ? (barFill(await screen(page), info.bar)?.width ?? 0) / info.bar.width : 0;
  };
  const start = (level - 1 - 0) / 10;
  await expect.poll(bar, { timeout: 6000 }).toBeGreaterThan(start + 0.01);
  expect(await bar()).toBeLessThan(level / 10 - 0.01);
});

Then("level {int}'s screen carries on playing", async ({ page, scenario }, level: number) => {
  await finished(page, scenario);
  expect(await levelNumber(page)).toBe(level);
  expect(textNamed(await screen(page), `Play Level ${level + 1}`)).toBeDefined();
});

// The reward (R5)

When(/^the bar fills to "(\d+) \/ (\d+)"$/, async ({ page, scenario }, won: string, length: string) => {
  await finished(page, scenario);
  const frames = screenFrames(scenario);
  expect(countText(frames[frames.length - 1].screen)).toBe(`${won} / ${length}`);
  expect(fullness(frames[frames.length - 1])).toBeCloseTo(1, 2);
});

/** The first frame where the bar is drawn full. */
function fullAt(frames: Frame[]): number {
  return frames.findIndex((frame) => (fullness(frame) ?? 0) > 0.998);
}

Then('the bar flashes', async ({ page, scenario }) => {
  const { colours } = await current(page);
  const frames = screenFrames(scenario);
  const full = fullAt(frames);
  expect(full).toBeGreaterThan(-1);
  const colour = (frame: Frame) => barFill(frame.screen, infoOf(frame)!.bar!)?.fill;
  const after = frames.slice(full).map(colour);
  // It lights up and goes back: some frames in another colour, and it ends gold.
  expect(after.some((fill) => fill !== colours.tileGold)).toBe(true);
  expect(after[after.length - 1]).toBe(colours.tileGold);
});

Then('{string} stays above the bar', async ({ page }, name: string) => {
  const objects = await screen(page);
  const bar = (await screenInfo(page))!.bar!;
  const series = textNamed(objects, name);
  expect(series).toBeDefined();
  expect(series!.y).toBeLessThan(bar.y);
});

Then(/^"Complete! \+(\d+)" with a coin icon shows under the bar$/, async ({ page }, amount: string) => {
  const objects = await screen(page);
  const bar = (await screenInfo(page))!.bar!;
  const line = textNamed(objects, `Complete! +${amount}`);
  expect(line).toBeDefined();
  expect(line!.y).toBeGreaterThan(bar.y + bar.height);
  const coin = onScreen(objects).find((object) => object.kind === 'graphics' && object.lines.length === 8 && Math.abs(centreOfLines(object).y - line!.y) < bar.height * 2);
  expect(coin, 'no coin beside the line').toBeDefined();
});

function centreOfLines(object: Drawn) {
  return {
    x: object.lines.reduce((sum, line) => sum + line.x1, 0) / object.lines.length,
    y: object.lines.reduce((sum, line) => sum + line.y1, 0) / object.lines.length,
  };
}

Then(/^then coins fly from "Complete! \+(\d+)" to the coin counter$/, async ({ page, scenario }, amount: string) => {
  const { layout } = await current(page);
  const counter = layout.topItems.find((item) => item.name === 'coins')!;
  const target = { x: counter.x + counter.width / 2, y: counter.y + counter.height / 2 };
  const flying = (frame: Frame) => frame.screen.filter((object) => object.kind === 'graphics' && object.depth === FLIGHT_DEPTH && object.lines.length === 8);
  const frames = scenario.frames!;
  const firstFlight = frames.findIndex((frame) => flying(frame).length > 0);
  expect(firstFlight).toBeGreaterThan(-1);
  const lineShown = frames.findIndex((frame) => textNamed(frame.screen, `Complete! +${amount}`) !== undefined);
  expect(lineShown).toBeGreaterThan(-1);
  expect(lineShown).toBeLessThanOrEqual(firstFlight);
  const line = textNamed(frames[firstFlight].screen, `Complete! +${amount}`)!;
  const start = centreOfLines(flying(frames[firstFlight])[0]);
  expect(Math.hypot(start.x - line.x, start.y - line.y)).toBeLessThan(Math.max(line.width / 2, layout.tileSize));
  const flights = frames.filter((frame) => flying(frame).length > 0);
  const end = flying(flights[flights.length - 1]).map(centreOfLines);
  expect(end.some((point) => Math.hypot(point.x - target.x, point.y - target.y) < layout.tileSize)).toBe(true);
  expect(flying(frames[frames.length - 1])).toEqual([]);
});

// Saving (R6)

When('the game closes before the Level complete screen appears', async ({ page }) => {
  expect(await screenInfo(page)).toBeNull();
  await page.goto('about:blank');
});

Then('level {int} is open', async ({ page }, level: number) => {
  expect(await levelNumber(page)).toBe(level);
  expect(await two(page)).toBeNull();
});

When('closes and opens again', async ({ page }) => {
  await page.reload();
  await page.waitForFunction(() => (window as unknown as { wordSlideReady?: boolean }).wordSlideReady === true);
  await installProbe(page);
});

// The series interstitial (R7)

function copies(count: number, theme = 'Animals'): Level[] {
  return Array.from({ length: count }, () => ({ ...makeLevel(DEFAULT_WORDS, 'ELK'), theme }));
}

Given('levels 10 and 11 have the same theme', async ({ scenario }) => {
  scenario.levelList = copies(12);
  scenario.level = scenario.levelList[9];
});

Given("level 10's theme is Animals and level 11's is Food", async ({ scenario }) => {
  scenario.levelList = themedLevels();
  scenario.level = scenario.levelList[9];
});

Given("level 15's theme is Food and level 16's is Space", async ({ scenario }) => {
  scenario.levelList = [...copies(15, 'Food'), ...copies(5, 'Space')];
  scenario.level = scenario.levelList[14];
});

const interstitialIn = (objects: Drawn[]) => objects.filter((object) => object.depth >= INTERSTITIAL_DEPTH && visible(object));
const interstitialTexts = (objects: Drawn[]) => interstitialIn(objects).filter((object) => object.kind === 'text');

/** The interstitial at its fullest: every frame where it covers the screen. */
function coveredFrames(frames: Frame[], width: number, height: number) {
  return frames.filter((frame) => interstitialIn(frame.screen).some((object) => object.kind === 'rect' && object.alpha > 0.99 && object.width >= width && object.height >= height));
}

Then('a full-screen interstitial shows {string} in small text and {string} large under it', async ({ page, scenario }, small: string, large: string) => {
  const { width, height } = page.viewportSize()!;
  const covered = coveredFrames(scenario.frames!, width, height);
  expect(covered.length, 'it never covers the screen').toBeGreaterThan(0);
  const shown = interstitialTexts(covered[0].screen);
  const top = shown.find((object) => object.text === small)!;
  const name = shown.find((object) => object.text === large)!;
  expect(top).toBeDefined();
  expect(name).toBeDefined();
  expect(top.fontSize!).toBeLessThan(name.fontSize!);
  expect(top.y).toBeLessThan(name.y);
  expect(shown.map((object) => object.text).sort()).toEqual([small, large].sort());
});

Then('it fades in and out, with no button', async ({ scenario }) => {
  const frames = scenario.frames!.map((frame) => ({ frame, alpha: Math.max(0, ...interstitialIn(frame.screen).filter((object) => object.kind === 'rect').map((object) => object.alpha)) }));
  const shown = frames.filter((entry) => entry.alpha > 0.01);
  expect(shown.length).toBeGreaterThan(3);
  expect(shown[0].alpha).toBeLessThan(0.5);
  expect(shown.some((entry) => entry.alpha > 0.99)).toBe(true);
  expect(shown[shown.length - 1].alpha).toBeLessThan(0.5);
  shown.forEach(({ frame }) => expect(interstitialTexts(frame.screen).some((object) => /Play|Continue/.test(object.text ?? ''))).toBe(false));
});

Given('the series interstitial is showing', async ({ page, scenario }) => {
  await setSeries(page, [{ name: 'First Steps', length: 10 }, { name: 'Second Wind', length: 15 }]);
  scenario.levelList = copies(12);
  scenario.level = scenario.levelList[9];
  await wins(page, scenario, 10);
  await finished(page, scenario);
  const button = textNamed(await screen(page), 'Play Level 11')!;
  await page.mouse.click(button.x, button.y);
  const { width, height } = page.viewportSize()!;
  await expect.poll(async () => coveredFrames([{ t: 0, screen: await screen(page), two: null }], width, height).length).toBe(1);
  expect(interstitialTexts(await screen(page)).map((object) => object.text)).toContain('Second Wind');
  await expect.poll(() => levelNumber(page)).toBe(11);
  scenario.before = await current(page);
});

Then(/^one interstitial shows "New series", "([^"]+)", and (\w+) under them in the theme interstitial's style$/, async ({ page, scenario }, name: string, theme: string) => {
  const { width, height } = page.viewportSize()!;
  const { colours } = await current(page);
  const covered = coveredFrames(scenario.frames!, width, height);
  expect(covered.length).toBeGreaterThan(0);
  // One interstitial: it covers the screen in one unbroken run of frames.
  const indices = covered.map((frame) => scenario.frames!.indexOf(frame));
  expect(indices[indices.length - 1] - indices[0]).toBe(indices.length - 1);
  const shown = interstitialTexts(covered[0].screen);
  const [first, second, third] = [...shown].sort((a, b) => a.y - b.y);
  expect([first.text, second.text, third.text]).toEqual(['New series', name, theme]);
  // The theme interstitial's style: the highlight colour, at the size M06-02's interstitial draws a theme
  // (14% of the screen's shorter side). The size is checked against that rule, not measured from a theme-only card.
  expect(third.fontSize).toBeCloseTo(Math.round(Math.min(width, height) * 0.14), 0);
  expect(third.colour).toBe(`#${colours.highlight.toString(16).padStart(6, '0')}`);
});

Then('the theme interstitial names {word}', async ({ page, scenario }, theme: string) => {
  const { width, height } = page.viewportSize()!;
  const covered = coveredFrames(scenario.frames!, width, height);
  expect(covered.length).toBeGreaterThan(0);
  expect(interstitialTexts(covered[0].screen).map((object) => object.text)).toEqual([theme]);
});

Then("it doesn't mention a series", async ({ scenario }) => {
  scenario.frames!.forEach((frame) => expect(interstitialTexts(frame.screen).some((object) => object.text === 'New series')).toBe(false));
});

Then('a midgame ad is asked for', async ({ page, scenario }) => {
  const log = await page.evaluate(() => [...((window as unknown as { wordSlideAdLog?: string[] }).wordSlideAdLog ?? [])]);
  expect(log).toContain('midgame');
  // Nothing of the next series yet: the ad comes first.
  scenario.frames!.forEach((frame) => expect(interstitialTexts(frame.screen)).toEqual([]));
  await expect(page.locator('#pretend-ad')).toBeVisible();
});

Then('when it ends, the series interstitial shows', async ({ page, scenario }) => {
  await startRecording(page);
  await page.locator('#pretend-ad').getByRole('button', { name: 'Finish' }).click();
  await page.waitForTimeout(3000);
  scenario.frames = await stopRecording(page);
  const { width, height } = page.viewportSize()!;
  const covered = coveredFrames(scenario.frames, width, height);
  expect(covered.length).toBeGreaterThan(0);
  expect(interstitialTexts(covered[0].screen).map((object) => object.text)).toContain('New series');
});

Then('then level {int} appears', async ({ page }, level: number) => {
  expect(await levelNumber(page)).toBe(level);
  expect(interstitialIn(await screen(page))).toEqual([]);
});

Then('the Level complete screen shows {string}', async ({ page, scenario }, name: string) => {
  await finished(page, scenario);
  expect(textNamed(await screen(page), name)).toBeDefined();
});

Then('the tutorial opens straight away, with no interstitial', async ({ page }) => {
  await startRecording(page);
  await page.waitForTimeout(2500);
  const frames = await stopRecording(page);
  const view = (await current(page)) as unknown as { levelNumber: number; level: Level };
  expect(view.levelNumber).toBe(1);
  expect(view.level.tutorial).toBe(true);
  frames.forEach((frame) => expect(interstitialIn(frame.screen)).toEqual([]));
});

// A peek (R8)

When('the designer peeks at level {int} and wins it', async ({ page, scenario }, level: number) => {
  scenario.levelNumber = level;
  await openGame(page, scenario, `/?level=${level}`);
  await ready(page, scenario);
  await startRecording(page);
  await win(page, scenario);
});

Then(/^the bar fills to "(\d+) \/ (\d+)" and flashes$/, async ({ page, scenario }, won: string, length: string) => {
  const { colours } = await current(page);
  await finished(page, scenario);
  const frames = screenFrames(scenario);
  expect(countText(frames[frames.length - 1].screen)).toBe(`${won} / ${length}`);
  const full = fullAt(frames);
  expect(full).toBeGreaterThan(-1);
  const after = frames.slice(full).map((frame) => barFill(frame.screen, infoOf(frame)!.bar!)?.fill);
  expect(after.some((fill) => fill !== colours.tileGold)).toBe(true);
});

// Only on the Level complete screen (R10)

Then("neither the series' name nor a progress bar shows", async ({ page }) => {
  const objects = (await screen(page)).filter(visible);
  expect(objects.some((object) => object.kind === 'text' && (object.text === 'First Steps' || /^\d+ \/ \d+$/.test(object.text ?? '')))).toBe(false);
  expect(onScreen(objects)).toEqual([]);
});

// Level 1 (R11)

Given('level 1 is the tutorial', async ({ scenario }) => {
  scenario.level = tutorialLevel();
  scenario.finalWordGiven = true;
  scenario.levelNumber = 1;
});

// The last level (R12)

When('the player wins the last level', async ({ page, scenario }) => {
  await wins(page, scenario, scenario.levelCount);
});

Then('the counter counts up from {int} to {int}', async ({ page, scenario }, from: number, to: number) => {
  const { layout } = await current(page);
  const counter = layout.topItems.find((item) => item.name === 'coins')!;
  const inside = (object: Drawn) => object.x >= counter.x && object.x <= counter.x + counter.width && object.y >= counter.y && object.y <= counter.y + counter.height;
  const values = scenario.frames!.map((frame) => frame.screen.find((object) => object.kind === 'text' && inside(object) && /^\d+$/.test(object.text ?? ''))?.text).filter((text): text is string => !!text).map(Number);
  expect(values[0]).toBe(from);
  expect(values[values.length - 1]).toBe(to);
  values.slice(1).forEach((value, index) => expect(value).toBeGreaterThanOrEqual(values[index]));
});

Then('then {string} shows where the button would be', async ({ page, scenario }, text: string) => {
  const frames = screenFrames(scenario);
  const shown = frames.findIndex((frame) => textNamed(frame.screen, text) !== undefined);
  expect(shown).toBeGreaterThan(0);
  expect(frames.slice(shown).every((frame) => frame.screen.every((object) => object.depth !== FLIGHT_DEPTH))).toBe(true);
  const objects = await screen(page);
  const bar = (await screenInfo(page))!.bar!;
  expect(textNamed(objects, text)!.y).toBeGreaterThan(bar.y + bar.height);
});

Given('the player has won the last level, and has {int} coins', async ({ page, scenario }, value: number) => {
  await wins(page, scenario, scenario.levelCount);
  await finished(page, scenario);
  await page.evaluate((value) => (window as unknown as { wordSlide: { setCoins: (coins: number) => void } }).wordSlide.setCoins(value), value);
  await expect.poll(() => coins(page)).toBe(value);
});

Then('the Level complete screen shows the bar full at {string}', async ({ page }, count: string) => {
  await expect.poll(async () => (await screenInfo(page))?.done ?? false).toBe(true);
  const objects = await screen(page);
  expect(countText(objects)).toBe(count);
  const bar = (await screenInfo(page))!.bar!;
  expect((barFill(objects, bar)?.width ?? 0) / bar.width).toBeCloseTo(1, 2);
});

Then('{string}', async ({ page }, text: string) => {
  expect(textNamed(await screen(page), text)).toBeDefined();
});

