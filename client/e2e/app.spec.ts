import { expect, test, type Page } from '@playwright/test';

const ROOM_TRANSITION_TIMEOUT = 10_000;
const SINGLE_ROOM_TEST_TIMEOUT = 75_000;
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
}

async function enterTitle(page: Page) {
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'start');

  const bounds = await getCanvasBounds(page);
  const startButton = getCanvasPoint(bounds, 640, 402);
  await page.mouse.click(startButton.x, startButton.y);
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');
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

async function clearCityRoomOne(
  page: Page,
  bounds: Awaited<ReturnType<typeof getCanvasBounds>>,
) {
  await clearRoom(page, bounds, CITY_ROOM_ONE_GROUND_TARGETS);

  // Continue through the ground encounters. The last flier is above a two-tier
  // platform, so it cannot be damaged from the floor now that terrain blocks
  // both sides' shots.
  await runAndFireAt(page, bounds, 1120, 630, 8000);
  await holdKeyFor(page, 'KeyD', 2000);
  await whileHoldingKey(page, 'Space', () => page.waitForTimeout(100));
  await page.waitForTimeout(900);
  await whileHoldingKey(page, 'Space', () => page.waitForTimeout(100));
  await page.waitForTimeout(900);
  await fireAt(page, bounds, 640, 360, 1200);
}

async function advanceThroughDoor(page: Page) {
  await whileHoldingKey(page, 'KeyD', async () => {
    // Rooms are long and end with an exit wall, so run-up jump repeatedly while
    // crossing. A held jump (not a fast press) is needed — Phaser's JustDown
    // misses a too-quick tap.
    for (let hop = 0; hop < 34; hop += 1) {
      const roomState = await page
        .locator('main')
        .getAttribute('data-room-state');
      if (roomState === 'locked') {
        return;
      }
      await page.keyboard.down('Space');
      await page.waitForTimeout(70);
      await page.keyboard.up('Space');
      await page.waitForTimeout(300);
    }
    await expect(page.locator('main')).toHaveAttribute(
      'data-room-state',
      'locked',
      { timeout: ROOM_TRANSITION_TIMEOUT },
    );
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
  await expect
    .poll(async () => (await getCanvasBounds(page)).width)
    .toBe(960);
  await page.getByRole('button', { name: '그래픽 기본값' }).click();
  await expect(displayResolution).toHaveValue('auto');
  await soundTab.click();
  await expect(soundTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('combobox', { name: '표시 해상도' })).toHaveCount(0);
  const masterVolume = page.getByRole('slider', { name: '마스터 볼륨' });
  await expect(masterVolume).toHaveValue('90');
  await masterVolume.focus();
  await page.keyboard.press('End');
  await expect(masterVolume).toHaveValue('100');
  await expect(page.getByRole('button', { name: '사운드 기본값' })).toBeEnabled();
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
    const hud = await page.locator('.hud-layer').boundingBox();

    if (!hud) {
      throw new Error('HUD bounds are unavailable');
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
  await expect
    .poll(() => requestedBackgrounds.has('stage-02.webp'))
    .toBe(true);
  expect(requestedBackgrounds.has('stage-03.webp')).toBe(false);
  expect(requestedBackgrounds.has('stage-04.webp')).toBe(false);
  expect(requestedBackgrounds.has('stage-05.webp')).toBe(false);
});

test('starts combat as soon as the room opens', async ({
  page,
}) => {
  await enterTitle(page);
  await page.keyboard.press('Enter');

  await expect(page.locator('main')).toHaveAttribute('data-scene', 'game');
  await expect(page.locator('main')).toHaveAttribute(
    'data-room-state',
    'locked',
  );
  await expect(
    page.getByRole('meter', { name: 'Enemy health' }),
  ).toHaveAttribute(
    'aria-valuenow',
    CITY_ROOM_ONE_MAX_HEALTH.toString(),
  );
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
  ).not.toHaveAttribute(
    'aria-valuenow',
    CITY_ROOM_ONE_MAX_HEALTH.toString(),
  );

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
  await expect(page.locator('main')).toHaveAttribute(
    'data-invincible',
    'true',
  );

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
      page.getByRole('button', { name: `${stageNumber}스테이지 가기` }),
    ).toBeVisible();
  }

  await page.getByRole('button', { name: '닫기' }).click();
  await expect(adminMenu).toHaveCount(0);
  await expect(adminButton).toHaveAttribute('aria-expanded', 'false');

  await adminButton.click();
  await page.getByRole('button', { name: '2스테이지 가기' }).click();
  await expect(adminMenu).toHaveCount(0);
  await expect(
    page.getByRole('meter', { name: 'Player health' }),
  ).toHaveAttribute('aria-valuemax', '115');
  expect(runtimeErrors).toEqual([]);
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
  ).toHaveAttribute(
    'aria-valuenow',
    CITY_ROOM_ONE_MAX_HEALTH.toString(),
  );
  await expect(page.locator('main')).toHaveAttribute(
    'data-room-state',
    'locked',
  );
});

test('does not offer a weapon drop from a standard enemy', async ({
  page,
}) => {
  const runtimeErrors: Error[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error));

  await enterGame(page);
  await page.waitForTimeout(1000);
  await expect(page.locator('main')).toHaveAttribute('data-weapon', 'smg');

  const bounds = await getCanvasBounds(page);
  await fireAt(page, bounds, 640, 630, 1200);

  await expect(
    page.getByRole('meter', { name: 'Enemy health' }),
  ).not.toHaveAttribute(
    'aria-valuenow',
    CITY_ROOM_ONE_MAX_HEALTH.toString(),
  );
  await holdKeyFor(page, 'KeyD', 700);
  await expect(page.locator('main')).toHaveAttribute(
    'data-nearby-weapon',
    '',
  );
  await expect(page.locator('main')).toHaveAttribute('data-weapon', 'smg');
  expect(runtimeErrors).toEqual([]);
});

test('advances to the next room after clearing the first and locks it again', async ({
  page,
}) => {
  test.setTimeout(SINGLE_ROOM_TEST_TIMEOUT);
  const runtimeErrors: Error[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error));

  await enterGame(page);
  await page.waitForTimeout(1000);

  const bounds = await getCanvasBounds(page);
  await clearCityRoomOne(page, bounds);

  await expect(page.locator('main')).toHaveAttribute(
    'data-phase',
    'room-cleared',
    { timeout: 5000 },
  );

  await advanceThroughDoor(page);

  await expect(page.locator('main')).toHaveAttribute(
    'data-room-state',
    'locked',
  );
  await expect(
    page.getByRole('meter', { name: 'Enemy health' }),
  ).toHaveAttribute(
    'aria-valuenow',
    CITY_ROOM_TWO_MAX_HEALTH.toString(),
  );
  expect(runtimeErrors).toEqual([]);
});
