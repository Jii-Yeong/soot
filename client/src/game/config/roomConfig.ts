import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import type { AerialMovementConfig } from '@/game/config/aerialMovementConfig';
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
      movement?: AerialMovementConfig;
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
  /** Width of this room's independent world. */
  worldWidth: number;
  entranceX: number;
  exitX: number;
  /** Vertical placement of the clear portal that opens near the exit. */
  portal: {
    y: number;
    height: number;
  };
  enemySpawns: EnemySpawnConfig[];
  terrain?: TerrainPiece[];
  pits?: PitSpan[];
  /** Multiplies enemy move speed and divides fire interval. 1 = baseline pace. */
  intensity?: number;
};

export type StageRooms = readonly [RoomConfig, RoomConfig, RoomConfig];

const ROOM_PORTAL = {
  y: GAME_HEIGHT - 154,
  height: 180,
};

export type RoomDefinition = Omit<
  RoomConfig,
  'kind' | 'worldWidth' | 'entranceX' | 'exitX' | 'portal'
> & {
  kind?: RoomConfig['kind'];
  /** Room width; the exit portal sits near its right edge after combat. */
  worldWidth?: number;
  /** Stage-specific portal placement, e.g. screen-centred for an aerial room. */
  portal?: Partial<RoomConfig['portal']>;
};

export const defineRoom = ({
  worldWidth = ROOM_WORLD_WIDTH,
  portal,
  ...definition
}: RoomDefinition): RoomConfig => ({
  kind: 'combat',
  worldWidth,
  entranceX: 64,
  exitX: worldWidth - 64,
  portal: { ...ROOM_PORTAL, ...portal },
  ...definition,
});

export type BossRoomDefinition = Pick<
  RoomDefinition,
  'id' | 'label' | 'intensity' | 'portal'
> & {
  variant: BossVariant;
  /** Override the boss-room width (e.g. a bigger boss needs more arena). */
  worldWidth?: number;
  /** Override the boss centre height for an aerial encounter. */
  bossY?: number;
};

export const defineBossRoom = ({
  variant,
  worldWidth = BOSS_ROOM_WORLD_WIDTH,
  bossY = GAME_HEIGHT - 180,
  ...definition
}: BossRoomDefinition): RoomConfig =>
  defineRoom({
    ...definition,
    kind: 'boss',
    // Shorter than a combat room so the boss appears after a brief walk in.
    worldWidth,
    enemySpawns: [
      {
        type: 'boss',
        variant,
        x: worldWidth - 760,
        y: bossY,
      },
    ],
  });
