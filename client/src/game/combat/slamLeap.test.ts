import { describe, expect, it } from 'vitest';
import { getSlamLeapVelocity } from '@/game/combat/slamLeap';

describe('getSlamLeapVelocity', () => {
  it('aims a ballistic leap at the marked player position', () => {
    const leap = getSlamLeapVelocity({
      originX: 500,
      targetX: 980,
      launchSpeedY: 720,
      gravityY: 1200,
      maxTravelSpeedX: 900,
    });

    expect(leap.velocityX).toBe(400);
    expect(leap.velocityY).toBe(-720);
    expect(leap.flightDurationMs).toBe(1200);
  });

  it('caps horizontal travel speed for distant targets', () => {
    const leap = getSlamLeapVelocity({
      originX: 500,
      targetX: 2500,
      launchSpeedY: 720,
      gravityY: 1200,
      maxTravelSpeedX: 900,
    });

    expect(leap.velocityX).toBe(900);
  });

  it('supports a player positioned to the left of the boss', () => {
    const leap = getSlamLeapVelocity({
      originX: 980,
      targetX: 500,
      launchSpeedY: 720,
      gravityY: 1200,
      maxTravelSpeedX: 900,
    });

    expect(leap.velocityX).toBe(-400);
  });
});
