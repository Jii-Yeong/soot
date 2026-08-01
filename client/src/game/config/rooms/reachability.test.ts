import { describe, expect, it } from 'vitest';
import { PLAYER_COMBAT_CONFIG } from '@/game/config/combatConfig';
import { GAME_HEIGHT } from '@/game/config/gameDimensions';
import {
  MovementMode,
  PLAYER_FLIGHT_BOUNDS,
} from '@/game/config/playerMovementConfig';
import type { RoomConfig, TerrainPiece } from '@/game/config/roomConfig';
import { STAGES } from '@/game/config/stageConfig';
import { FLOOR_SURFACE_Y } from '@/game/systems/FloorBuilder';

/**
 * Level geometry has to be checked against what the player can actually do, not
 * eyeballed. Every number below is derived from PLAYER_COMBAT_CONFIG and the
 * world gravity, so changing the jump re-derives the limits instead of silently
 * stranding a ledge.
 */
const GRAVITY_Y = 1200;
const { jumpSpeed, moveSpeed, dash } = PLAYER_COMBAT_CONFIG;

/** Peak height of a full jump: v^2 / 2g. */
const MAX_JUMP_HEIGHT = (jumpSpeed * jumpSpeed) / (2 * GRAVITY_Y);
/** Horizontal travel across a full jump arc that lands at the take-off height. */
const MAX_JUMP_DISTANCE = moveSpeed * ((2 * jumpSpeed) / GRAVITY_Y);
/** A dash holds its speed with gravity disabled, so it adds flat distance. */
const DASH_DISTANCE = dash.speed * (dash.duration / 1000);
/** Comfortable and skill-check gaps. A required gap should stay under SAFE. */
const SAFE_GAP = MAX_JUMP_DISTANCE * 0.7;
const HARD_GAP = MAX_JUMP_DISTANCE * 0.95;

/**
 * Seconds spent rising to `climb`, from `climb = v*t - g*t^2/2`. Undefined once
 * the height is past the apex, which the caller rules out first.
 */
function timeToRise(climb: number) {
  const discriminant = jumpSpeed * jumpSpeed - 2 * GRAVITY_Y * climb;
  return (jumpSpeed - Math.sqrt(Math.max(0, discriminant))) / GRAVITY_Y;
}

/**
 * How far sideways the player can travel while still arriving at `climb`.
 * The dash holds its speed with gravity disabled, so it adds flat distance on
 * top of whatever the jump arc covers.
 */
function horizontalReachAt(climb: number) {
  return moveSpeed * timeToRise(climb) + DASH_DISTANCE;
}

type Surface = { label: string; top: number; left: number; right: number };

function surfacesOf(room: RoomConfig): Surface[] {
  const platforms = (room.terrain ?? []).map((piece, index) => ({
    label: `${piece.type}#${index}`,
    top: piece.y,
    left: piece.x,
    right: piece.x + piece.width,
  }));

  return [
    { label: 'floor', top: FLOOR_SURFACE_Y, left: 0, right: room.worldWidth },
    ...platforms,
  ];
}

/** True when one jump from `source` can land on `target`. */
function canHop(source: Surface, target: Surface) {
  if (source === target || source.top <= target.top) {
    return false;
  }

  const climb = source.top - target.top;

  if (climb > MAX_JUMP_HEIGHT) {
    return false;
  }

  const overlap =
    Math.min(source.right, target.right) - Math.max(source.left, target.left);
  const gap =
    overlap >= 0
      ? 0
      : Math.min(
          Math.abs(target.left - source.right),
          Math.abs(source.left - target.right),
        );

  return gap <= horizontalReachAt(climb);
}

/**
 * Reachability has to spread out from the floor, not be judged one hop at a
 * time. A ledge that is only steppable from another stranded ledge is stranded
 * too, and a per-pair check happily calls both of them fine.
 */
function reachableFromFloor(surfaces: Surface[]) {
  const floor = surfaces.find((surface) => surface.label === 'floor')!;
  const reached = new Set<Surface>([floor]);
  let grew = true;

  while (grew) {
    grew = false;
    for (const target of surfaces) {
      if (reached.has(target)) continue;
      for (const source of reached) {
        if (canHop(source, target)) {
          reached.add(target);
          grew = true;
          break;
        }
      }
    }
  }

  return reached;
}


function combatRooms() {
  return STAGES.flatMap((stage) =>
    stage.rooms
      .filter((room) => room.kind === 'combat')
      .map((room) => ({ stage: stage.id, room })),
  );
}

describe('level geometry against player metrics', () => {
  it('reports the metrics every dimension is derived from', () => {
    expect(MAX_JUMP_HEIGHT).toBeGreaterThan(0);
    console.log(
      [
        `  최대 점프 높이  ${MAX_JUMP_HEIGHT.toFixed(1)} px`,
        `  최대 점프 거리  ${MAX_JUMP_DISTANCE.toFixed(1)} px`,
        `  대시 거리       ${DASH_DISTANCE.toFixed(1)} px`,
        `  안전 간격       ${SAFE_GAP.toFixed(1)} px (거리의 70%)`,
        `  한계 간격       ${HARD_GAP.toFixed(1)} px (거리의 95%)`,
        `  바닥 표면       y=${FLOOR_SURFACE_Y}`,
      ].join('\n'),
    );
  });

  it('leaves every platform reachable', () => {
    const stranded: string[] = [];

    for (const { stage, room } of combatRooms()) {
      const surfaces = surfacesOf(room);
      const reached = reachableFromFloor(surfaces);

      for (const surface of surfaces) {
        if (surface.label === 'floor') continue;
        const ok = reached.has(surface);
        console.log(
          `  ${stage}/${room.id} ${surface.label.padEnd(12)} top=${surface.top} x=${surface.left}~${surface.right}  바닥에서 ${(FLOOR_SURFACE_Y - surface.top).toFixed(0)}px  ${ok ? 'OK' : '닿지 않음'}`,
        );
        if (!ok) {
          stranded.push(`${stage}/${room.id} ${surface.label} top=${surface.top}`);
        }
      }
    }

    if (stranded.length > 0) {
      console.log(`  닿지 않는 지형\n    ${stranded.join('\n    ')}`);
    }

    expect(stranded).toEqual([]);
  });

  it('reaches every platform without standing on a wall', () => {
    // Walls are dumpsters: things to clear, not stairs. They are short enough
    // to stand on, so a platform out of the floor's reach can quietly end up
    // depending on one — which is how alley-01's second perch came to need a
    // 350px detour forward to a dumpster and a jump back to reach it.
    const wallDependent: string[] = [];

    for (const { stage, room } of combatRooms()) {
      const withoutWalls = surfacesOf(room).filter(
        (surface) => !surface.label.startsWith('wall'),
      );
      const reached = reachableFromFloor(withoutWalls);

      for (const surface of withoutWalls) {
        if (surface.label === 'floor' || reached.has(surface)) continue;
        wallDependent.push(`${stage}/${room.id} ${surface.label} top=${surface.top}`);
      }
    }

    if (wallDependent.length > 0) {
      console.log(`  벽을 밟아야만 닿는 지형\n    ${wallDependent.join('\n    ')}`);
    }

    expect(wallDependent).toEqual([]);
  });

  it('keeps every pit crossable', () => {
    const problems: string[] = [];

    for (const { stage, room } of combatRooms()) {
      for (const pit of room.pits ?? []) {
        if (pit.width > MAX_JUMP_DISTANCE + DASH_DISTANCE) {
          problems.push(`${stage}/${room.id} 구덩이 ${pit.width}px 건널 수 없음`);
        } else if (pit.width > HARD_GAP) {
          console.log(
            `  ${stage}/${room.id} 구덩이 ${pit.width}px — 한계 간격 ${HARD_GAP.toFixed(0)} 초과, 대시 필요`,
          );
        }
      }
    }

    expect(problems).toEqual([]);
  });

  it('keeps every wall passable', () => {
    const problems: string[] = [];

    for (const { stage, room } of combatRooms()) {
      for (const piece of room.terrain ?? []) {
        if (piece.type !== 'wall') continue;
        const climb = FLOOR_SURFACE_Y - piece.y;
        if (climb > MAX_JUMP_HEIGHT) {
          problems.push(
            `${stage}/${room.id} 벽 상단 y=${piece.y} — 바닥에서 ${climb.toFixed(0)}px, 점프 ${MAX_JUMP_HEIGHT.toFixed(0)}px로 못 넘음`,
          );
        }
      }
    }

    if (problems.length > 0) {
      console.log(`  넘을 수 없는 벽\n    ${problems.join('\n    ')}`);
    }

    expect(problems).toEqual([]);
  });

  it('leaves sky above everything that has to be jumped', () => {
    // Clearing a barrier or a gap costs a full jump — there is one jump speed,
    // so the player rises 130.7px whether they need it or not. A ledge low
    // enough to be in the way turns an ordinary hop into a headbutt, and the
    // player has no way to jump less.
    const PLAYER_BODY_HEIGHT = 76;
    const blocked: string[] = [];

    for (const { stage, room } of combatRooms()) {
      const ledges = (room.terrain ?? []).filter(
        (piece) => piece.type === 'platform',
      );
      // Highest the player's head reaches on a floor-level jump.
      const headAtApex =
        FLOOR_SURFACE_Y - MAX_JUMP_HEIGHT - PLAYER_BODY_HEIGHT;

      const obstacles: { label: string; left: number; right: number }[] = [
        ...(room.pits ?? []).map((pit, index) => ({
          label: `구덩이#${index}`,
          left: pit.x,
          right: pit.x + pit.width,
        })),
        ...(room.terrain ?? [])
          .map((piece, index) => ({ piece, index }))
          .filter(({ piece }) => piece.type === 'wall')
          .map(({ piece, index }) => ({
            label: `벽#${index}`,
            left: piece.x,
            right: piece.x + piece.width,
          })),
      ];

      for (const obstacle of obstacles) {
        for (const ledge of ledges) {
          const underside = ledge.y + ledge.height;
          if (underside <= headAtApex) continue;
          const overlaps =
            ledge.x < obstacle.right && ledge.x + ledge.width > obstacle.left;
          if (overlaps) {
            blocked.push(
              `${stage}/${room.id} ${obstacle.label} 위에 발판 밑면 y=${underside} (머리 y=${headAtApex.toFixed(0)})`,
            );
          }
        }
      }
    }

    if (blocked.length > 0) {
      console.log(`  점프 경로가 막힌 곳\n    ${blocked.join('\n    ')}`);
    }

    expect(blocked).toEqual([]);
  });

  it('introduces each enemy type on its own before combining them', () => {
    // Every hazard meets the player somewhere it can be read before it meets
    // them somewhere it can kill. The first room used to open with all three
    // types inside 500px, which teaches that enemies exist and nothing else.
    const firstRoom = STAGES[0].rooms.find((room) => room.kind === 'combat')!;
    const order = [...firstRoom.enemySpawns]
      .sort((first, second) => first.x - second.x)
      .map((spawn) => spawn.type);

    const introducedAt = new Map<string, number>();
    order.forEach((type, index) => {
      if (!introducedAt.has(type)) introducedAt.set(type, index);
    });

    // Nothing new arrives while the previous type is still being introduced:
    // each type gets at least one encounter to itself.
    const introductions = [...introducedAt.values()].sort((a, b) => a - b);
    for (let index = 1; index < introductions.length; index += 1) {
      expect(
        introductions[index] - introductions[index - 1],
        `${order[introductions[index]]} arrives before the previous type has been met alone`,
      ).toBeGreaterThanOrEqual(2);
    }

    // And the one the ground cannot answer comes last.
    expect(order[order.length - 1]).toBe('flying');
  });

  it('keeps a flight stage inside the band the player can fly', () => {
    // The one stage the player flies has no floor to stand on and no jump to
    // measure, so its geometry is the box the flight controller clamps them to.
    // An enemy outside it — or one whose own patrol drifts outside it — is one
    // the player can be shot by and cannot answer.
    const { minY, maxY } = PLAYER_FLIGHT_BOUNDS;
    const outOfReach: string[] = [];
    const bandUse: string[] = [];

    for (const stage of STAGES) {
      if (stage.movementMode !== MovementMode.FLIGHT) continue;

      for (const room of stage.rooms.filter(({ kind }) => kind === 'combat')) {
        const heights: number[] = [];

        for (const spawn of room.enemySpawns) {
          if (spawn.type !== 'flying') continue;
          heights.push(spawn.y);
          // A patrol or orbit swings this far either side of where it starts.
          const swing = spawn.movement?.rangeY ?? 0;
          if (spawn.y - swing < minY || spawn.y + swing > maxY) {
            outOfReach.push(
              `${stage.id}/${room.id} y=${spawn.y}±${swing} — 비행 범위 ${minY}~${maxY} 밖`,
            );
          }
        }

        // Placement that clusters in the middle leaves the ceiling and the
        // floor as free parking, which is the whole stage's difficulty.
        const spread = Math.max(...heights) - Math.min(...heights);
        const share = spread / (maxY - minY);
        bandUse.push(
          `  ${stage.id}/${room.id} y ${Math.min(...heights)}~${Math.max(...heights)} — 비행 범위의 ${(share * 100).toFixed(0)}%`,
        );
        expect(
          share,
          `${room.id} uses only ${(share * 100).toFixed(0)}% of the flight band`,
        ).toBeGreaterThan(0.65);
      }
    }

    console.log(bandUse.join('\n'));

    if (outOfReach.length > 0) {
      console.log(`  사거리 밖 스폰\n    ${outOfReach.join('\n    ')}`);
    }

    expect(outOfReach).toEqual([]);
  });

  it('leaves a flight stage free of terrain', () => {
    // Solid geometry needs a jump to escape and flight mode has none, so a
    // player pushed into a corner by a tracking enemy would have no way out.
    for (const stage of STAGES) {
      if (stage.movementMode !== MovementMode.FLIGHT) continue;

      for (const room of stage.rooms) {
        expect(room.terrain ?? [], `${room.id} has terrain`).toHaveLength(0);
        expect(room.pits ?? [], `${room.id} has pits`).toHaveLength(0);
      }
    }
  });

  it('does not spawn a ground enemy over a pit', () => {
    // A ground enemy standing where there is no floor falls out of the room the
    // moment it is created. Easy to do by eye and invisible until someone plays
    // the room — three of these were nearly authored while laying out stages 3
    // and 4, because the pits go in after the enemies and nothing complained.
    const floating: string[] = [];

    for (const { stage, room } of combatRooms()) {
      for (const spawn of room.enemySpawns) {
        if (spawn.type === 'flying' || spawn.type === 'boss') continue;
        for (const pit of room.pits ?? []) {
          if (spawn.x >= pit.x && spawn.x <= pit.x + pit.width) {
            floating.push(
              `${stage}/${room.id} ${spawn.type} x=${spawn.x} — 구덩이 ${pit.x}~${pit.x + pit.width}`,
            );
          }
        }
      }
    }

    if (floating.length > 0) {
      console.log(`  바닥 없는 곳의 스폰\n    ${floating.join('\n    ')}`);
    }

    expect(floating).toEqual([]);
  });

  it('does not bury a ground spawn inside terrain', () => {
    const buried: string[] = [];

    for (const { stage, room } of combatRooms()) {
      for (const spawn of room.enemySpawns) {
        if (spawn.type === 'boss') continue;
        const inside = (room.terrain ?? []).some(
          (piece: TerrainPiece) =>
            spawn.x >= piece.x &&
            spawn.x <= piece.x + piece.width &&
            spawn.y >= piece.y &&
            spawn.y <= piece.y + piece.height,
        );
        if (inside) {
          buried.push(`${stage}/${room.id} ${spawn.type} (${spawn.x}, ${spawn.y})`);
        }
      }
    }

    if (buried.length > 0) {
      console.log(`  지형에 파묻힌 스폰\n    ${buried.join('\n    ')}`);
    }

    expect(buried).toEqual([]);
  });

  it('keeps every spawn inside its room', () => {
    const outside: string[] = [];

    for (const { stage, room } of combatRooms()) {
      for (const spawn of room.enemySpawns) {
        if (spawn.x < 0 || spawn.x > room.worldWidth || spawn.y > GAME_HEIGHT) {
          outside.push(`${stage}/${room.id} ${spawn.type} (${spawn.x}, ${spawn.y})`);
        }
      }
    }

    expect(outside).toEqual([]);
  });

  it('surveys how continuous each tier is', () => {
    for (const { stage, room } of combatRooms()) {
      const byTier = new Map<number, Surface[]>();
      for (const surface of surfacesOf(room)) {
        if (surface.label === 'floor') continue;
        byTier.set(surface.top, [...(byTier.get(surface.top) ?? []), surface]);
      }

      for (const [top, tier] of [...byTier].sort((a, b) => b[0] - a[0])) {
        const sorted = [...tier].sort((a, b) => a.left - b.left);
        const gaps = sorted
          .slice(1)
          .map((piece, index) => piece.left - sorted[index].right);
        const worst = gaps.length > 0 ? Math.max(...gaps) : 0;
        const verdict =
          worst === 0
            ? '연속'
            : worst <= SAFE_GAP
              ? '점프로 이어짐'
              : worst <= MAX_JUMP_DISTANCE + DASH_DISTANCE
                ? '대시 필요'
                : '끊김 (바닥으로 내려가야 함)';
        console.log(
          `  ${stage}/${room.id} y=${top}  조각 ${sorted.length}개  최대 간격 ${worst}px  → ${verdict}`,
        );
      }
    }

    expect(true).toBe(true);
  });
});
