export type PatternBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

const TAU = Math.PI * 2;

export function getRingAngles(
  bulletCount: number,
  gapCenter: number,
  gapWidth: number,
) {
  const halfGap = gapWidth / 2;
  const angles: number[] = [];

  for (let index = 0; index < bulletCount; index += 1) {
    const angle = (index / bulletCount) * TAU;
    if (angularDistance(angle, gapCenter) > halfGap) {
      angles.push(angle);
    }
  }

  return angles;
}

export function getFanAngles(
  centerAngle: number,
  bulletCount: number,
  spread: number,
) {
  if (bulletCount <= 1) {
    return [centerAngle];
  }

  const start = centerAngle - spread / 2;
  const step = spread / (bulletCount - 1);
  return Array.from(
    { length: bulletCount },
    (_, index) => start + step * index,
  );
}

export function clampPatternTarget(
  x: number,
  y: number,
  bounds: PatternBounds,
) {
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, x)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, y)),
  };
}

export function damageBeforeThreshold(
  currentHealth: number,
  maxHealth: number,
  thresholdRatio: number,
  incomingDamage: number,
) {
  const threshold = maxHealth * thresholdRatio;
  return Math.max(
    0,
    Math.min(incomingDamage, Math.max(0, currentHealth - threshold)),
  );
}

function angularDistance(first: number, second: number) {
  const difference = Math.abs((first - second) % TAU);
  return Math.min(difference, TAU - difference);
}
