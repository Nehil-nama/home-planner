import { overlaps } from './geometry';
import { ROOM_DEFAULTS, type Plan, type Room, type RoomKind } from './types';

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

// The longest stretch (in whole feet) of any side that no other room covers.
// Outside the plot there are no rooms, so the plot edge counts as open.
export function openWall(room: Room, others: Room[]): number {
  const { x, y, width: w, depth: d } = room;

  const countOpen = (length: number, point: (i: number) => [number, number]) => {
    let open = 0;
    for (let i = 0; i < Math.floor(length); i++) {
      const [px, py] = point(i);
      if (!insideAnyRoom(others, px, py)) open++;
    }
    return open;
  };

  return Math.max(
    countOpen(w, (i) => [x + i + 0.5, y - 0.5]), // top side
    countOpen(w, (i) => [x + i + 0.5, y + d + 0.5]), // bottom side
    countOpen(d, (i) => [x - 0.5, y + i + 0.5]), // left side
    countOpen(d, (i) => [x + w + 0.5, y + i + 0.5]), // right side
  );
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

export function checkPlan(plan: Plan): Issue[] {
  const issues: Issue[] = [];
  const { rooms } = plan;

  rooms.forEach((room, i) => {
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

    if (needsLight(room.kind)) {
      const others = rooms.filter((r) => r.id !== room.id);
      if (openWall(room, others) < MIN_OPEN_WALL) {
        issues.push({
          id: `light:${room.id}`,
          severity: 'warning',
          roomId: room.id,
          message: `${room.name} has no wall with ${MIN_OPEN_WALL} ft facing open space, so it may lack light and ventilation.`,
        });
      }
    }
  });

  return issues;
}