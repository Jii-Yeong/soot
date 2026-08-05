# Stage-Specific Projectile-Cover Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand later combat rooms and give each stage a distinct 2D platforming silhouette built around short projectile-blocking cover beats.

**Architecture:** Keep behavior unchanged and express the redesign through existing room data. Add stage-specific tests before coordinates, then use the shared reachability suite to validate the full campaign.

**Tech Stack:** TypeScript, Vitest, Phaser room configuration data, pnpm

---

### Task 1: Lock stage lengths and the cover lesson

**Files:**
- Modify: `client/src/game/config/enemySpawnConfig.test.ts`
- Modify: `client/src/game/config/rooms/stageOneRooms.test.ts`
- Modify: `client/src/game/config/rooms/stageOneRooms.ts`

- [x] Assert combat widths of 3657, 4000, 5200, 6000, and 4200 px by stage.
- [x] Assert Stage 1 room 2 contains an accessible 180-240 px platform beneath its flier.
- [x] Verify the tests fail against the previous uniform room widths and 250 px platform.
- [x] Shorten the Stage 1 cover platform to 240 px.

### Task 2: Extend Stage 2 without changing its fire-escape identity

**Files:**
- Modify: `client/src/game/config/rooms/stageTwoRooms.ts`
- Test: `client/src/game/config/rooms/stageTwoRooms.test.ts`

- [x] Set both combat rooms to 4000 px.
- [x] Move each final cluster and paired ledges into the added room distance.
- [x] Preserve isolated pit introduction, entry activation spacing, and boss approach.

### Task 3: Rebuild Stage 3 as catwalk pressure plus cover

**Files:**
- Modify: `client/src/game/config/rooms/stageThreeRooms.test.ts`
- Modify: `client/src/game/config/rooms/stageThreeRooms.ts`

- [x] Move the catwalk tier to 116 px above the floor.
- [x] Keep four pit bridges and add one 220 px solid-ground cover platform per room.
- [x] Place a flying enemy above each cover platform and no grounded enemy beneath it.
- [x] Keep two upper ledges in room 2.
- [x] Verify room 2's phase gap using type-specific activation radii.

### Task 4: Split Stage 4 into two different spatial forms

**Files:**
- Modify: `client/src/game/config/rooms/stageFourRooms.test.ts`
- Modify: `client/src/game/config/rooms/stageFourRooms.ts`

- [x] Build room 1 from four low cover islands, two optional mid ledges, and four asymmetric pits.
- [x] Build room 2 from four low, four mid, and one high platform with four pits.
- [x] Place a cover-demonstrating flier in each room.
- [x] Verify enemy spacing, pit width, exit approach, and full ground-patrol exposure.

### Task 5: Extend Stage 5 formations

**Files:**
- Modify: `client/src/game/config/rooms/stageFiveRooms.ts`
- Test: `client/src/game/config/rooms/reachability.test.ts`

- [x] Set both combat rooms to 4200 px.
- [x] Spread existing formations through the added width.
- [x] Preserve the full vertical flight-band usage and terrain-free invariant.

### Task 6: Verify and commit

**Files:**
- Modify: `docs/superpowers/specs/2026-08-04-concept-driven-level-layout-design.md`
- Create: `docs/superpowers/plans/2026-08-04-concept-driven-level-layout-implementation.md`

- [x] Run targeted room and reachability tests.
- [x] Run the full client test suite.
- [x] Run client lint and production build.
- [x] Inspect the final diff and complete code review.
- [x] Commit with `feat(level-design): 스테이지별 엄폐 전투 공간 재구성`.

### Task 7: Increase late-stage duration and aerial motion

**Files:**
- Modify: `client/src/game/config/aerialMovementConfig.ts`
- Modify: `client/src/game/config/enemySpawnConfig.test.ts`
- Modify: `client/src/game/config/stageConfig.test.ts`
- Modify: `client/src/game/config/rooms/stageOneRooms.ts`
- Modify: `client/src/game/config/rooms/stageTwoRooms.ts`
- Modify: `client/src/game/config/rooms/stageThreeRooms.ts`
- Modify: `client/src/game/config/rooms/stageThreeRooms.test.ts`
- Modify: `client/src/game/config/rooms/stageFourRooms.ts`
- Modify: `client/src/game/config/rooms/stageFourRooms.test.ts`

- [x] Verify the 5200 px and 6000 px width contracts fail against the previous layouts.
- [x] Expand Stage 3 to 9 and 11 enemies across three combat cycles.
- [x] Expand Stage 4 to 11 and 13 enemies across four pressure groups.
- [x] Give every Stage 1-4 flier a restrained patrol route.
- [x] Run full verification and code review.
- [x] Commit the late-stage duration and aerial patrol pass.

### Task 8: Record browser playtest follow-ups

**Files:**
- Modify: `client/src/game/controllers/PlayerController.ts`
- Modify: `client/src/game/controllers/PlayerController.test.ts`
- Modify: `client/src/game/config/bossConfig.ts`
- Modify: `client/src/game/config/bossConfig.test.ts`

- [x] Complete the user-owned browser playtest for cover readability, firing angles, pacing, and perceived stage length.
- [x] Fix the Stage 4 boss portal transition so Stage 5 preserves the authored entry X position instead of spawning at the screen centre.
- [x] Increase the Stage 4 boss entrance grace period before its first attack from 900 ms to 1800 ms.
- [x] Preserve player movement and flight controls, boss detection radius, attack selection, and recurring attack timing.
- [x] Verify both follow-up fixes with regression tests, the full client test suite, lint, and production build.

The portal correction fixes a transition-coordinate bug and does not change the player's movement or flight rules. The boss follow-up keeps its detection radius and attack patterns intact; only the one-time delay between initial detection and the first attack telegraph is extended so the player can read the arena after entering.
