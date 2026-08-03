import { describe, expect, it } from 'vitest';
import { BOSS_COMBAT_CONFIGS } from '@/game/config/bossConfig';
import { MovementMode } from '@/game/config/playerMovementConfig';
import {
  STARTING_STAGE_INDEX,
  STAGES,
  STAGE_FIVE_CONFIG,
  STAGE_FOUR_CONFIG,
  STAGE_THREE_CONFIG,
  STAGE_TWO_CONFIG,
} from '@/game/config/stageConfig';

describe('stage configuration', () => {
  it('starts new runs at stage one', () => {
    expect(STARTING_STAGE_INDEX).toBe(0);
  });

  it('uses flight movement only in stage five', () => {
    expect(STAGES.slice(0, 4).map((stage) => stage.movementMode)).toEqual([
      MovementMode.GROUND,
      MovementMode.GROUND,
      MovementMode.GROUND,
      MovementMode.GROUND,
    ]);
    expect(STAGE_FIVE_CONFIG.movementMode).toBe(MovementMode.FLIGHT);
  });

  it('increases player health with stage difficulty', () => {
    expect(STAGES.map(({ playerMaxHealth }) => playerMaxHealth)).toEqual([
      100, 115, 130, 150, 175,
    ]);

    for (const stage of STAGES) {
      const bossSpawn = stage.rooms.at(-1)?.enemySpawns[0];
      if (!bossSpawn || bossSpawn.type !== 'boss') {
        throw new Error(`Missing boss for ${stage.id}`);
      }

      const boss = BOSS_COMBAT_CONFIGS[bossSpawn.variant];
      expect(stage.playerMaxHealth / boss.contactDamage).toBeGreaterThanOrEqual(
        5,
      );
    }
  });

  it('ends every stage with one dedicated boss room', () => {
    for (const stage of STAGES) {
      expect(stage.rooms).toHaveLength(3);

      const finalRoom = stage.rooms.at(-1);
      expect(finalRoom?.kind).toBe('boss');
      expect(finalRoom?.enemySpawns).toHaveLength(1);
      expect(finalRoom?.enemySpawns[0]?.type).toBe('boss');
    }
  });

  it('loads the supplied stage 2 background', () => {
    expect(STAGE_TWO_CONFIG.background).toEqual({
      key: 'stage-02-bg',
      path: '/assets/backgrounds/stage-02.webp',
    });
  });

  it('skins the stage 2 upper platforms with the supplied 3-slice art', () => {
    expect(STAGE_TWO_CONFIG.terrainSkin).toMatchObject({
      left: {
        key: 'stage-2-stool-left',
        path: '/assets/terrain/stage-2-stool-left.png',
        width: 38,
      },
      middle: {
        key: 'stage-2-stool-middle',
        path: '/assets/terrain/stage-2-stool-middle.png',
        width: 100,
      },
      right: {
        key: 'stage-2-stool-right',
        path: '/assets/terrain/stage-2-stool-right.png',
        width: 38,
      },
      height: 35,
      surfaceInset: 3,
    });
  });

  it('loads the supplied stage 3 background with the same structure', () => {
    expect(STAGE_THREE_CONFIG.background).toEqual({
      key: 'stage-03-bg',
      path: '/assets/backgrounds/stage-03.webp',
    });
  });

  it('continues from the stage 3 siege into a three-room hell stage', () => {
    expect(STAGES).toHaveLength(5);
    expect(STAGE_THREE_CONFIG.endEvent).toBe('siege');
    expect(STAGE_FOUR_CONFIG).toMatchObject({
      id: 'stage-04',
      label: 'STAGE 4 // HELL',
      background: {
        key: 'stage-04-bg',
        path: '/assets/backgrounds/stage-04.webp',
      },
    });
    expect(STAGE_FOUR_CONFIG.rooms.at(-1)?.enemySpawns[0]).toMatchObject({
      type: 'boss',
      variant: 'infernal-executioner',
    });
  });

  it('ends with a three-room return stage and final boss', () => {
    expect(STAGE_FIVE_CONFIG).toMatchObject({
      id: 'stage-05',
      label: 'STAGE 5 // THE RETURN',
      background: {
        key: 'stage-05-bg',
        path: '/assets/backgrounds/stage-05.webp',
      },
    });
    expect(STAGE_FIVE_CONFIG.rooms.at(-1)?.enemySpawns[0]).toMatchObject({
      type: 'boss',
      variant: 'returning-architect',
    });
  });

  it('uses independently configured aerial enemies throughout stage five', () => {
    for (const room of STAGE_FIVE_CONFIG.rooms.slice(0, 2)) {
      expect(
        room.enemySpawns.every(
          (spawn) => spawn.type === 'flying' && Boolean(spawn.movement),
        ),
      ).toBe(true);
    }
  });

  it('prevents flight from bypassing stage five exit doors', () => {
    expect(
      STAGE_FIVE_CONFIG.rooms.every(
        (room) => room.door.height === 720 && room.door.y === 360,
      ),
    ).toBe(true);
    expect(
      STAGES.slice(0, 4).every((stage) =>
        stage.rooms.every((room) => room.door.height === 180),
      ),
    ).toBe(true);
  });
});
