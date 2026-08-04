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
      type: 'ceiling-maintainer';
      pipeId: string;
      x: number;
    }
  | {
      type: 'captor';
      x: number;
      y: number;
    }
  | {
      type: 'blocker';
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

/** 3스테이지 천장 정비형이 기어 다니는 상단 배관 레일. */
export type CeilingPipe = {
  id: string;
  x: number;
  y: number;
  width: number;
};

export type RoomConfig = {
  id: string;
  label: string;
  kind: 'combat' | 'boss';
  /** 이 방의 독립된 월드 너비. */
  worldWidth: number;
  entranceX: number;
  exitX: number;
  /** 출구 근처에 열리는 클리어 포탈의 세로 위치. */
  portal: {
    y: number;
    height: number;
  };
  enemySpawns: EnemySpawnConfig[];
  terrain?: TerrainPiece[];
  ceilingPipes?: CeilingPipe[];
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
  /** 방 너비. 전투 후 출구 포탈이 오른쪽 가장자리 근처에 생김. */
  worldWidth?: number;
  /** 스테이지별 포탈 위치. 예: 공중 방은 화면 중앙에 배치. */
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
