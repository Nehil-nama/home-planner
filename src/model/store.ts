import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  clamp,
  clampOpenings,
  findFreeSpot,
  findOpeningSpot,
  fitOpening,
  PLOT_MAX,
  PLOT_MIN,
} from './geometry';
import { parsePlan } from './schema';
import {
  ROOM_DEFAULTS,
  type Opening,
  type OpeningKind,
  type Plan,
  type Room,
  type RoomKind,
  type Side,
} from './types';

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

const samplePlan: Plan = {
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
      id: 'bed2', name: 'Bedroom 2', kind: 'bedroom', x: 22, y: 10, width: 8, depth: 12,
      openings: [win('right', 4), door('top', 2)],
    },
  ],
};

interface PlannerState {
  plan: Plan;
  selectedId: string | null;
  select: (id: string | null) => void;
  updateRoom: (id: string, patch: Partial<Omit<Room, 'id'>>) => void;
  addRoom: (kind: RoomKind) => boolean;
  removeRoom: (id: string) => void;
  addOpening: (roomId: string, kind: OpeningKind) => boolean;
  updateOpening: (roomId: string, openingId: string, patch: Partial<Omit<Opening, 'id'>>) => void;
  removeOpening: (roomId: string, openingId: string) => void;
  setPlan: (plan: Plan) => void;
  resetPlan: () => void;
  setPlot: (patch: Partial<Plan['plot']>) => Plan['plot'];
  setWallHeight: (h: number) => number;
}

// returns a copy of the plan with one room replaced by fn(room)
const withRoom = (plan: Plan, roomId: string, fn: (r: Room) => Room): Plan => ({
  ...plan,
  rooms: plan.rooms.map((r) => (r.id === roomId ? fn(r) : r)),
});

export const usePlanner = create<PlannerState>()(
  persist(
    (set, get) => ({
      plan: samplePlan,
      selectedId: null,

      select: (id) => set({ selectedId: id }),

      updateRoom: (id, patch) =>
        set((s) => ({
          plan: withRoom(s.plan, id, (r) => {
            const next = { ...r, ...patch };
            // keep doors and windows on their walls if the room changed size
            return { ...next, openings: clampOpenings(next) };
          }),
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
          openings: [],
        };
        set({ plan: { ...plan, rooms: [...plan.rooms, room] }, selectedId: room.id });
        return true;
      },

      removeRoom: (id) =>
        set((s) => ({
          plan: { ...s.plan, rooms: s.plan.rooms.filter((r) => r.id !== id) },
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),

      addOpening: (roomId, kind) => {
        const room = get().plan.rooms.find((r) => r.id === roomId);
        if (!room) return false;
        const spot = findOpeningSpot(room, kind);
        if (!spot) return false;

        const created: Opening = { id: crypto.randomUUID(), kind, ...spot };
        set((s) => ({
          plan: withRoom(s.plan, roomId, (r) => ({ ...r, openings: [...r.openings, created] })),
        }));
        return true;
      },

      updateOpening: (roomId, openingId, patch) =>
        set((s) => ({
          plan: withRoom(s.plan, roomId, (r) => ({
            ...r,
            openings: r.openings.map((o) => {
              if (o.id !== openingId) return o;
              const next = { ...o, ...patch };
              return { ...next, ...fitOpening(r, next) };
            }),
          })),
        })),

      removeOpening: (roomId, openingId) =>
        set((s) => ({
          plan: withRoom(s.plan, roomId, (r) => ({
            ...r,
            openings: r.openings.filter((o) => o.id !== openingId),
          })),
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