import type { LaserCannonPatternConfig } from '@/game/config/bossConfig';

export const getLaserPatternTuning = (
  pattern: LaserCannonPatternConfig,
  enraged: boolean,
) => ({
  moveSpeed: enraged ? pattern.enragedMoveSpeed : pattern.moveSpeed,
  volleySize: enraged ? 2 : 1,
  chargeDuration: enraged
    ? pattern.enragedChargeDuration
    : pattern.chargeDuration,
  recoveryDuration: enraged
    ? pattern.enragedRecoveryDuration
    : pattern.recoveryDuration,
});

export const getLaserChargeWindow = (
  pattern: LaserCannonPatternConfig,
  enraged: boolean,
  followUp: boolean,
) => {
  const duration = followUp
    ? pattern.followUpChargeDuration
    : getLaserPatternTuning(pattern, enraged).chargeDuration;

  return {
    duration,
    aimLockDuration: Math.min(pattern.aimLockDuration, duration * 0.4),
  };
};
