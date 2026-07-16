import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  FiClipboard,
  FiDollarSign,
  FiPlus,
  FiTruck,
} from "react-icons/fi";
import { StatCard } from "../components/StatsCards";
import { useProcurement } from "../context/ProcurementContext";
import type { PurchaseOrderStatus } from "../types/inventory";
import {
  getPoTotal,
  getPoUnits,
  poStatusLabels,
  poStatusStyles,
} from "../utils/procurement";

const statusFilters: { value: PurchaseOrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "ordered", label: "Ordered" },
  { value: "received", label: "Received" },
  { value: "cancelled", label: "Cancelled" },
];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PurchaseOrders() {
  const { purchaseOrders, stats } = useProcurement();
  const [filter, setFilter] = useState<PurchaseOrderStatus | "all">("all");

  const filtered = useMemo(
    () =>
      filter === "all"
        ? purchaseOrders
        : purchaseOrders.filter((po) => po.status === filter),
    [purchaseOrders, filter]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase orders</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track procurement from draft to received
          </p>
        </div>
        <Link
          to="/dashboard/purchase-orders/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shrink-0"
        >
          <FiPlus size={16} />
          New purchase order
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Open orders"
          value={String(stats.openCount)}
          sub={`${stats.draftCount} draft · ${stats.orderedCount} ordered`}
          icon={<FiClipboard size={20} />}
          accent="teal"
        />
        <StatCard
          label="Units on order"
          value={stats.onOrderUnits.toLocaleString()}
          sub="Incoming stock"
          icon={<FiTruck size={20} />}
          accent="amber"
        />
        <StatCard
          label="Open order value"
          value={`$${stats.openValue.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}`}
          sub="Draft + ordered"
          icon={<FiDollarSign size={20} />}
          accent="slate"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              filter === value
                ? "bg-brand-700 text-white border-brand-700"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FiClipboard size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No purchase orders</p>
          <p className="text-sm text-slate-500 mt-1">
            Create one manually or generate them from the{" "}
            <Link
              to="/dashboard/reorders"
              className="text-brand-700 hover:text-brand-800 font-medium"
            >
              reorder list
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="px-4 py-3 font-semibold">PO #</th>
                  <th className="px-4 py-3 font-semibold">Supplier</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Items</th>
                  <th className="px-4 py-3 font-semibold text-right">Units</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                  <th className="px-4 py-3 font-semibold">Expected</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((po) => (
                  <tr
                    key={po.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">
                      {po.poNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {po.supplierName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${poStatusStyles[po.status]}`}
                      >
                        {poStatusLabels[po.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {po.lines.length}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {getPoUnits(po).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                      ${getPoTotal(po).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {formatDate(po.expectedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/dashboard/purchase-orders/${po.id}`}
                        className="text-sm font-medium text-brand-700 hover:text-brand-800"
                      >
                        View →
                      </Link>
                    </td>
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
