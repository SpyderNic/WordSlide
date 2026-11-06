import assert from 'node:assert/strict';
import { Given, Then } from '@cucumber/cucumber';
import { hintPrice } from '../../../src/game/economy';

interface PriceWorld {
  first: number;
  step: number;
  cap: number;
}

Given(/^a first price of (\d+), a price step of (\d+)% and a price cap of (\d+) times the first price$/, function (this: PriceWorld, first: string, step: string, cap: string) {
  this.first = Number(first);
  this.step = Number(step) / 100;
  this.cap = Number(cap);
});

Then(/^the prices in one level are (.+)$/, function (this: PriceWorld, list: string) {
  const expected = list.split(',').map((price) => Number(price.trim()));
  const prices = expected.map((_, uses) => hintPrice(this.first, uses, this.step, this.cap));
  assert.deepEqual(prices, expected);
});
