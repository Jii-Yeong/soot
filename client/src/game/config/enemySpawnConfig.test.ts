import { describe, expect, it } from 'vitest';
import { STAGES } from '@/game/config/stageConfig';

const EXPECTED_COMBAT_ROOM_COUNTS = [
  [7, 8],
  [8, 9],
  // Stage 3 uses fewer, higher-impact control enemies instead of trash mobs.
  [6, 7],
  [10, 11],
  [8, 9],
];

describe('enemy spawn progression', () => {
  it('keeps encounter sizes tuned for each stage combat model', () => {
    expect(
      STAGES.map((stage) =>
        stage.rooms
          .filter(({ kind }) => kind === 'combat')
          .map(({ enemySpawns }) => enemySpawns.length),
      ),
    ).toEqual(EXPECTED_COMBAT_ROOM_COUNTS);
  });

  it('distributes every combat encounter across the full room', () => {
    for (const stage of STAGES) {
      for (const room of stage.rooms.filter(
        ({ kind }) => kind === 'combat',
      )) {
        const bandWidth = room.worldWidth / 3;

        for (let band = 0; band < 3; band += 1) {
          const start = band * bandWidth;
          const end = start + bandWidth;

          expect(
            room.enemySpawns.some(({ x }) => x >= start && x < end),
            `${room.id} has no enemy in band ${band + 1}`,
          ).toBe(true);
        }
      }
    }
  });

  it('keeps boss rooms dedicated to one boss', () => {
    for (const stage of STAGES) {
      const bossRoom = stage.rooms.at(-1);

      expect(bossRoom?.enemySpawns).toHaveLength(1);
      expect(bossRoom?.enemySpawns[0]?.type).toBe('boss');
    }
  });
});
