import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cellsOf, compareWords, isCharacter, lengthOf } from '../../src/game/characters';
import type { Answer, Level, RevealedLetter } from '../../src/game/level';
import { needsReordering } from '../../src/game/reordering';
import { MAX_LENGTH, MAX_ROWS, MIN_LENGTH, MIN_ROWS, validateLevel } from '../../src/game/validator';

/**
 * The level generator (story 14, D44): an offline tool that suggests levels from a theme's word list.
 * It's plain code with no browser or game, and isn't shipped with the game.
 */

export type Reveal = { kind: 'none' } | { kind: 'first' } | { kind: 'random'; letters: number };

export interface Settings {
  rows: number;
  /** The answers' lengths, counting letters and digits (D12). */
  shortest: number;
  longest: number;
  /** None by default (R9). */
  reveal?: Reveal;
  /** Whether the rows, in their starting order, can't spell the final word by sliding (R10, story 21 Q10). */
  reordering: 'needed' | 'not needed';
  /** How many suggestions to offer. */
  count?: number;
}

export interface Generated {
  suggestions: Level[];
  warnings: string[];
}

const COUNT = 10;
/** A final word gives a few suggestions at most, so a run offers different final words. */
const PER_FINAL_WORD = 3;
/** A cap on the search for each final word, so a long list can't make a run take forever. */
const SEARCH_LIMIT = 20000;

function checkSettings(settings: Settings) {
  const { rows, shortest, longest, reveal } = settings;
  const outside = (what: string) => new Error(`The setting ${what} is outside the limits of the game (story 1).`);
  if (!Number.isInteger(rows) || rows < MIN_ROWS || rows > MAX_ROWS) throw outside(`${rows} rows`);
  if (!Number.isInteger(shortest) || !Number.isInteger(longest) || shortest < MIN_LENGTH || longest > MAX_LENGTH || shortest > longest) {
    throw outside(`words of ${shortest} to ${longest} letters`);
  }
  if (reveal?.kind === 'random' && (!Number.isInteger(reveal.letters) || reveal.letters < 1)) throw outside(`${reveal.letters} letters at random`);
}

/** The words a theme's approved levels already use: answers and final words (R11). */
function usedWords(theme: string, approved: Level[]): Set<string> {
  return new Set(approved.filter((level) => level.theme === theme).flatMap((level) => [level.finalWord, ...level.answers.map((answer) => answer.word)]));
}

/** A small, seeded random generator, so random letters are the same on every run (R7, R9). */
function random(seed: string): () => number {
  let state = [...seed].reduce((hash, character) => Math.imul(hash ^ character.codePointAt(0)!, 16777619), 2166136261) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Revealed letters are picked here, once, and stored in the level, so every player sees the same ones (R9). */
function revealLetters(answers: Answer[], reveal: Reveal | undefined, finalWord: string): Answer[] {
  if (!reveal || reveal.kind === 'none') return answers;
  if (reveal.kind === 'first') {
    return answers.map((answer) => {
      const cells = cellsOf(answer.word);
      const first = cells.findIndex(isCharacter);
      return { ...answer, revealed: [{ position: first + 1, letter: cells[first] }] };
    });
  }
  const letterCells = answers.flatMap((answer, row) => cellsOf(answer.word).flatMap((cell, index) => (isCharacter(cell) ? [{ row, index, cell }] : [])));
  const next = random(`${finalWord}:${answers.map((answer) => answer.word).join(',')}`);
  const picked = new Map<number, RevealedLetter[]>();
  for (let count = 0; count < Math.min(reveal.letters, letterCells.length); count++) {
    const [{ row, index, cell }] = letterCells.splice(Math.floor(next() * letterCells.length), 1);
    picked.set(row, [...(picked.get(row) ?? []), { position: index + 1, letter: cell }]);
  }
  return answers.map((answer, row) => {
    const revealed = picked.get(row)?.sort((a, b) => a.position - b.position);
    return revealed ? { ...answer, revealed } : answer;
  });
}

/** Sets of different answers, one for each of the final word's letters, in a fixed order (R2, R7). */
function* answerSets(letters: string[], candidates: string[]): Generator<string[]> {
  const chosen: string[] = [];
  const seen = new Set<string>();
  let steps = 0;
  function* pick(index: number): Generator<string[]> {
    if (index === letters.length) {
      const key = [...chosen].sort().join();
      if (!seen.has(key)) {
        seen.add(key);
        yield [...chosen];
      }
      return;
    }
    for (const word of candidates) {
      if (++steps > SEARCH_LIMIT) return;
      if (chosen.includes(word) || !cellsOf(word).includes(letters[index])) continue;
      chosen.push(word);
      yield* pick(index + 1);
      chosen.pop();
    }
  }
  yield* pick(0);
}

export function generate(theme: string, words: string[], settings: Settings, approved: Level[] = []): Generated {
  checkSettings(settings);
  const count = settings.count ?? COUNT;
  const used = usedWords(theme, approved);
  const list = [...new Set(words.map((word) => word.trim().normalize('NFC').toUpperCase()).filter(Boolean))].filter((word) => !used.has(word)).sort(compareWords);
  // The final word comes from the theme's list, and has one letter per row (R2, R3).
  const finals = list.filter((word) => cellsOf(word).every(isCharacter) && cellsOf(word).length === settings.rows);
  const answers = list.filter((word) => lengthOf(word) >= settings.shortest && lengthOf(word) <= settings.longest);

  const suggestions: Level[] = [];
  for (const finalWord of finals) {
    if (suggestions.length >= count) break;
    let fromThisWord = 0;
    // A final word can't also be one of its answers (R4).
    for (const set of answerSets(cellsOf(finalWord), answers.filter((word) => word !== finalWord))) {
      const level: Level = { theme, answers: set.map((word) => ({ word })), finalWord };
      const result = validateLevel(level);
      // Every suggestion passes, and none start already solved (R5).
      if (result.errors.length > 0 || result.warnings.length > 0) continue;
      if (needsReordering(level) !== (settings.reordering === 'needed')) continue;
      suggestions.push({ ...level, answers: revealLetters(level.answers, settings.reveal, finalWord) });
      if (++fromThisWord >= PER_FINAL_WORD || suggestions.length >= count) break;
    }
  }

  const warnings = suggestions.length < count ? [`Only ${suggestions.length} of ${count} suggestions: too few unused words for these settings.`] : [];
  return { suggestions, warnings };
}

// The review file (R6, Q2)

function describe(settings: Settings): string {
  const reveal = settings.reveal ?? { kind: 'none' };
  const revealed = reveal.kind === 'none' ? 'no revealed letters' : reveal.kind === 'first' ? 'first letters revealed' : `${reveal.letters} letters revealed at random`;
  return `${settings.rows} rows, words of ${settings.shortest} to ${settings.longest} letters, ${revealed}, reordering ${settings.reordering}`;
}

export function reviewText(theme: string, settings: Settings, generated: Generated): string {
  const lines = [
    `# Level suggestions: ${theme}`,
    '',
    `**Settings:** ${describe(settings)}.`,
    '',
    'Tick the box of each level to keep, then approve the file with `npm run levels:approve -- <this file>`.',
    '',
  ];
  for (const warning of generated.warnings) lines.push(`🟥 ${warning}`, '');
  generated.suggestions.forEach((level, index) => {
    lines.push(`### 🟩 Suggestion ${index + 1}: ${level.finalWord}`, '', '- [ ] Keep this level', '', `🟨 **Final word:** ${level.finalWord}`, '');
    for (const answer of level.answers) {
      const shown = cellsOf(answer.word).map((cell, position) => (answer.revealed?.some((letter) => letter.position === position + 1) ? `**${cell}**` : cell)).join(' ');
      lines.push(`- 🟦 ${shown}`);
    }
    lines.push('', `<!-- level ${JSON.stringify(level)} -->`, '');
  });
  return lines.join('\n');
}

/** Writes the suggestions to a review file, and never touches the game's levels (R6). */
export function run(theme: string, words: string[], settings: Settings, approved: Level[], folder: string): Generated & { reviewFile: string } {
  const generated = generate(theme, words, settings, approved);
  mkdirSync(folder, { recursive: true });
  const name = `${theme}-${settings.rows}-rows-${settings.shortest}-${settings.longest}-${settings.reordering.replace(' ', '-')}.md`.toLowerCase().replace(/[^a-z0-9.-]+/g, '-');
  const reviewFile = join(folder, name);
  writeFileSync(reviewFile, reviewText(theme, settings, generated));
  return { ...generated, reviewFile };
}

/** The ticked suggestions in a review file. */
export function tickedLevels(text: string): Level[] {
  return text
    .split(/^### /m)
    .slice(1)
    .filter((section) => /^- \[[xX]\] /m.test(section))
    .map((section) => {
      const data = /<!-- level (.+) -->/.exec(section);
      if (!data) throw new Error('A ticked suggestion has lost its level data.');
      return JSON.parse(data[1]) as Level;
    });
}

/** Adds the ticked suggestions to the game's levels. Each must still pass the validator. */
export function approve(reviewFile: string, levelsFile: string): Level[] {
  const ticked = tickedLevels(readFileSync(reviewFile, 'utf8'));
  for (const level of ticked) {
    const { errors } = validateLevel(level);
    if (errors.length > 0) throw new Error(`A ticked level fails the validator: ${errors.join(', ')}.`);
  }
  const levels = JSON.parse(readFileSync(levelsFile, 'utf8')) as Level[];
  writeFileSync(levelsFile, `${JSON.stringify([...levels, ...ticked], null, 2)}\n`);
  return ticked;
}
