import { useMemo } from "react";
import { FiCheckCircle, FiPackage, FiShoppingCart } from "react-icons/fi";
import { StatCard } from "../components/StatsCards";
import StatusBadge from "../components/StatusBadge";
import { useInventory } from "../context/InventoryContext";
import { getReorderSuggestions } from "../utils/inventory";

export default function ReorderList() {
  const { items, adjustStock } = useInventory();

  const suggestions = useMemo(() => getReorderSuggestions(items), [items]);

  const totalUnits = suggestions.reduce((sum, s) => sum + s.suggestedQty, 0);
  const totalCost = suggestions.reduce((sum, s) => sum + s.restockCost, 0);

  function handleRestockAll() {
    for (const { item, suggestedQty } of suggestions) {
      adjustStock(item.id, suggestedQty, "restock");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reorder list</h1>
          <p className="text-sm text-slate-500 mt-1">
            Items below reorder level with suggested restock quantities
          </p>
        </div>
        {suggestions.length > 0 && (
          <button
            type="button"
            onClick={handleRestockAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shrink-0"
          >
            <FiShoppingCart size={16} />
            Restock all ({suggestions.length})
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Items to reorder"
            value={String(suggestions.length)}
            sub="Low or out of stock"
            icon={<FiPackage size={20} />}
            accent="amber"
          />
          <StatCard
            label="Units to order"
            value={totalUnits.toLocaleString()}
            sub="Suggested quantities"
            icon={<FiShoppingCart size={20} />}
            accent="teal"
          />
          <StatCard
            label="Est. restock cost"
            value={`$${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            sub="Based on unit price"
            icon={<FiPackage size={20} />}
            accent="slate"
          />
        </div>
      )}

      {suggestions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FiCheckCircle size={32} className="mx-auto text-teal-500 mb-3" />
          <p className="text-slate-600 font-medium">All stocked up</p>
          <p className="text-sm text-slate-500 mt-1">
            No items are currently below their reorder level.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">On hand</th>
                  <th className="px-4 py-3 font-semibold text-right">Reorder at</th>
                  <th className="px-4 py-3 font-semibold text-right">Suggested</th>
                  <th className="px-4 py-3 font-semibold text-right">Est. cost</th>
                  <th className="px-4 py-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suggestions.map(({ item, suggestedQty, restockCost }) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{item.sku}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {item.reorderLevel}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-brand-700">
                      +{suggestedQty}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      ${restockCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          adjustStock(item.id, suggestedQty, "restock")
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 border border-brand-200 text-xs font-medium hover:bg-brand-100 transition-colors"
                      >
                        <FiShoppingCart size={14} />
                        Restock
                      </button>
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
