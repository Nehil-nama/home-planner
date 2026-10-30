import { useRef, useState, type ChangeEvent } from 'react';
import { parsePlan } from '../model/schema';
import { usePlanner } from '../model/store';

const buttonClass =
  'h-9 rounded-md border-2 border-slate-800 px-3 text-sm font-bold hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800';

export function FileActions() {
  const plan = usePlanner((s) => s.plan);
  const setPlan = usePlanner((s) => s.setPlan);
  const resetPlan = usePlanner((s) => s.resetPlan);
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  const exportPlan = () => {
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'home-plan.json';
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Plan exported.');
  };

  const importPlan = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets you pick the same file again later
    if (!file) return;
    try {
      const result = parsePlan(JSON.parse(await file.text()));
      if (result.ok) {
        setPlan(result.plan);
        setMessage('Plan loaded.');
      } else {
        setMessage(`Could not load that file: ${result.error}`);
      }
    } catch {
      setMessage('That file is not valid JSON.');
    }
  };

  const reset = () => {
    if (window.confirm('Replace your current plan with the sample plan?')) {
      resetPlan();
      setMessage('Reset to the sample plan.');
    }
  };

  return (
    <section className="grid gap-2 border-t-2 border-slate-200 pt-4">
      <h2 className="font-bold">Save and load</h2>
      <p className="text-sm text-slate-600">Your plan is saved in this browser automatically.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={exportPlan} className={buttonClass}>
          Export JSON
        </button>
        <button type="button" onClick={() => fileInput.current?.click()} className={buttonClass}>
          Import JSON
        </button>
        <button type="button" onClick={reset} className={buttonClass}>
          Reset
        </button>
      </div>
      <input ref={fileInput} type="file" accept="application/json,.json" onChange={importPlan} className="hidden" />
      {message && (
        <p role="status" className="text-sm text-slate-700">
          {message}
        </p>
      )}
    </section>
  );
}