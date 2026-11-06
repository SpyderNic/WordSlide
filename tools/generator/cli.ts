import { existsSync, readFileSync } from 'node:fs';
import type { Level } from '../../src/game/level';
import { approve, run, type Reveal, type Settings } from './generate';

/**
 * The level generator's single command (M06-01, R8).
 *   npm run levels:generate -- --theme Animals --words content/word-lists/animals.txt --rows 3 [--lengths 3-5]
 *     [--reveal none|first|random:2] [--reordering needed|not-needed] [--count 10] [--levels src/levels/levels.json] [--out content/reviews]
 *   npm run levels:approve -- content/reviews/<file>.md [--levels src/levels/levels.json]
 */

const LEVELS = 'src/levels/levels.json';

function option(args: string[], name: string, fallback?: string): string {
  const index = args.indexOf(`--${name}`);
  const value = index === -1 ? fallback : args[index + 1];
  if (value === undefined) throw new Error(`Missing --${name}.`);
  return value;
}

function reveal(value: string): Reveal {
  if (value === 'none') return { kind: 'none' };
  if (value === 'first') return { kind: 'first' };
  const random = /^random:(\d+)$/.exec(value);
  if (random) return { kind: 'random', letters: Number(random[1]) };
  throw new Error(`Unknown --reveal ${value}.`);
}

function words(file: string): string[] {
  return readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*/, '').trim())
    .filter(Boolean);
}

function main(args: string[]) {
  const [command, ...rest] = args;
  if (command === 'generate') {
    const [shortest, longest] = option(rest, 'lengths', '3-8').split('-').map(Number);
    const settings: Settings = {
      rows: Number(option(rest, 'rows')),
      shortest,
      longest,
      reveal: reveal(option(rest, 'reveal', 'none')),
      reordering: option(rest, 'reordering', 'not-needed') === 'needed' ? 'needed' : 'not needed',
      count: Number(option(rest, 'count', '10')),
    };
    const levelsFile = option(rest, 'levels', LEVELS);
    const approved = existsSync(levelsFile) ? (JSON.parse(readFileSync(levelsFile, 'utf8')) as Level[]) : [];
    const result = run(option(rest, 'theme'), words(option(rest, 'words')), settings, approved, option(rest, 'out', 'content/reviews'));
    // Only counts: the suggestions' words stay in the review file (D46).
    console.log(`${result.suggestions.length} suggestions written to ${result.reviewFile}`);
    for (const warning of result.warnings) console.log(warning);
  } else if (command === 'approve') {
    const [file] = rest;
    if (!file) throw new Error('Name the review file to approve.');
    const added = approve(file, option(rest, 'levels', LEVELS));
    console.log(`${added.length} levels added.`);
  } else {
    throw new Error('Use "generate" or "approve".');
  }
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}
