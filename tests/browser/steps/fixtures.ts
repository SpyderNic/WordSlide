import type { CDPSession, Page } from '@playwright/test';
import { test as base } from 'playwright-bdd';
import type { LevelLayout } from '../../../src/game/layout';
import type { PhaseTwoTestView } from '../../../src/scenes/PhaseTwoView';
import type { Level } from '../../../src/game/level';
import type { Style } from '../../../src/style/Style';
import { DEFAULT_WORDS, makeLevel } from '../../support/levels';
import type { Frame } from './probe';

export interface GameView {
  layout: LevelLayout;
  level: Level;
  colours: Style['colours'];
  markedRow: number | null;
  dragging: string | null;
  dragTile: { x: number; y: number } | null;
  highlighted: { kind: 'cell'; row: number; cell: number } | { kind: 'pool'; character: string } | null;
  feedback: { type: string; row?: number; lockedRow?: number }[];
  canRecall: boolean;
  recallArrows: number;
  foundText: { y: number; alpha: number } | null;
  phaseTwo?: PhaseTwoTestView | null;
}

export interface Scenario {
  level: Level;
  levels: Level[];
  /** How many levels the game is given: copies of the scenario's level. */
  levelCount: number;
  levelsGiven?: boolean;
  /** Set once the game has closed and opened again. */
  reopened?: boolean;
  fadeSamples?: { t: number; alpha: number; running: boolean }[];
  levelNumber: number;
  points: number;
  views: GameView[];
  before?: GameView;
  /** Set-up steps wait until the level has opened. */
  setup: ((page: Page) => Promise<void>)[];
  tileRef?: { row: number; cell: number };
  pointer?: { x: number; y: number };
  touch?: CDPSession;
  touchPoint?: { x: number; y: number };
  secondFinger?: { x: number; y: number };
  acted?: boolean;
  twoBefore?: PhaseTwoTestView;
  slideDistance?: number;
  stretchWord?: string;
  stretchCell?: number;
  /** A letter's expected journey (story 16). */
  travel?: { letter: string; from: { x: number; y: number }; to: { x: number; y: number } };
  placedAtOnce?: string;
  setting?: string;
  /** The cells a lock is about to pulse, by row. */
  pulse?: { row: number; cells: number[] };
  finalWordGiven?: boolean;
  columnPlan?: Record<string, { order: string[]; cells: Record<string, number> }>;
  /** What the screen showed, frame by frame, during the scenario's action. */
  frames?: Frame[];
  lastKey?: string;
  /** Whether a word was being dragged at the moment the step let go of it. */
  heldWord?: boolean;
  goldLetters?: { letter: string; t: number; pulsed: boolean }[];
}

export const test = base.extend<{ scenario: Scenario }>({
  // "npm run test:other-style" runs every scenario again with another style (story 16, R1).
  page: async ({ page }, use) => {
    const style = process.env.WORD_SLIDE_STYLE;
    if (style) await page.addInitScript((name) => Object.assign(window, { wordSlideStyle: name }), style);
    await use(page);
  },
  scenario: async ({}, use) => {
    await use({ level: makeLevel(DEFAULT_WORDS), levels: [], levelCount: 12, levelNumber: 1, points: 0, views: [], setup: [] });
  },
});
