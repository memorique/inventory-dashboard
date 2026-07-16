import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router";
import { FiArrowLeft, FiSave, FiSend, FiTrash2 } from "react-icons/fi";
import { useInventory } from "../context/InventoryContext";
import { useProcurement } from "../context/ProcurementContext";
import type { PurchaseOrderLine } from "../types/inventory";
import { getLinesTotal } from "../utils/procurement";
import { getSuggestedReorderQty } from "../utils/inventory";

interface LocationState {
  supplierId?: string;
}

export default function PurchaseOrderForm() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { items } = useInventory();
  const {
    suppliers,
    purchaseOrders,
    createPurchaseOrder,
    updatePurchaseOrder,
  } = useProcurement();

  const existing = id ? purchaseOrders.find((po) => po.id === id) : undefined;
  const isEdit = Boolean(existing);
  const prefillState = location.state as LocationState | null;

  const [supplierId, setSupplierId] = useState(
    existing?.supplierId ?? prefillState?.supplierId ?? ""
  );
  const [lines, setLines] = useState<PurchaseOrderLine[]>(
    existing?.lines ?? []
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [expectedAt, setExpectedAt] = useState(existing?.expectedAt ?? "");
  const [error, setError] = useState("");

  const availableItems = useMemo(
    () => items.filter((i) => !lines.some((l) => l.itemId === i.id)),
    [items, lines]
  );

  const total = getLinesTotal(lines);

  if (id && !existing) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-600 font-medium">Purchase order not found</p>
        <Link
          to="/dashboard/purchase-orders"
          className="text-sm text-brand-700 hover:text-brand-800 font-medium mt-2 inline-block"
        >
          Back to purchase orders
        </Link>
      </div>
    );
  }

  if (existing && existing.status !== "draft") {
    return (
      <Navigate to={`/dashboard/purchase-orders/${existing.id}`} replace />
    );
  }

  function addLine(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const suggested =
      item.status !== "in_stock"
        ? getSuggestedReorderQty(item)
        : Math.max(item.reorderLevel, 1);
    setLines((prev) => [
      ...prev,
      {
        itemId: item.id,
        sku: item.sku,
        name: item.name,
        quantity: suggested,
        unitCost: item.unitPrice,
      },
    ]);
  }

  function updateLine(
    itemId: string,
    field: "quantity" | "unitCost",
    value: number
  ) {
    setLines((prev) =>
      prev.map((l) =>
        l.itemId === itemId ? { ...l, [field]: Math.max(0, value) } : l
      )
    );
  }

  function removeLine(itemId: string) {
    setLines((prev) => prev.filter((l) => l.itemId !== itemId));
  }

  function validate(): string | null {
    if (!supplierId) return "Please select a supplier.";
    if (lines.length === 0) return "Add at least one product to the order.";
    if (lines.some((l) => l.quantity <= 0)) {
      return "Every line must have a quantity greater than zero.";
    }
    return null;
  }

  function handleSave(status: "draft" | "ordered") {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    if (isEdit && existing) {
      updatePurchaseOrder(existing.id, {
        supplierId,
        lines,
        notes,
        expectedAt: expectedAt || null,
      });
      navigate(`/dashboard/purchase-orders/${existing.id}`);
      return;
    }

    const newId = createPurchaseOrder({
      supplierId,
      lines,
      notes,
      expectedAt: expectedAt || null,
      status,
    });
    navigate(`/dashboard/purchase-orders/${newId}`);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    handleSave("draft");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          to="/dashboard/purchase-orders"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2"
        >
          <FiArrowLeft size={15} />
          Purchase orders
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? `Edit ${existing?.poNumber}` : "New purchase order"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isEdit
            ? "Update this draft before placing the order"
            : "Select a supplier and add the products you want to order"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Supplier *
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              >
                <option value="">Select a supplier…</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {suppliers.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No suppliers yet.{" "}
                  <Link
                    to="/dashboard/suppliers"
                    className="underline font-medium"
                  >
                    Add one first
                  </Link>
                  .
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Expected delivery
              </label>
              <input
                type="date"
                value={expectedAt ?? ""}
                onChange={(e) => setExpectedAt(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                Leave blank to auto-calculate from lead time when ordered.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Line items</h2>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) addLine(e.target.value);
              }}
              disabled={availableItems.length === 0}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 disabled:opacity-50"
            >
              <option value="">
                {availableItems.length === 0
                  ? "All products added"
                  : "+ Add product…"}
              </option>
              {availableItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.sku})
                </option>
              ))}
            </select>
          </div>

          {lines.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No products added yet. Use the dropdown above to add line items.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 font-semibold text-right w-28">
                      Quantity
                    </th>
                    <th className="px-4 py-3 font-semibold text-right w-32">
                      Unit cost
                    </th>
                    <th className="px-4 py-3 font-semibold text-right w-32">
                      Line total
                    </th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line) => (
                    <tr key={line.itemId}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {line.name}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          {line.sku}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(
                              line.itemId,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                          className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <span className="text-slate-400">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitCost}
                            onChange={(e) =>
                              updateLine(
                                line.itemId,
                                "unitCost",
                                Number(e.target.value)
                              )
                            }
                            className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                        ${(line.quantity * line.unitCost).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(line.itemId)}
                          title="Remove line"
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                        >
                          <FiTrash2 size={13} />
                        </button>
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
                      Total
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">
                      ${total.toFixed(2)}
                    </td>
                    <td />
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
            placeholder="Delivery instructions, references, etc."
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FiSave size={16} />
            {isEdit ? "Save changes" : "Save as draft"}
          </button>
          {!isEdit && (
            <button
              type="button"
              onClick={() => handleSave("ordered")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              <FiSend size={16} />
              Save &amp; place order
            </button>
          )}
          <Link
            to={
              isEdit
                ? `/dashboard/purchase-orders/${existing?.id}`
                : "/dashboard/purchase-orders"
            }
            className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
