import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { startingLevelNumber } from '../../../src/game/startingLevel';

interface LevelChoiceWorld {
  developmentBuild: boolean;
  levelCount: number;
  opened: number;
}

Given(/^a (development|released) build with (\d+) levels$/, function (this: LevelChoiceWorld, build: string, count: string) {
  this.developmentBuild = build === 'development';
  this.levelCount = Number(count);
});

When(/^the address asks for level (\d+)$/, function (this: LevelChoiceWorld, level: string) {
  this.opened = startingLevelNumber(`?level=${level}`, this.levelCount, this.developmentBuild);
});

Then(/^level (\d+) opens$/, function (this: LevelChoiceWorld, level: string) {
  assert.equal(this.opened, Number(level));
});
