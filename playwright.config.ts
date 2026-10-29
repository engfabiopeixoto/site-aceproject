import { defineConfig, devices } from '@playwright/test';

// PORTA permite rodar a suíte em várias cópias do projeto ao mesmo tempo.
const porta = process.env.PORTA ?? '4173';
const base = `http://localhost:${porta}`;

export default defineConfig({
  testDir: 'tests',
  reporter: 'line',
  use: { baseURL: base },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'celular', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: `npx http-server site -p ${porta} -c-1 -s`,
    url: base,
    reuseExistingServer: !process.env.CI,
  },
});
