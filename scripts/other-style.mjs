// Runs every scenario again with the recoloured style, to show the style never changes the rules (story 16, R1).
import { spawnSync } from 'node:child_process';

const env = { ...process.env, WORD_SLIDE_STYLE: 'recoloured' };
const run = (args) => spawnSync(process.execPath, args, { stdio: 'inherit', env }).status ?? 1;
const status = run(['node_modules/playwright-bdd/dist/cli/index.js']) || run(['node_modules/@playwright/test/cli.js', 'test']);
process.exit(status);
