import { Link } from "react-router";
import {
  FiAlertTriangle,
  FiBox,
  FiDollarSign,
  FiPackage,
} from "react-icons/fi";
import { StatCard } from "../components/StatsCards";
import InventoryTable from "../components/InventoryTable";
import { useInventory } from "../context/InventoryContext";

export default function Dashboard() {
  const { items, stats } = useInventory();
  const recentLowStock = items
    .filter((i) => i.status !== "in_stock")
    .slice(0, 5);

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

      <div>
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
        <InventoryTable items={recentLowStock} />
      </div>
    </div>
  );
}
