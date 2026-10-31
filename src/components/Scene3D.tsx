import type { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { WALL_THICKNESS as WALL } from '../model/geometry';
import { usePlanner } from '../model/store';
import { ROOM_COLORS, SIDES, type Room, type Side } from '../model/types';

const OPENING_TOP = 7; // feet: top edge of doors and windows
const WINDOW_SILL = 3; // feet: bottom edge of windows

function Box(props: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  glass?: boolean;
}) {
  return (
    <mesh position={props.position} castShadow={!props.glass} receiveShadow>
      <boxGeometry args={props.size} />
      <meshStandardMaterial
        color={props.color}
        transparent={props.glass}
        opacity={props.glass ? 0.4 : 1}
      />
    </mesh>
  );
}

// One wall of a room, built from blocks around its doors and windows
function Wall(props: { room: Room; side: Side; height: number; color: string }) {
  const { room, side, height, color } = props;
  const { width: w, depth: d } = room;

  const horizontal = side === 'top' || side === 'bottom';
  const length = horizontal ? w : d;
  // side walls sit between the top and bottom walls, so they skip the corners
  const start = horizontal ? 0 : WALL;
  const end = horizontal ? w : d - WALL;

  // where the wall sits across its thickness, relative to the room centre
  const across =
    side === 'top'
      ? -d / 2 + WALL / 2
      : side === 'bottom'
        ? d / 2 - WALL / 2
        : side === 'left'
          ? -w / 2 + WALL / 2
          : w / 2 - WALL / 2;

  // a block covering [t0, t1] along the wall and [y0, y1] in height
  const block = (
    key: string,
    t0: number,
    t1: number,
    y0: number,
    y1: number,
    opts?: { color?: string; glass?: boolean },
  ) => {
    const along = t1 - t0;
    const tall = y1 - y0;
    if (along < 0.01 || tall < 0.01) return null;

    const mid = t0 + along / 2 - length / 2;
    const y = y0 + tall / 2;
    const thickness = opts?.glass ? 0.1 : WALL;
    const position: [number, number, number] = horizontal ? [mid, y, across] : [across, y, mid];
    const size: [number, number, number] = horizontal
      ? [along, tall, thickness]
      : [thickness, tall, along];

    return (
      <Box key={key} position={position} size={size} color={opts?.color ?? color} glass={opts?.glass} />
    );
  };

  const openings = room.openings.filter((o) => o.side === side).sort((a, b) => a.offset - b.offset);

  const parts: ReactNode[] = [];
  let cursor = start;

  for (const o of openings) {
    const a = Math.max(o.offset, start);
    const b = Math.min(o.offset + o.width, end);
    if (b <= a) continue;

    parts.push(block(`solid-${o.id}`, cursor, a, 0, height)); // wall before the opening
    parts.push(block(`lintel-${o.id}`, a, b, OPENING_TOP, height)); // wall above it

    if (o.kind === 'window') {
      parts.push(block(`sill-${o.id}`, a, b, 0, WINDOW_SILL));
      parts.push(
        block(`glass-${o.id}`, a, b, WINDOW_SILL, OPENING_TOP, { color: '#9ad1ff', glass: true }),
      );
    }
    cursor = Math.max(cursor, b);
  }
  parts.push(block('rest', cursor, end, 0, height));

  return <>{parts}</>;
}

function RoomMesh({ room, wallHeight }: { room: Room; wallHeight: number }) {
  const selectedId = usePlanner((s) => s.selectedId);
  const select = usePlanner((s) => s.select);
  const selected = selectedId === room.id;

  const { width: w, depth: d } = room;
  const wallColor = selected ? '#ffd166' : '#f1eee8';

  return (
    <group
      position={[room.x + w / 2, 0, room.y + d / 2]}
      onClick={(e) => {
        e.stopPropagation();
        select(room.id);
      }}
    >
      <Box position={[0, 0.05, 0]} size={[w, 0.1, d]} color={ROOM_COLORS[room.kind]} />
      {SIDES.map((side) => (
        <Wall key={side} room={room} side={side} height={wallHeight} color={wallColor} />
      ))}
      <Html position={[0, 0.3, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="whitespace-nowrap rounded bg-white/85 px-2 py-0.5 text-xs font-bold text-slate-800">
          {room.name}
        </div>
      </Html>
    </group>
  );
}

export function Scene3D() {
  const plan = usePlanner((s) => s.plan);
  const select = usePlanner((s) => s.select);
  const { plot, wallHeight, rooms } = plan;
  const cx = plot.width / 2;
  const cz = plot.depth / 2;

  return (
    <Canvas
      shadows
      camera={{ position: [cx + 35, 45, cz + 55], fov: 45 }}
      style={{ background: '#e8f0f7' }}
      onPointerMissed={() => select(null)}
    >
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[40, 70, 30]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* the plot itself */}
      <Box position={[cx, -0.1, cz]} size={[plot.width, 0.2, plot.depth]} color="#b9d3a5" />

      {rooms.map((room) => (
        <RoomMesh key={room.id} room={room} wallHeight={wallHeight} />
      ))}

      <OrbitControls makeDefault target={[cx, 0, cz]} maxPolarAngle={Math.PI / 2.05} />
    </Canvas>
  );
}