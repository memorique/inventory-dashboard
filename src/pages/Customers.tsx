import { useMemo, useState } from "react";
import { Link } from "react-router";
import { FiDollarSign, FiSearch, FiShoppingBag, FiUser } from "react-icons/fi";
import { StatCard } from "../components/StatsCards";
import { useSales } from "../context/SalesContext";
import { getCustomerSummaries } from "../utils/sales";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function Customers() {
  const { salesOrders } = useSales();
  const [query, setQuery] = useState("");

  const customers = useMemo(
    () => getCustomerSummaries(salesOrders),
    [salesOrders]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [customers, query]);

  const totalRevenue = customers.reduce((s, c) => s + c.shippedValue, 0);
  const withOpenOrders = customers.filter((c) => c.openCount > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <p className="text-sm text-slate-500 mt-1">
          Everyone you've sold to, built from sales orders
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Customers"
          value={String(customers.length)}
          sub="With at least one order"
          icon={<FiUser size={20} />}
          accent="teal"
        />
        <StatCard
          label="Shipped revenue"
          value={formatMoney(totalRevenue)}
          sub="Across all customers"
          icon={<FiDollarSign size={20} />}
          accent="slate"
        />
        <StatCard
          label="Open orders"
          value={String(withOpenOrders)}
          sub="Customers with drafts or orders to ship"
          icon={<FiShoppingBag size={20} />}
          accent="amber"
        />
      </div>

      <div className="relative sm:w-72">
        <FiSearch
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name or email…"
          className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          {customers.length === 0 ? (
            <>
              No customers yet.{" "}
              <Link
                to="/dashboard/sales-orders/new"
                className="font-medium text-brand-700 hover:text-brand-800"
              >
                Create a sales order
              </Link>{" "}
              to add one.
            </>
          ) : (
            "No customers match your search."
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold text-right">Orders</th>
                  <th className="px-4 py-3 font-semibold text-right">Open</th>
                  <th className="px-4 py-3 font-semibold text-right">
                    Shipped revenue
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">
                    Open value
                  </th>
                  <th className="px-4 py-3 font-semibold">Last order</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr
                    key={`${c.email}|${c.name}`}
                    className="hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{c.name}</p>
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="text-xs text-slate-500 hover:text-brand-700"
                        >
                          {c.email}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {c.orderCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {c.openCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatMoney(c.shippedValue)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {formatMoney(c.openValue)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {formatDate(c.lastOrderAt)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        to={`/dashboard/sales-orders?q=${encodeURIComponent(c.name)}`}
                        className="text-xs font-medium text-brand-700 hover:text-brand-800"
                      >
                        View orders →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
