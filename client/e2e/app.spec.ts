import { expect, test } from '@playwright/test';

test('boots the Phaser canvas', async ({ page }) => {
  await page.goto('/');

  const canvas = page.locator('#game-root canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('width', '1280');
  await expect(canvas).toHaveAttribute('height', '720');
});

test('enters the game and shows the React HUD', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');
  await page.keyboard.press('Enter');

  await expect(page.locator('main')).toHaveAttribute('data-phase', 'playing');
  await expect(
    page.getByRole('meter', { name: 'Player health' }),
  ).toHaveAttribute('aria-valuenow', '100');
  await expect(
    page.getByRole('meter', { name: 'Enemy health' }),
  ).toHaveAttribute('aria-valuenow', '100');
});

test('accepts WASD movement and mouse fire input', async ({ page }) => {
  const runtimeErrors: Error[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error));

  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'game');

  await page.keyboard.down('KeyD');
  await page.waitForTimeout(180);
  await page.keyboard.up('KeyD');
  await page.keyboard.press('KeyW');

  const canvas = page.locator('#game-root canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) {
    throw new Error('Phaser canvas bounds are unavailable');
  }

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

  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'playing');

  await page.keyboard.down('ArrowRight');
  await page.keyboard.press('Shift');
  await page.waitForTimeout(220);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('Space');

  const canvas = page.locator('#game-root canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) {
    throw new Error('Phaser canvas bounds are unavailable');
  }

  await page.mouse.click(
    bounds.x + bounds.width * 0.7,
    bounds.y + bounds.height * 0.5,
    { button: 'right' },
  );

  expect(runtimeErrors).toEqual([]);
});

test('enemy detects the player and deals ranged damage', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');
  await page.keyboard.press('Enter');

  const healthMeter = page.getByRole('meter', { name: 'Player health' });
  await expect(healthMeter).toHaveAttribute('aria-valuenow', '100');

  await page.keyboard.down('KeyD');
  await page.waitForTimeout(900);
  await page.keyboard.up('KeyD');

  await expect(healthMeter).not.toHaveAttribute('aria-valuenow', '100', {
    timeout: 5000,
  });
});

test('player fire damages the enemy without stopping combat', async ({
  page,
}) => {
  const runtimeErrors: Error[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error));

  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'game');
  await page.waitForTimeout(1000);

  const canvas = page.locator('#game-root canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) {
    throw new Error('Phaser canvas bounds are unavailable');
  }

  await page.mouse.click(
    bounds.x + bounds.width * (900 / 1280),
    bounds.y + bounds.height * (630 / 720),
  );

  await expect(
    page.getByRole('meter', { name: 'Enemy health' }),
  ).toHaveAttribute('aria-valuenow', '90', { timeout: 5000 });
  expect(runtimeErrors).toEqual([]);
});

test('player death stops combat and supports a fast restart', async ({
  page,
}) => {
  test.setTimeout(45_000);

  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'playing');

  const healthMeter = page.getByRole('meter', { name: 'Player health' });
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(900);
  await page.keyboard.up('KeyD');

  await expect(page.locator('main')).toHaveAttribute('data-phase', 'dead', {
    timeout: 30_000,
  });
  await expect(healthMeter).toHaveAttribute('aria-valuenow', '0');

  await page.keyboard.press('KeyR');

  await expect(page.locator('main')).toHaveAttribute('data-phase', 'playing');
  await expect(healthMeter).toHaveAttribute('aria-valuenow', '100');
  await expect(
    page.getByRole('meter', { name: 'Enemy health' }),
  ).toHaveAttribute('aria-valuenow', '100');
});
