import React from "react";
import { cn } from "../../utils/cn";

/**
 * Segmented control used for status filters and in-page tabs.
 * items: [{ value, label, count?, icon? }]
 */
export const Tabs = ({ items, value, onChange, label = "Filter", className, size = "md" }) => (
  <div
    role="tablist"
    aria-label={label}
    className={cn(
      "inline-flex max-w-full gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-100/70 p-1 scrollbar-thin",
      className
    )}
  >
    {items.map(({ value: v, label: l, count, icon: Icon }) => {
      const active = v === value;
      return (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(v)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-md font-semibold transition-colors",
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
            active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          )}
        >
          {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
          {l}
          {count != null && (
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px] tabular",
                active ? "bg-brand-100 text-brand-700" : "bg-slate-200 text-slate-600"
              )}
            >
              {count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
