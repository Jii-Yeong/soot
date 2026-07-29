import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import type { BossVariant } from '@/game/config/bossConfig';
import {
  BOSS_ROOM_WORLD_WIDTH,
  ROOM_WORLD_WIDTH,
} from '@/game/config/worldConfig';

export type EnemySpawnConfig =
  | {
      type: 'melee';
      x: number;
      y: number;
    }
  | {
      type: 'ranged';
      x: number;
      y: number;
    }
  | {
      type: 'flying';
      x: number;
      y: number;
    }
  | {
      type: 'boss';
      variant: BossVariant;
      x: number;
      y: number;
    };

/**
 * A solid, static piece of level geometry. `x`/`y` are the top-left corner.
 * A `platform` is a low ledge to stand on; a `wall` is a tall barrier to jump
 * or dash over. Both are solid on every side.
 */
export type TerrainPiece = {
  type: 'platform' | 'wall';
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * A gap in the floor. `x` is the left edge (room-local). The floor is solid
 * everywhere except across this span; falling in costs the player health.
 */
export type PitSpan = {
  x: number;
  width: number;
};

export type RoomConfig = {
  id: string;
  label: string;
  kind: 'combat' | 'boss';
  entranceX: number;
  exitX: number;
  door: {
    y: number;
    width: number;
    height: number;
  };
  enemySpawns: EnemySpawnConfig[];
  terrain?: TerrainPiece[];
  pits?: PitSpan[];
  /** Multiplies enemy move speed and divides fire interval. 1 = baseline pace. */
  intensity?: number;
};

export type StageRooms = readonly [RoomConfig, RoomConfig, RoomConfig];

const ROOM_DOOR = {
  y: GAME_HEIGHT - 154,
  width: 32,
  height: 180,
};

export type RoomDefinition = Omit<
  RoomConfig,
  'kind' | 'entranceX' | 'exitX' | 'door'
> & {
  kind?: RoomConfig['kind'];
  /** Room segment width; the exit door sits near its right edge. */
  worldWidth?: number;
};

export const defineRoom = ({
  worldWidth = ROOM_WORLD_WIDTH,
  ...definition
}: RoomDefinition): RoomConfig => ({
  kind: 'combat',
  entranceX: 64,
  exitX: worldWidth - 64,
  door: ROOM_DOOR,
  ...definition,
});

export type BossRoomDefinition = Pick<
  RoomDefinition,
  'id' | 'label' | 'intensity'
> & {
  variant: BossVariant;
};

export const defineBossRoom = ({
  variant,
  ...definition
}: BossRoomDefinition): RoomConfig =>
  defineRoom({
    ...definition,
    kind: 'boss',
    // Shorter than a combat room so the boss appears after a brief walk in.
    worldWidth: BOSS_ROOM_WORLD_WIDTH,
    enemySpawns: [
      {
        type: 'boss',
        variant,
        x: BOSS_ROOM_WORLD_WIDTH - 760,
        y: GAME_HEIGHT - 180,
      },
    ],
  });
