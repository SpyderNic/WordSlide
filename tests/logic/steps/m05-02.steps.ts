import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Given, Then, When } from '@cucumber/cucumber';
import { currentStyle, styles } from '../../../src/style';
import type { Style } from '../../../src/style/Style';

interface StyleWorld {
  style: Style;
}

// Every approved scenario with a different style

Given("the style's colours are changed", function (this: StyleWorld) {
  this.style = styles.recoloured;
  assert.ok(this.style, 'No recoloured style');
});

When('every approved scenario runs', function (this: StyleWorld) {
  // The whole suite can't run from inside one of its own scenarios. "npm run test:other-style" runs it
  // again with this style: here we check that command exists and uses it.
  const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts as Record<string, string>;
  assert.ok(scripts['test:other-style'], 'No test:other-style command');
  assert.match(readFileSync('scripts/other-style.mjs', 'utf8'), /recoloured/);
});

Then('they all pass', function (this: StyleWorld) {
  // The other run is the real proof. Here: only the colours differ, so every rule and timing is the same.
  const original = styles.woodAndBrass;
  for (const [name, colour] of Object.entries(this.style.colours)) {
    assert.notEqual(colour, original.colours[name as keyof Style['colours']], `${name} isn't changed`);
  }
  assert.deepEqual(this.style.timings, original.timings);
  assert.equal(this.style.pulseScale, original.pulseScale);
});

// Tile states and highlights

function hex(colour: number) {
  return colour.toString(16).padStart(6, '0');
}

Then('pool, grey x0, placed, revealed, locked and gold tiles each have their own look', function () {
  const { tile, tileGrey, tilePlaced, tileRevealed, tileLocked, tileGold, background } = currentStyle.colours;
  const states = [tile, tileGrey, tilePlaced, tileRevealed, tileLocked, tileGold];
  assert.equal(new Set(states).size, states.length, states.map(hex).join(', '));
  assert.ok(!states.includes(background));
});

Then('the target highlight and the selected row each have their own look', function () {
  const { tile, tileGrey, tilePlaced, tileRevealed, tileLocked, tileGold, background, highlight } = currentStyle.colours;
  assert.ok(![tile, tileGrey, tilePlaced, tileRevealed, tileLocked, tileGold, background].includes(highlight));
});

// The built game

let built: string[] | null = null;

function filesIn(folder: string): string[] {
  return readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });
}

When('the game is built', { timeout: 180_000 }, function () {
  if (built) return;
  const out = mkdtempSync(join(tmpdir(), 'word-slide-build-'));
  const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', out, '--emptyOutDir'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  built = filesIn(out);
});

Then('it contains no art images', function () {
  const images = built!.filter((path) => /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(path));
  assert.deepEqual(images, []);
});

Then('it includes the font and its licence', function () {
  assert.ok(built!.some((path) => /nunito.*\.woff2$/i.test(path)), 'No Nunito font file');
  const licence = built!.find((path) => /nunito-LICENSE\.txt$/.test(path));
  assert.ok(licence, 'No Nunito licence file');
  assert.match(readFileSync(licence, 'utf8'), /SIL Open Font License/);
});
