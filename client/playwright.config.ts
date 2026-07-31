import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // 방 클리어 계열 테스트는 제한 시간 안에 적을 전부 처치해야 통과하므로
  // 프레임 처리량에 직접 의존한다. CI 러너는 2코어라 워커를 여럿 띄우면
  // 브라우저끼리 CPU를 나눠 먹다가 이 테스트들만 골라서 떨어진다.
  workers: process.env.CI ? 1 : undefined,
  // 위로 대부분 해결되지만 러너 성능 편차가 남는다. 로컬은 0으로 두어
  // 재시도가 실패를 가리지 않게 한다.
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
