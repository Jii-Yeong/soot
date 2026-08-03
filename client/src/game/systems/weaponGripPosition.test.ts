import { describe, expect, it } from 'vitest';
import { BURST_RIFLE_WEAPON_CONFIG } from '@/game/config/weaponConfig';
import { muzzlePoint } from '@/game/systems/muzzlePoint';
import { weaponGripPosition } from '@/game/systems/weaponGripPosition';

const PLAYER = { x: 400, y: 300 };

describe('weapon grip position', () => {
  it('keeps a delayed burst on its firing rig after the displayed weapon turns', () => {
    const firingAngle = 0;
    const firingGrip = weaponGripPosition({
      playerX: PLAYER.x,
      playerY: PLAYER.y,
      frameName: 'standing',
      aim: firingAngle,
      recoil: 0,
    });
    const currentDisplayGrip = weaponGripPosition({
      playerX: PLAYER.x,
      playerY: PLAYER.y,
      frameName: 'standing',
      aim: Math.PI,
      recoil: 0,
    });
    const muzzleAtFire = muzzlePoint({
      ...firingGrip,
      angle: firingAngle,
      climb: 0,
      offset: BURST_RIFLE_WEAPON_CONFIG.muzzleOffset,
      rise: BURST_RIFLE_WEAPON_CONFIG.muzzleRise,
    });
    const muzzleFromCurrentDisplay = muzzlePoint({
      ...currentDisplayGrip,
      angle: firingAngle,
      climb: 0,
      offset: BURST_RIFLE_WEAPON_CONFIG.muzzleOffset,
      rise: BURST_RIFLE_WEAPON_CONFIG.muzzleRise,
    });

    expect(firingGrip.mirrored).toBe(false);
    expect(currentDisplayGrip.mirrored).toBe(true);
    expect(muzzleAtFire.x).toBeGreaterThan(muzzleFromCurrentDisplay.x);
    // The old code also took the perpendicular barrel rise from the opposite
    // facing, putting a rightward burst below the barrel after a left turn.
    expect(muzzleAtFire.y).toBeLessThan(muzzleFromCurrentDisplay.y);
  });
});
