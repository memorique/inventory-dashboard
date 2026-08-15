import { useMemo, useState } from "react";
import { Link } from "react-router";
import { FiMapPin, FiPackage, FiSearch } from "react-icons/fi";
import { StatCard } from "../components/StatsCards";
import StatusBadge from "../components/StatusBadge";
import { useInventory } from "../context/InventoryContext";
import { getWarehouseSummaries } from "../utils/locations";

export default function Locations() {
  const { items } = useInventory();
  const [search, setSearch] = useState("");
  const [expandedWarehouse, setExpandedWarehouse] = useState<string | null>(
    null
  );

  const warehouses = useMemo(() => getWarehouseSummaries(items), [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return warehouses;

    return warehouses
      .map((wh) => {
        const matchingBins = wh.bins
          .map((bin) => ({
            ...bin,
            items: bin.items.filter(
              (item) =>
                item.name.toLowerCase().includes(q) ||
                item.sku.toLowerCase().includes(q) ||
                bin.bin.toLowerCase().includes(q) ||
                wh.warehouse.toLowerCase().includes(q)
            ),
          }))
          .filter((bin) => bin.items.length > 0);

        if (matchingBins.length === 0) return null;

        const allItems = matchingBins.flatMap((b) => b.items);
        return {
          ...wh,
          bins: matchingBins,
          itemCount: allItems.length,
          totalUnits: allItems.reduce((s, i) => s + i.quantity, 0),
          totalValue: allItems.reduce(
            (s, i) => s + i.quantity * i.unitPrice,
            0
          ),
          lowStockCount: allItems.filter((i) => i.status !== "in_stock")
            .length,
        };
      })
      .filter(Boolean) as typeof warehouses;
  }, [warehouses, search]);

  const totalBins = warehouses.reduce((s, wh) => s + wh.bins.length, 0);
  const totalLowStock = warehouses.reduce((s, wh) => s + wh.lowStockCount, 0);

  function toggleWarehouse(name: string) {
    setExpandedWarehouse((prev) => (prev === name ? null : name));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Locations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Browse inventory by warehouse and shelf or bin
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Warehouses"
          value={String(warehouses.length)}
          sub="Active storage zones"
          icon={<FiMapPin size={20} />}
          accent="teal"
        />
        <StatCard
          label="Storage bins"
          value={String(totalBins)}
          sub="Shelves, racks, and bins"
          icon={<FiPackage size={20} />}
          accent="slate"
        />
        <StatCard
          label="Needs attention"
          value={String(totalLowStock)}
          sub="Low or out of stock"
          icon={<FiMapPin size={20} />}
          accent="amber"
        />
      </div>

      <div className="relative max-w-md">
        <FiSearch
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          type="search"
          placeholder="Search warehouse, bin, SKU, or product…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          No locations match your search.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((wh) => {
            const isExpanded =
              expandedWarehouse === wh.warehouse || search.trim() !== "";

            return (
              <div
                key={wh.warehouse}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleWarehouse(wh.warehouse)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
                      <FiMapPin size={18} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900">
                        {wh.warehouse}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {wh.bins.length} bin{wh.bins.length !== 1 ? "s" : ""} ·{" "}
                        {wh.itemCount} SKU{wh.itemCount !== 1 ? "s" : ""} ·{" "}
                        {wh.totalUnits.toLocaleString()} units
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {wh.lowStockCount > 0 && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                        {wh.lowStockCount} alert
                        {wh.lowStockCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="text-sm font-medium text-slate-700 tabular-nums">
                      ${wh.totalValue.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                    <span className="text-slate-400 text-lg leading-none">
                      {isExpanded ? "−" : "+"}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {wh.bins.map((bin) => (
                      <div key={bin.fullLocation} className="px-5 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-slate-800">
                            {bin.bin}
                          </p>
                          <p className="text-xs text-slate-500">
                            {bin.itemCount} item
                            {bin.itemCount !== 1 ? "s" : ""} ·{" "}
                            {bin.totalUnits} units · $
                            {bin.totalValue.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </p>
                        </div>
                        <ul className="space-y-2">
                          {bin.items.map((item) => (
                            <li
                              key={item.id}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <div className="min-w-0">
                                <Link
                                  to={`/dashboard/inventory/${item.id}/edit`}
                                  className="font-medium text-slate-900 hover:text-brand-700 truncate block"
                                >
                                  {item.name}
                                </Link>
                                <p className="text-xs text-slate-500 font-mono">
                                  {item.sku}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="tabular-nums text-slate-600">
                                  {item.quantity} units
                                </span>
                                <StatusBadge status={item.status} />
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
