import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { FiCheckSquare, FiRefreshCw } from "react-icons/fi";
import { StatCard } from "../components/StatsCards";
import StatusBadge from "../components/StatusBadge";
import { useInventory } from "../context/InventoryContext";
import { parseWarehouse } from "../utils/locations";

export default function StockCount() {
  const { items, applyStockCounts } = useInventory();
  const [warehouse, setWarehouse] = useState("all");
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const warehouses = useMemo(
    () =>
      [...new Set(items.map((i) => parseWarehouse(i.location)))].sort(),
    [items]
  );

  const scopedItems = useMemo(() => {
    const list =
      warehouse === "all"
        ? items
        : items.filter((i) => parseWarehouse(i.location) === warehouse);
    return [...list].sort((a, b) => a.location.localeCompare(b.location));
  }, [items, warehouse]);

  useEffect(() => {
    setCounts((prev) => {
      const next: Record<string, string> = {};
      for (const item of scopedItems) {
        next[item.id] =
          prev[item.id] !== undefined ? prev[item.id] : String(item.quantity);
      }
      return next;
    });
  }, [scopedItems]);

  const variances = useMemo(() => {
    return scopedItems
      .map((item) => {
        const raw = counts[item.id];
        if (raw === undefined || raw === "") return null;
        const counted = Number(raw);
        if (Number.isNaN(counted)) return null;
        const variance = counted - item.quantity;
        if (variance === 0) return null;
        return { item, counted, variance };
      })
      .filter(Boolean) as {
      item: (typeof scopedItems)[number];
      counted: number;
      variance: number;
    }[];
  }, [scopedItems, counts]);

  const varianceUnits = variances.reduce(
    (sum, v) => sum + Math.abs(v.variance),
    0
  );

  function fillFromSystem() {
    const next: Record<string, string> = {};
    for (const item of scopedItems) {
      next[item.id] = String(item.quantity);
    }
    setCounts(next);
    setMessage("");
  }

  function handleApply() {
    if (variances.length === 0) {
      setMessage("No count differences to apply.");
      return;
    }

    const applied = applyStockCounts(
      variances.map((v) => ({
        itemId: v.item.id,
        countedQty: v.counted,
      }))
    );

    setMessage(
      applied === 1
        ? "Applied 1 stock count adjustment."
        : `Applied ${applied} stock count adjustments.`
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock count</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter physical counts and apply variances to system stock
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={fillFromSystem}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FiRefreshCw size={16} />
            Reset to system qty
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={variances.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <FiCheckSquare size={16} />
            Apply counts
            {variances.length > 0 ? ` (${variances.length})` : ""}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Items to count"
          value={String(scopedItems.length)}
          sub={warehouse === "all" ? "All warehouses" : warehouse}
          icon={<FiCheckSquare size={20} />}
          accent="teal"
        />
        <StatCard
          label="Variances"
          value={String(variances.length)}
          sub="Items that differ from system"
          icon={<FiCheckSquare size={20} />}
          accent="amber"
        />
        <StatCard
          label="Unit difference"
          value={String(varianceUnits)}
          sub="Absolute units out of sync"
          icon={<FiCheckSquare size={20} />}
          accent="slate"
        />
      </div>

      {message && (
        <p className="text-sm text-brand-800 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
          {message}{" "}
          {variances.length === 0 && message.startsWith("Applied") && (
            <Link
              to="/dashboard/activity"
              className="font-medium text-brand-700 hover:text-brand-800"
            >
              View activity →
            </Link>
          )}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={warehouse}
          onChange={(e) => {
            setWarehouse(e.target.value);
            setMessage("");
          }}
          className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="all">All warehouses</option>
          {warehouses.map((wh) => (
            <option key={wh} value={wh}>
              {wh}
            </option>
          ))}
        </select>
      </div>

      {scopedItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          No items in this warehouse.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">
                    System qty
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">
                    Counted qty
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">
                    Variance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scopedItems.map((item) => {
                  const raw = counts[item.id] ?? "";
                  const counted = raw === "" ? NaN : Number(raw);
                  const variance = Number.isNaN(counted)
                    ? null
                    : counted - item.quantity;

                  return (
                    <tr
                      key={item.id}
                      className={
                        variance !== null && variance !== 0
                          ? "bg-amber-50/40"
                          : "hover:bg-slate-50/80"
                      }
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500 font-mono">
                          {item.sku}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {item.location}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={raw}
                          onChange={(e) => {
                            setCounts((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }));
                            setMessage("");
                          }}
                          className="w-24 ml-auto block rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {variance === null ? (
                          <span className="text-slate-400">—</span>
                        ) : variance === 0 ? (
                          <span className="text-slate-400">0</span>
                        ) : (
                          <span
                            className={
                              variance > 0 ? "text-teal-700" : "text-rose-700"
                            }
                          >
                            {variance > 0 ? "+" : ""}
                            {variance}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
