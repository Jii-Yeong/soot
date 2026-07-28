import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import { ROOM_WORLD_WIDTH } from '@/game/config/worldConfig';

export type EnemySpawnConfig = {
  type: 'melee' | 'ranged' | 'flying';
  x: number;
  y: number;
};

export type RoomConfig = {
  id: string;
  label: string;
  entranceX: number;
  exitX: number;
  door: {
    y: number;
    width: number;
    height: number;
  };
  enemySpawns: EnemySpawnConfig[];
  /** Multiplies enemy move speed and divides fire interval. 1 = baseline pace. */
  intensity?: number;
};

const ROOM_DOOR = {
  y: GAME_HEIGHT - 154,
  width: 32,
  height: 180,
};

type RoomDefinition = Omit<RoomConfig, 'entranceX' | 'exitX' | 'door'>;

const defineRoom = (definition: RoomDefinition): RoomConfig => ({
  entranceX: 64,
  exitX: ROOM_WORLD_WIDTH - 64,
  door: ROOM_DOOR,
  ...definition,
});

export const CITY_ROOM_ONE = defineRoom({
  id: 'city-01',
  label: 'ROOM 01',
  enemySpawns: [
    { type: 'melee', x: 640, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 950, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1120, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 820, y: GAME_HEIGHT - 260 },
  ],
});

export const CITY_ROOM_TWO = defineRoom({
  id: 'city-02',
  label: 'ROOM 02',
  enemySpawns: [
    { type: 'melee', x: 560, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 940, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 750, y: GAME_HEIGHT - 260 },
    { type: 'flying', x: 1050, y: GAME_HEIGHT - 300 },
    { type: 'ranged', x: 1160, y: GAME_HEIGHT - 120 },
  ],
});

// Stage 2 reuses the same enemy AI but leans on ambush placement near the
// entrance and a higher intensity (speed/fire-rate) to raise the felt
// difficulty, per the concept doc's "뒷골목" design note.
export const ALLEY_ROOM_ONE = defineRoom({
  id: 'alley-01',
  label: 'ROOM 01',
  intensity: 1.15,
  enemySpawns: [
    // Close enough to still read as an ambush (both are inside their own
    // aggro radius from the post-door spawn point) but far enough that the
    // player has a beat to react before the first hit lands — they used to
    // spawn at x=200/300, only ~50px from the entrance, which put them at
    // point-blank contact range the instant the door unlocked.
    { type: 'melee', x: 420, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 520, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 750, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 950, y: GAME_HEIGHT - 280 },
  ],
});

export const ALLEY_ROOM_TWO = defineRoom({
  id: 'alley-02',
  label: 'ROOM 02',
  intensity: 1.2,
  enemySpawns: [
    { type: 'melee', x: 450, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 700, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 950, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 600, y: GAME_HEIGHT - 320 },
    { type: 'ranged', x: 1100, y: GAME_HEIGHT - 120 },
  ],
});

// Stage 3 (지하도시): cramped rooms with heavier melee pressure leading into
// the siege event that ends the act. Same enemy AI, higher intensity.
export const UNDERGROUND_ROOM_ONE = defineRoom({
  id: 'underground-01',
  label: 'ROOM 01',
  intensity: 1.25,
  enemySpawns: [
    { type: 'melee', x: 520, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 720, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 980, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 840, y: GAME_HEIGHT - 300 },
  ],
});

export const UNDERGROUND_ROOM_TWO = defineRoom({
  id: 'underground-02',
  label: 'ROOM 02',
  intensity: 1.35,
  enemySpawns: [
    { type: 'melee', x: 440, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 640, y: GAME_HEIGHT - 120 },
    { type: 'melee', x: 860, y: GAME_HEIGHT - 120 },
    { type: 'ranged', x: 1060, y: GAME_HEIGHT - 120 },
    { type: 'flying', x: 560, y: GAME_HEIGHT - 320 },
    { type: 'flying', x: 980, y: GAME_HEIGHT - 280 },
  ],
});
