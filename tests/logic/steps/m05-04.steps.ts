import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { Level } from '../../../src/game/level';
import { needsReordering, reorderingTutorial } from '../../../src/game/reordering';
import { makeLevel, tutorialLevel } from '../../support/levels';

interface ReorderingWorld {
  level: Level;
  levels: Level[];
}

// In length order (D5), these spell their final word by sliding alone.
const SLIDES_ONLY = () => makeLevel(['CAT', 'DOG', 'OWL']);
// Only DOG has a D and only CAT a C, so DOG must sit above CAT, the other way round from D5.
const SAME_LENGTH_SWAPPED = () => makeLevel(['DOG', 'CAT', 'OWL']);
// Only ZEBRA has a Z, so it must sit above the shorter CAT and DOG.
const LONGER_ABOVE_SHORTER = () => makeLevel(['ZEBRA', 'CAT', 'DOG']);

Given('a level whose rows, in length order, spell the final word by sliding', function (this: ReorderingWorld) {
  this.level = SLIDES_ONLY();
});

Given('a level that can only be solved with two same-length rows swapped', function (this: ReorderingWorld) {
  this.level = SAME_LENGTH_SWAPPED();
});

Given('a level that can only be solved with a longer row above a shorter one', function (this: ReorderingWorld) {
  this.level = LONGER_ABOVE_SHORTER();
});

Then("it doesn't need reordering", function (this: ReorderingWorld) {
  assert.equal(needsReordering(this.level), false);
});

Then('it needs reordering', function (this: ReorderingWorld) {
  assert.equal(needsReordering(this.level), true);
});

Given('levels where the first that needs reordering is the 3rd', function (this: ReorderingWorld) {
  this.levels = [SLIDES_ONLY(), SLIDES_ONLY(), LONGER_ABOVE_SHORTER(), SLIDES_ONLY()];
  assert.equal(reorderingTutorial(this.levels), 3);
});

When('the 2nd level changes so that it needs reordering', function (this: ReorderingWorld) {
  this.levels[1] = SAME_LENGTH_SWAPPED();
});

Given('the levels start with the FOX, OWL and OX tutorial, followed by a level that needs reordering', function (this: ReorderingWorld) {
  this.levels = [tutorialLevel(), LONGER_ABOVE_SHORTER(), SLIDES_ONLY()];
});

Then('the 2nd level is the reordering tutorial', function (this: ReorderingWorld) {
  assert.equal(reorderingTutorial(this.levels), 2);
});
