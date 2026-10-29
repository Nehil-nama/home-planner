import { RoomList } from './components/RoomList';
import { Scene3D } from './components/Scene3D';

export default function App() {
  return (
    <div className="grid h-screen grid-cols-[320px_1fr] text-slate-900">
      <aside className="overflow-y-auto border-r-2 border-slate-200 p-4">
        <h1 className="mb-4 text-xl font-bold">Home Planner</h1>
        <RoomList />
      </aside>
      <main>
        <Scene3D />
      </main>
    </div>
  );
}