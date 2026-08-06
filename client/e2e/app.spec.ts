import { expect, test, type Page } from '@playwright/test';

const ROOM_TRANSITION_TIMEOUT = 10_000;
const CITY_ROOM_ONE_MAX_HEALTH = 425;
const CITY_ROOM_TWO_MAX_HEALTH = 425;

async function whileHoldingKey(
  page: Page,
  key: string,
  action: () => Promise<void>,
) {
  await page.keyboard.down(key);
  try {
    await action();
  } finally {
    await page.keyboard.up(key);
  }
}

async function holdKeyFor(page: Page, key: string, duration: number) {
  await whileHoldingKey(page, key, () => page.waitForTimeout(duration));
}

async function enterGame(page: Page) {
  await enterTitle(page);
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'game');
  await enableEnemyHealth(page);
}

async function enterTitle(page: Page) {
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'start');

  const bounds = await getCanvasBounds(page);
  const startButton = getCanvasPoint(bounds, 640, 402);
  await page.mouse.click(startButton.x, startButton.y);
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');
}

async function enableEnemyHealth(page: Page) {
  const adminButton = page.getByRole('button', { name: 'ADMIN' });
  await adminButton.click();
  await page.getByRole('button', { name: 'Enemy health display' }).click();
  await adminButton.click();
}

async function getCanvasBounds(page: Page) {
  const canvas = page.locator('#game-root canvas');
  const bounds = await canvas.boundingBox();

  if (!bounds) {
    throw new Error('Phaser canvas bounds are unavailable');
  }

  return bounds;
}

function getCanvasPoint(
  bounds: Awaited<ReturnType<typeof getCanvasBounds>>,
  x: number,
  y: number,
) {
  return {
    x: bounds.x + bounds.width * (x / 1280),
    y: bounds.y + bounds.height * (y / 720),
  };
}

async function fireAt(
  page: Page,
  bounds: Awaited<ReturnType<typeof getCanvasBounds>>,
  x: number,
  y: number,
  duration: number,
) {
  const point = getCanvasPoint(bounds, x, y);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  try {
    await page.waitForTimeout(duration);
  } finally {
    await page.mouse.up();
  }
}

async function fireShotsAt(
  page: Page,
  bounds: Awaited<ReturnType<typeof getCanvasBounds>>,
  x: number,
  y: number,
  count: number,
) {
  const point = getCanvasPoint(bounds, x, y);
  await page.mouse.move(point.x, point.y);

  for (let shot = 0; shot < count; shot += 1) {
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(160);
  }
}

async function runAndFireAt(
  page: Page,
  bounds: Awaited<ReturnType<typeof getCanvasBounds>>,
  x: number,
  y: number,
  duration: number,
) {
  const point = getCanvasPoint(bounds, x, y);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  try {
    await holdKeyFor(page, 'KeyD', duration);
  } finally {
    await page.mouse.up();
  }
}

type FireTarget = [x: number, y: number, durationMs: number];

const CITY_ROOM_ONE_GROUND_TARGETS: FireTarget[] = [
  [640, 630, 1200],
  [950, 630, 2000],
  [1120, 630, 2500],
];

async function clearRoom(
  page: Page,
  bounds: Awaited<ReturnType<typeof getCanvasBounds>>,
  targets: FireTarget[],
) {
  for (const [x, y, duration] of targets) {
    await fireAt(page, bounds, x, y, duration);
  }
}

async function finishActiveFlyers(
  page: Page,
  bounds: Awaited<ReturnType<typeof getCanvasBounds>>,
) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const target = await page.evaluate(() => {
      type RuntimeScene = {
        cameras: { main: { scrollX: number; scrollY: number } };
        enemies: Array<{
          active: boolean;
          currentHealth: number;
          x: number;
          y: number;
          constructor: { name: string };
        }>;
      };
      type DebugGame = { scene: { getScene: (key: string) => unknown } };
      const game = (window as unknown as { __game?: DebugGame }).__game!;
      const scene = game.scene.getScene('game') as RuntimeScene;
      const flyer = scene.enemies.find(
        (enemy) =>
          enemy.active &&
          enemy.currentHealth > 0 &&
          enemy.constructor.name === 'FlyingEnemy',
      );
      if (!flyer) {
        return null;
      }

      return {
        x: Math.min(1240, Math.max(40, flyer.x - scene.cameras.main.scrollX)),
        y: Math.min(680, Math.max(40, flyer.y - scene.cameras.main.scrollY)),
      };
    });

    if (!target) {
      return;
    }

    await fireAt(page, bounds, target.x, target.y, 1200);
  }
}

async function clearCityRoomOne(
  page: Page,
  bounds: Awaited<ReturnType<typeof getCanvasBounds>>,
) {
  await clearRoom(page, bounds, CITY_ROOM_ONE_GROUND_TARGETS);

  // 지상 교전을 이어 간다. 마지막 비행 적은 2단 발판 위에 있으므로,
  // 지형이 양쪽 탄환을 막는 현재 구조에서는 바닥에서 피해를 줄 수 없다.
  await runAndFireAt(page, bounds, 1120, 630, 8000);
  await holdKeyFor(page, 'KeyD', 2000);
  await whileHoldingKey(page, 'Space', () => page.waitForTimeout(100));
  await page.waitForTimeout(900);
  await whileHoldingKey(page, 'Space', () => page.waitForTimeout(100));
  await page.waitForTimeout(900);
  await fireAt(page, bounds, 640, 360, 1200);
  await finishActiveFlyers(page, bounds);
}

async function enterExitPortal(page: Page) {
  await whileHoldingKey(page, 'KeyD', async () => {
    // 포탈은 클리어된 방의 먼 끝에 열리며, 그 안에 서서 위/W를 눌러야만
    // 플레이어를 통과시킴. ArrowUp은 진입로 지형을 넘는 것과 포탈 진입을
    // 겸하므로, 다음 아레나가 잠길 때까지 눌러줌.
    for (let hop = 0; hop < 34; hop += 1) {
      const roomState = await page
        .locator('main')
        .getAttribute('data-room-state');
      if (roomState === 'locked') {
        return;
      }
      await page.keyboard.down('ArrowUp');
      await page.waitForTimeout(70);
      await page.keyboard.up('ArrowUp');
      await page.waitForTimeout(300);
    }
    await expect(page.locator('main')).toHaveAttribute(
      'data-room-state',
      'locked',
      { timeout: ROOM_TRANSITION_TIMEOUT },
    );
  });
}

async function clearCurrentRoomThroughRuntime(page: Page) {
  await page.evaluate(() => {
    type RuntimeEnemy = { active: boolean };
    type RuntimeScene = {
      enemies: RuntimeEnemy[];
      roomDirector: {
        notifyEnemyDefeated: (enemy: RuntimeEnemy) => void;
      };
    };
    type DebugGame = {
      scene: { getScene: (key: string) => unknown };
    };

    const game = (window as unknown as { __game?: DebugGame }).__game;
    if (!game) {
      throw new Error('Missing development game handle');
    }

    const scene = game.scene.getScene('game') as RuntimeScene;
    for (const enemy of scene.enemies.filter(({ active }) => active)) {
      scene.roomDirector.notifyEnemyDefeated(enemy);
    }
  });
}

test('boots the Phaser canvas', async ({ page }) => {
  await page.goto('/');

  const canvas = page.locator('#game-root canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('width', '1280');
  await expect(canvas).toHaveAttribute('height', '720');
});

test('enters the title from the start screen with a key press', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'start');

  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');
});

test('opens sound settings from both the title and pause screens', async ({
  page,
}) => {
  await enterTitle(page);

  await page.getByRole('button', { name: '설정' }).click();
  const settings = page.getByRole('dialog', { name: '설정' });
  await expect(settings).toBeVisible();
  const graphicsTab = settings.getByRole('tab', { name: '그래픽' });
  const soundTab = settings.getByRole('tab', { name: '사운드' });
  await expect(graphicsTab).toHaveAttribute('aria-selected', 'true');
  await expect(soundTab).toHaveAttribute('aria-selected', 'false');
  await expect(graphicsTab).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(soundTab).toHaveAttribute('aria-selected', 'true');
  await expect(soundTab).toBeFocused();
  await page.keyboard.press('Home');
  await expect(graphicsTab).toHaveAttribute('aria-selected', 'true');
  const displayResolution = page.getByRole('combobox', {
    name: '표시 해상도',
  });
  await expect(displayResolution).toHaveValue('auto');
  await displayResolution.selectOption('960x540');
  await expect(page.locator('main')).toHaveAttribute(
    'data-display-resolution',
    '960x540',
  );
  await expect.poll(async () => (await getCanvasBounds(page)).width).toBe(960);
  await page.getByRole('button', { name: '그래픽 기본값' }).click();
  await expect(displayResolution).toHaveValue('auto');
  await soundTab.click();
  await expect(soundTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('combobox', { name: '표시 해상도' })).toHaveCount(
    0,
  );
  const masterVolume = page.getByRole('slider', { name: '마스터 볼륨' });
  await expect(masterVolume).toHaveValue('90');
  await masterVolume.focus();
  await page.keyboard.press('End');
  await expect(masterVolume).toHaveValue('100');
  await expect(
    page.getByRole('button', { name: '사운드 기본값' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: '사운드 기본값' }).click();
  await expect(masterVolume).toHaveValue('90');

  await page.keyboard.press('Escape');
  await expect(settings).toHaveCount(0);

  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'game');
  await page.keyboard.press('Escape');
  const resume = page.getByRole('button', { name: '재개' });
  const pauseSettings = page.getByRole('button', { name: '설정' });
  await expect(resume).toBeVisible();
  await expect(pauseSettings).toBeVisible();
  expect(
    await Promise.all(
      [resume, pauseSettings].map((button) =>
        button.evaluate((element) => element.getBoundingClientRect().width),
      ),
    ),
  ).toEqual([140, 140]);

  await pauseSettings.click();
  await expect(settings).toBeVisible();
  await page.getByRole('button', { name: '닫기' }).click();
  await expect(settings).toHaveCount(0);
  await expect(page.getByRole('button', { name: '재개' })).toBeVisible();
});

test('keeps the HUD inside the rendered canvas at narrow and wide ratios', async ({
  page,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 2560, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await enterGame(page);

    const canvas = await getCanvasBounds(page);
    const shell = await page.locator('.game-shell').boundingBox();
    const hud = await page.locator('.hud-layer').boundingBox();

    if (!hud || !shell) {
      throw new Error('HUD bounds are unavailable');
    }

    if (viewport.width / viewport.height >= 16 / 9) {
      expect(canvas.x).toBeCloseTo(shell.x);
      expect(canvas.width).toBeCloseTo(shell.width);
      expect(canvas.width / canvas.height).toBeCloseTo(
        await page
          .locator('#game-root canvas')
          .evaluate((element) => element.width / element.height),
      );
    }

    expect(hud.x).toBeGreaterThanOrEqual(canvas.x);
    expect(hud.y).toBeGreaterThanOrEqual(canvas.y);
    expect(hud.x + hud.width).toBeLessThanOrEqual(canvas.x + canvas.width);
    expect(hud.y + hud.height).toBeLessThanOrEqual(canvas.y + canvas.height);
  }
});

test('shows the title before the stage one background finishes loading', async ({
  page,
}) => {
  let releaseBackground: (() => void) | undefined;
  let markBackgroundRequested: (() => void) | undefined;
  const backgroundGate = new Promise<void>((resolve) => {
    releaseBackground = resolve;
  });
  const backgroundRequested = new Promise<void>((resolve) => {
    markBackgroundRequested = resolve;
  });

  await page.route('**/assets/backgrounds/stage-01.webp', async (route) => {
    markBackgroundRequested?.();
    await backgroundGate;
    await route.continue();
  });

  try {
    await enterTitle(page);
    await backgroundRequested;
    await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');

    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');

    releaseBackground?.();
    await expect(page.locator('main')).toHaveAttribute('data-scene', 'game');
  } finally {
    releaseBackground?.();
  }
});

test('loads stage backgrounds one step ahead', async ({ page }) => {
  const requestedBackgrounds = new Set<string>();
  page.on('request', (request) => {
    const fileName = new URL(request.url()).pathname
      .split('/')
      .find((segment) => /^stage-\d{2}\.webp$/.test(segment));

    if (fileName) {
      requestedBackgrounds.add(fileName);
    }
  });

  await enterTitle(page);
  expect(requestedBackgrounds).toEqual(new Set(['stage-01.webp']));

  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'game');
  await expect.poll(() => requestedBackgrounds.has('stage-02.webp')).toBe(true);
  expect(requestedBackgrounds.has('stage-03.webp')).toBe(false);
  expect(requestedBackgrounds.has('stage-04.webp')).toBe(false);
  expect(requestedBackgrounds.has('stage-05.webp')).toBe(false);
});

test('loads enemy and terrain art one stage ahead', async ({ page }) => {
  const requestedAssets = new Set<string>();
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (/\/assets\/(enemies|terrain)\/stage-[12]-/.test(pathname)) {
      requestedAssets.add(pathname.split('/').at(-1) ?? '');
    }
  });

  await enterTitle(page);
  await expect
    .poll(
      () =>
        requestedAssets.has('stage-1-neared.png') &&
        requestedAssets.has('stage-1-floor-left.png'),
    )
    .toBe(true);
  expect(
    [...requestedAssets].some((asset) => asset.startsWith('stage-2-')),
  ).toBe(false);

  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'game');
  await expect
    .poll(
      () =>
        requestedAssets.has('stage-2-neared.png') &&
        requestedAssets.has('stage-2-floor-left.png'),
    )
    .toBe(true);
});

test('starts combat as soon as the room opens', async ({ page }) => {
  await enterTitle(page);
  await page.keyboard.press('Enter');

  await expect(page.locator('main')).toHaveAttribute('data-scene', 'game');
  await expect(page.locator('main')).toHaveAttribute(
    'data-room-state',
    'locked',
  );
  await expect(page.getByRole('meter', { name: 'Enemy health' })).toHaveCount(
    0,
  );

  await enableEnemyHealth(page);
  await expect(
    page.getByRole('meter', { name: 'Enemy health' }),
  ).toHaveAttribute('aria-valuenow', CITY_ROOM_ONE_MAX_HEALTH.toString());
});

test('enters the game and shows the React HUD', async ({ page }) => {
  await enterGame(page);

  await expect(page.locator('main')).toHaveAttribute('data-phase', 'playing');
  await expect(page.locator('main')).toHaveAttribute(
    'data-room-state',
    'locked',
  );
  await expect(
    page.getByRole('meter', { name: 'Player health' }),
  ).toHaveAttribute('aria-valuenow', '100');
  const enemyHealthMeter = page.getByRole('meter', { name: 'Enemy health' });
  await expect(enemyHealthMeter).toHaveAttribute(
    'aria-valuenow',
    CITY_ROOM_ONE_MAX_HEALTH.toString(),
  );
  await expect(enemyHealthMeter).toHaveAttribute(
    'aria-valuemax',
    CITY_ROOM_ONE_MAX_HEALTH.toString(),
  );
});

test('fills four weapon slots and switches them with number keys', async ({
  page,
}) => {
  await enterGame(page);

  const inventory = page.getByRole('list', {
    name: 'Weapon inventory',
  });
  const slots = inventory.getByRole('listitem');
  const expectSlotFrame = (
    index: number,
    frame: 'active' | 'empty' | 'neutral',
  ) =>
    expect(slots.nth(index)).toHaveCSS(
      'border-image-source',
      new RegExp(`slot-frame-${frame}\\.png`),
    );

  await expect(slots).toHaveCount(4);
  await expect(slots.nth(0)).toHaveAttribute('aria-label', '1: SMG');
  await expect(slots.nth(0)).toHaveAttribute('aria-current', 'true');
  await expectSlotFrame(0, 'active');
  await expect(slots.nth(1)).toHaveAttribute('aria-label', '2: Empty');
  await expectSlotFrame(1, 'empty');

  const adminButton = page.getByRole('button', { name: 'ADMIN' });
  await adminButton.click();
  await page.getByRole('button', { name: 'SHOTGUN 지급' }).click();
  await expect(page.locator('main')).toHaveAttribute('data-weapon', 'shotgun');
  await expect(slots.nth(1)).toHaveAttribute('aria-label', '2: SHOTGUN');
  await expect(slots.nth(1)).toHaveAttribute('aria-current', 'true');
  await expectSlotFrame(1, 'active');
  await expectSlotFrame(0, 'neutral');

  await page.getByRole('button', { name: 'BURST RIFLE 지급' }).click();
  await expect(page.locator('main')).toHaveAttribute(
    'data-weapon',
    'burst-rifle',
  );
  await expect(slots.nth(2)).toHaveAttribute('aria-current', 'true');
  await adminButton.click();

  await page.keyboard.press('Digit1');
  await expect(page.locator('main')).toHaveAttribute('data-weapon', 'smg');
  await expect(slots.nth(0)).toHaveAttribute('aria-current', 'true');

  await page.keyboard.press('Digit2');
  await expect(page.locator('main')).toHaveAttribute('data-weapon', 'shotgun');
  await expect(slots.nth(1)).toHaveAttribute('aria-current', 'true');

  await page.keyboard.press('Digit4');
  await expect(page.locator('main')).toHaveAttribute('data-weapon', 'shotgun');
  await expect(slots.nth(3)).toHaveAttribute('aria-label', '4: Empty');
});

test('accepts WASD movement and mouse fire input', async ({ page }) => {
  const runtimeErrors: Error[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error));

  await enterGame(page);

  await holdKeyFor(page, 'KeyD', 180);
  await page.keyboard.press('KeyW');

  const bounds = await getCanvasBounds(page);

  await page.mouse.move(
    bounds.x + bounds.width * 0.75,
    bounds.y + bounds.height * 0.45,
  );
  await page.mouse.down();
  await page.waitForTimeout(240);
  await page.mouse.up();

  expect(runtimeErrors).toEqual([]);
});

test('supports alternate controls and dash input', async ({ page }) => {
  const runtimeErrors: Error[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error));

  await enterGame(page);
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'playing');

  await whileHoldingKey(page, 'ArrowRight', async () => {
    await page.keyboard.press('Shift');
    await page.waitForTimeout(220);
  });
  await page.keyboard.press('Space');

  const bounds = await getCanvasBounds(page);

  await page.mouse.click(
    bounds.x + bounds.width * 0.7,
    bounds.y + bounds.height * 0.5,
    { button: 'right' },
  );

  expect(runtimeErrors).toEqual([]);
});

test('enemy detects the player and deals ranged damage', async ({ page }) => {
  await enterGame(page);
  await page.waitForTimeout(1000);

  const healthMeter = page.getByRole('meter', { name: 'Player health' });
  await expect(healthMeter).toHaveAttribute('aria-valuenow', '100');

  const bounds = await getCanvasBounds(page);
  await fireShotsAt(page, bounds, 640, 630, 6);
  await expect(
    page.getByRole('meter', { name: 'Enemy health' }),
  ).not.toHaveAttribute('aria-valuenow', CITY_ROOM_ONE_MAX_HEALTH.toString());

  await holdKeyFor(page, 'KeyD', 2600);

  await expect(healthMeter).not.toHaveAttribute('aria-valuenow', '100', {
    timeout: 5000,
  });
});

test('melee enemy pursues the player and deals contact damage', async ({
  page,
}) => {
  await enterGame(page);

  const healthMeter = page.getByRole('meter', { name: 'Player health' });
  await expect(healthMeter).toHaveAttribute('aria-valuenow', '100');

  await holdKeyFor(page, 'KeyD', 400);

  await expect(healthMeter).not.toHaveAttribute('aria-valuenow', '100', {
    timeout: 5000,
  });
});

test('invincibility mode prevents player health loss', async ({ page }) => {
  await enterTitle(page);
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'game');

  const adminButton = page.getByRole('button', { name: 'ADMIN' });
  const toggle = page.getByRole('button', { name: 'Invincibility mode' });
  await expect(toggle).toHaveCount(0);
  await adminButton.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('main')).toHaveAttribute('data-invincible', 'true');

  const healthMeter = page.getByRole('meter', { name: 'Player health' });
  await holdKeyFor(page, 'KeyD', 1000);
  await page.waitForTimeout(2000);
  await expect(healthMeter).toHaveAttribute('aria-valuenow', '100');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await holdKeyFor(page, 'KeyD', 400);
  await expect(healthMeter).not.toHaveAttribute('aria-valuenow', '100', {
    timeout: 5000,
  });
});

test('admin menu closes and jumps directly to a selected stage', async ({
  page,
}) => {
  const runtimeErrors: Error[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error));

  await enterTitle(page);
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'game');

  const adminButton = page.getByRole('button', { name: 'ADMIN' });
  const adminMenu = page.getByRole('dialog', { name: 'Admin menu' });

  await expect(adminButton).toHaveAttribute('aria-expanded', 'false');
  await adminButton.click();
  await expect(adminButton).toHaveAttribute('aria-expanded', 'true');
  await expect(adminMenu).toBeVisible();

  for (let stageNumber = 1; stageNumber <= 5; stageNumber += 1) {
    await expect(
      page.getByRole('button', { name: `${stageNumber}스테이지`, exact: true }),
    ).toBeVisible();
  }

  await page.getByRole('button', { name: '닫기' }).click();
  await expect(adminMenu).toHaveCount(0);
  await expect(adminButton).toHaveAttribute('aria-expanded', 'false');

  await adminButton.click();
  await page.getByRole('button', { name: '2스테이지', exact: true }).click();
  await expect(adminMenu).toHaveCount(0);
  await expect(
    page.getByRole('meter', { name: 'Player health' }),
  ).toHaveAttribute('aria-valuemax', '115');
  expect(runtimeErrors).toEqual([]);
});

test('shows the current stage and room directly above the admin button', async ({
  page,
}) => {
  await enterTitle(page);
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'game');

  const location = page.getByLabel('Stage location');
  const adminButton = page.getByRole('button', { name: 'ADMIN' });

  await expect(page.locator('.hud-layer .stage-location')).toHaveCount(1);
  await expect(page.locator('.admin-controls .stage-location')).toHaveCount(0);
  await expect(location).toContainText('STAGE 1 | THE CITY');
  await expect(location).toContainText('ROOM #1');

  const [locationBox, adminBox] = await Promise.all([
    location.boundingBox(),
    adminButton.boundingBox(),
  ]);
  expect(locationBox).not.toBeNull();
  expect(adminBox).not.toBeNull();
  expect(locationBox!.y + locationBox!.height).toBeLessThanOrEqual(adminBox!.y);

  await adminButton.click();
  await page.getByRole('button', { name: '보스', exact: true }).first().click();
  await expect(location).toContainText('ROOM #3');
});

test('stage two spawns each standard enemy with its supplied atlas', async ({
  page,
}) => {
  await enterGame(page);
  await page.getByRole('button', { name: 'ADMIN' }).click();
  await page.getByRole('button', { name: '2스테이지', exact: true }).click();
  await expect(
    page.getByRole('meter', { name: 'Player health' }),
  ).toHaveAttribute('aria-valuemax', '115');

  const textures = await page.evaluate(() => {
    type RuntimeEnemy = { texture: { key: string } };
    type RuntimeScene = { enemies: RuntimeEnemy[] };
    type DebugGame = {
      scene: { getScene: (key: string) => unknown };
    };

    const game = (window as unknown as { __game?: DebugGame }).__game;
    if (!game) {
      throw new Error('Missing development game handle');
    }

    return (game.scene.getScene('game') as RuntimeScene).enemies.map(
      ({ texture }) => texture.key,
    );
  });

  expect(new Set(textures)).toEqual(
    new Set(['stage-2-neared', 'stage-2-ranged', 'stage-2-flying']),
  );
});

test('stage three uses pipe crawlers, captors, and face-only blockers', async ({
  page,
}) => {
  await enterGame(page);
  await page.getByRole('button', { name: 'ADMIN' }).click();
  await page
    .getByRole('button', { name: '3스테이지', exact: true })
    .click();
  await expect(
    page.getByRole('meter', { name: 'Player health' }),
  ).toHaveAttribute('aria-valuemax', '130');
  await expect(page.locator('main')).toHaveAttribute(
    'data-room-state',
    'locked',
    { timeout: 10_000 },
  );
  // 콜드 점프 후 스테이지 3 아틀라스가 도착하며 방이 다시 지어질 때까지 기다려,
  // 천장 정비병의 스프라이트/애니메이션이 준비된 뒤에 상태를 읽는다.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          type RuntimeScene = {
            enemies: Array<{
              anims: { currentAnim?: { key: string } };
              texture: { key: string };
            }>;
          };
          type DebugGame = { scene: { getScene: (key: string) => unknown } };
          const game = (window as unknown as { __game?: DebugGame }).__game!;
          const enemies = (game.scene.getScene('game') as RuntimeScene).enemies;
          return enemies.find(({ texture }) => texture.key === 'stage-3-flying')
            ?.anims.currentAnim?.key;
        }),
      { timeout: 10_000 },
    )
    .toBe('stage-3-flying-pipe-idle');

  const result = await page.evaluate(() => {
    type DamageResult = { applied: boolean; defeated: boolean };
    type RuntimeEnemy = {
      anims: { currentAnim?: { key: string } };
      body: { reset: (x: number, y: number) => void };
      currentHealth: number;
      setPosition: (x: number, y: number) => void;
      setVelocity: (x: number, y: number) => void;
      takeProjectileDamage: (
        damage: number,
        x: number,
        y: number,
      ) => DamageResult;
      texture: { key: string };
      x: number;
      y: number;
    };
    type RuntimePlayer = {
      body: { reset: (x: number, y: number) => void };
      setPosition: (x: number, y: number) => void;
    };
    type RuntimeScene = {
      cameras: { main: { scrollX: number; scrollY: number } };
      enemies: RuntimeEnemy[];
      player: RuntimePlayer;
      terrainBuilder: {
        pipeObjects: Array<{ texture?: { key: string } }>;
      };
    };
    type DebugGame = {
      scene: { getScene: (key: string) => unknown };
    };

    const game = (window as unknown as { __game?: DebugGame }).__game;
    if (!game) {
      throw new Error('Missing development game handle');
    }

    const scene = game.scene.getScene('game') as RuntimeScene;
    const enemies = scene.enemies;
    const blocker = enemies.find(
      ({ texture }) => texture.key === 'stage-3-neared',
    );
    if (!blocker) {
      throw new Error('Missing stage 3 blocker');
    }

    const healthBefore = blocker.currentHealth;
    const blocked = blocker.takeProjectileDamage(
      10,
      blocker.x,
      blocker.y,
    );
    const healthAfterShield = blocker.currentHealth;

    scene.player.setPosition(330, 600);
    scene.player.body.reset(330, 600);
    blocker.setPosition(650, blocker.y);
    blocker.body.reset(650, blocker.y);
    blocker.setVelocity(0, 0);
    const crawler = enemies.find(
      ({ texture }) => texture.key === 'stage-3-flying',
    );

    return {
      blocked,
      healthBefore,
      healthAfterShield,
      textures: enemies.map(({ texture }) => texture.key),
      pipeTextures: scene.terrainBuilder.pipeObjects.flatMap(({ texture }) =>
        texture ? [texture.key] : [],
      ),
      crawlerAnimation: crawler?.anims.currentAnim?.key,
      crawlerY: crawler?.y,
    };
  });

  expect(new Set(result.textures)).toEqual(
    new Set([
      'stage-3-flying',
      'stage-3-ranged',
      'stage-3-neared',
    ]),
  );
  expect(result.crawlerY).toBeLessThan(180);
  expect(result.crawlerAnimation).toBe('stage-3-flying-pipe-idle');
  expect(new Set(result.pipeTextures)).toEqual(
    new Set([
      'stage-3-pipe-left',
      'stage-3-pipe-middle',
      'stage-3-pipe-right',
    ]),
  );
  expect(result.blocked.applied).toBe(false);
  expect(result.healthAfterShield).toBe(result.healthBefore);

  // 재배치한 방어형은 원래 발판을 벗어나 바닥으로 낙하하므로, 정착한 뒤에
  // 노출 바이저 좌표를 다시 읽는다(발 정렬 바디 상단, 스프라이트 중심 위 약 41px).
  await page.waitForTimeout(500);
  const faceTarget = await page.evaluate(() => {
    type RuntimeScene = {
      cameras: { main: { scrollX: number; scrollY: number } };
      enemies: Array<{
        texture: { key: string };
        x: number;
        y: number;
        setVelocity: (x: number, y: number) => void;
      }>;
    };
    type DebugGame = { scene: { getScene: (key: string) => unknown } };
    const game = (window as unknown as { __game?: DebugGame }).__game!;
    const scene = game.scene.getScene('game') as RuntimeScene;
    const blocker = scene.enemies.find(
      ({ texture }) => texture.key === 'stage-3-neared',
    )!;
    blocker.setVelocity(0, 0);
    return {
      x: blocker.x - scene.cameras.main.scrollX,
      y: blocker.y - 41 - scene.cameras.main.scrollY,
    };
  });

  const bounds = await getCanvasBounds(page);
  await fireShotsAt(page, bounds, faceTarget.x, faceTarget.y, 3);
  await expect
    .poll(() =>
      page.evaluate(() => {
        type RuntimeScene = {
          enemies: Array<{
            currentHealth: number;
            texture: { key: string };
          }>;
        };
        type DebugGame = {
          scene: { getScene: (key: string) => unknown };
        };
        const game = (window as unknown as { __game?: DebugGame }).__game!;
        const enemies = (game.scene.getScene('game') as RuntimeScene).enemies;
        return enemies.find(
          ({ texture }) => texture.key === 'stage-3-neared',
        )?.currentHealth;
      }),
    )
    .toBeLessThan(result.healthAfterShield);
});

test('stage four uses three infernal patterns with at most two attackers', async ({
  page,
}) => {
  await enterGame(page);
  await page.getByRole('button', { name: 'ADMIN' }).click();
  await page
    .getByRole('button', { name: '4스테이지', exact: true })
    .click();
  await expect(
    page.getByRole('meter', { name: 'Player health' }),
  ).toHaveAttribute('aria-valuemax', '150');
  await expect(page.locator('main')).toHaveAttribute(
    'data-room-state',
    'locked',
    { timeout: 10_000 },
  );

  const result = await page.evaluate(async () => {
    type RuntimeEnemy = {
      active: boolean;
      getData: (key: string) => unknown;
      texture: { key: string };
      x: number;
      y: number;
    };
    type RuntimePlayer = {
      body: { reset: (x: number, y: number) => void };
      setPosition: (x: number, y: number) => void;
    };
    type RuntimeScene = {
      enemies: RuntimeEnemy[];
      player: RuntimePlayer;
    };
    type DebugGame = { scene: { getScene: (key: string) => unknown } };
    const game = (window as unknown as { __game?: DebugGame }).__game!;
    const scene = game.scene.getScene('game') as RuntimeScene;

    scene.player.setPosition(2_500, 600);
    scene.player.body.reset(2_500, 600);
    let maximumAttackers = 0;
    let sawThreeNearbyEnemies = false;
    for (let sample = 0; sample < 30; sample += 1) {
      const active = scene.enemies.filter(({ active }) => active);
      maximumAttackers = Math.max(
        maximumAttackers,
        active.filter((enemy) => enemy.getData('stage-four-attacking')).length,
      );
      sawThreeNearbyEnemies ||=
        active.filter(
          ({ x, y }) => Math.hypot(x - 2_500, y - 600) <= 760,
        ).length >= 3;
      await new Promise((resolve) => window.setTimeout(resolve, 100));
    }

    return {
      textures: scene.enemies.map(({ texture }) => texture.key),
      maximumAttackers,
      sawThreeNearbyEnemies,
    };
  });

  expect(new Set(result.textures)).toEqual(
    new Set([
      'infernal-hound-placeholder',
      'executioner-doll-placeholder',
      'judgment-eye-placeholder',
    ]),
  );
  expect(result.sawThreeNearbyEnemies).toBe(true);
  expect(result.maximumAttackers).toBe(2);
});

test('stage three pipe crawler stays aligned above its floor segment', async ({
  page,
}) => {
  await enterGame(page);
  await page.getByRole('button', { name: 'ADMIN' }).click();
  await page
    .getByRole('button', { name: '3스테이지', exact: true })
    .click();

  await expect
    .poll(() =>
      page.evaluate(() => {
        type RuntimeEnemy = {
          anims: { currentAnim?: { key: string } };
          texture: { key: string };
        };
        type RuntimeScene = { enemies: RuntimeEnemy[] };
        type DebugGame = { scene: { getScene: (key: string) => unknown } };
        const game = (window as unknown as { __game?: DebugGame }).__game!;
        const enemies = (game.scene.getScene('game') as RuntimeScene).enemies;
        return enemies.find(({ texture }) => texture.key === 'stage-3-flying')
          ?.anims.currentAnim?.key;
      }),
    )
    .toBe('stage-3-flying-pipe-idle');

  await page.evaluate(() => {
    type RuntimeEnemy = {
      takeProjectileDamage: (damage: number, x: number, y: number) => unknown;
      texture: { key: string };
      x: number;
      y: number;
    };
    type RuntimeScene = { enemies: RuntimeEnemy[] };
    type DebugGame = { scene: { getScene: (key: string) => unknown } };
    const game = (window as unknown as { __game?: DebugGame }).__game!;
    const enemies = (game.scene.getScene('game') as RuntimeScene).enemies;
    const crawler = enemies.find(
      ({ texture }) => texture.key === 'stage-3-flying',
    )!;
    crawler.takeProjectileDamage(50, crawler.x, crawler.y);
  });

  await expect
    .poll(() =>
      page.evaluate(() => {
        type RuntimeEnemy = {
          anims: { currentAnim?: { key: string } };
          texture: { key: string };
        };
        type RuntimeScene = { enemies: RuntimeEnemy[] };
        type DebugGame = { scene: { getScene: (key: string) => unknown } };
        const game = (window as unknown as { __game?: DebugGame }).__game!;
        const enemies = (game.scene.getScene('game') as RuntimeScene).enemies;
        return enemies.find(({ texture }) => texture.key === 'stage-3-flying')
          ?.anims.currentAnim?.key;
      }),
      { timeout: 5_000 },
    )
    .toBe('stage-3-flying-floor-idle');

  const groundPose = await page.evaluate(() => {
    type RuntimeEnemy = {
      body: { allowGravity: boolean; bottom: number; offset: { y: number } };
      displayOriginY: number;
      texture: { key: string };
      x: number;
      y: number;
    };
    type RuntimeScene = { enemies: RuntimeEnemy[] };
    type DebugGame = { scene: { getScene: (key: string) => unknown } };
    const game = (window as unknown as { __game?: DebugGame }).__game!;
    const enemies = (game.scene.getScene('game') as RuntimeScene).enemies;
    const crawler = enemies.find(
      ({ texture }) => texture.key === 'stage-3-flying',
    )!;
    return {
      allowGravity: crawler.body.allowGravity,
      bodyBottom: crawler.body.bottom,
      bodyOffsetY: crawler.body.offset.y,
      opaqueBottom: crawler.y - crawler.displayOriginY + 87,
      x: crawler.x,
      y: crawler.y,
    };
  });

  expect(groundPose.allowGravity).toBe(true);
  expect(groundPose.bodyOffsetY).toBe(1);
  expect(groundPose.opaqueBottom).toBeCloseTo(groundPose.bodyBottom, 1);
  expect(groundPose.x).toBeGreaterThan(2_000);
});

test('stage two ground enemies stop at pit edges instead of falling', async ({
  page,
}) => {
  await enterGame(page);
  await page.getByRole('button', { name: 'ADMIN' }).click();
  await page.getByRole('button', { name: '2스테이지', exact: true }).click();
  await expect(
    page.getByRole('meter', { name: 'Player health' }),
  ).toHaveAttribute('aria-valuemax', '115');
  await page.evaluate(() => {
    type RuntimeBody = { reset: (x: number, y: number) => void };
    type RuntimeActor = {
      body: RuntimeBody;
      texture: { key: string };
      x: number;
      y: number;
      setPosition: (x: number, y: number) => void;
    };
    type RuntimeScene = {
      enemies: RuntimeActor[];
      player: RuntimeActor;
    };
    type DebugGame = {
      scene: { getScene: (key: string) => unknown };
    };

    const game = (window as unknown as { __game?: DebugGame }).__game;
    if (!game) {
      throw new Error('Missing development game handle');
    }

    const scene = game.scene.getScene('game') as RuntimeScene;
    const melee = scene.enemies.find(
      ({ texture }) => texture.key === 'stage-2-neared',
    );
    if (!melee) {
      throw new Error('Missing stage 2 melee enemy');
    }

    // 플레이어를 1번 방 후반 구덩이 건너편에, 근접 적을 그 가까운 가장자리에
    // 둔다. 적의 추격 AI가 구덩이 쪽으로 계속 밀고 들어온다.
    scene.player.setPosition(2800, 600);
    scene.player.body.reset(2800, 600);
    melee.setPosition(2350, melee.y);
    melee.body.reset(2350, melee.y);
  });

  await page.waitForTimeout(1500);
  const meleePosition = await page.evaluate(() => {
    type RuntimeScene = {
      enemies: Array<{
        texture: { key: string };
        x: number;
        y: number;
      }>;
    };
    type DebugGame = {
      scene: { getScene: (key: string) => unknown };
    };
    const game = (window as unknown as { __game?: DebugGame }).__game!;
    const scene = game.scene.getScene('game') as RuntimeScene;
    const melee = scene.enemies.find(
      ({ texture }) => texture.key === 'stage-2-neared',
    )!;
    return { x: melee.x, y: melee.y };
  });

  expect(meleePosition.x).toBeLessThan(2450);
  expect(meleePosition.y).toBeLessThan(656);
});

test('admin menu scrolls instead of overflowing a short viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 360 });
  await enterTitle(page);
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'game');

  await page.getByRole('button', { name: 'ADMIN' }).click();
  const adminMenu = page.getByRole('dialog', { name: 'Admin menu' });
  const initialMetrics = await adminMenu.evaluate((menu) => ({
    clientHeight: menu.clientHeight,
    overflowY: getComputedStyle(menu).overflowY,
    scrollHeight: menu.scrollHeight,
  }));

  expect(initialMetrics.overflowY).toBe('auto');
  expect(initialMetrics.scrollHeight).toBeGreaterThan(
    initialMetrics.clientHeight,
  );

  const [menuBounds, viewportBounds] = await Promise.all([
    adminMenu.boundingBox(),
    page.locator('.game-viewport').boundingBox(),
  ]);
  if (!menuBounds || !viewportBounds) {
    throw new Error('Admin menu bounds are unavailable');
  }
  expect(menuBounds.y).toBeGreaterThanOrEqual(viewportBounds.y);
  expect(menuBounds.y + menuBounds.height).toBeLessThanOrEqual(
    viewportBounds.y + viewportBounds.height,
  );

  await adminMenu.evaluate((menu) => {
    menu.scrollTop = menu.scrollHeight;
  });
  await expect
    .poll(() => adminMenu.evaluate((menu) => menu.scrollTop))
    .toBeGreaterThan(0);
});

test('shows boss health without enabling the standard enemy health HUD', async ({
  page,
}) => {
  await enterTitle(page);
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'game');

  await page.getByRole('button', { name: 'ADMIN' }).click();
  await page.getByRole('button', { name: '보스' }).first().click();

  await expect(page.getByRole('meter', { name: 'Enemy health' })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('meter', { name: 'Boss health' }),
  ).toHaveAttribute('aria-valuemax', '500');

  const [playerHud, bossHud, playerStack] = await Promise.all(
    ['.hud--player', '.hud--enemy', '.hud-player-stack'].map(
      async (selector) => {
        const bounds = await page.locator(selector).boundingBox();
        if (!bounds) {
          throw new Error(`HUD bounds are unavailable: ${selector}`);
        }
        return bounds;
      },
    ),
  );

  expect(bossHud.height).toBe(playerHud.height);
  expect(bossHud.height).toBeLessThan(playerStack.height);
});

test('player fire damages the enemy without stopping combat', async ({
  page,
}) => {
  const runtimeErrors: Error[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error));

  await enterGame(page);
  await page.waitForTimeout(1000);

  const bounds = await getCanvasBounds(page);
  await fireShotsAt(page, bounds, 640, 630, 1);

  await expect(
    page.getByRole('meter', { name: 'Enemy health' }),
  ).toHaveAttribute('aria-valuenow', '414', { timeout: 5000 });
  expect(runtimeErrors).toEqual([]);
});

test('platforms block player projectiles', async ({ page }) => {
  await enterGame(page);
  await page.evaluate(() => {
    type RuntimeBody = { reset: (x: number, y: number) => void };
    type RuntimeActor = {
      body: RuntimeBody;
      constructor: { name: string };
      setPosition: (x: number, y: number) => void;
      x: number;
      y: number;
    };
    type RuntimeScene = {
      enemies: RuntimeActor[];
      player: RuntimeActor;
    };
    type DebugGame = { scene: { getScene: (key: string) => unknown } };
    const game = (window as unknown as { __game?: DebugGame }).__game!;
    const scene = game.scene.getScene('game') as RuntimeScene;

    scene.player.setPosition(3150, 600);
    scene.player.body.reset(3150, 600);
  });
  await page.waitForTimeout(500);

  // 플레이어와 비행 적을 같은 x축의 발판 아래·위에 놓고 위로 사격한다.
  // 탄환이 발판을 통과하지 않으면 비행 적의 체력은 그대로 유지된다.
  const shieldedFlyerHp = () =>
    page.evaluate(() => {
      type RuntimeScene = {
        enemies: Array<{
          active: boolean;
          currentHealth: number;
          constructor: { name: string };
        }>;
      };
      type DebugGame = { scene: { getScene: (key: string) => unknown } };
      const game = (window as unknown as { __game?: DebugGame }).__game!;
      const scene = game.scene.getScene('game') as RuntimeScene;
      return scene.enemies.find(
        (e) => e.active && e.constructor.name === 'FlyingEnemy',
      )!.currentHealth;
    });

  const target = await page.evaluate(() => {
    type RuntimeBody = { reset: (x: number, y: number) => void };
    type RuntimeActor = {
      body: RuntimeBody;
      active: boolean;
      constructor: { name: string };
      setPosition: (x: number, y: number) => void;
      setVelocity: (x: number, y: number) => void;
      updateCombat: () => boolean;
    };
    type RuntimeScene = {
      cameras: { main: { scrollX: number; scrollY: number } };
      enemies: RuntimeActor[];
    };
    type DebugGame = { scene: { getScene: (key: string) => unknown } };
    const game = (window as unknown as { __game?: DebugGame }).__game!;
    const scene = game.scene.getScene('game') as RuntimeScene;
    const flyer = scene.enemies.find(
      (enemy) => enemy.active && enemy.constructor.name === 'FlyingEnemy',
    )!;

    flyer.setPosition(3150, 360);
    flyer.body.reset(3150, 360);
    flyer.setVelocity(0, 0);
    flyer.updateCombat = () => false;
    return {
      x: 3150 - scene.cameras.main.scrollX,
      y: 360 - scene.cameras.main.scrollY,
    };
  });

  const before = await shieldedFlyerHp();
  const bounds = await getCanvasBounds(page);
  await fireAt(page, bounds, target.x, target.y, 300);

  expect(await shieldedFlyerHp()).toBe(before);
});

test('locks the room until every spawned enemy is defeated', async ({
  page,
}) => {
  test.setTimeout(45_000);
  const runtimeErrors: Error[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error));

  await enterGame(page);
  await expect(page.locator('main')).toHaveAttribute(
    'data-room-state',
    'locked',
  );
  await page.waitForTimeout(1000);

  const bounds = await getCanvasBounds(page);
  await clearCityRoomOne(page, bounds);

  await expect(
    page.getByRole('meter', { name: 'Enemy health' }),
  ).toHaveAttribute('aria-valuenow', '0', { timeout: 5000 });
  await expect(page.locator('main')).toHaveAttribute(
    'data-room-state',
    'cleared',
    { timeout: 5000 },
  );
  await expect(page.locator('main')).toHaveAttribute(
    'data-phase',
    'room-cleared',
  );
  await fireShotsAt(page, bounds, 1000, 420, 1);
  expect(runtimeErrors).toEqual([]);
});

test('player death stops combat and supports a fast restart', async ({
  page,
}) => {
  test.setTimeout(45_000);

  await enterGame(page);
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'playing');

  const healthMeter = page.getByRole('meter', { name: 'Player health' });
  await holdKeyFor(page, 'KeyD', 900);

  await expect(page.locator('main')).toHaveAttribute('data-phase', 'dead', {
    timeout: 30_000,
  });
  await expect(healthMeter).toHaveAttribute('aria-valuenow', '0');

  await page.keyboard.press('KeyR');

  await expect(page.locator('main')).toHaveAttribute('data-phase', 'playing');
  await expect(healthMeter).toHaveAttribute('aria-valuenow', '100');
  await expect(
    page.getByRole('meter', { name: 'Enemy health' }),
  ).toHaveAttribute('aria-valuenow', CITY_ROOM_ONE_MAX_HEALTH.toString());
  await expect(page.locator('main')).toHaveAttribute(
    'data-room-state',
    'locked',
  );
});

test('does not offer a weapon drop from a standard enemy', async ({ page }) => {
  const runtimeErrors: Error[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error));

  await enterGame(page);
  await page.waitForTimeout(1000);
  await expect(page.locator('main')).toHaveAttribute('data-weapon', 'smg');

  const bounds = await getCanvasBounds(page);
  await fireAt(page, bounds, 640, 630, 1200);

  await expect(
    page.getByRole('meter', { name: 'Enemy health' }),
  ).not.toHaveAttribute('aria-valuenow', CITY_ROOM_ONE_MAX_HEALTH.toString());
  await holdKeyFor(page, 'KeyD', 700);
  await expect(page.locator('main')).toHaveAttribute('data-nearby-weapon', '');
  await expect(page.locator('main')).toHaveAttribute('data-weapon', 'smg');
  expect(runtimeErrors).toEqual([]);
});

test('enters the clear portal and starts combat in the next room', async ({
  page,
}) => {
  const runtimeErrors: Error[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error));

  await enterGame(page);
  await clearCurrentRoomThroughRuntime(page);

  await expect(page.locator('main')).toHaveAttribute(
    'data-phase',
    'room-cleared',
    { timeout: 5000 },
  );
  const portalState = await page.evaluate(() => {
    type RuntimePortal = {
      view: {
        anims: { currentAnim?: { key: string } };
        texture: { key: string };
        visible: boolean;
      };
    };
    type RuntimeScene = { roomDirector: { portal: RuntimePortal } };
    type DebugGame = { scene: { getScene: (key: string) => unknown } };
    const game = (window as unknown as { __game?: DebugGame }).__game;
    if (!game) {
      throw new Error('Missing development game handle');
    }

    const portal = (game.scene.getScene('game') as RuntimeScene).roomDirector
      .portal.view;
    return {
      animation: portal.anims.currentAnim?.key,
      texture: portal.texture.key,
      visible: portal.visible,
    };
  });
  expect(portalState).toEqual({
    animation: 'room-portal-idle',
    texture: 'room-portal',
    visible: true,
  });

  await enterExitPortal(page);

  await expect(page.locator('main')).toHaveAttribute(
    'data-room-state',
    'locked',
  );
  await expect(
    page.getByRole('meter', { name: 'Enemy health' }),
  ).toHaveAttribute('aria-valuenow', CITY_ROOM_TWO_MAX_HEALTH.toString());
  expect(runtimeErrors).toEqual([]);
});
