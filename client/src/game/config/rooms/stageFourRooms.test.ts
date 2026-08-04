import { describe, expect, it } from 'vitest';
import {
  INFERNO_ROOM_ONE,
  INFERNO_ROOM_TWO,
} from '@/game/config/rooms/stageFourRooms';

const infernoRooms = [INFERNO_ROOM_ONE, INFERNO_ROOM_TWO];

describe('stage four terrain', () => {
  it('uses only skinned platforms for authored terrain', () => {
    for (const room of infernoRooms) {
      expect(room.terrain?.some(({ type }) => type === 'wall')).toBe(false);
    }
  });
});
