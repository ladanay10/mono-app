'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useIsClient } from '@/lib/hooks/use-is-client';
import { createPortal } from 'react-dom';
import { IconX } from '@/components/icons';
import { Button } from '@/components/ui';

/* ------------------------------------------------------------------ *
 * Modal — portal, scrim, scroll-lock, Esc to close, animated
 * ------------------------------------------------------------------ */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const mounted = useIsClient();
  const cardRef = useRef<HTMLDivElement>(null);

  // Keep the latest onClose without making it an effect dependency — otherwise
  // an inline `onClose={() => ...}` prop is a new reference every parent render,
  // which re-runs the effect on every keystroke and steals focus back to the card.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });


  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);

    // iOS Safari ignores `overflow: hidden` on <body> — the page keeps scrolling
    // (and rubber-banding) behind the sheet. Pinning the body and restoring the
    // scroll offset on close is the only lock that actually holds there.
    const body = document.body;
    const scrollY = window.scrollY;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    // Focus the dialog for a11y/Esc, but never yank focus away from an element
    // already focused inside it (e.g. an autoFocus input).
    requestAnimationFrame(() => {
      const card = cardRef.current;
      if (card && !card.contains(document.activeElement)) card.focus();
    });

    return () => {
      document.removeEventListener('keydown', onKey);
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!mounted || !open) return null;

  // On a phone the modal IS a bottom sheet — it must span the full width. The
  // max-width only kicks in once it becomes a centred dialog (sm and up).
  const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };

  return createPortal(
    <div className="fixed inset-0 z-1100 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="animate-fade-in absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        // pb-safe: on a phone the sheet sits flush with the bottom, so the footer
        // buttons would otherwise land under the iOS home indicator.
        className={`animate-rise-in relative flex w-full ${widths[size]} max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl border border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-pop outline-none sm:rounded-3xl sm:pb-0`}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              {title && <h2 className="text-lg font-semibold text-ink">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Закрити"
              className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-faint transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <IconX width={18} height={18} />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-soft px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ *
 * Confirm dialog — imperative, promise-based
 * ------------------------------------------------------------------ */
type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type ConfirmContextValue = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(v: boolean) => void>(null);

  const confirm = useCallback<ConfirmContextValue>((opts) => {
    setState(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={state !== null}
        onClose={() => close(false)}
        title={state?.title}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => close(false)}>
              {state?.cancelText ?? 'Скасувати'}
            </Button>
            <Button variant={state?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
              {state?.confirmText ?? 'Підтвердити'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">{state?.description}</p>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
