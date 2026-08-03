import {
  FRONT_ARM,
  FRONT_ARM_SHOULDER_BY_FRAME,
  WEAPON_GRIP_BY_FRAME,
  WEAPON_SWING_RATE,
  rigAnchor,
} from '@/game/config/playerRigConfig';
import { weaponGripOffset } from '@/game/systems/weaponGrip';

/**
 * Where the trigger hand rests relative to the player centre in standing
 * frames. The player frame is 96x96 with a centred origin and the hand is
 * drawn at (53, 45), so the weapon hangs 5px right of centre and 3px above it.
 */
const DEFAULT_GRIP = { x: 5, y: -3 };
const DEFAULT_SHOULDER = {
  x: FRONT_ARM.shoulderFromCentreX,
  y: FRONT_ARM.shoulderFromCentreY,
};

export type WeaponGripPositionInput = {
  playerX: number;
  playerY: number;
  frameName: string;
  /** The aim that defines this held-weapon pose, not necessarily the cursor's current aim. */
  aim: number;
  recoil: number;
};

/** The grip and facing for one held-weapon pose in world space. */
export type WeaponGripPosition = {
  gripX: number;
  gripY: number;
  mirrored: boolean;
};

/**
 * Resolves the held weapon's grip from one coherent rig pose.
 *
 * Delayed shots must use their locked firing angle here. Reading the rendered
 * sprite would instead combine that old shot direction with the current cursor
 * pose when the player turns during a burst.
 */
export function weaponGripPosition({
  playerX,
  playerY,
  frameName,
  aim,
  recoil,
}: WeaponGripPositionInput): WeaponGripPosition {
  const mirrored = Math.cos(aim) < 0;
  const restGrip = rigAnchor(DEFAULT_GRIP, WEAPON_GRIP_BY_FRAME, frameName);
  const shoulder = rigAnchor(
    DEFAULT_SHOULDER,
    FRONT_ARM_SHOULDER_BY_FRAME,
    frameName,
  );
  const grip = weaponGripOffset({
    shoulderX: shoulder.x,
    shoulderY: shoulder.y,
    restGripX: restGrip.x,
    restGripY: restGrip.y,
    aim,
    mirrored,
    rate: WEAPON_SWING_RATE,
  });

  return {
    gripX: playerX + grip.x - Math.cos(aim) * recoil,
    gripY: playerY + grip.y - Math.sin(aim) * recoil,
    mirrored,
  };
}
