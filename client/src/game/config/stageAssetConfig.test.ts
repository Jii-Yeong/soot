import { describe, expect, it } from 'vitest';
import {
  STAGE_ONE_CONFIG,
  STAGE_FOUR_CONFIG,
  STAGE_THREE_CONFIG,
  STAGE_TWO_CONFIG,
} from '@/game/config/stageConfig';
import { getStageAssetManifest } from '@/game/config/stageAssetConfig';

describe('stage asset manifests', () => {
  it('groups enemy atlases and terrain images by owning stage', () => {
    const stageOne = getStageAssetManifest(STAGE_ONE_CONFIG);
    const stageTwo = getStageAssetManifest(STAGE_TWO_CONFIG);

    expect(stageOne.enemyAtlases.map(({ texture }) => texture)).toEqual([
      'stage-1-flying',
      'stage-1-ranged',
      'stage-1-neared',
    ]);
    expect(stageTwo.enemyAtlases.map(({ texture }) => texture)).toEqual([
      'stage-2-flying',
      'stage-2-ranged',
      'stage-2-neared',
    ]);
    expect(stageTwo.terrainImages.map(({ key }) => key)).toEqual([
      'stage-2-floor-left',
      'stage-2-floor-middle',
      'stage-2-floor-right',
      'stage-2-stool-left',
      'stage-2-stool-middle',
      'stage-2-stool-right',
    ]);
  });

  it('includes the stage-specific ceiling crawler and captor atlases', () => {
    expect(getStageAssetManifest(STAGE_THREE_CONFIG)).toEqual({
      enemyAtlases: [
        expect.objectContaining({ texture: 'stage-3-flying' }),
        expect.objectContaining({ texture: 'stage-3-ranged' }),
        expect.objectContaining({ texture: 'stage-3-neared' }),
      ],
      terrainImages: [
        expect.objectContaining({ key: 'stage-3-floor-left' }),
        expect.objectContaining({ key: 'stage-3-floor-middle' }),
        expect.objectContaining({ key: 'stage-3-floor-right' }),
        expect.objectContaining({ key: 'stage-3-stool-left' }),
        expect.objectContaining({ key: 'stage-3-stool-middle' }),
        expect.objectContaining({ key: 'stage-3-stool-right' }),
        expect.objectContaining({ key: 'stage-3-pipe-left' }),
        expect.objectContaining({ key: 'stage-3-pipe-middle' }),
        expect.objectContaining({ key: 'stage-3-pipe-right' }),
      ],
    });
  });

  it('includes the stage four executioner doll atlas', () => {
    expect(getStageAssetManifest(STAGE_FOUR_CONFIG).enemyAtlases).toEqual([
      expect.objectContaining({ texture: 'stage-4-takedown' }),
    ]);
  });

  it('reuses the resolved manifest for repeated room transitions', () => {
    expect(getStageAssetManifest(STAGE_TWO_CONFIG)).toBe(
      getStageAssetManifest(STAGE_TWO_CONFIG),
    );
  });
});
