import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { FiPlus } from "react-icons/fi";
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

export default function AddProduct() {
  const { items, addItem } = useInventory();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const existingCategories = useMemo(
    () => [...new Set(items.map((i) => i.category))].sort(),
    [items]
  );

  function handleChange(
    field: keyof typeof emptyForm,
    value: string
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const err = addItem({
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add product</h1>
        <p className="text-sm text-slate-500 mt-1">
          Create a new SKU in your inventory
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
              placeholder="SKU-6001"
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
              list="categories"
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
              placeholder="Electronics"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
            <datalist id="categories">
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
            placeholder="Wireless Mouse"
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
              placeholder="29.99"
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
            placeholder="Warehouse A · Shelf 5"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <FiPlus size={16} />
            Add product
          </button>
          <Link
            to="/dashboard/inventory"
            className="inline-flex items-center px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
