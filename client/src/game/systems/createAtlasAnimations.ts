import type Phaser from 'phaser';
import type { EnemyAnimationFrame } from '@/game/config/enemyAnimationAtlasConfig';

type AtlasAnimationConfig = {
  texture: string;
  animations: Readonly<Record<string, string>>;
  tagFrames: Readonly<Record<string, readonly EnemyAnimationFrame[]>>;
  loopingTags: ReadonlySet<string>;
};

/** 태그별 프레임 설정을 Phaser 애니메이션으로 한 번만 등록함. */
export function createAtlasAnimations(
  animationsManager: Phaser.Animations.AnimationManager,
  atlas: AtlasAnimationConfig,
) {
  for (const tag of Object.keys(atlas.tagFrames)) {
    const animationKey = atlas.animations[tag];
    if (animationsManager.exists(animationKey)) {
      continue;
    }
    animationsManager.create({
      key: animationKey,
      frames: atlas.tagFrames[tag].map(({ frame, duration }) => ({
        key: atlas.texture,
        frame,
        duration,
      })),
      repeat: atlas.loopingTags.has(tag) ? -1 : 0,
    });
  }
}
