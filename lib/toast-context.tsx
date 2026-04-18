"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/utils";

interface ToastItem { id: number; message: string; }
interface ToastCtxValue { show: (message: string) => void; }

const ToastCtx = createContext<ToastCtxValue>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      {/* Toast stack — bottom-right, above everything */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 shadow-lg",
              "text-[13px] font-medium text-white",
              "animate-in slide-in-from-right-4 fade-in duration-200"
            )}
          >
            <span className="text-emerald-400">✓</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
