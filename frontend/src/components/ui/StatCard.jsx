import React from "react";
import { cn } from "../../utils/cn";

const TONES = {
  brand:   "bg-brand-50 text-brand-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger:  "bg-rose-50 text-rose-700",
  info:    "bg-sky-50 text-sky-700",
  neutral: "bg-slate-100 text-slate-600",
};

/** KPI tile. Value text always stays in ink; only the icon chip carries tone. */
export const StatCard = ({ label, value, icon: Icon, tone = "brand", hint, loading }) => (
  <div className="card flex min-w-0 items-start gap-4 p-3.5 sm:p-5">
    {Icon && (
      <span className={cn("hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:flex", TONES[tone])}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    )}
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      {loading
        ? <div className="skeleton mt-1.5 h-7 w-16" />
        : <p className="mt-0.5 truncate text-xl font-bold tabular text-slate-900 sm:text-2xl">{value}</p>}
      {hint && !loading && <p className="mt-0.5 truncate text-xs text-slate-500">{hint}</p>}
    </div>
  </div>
);
