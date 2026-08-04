export type PatrolBounds = { left: number; right: number };

export type PatrolSpanInput = {
  /** 적이 배치된 위치. 순찰 범위는 이 지점을 기준으로 계산한다. */
  spawnX: number;
  /** 방 지형에 제한이 없을 때 양쪽으로 이동할 거리. */
  range: number;
  /** 적이 출입구까지 순찰하지 않도록 제한하는 방의 이동 가능 구간. */
  left: number;
  right: number;
  pits?: readonly { x: number; width: number }[];
  /** 몸체가 걸치지 않도록 방향 전환점과 구덩이 가장자리 사이에 둘 여유. */
  edgeMargin: number;
  /** 이보다 짧으면 제자리에서 떠는 것처럼 보여 순찰하지 않는다. */
  minimumSpan: number;
};

/**
 * 적이 배치 지점에서 순찰할 수 있는 범위를 계산한다.
 *
 * 이동 중 검사하는 대신 실제로 존재하는 바닥에 맞춰 미리 범위를 자른다.
 * 구덩이로 걸어 들어간 적은 바닥선 아래로 떨어져 레벨을 벗어나므로, 가장자리에서
 * 감지하는 것이 아니라 첫걸음을 떼기 전에 구덩이를 순찰 범위에서 제외해야 한다.
 *
 * 순찰할 만한 바닥이 부족하면 null을 반환하고 호출부는 제자리에 서 있게 한다.
 */
export function patrolSpan(input: PatrolSpanInput): PatrolBounds | null {
  const { spawnX, range, edgeMargin } = input;

  let left = Math.max(input.left, spawnX - range);
  let right = Math.min(input.right, spawnX + range);

  for (const pit of input.pits ?? []) {
    const pitLeft = pit.x - edgeMargin;
    const pitRight = pit.x + pit.width + edgeMargin;

    // 구덩이 위이거나 한 걸음만으로 추락할 만큼 가깝게 배치된 상태다.
    // 안전하게 순찰할 공간이 없으며 배치 자체가 잘못된 경우다.
    if (spawnX > pitLeft && spawnX < pitRight) {
      return null;
    }

    if (pitRight <= spawnX) {
      left = Math.max(left, pitRight);
    } else {
      right = Math.min(right, pitLeft);
    }
  }

  return right - left >= input.minimumSpan ? { left, right } : null;
}
