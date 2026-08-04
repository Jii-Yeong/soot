# Stage-Specific Projectile-Cover Layout Redesign

**Status:** Approved for implementation  
**Date:** 2026-08-04

## Objective

Make the five stages feel spatially distinct while extending the short later rooms. Added space must carry intentional combat rhythm rather than empty walking. Short one-way platforms become projectile-blocking cover beats: the player may pass below or stand above them, but both player and enemy bullets are blocked until the player exposes an angle at an edge.

## Locked Systems

- Enemy and boss behavior and attack patterns.
- Player movement and flight behavior.
- Projectile and pit behavior.
- Background assets and rendering.
- Boss-room dimensions.

## Combat Room Widths

| Stage | Width | Spatial Purpose |
| --- | ---: | --- |
| 1 | 3657 px | Compact introduction |
| 2 | 4000 px | Longer separated alley clusters |
| 3 | 4300 px | Extended catwalk pressure |
| 4 | 4600 px | Broad collapse and vertical fracture |
| 5 | 4200 px | Wider aerial formation spacing |

Background images remain independent from room width. The backdrop system maps image travel to camera travel, while procedural layers derive their rendered width from the active room.

## Projectile-Cover Beat

A cover beat is a lower-intensity encounter, not an empty safe room or healing area.

- Use an accessible low platform approximately 180-240 px wide.
- Keep the platform 100-116 px above the floor so it is comfortably reachable below the 130.7 px jump maximum.
- Place a single flying or ranged threat across the platform's vertical firing line.
- Force the player to leave the covered line at an edge before returning fire.
- Do not place a grounded enemy beneath the platform.
- Do not join cover platforms into a continuous projectile roof.
- Keep the platform and demonstrating enemy inside the same camera window.

Stage 1 room 2 introduces the rule with a late flier above a short platform. Stages 3 and 4 develop and test it through different spatial forms.

## Stage Identities

### Stage 1: Open City Lesson

Keep the existing compact length, open floor, and sparse two-tier terraces. Shorten the room-2 flier platform to the cover-beat range so projectile blocking is demonstrated without adding a new mechanic or tutorial overlay.

### Stage 2: Separated Fire Escapes

Extend both combat rooms to 4000 px. Preserve the fire-escape silhouette and isolated pit lesson, but move the final cluster and its paired ledges into the added distance. The room remains a sequence of alley pockets rather than a repeated catwalk.

### Stage 3: Catwalk Pressure

Extend both rooms to 4300 px. Keep four short pit bridges per room and add exactly one short cover platform on solid ground. Room 2 retains two optional upper ledges and separates its opening four threats from its late five-threat sequence by 300-400 px measured from actual enemy activation positions.

### Stage 4 Room 1: Cover Islands

Extend the room to 4600 px. Use three isolated low cover platforms across broad ground sections, one optional mid ledge, and three asymmetric pits. The silhouette must read as open collapse rather than a horizontal fence.

### Stage 4 Room 2: Vertical Fracture

Extend the room to 4600 px. Concentrate three low and three mid platforms into separated stacks, with one third-tier platform in the centre. The player changes vertical side to block shots; no high route continues across the room.

### Stage 5: Formation Space

Extend both rooms to 4200 px and distribute the existing aerial formations across the extra width. Stage 5 remains entirely free of platforms, walls, and pits.

## Fairness Invariants

- Mandatory traversal remains within current movement metrics.
- Every platform is reachable without using a wall.
- Positive same-tier gaps are at least 96 px.
- Pits remain no wider than 200 px.
- No grounded enemy spawns over a pit or inside terrain.
- A grounded enemy and its full patrol do not enter deep projectile cover more than 96 px from an exposed platform edge.
- A cover beat contains no grounded enemy beneath its cover platform.
- Adjacent Stage 4 threats spawn at least 100 px apart.
- Every combat room leaves at least 400 px between its last spawn and exit.

## Verification

- Stage-specific Vitest assertions for widths, silhouettes, cover demonstrations, activation spacing, and patrol exposure.
- Shared reachability and terrain-placement tests.
- Full client test suite, lint, and production build.
- User-owned browser playtest for cover readability, firing angles, pacing, and perceived stage length.
