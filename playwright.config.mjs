import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:3010',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run dev -- --port 3010',
    url: 'http://localhost:3010/login',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_E2E_MOCK: '1'
    }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
