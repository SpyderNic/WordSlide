import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { NEW_PLAYER, winLevel, type Progress } from '../../../src/game/progress';
import { pickedLevel, resetAsked } from '../../../src/game/startingLevel';

interface ProgressWorld {
  progress: Progress;
  developmentBuild: boolean;
  won: boolean;
}

Given(/^the player is on level (\d+)$/, function (this: ProgressWorld, level: string) {
  this.progress = { ...(this.progress ?? NEW_PLAYER), level: Number(level) };
});

// Given and Then share this text: before the win it sets the points, after it it checks them.
Given(/^the player has (\d+) points in total$/, function (this: ProgressWorld, points: string) {
  if (this.won) assert.equal(this.progress.points, Number(points));
  else this.progress = { ...(this.progress ?? NEW_PLAYER), points: Number(points) };
});

When(/^the player wins (?:the|a) level$/, function (this: ProgressWorld) {
  this.progress = winLevel(this.progress ?? NEW_PLAYER);
  this.won = true;
});

Then(/^level (\d+) is unlocked$/, function (this: ProgressWorld, level: string) {
  assert.equal(this.progress.level, Number(level));
});

Given('a release build', function (this: ProgressWorld) {
  this.developmentBuild = false;
});

Then("there's no level picker and no progress reset", function (this: ProgressWorld) {
  assert.equal(pickedLevel('?level=2', 3, this.developmentBuild), null);
  assert.equal(resetAsked('?reset', this.developmentBuild), false);
});
