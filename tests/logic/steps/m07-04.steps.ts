import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { NEW_PLAYER, winLevel, type Progress } from '../../../src/game/progress';
import { economyWith, type Economy } from '../../../src/game/economy';
import { seriesOf, seriesReward, wonInSeries, type Series } from '../../../src/game/series';
import { series as prototypeSeries } from '../../../src/levels';

interface SeriesWorld {
  progress: Progress;
  series: Series[];
  economy: Economy;
  reward: number;
}

/** Levels 1 to N, numbered as the player sees them. */
function levelsIn(world: SeriesWorld, name: string): number[] {
  const found: number[] = [];
  const total = world.series.reduce((sum, one) => sum + one.length, 0);
  for (let level = 1; level <= total; level++) if (seriesOf(world.series, level)?.name === name) found.push(level);
  return found;
}

Given(/^the series are "([^"]+)" of (\d+) levels, then "([^"]+)" of (\d+)$/, function (this: SeriesWorld, first: string, firstLength: string, second: string, secondLength: string) {
  this.series = [
    { name: first, length: Number(firstLength) },
    { name: second, length: Number(secondLength) },
  ];
});

Given('a series of {int} levels', function (this: SeriesWorld, length: number) {
  this.series = [{ name: 'Only Series', length }];
});

Given("the prototype's levels", function (this: SeriesWorld) {
  this.series = prototypeSeries;
});

Given('the series reward per level is {int}', function (this: SeriesWorld, coins: number) {
  this.economy = economyWith({ seriesRewardPerLevel: coins });
});

Then(/^levels (\d+) to (\d+) are in "([^"]+)"$/, function (this: SeriesWorld, from: string, to: string, name: string) {
  const expected = Array.from({ length: Number(to) - Number(from) + 1 }, (_, index) => Number(from) + index);
  assert.deepEqual(levelsIn(this, name), expected);
});

Then(/^"([^"]+)" has (\d+) of its (\d+) levels won$/, function (this: SeriesWorld, name: string, won: string, length: string) {
  const level = this.progress.level;
  const series = seriesOf(this.series, level)!;
  assert.equal(series.name, name);
  assert.equal(series.length, Number(length));
  assert.equal(wonInSeries(this.series, level), Number(won));
});

// Winning goes through the same rule the game uses: progress.winLevel, given the series and the economy.
When(/^the player wins (?:its last level|level (\d+))$/, function (this: SeriesWorld, number?: string) {
  const level = number ? Number(number) : this.series[0].length;
  const before: Progress = { ...(this.progress ?? NEW_PLAYER), level, coins: this.progress?.coins ?? 0 };
  this.progress = winLevel(before, seriesReward(this.series, level, this.economy));
  this.reward = (this.progress.coins ?? 0) - (before.coins ?? 0);
});

Given('the player has {int} coins', function (this: SeriesWorld, coins: number) {
  if (this.reward === undefined) this.progress = { ...(this.progress ?? NEW_PLAYER), coins };
  else assert.equal(this.progress.coins, coins);
});

Then('the series gives {int} coins', function (this: SeriesWorld, coins: number) {
  assert.equal(this.reward, coins);
});
