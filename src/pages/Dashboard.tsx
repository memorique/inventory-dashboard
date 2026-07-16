import { Link } from "react-router";
import {
  FiAlertTriangle,
  FiBox,
  FiClipboard,
  FiDollarSign,
  FiPackage,
  FiTruck,
} from "react-icons/fi";
import { StatCard } from "../components/StatsCards";
import InventoryTable from "../components/InventoryTable";
import { useInventory } from "../context/InventoryContext";
import { useProcurement } from "../context/ProcurementContext";
import {
  getPoTotal,
  getPoUnits,
  poStatusLabels,
  poStatusStyles,
} from "../utils/procurement";

export default function Dashboard() {
  const { items, stats } = useInventory();
  const { purchaseOrders, onOrderByItem, stats: poStats } = useProcurement();
  const recentLowStock = items
    .filter((i) => i.status !== "in_stock")
    .slice(0, 5);
  const openPos = purchaseOrders
    .filter((po) => po.status === "draft" || po.status === "ordered")
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Overview of your inventory (sample data)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total SKUs"
          value={String(stats.totalItems)}
          sub={`${stats.totalUnits.toLocaleString()} units on hand`}
          icon={<FiPackage size={20} />}
          accent="teal"
        />
        <StatCard
          label="Inventory value"
          value={`$${stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub="Quantity × unit price"
          icon={<FiDollarSign size={20} />}
          accent="slate"
        />
        <StatCard
          label="Low stock"
          value={String(stats.lowStock)}
          sub="Below reorder level"
          icon={<FiAlertTriangle size={20} />}
          accent="amber"
        />
        <StatCard
          label="Out of stock"
          value={String(stats.outOfStock)}
          sub="Needs restock"
          icon={<FiBox size={20} />}
          accent="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Attention needed
            </h2>
            <Link
              to="/dashboard/reorders"
              className="text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              Reorder list →
            </Link>
          </div>
          <InventoryTable items={recentLowStock} onOrderByItem={onOrderByItem} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Incoming stock
            </h2>
            <Link
              to="/dashboard/purchase-orders"
              className="text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              All POs →
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                <FiTruck size={20} />
              </span>
              <div>
                <p className="text-2xl font-bold text-slate-900 leading-tight">
                  {poStats.onOrderUnits.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">
                  units on order · {poStats.openCount} open PO
                  {poStats.openCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {openPos.length === 0 ? (
              <div className="py-6 text-center">
                <FiClipboard
                  size={24}
                  className="mx-auto text-slate-300 mb-2"
                />
                <p className="text-sm text-slate-500">No open purchase orders</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {openPos.map((po) => (
                  <li key={po.id}>
                    <Link
                      to={`/dashboard/purchase-orders/${po.id}`}
                      className="flex items-center justify-between gap-2 py-3 group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate group-hover:text-brand-700">
                          {po.supplierName}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          {po.poNumber} · {getPoUnits(po)} units
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border ${poStatusStyles[po.status]}`}
                        >
                          {poStatusLabels[po.status]}
                        </span>
                        <span className="text-xs tabular-nums text-slate-600">
                          ${getPoTotal(po).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
