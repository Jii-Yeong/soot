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

export type EnemySpriteGeometry = {
  scale: number;
  bodyWidth: number;
  bodyHeight: number;
};

export type GroundedEnemySpriteGeometry = EnemySpriteGeometry & {
  bodyOffsetX: number;
  bodyOffsetY: number;
};

export type EnemySpriteConfig<
  TTag extends string,
  TGeometry extends EnemySpriteGeometry,
> = TGeometry & {
  texture: string;
  animations: Record<TTag, string>;
};

type EnemyAtlasSetOptions<
  TTag extends string,
  TStages extends readonly number[],
  TGeometry extends EnemySpriteGeometry,
> = {
  slug: string;
  stages: TStages;
  tagFrames: Record<TTag, readonly EnemyAnimationFrame[]>;
  loopingTags: ReadonlySet<TTag>;
  sprite: TGeometry;
};

/** Builds every stage-specific key, asset path, animation, atlas, and sprite. */
export function defineEnemyAtlasSet<
  TTag extends string,
  const TStages extends readonly number[],
  TGeometry extends EnemySpriteGeometry,
>({
  slug,
  stages,
  tagFrames,
  loopingTags,
  sprite,
}: EnemyAtlasSetOptions<TTag, TStages, TGeometry>) {
  type Stage = TStages[number];
  type SpriteConfig = EnemySpriteConfig<TTag, TGeometry>;
  const animationSuffix = (tag: TTag) =>
    tag.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

  const entries = stages.map((stage) => {
    const texture = `stage-${stage}-${slug}`;
    const animations = Object.fromEntries(
      (Object.keys(tagFrames) as TTag[]).map((tag) => [
        tag,
        `${texture}-${animationSuffix(tag)}`,
      ]),
    ) as Record<TTag, string>;
    const atlas: EnemyAnimationAtlasConfig<TTag> = {
      texture,
      png: `/assets/enemies/${texture}.png`,
      json: `/assets/enemies/${texture}.json`,
      animations,
      tagFrames,
      loopingTags,
    };
    const spriteConfig = { texture, animations, ...sprite } as SpriteConfig;

    return { stage, atlas, sprite: spriteConfig };
  });

  const atlases: readonly EnemyAnimationAtlasConfig<TTag>[] = entries.map(
    ({ atlas }) => atlas,
  );

  return {
    atlases,
    sprites: Object.fromEntries(
      entries.map(({ stage, sprite: spriteConfig }) => [stage, spriteConfig]),
    ) as Record<Stage, SpriteConfig>,
  };
}
