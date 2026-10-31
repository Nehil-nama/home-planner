import {
  OPENING_DEFAULTS,
  SIDES,
  type Opening,
  type OpeningKind,
  type Plan,
  type Room,
  type Side,
} from './types';

export const MIN_SIZE = 4; // smallest room side, in feet
export const PLOT_MIN = 10; // smallest plot side, in feet
export const PLOT_MAX = 100; // largest plot side, in feet
export const WALL_THICKNESS = 0.5; // feet
export const OPENING_MIN = 2; // narrowest door or window, in feet

export const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

// Snap a room to whole feet and keep it inside the plot
export function fit(plot: Plan['plot'], x: number, y: number, w: number, d: number) {
  const width = Math.min(Math.max(MIN_SIZE, Math.round(w)), plot.width);
  const depth = Math.min(Math.max(MIN_SIZE, Math.round(d)), plot.depth);
  return {
    x: clamp(Math.round(x), 0, plot.width - width),
    y: clamp(Math.round(y), 0, plot.depth - depth),
    width,
    depth,
  };
}

type Rect = Pick<Room, 'x' | 'y' | 'width' | 'depth'>;

export function overlaps(a: Rect, b: Rect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.depth && a.y + a.depth > b.y;
}

// First spot (scanning left to right, top to bottom) where a room of this size fits
export function findFreeSpot(plan: Plan, width: number, depth: number) {
  for (let y = 0; y + depth <= plan.plot.depth; y++) {
    for (let x = 0; x + width <= plan.plot.width; x++) {
      const candidate = { x, y, width, depth };
      if (!plan.rooms.some((r) => overlaps(candidate, r))) return { x, y };
    }
  }
  return null;
}

const half = (v: number) => Math.round(v * 2) / 2;

export function sideLength(room: Pick<Room, 'width' | 'depth'>, side: Side) {
  return side === 'top' || side === 'bottom' ? room.width : room.depth;
}

// Keep an opening on its wall: half-foot steps, clear of the corners
export function fitOpening(
  room: Pick<Room, 'width' | 'depth'>,
  o: Pick<Opening, 'side' | 'offset' | 'width'>,
) {
  const length = sideLength(room, o.side);
  const usable = Math.max(0, length - 2 * WALL_THICKNESS);
  const width = Math.min(Math.max(OPENING_MIN, half(o.width)), usable);
  const offset = clamp(half(o.offset), WALL_THICKNESS, length - WALL_THICKNESS - width);
  return { side: o.side, offset, width };
}

// Re-fit every opening, for example after the room was resized
export function clampOpenings(room: Room): Opening[] {
  return room.openings.map((o) => ({ ...o, ...fitOpening(room, o) }));
}

// First free place on any wall for a new door or window
export function findOpeningSpot(room: Room, kind: OpeningKind) {
  for (const side of SIDES) {
    const length = sideLength(room, side);
    const width = Math.min(OPENING_DEFAULTS[kind].width, length - 2 * WALL_THICKNESS);
    if (width < OPENING_MIN) continue;

    for (let offset = WALL_THICKNESS; offset + width <= length - WALL_THICKNESS; offset += 0.5) {
      const clash = room.openings.some(
        (o) => o.side === side && offset < o.offset + o.width && offset + width > o.offset,
      );
      if (!clash) return { side, offset, width };
    }
  }
  return null;
}