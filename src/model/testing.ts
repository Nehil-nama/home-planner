import type { Opening, Plan, Room } from './types';

export const makeRoom = (over: Partial<Room> = {}): Room => ({
  id: 'r1',
  name: 'Room',
  kind: 'bedroom',
  x: 0,
  y: 0,
  width: 12,
  depth: 12,
  openings: [],
  ...over,
});

export const makeOpening = (over: Partial<Opening> = {}): Opening => ({
  id: 'o1',
  kind: 'door',
  side: 'left',
  offset: 2,
  width: 3,
  ...over,
});

export const makePlan = (rooms: Room[], plot = { width: 30, depth: 30 }): Plan => ({
  plot,
  wallHeight: 10,
  rooms,
});