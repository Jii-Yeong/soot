type Point = {
  x: number;
  y: number;
};

export const isPointInsideLaser = (
  start: Point,
  angle: number,
  range: number,
  width: number,
  point: Point,
  pointRadius = 0,
) => {
  const endX = start.x + Math.cos(angle) * range;
  const endY = start.y + Math.sin(angle) * range;
  const segmentX = endX - start.x;
  const segmentY = endY - start.y;
  const segmentLengthSquared = segmentX ** 2 + segmentY ** 2;

  if (segmentLengthSquared === 0) {
    return false;
  }

  const projection = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * segmentX +
        (point.y - start.y) * segmentY) /
        segmentLengthSquared,
    ),
  );
  const nearestX = start.x + segmentX * projection;
  const nearestY = start.y + segmentY * projection;
  const hitRadius = width / 2 + pointRadius;

  return (
    (point.x - nearestX) ** 2 + (point.y - nearestY) ** 2 <= hitRadius ** 2
  );
};
