import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  FiClock,
  FiEdit2,
  FiMail,
  FiPhone,
  FiPlus,
  FiTrash2,
  FiTruck,
  FiX,
} from "react-icons/fi";
import { StatCard } from "../components/StatsCards";
import { useInventory } from "../context/InventoryContext";
import { useProcurement } from "../context/ProcurementContext";
import type { NewSupplier, Supplier } from "../types/inventory";

const emptyForm: NewSupplier & { categories: string[] } = {
  name: "",
  contactName: "",
  email: "",
  phone: "",
  leadTimeDays: 14,
  categories: [],
  notes: "",
};

export default function Suppliers() {
  const { items } = useInventory();
  const {
    suppliers,
    purchaseOrders,
    addSupplier,
    updateSupplier,
    deleteSupplier,
  } = useProcurement();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [categoriesText, setCategoriesText] = useState("");
  const [error, setError] = useState("");

  const inventoryCategories = useMemo(
    () => [...new Set(items.map((i) => i.category))].sort(),
    [items]
  );

  const poCountBySupplier = useMemo(() => {
    const map: Record<string, number> = {};
    for (const po of purchaseOrders) {
      if (po.status === "draft" || po.status === "ordered") {
        map[po.supplierId] = (map[po.supplierId] ?? 0) + 1;
      }
    }
    return map;
  }, [purchaseOrders]);

  const totalLeadTime =
    suppliers.length > 0
      ? Math.round(
          suppliers.reduce((s, sup) => s + sup.leadTimeDays, 0) /
            suppliers.length
        )
      : 0;

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setCategoriesText("");
    setError("");
    setModalOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name,
      contactName: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone,
      leadTimeDays: supplier.leadTimeDays,
      categories: supplier.categories,
      notes: supplier.notes,
    });
    setCategoriesText(supplier.categories.join(", "));
    setError("");
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const payload: NewSupplier = {
      ...form,
      leadTimeDays: Number(form.leadTimeDays) || 0,
      categories: categoriesText
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    };

    const err = editingId
      ? updateSupplier(editingId, payload)
      : addSupplier(payload);

    if (err) {
      setError(err);
      return;
    }
    setModalOpen(false);
  }

  function handleDelete(supplier: Supplier) {
    const openPos = poCountBySupplier[supplier.id] ?? 0;
    const warning =
      openPos > 0
        ? `${supplier.name} has ${openPos} open purchase order(s). Delete anyway?`
        : `Delete ${supplier.name}?`;
    if (window.confirm(warning)) {
      deleteSupplier(supplier.id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Suppliers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Vendors you purchase inventory from
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shrink-0"
        >
          <FiPlus size={16} />
          Add supplier
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Suppliers"
          value={String(suppliers.length)}
          sub="Active vendors"
          icon={<FiTruck size={20} />}
          accent="teal"
        />
        <StatCard
          label="Avg. lead time"
          value={`${totalLeadTime} days`}
          sub="Across all suppliers"
          icon={<FiClock size={20} />}
          accent="slate"
        />
        <StatCard
          label="Categories covered"
          value={String(
            new Set(suppliers.flatMap((s) => s.categories)).size
          )}
          sub={`of ${inventoryCategories.length} in inventory`}
          icon={<FiTruck size={20} />}
          accent="amber"
        />
      </div>

      {suppliers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FiTruck size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No suppliers yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Add your first vendor to start creating purchase orders.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((supplier) => {
            const openPos = poCountBySupplier[supplier.id] ?? 0;
            return (
              <div
                key={supplier.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-brand-200 transition-colors flex flex-col"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {supplier.name}
                    </h3>
                    {supplier.contactName && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {supplier.contactName}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(supplier)}
                      title="Edit supplier"
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      <FiEdit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(supplier)}
                      title="Delete supplier"
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-sm text-slate-600">
                  {supplier.email && (
                    <p className="flex items-center gap-2 truncate">
                      <FiMail size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{supplier.email}</span>
                    </p>
                  )}
                  {supplier.phone && (
                    <p className="flex items-center gap-2">
                      <FiPhone size={14} className="text-slate-400 shrink-0" />
                      {supplier.phone}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <FiClock size={14} className="text-slate-400 shrink-0" />
                    {supplier.leadTimeDays} day lead time
                  </p>
                </div>

                {supplier.categories.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {supplier.categories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                {supplier.notes && (
                  <p className="mt-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
                    {supplier.notes}
                  </p>
                )}

                <div className="mt-auto pt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {openPos > 0 ? `${openPos} open PO` : "No open POs"}
                    {openPos > 1 ? "s" : ""}
                  </span>
                  <Link
                    to="/dashboard/purchase-orders/new"
                    state={{ supplierId: supplier.id }}
                    className="font-medium text-brand-700 hover:text-brand-800"
                  >
                    New PO →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? "Edit supplier" : "Add supplier"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Supplier name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Acme Distribution"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Contact name
                  </label>
                  <input
                    value={form.contactName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, contactName: e.target.value }))
                    }
                    placeholder="Jane Doe"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Lead time (days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.leadTimeDays}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        leadTimeDays: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="orders@acme.com"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Phone
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Categories supplied
                </label>
                <input
                  value={categoriesText}
                  onChange={(e) => setCategoriesText(e.target.value)}
                  list="inventory-categories"
                  placeholder="Electronics, Office"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
                <datalist id="inventory-categories">
                  {inventoryCategories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <p className="text-xs text-slate-400 mt-1">
                  Comma-separated. Used to auto-assign reorders to suppliers.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                  placeholder="MOQ, payment terms, etc."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  {editingId ? "Save changes" : "Add supplier"}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="inline-flex items-center px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
