import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '@/game/config/gameDimensions';
import type { StageEndEvent } from '@/game/config/stageConfig';

/** 화면 중앙(=착지한 플레이어) 기준 양쪽으로 세우는 안드로이드 실루엣 간격. */
const SIEGE_FLANK_OFFSETS = [120, 210, 300, 390, 480, 570];
/** 안드로이드가 하나씩 나타나는 간격. */
const SIEGE_REVEAL_INTERVAL = 200;
/** 싱킹 연출에 쓰는 검은 선/점 개수. */
const SINK_STREAK_COUNT = 14;

/**
 * 화면 파괴 안무 타이밍(파편이 화면을 덮은 시점 기준). 첫 조각이 뜸을 두고
 * 떨어지고, 몇 조각 더 떨어진 뒤 나머지가 우르르 쏟아진다.
 */
const SHATTER_FIRST_DROP = 700;
const SHATTER_AVALANCHE = 2900;

export class StageEndEventDirector {
  constructor(private readonly scene: Phaser.Scene) {}

  play(event: StageEndEvent, onBlackout: () => void) {
    switch (event) {
      case 'siege':
        this.playSiege(onBlackout);
        return;
      case 'shatter':
        this.playShatter(onBlackout);
        return;
      case 'ascension':
        // 방 교체는 GameScene이 직접 playAscension을 호출해 처리한다. 이 경로로
        // 들어오면 방 교체 없이 포위 오버레이만 재생하는 안전한 대체 동작.
        this.playAscension(() => {}, onBlackout);
        return;
      default: {
        const unhandledEvent: never = event;
        throw new Error(`Unsupported stage end event: ${unhandledEvent}`);
      }
    }
  }

  /**
   * 5스테이지 종료 연출: 화면이 점점 하얘진 뒤, 그 하얀 화면 뒤에서 3스테이지
   * 종료 포위 방으로 복귀(`onEnterRoom`)하고 적 실루엣이 플레이어를 포위한다.
   * 잠시 그대로 두었다가 `onComplete`(클리어/승리 화면)로 넘어간다.
   */
  playAscension(onEnterRoom: () => void, onComplete: () => void) {
    // 화면 스케일이 EXPAND라 넓은 화면에서는 카메라 폭이 GAME_WIDTH보다 크다.
    // scrollFactor 0 오버레이·실루엣은 실제 카메라 크기를 기준으로 배치해야
    // 흰 화면이 옆까지 덮이고 실루엣이 좌우로 고르게 포위한다.
    const camera = this.scene.cameras.main;
    const screenWidth = camera.width;
    const screenHeight = camera.height;
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    const bodyY = screenHeight - 116;
    const eyeY = screenHeight - 150;
    const props: Phaser.GameObjects.GameObject[] = [];

    // 화면이 점점 하얘진다.
    const white = this.scene.add
      .rectangle(centerX, centerY, screenWidth, screenHeight, 0xffffff, 0)
      .setDepth(90)
      .setScrollFactor(0);
    this.scene.tweens.add({
      targets: white,
      alpha: 1,
      duration: 900,
      ease: 'Sine.easeIn',
      onComplete: () => {
        // 완전히 하얀 순간 3스테이지 지하 착지 방으로 교체(교체를 흰빛으로 감춤).
        onEnterRoom();

        // 좌우로 적 실루엣이 화면 폭에 고르게 퍼져 플레이어를 포위한다.
        const perSide = SIEGE_FLANK_OFFSETS.length;
        const flankXs: number[] = [];
        for (const side of [-1, 1]) {
          for (let index = 0; index < perSide; index += 1) {
            flankXs.push(
              centerX + side * centerX * ((index + 1) / (perSide + 1)),
            );
          }
        }
        for (const flankX of flankXs) {
          const body = this.scene.add
            .rectangle(flankX, bodyY, 34, 96, 0x05070b, 0.98)
            .setDepth(92)
            .setScrollFactor(0)
            .setAlpha(0);
          const eye = this.scene.add
            .rectangle(flankX, eyeY, 22, 6, 0xff4657, 1)
            .setDepth(93)
            .setScrollFactor(0)
            .setAlpha(0);
          props.push(body, eye);
        }
        // 흰빛을 옅게 내려 지하 포위 방이 드러나게 하고 실루엣을 밝힌다.
        this.scene.tweens.add({ targets: white, alpha: 0.2, duration: 700 });
        this.scene.tweens.add({
          targets: props,
          alpha: 1,
          duration: 600,
          delay: 200,
        });

        // 3초 뒤 클리어로 넘어가고, 연출용 오브젝트를 정리한다.
        this.scene.time.delayedCall(3000, () => {
          onComplete();
          this.scene.tweens.add({
            targets: [white, ...props],
            alpha: 0,
            duration: 500,
            onComplete: () => {
              white.destroy();
              for (const prop of props) {
                prop.destroy();
              }
            },
          });
        });
      },
    });
  }

  /**
   * 4스테이지 종료 연출: 현재 화면을 캡쳐해 그 이미지가 유리처럼 깨진다. 흰
   * 균열이 번지며 캡쳐 화면이 파편으로 갈라지고, 조각이 화면을 가린 순간
   * `onBlackout`(다음 스테이지 구성)을 호출해 교체를 감춘 뒤 흩뿌려 5스테이지를
   * 드러낸다.
   */
  private playShatter(onBlackout: () => void) {
    // 현재 프레임을 캡쳐한 뒤(다음 렌더에 콜백) 그 이미지를 깨뜨린다.
    this.scene.game.renderer.snapshot((snapshot) => {
      if (snapshot instanceof HTMLImageElement) {
        this.runShatter(snapshot, onBlackout);
      } else {
        onBlackout();
      }
    });
  }

  private runShatter(snapshotImage: HTMLImageElement, onBlackout: () => void) {
    const camera = this.scene.cameras.main;
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    const snapshotKey = 'stage-shatter-snapshot';
    if (this.scene.textures.exists(snapshotKey)) {
      this.scene.textures.remove(snapshotKey);
    }
    this.scene.textures.addImage(snapshotKey, snapshotImage);

    // 캡쳐 화면으로 현재 프레임을 고정해 덮는다(그 아래 씬은 곧 교체됨).
    const cover = this.scene.add
      .image(0, 0, snapshotKey)
      .setOrigin(0, 0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(94)
      .setScrollFactor(0);

    // 불규칙 유리 파편 그물: 중앙 충격점서 방사형 스포크 + 동심 링으로 화면을
    // 불규칙 셀로 나눈다. 스포크 각도·링 반경을 흔들어 진짜 깨진 유리처럼 만든다.
    const spokes = 12;
    const rings = [0, 130, 270, 430, 620, 900];
    const angleJitter = Array.from({ length: spokes }, () =>
      Phaser.Math.FloatBetween(-0.16, 0.16),
    );
    const radiusJitter = rings.map((_, ring) =>
      Array.from({ length: spokes }, () =>
        ring === 0 ? 0 : Phaser.Math.FloatBetween(-0.18, 0.18),
      ),
    );
    const web = (ring: number, spoke: number) => {
      const index = ((spoke % spokes) + spokes) % spokes;
      const theta = (index / spokes) * Math.PI * 2 + angleJitter[index]!;
      const radius = rings[ring]! * (1 + radiusJitter[ring]![index]!);
      return {
        x: centerX + Math.cos(theta) * radius,
        y: centerY + Math.sin(theta) * radius,
      };
    };

    // 균열선(파편 경계 그물)이 점차 번지는 연출.
    const cracks = this.scene.add
      .graphics()
      .setDepth(95)
      .setScrollFactor(0)
      .setAlpha(0);
    // 얇고 거친 균열선. 두 점 사이를 곧게 잇지 않고, 수직 방향으로 흔든 여러
    // 짧은 마디로 지그재그를 그려 불규칙하게 갈라진 유리처럼 보이게 한다.
    cracks.lineStyle(1, 0xffffff, 0.9);
    const jaggedTo = (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const deltaX = to.x - from.x;
      const deltaY = to.y - from.y;
      const length = Math.hypot(deltaX, deltaY) || 1;
      const normalX = -deltaY / length;
      const normalY = deltaX / length;
      const steps = Phaser.Math.Between(2, 4);
      for (let step = 1; step <= steps; step += 1) {
        const t = step / steps;
        const offset = step === steps ? 0 : Phaser.Math.Between(-9, 9);
        cracks.lineTo(
          from.x + deltaX * t + normalX * offset,
          from.y + deltaY * t + normalY * offset,
        );
      }
    };
    for (let spoke = 0; spoke < spokes; spoke += 1) {
      cracks.beginPath();
      cracks.moveTo(centerX, centerY);
      let previous = { x: centerX, y: centerY };
      for (let ring = 1; ring < rings.length; ring += 1) {
        const point = web(ring, spoke);
        jaggedTo(previous, point);
        previous = point;
      }
      cracks.strokePath();
    }
    for (let ring = 1; ring < rings.length; ring += 1) {
      cracks.beginPath();
      let previous = web(ring, 0);
      cracks.moveTo(previous.x, previous.y);
      for (let spoke = 1; spoke <= spokes; spoke += 1) {
        const point = web(ring, spoke);
        jaggedTo(previous, point);
        previous = point;
      }
      cracks.strokePath();
    }
    this.scene.tweens.add({ targets: cracks, alpha: 1, duration: 460 });
    camera.shake(600, 0.012);

    // 균열이 번진 뒤 캡쳐 화면을 불규칙 파편(Mesh2D)으로 잘라, 다음 스테이지로
    // 교체한 뒤 조각마다 회전·낙하시킨다. 각 메시는 캡쳐 텍스처를 UV로 매핑한
    // 폴리곤이라, 그 셀 모양 그대로 자신의 화면 픽셀을 담는다.
    this.scene.time.delayedCall(540, () => {
      const meshes: Phaser.GameObjects.Mesh2D[] = [];
      for (let ring = 0; ring < rings.length - 1; ring += 1) {
        for (let spoke = 0; spoke < spokes; spoke += 1) {
          const corners = [
            web(ring, spoke),
            web(ring, spoke + 1),
            web(ring + 1, spoke + 1),
            web(ring + 1, spoke),
          ];
          const cx =
            corners.reduce((sum, point) => sum + point.x, 0) / corners.length;
          const cy =
            corners.reduce((sum, point) => sum + point.y, 0) / corners.length;
          // 정점: [x, y, u, v] * 4. 위치는 중심(cx,cy) 기준 상대, UV는 캡쳐
          // 텍스처(화면 전체) 좌표. 회전축이 조각 중심에 오도록 상대 좌표로 둔다.
          const vertices = corners.flatMap((point) => [
            point.x - cx,
            point.y - cy,
            point.x / GAME_WIDTH,
            point.y / GAME_HEIGHT,
          ]);
          const indices = [0, 1, 2, 0, 0, 2, 3, 0];
          // 캡쳐 텍스처는 위에서 아래로 저장되지만 GL UV는 아래에서 위라, flipV로
          // 상하 반전을 바로잡는다.
          const mesh = this.scene.add
            .mesh2d(cx, cy, snapshotKey, vertices, indices, true)
            .setDepth(94)
            .setScrollFactor(0);
          meshes.push(mesh);
        }
      }

      // 파편이 화면을 완전히 가린 지금 다음 스테이지를 구성한다(교체를 감춤).
      // 균열 간 캡쳐 화면은 잠시 그대로 멈춰 있다가 아래 안무대로 떨어진다.
      onBlackout();
      cover.destroy();
      camera.shake(240, 0.006);

      // 한 조각이 회전하며 떨어지는 낙하 트윈.
      const dropShard = (mesh: Phaser.GameObjects.Mesh2D, delay: number) => {
        this.scene.tweens.add({
          targets: mesh,
          x: mesh.x + Phaser.Math.Between(-80, 80),
          y: mesh.y + GAME_HEIGHT * 1.1 + Phaser.Math.Between(0, 280),
          angle: Phaser.Math.Between(-180, 180),
          duration: Phaser.Math.Between(720, 1160),
          delay,
          ease: 'Quad.easeIn',
          onComplete: () => mesh.destroy(),
        });
        this.scene.tweens.add({
          targets: mesh,
          alpha: 0,
          delay: delay + Phaser.Math.Between(200, 480),
          duration: 460,
        });
      };

      // 안무: 1초 뒤 한 조각, 1초 뒤 한 조각, 곧이어 한 조각, 그다음 우르르.
      Phaser.Utils.Array.Shuffle(meshes);
      const soloDelays = [SHATTER_FIRST_DROP, 1700, 2200];
      meshes.forEach((mesh, index) => {
        const delay =
          index < soloDelays.length
            ? soloDelays[index]!
            : SHATTER_AVALANCHE + Phaser.Math.Between(0, 700);
        dropShard(mesh, delay);
      });

      // 우르르 쏟아지는 순간 균열선을 지우고 화면을 크게 흔든다.
      this.scene.time.delayedCall(SHATTER_AVALANCHE, () => {
        camera.shake(520, 0.02);
        this.scene.tweens.add({
          targets: cracks,
          alpha: 0,
          duration: 260,
          onComplete: () => cracks.destroy(),
        });
      });
    });
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
