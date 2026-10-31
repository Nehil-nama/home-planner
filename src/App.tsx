import { Editor2D } from './components/Editor2D';
import { Scene3D } from './components/Scene3D';
import { Sidebar } from './components/Sidebar';

export default function App() {
  return (
    <div className="grid h-screen grid-cols-[300px_minmax(0,1fr)_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] text-slate-900">
      <Sidebar />

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