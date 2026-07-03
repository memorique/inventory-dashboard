import { useMemo, useState } from "react";
import type { StockEvent, StockPoint } from "../types/inventory";

interface StockChartProps {
  points: StockPoint[];
  events: StockEvent[];
  reorderLevel: number;
  onMarkerClick: (eventId: string) => void;
}

const W = 800;
const H = 320;
const PAD = { top: 24, right: 24, bottom: 40, left: 48 };

function formatShortDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function StockChart({
  points,
  events,
  reorderLevel,
  onMarkerClick,
}: StockChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const chartData = useMemo(() => {
    if (points.length === 0) return null;

    const maxQty = Math.max(
      ...points.map((p) => p.quantity),
      reorderLevel,
      1
    );
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;

    const xScale = (i: number) =>
      PAD.left + (i / Math.max(points.length - 1, 1)) * plotW;
    const yScale = (qty: number) =>
      PAD.top + plotH - (qty / maxQty) * plotH;

    const polyline = points
      .map((p, i) => `${xScale(i)},${yScale(p.quantity)}`)
      .join(" ");

    const yTicks = [0, Math.round(maxQty / 2), maxQty];

    const dateLabels = [
      { idx: 0, label: formatShortDate(points[0].date) },
      {
        idx: Math.floor((points.length - 1) / 2),
        label: formatShortDate(
          points[Math.floor((points.length - 1) / 2)].date
        ),
      },
      {
        idx: points.length - 1,
        label: formatShortDate(points[points.length - 1].date),
      },
    ];

    const stockAddedEvents = events.filter(
      (e) => e.type === "restock" || e.type === "reorder"
    );

    const markers = stockAddedEvents
      .map((event) => {
        const idx = points.findIndex((p) => p.date === event.date);
        if (idx === -1) return null;
        return {
          event,
          x: xScale(idx),
          y: yScale(points[idx].quantity),
        };
      })
      .filter(Boolean) as {
      event: StockEvent;
      x: number;
      y: number;
    }[];

    return {
      maxQty,
      plotW,
      plotH,
      xScale,
      yScale,
      polyline,
      yTicks,
      dateLabels,
      markers,
      reorderY: yScale(reorderLevel),
    };
  }, [points, events, reorderLevel]);

  if (!chartData) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        No data to display
      </div>
    );
  }

  const {
    plotW,
    plotH,
    xScale,
    yScale,
    polyline,
    yTicks,
    dateLabels,
    markers,
    reorderY,
  } = chartData;

  const hoveredMarker = markers.find((m) => m.event.id === hoveredId);

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Stock level over time"
      >
        {/* Gridlines */}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              y1={yScale(tick)}
              x2={PAD.left + plotW}
              y2={yScale(tick)}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={yScale(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-slate-400 text-[11px]"
              fontSize={11}
            >
              {tick}
            </text>
          </g>
        ))}

        {/* Low stock threshold line */}
        <line
          x1={PAD.left}
          y1={reorderY}
          x2={PAD.left + plotW}
          y2={reorderY}
          stroke="#f59e0b"
          strokeWidth={1.5}
          strokeDasharray="6 4"
        />
        <text
          x={PAD.left + plotW + 4}
          y={reorderY}
          dominantBaseline="middle"
          className="fill-amber-600 text-[10px]"
          fontSize={10}
        >
          Low stock
        </text>

        {/* Stock quantity line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#0d9488"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Area fill under line */}
        <polygon
          points={`${PAD.left},${PAD.top + plotH} ${polyline} ${PAD.left + plotW},${PAD.top + plotH}`}
          fill="#0d9488"
          fillOpacity={0.06}
        />

        {/* Stock added markers */}
        {markers.map(({ event, x, y }) => (
          <g key={event.id}>
            <circle
              cx={x}
              cy={y}
              r={hoveredId === event.id ? 8 : 6}
              fill="#0d9488"
              stroke="white"
              strokeWidth={2}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredId(event.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onMarkerClick(event.id)}
            />
          </g>
        ))}

        {/* X-axis date labels */}
        {dateLabels.map(({ idx, label }) => (
          <text
            key={idx}
            x={xScale(idx)}
            y={H - 8}
            textAnchor="middle"
            className="fill-slate-400 text-[11px]"
            fontSize={11}
          >
            {label}
          </text>
        ))}

        {/* Y-axis label */}
        <text
          x={12}
          y={PAD.top + plotH / 2}
          textAnchor="middle"
          transform={`rotate(-90, 12, ${PAD.top + plotH / 2})`}
          className="fill-slate-500 text-[11px]"
          fontSize={11}
        >
          Units
        </text>
      </svg>

      {/* Hover tooltip */}
      {hoveredMarker && (
        <div
          className="absolute pointer-events-none z-10 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(hoveredMarker.x / W) * 100}%`,
            top: `${(hoveredMarker.y / H) * 100}%`,
            marginTop: -12,
          }}
        >
          <p className="font-medium">
            {hoveredMarker.event.type === "reorder" ? "Reorder" : "Restock"}
          </p>
          <p className="text-slate-300 mt-0.5">
            {formatShortDate(hoveredMarker.event.date)}
          </p>
          {hoveredMarker.event.delta != null && (
            <p className="text-teal-300 mt-0.5">
              +{hoveredMarker.event.delta} units → {hoveredMarker.event.quantity}
            </p>
          )}
          <p className="text-slate-400 mt-1 text-[10px]">Click to view event</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-2 px-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 bg-brand-600 rounded" />
          Stock level
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-4 h-0 border-t-2 border-dashed border-amber-500" />
          Low stock threshold ({reorderLevel})
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-600 border-2 border-white shadow-sm" />
          Stock added
        </span>
      </div>
    </div>
  );
}
