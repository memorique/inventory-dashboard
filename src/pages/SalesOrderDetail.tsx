import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiEdit2,
  FiRotateCcw,
  FiSend,
  FiSlash,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { usePermission } from "../context/AuthContext";
import { useInventory } from "../context/InventoryContext";
import { useReturns } from "../context/ReturnsContext";
import { useSales } from "../context/SalesContext";
import {
  getAvailableQty,
  getSoTotal,
  getSoUnits,
  soStatusLabels,
  soStatusStyles,
} from "../utils/sales";
import {
  getReturnTotal,
  getReturnUnits,
  hasReturnableUnits,
  returnStatusLabels,
  returnStatusStyles,
} from "../utils/returns";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SalesOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items } = useInventory();
  const {
    salesOrders,
    reservedByItem,
    confirmSalesOrder,
    shipSalesOrder,
    cancelSalesOrder,
    deleteSalesOrder,
  } = useSales();
  const { returns } = useReturns();
  const { canManageSalesOrders, canFulfillOrders, canManageReturns } =
    usePermission();
  const [error, setError] = useState("");

  const so = salesOrders.find((s) => s.id === id);

  if (!so) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-600 font-medium">Sales order not found</p>
        <Link
          to="/dashboard/sales-orders"
          className="text-sm text-brand-700 hover:text-brand-800 font-medium mt-2 inline-block"
        >
          Back to sales orders
        </Link>
      </div>
    );
  }

  const total = getSoTotal(so);
  const units = getSoUnits(so);
  const isOpen = so.status === "draft" || so.status === "confirmed";
  const orderReturns = returns.filter((r) => r.salesOrderId === so.id);
  const canStartReturn = hasReturnableUnits(so, returns);

  function handleConfirm() {
    if (!canManageSalesOrders) return;
    setError(confirmSalesOrder(so!.id) ?? "");
  }

  function handleShip() {
    if (!canFulfillOrders) return;
    if (
      window.confirm(
        `Ship ${so!.orderNumber}? This will remove ${units} units from inventory stock.`
      )
    ) {
      setError(shipSalesOrder(so!.id) ?? "");
    }
  }

  function handleCancel() {
    if (!canManageSalesOrders) return;
    const releases =
      so!.status === "confirmed" ? ` Its ${units} reserved units will be released.` : "";
    if (window.confirm(`Cancel ${so!.orderNumber}?${releases}`)) {
      cancelSalesOrder(so!.id);
      setError("");
    }
  }

  function handleDelete() {
    if (!canManageSalesOrders) return;
    if (window.confirm(`Delete ${so!.orderNumber}? This cannot be undone.`)) {
      deleteSalesOrder(so!.id);
      navigate("/dashboard/sales-orders");
    }
  }

  const timeline = [
    { label: "Created", date: so.createdAt },
    { label: "Confirmed", date: so.confirmedAt },
    { label: "Ship by", date: so.shipBy },
    { label: "Shipped", date: so.shippedAt },
  ];

  const secondaryButton =
    "inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const primaryButton =
    "inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/dashboard/sales-orders"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2"
        >
          <FiArrowLeft size={15} />
          Sales orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 font-mono">
                {so.orderNumber}
              </h1>
              <span
                className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${soStatusStyles[so.status]}`}
              >
                {soStatusLabels[so.status]}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {so.customerName} · {so.lines.length} item
              {so.lines.length !== 1 ? "s" : ""} · {units} units
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {so.status === "draft" && (
              <>
                {canManageSalesOrders ? (
                  <Link
                    to={`/dashboard/sales-orders/${so.id}/edit`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <FiEdit2 size={15} />
                    Edit
                  </Link>
                ) : (
                  <span
                    title="Managers and admins can edit sales orders"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 opacity-40 cursor-not-allowed"
                  >
                    <FiEdit2 size={15} />
                    Edit
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!canManageSalesOrders}
                  title={
                    canManageSalesOrders
                      ? "Reserve stock for this order"
                      : "Managers and admins can confirm orders"
                  }
                  className={primaryButton}
                >
                  <FiCheckCircle size={15} />
                  Confirm &amp; reserve
                </button>
              </>
            )}
            {so.status === "confirmed" && (
              <button
                type="button"
                onClick={handleShip}
                disabled={!canFulfillOrders}
                title={
                  canFulfillOrders ? undefined : "You can't fulfill orders"
                }
                className={primaryButton}
              >
                <FiSend size={15} />
                Mark shipped
              </button>
            )}
            {isOpen && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={!canManageSalesOrders}
                title={
                  canManageSalesOrders
                    ? undefined
                    : "Managers and admins can cancel orders"
                }
                className={secondaryButton}
              >
                <FiSlash size={15} />
                Cancel
              </button>
            )}
            {canStartReturn &&
              (canManageReturns ? (
                <Link
                  to={`/dashboard/returns/new?order=${so.id}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <FiRotateCcw size={15} />
                  Create return
                </Link>
              ) : (
                <span
                  title="Managers and admins can create returns"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 opacity-40 cursor-not-allowed"
                >
                  <FiRotateCcw size={15} />
                  Create return
                </span>
              ))}
            {so.status !== "confirmed" && orderReturns.length === 0 && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canManageSalesOrders}
                title={
                  canManageSalesOrders
                    ? undefined
                    : "Managers and admins can delete orders"
                }
                className={secondaryButton}
              >
                <FiTrash2 size={15} />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {so.status === "confirmed" && (
        <div className="flex items-center gap-2 text-sm text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-4 py-3">
          <FiCheckCircle size={16} />
          {units} units are reserved for this order and excluded from available
          stock until it ships or is cancelled.
        </div>
      )}

      {so.status === "shipped" && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <FiCheckCircle size={16} />
          Shipped on {formatDate(so.shippedAt)} — {units} units were removed
          from inventory.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {timeline.map((t) => (
          <div
            key={t.label}
            className="bg-white rounded-xl border border-slate-200 p-4"
          >
            <p className="text-xs font-medium text-slate-500">{t.label}</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">
              {formatDate(t.date)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Line items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  {isOpen && (
                    <th
                      className="px-4 py-3 font-semibold text-right"
                      title={
                        so.status === "draft"
                          ? "Available to promise (on hand minus reserved)"
                          : "Currently on hand"
                      }
                    >
                      {so.status === "draft" ? "Available" : "On hand"}
                    </th>
                  )}
                  <th className="px-4 py-3 font-semibold text-right">Qty</th>
                  <th className="px-4 py-3 font-semibold text-right">
                    Unit price
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {so.lines.map((line) => {
                  const item = items.find((i) => i.id === line.itemId);
                  const stock = !item
                    ? 0
                    : so.status === "draft"
                      ? getAvailableQty(item, reservedByItem)
                      : item.quantity;
                  const short = isOpen && line.quantity > stock;
                  return (
                    <tr key={line.itemId}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {line.name}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          {line.sku}
                          {!item && isOpen && (
                            <span className="ml-2 font-sans text-rose-600">
                              product deleted
                            </span>
                          )}
                        </p>
                      </td>
                      {isOpen && (
                        <td
                          className={`px-4 py-3 text-right tabular-nums ${
                            short ? "text-rose-600 font-medium" : "text-slate-600"
                          }`}
                        >
                          {stock}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right tabular-nums">
                        {line.quantity}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                        ${line.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                        ${(line.quantity * line.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50">
                  <td
                    colSpan={isOpen ? 4 : 3}
                    className="px-4 py-3 text-right font-semibold text-slate-700"
                  >
                    Order total
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">
                    ${total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {so.notes && (
            <div className="px-6 py-4 border-t border-slate-200">
              <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700">{so.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700 border border-brand-100">
              <FiUser size={18} />
            </span>
            <h2 className="font-semibold text-slate-900">Customer</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500 text-xs">Name</dt>
              <dd className="font-medium text-slate-900">{so.customerName}</dd>
            </div>
            {so.customerEmail && (
              <div>
                <dt className="text-slate-500 text-xs">Email</dt>
                <dd className="text-slate-700 break-all">
                  <a
                    href={`mailto:${so.customerEmail}`}
                    className="hover:text-brand-700"
                  >
                    {so.customerEmail}
                  </a>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-slate-500 text-xs">Orders from customer</dt>
              <dd className="text-slate-700">
                {
                  salesOrders.filter(
                    (s) => s.customerName === so.customerName
                  ).length
                }
              </dd>
            </div>
          </dl>

          {orderReturns.length > 0 && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-2">
                <FiRotateCcw size={14} />
                Returns
              </h3>
              <ul className="divide-y divide-slate-100">
                {orderReturns.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={`/dashboard/returns/${r.id}`}
                      className="flex items-center justify-between gap-2 py-2 group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-mono font-medium text-slate-900 group-hover:text-brand-700">
                          {r.rmaNumber}
                        </p>
                        <p className="text-xs text-slate-500">
                          {getReturnUnits(r)} units · $
                          {getReturnTotal(r).toFixed(2)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border shrink-0 ${returnStatusStyles[r.status]}`}
                      >
                        {returnStatusLabels[r.status]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
