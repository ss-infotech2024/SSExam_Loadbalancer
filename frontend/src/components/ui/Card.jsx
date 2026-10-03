import React from "react";
import { cn } from "../../utils/cn";

export const Card = ({ as: Tag = "div", className, children, ...rest }) => (
  <Tag className={cn("card", className)} {...rest}>{children}</Tag>
);

/** Card header row: title (+ optional description / icon) on the left, actions on the right. */
export const CardHeader = ({ title, description, icon: Icon, actions, className }) => (
  <div className={cn("card-header", className)}>
    <div className="flex min-w-0 items-center gap-3">
      {Icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0">
        <h2 className="card-title truncate">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
