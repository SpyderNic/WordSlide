import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

// Add each story here as it's built.
const built = ["02-show-a-level","03-place-a-letter","04-return-a-letter","05-recall-all","06-check-and-lock-a-word","17-pool-as-a-keyboard","07-switch-to-phase-two","08-slide-a-word","09-reorder-rows","10-win-check-and-celebration","11-next-level-and-progress","16-visual-style","12-first-level-tutorial","21-reordering-taught-later","15-draft-the-first-levels","23-a-pool-for-each-row","24-after-playing-story-23","19-hints","20-coins-and-ads"];

const testDir = defineBddConfig({
  features: ['tests/browser/*.feature', ...built.map((story) => `features/story-${story}.feature`)],
  tags: '@browser',
  steps: 'tests/browser/steps/*.ts',
});

export default defineConfig({
  testDir,
  reporter: [['list'], ['html', { outputFolder: 'reports/browser', open: 'never' }]],
  use: { baseURL: 'http://localhost:5173' },
  projects: [
    {
      name: 'desktop',
      grepInvert: /@touch/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 800, height: 450 } },
    },
    {
      name: 'touch',
      grep: /@touch/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 800, height: 450 }, hasTouch: true },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
