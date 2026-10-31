import { AddRoom } from './components/AddRoom';
import { Editor2D } from './components/Editor2D';
import { RoomList } from './components/RoomList';
import { RoomPanel } from './components/RoomPanel';
import { Scene3D } from './components/Scene3D';
import { FileActions } from './components/FileActions';
import { PlotPanel } from './components/PlotPanel';
import { ChecksPanel } from './components/ChecksPanel'
import { OpeningsPanel } from './components/OpeningPanel';

export default function App() {
  return (
    <div className="grid h-screen grid-cols-[280px_minmax(0,1fr)_minmax(0,1fr)] text-slate-900">
            <aside className="grid content-start gap-5 overflow-y-auto border-r-2 border-slate-200 p-4">
        <h1 className="text-xl font-bold">Home Planner</h1>
        <RoomList />
        <AddRoom />
        <RoomPanel />
        <OpeningsPanel />
        <ChecksPanel />
        <PlotPanel />
        <FileActions />
      </aside>

      <section className="relative h-full border-r-2 border-slate-200">
        <span className="pointer-events-none absolute left-3 top-2 z-10 text-xs font-bold text-slate-500">
        2D plan: drag to move, use the handles to resize. Brown line: door. Dashed blue line: window.
        </span>
        <Editor2D />
      </section>

      <main className="relative h-full">
        <span className="pointer-events-none absolute left-3 top-2 z-10 text-xs font-bold text-slate-600">
          3D view
        </span>
        <Scene3D />
      </main>
    </div>
  );
}