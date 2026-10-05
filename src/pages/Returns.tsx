import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  FiAlertOctagon,
  FiInbox,
  FiPlus,
  FiRotateCcw,
  FiSearch,
} from "react-icons/fi";
import { StatCard } from "../components/StatsCards";
import { usePermission } from "../context/AuthContext";
import { useReturns } from "../context/ReturnsContext";
import type { ReturnStatus } from "../types/inventory";
import {
  getReturnTotal,
  getReturnUnits,
  returnReasonLabels,
  returnStatusLabels,
  returnStatusStyles,
} from "../utils/returns";

const statusFilters: { value: ReturnStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "requested", label: "Awaiting receipt" },
  { value: "received", label: "Received" },
  { value: "rejected", label: "Rejected" },
];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(value: number) {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function Returns() {
  const { returns, stats } = useReturns();
  const { canManageReturns } = usePermission();
  const [filter, setFilter] = useState<ReturnStatus | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return returns.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return (
        r.rmaNumber.toLowerCase().includes(q) ||
        r.orderNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.lines.some((l) => l.sku.toLowerCase().includes(q))
      );
    });
  }, [returns, filter, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Returns</h1>
          <p className="text-sm text-slate-500 mt-1">
            Process customer returns — restock what's sellable, write off the
            rest
          </p>
        </div>
        {canManageReturns ? (
          <Link
            to="/dashboard/returns/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shrink-0"
          >
            <FiPlus size={16} />
            New return
          </Link>
        ) : (
          <span
            title="Managers and admins can create returns"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium shrink-0 opacity-40 cursor-not-allowed"
          >
            <FiPlus size={16} />
            New return
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Awaiting receipt"
          value={String(stats.openCount)}
          sub={`${stats.openUnits.toLocaleString()} units inbound from customers`}
          icon={<FiInbox size={20} />}
          accent="amber"
        />
        <StatCard
          label="Units restocked"
          value={stats.restockedUnits.toLocaleString()}
          sub={`${stats.receivedCount} return${stats.receivedCount !== 1 ? "s" : ""} processed`}
          icon={<FiRotateCcw size={20} />}
          accent="teal"
        />
        <StatCard
          label="Written off"
          value={formatMoney(stats.scrapValue)}
          sub={`of ${formatMoney(stats.refundValue)} refunded`}
          icon={<FiAlertOctagon size={20} />}
          accent="rose"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
        <div className="relative sm:ml-auto sm:w-64">
          <FiSearch
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="RMA #, order #, customer…"
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FiRotateCcw size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No returns</p>
          <p className="text-sm text-slate-500 mt-1">
            {returns.length === 0 ? (
              <>
                Returns are created against{" "}
                <Link
                  to="/dashboard/sales-orders"
                  className="text-brand-700 hover:text-brand-800 font-medium"
                >
                  shipped sales orders
                </Link>
                .
              </>
            ) : (
              "Try a different filter or search."
            )}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="px-4 py-3 font-semibold">RMA #</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Reason</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Units</th>
                  <th className="px-4 py-3 font-semibold text-right">Refund</th>
                  <th className="px-4 py-3 font-semibold">Opened</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">
                      {r.rmaNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {r.customerName}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/dashboard/sales-orders/${r.salesOrderId}`}
                        className="font-mono text-xs text-brand-700 hover:text-brand-800"
                      >
                        {r.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {returnReasonLabels[r.reason]}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${returnStatusStyles[r.status]}`}
                      >
                        {returnStatusLabels[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {getReturnUnits(r)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                      ${getReturnTotal(r).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/dashboard/returns/${r.id}`}
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
