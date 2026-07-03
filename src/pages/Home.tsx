import { Link } from "react-router";
import {
  FiAlertTriangle,
  FiBarChart2,
  FiLayers,
  FiPackage,
  FiSearch,
  FiTrendingUp,
} from "react-icons/fi";
import PublicNavbar from "../components/PublicNavbar";

const features = [
  {
    icon: FiBarChart2,
    title: "Real-time overview",
    description:
      "See total SKUs, inventory value, and stock health at a glance from one dashboard.",
  },
  {
    icon: FiSearch,
    title: "Smart search & filters",
    description:
      "Find items by name, SKU, or category. Filter by stock status in seconds.",
  },
  {
    icon: FiAlertTriangle,
    title: "Low-stock alerts",
    description:
      "Spot items below reorder level before they run out and disrupt operations.",
  },
  {
    icon: FiLayers,
    title: "Category insights",
    description:
      "Break down inventory by category to understand where your stock is concentrated.",
  },
];

const steps = [
  {
    step: "01",
    title: "Create your account",
    description: "Sign up in under a minute — no credit card required for the demo.",
  },
  {
    step: "02",
    title: "Explore your dashboard",
    description:
      "Review stats, browse inventory, and check categories with sample data.",
  },
  {
    step: "03",
    title: "Stay ahead of stockouts",
    description:
      "Use attention-needed views to prioritize restocking before shelves go empty.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-800/40 via-slate-900 to-slate-900" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-brand-700/30 text-brand-100 border border-brand-700/50 mb-6">
              <FiTrendingUp size={12} />
              Inventory management made simple
            </span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
              Know what you have.
              <span className="text-brand-500"> Before you run out.</span>
            </h1>
            <p className="text-lg text-slate-400 mt-5 leading-relaxed">
              Track SKUs, monitor stock levels, and catch low-inventory items
              early — all from a clean, focused dashboard built for small teams.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors"
              >
                Get started free
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-600 text-slate-200 font-medium hover:bg-slate-800 transition-colors"
              >
                Log in
              </Link>
            </div>
          </div>

          {/* Preview cards */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: "Total SKUs", value: "24", icon: FiPackage },
              { label: "Inventory value", value: "$12.4k", icon: FiBarChart2 },
              { label: "Low stock", value: "5", icon: FiAlertTriangle },
              { label: "Out of stock", value: "2", icon: FiPackage },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400">{label}</p>
                  <Icon size={14} className="text-brand-500" />
                </div>
                <p className="text-xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            Everything you need to manage stock
          </h2>
          <p className="text-slate-500 mt-3">
            A focused toolkit for tracking inventory — no clutter, no steep
            learning curve.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100 mb-4">
                <Icon size={20} />
              </span>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              Up and running in minutes
            </h2>
            <p className="text-slate-500 mt-3">
              Three steps from sign-up to a working inventory view.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ step, title, description }) => (
              <div key={step}>
                <span className="text-3xl font-bold text-brand-600/30">
                  {step}
                </span>
                <h3 className="font-semibold text-slate-900 mt-2">{title}</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-slate-900 rounded-2xl px-8 py-12 md:px-12 md:py-14 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Ready to take control of your inventory?
          </h2>
          <p className="text-slate-400 mt-3 max-w-lg mx-auto">
            Create a free account and explore the dashboard with sample data
            today.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors"
            >
              Sign up free
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-600 text-slate-300 font-medium hover:bg-slate-800 transition-colors"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>Inventory Dashboard · Demo data · v0.1</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-slate-700 transition-colors">
              Log in
            </Link>
            <Link to="/signup" className="hover:text-slate-700 transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
