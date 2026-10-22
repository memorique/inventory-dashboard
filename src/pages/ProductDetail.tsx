import { Link, useParams } from "react-router";
import {
  FiArrowLeft,
  FiClipboard,
  FiEdit2,
  FiLock,
  FiPackage,
  FiShoppingBag,
  FiTrendingUp,
} from "react-icons/fi";
import { StatCard } from "../components/StatsCards";
import StatusBadge from "../components/StatusBadge";
import { usePermission } from "../context/AuthContext";
import { useInventory } from "../context/InventoryContext";
import { useProcurement } from "../context/ProcurementContext";
import { useSales } from "../context/SalesContext";
import { poStatusLabels, poStatusStyles } from "../utils/procurement";
import { soStatusLabels, soStatusStyles } from "../utils/sales";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ProductDetail() {
  const { id } = useParams();
  const { items, activity } = useInventory();
  const { purchaseOrders, onOrderByItem } = useProcurement();
  const { salesOrders, reservedByItem } = useSales();
  const { canManageProducts } = usePermission();

  const item = items.find((i) => i.id === id);

  if (!item) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-600 font-medium">Product not found</p>
        <Link
          to="/dashboard/inventory"
          className="mt-2 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          ← Back to inventory
        </Link>
      </div>
    );
  }

  const reserved = reservedByItem[item.id] ?? 0;
  const available = Math.max(0, item.quantity - reserved);
  const onOrder = onOrderByItem[item.id] ?? 0;

  const openPos = purchaseOrders
    .filter(
      (po) =>
        (po.status === "draft" || po.status === "ordered") &&
        po.lines.some((l) => l.itemId === item.id)
    )
    .map((po) => ({
      po,
      qty: po.lines
        .filter((l) => l.itemId === item.id)
        .reduce((s, l) => s + l.quantity, 0),
    }));

  const openSos = salesOrders
    .filter(
      (so) =>
        (so.status === "draft" || so.status === "confirmed") &&
        so.lines.some((l) => l.itemId === item.id)
    )
    .map((so) => ({
      so,
      qty: so.lines
        .filter((l) => l.itemId === item.id)
        .reduce((s, l) => s + l.quantity, 0),
    }));

  const history = activity.filter((e) => e.itemId === item.id).slice(0, 10);

  const details: [string, string][] = [
    ["Category", item.category],
    ["Location", item.location],
    ["Unit price", `$${item.unitPrice.toFixed(2)}`],
    ["Reorder level", String(item.reorderLevel)],
    [
      "Stock value",
      `$${(item.quantity * item.unitPrice).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    ],
    ["Last updated", formatDate(item.lastUpdated)],
  ];

  return (
    <div className="space-y-6">
      <Link
        to="/dashboard/inventory"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <FiArrowLeft size={14} />
        Inventory
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{item.name}</h1>
            <StatusBadge status={item.status} />
          </div>
          <p className="text-sm text-slate-500 font-mono mt-1">{item.sku}</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            to={`/dashboard/analytics?item=${encodeURIComponent(item.id)}`}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FiTrendingUp size={16} />
            Stock trend
          </Link>
          {canManageProducts && (
            <Link
              to={`/dashboard/inventory/${item.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              <FiEdit2 size={16} />
              Edit product
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="On hand"
          value={String(item.quantity)}
          sub={`Reorder at ${item.reorderLevel}`}
          icon={<FiPackage size={20} />}
          accent="teal"
        />
        <StatCard
          label="Reserved"
          value={String(reserved)}
          sub="For confirmed sales orders"
          icon={<FiLock size={20} />}
          accent={reserved > item.quantity ? "rose" : "slate"}
        />
        <StatCard
          label="Available"
          value={String(available)}
          sub="On hand minus reserved"
          icon={<FiShoppingBag size={20} />}
          accent="slate"
        />
        <StatCard
          label="On order"
          value={String(onOrder)}
          sub="From placed purchase orders"
          icon={<FiClipboard size={20} />}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Details</h2>
          <dl className="space-y-2.5 text-sm">
            {details.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-slate-900 font-medium text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <OrderList
            title="Open purchase orders"
            empty="No open purchase orders for this product."
            rows={openPos.map(({ po, qty }) => ({
              key: po.id,
              to: `/dashboard/purchase-orders/${po.id}`,
              number: po.poNumber,
              party: po.supplierName,
              qty,
              date: po.expectedAt ? `Expected ${formatDate(po.expectedAt)}` : "",
              statusLabel: poStatusLabels[po.status],
              statusStyle: poStatusStyles[po.status],
            }))}
          />
          <OrderList
            title="Open sales orders"
            empty="No open sales orders for this product."
            rows={openSos.map(({ so, qty }) => ({
              key: so.id,
              to: `/dashboard/sales-orders/${so.id}`,
              number: so.orderNumber,
              party: so.customerName,
              qty,
              date: so.shipBy ? `Ship by ${formatDate(so.shipBy)}` : "",
              statusLabel: soStatusLabels[so.status],
              statusStyle: soStatusStyles[so.status],
            }))}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Recent activity
          </h2>
          <Link
            to="/dashboard/activity"
            className="text-xs font-medium text-brand-700 hover:text-brand-800"
          >
            Full log →
          </Link>
        </div>
        {history.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500 text-center">
            No recorded changes for this product yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm"
              >
                <div>
                  <p className="text-slate-900 capitalize">
                    {entry.action}
                    {entry.action === "transfer" && entry.toLocation ? (
                      <span className="text-slate-500 normal-case">
                        {" "}
                        · {entry.fromLocation} → {entry.toLocation}
                      </span>
                    ) : (
                      <span className="text-slate-500 tabular-nums">
                        {" "}
                        · {entry.previousQty} → {entry.newQty}
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-xs text-slate-500 whitespace-nowrap">
                  {entry.userName} · {formatTimestamp(entry.timestamp)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface OrderRow {
  key: string;
  to: string;
  number: string;
  party: string;
  qty: number;
  date: string;
  statusLabel: string;
  statusStyle: string;
}

function OrderList({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: OrderRow[];
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-slate-500 text-center">{empty}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((row) => (
            <li key={row.key}>
              <Link
                to={row.to}
                className="px-4 py-3 flex items-center justify-between gap-3 text-sm hover:bg-slate-50/80"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {row.number}{" "}
                    <span className="font-normal text-slate-500">
                      · {row.party}
                    </span>
                  </p>
                  {row.date && (
                    <p className="text-xs text-slate-500">{row.date}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="tabular-nums text-slate-700">
                    {row.qty} units
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${row.statusStyle}`}
                  >
                    {row.statusLabel}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
