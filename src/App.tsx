import type { ReactNode } from 'react';
import { Editor2D } from './components/Editor2D';
import { Scene3D } from './components/Scene3D';
import { Sidebar } from './components/Sidebar';
import { usePlanner } from './model/store';

function PaneHeader(props: { id: string; title: string; hint: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b-2 border-slate-200 bg-sheet px-4 py-2">
      <h2 id={props.id}>{props.title}</h2>
      <p className="text-sm text-slate-600">{props.hint}</p>
    </div>
  );
}

function PaneFooter(props: { children: ReactNode }) {
  return (
    <footer className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t-2 border-slate-200 bg-sheet px-4 py-2 text-sm text-slate-600">
      {props.children}
    </footer>
  );
}

function Swatch(props: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <svg aria-hidden="true" width="28" height="8" viewBox="0 0 28 8">
        <line
          x1="0"
          y1="4"
          x2="28"
          y2="4"
          stroke={props.color}
          strokeWidth="5"
          strokeDasharray={props.dashed ? '5 3' : undefined}
        />
      </svg>
      {props.label}
    </span>
  );
}

export default function App() {
  const plan = usePlanner((s) => s.plan);
  const { plot, rooms, wallHeight } = plan;
  const summary = `${rooms.length} rooms on a ${plot.width} by ${plot.depth} foot plot. Use the Rooms tab to edit.`;

  return (
    <div className="grid h-screen grid-cols-[320px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] text-slate-900">
      <Sidebar />

      <main className="grid min-h-0 grid-cols-2">
        <section aria-labelledby="plan2d-title" className="flex min-h-0 flex-col border-r-2 border-slate-200">
          <PaneHeader
            id="plan2d-title"
            title="2D plan"
            hint="Drag a room to move it. Use its handles to resize."
          />
          <div role="img" aria-label={`2D floor plan: ${summary}`} className="relative min-h-0 flex-1">
            <div className="absolute inset-0">
              <Editor2D />
            </div>
          </div>
          <PaneFooter>
            <span>
              Plot {plot.width} by {plot.depth} ft ({plot.width * plot.depth} sq ft). One grid square is 1 ft.
            </span>
            <Swatch color="#7c4a1e" label="Door" />
            <Swatch color="#0284c7" label="Window" dashed />
          </PaneFooter>
        </section>

        <section aria-labelledby="view3d-title" className="flex min-h-0 flex-col">
          <PaneHeader
            id="view3d-title"
            title="3D view"
            hint="Drag to look around. Scroll to zoom. Click a room to select it."
          />
          <div role="img" aria-label={`3D model: ${summary}`} className="relative min-h-0 flex-1">
            <div className="absolute inset-0">
              <Scene3D />
            </div>
          </div>
          <PaneFooter>
            <span>Walls are {wallHeight} ft high.</span>
          </PaneFooter>
        </section>
      </main>
    </div>
  );
}