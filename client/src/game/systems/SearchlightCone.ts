import Phaser from 'phaser';

type Point = { x: number; y: number };

/** The number of arc points used to approximate the fan's outer edge. */
const ARC_STEPS = 20;

/**
 * Draws the hound's red searchlight fan as a translucent wedge. `intensity`
 * (0-1) brightens it as the hound locks on, so the fill doubles as the
 * fire warning.
 *
 * Each downward ray is clamped at the floor so the fan never dips below ground
 * — a searchlight raking the surface, not an x-ray. (A geometry mask was tried
 * for sprite-generality but did not clip reliably under the scrolling camera.)
 */
export class SearchlightCone {
  private readonly gfx: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    private readonly color: number,
  ) {
    // Above terrain and the player so the cast light reads as an overlay,
    // kept translucent so nothing it covers is hidden.
    this.gfx = scene.add.graphics().setDepth(9);
  }

  draw(
    apex: Point,
    centerAngle: number,
    halfAngle: number,
    range: number,
    intensity: number,
    floorY: number,
  ) {
    const points: Point[] = [apex];
    for (let i = 0; i <= ARC_STEPS; i += 1) {
      const angle = centerAngle - halfAngle + 2 * halfAngle * (i / ARC_STEPS);
      const sin = Math.sin(angle);
      let rayRange = range;
      if (sin > 1e-4 && apex.y < floorY) {
        rayRange = Math.min(range, (floorY - apex.y) / sin);
      }
      points.push({
        x: apex.x + Math.cos(angle) * rayRange,
        y: apex.y + Math.sin(angle) * rayRange,
      });
    }

    // fillPoints/strokePoints only read x/y, so plain points work at runtime.
    const polygon = points as unknown as Phaser.Math.Vector2[];
    this.gfx
      .clear()
      .fillStyle(this.color, 0.12 + intensity * 0.34)
      .fillPoints(polygon, true)
      .lineStyle(2, this.color, 0.4 + intensity * 0.5)
      .strokePoints(polygon, true);
  }

  hide() {
    this.gfx.clear();
  }

  destroy() {
    this.gfx.destroy();
  }
}
