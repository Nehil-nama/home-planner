import { Editor2D } from './components/Editor2D';
import { Scene3D } from './components/Scene3D';
import { Sidebar } from './components/Sidebar';
import { usePlanner } from './model/store';

export default function App() {
  const plan = usePlanner((s) => s.plan);
  const summary = `${plan.rooms.length} rooms on a ${plan.plot.width} by ${plan.plot.depth} foot plot. Use the Rooms tab to edit.`;

  return (
    <div className="grid h-screen grid-cols-[300px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] text-slate-900">
      <Sidebar />

      <main className="grid min-h-0 grid-cols-2">
        <section aria-labelledby="plan2d-title" className="relative h-full border-r-2 border-slate-200">
          <h2 id="plan2d-title" className="sr-only">
            2D plan
          </h2>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-2 z-10 text-xs font-bold text-slate-600"
          >
            2D plan: drag to move, use the handles to resize. Brown line: door. Dashed blue line: window.
          </span>
          <div role="img" aria-label={`2D floor plan: ${summary}`} className="h-full">
            <Editor2D />
          </div>
        </section>

        <section aria-labelledby="view3d-title" className="relative h-full">
          <h2 id="view3d-title" className="sr-only">
            3D view
          </h2>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-2 z-10 text-xs font-bold text-slate-600"
          >
            3D view: drag to orbit, scroll to zoom
          </span>
          <div role="img" aria-label={`3D model: ${summary}`} className="h-full">
            <Scene3D />
          </div>
        </section>
      </main>
    </div>
  );
}