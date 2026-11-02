import type { Opening, OpeningKind, Plan, Side } from './types';

// small helpers to keep the sample plan readable
let sampleId = 0;
const opening = (kind: OpeningKind, side: Side, offset: number, width: number): Opening => ({
  id: `sample-${sampleId++}`,
  kind,
  side,
  offset,
  width,
});
const door = (side: Side, offset: number, width = 3) => opening('door', side, offset, width);
const win = (side: Side, offset: number, width = 4) => opening('window', side, offset, width);

export const samplePlan: Plan = {
  plot: { width: 30, depth: 40 },
  wallHeight: 10,
  rooms: [
    {
      id: 'living', name: 'Living room', kind: 'living', x: 0, y: 0, width: 16, depth: 14,
      openings: [door('top', 3), win('top', 9), win('left', 4), door('right', 3), door('bottom', 5)],
    },
    {
      id: 'kitchen', name: 'Kitchen', kind: 'kitchen', x: 16, y: 0, width: 14, depth: 10,
      openings: [win('top', 5, 3), door('left', 3), door('bottom', 8)],
    },
    {
      id: 'bed1', name: 'Bedroom 1', kind: 'bedroom', x: 0, y: 14, width: 14, depth: 12,
      openings: [win('left', 4), door('top', 5), door('right', 3)],
    },
    {
      id: 'bath', name: 'Bathroom', kind: 'bathroom', x: 14, y: 14, width: 8, depth: 8,
      openings: [door('left', 3), win('top', 4, 2)],
    },
    {
      id: 'bed2', name: 'Bedroom 2', kind: 'bedroom', x: 22, y: 10, width: 8, depth: 13,
      openings: [win('right', 4), door('top', 2)],
    },
  ],
};