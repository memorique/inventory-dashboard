import { Link, useNavigate, useParams } from "react-router";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiEdit2,
  FiSend,
  FiSlash,
  FiTrash2,
  FiTruck,
} from "react-icons/fi";
import { useProcurement } from "../context/ProcurementContext";
import {
  getPoTotal,
  getPoUnits,
  poStatusLabels,
  poStatusStyles,
} from "../utils/procurement";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    purchaseOrders,
    suppliers,
    placeOrder,
    receivePurchaseOrder,
    cancelPurchaseOrder,
    deletePurchaseOrder,
  } = useProcurement();

  const po = purchaseOrders.find((p) => p.id === id);

  if (!po) {
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

  const supplier = suppliers.find((s) => s.id === po.supplierId);
  const total = getPoTotal(po);
  const units = getPoUnits(po);

  function handleReceive() {
    if (
      window.confirm(
        `Receive ${po!.poNumber}? This will add ${units} units to inventory stock.`
      )
    ) {
      receivePurchaseOrder(po!.id);
    }
  }

  function handleCancel() {
    if (window.confirm(`Cancel ${po!.poNumber}?`)) {
      cancelPurchaseOrder(po!.id);
    }
  }

  function handleDelete() {
    if (window.confirm(`Delete ${po!.poNumber}? This cannot be undone.`)) {
      deletePurchaseOrder(po!.id);
      navigate("/dashboard/purchase-orders");
    }
  }

  const timeline = [
    { label: "Created", date: po.createdAt },
    { label: "Ordered", date: po.orderedAt },
    { label: "Expected", date: po.expectedAt },
    { label: "Received", date: po.receivedAt },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/dashboard/purchase-orders"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2"
        >
          <FiArrowLeft size={15} />
          Purchase orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 font-mono">
                {po.poNumber}
              </h1>
              <span
                className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${poStatusStyles[po.status]}`}
              >
                {poStatusLabels[po.status]}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {po.supplierName} · {po.lines.length} item
              {po.lines.length !== 1 ? "s" : ""} · {units} units
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {po.status === "draft" && (
              <>
                <Link
                  to={`/dashboard/purchase-orders/${po.id}/edit`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <FiEdit2 size={15} />
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => placeOrder(po.id)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  <FiSend size={15} />
                  Place order
                </button>
              </>
            )}
            {po.status === "ordered" && (
              <button
                type="button"
                onClick={handleReceive}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                <FiCheckCircle size={15} />
                Receive order
              </button>
            )}
            {(po.status === "draft" || po.status === "ordered") && (
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
              >
                <FiSlash size={15} />
                Cancel
              </button>
            )}
            {po.status !== "ordered" && (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
              >
                <FiTrash2 size={15} />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {po.status === "received" && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <FiCheckCircle size={16} />
          Received on {formatDate(po.receivedAt)} — {units} units were added to
          inventory.
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
                  <th className="px-4 py-3 font-semibold text-right">Qty</th>
                  <th className="px-4 py-3 font-semibold text-right">
                    Unit cost
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {po.lines.map((line) => (
                  <tr key={line.itemId}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{line.name}</p>
                      <p className="text-xs text-slate-500 font-mono">
                        {line.sku}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {line.quantity}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      ${line.unitCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                      ${(line.quantity * line.unitCost).toFixed(2)}
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
                    Order total
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">
                    ${total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {po.notes && (
            <div className="px-6 py-4 border-t border-slate-200">
              <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700">{po.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700 border border-brand-100">
              <FiTruck size={18} />
            </span>
            <h2 className="font-semibold text-slate-900">Supplier</h2>
          </div>
          {supplier ? (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-500 text-xs">Name</dt>
                <dd className="font-medium text-slate-900">{supplier.name}</dd>
              </div>
              {supplier.contactName && (
                <div>
                  <dt className="text-slate-500 text-xs">Contact</dt>
                  <dd className="text-slate-700">{supplier.contactName}</dd>
                </div>
              )}
              {supplier.email && (
                <div>
                  <dt className="text-slate-500 text-xs">Email</dt>
                  <dd className="text-slate-700 break-all">{supplier.email}</dd>
                </div>
              )}
              {supplier.phone && (
                <div>
                  <dt className="text-slate-500 text-xs">Phone</dt>
                  <dd className="text-slate-700">{supplier.phone}</dd>
                </div>
              )}
              <div>
                <dt className="text-slate-500 text-xs">Lead time</dt>
                <dd className="text-slate-700">
                  {supplier.leadTimeDays} days
                </dd>
              </div>
              <div className="pt-2">
                <Link
                  to="/dashboard/suppliers"
                  className="text-sm font-medium text-brand-700 hover:text-brand-800"
                >
                  View all suppliers →
                </Link>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-slate-500">
              {po.supplierName} (no longer in supplier list)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
