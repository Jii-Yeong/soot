/**
 * 스테이지 1 보스(city warden)의 실제 스프라이트 아틀라스.
 *
 * 이 이름들은 제공된 Aseprite JSON의 `frameTags`를 의도적으로 그대로 따름.
 * 아틀라스가 포즈 이름과 프레임 범위의 원본(source of truth).
 */
const frameName = (index: number) => `stage-1-boss ${index}.aseprite`;

export const STAGE_ONE_BOSS_ATLAS_KEY = 'stage-1-boss';
export const STAGE_ONE_BOSS_ATLAS_PNG = '/assets/bosses/stage-1-boss.png';
export const STAGE_ONE_BOSS_ATLAS_JSON = '/assets/bosses/stage-1-boss.json';

export const STAGE_ONE_BOSS_LASER_ASSETS = {
  back: {
    key: 'stage-1-boss-laser-back',
    url: '/assets/bosses/stage-1-laser/stage-1-boss-laser-back.png',
    /** 트림된 123px 이미지에서 밝은 발사구 중심의 X 좌표. */
    muzzleAnchorX: 47,
  },
  middle: {
    key: 'stage-1-boss-laser-middle',
    url: '/assets/bosses/stage-1-laser/stage-1-boss-laser-middle.png',
  },
  front: {
    key: 'stage-1-boss-laser-front',
    url: '/assets/bosses/stage-1-laser/stage-1-boss-laser-front.png',
  },
} as const;

export const STAGE_ONE_BOSS_TAGS = {
  idle: 'idle',
  walk: 'walk',
  charge: 'charge',
  fire: 'fire',
  recoil: 'recoil',
  death: 'death',
} as const;

export const STAGE_ONE_BOSS_ANIMATIONS = {
  idle: 'stage-1-boss-idle',
  walk: 'stage-1-boss-walk',
  charge: 'stage-1-boss-charge',
  fire: 'stage-1-boss-fire',
  recoil: 'stage-1-boss-recoil',
  death: 'stage-1-boss-death',
} as const;

type StageOneBossTag = keyof typeof STAGE_ONE_BOSS_TAGS;

/** 제공된 아틀라스 JSON에서 그대로 옮긴 프레임 범위와 프레임 시간. */
export const STAGE_ONE_BOSS_TAG_FRAMES: Record<
  StageOneBossTag,
  readonly { frame: string; duration: number }[]
> = {
  idle: [0, 1, 2, 3].map((index) => ({
    frame: frameName(index),
    duration: [180, 240, 180, 240][index],
  })),
  walk: [4, 5].map((index) => ({ frame: frameName(index), duration: 350 })),
  charge: [7, 8, 9].map((index) => ({ frame: frameName(index), duration: 120 })),
  fire: [
    { frame: frameName(10), duration: 90 },
    { frame: frameName(11), duration: 60 },
  ],
  recoil: [
    { frame: frameName(12), duration: 100 },
    { frame: frameName(13), duration: 180 },
  ],
  death: [
    { frame: frameName(14), duration: 100 },
    { frame: frameName(15), duration: 180 },
  ],
};

export const STAGE_ONE_BOSS_LOOPING_TAGS = new Set<StageOneBossTag>([
  'idle',
  'walk',
  'fire',
]);

/**
 * 스테이지 2 보스(alley-hunter, 기계 사냥개)의 실제 스프라이트 아틀라스.
 *
 * 이 이름들은 제공된 Aseprite JSON의 `frameTags`를 그대로 따름. 프레임 키는
 * 숫자 인덱스('0'~'10')이며, 아틀라스가 포즈 이름과 프레임 범위의 원본임.
 */
export const STAGE_TWO_BOSS_ATLAS_KEY = 'stage-2-boss';
export const STAGE_TWO_BOSS_ATLAS_PNG = '/assets/bosses/stage-2-boss.png';
export const STAGE_TWO_BOSS_ATLAS_JSON = '/assets/bosses/stage-2-boss.json';

export const STAGE_TWO_BOSS_TAGS = {
  idle: 'idle',
  walk: 'walk',
  quest: 'quest',
  attack: 'attack',
  death: 'death',
} as const;

export const STAGE_TWO_BOSS_ANIMATIONS = {
  idle: 'stage-2-boss-idle',
  walk: 'stage-2-boss-walk',
  quest: 'stage-2-boss-quest',
  attack: 'stage-2-boss-attack',
  death: 'stage-2-boss-death',
} as const;

type StageTwoBossTag = keyof typeof STAGE_TWO_BOSS_TAGS;

/** 제공된 아틀라스 JSON에서 그대로 옮긴 프레임 범위와 프레임 시간. */
export const STAGE_TWO_BOSS_TAG_FRAMES: Record<
  StageTwoBossTag,
  readonly { frame: string; duration: number }[]
> = {
  idle: [0, 1, 2, 3].map((index) => ({ frame: String(index), duration: 220 })),
  walk: [4, 5].map((index) => ({ frame: String(index), duration: 170 })),
  // 잠금(사격 준비) 시 유지되는 웅크린 단일 포즈.
  quest: [{ frame: '6', duration: 200 }],
  attack: [
    { frame: '7', duration: 90 },
    { frame: '8', duration: 130 },
  ],
  death: [
    { frame: '9', duration: 150 },
    { frame: '10', duration: 220 },
  ],
};

export const STAGE_TWO_BOSS_LOOPING_TAGS = new Set<StageTwoBossTag>([
  'idle',
  'walk',
]);
