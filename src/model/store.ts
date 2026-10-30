import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clamp, findFreeSpot, PLOT_MAX, PLOT_MIN } from './geometry';
import { parsePlan } from './schema';
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
  setPlan: (plan: Plan) => void;
  resetPlan: () => void;
  setPlot: (patch: Partial<Plan['plot']>) => Plan['plot'];
  setWallHeight: (h: number) => number;
}

export const usePlanner = create<PlannerState>()(
  persist(
    (set, get) => ({
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

      setPlan: (plan) => set({ plan, selectedId: null }),

      resetPlan: () => set({ plan: samplePlan, selectedId: null }),

      // The plot can't shrink past the rooms already on it.
      // Returns the size that was actually applied.
      setPlot: (patch) => {
        const { plan } = get();
        const needWidth = Math.max(PLOT_MIN, ...plan.rooms.map((r) => r.x + r.width));
        const needDepth = Math.max(PLOT_MIN, ...plan.rooms.map((r) => r.y + r.depth));
        const plot = {
          width: clamp(Math.round(patch.width ?? plan.plot.width), needWidth, PLOT_MAX),
          depth: clamp(Math.round(patch.depth ?? plan.plot.depth), needDepth, PLOT_MAX),
        };
        set({ plan: { ...plan, plot } });
        return plot;
      },

      setWallHeight: (h) => {
        const wallHeight = clamp(Math.round(h), 8, 20);
        set((s) => ({ plan: { ...s.plan, wallHeight } }));
        return wallHeight;
      },
    }),
    {
      name: 'home-planner',
      version: 1,
      // only the plan is saved, not which room is selected
      partialize: (s) => ({ plan: s.plan }),
      // never trust saved data: validate it, and fall back to the current state if it's bad
      merge: (persisted, current) => {
        const result = parsePlan((persisted as { plan?: unknown } | undefined)?.plan);
        return result.ok ? { ...current, plan: result.plan } : current;
      },
    },
  ),
);