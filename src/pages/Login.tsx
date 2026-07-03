import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { FiBox } from "react-icons/fi";
import { DEMO_ACCOUNT, useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to={from} replace />;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const err = login(email, password);
    if (err) {
      setError(err);
      return;
    }
    navigate(from, { replace: true });
  }

  function handleDemoLogin() {
    setError("");
    setEmail(DEMO_ACCOUNT.email);
    setPassword(DEMO_ACCOUNT.password);
    const err = login(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password);
    if (err) {
      setError(err);
      return;
    }
    navigate(from, { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
              <FiBox size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 leading-tight">
                Inventory
              </p>
              <p className="text-[11px] text-slate-500">Dashboard</p>
            </div>
          </Link>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
            <h1 className="text-xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-1">
              Log in to access your inventory dashboard.
            </p>

            <div className="mt-6 p-4 rounded-lg bg-brand-50 border border-brand-100">
              <p className="text-sm font-medium text-brand-800">Demo account</p>
              <p className="text-xs text-brand-700/80 mt-1 font-mono">
                {DEMO_ACCOUNT.email} / {DEMO_ACCOUNT.password}
              </p>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="mt-3 w-full py-2 rounded-lg border border-brand-200 bg-white text-sm font-medium text-brand-700 hover:bg-brand-100/50 transition-colors"
              >
                Log in as Demo User
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                Log in
              </button>
            </form>

            <p className="text-sm text-slate-500 text-center mt-6">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-brand-700 hover:text-brand-800"
              >
                Sign up
              </Link>
            </p>
          </div>

          <p className="text-center mt-6">
            <Link
              to="/"
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
