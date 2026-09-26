import { createContext, useContext } from "react";

export type ToastType = "success" | "danger" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

export interface ToastContextValue {
  showToast: (title: string, type?: ToastType, description?: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
