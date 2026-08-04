import { describe, expect, it } from "vitest";
import { getFlightEntryJumpY } from "@/game/movement/flightEntryJump";

describe("getFlightEntryJumpY", () => {
  it("rises from the portal, peaks above the flight-band center, then lands at center", () => {
    const jump = {
      startY: 566,
      targetY: 364,
      apexY: 274,
    };

    expect(getFlightEntryJumpY(jump, 0)).toBe(566);
    expect(getFlightEntryJumpY(jump, 280)).toBe(274);
    expect(getFlightEntryJumpY(jump, 500)).toBe(364);
  });
});
