import { Link, NavLink } from "react-router";
import { FiBox } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export default function PublicNavbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <FiBox size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">
              Inventory
            </p>
            <p className="text-[11px] text-slate-500">Dashboard</p>
          </div>
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <a
            href="#features"
            className="text-slate-400 hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-slate-400 hover:text-white transition-colors"
          >
            How it works
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <NavLink
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-2"
              >
                Log in
              </NavLink>
              <Link
                to="/signup"
                className="text-sm font-medium px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
