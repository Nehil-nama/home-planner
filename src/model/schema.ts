import { z } from 'zod';
import { PLOT_MAX, sideLength, WALL_THICKNESS } from './geometry';
import type { Plan } from './types';

const OpeningSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['door', 'window']),
  side: z.enum(['top', 'right', 'bottom', 'left']),
  offset: z.number().min(0),
  width: z.number().positive(),
});

const RoomSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  kind: z.enum(['living', 'bedroom', 'kitchen', 'bathroom', 'dining', 'other']),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  depth: z.number().positive(),
  // older saved plans have no openings, so default to an empty list instead of failing
  openings: z.array(OpeningSchema).default([]),
});

export const PlanSchema = z
  .object({
    plot: z.object({
      width: z.number().positive().max(PLOT_MAX),
      depth: z.number().positive().max(PLOT_MAX),
    }),
    wallHeight: z.number().min(8).max(20),
    rooms: z.array(RoomSchema),
  })
  .refine(
    (p) => p.rooms.every((r) => r.x + r.width <= p.plot.width && r.y + r.depth <= p.plot.depth),
    { message: 'A room extends outside the plot.' },
  )
  .refine(
    (p) =>
      p.rooms.every((r) =>
        r.openings.every((o) => {
          const length = sideLength(r, o.side);
          return o.offset >= WALL_THICKNESS && o.offset + o.width <= length - WALL_THICKNESS;
        }),
      ),
    { message: 'A door or window does not fit on its wall.' },
  );

// Turns unknown data (a file, localStorage) into a safe Plan, or a readable error
export function parsePlan(data: unknown) {
  const result = PlanSchema.safeParse(data);
  if (result.success) {
    return { ok: true as const, plan: result.data satisfies Plan };
  }
  const issue = result.error.issues[0];
  const where = issue && issue.path.length > 0 ? ` (${issue.path.map(String).join('.')})` : '';
  return { ok: false as const, error: `${issue?.message ?? 'Invalid plan'}${where}` };
}