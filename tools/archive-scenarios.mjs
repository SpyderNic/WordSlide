// Moves scenarios or whole rules out of a feature file into archive/before-story-23/, with a note on what replaced them.
// Usage: node tools/archive-scenarios.mjs <plan.json>, where the plan lists { feature, items: [{ title, kind, note }] }.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';

const ARCHIVE = 'archive/before-story-23';
const plan = JSON.parse(readFileSync(process.argv[2], 'utf8'));
mkdirSync(ARCHIVE, { recursive: true });

const indentOf = (line) => line.length - line.trimStart().length;

for (const { feature, items } of plan) {
  let lines = readFileSync(feature, 'utf8').split(/\r?\n/);
  const archived = [];
  for (const { title, kind, note } of items) {
    const header = kind === 'rule' ? `Rule: ${title}` : null;
    const start = lines.findIndex((line) => (header ? line.trim() === header : /^\s*Scenario( Outline)?: /.test(line) && line.trim().replace(/^Scenario( Outline)?: /, '') === title));
    if (start === -1) throw new Error(`${feature}: "${title}" not found`);
    const indent = indentOf(lines[start]);
    // Tags and comments right above belong to it.
    let first = start;
    while (first > 0 && /^\s*(@|#)/.test(lines[first - 1]) && indentOf(lines[first - 1]) === indent) first--;
    // It ends where the next block at its indent (or a rule, for a scenario) begins.
    let end = start + 1;
    for (; end < lines.length; end++) {
      const line = lines[end];
      if (line.trim() === '') continue;
      const at = indentOf(line);
      if (at < indent || (at === indent && /^\s*(Rule:|Scenario|Scenario Outline:|@|#)/.test(line))) break;
      if (kind !== 'rule' && /^\s*Rule:/.test(line)) break;
    }
    while (end > start + 1 && lines[end - 1].trim() === '') end--;
    archived.push(`  # Archived for story 23: ${note}`, ...lines.slice(first, end), '');
    lines = [...lines.slice(0, first), ...lines.slice(end)];
    // No more than one blank line where it was.
    lines = lines.filter((line, index) => !(line.trim() === '' && lines[index - 1]?.trim() === ''));
  }
  writeFileSync(feature, lines.join('\n'));
  const target = join(ARCHIVE, basename(feature));
  const head = existsSync(target) ? readFileSync(target, 'utf8') : `# Archived from ${feature}, before story 23 (a pool for each row).\n# The game as it was is tagged before-story-23 in git. These scenarios no longer run.\n\nFeature: ${basename(feature, '.feature')} (archived)\n\n`;
  writeFileSync(target, `${head}${archived.join('\n')}\n`);
  console.log(`${feature}: ${items.length} archived`);
}
