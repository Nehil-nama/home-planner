import { z } from 'zod';
import { PLOT_MAX } from './geometry';
import type { Plan } from './types';

const RoomSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  kind: z.enum(['living', 'bedroom', 'kitchen', 'bathroom', 'dining', 'other']),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  depth: z.number().positive(),
});

export const PlanSchema = z
  .object({
    plot: z.object({
      width: z.number().positive().max(PLOT_MAX),
      depth: z.number().positive().max(PLOT_MAX),
    }),
    wallHeight: z.number().positive().max(20),
    rooms: z.array(RoomSchema),
  })
  .refine(
    (p) => p.rooms.every((r) => r.x + r.width <= p.plot.width && r.y + r.depth <= p.plot.depth),
    { message: 'A room extends outside the plot.' },
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