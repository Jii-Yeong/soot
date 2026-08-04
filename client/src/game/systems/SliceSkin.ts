import Phaser from 'phaser';
import type { SliceSkinConfig } from '@/game/config/terrainSkinConfig';

/**
 * 중앙 이미지에서 옆 여백/가장자리 선을 제거해 타일링이 깔끔하게 반복되도록
 * 잘라낸 프레임. 텍스처당 한 번만 만들어 재사용함.
 */
function tileableMiddleFrame(
  scene: Phaser.Scene,
  skin: SliceSkinConfig,
): string {
  const trim = skin.middleTrim ?? { left: 0, right: 0 };
  const frameName = `${skin.middle.key}__tile`;
  const texture = scene.textures.get(skin.middle.key);
  if (!texture.has(frameName)) {
    const source = texture.getSourceImage() as { height: number };
    texture.add(
      frameName,
      0,
      trim.left,
      0,
      skin.middle.width - trim.left - trim.right,
      source.height,
    );
  }
  return frameName;
}

/**
 * [startX, endX] 구간에 수평 3-slice 스킨을 그리되 표면을 `surfaceY`에 맞춤:
 * 중앙이 구간 전체를 덮고(짧은 발판은 늘리고, 긴 바닥은 원본 크기로 타일링)
 * 캡이 그 양 끝 위에 올라감. 그래서 틈이나 반복 이음새가 없음. 재빌드 시
 * 호출자가 파괴할 수 있도록 생성된 오브젝트들을 반환함.
 */
export function drawSliceSkin(
  scene: Phaser.Scene,
  skin: SliceSkinConfig,
  startX: number,
  endX: number,
  surfaceY: number,
  depth: number,
): Phaser.GameObjects.GameObject[] {
  const topY = surfaceY - skin.surfaceInset;
  const span = endX - startX;
  const created: Phaser.GameObjects.GameObject[] = [];

  const add = (obj: Phaser.GameObjects.Components.Depth) => {
    obj.setDepth(depth);
    created.push(obj as unknown as Phaser.GameObjects.GameObject);
    return obj;
  };

  // 구간이 두 캡을 전체 너비로 담기엔 너무 좁으면 캡이 줄어들어 맞춰짐.
  const capWidth = Math.min(
    skin.left.width,
    Math.max(0, span - skin.right.width),
  );
  const rightWidth = Math.min(skin.right.width, Math.max(0, span - capWidth));

  const drawCaps = () => {
    add(
      scene.add
        .image(startX, topY, skin.left.key)
        .setOrigin(0, 0)
        .setDisplaySize(capWidth, skin.height),
    );
    add(
      scene.add
        .image(endX - rightWidth, topY, skin.right.key)
        .setOrigin(0, 0)
        .setDisplaySize(rightWidth, skin.height),
    );
  };

  const drawMiddle = (x0: number, x1: number) => {
    const width = x1 - x0;
    if (width <= 0) {
      return;
    }
    if (skin.middleFit === 'tile') {
      // 중앙의 균일한 내부만 타일링(장식적인 옆 가장자리는 잘라냄).
      // 그래서 반복이 이음새 없이 맞물림 — 원본 크기에서 선명함.
      add(
        scene.add
          .tileSprite(
            x0,
            topY,
            width,
            skin.height,
            skin.middle.key,
            tileableMiddleFrame(scene, skin),
          )
          .setOrigin(0, 0),
      );
    } else {
      add(
        scene.add
          .image(x0, topY, skin.middle.key)
          .setOrigin(0, 0)
          .setDisplaySize(width, skin.height),
      );
    }
  };

  if (skin.capInset) {
    // 캡을 뒤에 두고, 중앙을 그 안쪽 접합부 위에 그림(캡의 바깥 끝은
    // 여전히 보임). 그래서 캡→중앙 이음새가 없음.
    drawCaps();
    drawMiddle(startX + skin.capInset.left, endX - skin.capInset.right);
  } else {
    // 중앙을 뒤에서 전체 너비로 펼치고, 캡을 그 양 끝 위에 올림.
    drawMiddle(startX, endX);
    drawCaps();
  }

  return created;
}
