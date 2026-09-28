import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheckCircle,
  FiSave,
  FiTrash2,
} from "react-icons/fi";
import { usePermission } from "../context/AuthContext";
import { useInventory } from "../context/InventoryContext";
import { useSales, type SalesOrderInput } from "../context/SalesContext";
import type { SalesOrderLine } from "../types/inventory";
import { getAvailableQty, getSoLinesTotal } from "../utils/sales";

export default function SalesOrderForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items } = useInventory();
  const { salesOrders, reservedByItem, createSalesOrder, updateSalesOrder } =
    useSales();
  const { canManageSalesOrders } = usePermission();

  const existing = id ? salesOrders.find((so) => so.id === id) : undefined;
  const isEdit = Boolean(existing);

  const [customerName, setCustomerName] = useState(
    existing?.customerName ?? ""
  );
  const [customerEmail, setCustomerEmail] = useState(
    existing?.customerEmail ?? ""
  );
  const [lines, setLines] = useState<SalesOrderLine[]>(existing?.lines ?? []);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [shipBy, setShipBy] = useState(existing?.shipBy ?? "");
  const [error, setError] = useState("");

  const availableItems = useMemo(
    () => items.filter((i) => !lines.some((l) => l.itemId === i.id)),
    [items, lines]
  );

  const knownCustomers = useMemo(() => {
    const map = new Map<string, string>();
    for (const so of salesOrders) {
      if (!map.has(so.customerName)) map.set(so.customerName, so.customerEmail);
    }
    return map;
  }, [salesOrders]);

  const availableById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of items) {
      map[item.id] = getAvailableQty(item, reservedByItem);
    }
    return map;
  }, [items, reservedByItem]);

  const total = getSoLinesTotal(lines);
  const hasShortage = lines.some(
    (l) => l.quantity > (availableById[l.itemId] ?? 0)
  );

  if (id && !existing) {
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

  if (existing && existing.status !== "draft") {
    return <Navigate to={`/dashboard/sales-orders/${existing.id}`} replace />;
  }

  function addLine(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    setLines((prev) => [
      ...prev,
      {
        itemId: item.id,
        sku: item.sku,
        name: item.name,
        quantity: 1,
        unitPrice: item.unitPrice,
      },
    ]);
  }

  function updateLine(
    itemId: string,
    field: "quantity" | "unitPrice",
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

  function handleCustomerChange(name: string) {
    setCustomerName(name);
    const email = knownCustomers.get(name);
    if (email && !customerEmail) setCustomerEmail(email);
  }

  function handleSave(status: "draft" | "confirmed") {
    if (!canManageSalesOrders) return;

    const input: SalesOrderInput = {
      customerName,
      customerEmail,
      lines,
      notes,
      shipBy: shipBy || null,
    };

    if (isEdit && existing) {
      const err = updateSalesOrder(existing.id, input);
      if (err) {
        setError(err);
        return;
      }
      navigate(`/dashboard/sales-orders/${existing.id}`);
      return;
    }

    const result = createSalesOrder(input, status);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(`/dashboard/sales-orders/${result.id}`);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    handleSave("draft");
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          to="/dashboard/sales-orders"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2"
        >
          <FiArrowLeft size={15} />
          Sales orders
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? `Edit ${existing?.orderNumber}` : "New sales order"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isEdit
            ? "Update this draft before confirming it"
            : "Enter the customer and the products they're buying"}
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
                Customer *
              </label>
              <input
                type="text"
                list="known-customers"
                value={customerName}
                onChange={(e) => handleCustomerChange(e.target.value)}
                placeholder="Company or person"
                className={inputClass}
              />
              <datalist id="known-customers">
                {Array.from(knownCustomers.keys()).map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Customer email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="orders@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Ship by
              </label>
              <input
                type="date"
                value={shipBy ?? ""}
                onChange={(e) => setShipBy(e.target.value)}
                className={inputClass}
              />
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
                  {i.name} ({i.sku}) — {availableById[i.id] ?? 0} available
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
                    <th className="px-4 py-3 font-semibold text-right w-24">
                      Available
                    </th>
                    <th className="px-4 py-3 font-semibold text-right w-28">
                      Quantity
                    </th>
                    <th className="px-4 py-3 font-semibold text-right w-32">
                      Unit price
                    </th>
                    <th className="px-4 py-3 font-semibold text-right w-32">
                      Line total
                    </th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line) => {
                    const available = availableById[line.itemId] ?? 0;
                    const short = line.quantity > available;
                    return (
                      <tr key={line.itemId}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {line.name}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            {line.sku}
                          </p>
                        </td>
                        <td
                          className={`px-4 py-3 text-right tabular-nums ${
                            short ? "text-rose-600 font-medium" : "text-slate-600"
                          }`}
                        >
                          {available}
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
                            className={`w-20 rounded-lg border px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 ${
                              short ? "border-rose-300" : "border-slate-200"
                            }`}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <span className="text-slate-400">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.unitPrice}
                              onChange={(e) =>
                                updateLine(
                                  line.itemId,
                                  "unitPrice",
                                  Number(e.target.value)
                                )
                              }
                              className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                          ${(line.quantity * line.unitPrice).toFixed(2)}
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
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td
                      colSpan={4}
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

          {hasShortage && (
            <div className="flex items-start gap-2 px-6 py-3 border-t border-amber-100 bg-amber-50 text-sm text-amber-800">
              <FiAlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                Some lines exceed available stock. You can save a draft, but it
                can't be confirmed until stock is received or other orders
                release it.
              </span>
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
            placeholder="Shipping instructions, customer references, etc."
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!canManageSalesOrders}
            title={
              canManageSalesOrders
                ? undefined
                : "Managers and admins can manage sales orders"
            }
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FiSave size={16} />
            {isEdit ? "Save changes" : "Save as draft"}
          </button>
          {!isEdit && (
            <button
              type="button"
              onClick={() => handleSave("confirmed")}
              disabled={!canManageSalesOrders || hasShortage}
              title={
                !canManageSalesOrders
                  ? "Managers and admins can manage sales orders"
                  : hasShortage
                    ? "Not enough available stock to confirm"
                    : undefined
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiCheckCircle size={16} />
              Save &amp; confirm
            </button>
          )}
          <Link
            to={
              isEdit
                ? `/dashboard/sales-orders/${existing?.id}`
                : "/dashboard/sales-orders"
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
