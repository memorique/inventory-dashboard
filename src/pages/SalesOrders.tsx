import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  FiDollarSign,
  FiLock,
  FiPlus,
  FiSearch,
  FiSend,
  FiShoppingBag,
} from "react-icons/fi";
import { StatCard } from "../components/StatsCards";
import { usePermission } from "../context/AuthContext";
import { useSales } from "../context/SalesContext";
import type { SalesOrderStatus } from "../types/inventory";
import {
  getSoTotal,
  getSoUnits,
  soStatusLabels,
  soStatusStyles,
} from "../utils/sales";

const statusFilters: { value: SalesOrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "To ship" },
  { value: "shipped", label: "Shipped" },
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

function isOverdue(shipBy: string | null, status: SalesOrderStatus) {
  if (!shipBy || status !== "confirmed") return false;
  return shipBy < new Date().toISOString().slice(0, 10);
}

export default function SalesOrders() {
  const { salesOrders, stats } = useSales();
  const { canManageSalesOrders } = usePermission();
  const [filter, setFilter] = useState<SalesOrderStatus | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return salesOrders.filter((so) => {
      if (filter !== "all" && so.status !== filter) return false;
      if (!q) return true;
      return (
        so.orderNumber.toLowerCase().includes(q) ||
        so.customerName.toLowerCase().includes(q) ||
        so.lines.some((l) => l.sku.toLowerCase().includes(q))
      );
    });
  }, [salesOrders, filter, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales orders</h1>
          <p className="text-sm text-slate-500 mt-1">
            Reserve stock for customers and ship it out
          </p>
        </div>
        {canManageSalesOrders ? (
          <Link
            to="/dashboard/sales-orders/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shrink-0"
          >
            <FiPlus size={16} />
            New sales order
          </Link>
        ) : (
          <span
            title="Managers and admins can create sales orders"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium shrink-0 opacity-40 cursor-not-allowed"
          >
            <FiPlus size={16} />
            New sales order
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Ready to ship"
          value={String(stats.toShipCount)}
          sub={`${stats.draftCount} draft awaiting confirmation`}
          icon={<FiSend size={20} />}
          accent="teal"
        />
        <StatCard
          label="Units reserved"
          value={stats.reservedUnits.toLocaleString()}
          sub="Held for confirmed orders"
          icon={<FiLock size={20} />}
          accent="amber"
        />
        <StatCard
          label="Shipped revenue"
          value={`$${stats.shippedValue.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}`}
          sub={`${stats.shippedCount} order${stats.shippedCount !== 1 ? "s" : ""} · $${stats.openValue.toLocaleString(
            undefined,
            { maximumFractionDigits: 0 }
          )} open`}
          icon={<FiDollarSign size={20} />}
          accent="slate"
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
            placeholder="Order #, customer, SKU…"
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FiShoppingBag size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No sales orders</p>
          <p className="text-sm text-slate-500 mt-1">
            {salesOrders.length === 0
              ? "Create an order to reserve stock for a customer."
              : "Try a different filter or search."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="px-4 py-3 font-semibold">Order #</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Items</th>
                  <th className="px-4 py-3 font-semibold text-right">Units</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                  <th className="px-4 py-3 font-semibold">Ship by</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((so) => (
                  <tr
                    key={so.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">
                      {so.orderNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {so.customerName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${soStatusStyles[so.status]}`}
                      >
                        {soStatusLabels[so.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {so.lines.length}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {getSoUnits(so).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                      ${getSoTotal(so).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className={`px-4 py-3 text-xs whitespace-nowrap ${
                        isOverdue(so.shipBy, so.status)
                          ? "text-rose-600 font-medium"
                          : "text-slate-500"
                      }`}
                    >
                      {formatDate(so.shipBy)}
                      {isOverdue(so.shipBy, so.status) && " · overdue"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/dashboard/sales-orders/${so.id}`}
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
