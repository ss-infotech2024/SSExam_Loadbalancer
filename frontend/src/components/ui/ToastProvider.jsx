import React, { useCallback, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { ToastContext } from "./toast-context";
import { cn } from "../../utils/cn";

const STYLES = {
  success: { icon: CheckCircle2,  ic: "text-emerald-600", bar: "bg-emerald-500" },
  error:   { icon: AlertTriangle, ic: "text-rose-600",    bar: "bg-rose-500" },
  info:    { icon: Info,          ic: "text-brand-600",   bar: "bg-brand-500" },
};

/** App-wide toast stack (top-right on desktop, top on phones). */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const show = useCallback((message, type = "success", duration) => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, message, type }]);
    setTimeout(() => dismiss(id), duration ?? (type === "error" ? 6500 : 4500));
    return id;
  }, [dismiss]);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-3 sm:inset-x-auto sm:right-0 sm:items-end sm:p-5"
        aria-live="polite"
        role="status"
      >
        {toasts.map(({ id, message, type }) => {
          const s = STYLES[type] || STYLES.info;
          const Icon = s.icon;
          return (
            <div
              key={id}
              className="pointer-events-auto relative flex w-full max-w-sm animate-slide-in-right items-start gap-3 overflow-hidden rounded-lg border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm shadow-pop"
            >
              <span className={cn("absolute inset-y-0 left-0 w-1", s.bar)} aria-hidden="true" />
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", s.ic)} aria-hidden="true" />
              <p className="whitespace-pre-line font-medium leading-snug text-slate-800">{message}</p>
              <button
                type="button"
                onClick={() => dismiss(id)}
                aria-label="Dismiss notification"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
