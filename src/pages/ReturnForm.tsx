import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { usePermission } from "../context/AuthContext";
import { useReturns } from "../context/ReturnsContext";
import { useSales } from "../context/SalesContext";
import type {
  ReturnDisposition,
  ReturnLine,
  ReturnReason,
} from "../types/inventory";
import {
  defaultDisposition,
  dispositionLabels,
  getReturnableByItem,
  getReturnLinesTotal,
  hasReturnableUnits,
  returnReasonLabels,
} from "../utils/returns";

interface LineDraft {
  quantity: number;
  disposition: ReturnDisposition;
}

const reasons = Object.keys(returnReasonLabels) as ReturnReason[];

export default function ReturnForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { salesOrders } = useSales();
  const { returns, createReturn } = useReturns();
  const { canManageReturns } = usePermission();

  const eligibleOrders = useMemo(
    () => salesOrders.filter((so) => hasReturnableUnits(so, returns)),
    [salesOrders, returns]
  );

  const initialOrderId = searchParams.get("order") ?? "";
  const [orderId, setOrderId] = useState(
    eligibleOrders.some((so) => so.id === initialOrderId) ? initialOrderId : ""
  );
  const [reason, setReason] = useState<ReturnReason>("not_needed");
  const [drafts, setDrafts] = useState<Record<string, LineDraft>>({});
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const so = salesOrders.find((s) => s.id === orderId);
  const returnable = useMemo(
    () => (so ? getReturnableByItem(so, returns) : {}),
    [so, returns]
  );

  const lines: ReturnLine[] = so
    ? so.lines.map((l) => ({
        itemId: l.itemId,
        sku: l.sku,
        name: l.name,
        unitPrice: l.unitPrice,
        quantity: drafts[l.itemId]?.quantity ?? 0,
        disposition:
          drafts[l.itemId]?.disposition ?? defaultDisposition(reason),
      }))
    : [];
  const refund = getReturnLinesTotal(lines);
  const totalUnits = lines.reduce((sum, l) => sum + l.quantity, 0);

  function handleOrderChange(id: string) {
    setOrderId(id);
    setDrafts({});
    setError("");
  }

  function handleReasonChange(next: ReturnReason) {
    setReason(next);
    // Re-default dispositions so "damaged" lines flip to write-off, etc.
    setDrafts((prev) => {
      const updated: Record<string, LineDraft> = {};
      for (const [itemId, d] of Object.entries(prev)) {
        updated[itemId] = { ...d, disposition: defaultDisposition(next) };
      }
      return updated;
    });
  }

  function updateDraft(itemId: string, patch: Partial<LineDraft>) {
    setDrafts((prev) => {
      const current = prev[itemId] ?? {
        quantity: 0,
        disposition: defaultDisposition(reason),
      };
      const next = { ...current, ...patch };
      next.quantity = Math.min(
        Math.max(0, Math.floor(next.quantity) || 0),
        returnable[itemId] ?? 0
      );
      return { ...prev, [itemId]: next };
    });
  }

  function returnAll() {
    if (!so) return;
    const all: Record<string, LineDraft> = {};
    for (const line of so.lines) {
      all[line.itemId] = {
        quantity: returnable[line.itemId] ?? 0,
        disposition:
          drafts[line.itemId]?.disposition ?? defaultDisposition(reason),
      };
    }
    setDrafts(all);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canManageReturns) return;
    if (!so) {
      setError("Select the sales order being returned.");
      return;
    }

    const result = createReturn({ salesOrderId: so.id, reason, lines, notes });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(`/dashboard/returns/${result.id}`);
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          to="/dashboard/returns"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2"
        >
          <FiArrowLeft size={15} />
          Returns
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">New return</h1>
        <p className="text-sm text-slate-500 mt-1">
          Record what the customer is sending back and what should happen to
          it
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Sales order *
              </label>
              <select
                value={orderId}
                onChange={(e) => handleOrderChange(e.target.value)}
                className={inputClass}
              >
                <option value="">Select a shipped order…</option>
                {eligibleOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} — {o.customerName}
                  </option>
                ))}
              </select>
              {eligibleOrders.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No shipped orders with returnable items.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Reason *
              </label>
              <select
                value={reason}
                onChange={(e) =>
                  handleReasonChange(e.target.value as ReturnReason)
                }
                className={inputClass}
              >
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {returnReasonLabels[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Items returned</h2>
            {so && (
              <button
                type="button"
                onClick={returnAll}
                className="text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                Return everything
              </button>
            )}
          </div>

          {!so ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Select a sales order to choose which items are coming back.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th
                      className="px-4 py-3 font-semibold text-right w-24"
                      title="Shipped quantity minus units on other open or received returns"
                    >
                      Returnable
                    </th>
                    <th className="px-4 py-3 font-semibold text-right w-28">
                      Qty
                    </th>
                    <th className="px-4 py-3 font-semibold w-36">Action</th>
                    <th className="px-4 py-3 font-semibold text-right w-28">
                      Refund
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line) => {
                    const max = returnable[line.itemId] ?? 0;
                    return (
                      <tr
                        key={line.itemId}
                        className={max === 0 ? "opacity-50" : undefined}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {line.name}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            {line.sku} · ${line.unitPrice.toFixed(2)} each
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                          {max}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            max={max}
                            disabled={max === 0}
                            value={line.quantity}
                            onChange={(e) =>
                              updateDraft(line.itemId, {
                                quantity: Number(e.target.value),
                              })
                            }
                            className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 disabled:bg-slate-50"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={line.disposition}
                            disabled={max === 0}
                            onChange={(e) =>
                              updateDraft(line.itemId, {
                                disposition: e.target.value as ReturnDisposition,
                              })
                            }
                            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 disabled:bg-slate-50"
                          >
                            <option value="restock">
                              {dispositionLabels.restock}
                            </option>
                            <option value="scrap">
                              {dispositionLabels.scrap}
                            </option>
                          </select>
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
                      colSpan={4}
                      className="px-4 py-3 text-right font-semibold text-slate-700"
                    >
                      {totalUnits} unit{totalUnits !== 1 ? "s" : ""} · Refund
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">
                      ${refund.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Condition, tracking number, customer comments…"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!canManageReturns || totalUnits === 0}
            title={
              canManageReturns
                ? undefined
                : "Managers and admins can create returns"
            }
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FiSave size={16} />
            Create return
          </button>
          <Link
            to="/dashboard/returns"
            className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
