import { describe, expect, it } from 'vitest';
import { parsePlan } from './schema';

const room = {
  id: 'a',
  name: 'Living',
  kind: 'living',
  x: 0,
  y: 0,
  width: 10,
  depth: 10,
  openings: [{ id: 'd', kind: 'door', side: 'top', offset: 2, width: 3 }],
};

const valid = { plot: { width: 30, depth: 40 }, wallHeight: 10, rooms: [room] };

describe('parsePlan', () => {
  it('accepts a valid plan', () => {
    expect(parsePlan(valid).ok).toBe(true);
  });

  it('gives older plans an empty openings list', () => {
    const { openings: _unused, ...oldRoom } = room;
    const result = parsePlan({ ...valid, rooms: [oldRoom] });
    expect(result.ok && result.plan.rooms[0]?.openings).toEqual([]);
  });

  it('rejects a room that sticks out of the plot', () => {
    const result = parsePlan({ ...valid, rooms: [{ ...room, x: 25 }] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('outside the plot');
  });

  it('rejects an opening that does not fit its wall', () => {
    const bad = { ...room, openings: [{ id: 'd', kind: 'door', side: 'top', offset: 9, width: 3 }] };
    const result = parsePlan({ ...valid, rooms: [bad] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('does not fit');
  });

  it('rejects an unknown room type and says where', () => {
    const result = parsePlan({ ...valid, rooms: [{ ...room, kind: 'garage' }] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('rooms.0.kind');
  });

  it('rejects things that are not plans at all', () => {
    expect(parsePlan('hello').ok).toBe(false);
    expect(parsePlan(null).ok).toBe(false);
  });
});