import React from "react";
import { cn } from "../../utils/cn";

/** Page title block — the first thing on every screen. */
export const PageHeader = ({ title, description, actions, eyebrow, className }) => (
  <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
    <div className="min-w-0">
      {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px]">{title}</h1>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const SectionHeader = ({ title, description, actions, className }) => (
  <div className={cn("mb-3 flex flex-wrap items-end justify-between gap-2", className)}>
    <div>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
    </div>
    {actions}
  </div>
);
