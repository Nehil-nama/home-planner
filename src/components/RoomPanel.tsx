import { useEffect } from 'react';
import { inputClass, NumberField } from './NumberField';
import { fit, overlaps } from '../model/geometry';
import { usePlanner } from '../model/store';
import { ROOM_DEFAULTS, type Room, type RoomKind } from '../model/types';

const KIND_OPTIONS = (Object.keys(ROOM_DEFAULTS) as RoomKind[]).map((k) => ({
  value: k,
  label: ROOM_DEFAULTS[k].name,
}));


export function RoomPanel() {
  const plan = usePlanner((s) => s.plan);
  const selectedId = usePlanner((s) => s.selectedId);
  const updateRoom = usePlanner((s) => s.updateRoom);
  const removeRoom = usePlanner((s) => s.removeRoom);

  // Delete key removes the selected room (but not while typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key !== 'Delete' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const { selectedId: id, removeRoom: remove } = usePlanner.getState();
      if (id) remove(id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const room = plan.rooms.find((r) => r.id === selectedId);

  if (!room) {
    return (
      <section className="grid gap-2 border-t-2 border-slate-200 pt-4">
        <h2 className="font-bold">Selected room</h2>
        <p className="text-sm text-slate-500">Select a room to edit it.</p>
      </section>
    );
  }

  const place = (patch: Partial<Pick<Room, 'x' | 'y' | 'width' | 'depth'>>) => {
    const f = fit(
      plan.plot,
      patch.x ?? room.x,
      patch.y ?? room.y,
      patch.width ?? room.width,
      patch.depth ?? room.depth,
    );
    updateRoom(room.id, f);
    return f;
  };

  const clashes = plan.rooms.filter((r) => r.id !== room.id && overlaps(r, room));

  return (
    <section className="grid gap-3 border-t-2 border-slate-200 pt-4">
      <h2 className="font-bold">Selected room</h2>

      <label className="grid gap-1 text-sm">
        <span className="font-bold">Name</span>
        <input
          type="text"
          value={room.name}
          onChange={(e) => updateRoom(room.id, { name: e.target.value })}
          className={inputClass}
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-bold">Type</span>
        <select
          value={room.kind}
          onChange={(e) => updateRoom(room.id, { kind: e.target.value as RoomKind })}
          className={inputClass}
        >
          {KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Width (ft)" value={room.width} onCommit={(v) => place({ width: v }).width} />
        <NumberField label="Depth (ft)" value={room.depth} onCommit={(v) => place({ depth: v }).depth} />
        <NumberField label="X (ft)" value={room.x} onCommit={(v) => place({ x: v }).x} />
        <NumberField label="Y (ft)" value={room.y} onCommit={(v) => place({ y: v }).y} />
      </div>

      <p className="text-sm text-slate-600">Area: {room.width * room.depth} sq ft</p>

      {clashes.length > 0 && (
        <p role="status" className="text-sm font-bold text-red-700">
          Overlaps {clashes.map((r) => r.name).join(', ')}
        </p>
      )}

      <button
        type="button"
        onClick={() => removeRoom(room.id)}
        className="h-9 rounded-md border-2 border-red-700 px-3 text-sm font-bold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
      >
        Delete room
      </button>
    </section>
  );
}