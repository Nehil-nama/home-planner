import { useState } from 'react';
import { fitOpening } from '../model/geometry';
import { usePlanner } from '../model/store';
import {
  OPENING_DEFAULTS,
  SIDE_LABELS,
  SIDES,
  type Opening,
  type OpeningKind,
  type Side,
} from '../model/types';
import { inputClass, NumberField } from './NumberField';

const KINDS = Object.keys(OPENING_DEFAULTS) as OpeningKind[];

const buttonClass =
  'h-9 rounded-md border-2 border-slate-800 px-2 text-sm font-bold hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800';

export function OpeningsPanel() {
  const plan = usePlanner((s) => s.plan);
  const selectedId = usePlanner((s) => s.selectedId);
  const addOpening = usePlanner((s) => s.addOpening);
  const updateOpening = usePlanner((s) => s.updateOpening);
  const removeOpening = usePlanner((s) => s.removeOpening);
  const [message, setMessage] = useState('');

  const room = plan.rooms.find((r) => r.id === selectedId);
  if (!room) return null;

  // apply a change, snapped to the wall, and return what was actually applied
  const change = (o: Opening, patch: Partial<Pick<Opening, 'side' | 'offset' | 'width'>>) => {
    const fitted = fitOpening(room, { ...o, ...patch });
    updateOpening(room.id, o.id, fitted);
    return fitted;
  };

  const labelFor = (o: Opening) => {
    const number = room.openings.filter((x) => x.kind === o.kind).indexOf(o) + 1;
    return `${OPENING_DEFAULTS[o.kind].name} ${number}`;
  };

  const add = (kind: OpeningKind) =>
    setMessage(addOpening(room.id, kind) ? '' : 'There is no free space on the walls for that.');

  return (
    <section className="grid gap-3 border-t-2 border-slate-200 pt-4">
      <h2 className="font-bold">Doors and windows</h2>

      <div className="grid grid-cols-2 gap-2">
        {KINDS.map((kind) => (
          <button key={kind} type="button" onClick={() => add(kind)} className={buttonClass}>
            + {OPENING_DEFAULTS[kind].name}
          </button>
        ))}
      </div>
      {message && (
        <p role="status" className="text-sm text-red-700">
          {message}
        </p>
      )}

      {room.openings.length === 0 && (
        <p className="text-sm text-slate-500">This room has no doors or windows yet.</p>
      )}

      <ul className="grid gap-3">
        {room.openings.map((o) => {
          const fromLabel = o.side === 'top' || o.side === 'bottom' ? 'left' : 'top';
          return (
            <li key={o.id} className="grid gap-2 rounded-md border-2 border-slate-200 p-3">
              <span className="font-bold">{labelFor(o)}</span>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm">
                  <span className="font-bold">Type</span>
                  <select
                    value={o.kind}
                    onChange={(e) =>
                      updateOpening(room.id, o.id, { kind: e.target.value as OpeningKind })
                    }
                    className={inputClass}
                  >
                    {KINDS.map((k) => (
                      <option key={k} value={k}>
                        {OPENING_DEFAULTS[k].name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  <span className="font-bold">Wall</span>
                  <select
                    value={o.side}
                    onChange={(e) => change(o, { side: e.target.value as Side })}
                    className={inputClass}
                  >
                    {SIDES.map((s) => (
                      <option key={s} value={s}>
                        {SIDE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>

                <NumberField
                  label={`From ${fromLabel} (ft)`}
                  value={o.offset}
                  onCommit={(v) => change(o, { offset: v }).offset}
                />
                <NumberField
                  label="Width (ft)"
                  value={o.width}
                  onCommit={(v) => change(o, { width: v }).width}
                />
              </div>

              <button
                type="button"
                onClick={() => removeOpening(room.id, o.id)}
                className="h-9 w-fit rounded-md border-2 border-red-700 px-3 text-sm font-bold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}