import Phaser from 'phaser';
import type {
  CeilingPipe,
  TerrainPiece,
} from '@/game/config/roomConfig';
import type { SliceSkinConfig } from '@/game/config/terrainSkinConfig';
import { drawSliceSkin } from '@/game/systems/SliceSkin';

const TERRAIN_DEPTH = 5;
const PIPE_DEPTH = 4;

const TERRAIN_STYLE = {
  platform: { fill: 0x9aa4ab, edge: 0xe8eef1 },
  wall: { fill: 0x707a81, edge: 0xc4ccd0 },
} as const;

/**
 * 방의 solid 레벨 지형(발판과 벽)을 static body로 빌드함. 바디들은 하나의
 * static 그룹에 있어, 영구적인 플레이어 collider 하나가 방 전반에 걸쳐 이를
 * 추적함. `build`는 방마다 내용을 교체함. 발판(stool) 스킨이 제공되면
 * 발판은 placeholder 블록을 숨기고 대신 3-slice 픽셀 스킨을 보여줌(충돌은
 * 여전히 바디가 담당). 벽은 블록을 그대로 유지함.
 */
export class TerrainBuilder {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private skinObjects: Phaser.GameObjects.GameObject[] = [];
  private pipeObjects: Phaser.GameObjects.GameObject[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    this.group = scene.physics.add.staticGroup();
  }

  build(
    pieces: readonly TerrainPiece[] = [],
    stoolSkin?: SliceSkinConfig,
    ceilingPipes: readonly CeilingPipe[] = [],
  ) {
    this.group.clear(true, true);
    this.clearSkin();
    this.clearPipes();

    for (const piece of pieces) {
      const style = TERRAIN_STYLE[piece.type];
      const skinned = Boolean(stoolSkin) && piece.type === 'platform';
      // 스킨된 발판은 아트의 두께를 따라, 충돌이 픽셀 판과 일치하게 함.
      // 상단 표면(piece.y)은 어느 쪽이든 변하지 않음.
      const height = skinned ? stoolSkin!.height : piece.height;
      const block = this.scene.add
        .rectangle(
          piece.x + piece.width / 2,
          piece.y + height / 2,
          piece.width,
          height,
          style.fill,
        )
        .setStrokeStyle(2, style.edge, 0.9)
        .setDepth(TERRAIN_DEPTH);

      this.group.add(block);
      // A static body added to a shape isn't sized from the shape until it is
      // synced to the game object's current transform.
      (block.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

      if (skinned) {
        // 블록은 물리 바디로 유지하되 픽셀 스킨 아래에 숨김.
        block.setVisible(false);
        this.skinObjects.push(
          ...drawSliceSkin(
            this.scene,
            stoolSkin!,
            piece.x,
            piece.x + piece.width,
            piece.y,
            TERRAIN_DEPTH,
          ),
        );
      }
    }

    for (const pipe of ceilingPipes) {
      this.drawCeilingPipe(pipe);
    }
  }

  /** 산업용 배관과 자석 발이 붙는 하부 레일을 한 오브젝트로 그림. */
  private drawCeilingPipe(pipe: CeilingPipe) {
    const graphics = this.scene.add
      .graphics({ x: pipe.x, y: pipe.y })
      .setDepth(PIPE_DEPTH);
    graphics.fillStyle(0x182326, 1);
    graphics.fillRoundedRect(0, 0, pipe.width, 26, 8);
    graphics.lineStyle(3, 0x536468, 1);
    graphics.strokeRoundedRect(0, 0, pipe.width, 26, 8);
    graphics.lineStyle(2, 0x26383a, 1);
    graphics.lineBetween(0, 17, pipe.width, 17);
    graphics.fillStyle(0x6a7c7e, 1);
    for (let x = 80; x < pipe.width; x += 180) {
      graphics.fillRect(x, -5, 14, 36);
      graphics.fillStyle(0x9bcc78, 0.75);
      graphics.fillCircle(x + 7, 13, 3);
      graphics.fillStyle(0x6a7c7e, 1);
    }
    this.pipeObjects.push(graphics);
  }

  private clearSkin() {
    for (const obj of this.skinObjects) {
      obj.destroy();
    }
    this.skinObjects = [];
  }

  private clearPipes() {
    for (const obj of this.pipeObjects) {
      obj.destroy();
    }
    this.pipeObjects = [];
  }
}
