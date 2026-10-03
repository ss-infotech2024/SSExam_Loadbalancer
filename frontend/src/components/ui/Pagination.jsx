import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";

/** Footer pagination: "Showing x–y of n" + prev / page numbers / next. */
export const Pagination = ({ page, pageSize, total, onChange, className }) => {
  if (total === 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // Compact page list: 1 … p-1 p p+1 … N
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "gap") pages.push("gap");
  }

  const btn = "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold transition-colors";

  return (
    <div className={cn("flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row", className)}>
      <p className="text-xs text-slate-500 tabular">
        Showing <span className="font-semibold text-slate-700">{start}–{end}</span> of{" "}
        <span className="font-semibold text-slate-700">{total}</span>
      </p>
      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            onClick={() => onChange(page - 1)}
            disabled={page === 1}
            className={cn(btn, "text-slate-600 hover:bg-slate-100 disabled:opacity-40")}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pages.map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} className="px-1 text-xs text-slate-400">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(btn, p === page ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100")}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            onClick={() => onChange(page + 1)}
            disabled={page === totalPages}
            className={cn(btn, "text-slate-600 hover:bg-slate-100 disabled:opacity-40")}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
};
