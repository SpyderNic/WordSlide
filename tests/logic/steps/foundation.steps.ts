import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { validateLevel } from '../../../src/game/validator';
import { levels } from '../../../src/levels';
import { LocalPlatform } from '../../../src/platform/LocalPlatform';
import type { Platform } from '../../../src/platform/Platform';
import { currentStyle } from '../../../src/style';

interface World {
  platform: Platform;
}

function workingStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}

function blockedStorage() {
  const blocked = () => {
    throw new Error('Saving is blocked');
  };
  return { getItem: blocked, setItem: blocked };
}

Given('a working save', function (this: World) {
  this.platform = new LocalPlatform(workingStorage());
});

Given('saving is blocked', function (this: World) {
  this.platform = new LocalPlatform(blockedStorage());
});

When('{string} is saved as {string}', async function (this: World, key: string, value: string) {
  await this.platform.save(key, value);
});

Then('loading {string} gives {string}', async function (this: World, key: string, value: string) {
  assert.equal(await this.platform.load(key), value);
});

Then('loading {string} gives nothing', async function (this: World, key: string) {
  assert.equal(await this.platform.load(key), null);
});

Then('the letter travel time is {int} milliseconds', function (milliseconds: number) {
  assert.equal(currentStyle.timings.letterTravel, milliseconds);
});

Then('every test level passes the validator', function () {
  for (const level of levels) {
    assert.deepEqual(validateLevel(level).errors, [], level.finalWord);
  }
});
