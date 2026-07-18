import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { FiSave, FiTrash2 } from "react-icons/fi";
import { useInventory } from "../context/InventoryContext";

const emptyForm = {
  sku: "",
  name: "",
  category: "",
  quantity: "0",
  reorderLevel: "10",
  unitPrice: "",
  location: "",
};

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const { items, updateItem, deleteItem } = useInventory();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const item = useMemo(
    () => items.find((i) => i.id === id),
    [items, id]
  );

  const existingCategories = useMemo(
    () => [...new Set(items.map((i) => i.category))].sort(),
    [items]
  );

  useEffect(() => {
    if (!item) {
      setReady(true);
      return;
    }
    setForm({
      sku: item.sku,
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      reorderLevel: String(item.reorderLevel),
      unitPrice: String(item.unitPrice),
      location: item.location,
    });
    setReady(true);
  }, [item]);

  if (ready && !item) {
    return <Navigate to="/dashboard/inventory" replace />;
  }

  function handleChange(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError("");

    const err = updateItem(id, {
      sku: form.sku,
      name: form.name,
      category: form.category,
      quantity: Number(form.quantity) || 0,
      reorderLevel: Number(form.reorderLevel) || 0,
      unitPrice: Number(form.unitPrice) || 0,
      location: form.location,
    });

    if (err) {
      setError(err);
      return;
    }

    navigate("/dashboard/inventory");
  }

  function handleDelete() {
    if (!id || !item) return;
    if (
      !window.confirm(
        `Delete "${item.name}" (${item.sku})? This cannot be undone.`
      )
    ) {
      return;
    }
    const err = deleteItem(id);
    if (err) {
      setError(err);
      return;
    }
    navigate("/dashboard/inventory");
  }

  if (!ready || !item) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit product</h1>
        <p className="text-sm text-slate-500 mt-1">
          Update details for {item.name}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-5"
      >
        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="sku"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              SKU *
            </label>
            <input
              id="sku"
              value={form.sku}
              onChange={(e) => handleChange("sku", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Category *
            </label>
            <input
              id="category"
              list="edit-categories"
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
            <datalist id="edit-categories">
              {existingCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Product name *
          </label>
          <input
            id="name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => handleChange("quantity", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
          <div>
            <label
              htmlFor="reorderLevel"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Reorder at
            </label>
            <input
              id="reorderLevel"
              type="number"
              min="0"
              value={form.reorderLevel}
              onChange={(e) => handleChange("reorderLevel", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
          <div>
            <label
              htmlFor="unitPrice"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Unit price ($)
            </label>
            <input
              id="unitPrice"
              type="number"
              min="0"
              step="0.01"
              value={form.unitPrice}
              onChange={(e) => handleChange("unitPrice", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Location *
          </label>
          <input
            id="location"
            value={form.location}
            onChange={(e) => handleChange("location", e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              <FiSave size={16} />
              Save changes
            </button>
            <Link
              to="/dashboard/inventory"
              className="inline-flex items-center px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm font-medium hover:bg-rose-100 transition-colors"
          >
            <FiTrash2 size={16} />
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
