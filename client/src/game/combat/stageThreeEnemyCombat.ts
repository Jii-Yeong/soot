export type Rect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type CeilingMaintainerState =
  | 'crawl'
  | 'warning'
  | 'relocate'
  | 'falling'
  | 'ground-mark'
  | 'ground-dash'
  | 'floor-idle';

type FaceHitboxInput = {
  enemyX: number;
  enemyY: number;
  bodyWidth: number;
  bodyHeight: number;
  widthRatio: number;
  heightRatio: number;
};

/** 몸 상단 중앙에 노출된 바이저 피격 영역을 계산함. */
export function getExposedFaceBounds({
  enemyX,
  enemyY,
  bodyWidth,
  bodyHeight,
  widthRatio,
  heightRatio,
}: FaceHitboxInput): Rect {
  const width = bodyWidth * widthRatio;
  const height = bodyHeight * heightRatio;
  return {
    left: enemyX - width / 2,
    right: enemyX + width / 2,
    top: enemyY - bodyHeight / 2,
    bottom: enemyY - bodyHeight / 2 + height,
  };
}

export function isExposedFaceHit(
  bounds: Rect,
  x: number,
  y: number,
  projectileRadius = 0,
) {
  return (
    x >= bounds.left - projectileRadius &&
    x <= bounds.right + projectileRadius &&
    y >= bounds.top - projectileRadius &&
    y <= bounds.bottom + projectileRadius
  );
}

export function canDamageCeilingMaintainer(
  state: CeilingMaintainerState,
) {
  return state !== 'falling';
}

/** 남은 구속 시간 안에 포획기까지 도달하도록 필요한 수평 속도를 계산함. */
export function getCapturePullSpeed(
  distance: number,
  remainingMs: number,
  minimumPullSpeed: number,
) {
  const remainingSeconds = Math.max(0.08, remainingMs / 1000);
  return Math.max(minimumPullSpeed, Math.abs(distance) / remainingSeconds);
}

/** 입력 속도를 낮춘 뒤 포획기 방향의 일정한 끌림을 더함. */
export function getTetheredVelocityX(
  playerX: number,
  sourceX: number,
  currentVelocityX: number,
  slowFactor: number,
  pullSpeed: number,
) {
  return (
    currentVelocityX * slowFactor + Math.sign(sourceX - playerX) * pullSpeed
  );
}
