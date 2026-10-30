import { create } from 'zustand';
import { findFreeSpot } from './geometry';
import { ROOM_DEFAULTS, type Plan, type Room, type RoomKind } from './types';

const samplePlan: Plan = {
  plot: { width: 30, depth: 40 },
  wallHeight: 10,
  rooms: [
    { id: 'living', name: 'Living room', kind: 'living', x: 0, y: 0, width: 16, depth: 14 },
    { id: 'kitchen', name: 'Kitchen', kind: 'kitchen', x: 16, y: 0, width: 14, depth: 10 },
    { id: 'bed1', name: 'Bedroom 1', kind: 'bedroom', x: 0, y: 14, width: 14, depth: 12 },
    { id: 'bath', name: 'Bathroom', kind: 'bathroom', x: 14, y: 14, width: 8, depth: 8 },
    { id: 'bed2', name: 'Bedroom 2', kind: 'bedroom', x: 22, y: 10, width: 8, depth: 12 },
  ],
};

interface PlannerState {
  plan: Plan;
  selectedId: string | null;
  select: (id: string | null) => void;
  updateRoom: (id: string, patch: Partial<Omit<Room, 'id'>>) => void;
  addRoom: (kind: RoomKind) => boolean;
  removeRoom: (id: string) => void;
}

export const usePlanner = create<PlannerState>((set, get) => ({
  plan: samplePlan,
  selectedId: null,

  select: (id) => set({ selectedId: id }),

  updateRoom: (id, patch) =>
    set((s) => ({
      plan: {
        ...s.plan,
        rooms: s.plan.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      },
    })),

  addRoom: (kind) => {
    const { plan } = get();
    const d = ROOM_DEFAULTS[kind];
    const spot = findFreeSpot(plan, d.width, d.depth);
    if (!spot) return false;

    const sameKind = plan.rooms.filter((r) => r.kind === kind).length;
    const room: Room = {
      id: crypto.randomUUID(),
      name: sameKind > 0 ? `${d.name} ${sameKind + 1}` : d.name,
      kind,
      x: spot.x,
      y: spot.y,
      width: d.width,
      depth: d.depth,
    };
    set({ plan: { ...plan, rooms: [...plan.rooms, room] }, selectedId: room.id });
    return true;
  },

  removeRoom: (id) =>
    set((s) => ({
      plan: { ...s.plan, rooms: s.plan.rooms.filter((r) => r.id !== id) },
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),
}));