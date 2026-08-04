# Concept-Driven Combat Room Layout Redesign

**Status:** Approved for implementation  
**Date:** 2026-08-04

## Objective

Refine the combat-room layouts that currently conflict with the game's stage concepts or produce awkward combat geometry. The pass must improve spatial identity and encounter rhythm without changing the established movement, enemy, boss, projectile, or pit systems.

The intended campaign curve is:

> Comfort -> Caution -> Pressure -> Collapse -> Liberated Madness

## Sources of Truth

The following sources apply in descending order of precedence:

1. Existing enemy and boss concepts, attack patterns, movement, collision, projectile, and pit behavior remain locked.
2. The game concept document defines each stage's emotional and spatial identity.
3. `docs/level-design-rules.md` and the current player movement metrics define fairness constraints.
4. Whole-room overview captures are used to compare silhouette, cadence, and encounter spacing.

## Scope

This pass may change only:

- Platform position, height, width, and count.
- Pit position and width while preserving current pit behavior.
- Enemy position and count while preserving every enemy type's existing behavior and attack pattern.

The pass targets only rooms with a clear design problem:

- `underground-02`: refine encounter spacing around the corrected catwalk layout.
- `inferno-01`: replace the repeated picket-fence rhythm with an asymmetric but readable test.
- `inferno-02`: create a distinct, more unstable final standard room without overloading the player.

Stage 1, Stage 2, `underground-01`, Stage 5, and all boss rooms remain unchanged in this pass.

## Non-Goals

- No enemy or boss AI changes.
- No attack, projectile, damage, health, or aggression changes.
- No player movement or flight changes.
- No pit behavior changes.
- No background, tile art, visual-effect, or audio changes.
- No authored vertical walls.
- No requirement to make every stage or room deliberately uncomfortable.

## Stage Experience Curve

| Stage | Emotional Role | Spatial Treatment |
| --- | --- | --- |
| 1 | Comfort and absence | Clear ground, generous recovery, basic readable encounters |
| 2 | Familiarity becoming unsafe | Familiar routes with restrained caution and isolated pit lessons |
| 3 | Confinement and pressure | Short catwalk choices, compressed mixed encounters, open drop lanes |
| 4 | Collapse and distortion | Asymmetric platform groups, broken cadence, stronger spatial instability with fair recovery |
| 5 | Liberated madness | Unrestricted flight space with pressure carried by aerial formations rather than terrain |

## Room Designs

### `underground-02`: Compressed Pressure

The current four short pit bridges, two optional upper ledges, and open drop lanes remain the geometric foundation. They already prevent the continuous projectile roof that previously made ground enemies unreachable.

Enemy placement is reorganized into two readable pressure phases:

1. An early four-threat sequence introduces the room's mixed roles without activating the entire room at once.
2. A recovery lane of approximately 300-400 px separates the opening sequence from a five-threat late-room peak.

The late cluster may retain the current total of nine enemies, but coordinates must avoid stacking multiple grounded enemies beneath the same projectile-blocking platform. The room must finish with at least 400 px of clear approach before the exit or boss transition. Geometry changes are allowed only when required to preserve open firing angles or readable cluster separation.

### `inferno-01`: Broken but Readable

Replace the six evenly spaced low platforms and five repeated pits with asymmetric platform groups. The room should alternate between:

- A stable floor reset where the player can read the next threat.
- A short traversal test using one pit or one height change.
- A mixed encounter that reuses learned enemy roles.

Platform widths and gaps should vary enough that the silhouette no longer reads as a regular fence, while all mandatory jumps remain within the safe movement range. Pits may vary in position and width but must not exceed 200 px.

Retain eight enemies unless testing reveals unavoidable overlap. Re-space them into three encounter clusters with distinct entry, middle, and late beats. The final cluster must end before the 400 px exit approach, and no enemy may be placed over a pit or trapped beneath a firing-blocking platform.

### `inferno-02`: Distorted Overlap

This room must not repeat `inferno-01` with only more enemies. Use irregularly staggered low and high platforms to produce two optional height levels and a broken horizontal cadence. The upper route is a tactical option, not a mandatory precision route or a continuous safe lane.

All high platforms must be reachable through a lower platform or a safe jump. Pits must remain individually readable, crossable, and no wider than 200 px. Open floor sections must interrupt platform coverage so grounded combat cannot become an exchange through an opaque ceiling.

The current count of eleven enemies may be reduced to ten when spatial pressure and enemy density overlap. If one enemy is removed, remove one duplicate opening melee threat; do not alter any enemy type's behavior. Organize the room into an opening read, a sustained middle peak, and a final controlled release with at least 400 px of clear exit approach.

## Fairness Invariants

Every changed room must satisfy all of the following:

- Mandatory traversal stays within the current movement metrics: 196 px safe jump gaps by default and no required gap over 266 px.
- Stage 4 pits are no wider than 200 px.
- Every authored platform is reachable, and high platforms have an obvious lower approach.
- Positive gaps between platforms on the same tier are at least 96 px, preserving readable drop lanes.
- A grounded enemy covered by a platform is no farther than 96 px from an exposed platform edge.
- No grounded enemy spawns over a pit or inside terrain.
- No continuous projectile-blocking roof covers a grounded encounter cluster.
- No authored `wall` terrain is introduced.
- Stage 5 remains free of platforms, walls, and pits.
- Every standard room retains at least 400 px of safe approach before its exit or boss transition.

## Verification Strategy

Implementation starts with stage-specific tests that encode the approved room distinctions and fairness constraints. Verification then proceeds through:

1. Targeted Stage 3 and Stage 4 room tests.
2. Shared reachability and terrain-placement tests.
3. Full client test suite.
4. Client lint and production build.
5. Regenerated whole-room overview captures for before-and-after comparison.
6. User-owned browser playtest focused on Stage 3 encounter separation, Stage 4 room differentiation, traversal fairness, firing angles, and recovery space.

## Iteration Boundary

Each room remains an independent data configuration. Playtest feedback should be addressed by adjusting platform, pit, and enemy coordinates or enemy count inside the affected room. Changes outside the locked scope require a new explicit decision.
