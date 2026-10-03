import React from "react";
import { cn } from "../../utils/cn";

const SIZES = { sm: "h-8 w-8 text-xs", md: "h-9 w-9 text-sm", lg: "h-12 w-12 text-base", xl: "h-16 w-16 text-xl" };

/** Initial-letter avatar. */
export const Avatar = ({ name, size = "md", className }) => (
  <span
    className={cn(
      "inline-flex shrink-0 select-none items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700",
      SIZES[size],
      className
    )}
    aria-hidden="true"
  >
    {(String(name || "?").trim()[0] || "?").toUpperCase()}
  </span>
);
