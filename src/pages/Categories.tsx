import { useInventory } from "../context/InventoryContext";

export default function Categories() {
  const { items, categories } = useInventory();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
        <p className="text-sm text-slate-500 mt-1">
          Summary by product category (updates with stock changes)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const itemsInCat = items.filter(
            (i) => i.category === cat.name
          );
          return (
            <div
              key={cat.name}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-brand-200 transition-colors"
            >
              <h3 className="font-semibold text-slate-900">{cat.name}</h3>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">SKUs</dt>
                  <dd className="font-medium text-slate-800">
                    {cat.itemCount}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Stock value</dt>
                  <dd className="font-medium text-slate-800">
                    ${cat.totalValue.toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Units on hand</dt>
                  <dd className="font-medium text-slate-800">
                    {itemsInCat.reduce((s, i) => s + i.quantity, 0)}
                  </dd>
                </div>
              </dl>
              <ul className="mt-4 pt-4 border-t border-slate-100 space-y-1">
                {itemsInCat.map((item) => (
                  <li
                    key={item.id}
                    className="text-xs text-slate-600 truncate"
                  >
                    {item.name}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
