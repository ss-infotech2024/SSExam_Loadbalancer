import React, { useId, useState } from "react";
import { AlertCircle, Eye, EyeOff, Search, X } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Field — label + control + hint/error, wired for accessibility.
 * `children` is a render function receiving the props the control must spread:
 *   <Field label="Email">{(p) => <Input {...p} />}</Field>
 * or a plain element when the caller manages ids itself.
 */
export const Field = ({ label, required, hint, error, className, children, labelAside }) => {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const controlProps = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": [errorId, hintId].filter(Boolean).join(" ") || undefined,
    invalid: !!error,
  };

  return (
    <div className={className}>
      {label && (
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={id} className="label">
            {label}
            {required && <span className="ml-0.5 text-rose-600" aria-hidden="true">*</span>}
            {required && <span className="sr-only"> (required)</span>}
          </label>
          {labelAside}
        </div>
      )}
      {typeof children === "function" ? children(controlProps) : children}
      {error
        ? <p id={errorId} className="field-error"><AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{error}</p>
        : hint && <p id={hintId} className="hint">{hint}</p>}
    </div>
  );
};

export const Input = ({ invalid, icon: Icon, className, ...rest }) => (
  <div className="relative">
    {Icon && (
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
    )}
    <input className={cn("input", Icon && "pl-9", invalid && "input-invalid", className)} {...rest} />
  </div>
);

export const Select = ({ invalid, className, children, ...rest }) => (
  <select className={cn("select", invalid && "input-invalid", className)} {...rest}>
    {children}
  </select>
);

export const PasswordInput = ({ invalid, icon: Icon, className, ...rest }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      )}
      <input
        type={show ? "text" : "password"}
        className={cn("input pr-11", Icon && "pl-9", invalid && "input-invalid", className)}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};

/** Search box with a clear button. */
export const SearchInput = ({ value, onChange, placeholder = "Search…", label = "Search", className }) => (
  <div className={cn("relative", className)}>
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={label}
      className="input pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange("")}
        aria-label="Clear search"
        className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
);

/** Accessible on/off switch. */
export const Switch = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
      checked ? "bg-brand-600" : "bg-slate-300"
    )}
  >
    <span
      className={cn(
        "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
        checked ? "translate-x-[22px]" : "translate-x-0.5"
      )}
    />
  </button>
);
