import Phaser from 'phaser';
import type {
  BossCombatConfig,
  BossPatternConfig,
} from '@/game/config/bossConfig';
import { Enemy } from '@/game/entities/Enemy';

export abstract class BossEnemy<
  Pattern extends BossPatternConfig = BossPatternConfig,
> extends Enemy {
  readonly aggroRadius: number;
  readonly aggroIndicatorColor: number;

  private contactDamageReadyAt = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    protected readonly config: BossCombatConfig<Pattern>,
  ) {
    super(scene, x, y, texture, config.maxHealth);

    this.aggroRadius = config.aggroRadius;
    this.aggroIndicatorColor = config.aggroIndicatorColor;
  }

  override tryContactAttack(time: number) {
    if (!this.active || time < this.contactDamageReadyAt) {
      return null;
    }

    this.contactDamageReadyAt = time + this.config.contactDamageCooldown;
    return this.config.contactDamage;
  }

  override applyKnockback(
    angle: number,
    force: number,
    time: number,
    durationMs = 160,
  ) {
    super.applyKnockback(angle, force * 0.18, time, durationMs * 0.5);
  }
}
