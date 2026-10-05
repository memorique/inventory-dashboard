import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiShoppingBag,
  FiSlash,
  FiTrash2,
} from "react-icons/fi";
import { usePermission } from "../context/AuthContext";
import { useReturns } from "../context/ReturnsContext";
import type { ReturnDisposition } from "../types/inventory";
import {
  dispositionLabels,
  getRestockUnits,
  getReturnTotal,
  getReturnUnits,
  getScrapValue,
  returnReasonLabels,
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

const dispositionStyles: Record<ReturnDisposition, string> = {
  restock: "bg-teal-50 text-teal-700 border-teal-100",
  scrap: "bg-rose-50 text-rose-700 border-rose-100",
};

export default function ReturnDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    returns,
    setLineDisposition,
    receiveReturn,
    rejectReturn,
    deleteReturn,
  } = useReturns();
  const { canManageReturns, canFulfillOrders } = usePermission();
  const [error, setError] = useState("");

  const ret = returns.find((r) => r.id === id);

  if (!ret) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-600 font-medium">Return not found</p>
        <Link
          to="/dashboard/returns"
          className="text-sm text-brand-700 hover:text-brand-800 font-medium mt-2 inline-block"
        >
          Back to returns
        </Link>
      </div>
    );
  }

  const units = getReturnUnits(ret);
  const restockUnits = getRestockUnits(ret);
  const scrapValue = getScrapValue(ret);
  const refund = getReturnTotal(ret);
  const isOpen = ret.status === "requested";

  function handleReceive() {
    if (!canFulfillOrders) return;
    const restockMsg =
      restockUnits > 0
        ? `${restockUnits} units will be added back to inventory`
        : "No units will be restocked";
    const scrapMsg =
      scrapValue > 0 ? ` and $${scrapValue.toFixed(2)} written off` : "";
    if (window.confirm(`Receive ${ret!.rmaNumber}? ${restockMsg}${scrapMsg}.`)) {
      setError(receiveReturn(ret!.id) ?? "");
    }
  }

  function handleReject() {
    if (!canManageReturns) return;
    if (window.confirm(`Reject ${ret!.rmaNumber}? No stock or refund will be recorded.`)) {
      rejectReturn(ret!.id);
      setError("");
    }
  }

  function handleDelete() {
    if (!canManageReturns) return;
    if (window.confirm(`Delete ${ret!.rmaNumber}? This cannot be undone.`)) {
      deleteReturn(ret!.id);
      navigate("/dashboard/returns");
    }
  }

  const timeline = [
    { label: "Opened", date: ret.createdAt },
    { label: "Received", date: ret.receivedAt },
  ];

  const secondaryButton =
    "inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/dashboard/returns"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2"
        >
          <FiArrowLeft size={15} />
          Returns
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 font-mono">
                {ret.rmaNumber}
              </h1>
              <span
                className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${returnStatusStyles[ret.status]}`}
              >
                {returnStatusLabels[ret.status]}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {ret.customerName} · {returnReasonLabels[ret.reason]} · {units}{" "}
              unit{units !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isOpen && (
              <>
                <button
                  type="button"
                  onClick={handleReceive}
                  disabled={!canFulfillOrders}
                  title={
                    canFulfillOrders ? undefined : "You can't receive returns"
                  }
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiCheckCircle size={15} />
                  Receive return
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={!canManageReturns}
                  title={
                    canManageReturns
                      ? undefined
                      : "Managers and admins can reject returns"
                  }
                  className={secondaryButton}
                >
                  <FiSlash size={15} />
                  Reject
                </button>
              </>
            )}
            {ret.status !== "received" && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canManageReturns}
                title={
                  canManageReturns
                    ? undefined
                    : "Managers and admins can delete returns"
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

      {isOpen && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          Inspect the goods when they arrive and set each line to{" "}
          <strong>Restock</strong> or <strong>Write off</strong> before
          receiving. Only restocked units go back into inventory.
        </div>
      )}

      {ret.status === "received" && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <FiCheckCircle size={16} />
          Received on {formatDate(ret.receivedAt)} — {restockUnits} units
          restocked
          {scrapValue > 0 && `, $${scrapValue.toFixed(2)} written off`}.
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
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500">Restock</p>
          <p className="text-sm font-semibold text-slate-900 mt-1">
            {restockUnits} units
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500">Write-off</p>
          <p className="text-sm font-semibold text-slate-900 mt-1">
            ${scrapValue.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Returned items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold text-right">Qty</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold text-right">Refund</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ret.lines.map((line) => (
                  <tr key={line.itemId}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{line.name}</p>
                      <p className="text-xs text-slate-500 font-mono">
                        {line.sku} · ${line.unitPrice.toFixed(2)} each
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {line.quantity}
                    </td>
                    <td className="px-4 py-3">
                      {isOpen && canFulfillOrders ? (
                        <select
                          value={line.disposition}
                          onChange={(e) =>
                            setLineDisposition(
                              ret.id,
                              line.itemId,
                              e.target.value as ReturnDisposition
                            )
                          }
                          className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                        >
                          <option value="restock">
                            {dispositionLabels.restock}
                          </option>
                          <option value="scrap">
                            {dispositionLabels.scrap}
                          </option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${dispositionStyles[line.disposition]}`}
                        >
                          {dispositionLabels[line.disposition]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                      ${(line.quantity * line.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50">
                  <td
                    colSpan={3}
                    className="px-4 py-3 text-right font-semibold text-slate-700"
                  >
                    {ret.status === "received" ? "Refunded" : "Refund due"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">
                    ${refund.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {ret.notes && (
            <div className="px-6 py-4 border-t border-slate-200">
              <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700">{ret.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700 border border-brand-100">
              <FiShoppingBag size={18} />
            </span>
            <h2 className="font-semibold text-slate-900">Original order</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500 text-xs">Order</dt>
              <dd className="font-mono font-medium text-slate-900">
                {ret.orderNumber}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 text-xs">Customer</dt>
              <dd className="text-slate-700">{ret.customerName}</dd>
            </div>
            <div className="pt-2">
              <Link
                to={`/dashboard/sales-orders/${ret.salesOrderId}`}
                className="text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                View sales order →
              </Link>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
