import { useState } from 'react';
import { usePlanner } from '../model/store';
import { ROOM_DEFAULTS, type RoomKind } from '../model/types';

const KINDS = Object.keys(ROOM_DEFAULTS) as RoomKind[];

export function AddRoom() {
  const addRoom = usePlanner((s) => s.addRoom);
  const [message, setMessage] = useState('');

  return (
    <section className="grid gap-2 border-t-2 border-slate-200 pt-4">
      <h2 className="font-bold">Add a room</h2>
      <div className="grid grid-cols-2 gap-2">
        {KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() =>
              setMessage(addRoom(kind) ? '' : 'There is no free space left on the plot for that room.')
            }
            className="h-9 rounded-md border-2 border-slate-800 px-2 text-sm font-bold hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800"
          >
            + {ROOM_DEFAULTS[kind].name}
          </button>
        ))}
      </div>
      {message && (
        <p role="status" className="text-sm text-red-700">
          {message}
        </p>
      )}
    </section>
  );
}