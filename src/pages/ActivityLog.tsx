import { FiClock, FiDownload, FiRotateCcw } from "react-icons/fi";
import { Link } from "react-router";
import type { ActivityEntry } from "../types/inventory";
import { useInventory } from "../context/InventoryContext";
import { useProcurement } from "../context/ProcurementContext";

const actionLabels: Record<ActivityEntry["action"], string> = {
  restock: "Restock",
  sale: "Sale",
  adjustment: "Adjustment",
  add: "New product",
  receive: "PO received",
};

const actionStyles: Record<ActivityEntry["action"], string> = {
  restock: "bg-teal-50 text-teal-700 border-teal-100",
  sale: "bg-amber-50 text-amber-700 border-amber-100",
  adjustment: "bg-slate-100 text-slate-700 border-slate-200",
  add: "bg-violet-50 text-violet-700 border-violet-100",
  receive: "bg-brand-50 text-brand-700 border-brand-100",
};

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function exportActivityCsv(activity: ActivityEntry[]) {
  const headers = [
    "Timestamp",
    "SKU",
    "Product",
    "Action",
    "Previous Qty",
    "New Qty",
    "Change",
    "User",
  ];
  const rows = activity.map((e) => [
    e.timestamp,
    e.sku,
    e.itemName,
    e.action,
    e.previousQty,
    e.newQty,
    e.change,
    e.userName,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ActivityLog() {
  const { activity, resetInventory } = useInventory();
  const { resetProcurement } = useProcurement();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity log</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track stock changes made from the inventory page
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activity.length > 0 && (
            <button
              type="button"
              onClick={() => exportActivityCsv(activity)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <FiDownload size={16} />
              Export CSV
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Reset all inventory, suppliers, and purchase orders to default sample data and clear activity?"
                )
              ) {
                resetInventory();
                resetProcurement();
              }
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FiRotateCcw size={16} />
            Reset data
          </button>
        </div>
      </div>

      {activity.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FiClock size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No activity yet</p>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Adjust stock quantities on the{" "}
            <Link
              to="/dashboard/inventory"
              className="text-brand-700 hover:text-brand-800 font-medium"
            >
              Inventory
            </Link>{" "}
            page to see changes logged here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold text-right">Change</th>
                  <th className="px-4 py-3 font-semibold text-right">Qty</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activity.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{entry.itemName}</p>
                      <p className="text-xs text-slate-500 font-mono">{entry.sku}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${actionStyles[entry.action]}`}
                      >
                        {actionLabels[entry.action]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      <span
                        className={
                          entry.change > 0 ? "text-teal-700" : "text-amber-700"
                        }
                      >
                        {entry.change > 0 ? "+" : ""}
                        {entry.change}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {entry.previousQty} → {entry.newQty}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{entry.userName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
