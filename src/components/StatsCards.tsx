import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  accent?: "teal" | "amber" | "rose" | "slate";
}

const accentStyles = {
  teal: "bg-teal-50 text-teal-700 border-teal-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  rose: "bg-rose-50 text-rose-700 border-rose-100",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
};

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "teal",
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg border ${accentStyles[accent]}`}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}
