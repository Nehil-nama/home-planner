import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type Konva from 'konva';
import { Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import { fit, MIN_SIZE } from '../model/geometry';
import { checkPlan } from '../model/rules';
import { usePlanner } from '../model/store';
import { ROOM_COLORS } from '../model/types';

const PAD = 24; // pixels of margin around the plot

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}

export function Editor2D() {
  const plan = usePlanner((s) => s.plan);
  const selectedId = usePlanner((s) => s.selectedId);
  const select = usePlanner((s) => s.select);
  const updateRoom = usePlanner((s) => s.updateRoom);

  const [containerRef, size] = useElementSize<HTMLDivElement>();
  const nodes = useRef<Record<string, Konva.Rect | null>>({});
  const transformer = useRef<Konva.Transformer>(null);

  const { plot, rooms } = plan;

  // rooms with at least one issue get an amber dashed outline
  const flagged = useMemo(() => new Set(checkPlan(plan).map((i) => i.roomId)), [plan]);

  // pixels per foot, chosen so the whole plot fits the available space
  const scale =
    size.width > 0
      ? Math.max(4, Math.min((size.width - 2 * PAD) / plot.width, (size.height - 2 * PAD) / plot.depth))
      : 10;

  // attach the resize handles to the selected room
  useEffect(() => {
    const tr = transformer.current;
    if (!tr) return;
    const node = selectedId ? (nodes.current[selectedId] ?? null) : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedId, rooms.length]);

  const deselectOnEmpty = (e: Konva.KonvaEventObject<Event>) => {
    if (e.target === e.target.getStage() || e.target.name() === 'plot') select(null);
  };

  // faint grid: one line per foot, stronger every 5 feet
  const gridLines = [];
  for (let i = 0; i <= plot.width; i++) {
    gridLines.push(
      <Line
        key={`v${i}`}
        points={[i * scale, 0, i * scale, plot.depth * scale]}
        stroke={i % 5 === 0 ? '#c3ccd8' : '#e3e8ef'}
        strokeWidth={1}
        listening={false}
      />,
    );
  }
  for (let j = 0; j <= plot.depth; j++) {
    gridLines.push(
      <Line
        key={`h${j}`}
        points={[0, j * scale, plot.width * scale, j * scale]}
        stroke={j % 5 === 0 ? '#c3ccd8' : '#e3e8ef'}
        strokeWidth={1}
        listening={false}
      />,
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden bg-slate-50">
      {size.width > 0 && (
        <Stage
          width={size.width}
          height={size.height}
          onMouseDown={deselectOnEmpty}
          onTouchStart={deselectOnEmpty}
        >
          <Layer x={PAD} y={PAD}>
            <Rect
              name="plot"
              width={plot.width * scale}
              height={plot.depth * scale}
              fill="#f7fbf2"
              stroke="#7a9a63"
              strokeWidth={2}
            />
            {gridLines}

            {rooms.map((room) => {
              const selected = room.id === selectedId;
              const hasIssue = flagged.has(room.id);
              return (
                <Fragment key={room.id}>
                  <Rect
                    ref={(node) => {
                      nodes.current[room.id] = node;
                    }}
                    x={room.x * scale}
                    y={room.y * scale}
                    width={room.width * scale}
                    height={room.depth * scale}
                    fill={ROOM_COLORS[room.kind]}
                    stroke={selected ? '#1f3a5f' : hasIssue ? '#b45309' : '#64748b'}
                    strokeWidth={selected ? 3 : 1.5}
                    dash={hasIssue && !selected ? [6, 4] : undefined}
                    draggable
                    onMouseDown={() => select(room.id)}
                    onTouchStart={() => select(room.id)}
                    onDragMove={(e) => {
                      const f = fit(plot, e.target.x() / scale, e.target.y() / scale, room.width, room.depth);
                      e.target.position({ x: f.x * scale, y: f.y * scale });
                      if (f.x !== room.x || f.y !== room.y) updateRoom(room.id, { x: f.x, y: f.y });
                    }}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      const f = fit(
                        plot,
                        node.x() / scale,
                        node.y() / scale,
                        (node.width() * node.scaleX()) / scale,
                        (node.height() * node.scaleY()) / scale,
                      );
                      node.scaleX(1);
                      node.scaleY(1);
                      node.position({ x: f.x * scale, y: f.y * scale });
                      updateRoom(room.id, f);
                    }}
                  />
                  <Text
                    x={room.x * scale}
                    y={room.y * scale}
                    width={room.width * scale}
                    height={room.depth * scale}
                    text={`${room.name}\n${room.width}×${room.depth} ft`}
                    align="center"
                    verticalAlign="middle"
                    fontSize={12}
                    fontStyle="bold"
                    fill="#1e293b"
                    listening={false}
                  />
                </Fragment>
              );
            })}

            <Transformer
              ref={transformer}
              rotateEnabled={false}
              flipEnabled={false}
              keepRatio={false}
              anchorSize={10}
              borderStroke="#1f3a5f"
              anchorStroke="#1f3a5f"
              boundBoxFunc={(oldBox, newBox) =>
                newBox.width < MIN_SIZE * scale || newBox.height < MIN_SIZE * scale ? oldBox : newBox
              }
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
}