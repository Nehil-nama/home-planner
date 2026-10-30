import { useState } from 'react';

export const inputClass =
  'h-9 rounded-md border-2 border-slate-200 bg-white px-2 focus-visible:border-slate-800 focus-visible:outline-none';

// onCommit returns the value that was actually applied (after snapping),
// so the field can show it even when it equals the previous value
export function NumberField(props: {
  label: string;
  value: number;
  onCommit: (v: number) => number;
}) {
  const [draft, setDraft] = useState(String(props.value));
  const [prevValue, setPrevValue] = useState(props.value);

  // follow outside changes (like dragging in the 2D view) without an effect
  if (props.value !== prevValue) {
    setPrevValue(props.value);
    setDraft(String(props.value));
  }

  const commit = () => {
    const n = Number(draft);
    if (draft.trim() === '' || !Number.isFinite(n)) {
      setDraft(String(props.value));
      return;
    }
    setDraft(String(props.onCommit(n)));
  };

  return (
    <label className="grid gap-1 text-sm">
      <span className="font-bold">{props.label}</span>
      <input
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        className={inputClass}
      />
    </label>
  );
}