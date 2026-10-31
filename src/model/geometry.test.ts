import { describe, expect, it } from 'vitest';
import {
  clampOpenings,
  findFreeSpot,
  findOpeningSpot,
  fit,
  fitOpening,
  MIN_SIZE,
  overlaps,
} from './geometry';
import { makeOpening, makePlan, makeRoom } from './testing';

describe('fit', () => {
  const plot = { width: 30, depth: 40 };

  it('rounds to whole feet', () => {
    expect(fit(plot, 2.4, 3.6, 10.2, 9.7)).toEqual({ x: 2, y: 4, width: 10, depth: 10 });
  });

  it('enforces the minimum room size', () => {
    expect(fit(plot, 0, 0, 1, 2)).toMatchObject({ width: MIN_SIZE, depth: MIN_SIZE });
  });

  it('keeps the room inside the plot', () => {
    expect(fit(plot, 28, 38, 10, 10)).toEqual({ x: 20, y: 30, width: 10, depth: 10 });
  });
});

describe('overlaps', () => {
  const a = makeRoom({ x: 0, y: 0, width: 10, depth: 10 });

  it('is false for rooms that only touch', () => {
    expect(overlaps(a, makeRoom({ x: 10, y: 0, width: 10, depth: 10 }))).toBe(false);
  });

  it('is true when rooms share floor area', () => {
    expect(overlaps(a, makeRoom({ x: 9, y: 5, width: 10, depth: 10 }))).toBe(true);
  });
});

describe('findFreeSpot', () => {
  const plan = makePlan([makeRoom({ id: 'a', x: 0, y: 0, width: 10, depth: 10 })], {
    width: 20,
    depth: 10,
  });

  it('finds the first spot next to existing rooms', () => {
    expect(findFreeSpot(plan, 10, 10)).toEqual({ x: 10, y: 0 });
  });

  it('returns null when nothing fits', () => {
    expect(findFreeSpot(plan, 11, 10)).toBeNull();
  });
});

describe('fitOpening', () => {
  const room = { width: 12, depth: 10 };

  it('keeps openings clear of the corners', () => {
    expect(fitOpening(room, { side: 'top', offset: 0, width: 3 })).toEqual({
      side: 'top',
      offset: 0.5,
      width: 3,
    });
    expect(fitOpening(room, { side: 'top', offset: 20, width: 3 })).toEqual({
      side: 'top',
      offset: 8.5,
      width: 3,
    });
  });

  it('snaps to half feet', () => {
    expect(fitOpening(room, { side: 'top', offset: 2.3, width: 3.2 })).toEqual({
      side: 'top',
      offset: 2.5,
      width: 3,
    });
  });

  it('limits the width to what the wall allows', () => {
    expect(fitOpening(room, { side: 'left', offset: 1, width: 50 })).toEqual({
      side: 'left',
      offset: 0.5,
      width: 9,
    });
  });

  it('never goes below the minimum width', () => {
    expect(fitOpening(room, { side: 'top', offset: 3, width: 0.5 }).width).toBe(2);
  });
});

describe('findOpeningSpot', () => {
  it('places a new opening beside an existing one', () => {
    const room = makeRoom({
      width: 10,
      depth: 10,
      openings: [makeOpening({ side: 'top', offset: 0.5, width: 3 })],
    });
    expect(findOpeningSpot(room, 'door')).toEqual({ side: 'top', offset: 3.5, width: 3 });
  });
});

describe('clampOpenings', () => {
  it('pulls openings back onto a room that got smaller', () => {
    const room = makeRoom({
      width: 6,
      depth: 6,
      openings: [makeOpening({ kind: 'window', side: 'top', offset: 8, width: 4 })],
    });
    expect(clampOpenings(room)[0]).toMatchObject({ offset: 1.5, width: 4 });
  });
});