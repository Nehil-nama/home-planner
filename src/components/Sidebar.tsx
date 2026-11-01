import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { checkPlan } from '../model/rules';
import { usePlanner } from '../model/store';
import { AddRoom } from './AddRoom';
import { ChecksPanel } from './ChecksPanel';
import { FileActions } from './FileActions';
import { OpeningsPanel } from './OpeningPanel';
import { PlotPanel } from './PlotPanel';
import { RoomList } from './RoomList';
import { RoomPanel } from './RoomPanel';

const TABS = [
  { id: 'rooms', label: 'Rooms' },
  { id: 'checks', label: 'Checks' },
  { id: 'plan', label: 'Plot & file' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function Panel(props: { id: TabId; active: TabId; children: ReactNode }) {
  const isActive = props.id === props.active;
  return (
    <div
      role="tabpanel"
      id={`panel-${props.id}`}
      aria-labelledby={`tab-${props.id}`}
      hidden={!isActive}
      className={isActive ? 'grid content-start gap-5' : 'hidden'}
    >
      {props.children}
    </div>
  );
}

export function Sidebar() {
  const [active, setActive] = useState<TabId>('rooms');
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const plan = usePlanner((s) => s.plan);
  const issueCount = useMemo(() => checkPlan(plan).length, [plan]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.findIndex((t) => t.id === active);
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;

    e.preventDefault();
    const tab = TABS[next];
    if (!tab) return;
    setActive(tab.id);
    tabRefs.current[tab.id]?.focus();
  };

  return (
    <aside className="flex min-h-0 flex-col border-r-2 border-slate-200 bg-sheet">
      <header className="flex items-center gap-3 px-4 pt-4">
        <svg aria-hidden="true" viewBox="0 0 40 40" className="size-9 shrink-0">
          <rect width="40" height="40" rx="4" fill="#1f2850" />
          <path d="M7 20 20 9l13 11v11H7z" fill="#f8f9f7" />
          <rect x="17" y="22" width="6" height="9" fill="#0f766e" />
        </svg>
        <div>
          <h1>Home Planner</h1>
          <p className="text-sm text-slate-500">Plan a small home and check it as you draw.</p>
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Planner sections"
        onKeyDown={onKeyDown}
        className="mt-3 flex gap-0.5 border-b-2 border-slate-200 px-3"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={t.id === active}
            aria-controls={`panel-${t.id}`}
            tabIndex={t.id === active ? 0 : -1}
            onClick={() => setActive(t.id)}
            className="-mb-0.5 border-b-4 border-transparent px-3 py-2 font-display text-base font-medium text-slate-600 hover:text-slate-900 aria-selected:border-verdigris-600 aria-selected:text-slate-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-slate-800"
          >
            {t.label}
            {t.id === 'checks' && issueCount > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                {issueCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <Panel id="rooms" active={active}>
          <RoomList />
          <AddRoom />
          <RoomPanel />
          <OpeningsPanel />
        </Panel>

        <Panel id="checks" active={active}>
          {/* jump back to the Rooms tab when an issue is clicked, so the room's panel is visible */}
          <ChecksPanel onPick={() => setActive('rooms')} />
        </Panel>

        <Panel id="plan" active={active}>
          <PlotPanel />
          <FileActions />
        </Panel>
      </div>
    </aside>
  );
}