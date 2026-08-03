export type EnemyAnimationFrame = {
  frame: string;
  duration: number;
};

/** A real enemy atlas and the tagged animations BootScene creates from it. */
export type EnemyAnimationAtlasConfig<TTag extends string> = {
  texture: string;
  png: string;
  json: string;
  animations: Record<TTag, string>;
  tagFrames: Record<TTag, readonly EnemyAnimationFrame[]>;
  loopingTags: ReadonlySet<TTag>;
};
