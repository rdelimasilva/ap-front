/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Toast, ToastType } from '../components/Toast';

interface ToastContextType {
  addToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useToastInternal();
  return (
    <ToastContext.Provider value={toast}>
      {children}
    </ToastContext.Provider>
  );
}

function useToastInternal() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen for global toast events from components that don't have direct access
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        addToast(detail.type, detail.title, detail.message, detail.duration);
      }
    };
    window.addEventListener('showToast', handler);
    return () => window.removeEventListener('showToast', handler);
  }, [addToast]);

  return { toasts, addToast, removeToast };
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context) return context;
  // Fallback for components outside provider (no hooks here)
  return {
    toasts: [],
    addToast: (type: ToastType, title: string, message?: string, duration?: number) => {
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { type, title, message, duration }
      }));
    },
    removeToast: (_id: string) => {}
  };
}

// Global utility for components without useToast access
export function showToast(type: ToastType, title: string, message?: string, duration?: number) {
  window.dispatchEvent(new CustomEvent('showToast', {
    detail: { type, title, message, duration }
  }));
}
