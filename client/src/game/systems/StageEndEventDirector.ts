import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '@/game/config/gameDimensions';
import type { StageEndEvent } from '@/game/config/stageConfig';

/** 화면 중앙(=착지한 플레이어) 기준 양쪽으로 세우는 안드로이드 실루엣 간격. */
const SIEGE_FLANK_OFFSETS = [120, 210, 300, 390, 480, 570];
/** 안드로이드가 하나씩 나타나는 간격. */
const SIEGE_REVEAL_INTERVAL = 200;
/** 싱킹 연출에 쓰는 검은 선/점 개수. */
const SINK_STREAK_COUNT = 14;

export class StageEndEventDirector {
  constructor(private readonly scene: Phaser.Scene) {}

  play(event: StageEndEvent, onBlackout: () => void) {
    switch (event) {
      case 'siege':
        this.playSiege(onBlackout);
        return;
      default: {
        const unhandledEvent: never = event;
        throw new Error(`Unsupported stage end event: ${unhandledEvent}`);
      }
    }
  }

  /**
   * 3스테이지 강하 컷신 후반: 착지한 플레이어 양쪽으로 안드로이드가 하나씩
   * 나타나 포위 → 화면이 점점 암전되며 검은 선·점이 위로 흘러 아래로 꺼지는
   * 느낌을 준 뒤, 완전 암전에서 `onBlackout`(다음 스테이지 구성)을 호출하고 다시
   * 밝혀 4스테이지를 드러낸다.
   */
  private playSiege(onBlackout: () => void) {
    const centerX = GAME_WIDTH / 2;
    const bodyY = GAME_HEIGHT - 116;
    const eyeY = GAME_HEIGHT - 150;
    const props: Phaser.GameObjects.GameObject[] = [];

    // 중앙 기준 안쪽부터 바깥으로, 좌우 번갈아 한 기씩 나타나며 포위한다.
    const flankXs = SIEGE_FLANK_OFFSETS.flatMap((offset) => [
      centerX - offset,
      centerX + offset,
    ]);
    flankXs.forEach((flankX, index) => {
      const direction = flankX < centerX ? -1 : 1;
      const body = this.scene.add
        .rectangle(flankX + direction * 90, bodyY, 34, 96, 0x05070b, 0.98)
        .setDepth(60)
        .setScrollFactor(0)
        .setAlpha(0);
      const eye = this.scene.add
        .rectangle(flankX + direction * 90, eyeY, 22, 6, 0xff4657, 1)
        .setDepth(61)
        .setScrollFactor(0)
        .setAlpha(0);
      props.push(body, eye);

      this.scene.time.delayedCall(SIEGE_REVEAL_INTERVAL * index, () => {
        this.scene.tweens.add({
          targets: [body, eye],
          x: flankX,
          alpha: 1,
          duration: 220,
          ease: 'Quad.easeOut',
        });
        this.scene.cameras.main.shake(80, 0.0025);
      });
    });

    // 적이 다 나타난 뒤: 카메라가 아래로 내려가며 하강감을 주고, 그때 흰색
    // 선·점이 위로 흘러 밑으로 꺼지는 느낌을 표기한다. 이어서 암전 → 다음 스테이지.
    const descendDelay = SIEGE_REVEAL_INTERVAL * flankXs.length + 500;
    this.scene.time.delayedCall(descendDelay, () => {
      const camera = this.scene.cameras.main;
      camera.shake(360, 0.012);
      camera.stopFollow();
      camera.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT * 2);
      this.scene.tweens.add({
        targets: camera,
        scrollY: GAME_HEIGHT * 0.92,
        duration: 1100,
        ease: 'Sine.easeIn',
      });

      // 바닥 아래는 그려진 것이 없어 투명하게 비친다. 카메라가 내려가며 드러나는
      // 구간을 검은 월드 사각형으로 채운다.
      const voidHeight = GAME_HEIGHT * 1.5;
      const voidFill = this.scene.add
        .rectangle(
          GAME_WIDTH / 2,
          GAME_HEIGHT + voidHeight / 2,
          GAME_WIDTH,
          voidHeight,
          0x000000,
          1,
        )
        .setDepth(5);
      props.push(voidFill);

      const sinkStreaks = this.spawnSinkStreaks();
      const blackout = this.scene.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 1)
        .setDepth(90)
        .setAlpha(0)
        .setScrollFactor(0);

      // 하강이 먼저 읽히도록 잠시 뒤 암전을 시작한다.
      this.scene.time.delayedCall(520, () => {
        this.scene.tweens.add({
          targets: blackout,
          alpha: 1,
          duration: 720,
          onComplete: () => {
            onBlackout();
            this.scene.tweens.add({
              targets: blackout,
              alpha: 0,
              duration: 560,
              onComplete: () => {
                blackout.destroy();
                for (const streak of sinkStreaks) {
                  streak.destroy();
                }
                for (const prop of props) {
                  prop.destroy();
                }
              },
            });
          },
        });
      });
    });
  }

  /**
   * 흰색 선과 점이 위로 빠르게 흘러가 카메라가 아래로 내려가는(꺼지는) 느낌을
   * 표기한다. 화면 좌표 고정(scrollFactor 0)이라 카메라 하강과 무관하게 흐른다.
   */
  private spawnSinkStreaks() {
    const streaks: Phaser.GameObjects.GameObject[] = [];
    for (let index = 0; index < SINK_STREAK_COUNT; index += 1) {
      const isDot = index % 2 === 0;
      const x = Phaser.Math.Between(40, GAME_WIDTH - 40);
      const y = Phaser.Math.Between(GAME_HEIGHT, GAME_HEIGHT * 2);
      const streak = isDot
        ? this.scene.add.rectangle(x, y, 4, 4, 0xffffff, 0.95)
        : this.scene.add.rectangle(x, y, 2, 46, 0xffffff, 0.85);
      streak.setDepth(89).setScrollFactor(0);
      streaks.push(streak);
      this.scene.tweens.add({
        targets: streak,
        y: -80,
        duration: Phaser.Math.Between(420, 780),
        repeat: -1,
        ease: 'Linear',
      });
    }
    return streaks;
  }
}
