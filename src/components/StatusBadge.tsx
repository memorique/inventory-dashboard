import type { StockStatus } from "../types/inventory";

const styles: Record<StockStatus, string> = {
  in_stock: "bg-emerald-50 text-emerald-700 border-emerald-200",
  low_stock: "bg-amber-50 text-amber-800 border-amber-200",
  out_of_stock: "bg-rose-50 text-rose-700 border-rose-200",
};

const labels: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

export default function StatusBadge({ status }: { status: StockStatus }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
