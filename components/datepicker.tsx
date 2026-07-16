"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIsClient } from '@/lib/hooks/use-is-client';
import { createPortal } from "react-dom";
import {
  IconCalendar,
  IconChevronDown,
  IconChevronLeft,
} from "@/components/icons";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const MONTHS = [
  "Січень",
  "Лютий",
  "Березень",
  "Квітень",
  "Травень",
  "Червень",
  "Липень",
  "Серпень",
  "Вересень",
  "Жовтень",
  "Листопад",
  "Грудень",
];

const pad = (n: number) => String(n).padStart(2, "0");
const toStr = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`; // m: 1-12
const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m, d };
};
const fmtDMY = (s: string) => {
  if (!s) return "";
  const { y, m, d } = parse(s);
  return `${pad(d)}.${pad(m)}.${y}`;
};
const daysInMonth = (y: number, m: number) =>
  new Date(Date.UTC(y, m, 0)).getUTCDate();
const firstWeekdayMon = (y: number, m: number) =>
  (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
const todayKyiv = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv" }).format(
    new Date(),
  );
function addMonth(y: number, m: number, delta: number) {
  const idx = y * 12 + (m - 1) + delta;
  return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
}

type Preset = { label: string; range: () => { from: string; to: string } };
type Pos = {
  left: number;
  top: number;
  width: number;
  openUp: boolean;
  maxH: number;
};

/* Popover anchored to a trigger, portaled above modals. Shared by both pickers. */
function useAnchoredPopover(
  open: boolean,
  setOpen: (v: boolean) => void,
  width: number,
) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Pos | null>(null);

  const reposition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // visualViewport reflects what's actually visible (keyboard open, URL bar
    // collapsed); innerHeight does not, which pushed popovers off-screen.
    const vw = window.visualViewport?.width ?? window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const w = Math.min(width, vw - 16);
    let left = r.left;
    if (left + w > vw - 8) left = vw - 8 - w;
    if (left < 8) left = 8;
    const spaceBelow = vh - r.bottom - 14;
    const spaceAbove = r.top - 14;
    const openUp = spaceBelow < 360 && spaceAbove > spaceBelow;
    const maxH = Math.max(0, openUp ? spaceAbove : spaceBelow);
    setPos({
      left,
      top: openUp ? r.top - 6 : r.bottom + 6,
      width: w,
      openUp,
      maxH,
    });
  }, [width]);

  useEffect(() => {
    if (open) reposition();
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const onMove = () => reposition();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    window.visualViewport?.addEventListener("resize", onMove);
    window.visualViewport?.addEventListener("scroll", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
      window.visualViewport?.removeEventListener("resize", onMove);
      window.visualViewport?.removeEventListener("scroll", onMove);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popRef.current?.contains(t))
        return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return { triggerRef, popRef, pos };
}

const POP_STYLE = (pos: Pos): React.CSSProperties => ({
  position: "fixed",
  left: pos.left,
  top: pos.top,
  width: pos.width,
  maxHeight: pos.maxH,
  overflowY: "auto",
  transform: pos.openUp ? "translateY(-100%)" : undefined,
  zIndex: 1200, // above modals (1100)
});

/**
 * Bottom sheet on phones, anchored popover on pointer devices. A calendar
 * anchored near the bottom of a phone screen has nowhere to render — it used to
 * get clipped/squeezed against the viewport edge and the bottom tab bar.
 */
function PopoverShell({
  isMobile,
  pos,
  popRef,
  onClose,
  label,
  children,
}: {
  isMobile: boolean;
  pos: Pos | null;
  popRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
}) {
  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-1200 flex flex-col justify-end">
        <div
          className="animate-fade-in absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          ref={popRef}
          role="dialog"
          aria-label={label}
          className="animate-rise-in relative max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-3xl border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-pop"
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="text-sm font-semibold text-ink">{label}</span>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-sm font-medium text-ink-soft"
            >
              Закрити
            </button>
          </div>
          {children}
        </div>
      </div>,
      document.body,
    );
  }
  if (!pos) return null;
  return createPortal(
    <div
      ref={popRef}
      role="dialog"
      aria-label={label}
      style={POP_STYLE(pos)}
      className="animate-pop-in overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
    >
      {children}
    </div>,
    document.body,
  );
}

function MonthNav({
  view,
  setView,
}: {
  view: { y: number; m: number };
  setView: React.Dispatch<React.SetStateAction<{ y: number; m: number }>>;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <button
        onClick={() => setView((v) => addMonth(v.y, v.m, -1))}
        aria-label="Попередній місяць"
        className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
      >
        <IconChevronLeft width={18} height={18} />
      </button>
      <div className="text-sm font-semibold text-ink">
        {MONTHS[view.m - 1]} {view.y}
      </div>
      <button
        onClick={() => setView((v) => addMonth(v.y, v.m, 1))}
        aria-label="Наступний місяць"
        className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
      >
        <IconChevronLeft width={18} height={18} className="rotate-180" />
      </button>
    </div>
  );
}

function Weekdays() {
  return (
    <div className="grid grid-cols-7">
      {WEEKDAYS.map((w) => (
        <div
          key={w}
          className="grid h-8 place-items-center text-[11px] font-medium uppercase text-ink-faint"
        >
          {w}
        </div>
      ))}
    </div>
  );
}

function useMonthCells(view: { y: number; m: number }) {
  return useMemo(() => {
    const offset = firstWeekdayMon(view.y, view.m);
    const dim = daysInMonth(view.y, view.m);
    const arr: (string | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= dim; d++) arr.push(toStr(view.y, view.m, d));
    return arr;
  }, [view]);
}

/* ------------------------------------------------------------------ *
 * Range picker (with presets) — dashboard
 * ------------------------------------------------------------------ */
export function DateRangePicker({
  from,
  to,
  onChange,
  presets = [],
  className = "",
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  presets?: Preset[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const mounted = useIsClient();
  const [view, setView] = useState(() => {
    const { y, m } = parse(to || from || todayKyiv());
    return { y, m };
  });
  const [start, setStart] = useState(from);
  const [end, setEnd] = useState(to);
  const [phase, setPhase] = useState<"start" | "end">("start");
  const [hover, setHover] = useState<string | null>(null);
  const today = todayKyiv();

  const { triggerRef, popRef, pos } = useAnchoredPopover(open, setOpen, 312);
  const isMobile = useIsMobile();

  // Reset the picking session on open — done in the handler, not an effect.
  function openPicker() {
    setStart(from);
    setEnd(to);
    setPhase("start");
    setHover(null);
    const { y, m } = parse(to || from || todayKyiv());
    setView({ y, m });
    setOpen(true);
  }

  const cells = useMonthCells(view);

  function pick(dayStr: string) {
    if (phase === "start") {
      setStart(dayStr);
      setEnd(dayStr);
      setPhase("end");
      setHover(null);
    } else {
      let s = start;
      let e = dayStr;
      if (e < s) [s, e] = [e, s];
      setPhase("start");
      onChange(s, e);
      setOpen(false);
    }
  }

  function apply() {
    let s = start;
    let e = end;
    if (e < s) [s, e] = [e, s];
    onChange(s, e);
    setOpen(false);
  }

  function reset() {
    setStart(from);
    setEnd(to);
    setPhase("start");
    setHover(null);
    const { y, m } = parse(to || from || todayKyiv());
    setView({ y, m });
  }

  const activePreset = useMemo(
    () =>
      presets.findIndex((p) => {
        const r = p.range();
        return r.from === from && r.to === to;
      }),
    [presets, from, to],
  );

  const previewEnd = phase === "end" ? (hover ?? end) : end;
  const lo =
    start && previewEnd ? (start <= previewEnd ? start : previewEnd) : start;
  const hi =
    start && previewEnd ? (start <= previewEnd ? previewEnd : start) : end;

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex h-10 w-full items-center gap-2 rounded-xl border bg-surface px-3.5 text-left text-sm outline-none transition-[border-color,box-shadow] duration-150 ${
          open
            ? "border-bloom"
            : "border-line hover:border-ink-faint/60"
        }`}
      >
        <IconCalendar
          width={17}
          height={17}
          className="shrink-0 text-ink-soft"
        />
        <span className="nums flex-1 truncate text-ink">
          {fmtDMY(from)} <span className="text-ink-faint">—</span> {fmtDMY(to)}
        </span>
        <IconChevronDown
          width={16}
          height={16}
          className={`shrink-0 text-ink-faint transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {mounted && open && (
        <PopoverShell
          isMobile={isMobile}
          pos={pos}
          popRef={popRef}
          onClose={() => setOpen(false)}
          label="Вибір періоду"
        >
          <>
            {presets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-b border-line p-2.5">
                {presets.map((p, i) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      const r = p.range();
                      onChange(r.from, r.to);
                      setOpen(false);
                    }}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      i === activePreset
                        ? "bg-bloom-tint text-bloom-ink"
                        : "text-ink-soft hover:bg-ink/5 hover:text-ink"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            <div className="p-3">
              <MonthNav view={view} setView={setView} />
              <Weekdays />
              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, i) => {
                  if (!day) return <div key={`e${i}`} />;
                  const isEndpoint = day === lo || day === hi;
                  const inRange = !!lo && !!hi && day > lo && day < hi;
                  const isToday = day === today;
                  let cls = "text-ink hover:bg-surface-sunk";
                  if (isEndpoint)
                    cls =
                      "bg-bloom text-canvas font-semibold hover:bg-bloom-strong";
                  else if (inRange) cls = "bg-bloom-tint text-bloom-ink";
                  else if (isToday)
                    cls =
                      "font-semibold text-bloom-ink ring-1 ring-inset ring-bloom/30";
                  return (
                    <button
                      key={day}
                      onClick={() => pick(day)}
                      onMouseEnter={() => phase === "end" && setHover(day)}
                      className={`nums h-9 cursor-pointer rounded-lg text-sm transition-colors ${cls}`}
                    >
                      {parse(day).d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-line bg-surface-soft px-3.5 py-2.5">
              <div className="nums mb-2 flex items-center gap-1 text-xs text-ink-soft">
                {fmtDMY(lo)} <span className="text-ink-faint">—</span>{" "}
                {fmtDMY(hi)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={reset}
                  className="flex-1 cursor-pointer rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink"
                >
                  Скинути
                </button>
                <button
                  onClick={apply}
                  className="flex-1 cursor-pointer rounded-lg bg-bloom px-3 py-1.5 text-xs font-medium text-canvas transition-colors hover:bg-bloom-strong"
                >
                  Застосувати
                </button>
              </div>
            </div>
          </>
        </PopoverShell>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Single date picker — modals (sell / expense)
 * ------------------------------------------------------------------ */
export function DatePicker({
  value,
  onChange,
  placeholder = "Оберіть дату",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const mounted = useIsClient();
  const [view, setView] = useState(() => {
    const { y, m } = parse(value || todayKyiv());
    return { y, m };
  });
  const today = todayKyiv();
  const { triggerRef, popRef, pos } = useAnchoredPopover(open, setOpen, 300);
  const isMobile = useIsMobile();

  // Snap the calendar to the selected month on open — in the handler, not an effect.
  function openPicker() {
    const { y, m } = parse(value || todayKyiv());
    setView({ y, m });
    setOpen(true);
  }

  const cells = useMonthCells(view);

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex h-10 w-full items-center gap-2 rounded-xl border bg-surface px-3.5 text-left text-sm outline-none transition-[border-color,box-shadow] duration-150 ${
          open
            ? "border-bloom"
            : "border-line hover:border-ink-faint/60"
        }`}
      >
        <IconCalendar
          width={17}
          height={17}
          className="shrink-0 text-ink-soft"
        />
        <span
          className={`nums flex-1 truncate ${value ? "text-ink" : "text-ink-faint"}`}
        >
          {value ? fmtDMY(value) : placeholder}
        </span>
        <IconChevronDown
          width={16}
          height={16}
          className={`shrink-0 text-ink-faint transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {mounted && open && (
        <PopoverShell
          isMobile={isMobile}
          pos={pos}
          popRef={popRef}
          onClose={() => setOpen(false)}
          label="Вибір дати"
        >
          <div className="p-3">
            <MonthNav view={view} setView={setView} />
            <Weekdays />
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <div key={`e${i}`} />;
                const selected = day === value;
                const isToday = day === today;
                let cls = "text-ink hover:bg-surface-sunk";
                if (selected)
                  cls =
                    "bg-bloom text-canvas font-semibold hover:bg-bloom-strong";
                else if (isToday)
                  cls =
                    "font-semibold text-bloom-ink ring-1 ring-inset ring-bloom/30";
                return (
                  <button
                    key={day}
                    onClick={() => {
                      onChange(day);
                      setOpen(false);
                    }}
                    className={`nums h-9 cursor-pointer rounded-lg text-sm transition-colors ${cls}`}
                  >
                    {parse(day).d}
                  </button>
                );
              })}
            </div>
          </div>
        </PopoverShell>
      )}
    </div>
  );
}
