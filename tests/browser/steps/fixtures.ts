import { test as base } from 'playwright-bdd';
import type { LevelLayout } from '../../../src/game/layout';
import type { Level } from '../../../src/game/level';
import type { Style } from '../../../src/style/Style';
import { DEFAULT_WORDS, makeLevel } from '../../support/levels';

export interface GameView {
  layout: LevelLayout;
  level: Level;
  colours: Style['colours'];
}

export interface Scenario {
  level: Level;
  levels: Level[];
  levelNumber: number;
  points: number;
  views: GameView[];
  before?: GameView;
}

export const test = base.extend<{ scenario: Scenario }>({
  scenario: async ({}, use) => {
    await use({ level: makeLevel(DEFAULT_WORDS), levels: [], levelNumber: 1, points: 0, views: [] });
  },
});
