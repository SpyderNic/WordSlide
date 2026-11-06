import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

// Add each story here as it's built.
const built = ["m02-02-show-a-level","m03-01-place-a-letter","m03-02-return-a-letter","m03-03-recall-all","m03-04-check-and-lock-a-word","m03-05-pool-as-a-keyboard","m04-01-switch-to-phase-two","m04-02-slide-a-word","m04-03-reorder-rows","m04-04-win-check-and-celebration","m05-01-next-level-and-progress","m05-02-visual-style","m05-03-first-level-tutorial","m05-04-reordering-taught-later","m06-02-draft-the-first-levels","m06-03-a-pool-for-each-row","m06-04-after-playing-m06-03","m07-01-hints","m07-02-coins-and-ads","m07-03-buying-hints","m07-04-level-series"];

const testDir = defineBddConfig({
  features: ['tests/browser/*.feature', ...built.map((story) => `features/**/${story}.feature`)],
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
