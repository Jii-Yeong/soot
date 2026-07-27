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

  await expect(page.getByRole('meter', { name: 'Player health' })).toHaveAttribute(
    'aria-valuenow',
    '100',
  );
  await expect(page.getByRole('meter', { name: 'Enemy health' })).toHaveAttribute(
    'aria-valuenow',
    '100',
  );
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

  await page.mouse.move(bounds.x + bounds.width * 0.75, bounds.y + bounds.height * 0.45);
  await page.mouse.down();
  await page.waitForTimeout(240);
  await page.mouse.up();

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

test('player fire damages the enemy without stopping combat', async ({ page }) => {
  const runtimeErrors: Error[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error));

  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'title');
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('data-scene', 'game');
  await page.waitForTimeout(500);

  const canvas = page.locator('#game-root canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) {
    throw new Error('Phaser canvas bounds are unavailable');
  }

  await page.mouse.click(
    bounds.x + bounds.width * (900 / 1280),
    bounds.y + bounds.height * (630 / 720),
  );

  await expect(page.getByRole('meter', { name: 'Enemy health' })).toHaveAttribute(
    'aria-valuenow',
    '90',
    { timeout: 3000 },
  );
  expect(runtimeErrors).toEqual([]);
});
