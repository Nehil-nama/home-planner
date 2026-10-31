import { overlaps, sideLength } from './geometry';
import {
  OPENING_DEFAULTS,
  ROOM_DEFAULTS,
  SIDES,
  type Opening,
  type Plan,
  type Room,
  type RoomKind,
  type Side,
} from './types';

export interface Issue {
  id: string;
  severity: 'error' | 'warning';
  roomId: string;
  message: string;
}

// Rough starting points, not building-code values. Adjust them to your local bylaws.
export const MIN_ROOM: Record<RoomKind, { area: number; side: number }> = {
  living: { area: 100, side: 8 },
  bedroom: { area: 100, side: 8 },
  kitchen: { area: 50, side: 6 },
  bathroom: { area: 20, side: 4 },
  dining: { area: 80, side: 7 },
  other: { area: 0, side: 0 },
};

export const MIN_OPEN_WALL = 3; // feet of one side that must face open space (room for a window)

const needsLight = (kind: RoomKind) => kind !== 'other';

function insideAnyRoom(rooms: Room[], px: number, py: number) {
  return rooms.some((r) => px > r.x && px < r.x + r.width && py > r.y && py < r.y + r.depth);
}

// How many whole feet of a stretch [from, to] along one side are not covered by another room.
// Outside the plot there are no rooms, so the plot edge counts as open.
function openLength(room: Room, others: Room[], side: Side, from: number, to: number): number {
  const { x, y, width: w, depth: d } = room;

  // a point just outside the wall, t feet along it
  const point = (t: number): [number, number] =>
    side === 'top'
      ? [x + t, y - 0.5]
      : side === 'bottom'
        ? [x + t, y + d + 0.5]
        : side === 'left'
          ? [x - 0.5, y + t]
          : [x + w + 0.5, y + t];

  let open = 0;
  const feet = Math.floor(to - from);
  for (let i = 0; i < feet; i++) {
    const [px, py] = point(from + i + 0.5);
    if (!insideAnyRoom(others, px, py)) open++;
  }
  return open;
}

// The longest open stretch (in whole feet) on any side of the room
export function openWall(room: Room, others: Room[]): number {
  return Math.max(...SIDES.map((side) => openLength(room, others, side, 0, sideLength(room, side))));
}

// Square feet of the plot covered by at least one room (overlaps are counted once)
export function builtArea(plan: Plan): number {
  let cells = 0;
  for (let cy = 0; cy < plan.plot.depth; cy++) {
    for (let cx = 0; cx < plan.plot.width; cx++) {
      if (insideAnyRoom(plan.rooms, cx + 0.5, cy + 0.5)) cells++;
    }
  }
  return cells;
}

// "Window 2", numbered per kind within the room (same naming as the panel)
function openingName(room: Room, o: Opening) {
  const number = room.openings.filter((x) => x.kind === o.kind).indexOf(o) + 1;
  return `${OPENING_DEFAULTS[o.kind].name} ${number}`;
}

export function checkPlan(plan: Plan): Issue[] {
  const issues: Issue[] = [];
  const { rooms } = plan;

  rooms.forEach((room, i) => {
    const others = rooms.filter((r) => r.id !== room.id);

    // --- rooms on top of each other ---
    for (const other of rooms.slice(i + 1)) {
      if (overlaps(room, other)) {
        issues.push({
          id: `overlap:${room.id}:${other.id}`,
          severity: 'error',
          roomId: room.id,
          message: `${room.name} overlaps ${other.name}.`,
        });
      }
    }

    // --- size ---
    const min = MIN_ROOM[room.kind];
    const kindName = ROOM_DEFAULTS[room.kind].name.toLowerCase();
    const area = room.width * room.depth;
    const side = Math.min(room.width, room.depth);

    if (area < min.area) {
      issues.push({
        id: `area:${room.id}`,
        severity: 'warning',
        roomId: room.id,
        message: `${room.name} is ${area} sq ft. A ${kindName} usually needs at least ${min.area} sq ft.`,
      });
    }

    if (side < min.side) {
      issues.push({
        id: `side:${room.id}`,
        severity: 'warning',
        roomId: room.id,
        message: `${room.name} is only ${side} ft on its short side. At least ${min.side} ft is recommended.`,
      });
    }

    // --- doors ---
    const windows = room.openings.filter((o) => o.kind === 'window');

    if (!room.openings.some((o) => o.kind === 'door')) {
      issues.push({
        id: `door:${room.id}`,
        severity: 'warning',
        roomId: room.id,
        message: `${room.name} has no door.`,
      });
    }

    // --- light and ventilation ---
    if (needsLight(room.kind)) {
      if (openWall(room, others) < MIN_OPEN_WALL) {
        issues.push({
          id: `light:${room.id}`,
          severity: 'warning',
          roomId: room.id,
          message: `${room.name} has no wall with ${MIN_OPEN_WALL} ft facing open space, so it may lack light and ventilation.`,
        });
      } else if (windows.length === 0) {
        // only worth saying when a window would actually have somewhere to face
        issues.push({
          id: `window:${room.id}`,
          severity: 'warning',
          roomId: room.id,
          message: `${room.name} has no window.`,
        });
      }
    }

    // --- windows that look at another room ---
    for (const w of windows) {
      const open = openLength(room, others, w.side, w.offset, w.offset + w.width);
      if (open * 2 < Math.floor(w.width)) {
        issues.push({
          id: `facing:${w.id}`,
          severity: 'warning',
          roomId: room.id,
          message: `${openingName(room, w)} in ${room.name} faces another room, not open space.`,
        });
      }
    }

    // --- openings on top of each other ---
    room.openings.forEach((a, j) => {
      for (const b of room.openings.slice(j + 1)) {
        if (a.side === b.side && a.offset < b.offset + b.width && a.offset + a.width > b.offset) {
          issues.push({
            id: `clash:${a.id}:${b.id}`,
            severity: 'warning',
            roomId: room.id,
            message: `${openingName(room, a)} and ${openingName(room, b)} in ${room.name} overlap.`,
          });
        }
      }
    });
  });

  return issues;
}