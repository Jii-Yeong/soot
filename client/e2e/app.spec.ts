import { expect, test, type Page } from '@playwright/test';

const ROOM_TRANSITION_TIMEOUT = 10_000;
const SINGLE_ROOM_TEST_TIMEOUT = 60_000;

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
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'game');
  await triggerCurrentRoom(page);
}

async function triggerCurrentRoom(page: Page) {
  await whileHoldingKey(page, 'KeyD', async () => {
    await expect(page.locator('main')).toHaveAttribute(
      'data-room-state',
      'locked',
      { timeout: ROOM_TRANSITION_TIMEOUT },
    );
  });
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

type FireTarget = [x: number, y: number, durationMs: number];

const CITY_ROOM_ONE_TARGETS: FireTarget[] = [
  [640, 630, 1200],
  [820, 460, 1200],
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

async function advanceThroughDoor(page: Page) {
  await whileHoldingKey(page, 'KeyD', async () => {
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

test('waits for the entrance detector before starting combat', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');
  await page.keyboard.press('Enter');

  await expect(page.locator('main')).toHaveAttribute('data-scene', 'game');
  await expect(page.locator('main')).toHaveAttribute('data-room-state', 'idle');
  await expect(
    page.getByRole('meter', { name: 'Enemy health' }),
  ).toHaveAttribute('aria-valuenow', '0');

  await triggerCurrentRoom(page);

  await expect(page.locator('main')).toHaveAttribute(
    'data-room-state',
    'locked',
  );
  await expect(
    page.getByRole('meter', { name: 'Enemy health' }),
  ).toHaveAttribute('aria-valuenow', '305');
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
  await expect(enemyHealthMeter).toHaveAttribute('aria-valuenow', '305');
  await expect(enemyHealthMeter).toHaveAttribute('aria-valuemax', '305');
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
  ).not.toHaveAttribute('aria-valuenow', '305');

  await holdKeyFor(page, 'KeyD', 1500);

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
  ).toHaveAttribute('aria-valuenow', '295', { timeout: 5000 });
  expect(runtimeErrors).toEqual([]);
});

test('locks the room until every spawned enemy is defeated', async ({
  page,
}) => {
  const runtimeErrors: Error[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error));

  await enterGame(page);
  await expect(page.locator('main')).toHaveAttribute(
    'data-room-state',
    'locked',
  );
  await page.waitForTimeout(1000);

  const bounds = await getCanvasBounds(page);
  await clearRoom(page, bounds, CITY_ROOM_ONE_TARGETS);

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
  await triggerCurrentRoom(page);
  await expect(healthMeter).toHaveAttribute('aria-valuenow', '100');
  await expect(
    page.getByRole('meter', { name: 'Enemy health' }),
  ).toHaveAttribute('aria-valuenow', '305');
  await expect(page.locator('main')).toHaveAttribute(
    'data-room-state',
    'locked',
  );
});

test('drops and equips a random weapon from a defeated enemy', async ({
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
  ).not.toHaveAttribute('aria-valuenow', '305');

  await whileHoldingKey(page, 'KeyD', async () => {
    await expect(page.locator('main')).not.toHaveAttribute(
      'data-nearby-weapon',
      '',
      { timeout: 4000 },
    );
  });
  await page.keyboard.press('KeyE');

  await expect(page.locator('main')).not.toHaveAttribute('data-weapon', 'smg');
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
  await clearRoom(page, bounds, CITY_ROOM_ONE_TARGETS);

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
  ).toHaveAttribute('aria-valuenow', '310');
  expect(runtimeErrors).toEqual([]);
});
