import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import type { BossVariant } from '@/game/config/bossConfig';
import { ROOM_WORLD_WIDTH } from '@/game/config/worldConfig';

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
};

export const defineRoom = (definition: RoomDefinition): RoomConfig => ({
  kind: 'combat',
  entranceX: 64,
  exitX: ROOM_WORLD_WIDTH - 64,
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
    enemySpawns: [
      {
        type: 'boss',
        variant,
        x: ROOM_WORLD_WIDTH - 760,
        y: GAME_HEIGHT - 180,
      },
    ],
  });
