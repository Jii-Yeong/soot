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
    // Pit at 1050~1250. The turn has to happen a margin before its lip, or the
    // enemy walks off the level the moment it reaches the end of its beat.
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
    // Floor runs 940~1040 between them. Margins take 28 off each side, leaving
    // 968~1012 — a 44px beat, under the 60 worth pacing.
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
    // The same shape with the right pit 20px further out: 968~1032 is 64px,
    // which clears the minimum. The line between this and the case above is
    // four pixels wide, so it is worth pinning down.
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
    // Should not happen — a rule already forbids spawning a ground enemy over
    // one — but a patrol is the wrong thing to hand out if it ever does.
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
