import type { Plan, Room } from './types';
export const PLOT_MIN = 10; // smallest plot side, in feet
export const PLOT_MAX = 100; // largest plot side, in feet

export const MIN_SIZE = 4; // smallest room side, in feet

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