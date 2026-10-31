import { describe, expect, it } from 'vitest';
import { builtArea, checkPlan, openWall } from './rules';
import { makeOpening, makePlan, makeRoom } from './testing';
import type { Room } from './types';

const ids = (rooms: Room[]) => checkPlan(makePlan(rooms)).map((i) => i.id);

const door = makeOpening({ id: 'd', kind: 'door', side: 'left', offset: 2, width: 3 });
const window = makeOpening({ id: 'w', kind: 'window', side: 'top', offset: 3, width: 4 });

describe('checkPlan', () => {
  it('finds nothing wrong with a sensible room', () => {
    expect(checkPlan(makePlan([makeRoom({ openings: [door, window] })]))).toEqual([]);
  });

  it('flags a room with no door', () => {
    expect(ids([makeRoom({ openings: [window] })])).toContain('door:r1');
  });

  it('flags a room with no window, but only when a window could face outside', () => {
    expect(ids([makeRoom({ openings: [door] })])).toContain('window:r1');
  });

  it('flags rooms that are too small', () => {
    const found = ids([makeRoom({ width: 5, depth: 5, openings: [door, window] })]);
    expect(found).toContain('area:r1');
    expect(found).toContain('side:r1');
  });

  it('reports overlapping rooms as an error', () => {
    const a = makeRoom({ id: 'a', openings: [door, window] });
    const b = makeRoom({ id: 'b', x: 6, openings: [door, window] });
    const issue = checkPlan(makePlan([a, b])).find((i) => i.id === 'overlap:a:b');
    expect(issue?.severity).toBe('error');
  });

  it('flags a window that faces another room', () => {
    const a = makeRoom({
      id: 'a',
      width: 10,
      depth: 10,
      openings: [door, makeOpening({ id: 'w1', kind: 'window', side: 'right', offset: 3, width: 4 })],
    });
    const b = makeRoom({ id: 'b', x: 10, width: 10, depth: 10, openings: [door, window] });
    expect(ids([a, b])).toContain('facing:w1');
  });

  it('flags openings that overlap on the same wall', () => {
    const room = makeRoom({
      openings: [
        window,
        makeOpening({ id: 'd1', kind: 'door', side: 'left', offset: 2, width: 3 }),
        makeOpening({ id: 'd2', kind: 'door', side: 'left', offset: 3, width: 3 }),
      ],
    });
    expect(ids([room])).toContain('clash:d1:d2');
  });
});

describe('openWall', () => {
  const center = makeRoom({ id: 'c', x: 10, y: 10, width: 10, depth: 10 });

  it('is the full side length for a room with nothing around it', () => {
    expect(openWall(center, [])).toBe(10);
  });

  it('is zero when other rooms cover every side', () => {
    const around = [
      makeRoom({ id: 'l', x: 0, y: 10, width: 10, depth: 10 }),
      makeRoom({ id: 'r', x: 20, y: 10, width: 10, depth: 10 }),
      makeRoom({ id: 't', x: 10, y: 0, width: 10, depth: 10 }),
      makeRoom({ id: 'b', x: 10, y: 20, width: 10, depth: 10 }),
    ];
    expect(openWall(center, around)).toBe(0);
  });
});

describe('builtArea', () => {
  it('counts overlapping floor only once', () => {
    const rooms = [
      makeRoom({ id: 'a', x: 0, y: 0, width: 10, depth: 10 }),
      makeRoom({ id: 'b', x: 5, y: 0, width: 10, depth: 10 }),
    ];
    expect(builtArea(makePlan(rooms))).toBe(150);
  });
});