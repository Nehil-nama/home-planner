import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type Konva from 'konva';
import { Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import { fit, MIN_SIZE } from '../model/geometry';
import { checkPlan } from '../model/rules';
import { usePlanner } from '../model/store';
import { ROOM_COLORS } from '../model/types';

const PAD = 40; // pixels of margin around the plot, room for the dimension lines

const INK = '#1f2850';
const VERDIGRIS = '#0f766e';
const AMBER = '#b45309';
const FONT = '"Jost Variable", sans-serif';

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

  // canvas text only uses a web font once it has loaded, so switch families when it's ready
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    document.fonts.load('700 12px "Jost Variable"').then(() => {
      if (!cancelled) setFontsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const family = fontsReady ? FONT : 'sans-serif';

  const { plot, rooms } = plan;

  // rooms with at least one issue get an amber dashed outline
  const flagged = useMemo(() => new Set(checkPlan(plan).map((i) => i.roomId)), [plan]);

  // pixels per foot, chosen so the whole plot fits the available space
  const scale =
    size.width > 0
      ? Math.max(4, Math.min((size.width - 2 * PAD) / plot.width, (size.height - 2 * PAD) / plot.depth))
      : 10;

  const plotW = plot.width * scale;
  const plotH = plot.depth * scale;

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
        points={[i * scale, 0, i * scale, plotH]}
        stroke={i % 5 === 0 ? '#cbd2d8' : '#e3e7ea'}
        strokeWidth={1}
        listening={false}
      />,
    );
  }
  for (let j = 0; j <= plot.depth; j++) {
    gridLines.push(
      <Line
        key={`h${j}`}
        points={[0, j * scale, plotW, j * scale]}
        stroke={j % 5 === 0 ? '#cbd2d8' : '#e3e7ea'}
        strokeWidth={1}
        listening={false}
      />,
    );
  }

  const dim = { stroke: INK, strokeWidth: 1, listening: false } as const;

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
              width={plotW}
              height={plotH}
              fill="#f8f9f7"
              stroke={INK}
              strokeWidth={2}
            />
            {gridLines}

            {/* overall dimensions along the top and left, drawn like a drafting sheet */}
            <Line points={[0, -4, 0, -20]} {...dim} />
            <Line points={[plotW, -4, plotW, -20]} {...dim} />
            <Line points={[0, -14, plotW, -14]} {...dim} />
            <Line points={[-4, -10, 4, -18]} {...dim} strokeWidth={2} />
            <Line points={[plotW - 4, -10, plotW + 4, -18]} {...dim} strokeWidth={2} />
            <Text
              x={0}
              y={-35}
              width={plotW}
              align="center"
              text={`${plot.width} ft`}
              fontFamily={family}
              fontStyle="bold"
              fontSize={12}
              fill={INK}
              listening={false}
            />

            <Line points={[-4, 0, -20, 0]} {...dim} />
            <Line points={[-4, plotH, -20, plotH]} {...dim} />
            <Line points={[-14, 0, -14, plotH]} {...dim} />
            <Line points={[-18, 4, -10, -4]} {...dim} strokeWidth={2} />
            <Line points={[-18, plotH + 4, -10, plotH - 4]} {...dim} strokeWidth={2} />
            <Text
              x={-35}
              y={plotH}
              width={plotH}
              rotation={-90}
              align="center"
              text={`${plot.depth} ft`}
              fontFamily={family}
              fontStyle="bold"
              fontSize={12}
              fill={INK}
              listening={false}
            />

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
                    stroke={selected ? VERDIGRIS : hasIssue ? AMBER : INK}
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
                    text={`${room.name}\n${room.width} × ${room.depth} ft`}
                    align="center"
                    verticalAlign="middle"
                    fontFamily={family}
                    fontStyle="bold"
                    fontSize={12}
                    lineHeight={1.3}
                    fill={INK}
                    listening={false}
                  />
                  {room.openings.map((o) => {
                    const x0 = room.x * scale;
                    const y0 = room.y * scale;
                    const from = o.offset * scale;
                    const to = (o.offset + o.width) * scale;
                    const points =
                      o.side === 'top'
                        ? [x0 + from, y0, x0 + to, y0]
                        : o.side === 'bottom'
                          ? [x0 + from, y0 + room.depth * scale, x0 + to, y0 + room.depth * scale]
                          : o.side === 'left'
                            ? [x0, y0 + from, x0, y0 + to]
                            : [x0 + room.width * scale, y0 + from, x0 + room.width * scale, y0 + to];
                    return (
                      <Line
                        key={o.id}
                        points={points}
                        stroke={o.kind === 'door' ? '#7c4a1e' : '#0284c7'}
                        strokeWidth={6}
                        dash={o.kind === 'window' ? [5, 3] : undefined}
                        listening={false}
                      />
                    );
                  })}
                </Fragment>
              );
            })}

            <Transformer
              ref={transformer}
              rotateEnabled={false}
              flipEnabled={false}
              keepRatio={false}
              anchorSize={10}
              anchorFill="#ffffff"
              anchorCornerRadius={1}
              borderStroke={VERDIGRIS}
              anchorStroke={VERDIGRIS}
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