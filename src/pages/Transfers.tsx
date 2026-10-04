import { useMemo, useState } from "react";
import { Link } from "react-router";
import { FiMapPin, FiRepeat, FiSearch } from "react-icons/fi";
import { StatCard } from "../components/StatsCards";
import StatusBadge from "../components/StatusBadge";
import { useInventory } from "../context/InventoryContext";
import { parseWarehouse } from "../utils/locations";

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Transfers() {
  const { items, activity, transferItems } = useInventory();
  const [warehouse, setWarehouse] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [destination, setDestination] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const warehouses = useMemo(
    () =>
      [...new Set(items.map((i) => parseWarehouse(i.location)))].sort(),
    [items]
  );

  const locations = useMemo(
    () => [...new Set(items.map((i) => i.location))].sort(),
    [items]
  );

  const scopedItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter(
        (i) => warehouse === "all" || parseWarehouse(i.location) === warehouse
      )
      .filter(
        (i) =>
          !q ||
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q)
      )
      .sort((a, b) => a.location.localeCompare(b.location));
  }, [items, warehouse, search]);

  const selectedItems = items.filter((i) => selected.has(i.id));
  const selectedUnits = selectedItems.reduce((s, i) => s + i.quantity, 0);
  const recentTransfers = activity
    .filter((e) => e.action === "transfer")
    .slice(0, 10);

  const allScopedSelected =
    scopedItems.length > 0 && scopedItems.every((i) => selected.has(i.id));

  function toggle(itemId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
    setError("");
    setMessage("");
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const item of scopedItems) {
        if (allScopedSelected) next.delete(item.id);
        else next.add(item.id);
      }
      return next;
    });
    setError("");
    setMessage("");
  }

  function handleTransfer() {
    const moved = selectedItems.filter(
      (i) => i.location !== destination.trim()
    ).length;
    const err = transferItems([...selected], destination);
    if (err) {
      setError(err);
      setMessage("");
      return;
    }
    setError("");
    setMessage(
      `Moved ${moved} ${moved === 1 ? "product" : "products"} to ${destination.trim()}.`
    );
    setSelected(new Set());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Stock transfers</h1>
        <p className="text-sm text-slate-500 mt-1">
          Move products between warehouses and bins
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Selected products"
          value={String(selectedItems.length)}
          sub={`${selectedUnits} units to move`}
          icon={<FiRepeat size={20} />}
          accent="teal"
        />
        <StatCard
          label="Locations"
          value={String(locations.length)}
          sub={`Across ${warehouses.length} warehouses`}
          icon={<FiMapPin size={20} />}
          accent="slate"
        />
        <StatCard
          label="Recent transfers"
          value={String(recentTransfers.length)}
          sub="Last 10 shown below"
          icon={<FiRepeat size={20} />}
          accent="amber"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-end gap-3">
        <label className="flex-1 text-sm">
          <span className="block font-medium text-slate-700 mb-1">
            Destination location
          </span>
          <input
            list="transfer-locations"
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value);
              setError("");
              setMessage("");
            }}
            placeholder="e.g. Warehouse B · Rack 4"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
          <datalist id="transfer-locations">
            {locations.map((loc) => (
              <option key={loc} value={loc} />
            ))}
          </datalist>
        </label>
        <button
          type="button"
          onClick={handleTransfer}
          disabled={selected.size === 0 || !destination.trim()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <FiRepeat size={16} />
          Move selected
          {selected.size > 0 ? ` (${selected.size})` : ""}
        </button>
      </div>

      {error && (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {message && (
        <p className="text-sm text-brand-800 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
          {message}{" "}
          <Link
            to="/dashboard/activity"
            className="font-medium text-brand-700 hover:text-brand-800"
          >
            View activity →
          </Link>
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <select
          value={warehouse}
          onChange={(e) => setWarehouse(e.target.value)}
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
          No products match these filters.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allScopedSelected}
                      onChange={toggleAll}
                      aria-label="Select all"
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Current location</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scopedItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    className={`cursor-pointer ${
                      selected.has(item.id)
                        ? "bg-brand-50/50"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggle(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${item.name}`}
                        className="rounded border-slate-300"
                      />
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {recentTransfers.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">
              Recent transfers
            </h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {recentTransfers.map((entry) => (
              <li
                key={entry.id}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">{entry.itemName}</p>
                  <p className="text-xs text-slate-500">
                    {entry.fromLocation} → {entry.toLocation}
                  </p>
                </div>
                <p className="text-xs text-slate-500 whitespace-nowrap">
                  {entry.userName} · {formatTimestamp(entry.timestamp)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
