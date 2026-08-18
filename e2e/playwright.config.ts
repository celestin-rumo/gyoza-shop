import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env['E2E_BASE_URL'] ?? 'http://localhost:4300';

/**
 * Runs against the disposable stack started by ../docker-compose.e2e.yml
 * (`docker compose -f docker-compose.e2e.yml up -d --build`), not against a
 * dev server managed by Playwright itself: the point is to exercise the same
 * prod-like images (Dockerfile.prod) and the Traefik path-based routing that
 * production relies on.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? [['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
