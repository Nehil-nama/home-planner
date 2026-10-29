import { usePlanner } from '../model/store';

export function RoomList() {
  const rooms = usePlanner((s) => s.plan.rooms);
  const selectedId = usePlanner((s) => s.selectedId);
  const select = usePlanner((s) => s.select);

  return (
    <ul className="grid gap-1">
      {rooms.map((r) => (
        <li key={r.id}>
          <button
            type="button"
            onClick={() => select(r.id)}
            aria-pressed={selectedId === r.id}
            className="flex w-full justify-between rounded-md border-2 border-transparent px-3 py-2 text-left hover:bg-slate-100 aria-pressed:border-slate-800 aria-pressed:bg-amber-100"
          >
            <span className="font-bold">{r.name}</span>
            <span className="text-sm text-slate-600">
              {r.width}×{r.depth} ft
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}