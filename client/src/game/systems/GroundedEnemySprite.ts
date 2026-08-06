import Phaser from 'phaser';
import { FLOOR_SURFACE_Y } from '@/game/systems/FloorBuilder';

/** 시체가 페이드 전에 머무는 시간, 그리고 페이드에 걸리는 시간. */
const DEATH_HOLD_MS = 400;
const DEATH_FADE_MS = 350;

/** 지상 적이 스스로 배치·애니메이션하기 위해 필요한 실제 아틀라스 필드. */
export type GroundedEnemySpriteConfig = {
  animations: { idle: string; death: string };
  scale: number;
  bodyWidth: number;
  bodyHeight: number;
  bodyOffsetX: number;
  bodyOffsetY: number;
};

/**
 * 지상 적(근접, 원거리)의 공용 실제 아틀라스 라이프사이클: 여백 있는 바디의
 * 크기를 맞추고 발 기준으로 정렬하며, 애니메이션 재생을 중복 제거하고,
 * '시체가 머문 뒤 페이드아웃' 죽음 시퀀스를 실행함. 두 적 클래스가 중복
 * 구현하지 않도록 조합(composition)으로 사용됨.
 */
export class GroundedEnemySprite {
  private activeAnimation?: string;

  constructor(
    private readonly sprite: Phaser.Physics.Arcade.Sprite,
    private readonly config: GroundedEnemySpriteConfig,
  ) {}

  /**
   * 바디 크기를 줄이고 바닥 위 캐릭터의 발에 하단 정렬함. idle 프레임을
   * 먼저 재생해, 바디가 스프라이트 생성 시의 placeholder가 아니라 아틀라스
   * 프레임에 매핑되게 함. 또 발이 바닥에 닿도록 스폰하여, 여백으로 키가 큰
   * 바디가 바닥 타일과 겹쳐 뚫고 지나가는 것을 방지함.
   */
  apply() {
    this.sprite.setScale(this.config.scale);
    this.play(this.config.animations.idle);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(this.config.bodyWidth, this.config.bodyHeight);
    body.setOffset(this.config.bodyOffsetX, this.config.bodyOffsetY);
    this.sprite.setY(
      FLOOR_SURFACE_Y -
        this.config.bodyOffsetY -
        this.config.bodyHeight +
        this.sprite.displayOriginY,
    );
    body.reset(this.sprite.x, this.sprite.y);
  }

  /**
   * 콜드 로드로 아틀라스가 스폰보다 늦게 도착한 경우, 스케일과 현재 애니메이션을
   * 다시 적용해 __MISSING 텍스처를 실제 프레임으로 교체한다(위치·바디는 초기
   * apply에서 이미 잡혀 있어 건드리지 않는다). 공격 중이라면 idle로 되돌리지 않음.
   */
  refresh() {
    const currentAnimation =
      this.activeAnimation ?? this.config.animations.idle;
    this.sprite.setScale(this.config.scale);
    this.activeAnimation = undefined;
    this.play(currentAnimation);
  }

  /** 이미 활성인 애니메이션이 아닐 때만 재생. */
  play(key: string) {
    if (this.activeAnimation === key) {
      return;
    }

    this.activeAnimation = key;
    this.sprite.play(key, true);
  }

  /**
   * 적을 멈추고 death 프레임을 재생한 뒤 시체를 유지하다가 페이드아웃하고
   * `remove`를 호출함.
   */
  playDeath(remove: () => void) {
    (this.sprite.body as Phaser.Physics.Arcade.Body).enable = false;
    this.play(this.config.animations.death);
    this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.sprite.scene.time.delayedCall(DEATH_HOLD_MS, () => {
        if (!this.sprite.active) {
          return;
        }
        this.sprite.scene.tweens.add({
          targets: this.sprite,
          alpha: 0,
          duration: DEATH_FADE_MS,
          ease: 'Sine.easeIn',
          onComplete: remove,
        });
      });
    });
  }
}
