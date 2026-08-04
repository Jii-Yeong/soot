export enum AerialMovementMode {
  HOVER = 'HOVER',
  TRACK = 'TRACK',
  PATROL = 'PATROL',
  ORBIT = 'ORBIT',
}

export type AerialMovementConfig = {
  mode: AerialMovementMode;
  rangeX?: number;
  rangeY?: number;
  cycleDuration?: number;
};

/** 지상 스테이지 비행 적의 작은 경계 순찰. 5스테이지 편대 패턴과 구분함. */
export const GROUND_STAGE_FLYING_PATROL = {
  mode: AerialMovementMode.PATROL,
  rangeX: 100,
  rangeY: 28,
  cycleDuration: 3200,
} as const satisfies AerialMovementConfig;
