import { describe, expect, it } from 'vitest';
import { patrolSpan } from '@/game/systems/patrolSpan';

const base = {
  range: 90,
  left: 64,
  right: 3593,
  edgeMargin: 28,
  minimumSpan: 60,
};

describe('patrolSpan', () => {
  it('paces the full range when the floor is unbroken', () => {
    expect(patrolSpan({ ...base, spawnX: 1000 })).toEqual({
      left: 910,
      right: 1090,
    });
  });

  it('stops short of a pit ahead, with the body clear of the edge', () => {
    // 구덩이는 1050~1250에 있다. 가장자리보다 여유 있게 앞에서 방향을 바꾸지 않으면
    // 적이 순찰 구간 끝에 도달하는 순간 레벨 밖으로 걸어 나간다.
    expect(
      patrolSpan({
        ...base,
        spawnX: 1000,
        pits: [{ x: 1050, width: 200 }],
      }),
    ).toEqual({ left: 910, right: 1022 });
  });

  it('stops short of a pit behind', () => {
    expect(
      patrolSpan({
        ...base,
        spawnX: 1000,
        pits: [{ x: 800, width: 100 }],
      }),
    ).toEqual({ left: 928, right: 1090 });
  });

  it('holds position when pits close in from both sides', () => {
    // 두 구덩이 사이 바닥은 940~1040이다. 양쪽에서 여유 28을 빼면 968~1012의
    // 44px만 남아, 순찰 최소 거리 60보다 짧다.
    expect(
      patrolSpan({
        ...base,
        spawnX: 1000,
        pits: [
          { x: 800, width: 140 },
          { x: 1040, width: 200 },
        ],
      }),
    ).toBeNull();
  });

  it('still paces when the gap between two pits is just wide enough', () => {
    // 같은 형태에서 오른쪽 구덩이를 20px 더 멀리 두면 968~1032의 64px가 남아
    // 최소 거리를 넘는다. 위 사례와의 경계가 4px뿐이므로 테스트로 고정한다.
    expect(
      patrolSpan({
        ...base,
        spawnX: 1000,
        pits: [
          { x: 800, width: 140 },
          { x: 1060, width: 200 },
        ],
      }),
    ).toEqual({ left: 968, right: 1032 });
  });

  it('holds position when placed on a pit', () => {
    // 지상 적의 구덩이 위 생성을 금지하는 규칙이 있어 발생하면 안 되지만,
    // 잘못 배치되더라도 순찰 범위를 부여해서는 안 된다.
    expect(
      patrolSpan({
        ...base,
        spawnX: 1100,
        pits: [{ x: 1050, width: 200 }],
      }),
    ).toBeNull();
  });

  it('never paces past the room it belongs to', () => {
    expect(patrolSpan({ ...base, spawnX: 100 })).toEqual({
      left: 64,
      right: 190,
    });
  });
});
