import { describe, expect, it } from 'vitest';
import { getVacuumVelocityX } from '@/game/combat/vacuumPull';

describe('getVacuumVelocityX', () => {
  it('pulls an idle player toward the boss', () => {
    expect(
      getVacuumVelocityX({
        playerX: 400,
        sourceX: 900,
        currentVelocityX: 0,
        pullSpeed: 250,
      }),
    ).toBe(250);
  });

  it('lets continuous movement away from the boss resist the pull', () => {
    expect(
      getVacuumVelocityX({
        playerX: 400,
        sourceX: 900,
        currentVelocityX: -300,
        pullSpeed: 250,
      }),
    ).toBe(-50);
  });

  it('accelerates a player who moves toward the boss', () => {
    expect(
      getVacuumVelocityX({
        playerX: 400,
        sourceX: 900,
        currentVelocityX: 300,
        pullSpeed: 250,
      }),
    ).toBe(550);
  });

  it('pulls correctly when the boss is on the left', () => {
    expect(
      getVacuumVelocityX({
        playerX: 900,
        sourceX: 400,
        currentVelocityX: 0,
        pullSpeed: 250,
      }),
    ).toBe(-250);
  });
});
