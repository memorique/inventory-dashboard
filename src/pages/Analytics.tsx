import { useCallback, useMemo, useRef, useState } from "react";
import { FiTrendingUp } from "react-icons/fi";
import StockChart from "../components/StockChart";
import { useInventory } from "../context/InventoryContext";
import type { StockEvent, StockEventType } from "../types/inventory";
import { generateStockHistory } from "../utils/stockHistory";

const eventLabels: Record<StockEventType, string> = {
  restock: "Stock added",
  reorder: "Reorder",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

const eventStyles: Record<StockEventType, string> = {
  restock: "bg-teal-50 text-teal-700 border-teal-100",
  reorder: "bg-violet-50 text-violet-700 border-violet-100",
  low_stock: "bg-amber-50 text-amber-800 border-amber-200",
  out_of_stock: "bg-rose-50 text-rose-700 border-rose-200",
};

function formatEventDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Analytics() {
  const { items } = useInventory();
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const eventRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const selectedItem = items.find((i) => i.id === selectedId) ?? items[0];

  const { points, events } = useMemo(
    () => (selectedItem ? generateStockHistory(selectedItem) : { points: [], events: [] }),
    [selectedItem]
  );

  const handleMarkerClick = useCallback((eventId: string) => {
    const el = eventRefs.current.get(eventId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedId(eventId);
      setTimeout(() => setHighlightedId(null), 2000);
    }
  }, []);

  if (!selectedItem) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FiTrendingUp size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No products available</p>
          <p className="text-sm text-slate-500 mt-1">
            Add products to your inventory to view stock analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track stock levels and events over time for any product
          </p>
        </div>
        <div className="min-w-[240px]">
          <label htmlFor="product-select" className="sr-only">
            Select product
          </label>
          <select
            id="product-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.sku})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
          <p className="text-xs text-slate-500 font-medium">Current stock</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
            {selectedItem.quantity}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
          <p className="text-xs text-slate-500 font-medium">Reorder level</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
            {selectedItem.reorderLevel}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
          <p className="text-xs text-slate-500 font-medium">Category</p>
          <p className="text-sm font-semibold text-slate-900 mt-1">
            {selectedItem.category}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
          <p className="text-xs text-slate-500 font-medium">Events (90 days)</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
            {events.length}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">
          Stock level — last 90 days
        </h2>
        <StockChart
          points={points}
          events={events}
          reorderLevel={selectedItem.reorderLevel}
          onMarkerClick={handleMarkerClick}
        />
      </div>

      {/* Events list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Stock events</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click a marker on the chart to jump to the matching event
          </p>
        </div>

        {events.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No stock events recorded for this period.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
            {events.map((event: StockEvent) => (
              <div
                key={event.id}
                ref={(el) => {
                  if (el) eventRefs.current.set(event.id, el);
                  else eventRefs.current.delete(event.id);
                }}
                className={`px-4 sm:px-6 py-4 flex items-start gap-4 transition-colors ${
                  highlightedId === event.id
                    ? "bg-brand-50 ring-2 ring-inset ring-brand-500"
                    : "hover:bg-slate-50/80"
                }`}
              >
                <div className="shrink-0 w-28 text-xs text-slate-500 pt-0.5">
                  {formatEventDate(event.date)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${eventStyles[event.type]}`}
                    >
                      {eventLabels[event.type]}
                    </span>
                    {event.delta != null && (
                      <span className="text-xs font-medium text-teal-700 tabular-nums">
                        +{event.delta} units
                      </span>
                    )}
                    <span className="text-xs text-slate-400 tabular-nums">
                      Qty: {event.quantity}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-1">{event.note}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
