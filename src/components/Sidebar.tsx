import { NavLink, useNavigate } from "react-router";
import {
  FiActivity,
  FiBox,
  FiPlusCircle,
  FiGrid,
  FiLayers,
  FiLogOut,
  FiPackage,
  FiShoppingCart,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: FiGrid, end: true },
  { to: "/dashboard/inventory", label: "Inventory", icon: FiPackage, end: false },
  { to: "/dashboard/add-product", label: "Add product", icon: FiPlusCircle, end: false },
  { to: "/dashboard/reorders", label: "Reorders", icon: FiShoppingCart, end: false },
  { to: "/dashboard/categories", label: "Categories", icon: FiLayers, end: false },
  { to: "/dashboard/activity", label: "Activity", icon: FiActivity, end: false },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <aside className="w-56 shrink-0 bg-slate-900 text-slate-300 flex flex-col min-h-screen">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <FiBox size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">
              Inventory
            </p>
            <p className="text-[11px] text-slate-500">Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-700/80 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800 space-y-2">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        >
          <FiLogOut size={18} />
          Log out
        </button>
        <p className="px-3 text-xs text-slate-500">Demo data · v0.1</p>
      </div>
    </aside>
  );
}
