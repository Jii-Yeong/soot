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
