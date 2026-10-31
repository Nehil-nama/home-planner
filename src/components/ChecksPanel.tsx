import { useMemo } from 'react';
import { builtArea, checkPlan } from '../model/rules';
import { usePlanner } from '../model/store';

export function ChecksPanel() {
  const plan = usePlanner((s) => s.plan);
  const select = usePlanner((s) => s.select);

  const issues = useMemo(() => checkPlan(plan), [plan]);
  const built = useMemo(() => builtArea(plan), [plan]);

  const plotArea = plan.plot.width * plan.plot.depth;
  const percent = plotArea > 0 ? Math.round((built / plotArea) * 100) : 0;

  return (
    <section className="grid gap-3 border-t-2 border-slate-200 pt-4">
      <h2 className="font-bold">Design checks</h2>
      <p className="text-sm text-slate-600">
        Built area: {built} of {plotArea} sq ft ({percent}% of the plot).
      </p>

      {issues.length === 0 ? (
        <p role="status" className="text-sm font-bold text-green-800">
          No problems found.
        </p>
      ) : (
        <ul className="grid gap-2">
          {issues.map((issue) => (
            <li key={issue.id}>
              <button
                type="button"
                onClick={() => select(issue.roomId)}
                className="grid w-full gap-0.5 rounded-md border-2 border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800"
              >
                <span className={issue.severity === 'error' ? 'font-bold text-red-700' : 'font-bold text-amber-800'}>
                  {issue.severity === 'error' ? 'Error' : 'Warning'}
                </span>
                <span>{issue.message}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-500">
        These are rough guidelines, not a building-code check. Confirm sizes, light and ventilation
        with your local bylaws and a licensed architect.
      </p>
    </section>
  );
}