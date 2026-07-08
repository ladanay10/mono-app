'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconCheck, IconChevronDown, IconSearch } from '@/components/icons';

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  group?: string;
};

type Pos = { left: number; top: number; width: number; openUp: boolean; maxH: number };

const GAP = 6;

export function Select<T extends string>({
  value,
  onChange,
  options,
  placeholder = 'Оберіть…',
  searchable = false,
  disabled = false,
  ariaLabel,
  className = '',
  buttonClassName = '',
  size = 'md',
  emptyText = 'Нічого не знайдено',
}: {
  value: T | '';
  onChange: (v: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  buttonClassName?: string;
  size?: 'sm' | 'md';
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<Pos | null>(null);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typeahead = useRef<{ buffer: string; at: number }>({ buffer: '', at: 0 });
  const listboxId = useId();

  useEffect(() => setMounted(true), []);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.hint?.toLowerCase().includes(q),
    );
  }, [options, query, searchable]);

  const reposition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const openUp = spaceBelow < 280 && spaceAbove > spaceBelow;
    const maxH = Math.min(320, (openUp ? spaceAbove : spaceBelow) - 16);
    setPos({
      left: r.left,
      top: openUp ? r.top - GAP : r.bottom + GAP,
      width: r.width,
      openUp,
      maxH: Math.max(160, maxH),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    reposition();
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => reposition();
    const onResize = () => reposition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, reposition]);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // when opening: focus search, set active to selected
  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    const idx = filtered.findIndex((o) => o.value === value);
    setActive(idx >= 0 ? idx : 0);
    if (searchable) requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // keep active in view
  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    node?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  // clamp active when filter shrinks
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  function commit(idx: number) {
    const opt = filtered[idx];
    if (!opt) return;
    onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onTriggerKey(e: React.KeyboardEvent) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key) && !open) {
      e.preventDefault();
      setOpen(true);
      return;
    }
  }

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(filtered.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commit(active);
    } else if (e.key === 'Tab') {
      setOpen(false);
    } else if (!searchable && e.key.length === 1) {
      // type-ahead
      const now = Date.now();
      const t = typeahead.current;
      t.buffer = now - t.at > 800 ? e.key : t.buffer + e.key;
      t.at = now;
      const q = t.buffer.toLowerCase();
      const i = filtered.findIndex((o) => o.label.toLowerCase().startsWith(q));
      if (i >= 0) setActive(i);
    }
  }

  const sizes = {
    sm: 'h-8 px-3 text-[13px]',
    md: 'h-10 px-3.5 text-sm',
  };

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKey}
        className={`flex w-full cursor-pointer items-center gap-2 rounded-xl border bg-surface text-left text-ink outline-none transition-[border-color,box-shadow] duration-150 disabled:cursor-not-allowed disabled:bg-surface-sunk disabled:text-ink-faint ${
          sizes[size]
        } ${
          open
            ? 'border-bloom ring-4 ring-bloom/12'
            : 'border-line-strong hover:border-ink-faint/60'
        } ${buttonClassName}`}
      >
        {selected?.icon && <span className="shrink-0 text-ink-soft">{selected.icon}</span>}
        <span className={`flex-1 truncate ${selected ? 'text-ink' : 'text-ink-faint'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <IconChevronDown
          width={16}
          height={16}
          className={`shrink-0 text-ink-faint transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {mounted &&
        open &&
        pos &&
        createPortal(
          <div
            ref={listRef}
            role="listbox"
            id={listboxId}
            tabIndex={-1}
            aria-activedescendant={filtered[active] ? `${listboxId}-${active}` : undefined}
            onKeyDown={onListKey}
            style={{
              position: 'fixed',
              left: pos.left,
              top: pos.top,
              width: pos.width,
              maxHeight: pos.maxH,
              transform: pos.openUp ? 'translateY(-100%)' : undefined,
              zIndex: 1200, // above modals (1100)
            }}
            className="animate-pop-in flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
          >
            {searchable && (
              <div className="flex items-center gap-2 border-b border-line px-3">
                <IconSearch width={16} height={16} className="shrink-0 text-ink-faint" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onListKey}
                  placeholder="Пошук…"
                  className="h-10 w-full bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none"
                />
              </div>
            )}
            <div className="overflow-y-auto p-1.5">
              {filtered.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-ink-faint">{emptyText}</div>
              )}
              {filtered.map((o, i) => {
                const isActive = i === active;
                const isSelected = o.value === value;
                const prevGroup = filtered[i - 1]?.group;
                const showGroup = o.group && o.group !== prevGroup;
                return (
                  <div key={o.value}>
                    {showGroup && (
                      <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                        {o.group}
                      </div>
                    )}
                    <div
                      id={`${listboxId}-${i}`}
                      role="option"
                      aria-selected={isSelected}
                      data-active={isActive}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => commit(i)}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors ${
                        isActive ? 'bg-bloom-tint text-bloom-ink' : 'text-ink'
                      }`}
                    >
                      {o.icon && (
                        <span className={isActive ? 'text-bloom' : 'text-ink-faint'}>{o.icon}</span>
                      )}
                      <span className="flex-1 truncate">
                        {o.label}
                        {o.hint && (
                          <span className={`ml-1.5 text-xs ${isActive ? 'text-bloom/70' : 'text-ink-faint'}`}>
                            {o.hint}
                          </span>
                        )}
                      </span>
                      {isSelected && <IconCheck width={16} height={16} className="shrink-0 text-bloom" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
