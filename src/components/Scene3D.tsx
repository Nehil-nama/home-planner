import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { usePlanner } from '../model/store';
import { ROOM_COLORS, type Room } from '../model/types';

const WALL = 0.5; // wall thickness in feet

function Box(props: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={props.position} castShadow receiveShadow>
      <boxGeometry args={props.size} />
      <meshStandardMaterial color={props.color} />
    </mesh>
  );
}

function RoomMesh({ room, wallHeight }: { room: Room; wallHeight: number }) {
  const selectedId = usePlanner((s) => s.selectedId);
  const select = usePlanner((s) => s.select);
  const selected = selectedId === room.id;

  const { width: w, depth: d } = room;
  const h = wallHeight;
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
      <Box position={[0, h / 2, -d / 2 + WALL / 2]} size={[w, h, WALL]} color={wallColor} />
      <Box position={[0, h / 2, d / 2 - WALL / 2]} size={[w, h, WALL]} color={wallColor} />
      <Box position={[-w / 2 + WALL / 2, h / 2, 0]} size={[WALL, h, d - 2 * WALL]} color={wallColor} />
      <Box position={[w / 2 - WALL / 2, h / 2, 0]} size={[WALL, h, d - 2 * WALL]} color={wallColor} />
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