import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

// Literal class names so Tailwind's content scan keeps them in the build
const SIZES = { sm: "btn-sm", md: "btn-md", lg: "btn-lg" };
const ICON_SIZES = { sm: "btn-icon-sm", md: "btn-icon-md" };

const VARIANTS = {
  primary:   "btn-primary",
  secondary: "btn-secondary",
  ghost:     "btn-ghost",
  subtle:    "btn-subtle",
  danger:    "btn-danger",
  "danger-ghost": "btn-danger-ghost",
  success:   "btn-success",
};

/**
 * Button — the one button used across the app.
 * `icon` renders before the label; `loading` swaps it for a spinner and disables the button.
 */
export const Button = ({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  fullWidth = false,
  ...rest
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={cn("btn", SIZES[size], VARIANTS[variant], fullWidth && "w-full", className)}
    {...rest}
  >
    {loading
      ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      : Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
    {children}
    {IconRight && !loading && <IconRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
  </button>
);

/** Square icon-only button. `label` is required: it becomes the accessible name and tooltip. */
export const IconButton = ({
  icon: Icon,
  label,
  variant = "ghost",
  size = "md",
  loading = false,
  disabled,
  className,
  type = "button",
  ...rest
}) => (
  <button
    type={type}
    aria-label={label}
    title={label}
    disabled={disabled || loading}
    className={cn("btn", ICON_SIZES[size], VARIANTS[variant], className)}
    {...rest}
  >
    {loading
      ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      : <Icon className="h-4 w-4" aria-hidden="true" />}
  </button>
);
