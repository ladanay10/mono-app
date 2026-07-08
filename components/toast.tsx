'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconAlert, IconCheck, IconX } from '@/components/icons';

type ToastTone = 'success' | 'error' | 'info';
type Toast = { id: number; title: string; description?: string; tone: ToastTone };

type ToastContextValue = {
  toast: (t: { title: string; description?: string; tone?: ToastTone }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({ title, description, tone = 'info' }: { title: string; description?: string; tone?: ToastTone }) => {
      const id = nextId++;
      setToasts((list) => [...list, { id, title, description, tone }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), 4000),
      );
    },
    [dismiss],
  );

  const success = useCallback((title: string, description?: string) => toast({ title, description, tone: 'success' }), [toast]);
  const error = useCallback((title: string, description?: string) => toast({ title, description, tone: 'error' }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error }}>
      {children}
      {mounted &&
        createPortal(
          <div
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 bottom-24 z-1200 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:items-end lg:bottom-5"
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
    success: { icon: <IconCheck width={16} height={16} />, wrap: 'bg-sage-tint text-sage' },
    error: { icon: <IconAlert width={16} height={16} />, wrap: 'bg-clay-tint text-clay' },
    info: { icon: <IconCheck width={16} height={16} />, wrap: 'bg-bloom-tint text-bloom' },
  }[toast.tone];

  return (
    <div className="animate-pop-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-pop">
      <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tones.wrap}`}>
        {tones.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-ink">{toast.title}</div>
        {toast.description && <div className="mt-0.5 text-xs text-ink-soft">{toast.description}</div>}
      </div>
      <button
        onClick={onClose}
        aria-label="Закрити"
        className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-md text-ink-faint transition-colors hover:bg-ink/5 hover:text-ink"
      >
        <IconX width={14} height={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
