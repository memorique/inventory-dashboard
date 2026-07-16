import { FiMinus, FiPlus } from "react-icons/fi";
import type { InventoryItem, StockAction } from "../types/inventory";
import StatusBadge from "./StatusBadge";

interface InventoryTableProps {
  items: InventoryItem[];
  adjustable?: boolean;
  onAdjust?: (itemId: string, change: number, action: StockAction) => void;
  onOrderByItem?: Record<string, number>;
}

export default function InventoryTable({
  items,
  adjustable = false,
  onAdjust,
  onOrderByItem,
}: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
        No items match your search.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <th className="px-4 py-3 font-semibold">SKU</th>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold text-right">Qty</th>
              {adjustable && (
                <th className="px-4 py-3 font-semibold text-center">Adjust</th>
              )}
              <th className="px-4 py-3 font-semibold text-right">Unit price</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">
                  {item.sku}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {item.name}
                </td>
                <td className="px-4 py-3 text-slate-600">{item.category}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">
                  {item.quantity}
                  {onOrderByItem && onOrderByItem[item.id] > 0 && (
                    <span
                      title={`${onOrderByItem[item.id]} units on order`}
                      className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100 align-middle"
                    >
                      +{onOrderByItem[item.id]} on order
                    </span>
                  )}
                </td>
                {adjustable && onAdjust && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onAdjust(item.id, -1, "sale")}
                        disabled={item.quantity === 0}
                        title="Remove 1 unit"
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <FiMinus size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onAdjust(item.id, 1, "restock")}
                        title="Add 1 unit"
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
                      >
                        <FiPlus size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onAdjust(item.id, 10, "restock")}
                        title="Add 10 units"
                        className="px-2 h-7 rounded-md border border-brand-200 bg-brand-50 text-brand-700 text-xs font-medium hover:bg-brand-100 transition-colors"
                      >
                        +10
                      </button>
                    </div>
                  </td>
                )}
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  ${item.unitPrice.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs max-w-[180px] truncate">
                  {item.location}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
