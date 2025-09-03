"use client";

import * as React from "react";
import {
  ToastProvider as ShadToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  type ToastProps as ShadToastProps,
  type ToastActionElement,
} from "@/components/ui/toast";

// Данные одного тоста
type ToastData = ShadToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

// Контекст
const ToastContext = React.createContext<{
  toast: (props: Omit<ToastData, "id">) => { id: string; dismiss: () => void };
} | null>(null);

// Генератор ID
let toastCount = 0;
function genId() {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER;
  return toastCount.toString();
}

// Провайдер
export function ToastProviderWrapper({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const toast = (props: Omit<ToastData, "id">) => {
    const id = genId();

    const dismiss = () => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const newToast: ToastData = {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
        props.onOpenChange?.(open);
      },
    };

    setToasts((prev) => [newToast, ...prev]);

    // Авто-дисплей через 3 секунды
    setTimeout(dismiss, 3000);

    return { id, dismiss };
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      <ShadToastProvider>
        {children}
        {toasts.map((t) => (
          <Toast key={t.id} {...t}>
            {t.title && <ToastTitle>{t.title}</ToastTitle>}
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
            {t.action && <ToastAction>{t.action}</ToastAction>}
          </Toast>
        ))}
        <ToastViewport className="fixed top-0 right-0 p-4 z-[9999]" />
      </ShadToastProvider>
    </ToastContext.Provider>
  );
}

// Хук для использования тостов
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProviderWrapper");
  return context;
}
