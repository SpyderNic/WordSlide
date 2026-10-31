import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'tests/browser/*.feature',
  steps: 'tests/browser/steps/*.ts',
});

export default defineConfig({
  testDir,
  reporter: [['list'], ['html', { outputFolder: 'reports/browser', open: 'never' }]],
  use: { baseURL: 'http://localhost:5173' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 800, height: 450 } } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
