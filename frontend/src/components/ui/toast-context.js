import { createContext, useContext } from "react";

export const ToastContext = createContext(null);

/**
 * const toast = useToast();
 * toast("Saved");                 // success
 * toast("Could not save", "error");
 */
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
};
