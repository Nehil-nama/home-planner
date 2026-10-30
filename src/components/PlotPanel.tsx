import { usePlanner } from '../model/store';
import { NumberField } from './NumberField';

export function PlotPanel() {
  const plot = usePlanner((s) => s.plan.plot);
  const wallHeight = usePlanner((s) => s.plan.wallHeight);
  const setPlot = usePlanner((s) => s.setPlot);
  const setWallHeight = usePlanner((s) => s.setWallHeight);

  return (
    <section className="grid gap-3 border-t-2 border-slate-200 pt-4">
      <h2 className="font-bold">Plot</h2>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Width (ft)" value={plot.width} onCommit={(v) => setPlot({ width: v }).width} />
        <NumberField label="Depth (ft)" value={plot.depth} onCommit={(v) => setPlot({ depth: v }).depth} />
      </div>
      <NumberField label="Wall height (ft)" value={wallHeight} onCommit={setWallHeight} />
      <p className="text-sm text-slate-600">
        Plot area: {plot.width * plot.depth} sq ft. The plot can't shrink past the rooms on it.
      </p>
    </section>
  );
}