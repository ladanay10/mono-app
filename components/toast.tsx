"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { useIsClient } from "@/lib/hooks/use-is-client";
import { createPortal } from "react-dom";
import { IconAlert, IconCheck, IconX } from "@/components/icons";

type ToastTone = "success" | "error" | "info";
type Toast = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (t: { title: string; description?: string; tone?: ToastTone }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const mounted = useIsClient();
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({
      title,
      description,
      tone = "info",
    }: {
      title: string;
      description?: string;
      tone?: ToastTone;
    }) => {
      const id = nextId++;
      setToasts((list) => [...list, { id, title, description, tone }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), 4000),
      );
    },
    [dismiss],
  );

  const success = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, tone: "success" }),
    [toast],
  );
  const error = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, tone: "error" }),
    [toast],
  );

  return (
    <ToastContext.Provider value={{ toast, success, error }}>
      {children}
      {mounted &&
        createPortal(
          <div
            aria-live="polite"
            // Clear the bottom tab bar AND the iOS home indicator on phones.
            className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-1200 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:items-end lg:bottom-5"
          >
            {toasts.map((t) => (
              <ToastCard key={t.id} toast={t} onClose={() => dismiss(t.id)} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const tones = {
    success: {
      icon: <IconCheck width={17} height={17} />,
      wrap: "bg-sage-tint text-sage-ink",
    },
    error: {
      icon: <IconAlert width={17} height={17} />,
      wrap: "bg-clay-tint text-clay-ink",
    },
    info: {
      icon: <IconCheck width={17} height={17} />,
      wrap: "bg-bloom-tint text-bloom-ink",
    },
  }[toast.tone];

  const hasDesc = !!toast.description;

  return (
    <div
      className={`animate-pop-in pointer-events-auto flex w-full max-w-sm gap-3 rounded-2xl border border-line-strong bg-surface-soft p-3.5 shadow-pop ring-1 ring-white/6 ${
        hasDesc ? "items-start" : "items-center"
      }`}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tones.wrap}`}
      >
        {tones.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-ink">{toast.title}</div>
        {hasDesc && (
          <div className="mt-0.5 text-xs text-ink-soft">
            {toast.description}
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        aria-label="Закрити"
        className={`grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-md text-ink-faint transition-colors hover:bg-ink/10 hover:text-ink ${
          hasDesc ? "mt-0.5" : ""
        }`}
      >
        <IconX width={14} height={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
