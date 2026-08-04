import { expect, test, type Page } from '@playwright/test';

const ROOM_TRANSITION_TIMEOUT = 10_000;
const CITY_ROOM_ONE_MAX_HEALTH = 470;
const CITY_ROOM_TWO_MAX_HEALTH = 530;

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
  await enableEnemyHealth(page);
  await triggerCurrentRoom(page);
}

async function enableEnemyHealth(page: Page) {
  const adminButton = page.getByRole('button', { name: 'ADMIN' });
  await adminButton.click();
  await page.getByRole('button', { name: 'Enemy health display' }).click();
  await adminButton.click();
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

const CITY_ROOM_ONE_FLYING_TARGET: FireTarget = [820, 460, 1200];

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

  // The flying enemy is protected by the first platform. Climb onto it before
  // firing instead of relying on the old through-platform shot path.
  await whileHoldingKey(page, 'KeyD', async () => {
    await page.keyboard.down('Space');
    await page.waitForTimeout(100);
    await page.keyboard.up('Space');
    await page.waitForTimeout(650);
  });
  await fireAt(page, bounds, ...CITY_ROOM_ONE_FLYING_TARGET);

  // Continue through the mid and far clusters while firing along the ground,
  // then sweep the upper screen for the flying enemy that follows from the
  // middle and can finish on either side of the player.
  await runAndFireAt(page, bounds, 1120, 630, 8000);
  await holdKeyFor(page, 'KeyD', 1300);
  await fireAt(page, bounds, 300, 360, 1200);
  await fireAt(page, bounds, 450, 360, 1200);
  await fireAt(page, bounds, 600, 360, 1200);
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
    await page.goto('/');
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

  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');
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

test('loads enemy and terrain art one stage ahead', async ({ page }) => {
  const requestedAssets = new Set<string>();
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (/\/assets\/(enemies|terrain)\/stage-[12]-/.test(pathname)) {
      requestedAssets.add(pathname.split('/').at(-1) ?? '');
    }
  });

  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');
  await expect
    .poll(
      () =>
        requestedAssets.has('stage-1-neared.png') &&
        requestedAssets.has('stage-1-floor-left.png'),
    )
    .toBe(true);
  expect([...requestedAssets].some((asset) => asset.startsWith('stage-2-'))).toBe(
    false,
  );

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

test('waits for the entrance detector before starting combat', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');
  await page.keyboard.press('Enter');

  await expect(page.locator('main')).toHaveAttribute('data-scene', 'game');
  await expect(page.locator('main')).toHaveAttribute('data-room-state', 'idle');
  await expect(page.getByRole('meter', { name: 'Enemy health' })).toHaveCount(
    0,
  );

  await triggerCurrentRoom(page);

  await expect(page.locator('main')).toHaveAttribute(
    'data-room-state',
    'locked',
  );
  await expect(page.getByRole('meter', { name: 'Enemy health' })).toHaveCount(
    0,
  );

  await enableEnemyHealth(page);
  await expect(page.getByRole('meter', { name: 'Enemy health' })).toHaveAttribute(
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

test('invincibility mode prevents player health loss', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');
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

  await triggerCurrentRoom(page);
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
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');
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
});

test('stage two spawns each standard enemy with its supplied atlas', async ({
  page,
}) => {
  await enterGame(page);
  await page.getByRole('button', { name: 'ADMIN' }).click();
  await page
    .getByRole('button', { name: '2스테이지', exact: true })
    .click();
  await expect(
    page.getByRole('meter', { name: 'Player health' }),
  ).toHaveAttribute('aria-valuemax', '115');

  await triggerCurrentRoom(page);
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
  await triggerCurrentRoom(page);

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
      ({ texture }) => texture.key === 'blocker-placeholder',
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
      faceTarget: {
        x: blocker.x - scene.cameras.main.scrollX,
        y: blocker.y - 51 - scene.cameras.main.scrollY,
      },
      textures: enemies.map(({ texture }) => texture.key),
      crawlerAnimation: crawler?.anims.currentAnim?.key,
      crawlerY: crawler?.y,
    };
  });

  expect(new Set(result.textures)).toEqual(
    new Set([
      'stage-3-flying',
      'captor-placeholder',
      'blocker-placeholder',
    ]),
  );
  expect(result.crawlerY).toBeLessThan(180);
  expect(result.crawlerAnimation).toBe('stage-3-flying-pipe-idle');
  expect(result.blocked.applied).toBe(false);
  expect(result.healthAfterShield).toBe(result.healthBefore);

  const bounds = await getCanvasBounds(page);
  const getCrawlerAnimation = () =>
    page.evaluate(() => {
      type RuntimeScene = {
        enemies: Array<{
          anims: { currentAnim?: { key: string } };
          texture: { key: string };
        }>;
      };
      type DebugGame = {
        scene: { getScene: (key: string) => unknown };
      };
      const game = (window as unknown as { __game?: DebugGame }).__game!;
      const enemies = (game.scene.getScene('game') as RuntimeScene).enemies;
      return enemies.find(
        ({ texture }) => texture.key === 'stage-3-flying',
      )?.anims.currentAnim?.key;
    });
  const getCrawlerGroundState = () =>
    page.evaluate(() => {
      type RuntimeScene = {
        enemies: Array<{
          body: { velocity: { x: number } };
          lockedGroundTargetX: number;
          maintainerState: string;
          texture: { key: string };
          x: number;
        }>;
      };
      type DebugGame = {
        scene: { getScene: (key: string) => unknown };
      };
      const game = (window as unknown as { __game?: DebugGame }).__game!;
      const enemies = (game.scene.getScene('game') as RuntimeScene).enemies;
      const crawler = enemies.find(
        ({ texture }) => texture.key === 'stage-3-flying',
      );
      return crawler
        ? {
            lockedTargetX: crawler.lockedGroundTargetX,
            state: crawler.maintainerState,
            velocityX: crawler.body.velocity.x,
            x: crawler.x,
          }
        : null;
    });
  await fireShotsAt(
    page,
    bounds,
    result.faceTarget.x,
    result.faceTarget.y,
    1,
  );
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
          ({ texture }) => texture.key === 'blocker-placeholder',
        )?.currentHealth;
      }),
    )
    .toBeLessThan(result.healthAfterShield);
  await expect
    .poll(getCrawlerAnimation, { timeout: 4_000 })
    .toBe('stage-3-flying-pipe-move');
  await expect
    .poll(getCrawlerAnimation, { timeout: 7_000 })
    .toBe('stage-3-flying-pipe-idle');

  await page.evaluate(() => {
    type RuntimeActor = {
      body: { reset: (x: number, y: number) => void };
      setPosition: (x: number, y: number) => void;
      takeDamage: (damage: number) => boolean;
      texture: { key: string };
      x: number;
    };
    type RuntimeScene = {
      enemies: RuntimeActor[];
      player: RuntimeActor;
    };
    type DebugGame = {
      scene: { getScene: (key: string) => unknown };
    };
    const game = (window as unknown as { __game?: DebugGame }).__game!;
    const scene = game.scene.getScene('game') as RuntimeScene;
    const crawler = scene.enemies.find(
      ({ texture }) => texture.key === 'stage-3-flying',
    )!;
    const targetX = crawler.x - 180;
    scene.player.setPosition(targetX, 618);
    scene.player.body.reset(targetX, 618);
    crawler.takeDamage(50);
  });
  await expect
    .poll(getCrawlerAnimation, { timeout: 2_000 })
    .toBe('stage-3-flying-falling');
  expect(
    await page.evaluate(() => {
      type RuntimeScene = {
        enemies: Array<{
          isTinted: boolean;
          texture: { key: string };
        }>;
      };
      type DebugGame = {
        scene: { getScene: (key: string) => unknown };
      };
      const game = (window as unknown as { __game?: DebugGame }).__game!;
      const enemies = (game.scene.getScene('game') as RuntimeScene).enemies;
      return enemies.find(
        ({ texture }) => texture.key === 'stage-3-flying',
      )?.isTinted;
    }),
  ).toBe(false);
  await expect
    .poll(getCrawlerAnimation, { timeout: 5_000, intervals: [50] })
    .toBe('stage-3-flying-floor-idle');
  await expect
    .poll(async () => (await getCrawlerGroundState())?.state, {
      timeout: 2_000,
      intervals: [50],
    })
    .toBe('ground-dash');
  await expect
    .poll(async () => (await getCrawlerGroundState())?.state, {
      timeout: 2_000,
    })
    .toBe('floor-idle');
  await page.evaluate(() => {
    type RuntimeActor = {
      body: { reset: (x: number, y: number) => void };
      setPosition: (x: number, y: number) => void;
      texture: { key: string };
      x: number;
    };
    type RuntimeScene = {
      enemies: RuntimeActor[];
      player: RuntimeActor;
    };
    type DebugGame = {
      scene: { getScene: (key: string) => unknown };
    };
    const game = (window as unknown as { __game?: DebugGame }).__game!;
    const scene = game.scene.getScene('game') as RuntimeScene;
    const crawler = scene.enemies.find(
      ({ texture }) => texture.key === 'stage-3-flying',
    )!;
    const nextTargetX = crawler.x - 220;
    scene.player.setPosition(nextTargetX, 618);
    scene.player.body.reset(nextTargetX, 618);
  });
  await expect
    .poll(async () => (await getCrawlerGroundState())?.state, {
      timeout: 1_500,
    })
    .toBe('ground-mark');

  const markedDash = await page.evaluate(() => {
    type RuntimeActor = {
      body: { reset: (x: number, y: number) => void };
      lockedGroundTargetX: number;
      setPosition: (x: number, y: number) => void;
      texture: { key: string };
      x: number;
    };
    type RuntimeScene = {
      enemies: RuntimeActor[];
      player: RuntimeActor;
    };
    type DebugGame = {
      scene: { getScene: (key: string) => unknown };
    };
    const game = (window as unknown as { __game?: DebugGame }).__game!;
    const scene = game.scene.getScene('game') as RuntimeScene;
    const crawler = scene.enemies.find(
      ({ texture }) => texture.key === 'stage-3-flying',
    )!;
    const expectedDirection = Math.sign(crawler.lockedGroundTargetX - crawler.x);
    const oppositeX = crawler.x - expectedDirection * 300;
    scene.player.setPosition(oppositeX, 618);
    scene.player.body.reset(oppositeX, 618);
    return { expectedDirection };
  });
  await expect
    .poll(async () => (await getCrawlerGroundState())?.state, {
      timeout: 2_500,
      intervals: [50],
    })
    .toBe('ground-dash');
  expect(
    Math.sign((await getCrawlerGroundState())?.velocityX ?? 0),
  ).toBe(markedDash.expectedDirection);
  await expect
    .poll(async () => (await getCrawlerGroundState())?.state, {
      timeout: 2_500,
      intervals: [50],
    })
    .toBe('floor-idle');
  const arrivedDash = await getCrawlerGroundState();
  expect(
    Math.abs((arrivedDash?.x ?? 0) - (arrivedDash?.lockedTargetX ?? 0)),
  ).toBeLessThanOrEqual(12);
});

test('stage two ground enemies stop at pit edges instead of falling', async ({
  page,
}) => {
  await enterGame(page);
  await page.getByRole('button', { name: 'ADMIN' }).click();
  await page
    .getByRole('button', { name: '2스테이지', exact: true })
    .click();
  await expect(
    page.getByRole('meter', { name: 'Player health' }),
  ).toHaveAttribute('aria-valuemax', '115');
  await triggerCurrentRoom(page);

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

    // 플레이어를 1번 방 첫 구덩이 건너편에, 근접 적을 그 가까운 가장자리에
    // 둠. 적의 추격 AI가 적 전용 레일 쪽으로 계속 밀고 들어옴.
    scene.player.setPosition(1900, 600);
    scene.player.body.reset(1900, 600);
    melee.setPosition(1550, melee.y);
    melee.body.reset(1550, melee.y);
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

  expect(meleePosition.x).toBeLessThan(1650);
  expect(meleePosition.y).toBeLessThan(656);
});

test('admin menu scrolls instead of overflowing a short viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 360 });
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');
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
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'game');

  await page.getByRole('button', { name: 'ADMIN' }).click();
  await page.getByRole('button', { name: '보스' }).first().click();
  await triggerCurrentRoom(page);

  await expect(page.getByRole('meter', { name: 'Enemy health' })).toHaveCount(
    0,
  );
  await expect(page.getByRole('meter', { name: 'Boss health' })).toHaveAttribute(
    'aria-valuemax',
    '500',
  );
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
  ).toHaveAttribute('aria-valuenow', '459', { timeout: 5000 });
  expect(runtimeErrors).toEqual([]);
});

test('platforms block player projectiles', async ({ page }) => {
  await enterGame(page);
  await page.waitForTimeout(1000);

  // 비행체는 사격선 위에 놓인 2층 발판 뒤에서 떠다님. 비행체가 특별히
  // 맞지 않고 유지되는지 확인함: 낮은 전경 경로의 지상 적들은 별개의 문제 —
  // 이건 발판이 총알을 흡수하는지에 관한 것이고, 지상 적의 키 큰 스프라이트가
  // 아니었다면 그것을 가렸을 것임.
  const shieldedFlyerHp = () =>
    page.evaluate((targetY) => {
      type RuntimeScene = {
        enemies: Array<{
          active: boolean;
          y: number;
          currentHealth: number;
          constructor: { name: string };
        }>;
      };
      type DebugGame = { scene: { getScene: (key: string) => unknown } };
      const game = (window as unknown as { __game?: DebugGame }).__game!;
      const scene = game.scene.getScene('game') as RuntimeScene;
      const flyers = scene.enemies.filter(
        (e) => e.active && e.constructor.name === 'FlyingEnemy',
      );
      // 사격 목표 높이에 가장 가까운 것이 발판 뒤에 있음.
      return flyers.reduce((nearest, e) =>
        Math.abs(e.y - targetY) < Math.abs(nearest.y - targetY) ? e : nearest,
      ).currentHealth;
    }, CITY_ROOM_ONE_FLYING_TARGET[1]);

  const before = await shieldedFlyerHp();
  const bounds = await getCanvasBounds(page);
  await fireAt(page, bounds, ...CITY_ROOM_ONE_FLYING_TARGET);

  expect(await shieldedFlyerHp()).toBe(before);
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
  await triggerCurrentRoom(page);
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

  await enterExitPortal(page);

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
