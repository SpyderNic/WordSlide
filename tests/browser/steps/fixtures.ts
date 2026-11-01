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
  scenario: async ({}, use) => {
    await use({ level: makeLevel(DEFAULT_WORDS), levels: [], levelNumber: 1, points: 0, views: [], setup: [] });
  },
});
