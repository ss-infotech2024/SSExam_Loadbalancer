import React from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, RefreshCw, XCircle } from "lucide-react";
import { cn } from "../../utils/cn";
import { Button } from "./Button";

export const Spinner = ({ className, label = "Loading" }) => (
  <Loader2 className={cn("h-5 w-5 animate-spin text-brand-600", className)} aria-label={label} role="status" />
);

export const Skeleton = ({ className }) => <div className={cn("skeleton", className)} aria-hidden="true" />;

/** Centered loader for whole sections or pages. */
export const LoadingState = ({ label = "Loading…", className }) => (
  <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-sm text-slate-500", className)} role="status">
    <Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-hidden="true" />
    {label}
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
    {Icon && (
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
    )}
    <p className="text-sm font-semibold text-slate-800">{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const ErrorState = ({ title = "Something went wrong", message, onRetry, className }) => (
  <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)} role="alert">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
      <AlertTriangle className="h-6 w-6" aria-hidden="true" />
    </div>
    <p className="text-sm font-semibold text-slate-800">{title}</p>
    {message && <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>}
    {onRetry && (
      <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry} className="mt-5">Try again</Button>
    )}
  </div>
);

const ALERT = {
  info:    { cls: "border-sky-200 bg-sky-50 text-sky-900",             icon: Info,          ic: "text-sky-600" },
  success: { cls: "border-emerald-200 bg-emerald-50 text-emerald-900", icon: CheckCircle2,  ic: "text-emerald-600" },
  warning: { cls: "border-amber-200 bg-amber-50 text-amber-900",       icon: AlertTriangle, ic: "text-amber-600" },
  danger:  { cls: "border-rose-200 bg-rose-50 text-rose-900",          icon: XCircle,       ic: "text-rose-600" },
  brand:   { cls: "border-brand-200 bg-brand-50 text-brand-900",       icon: Info,          ic: "text-brand-600" },
};

/** Inline message block. */
export const Alert = ({ tone = "info", title, children, action, icon, className }) => {
  const a = ALERT[tone];
  const Icon = icon || a.icon;
  return (
    <div
      className={cn("flex items-start gap-3 rounded-lg border px-4 py-3 text-sm", a.cls, className)}
      role={tone === "danger" ? "alert" : undefined}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", a.ic)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "opacity-90")}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
