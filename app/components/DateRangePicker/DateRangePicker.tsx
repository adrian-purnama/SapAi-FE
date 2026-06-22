"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function parseYmd(s: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  if (new Date(Date.UTC(y, mo - 1, d)).getUTCDate() !== d) return null;
  return { y, m: mo, d };
}

function toYmd(parts: { y: number; m: number; d: number }): string {
  return `${parts.y}-${String(parts.m).padStart(2, "0")}-${String(parts.d).padStart(2, "0")}`;
}

/** UTC YYYY-MM-DD compare: -1 | 0 | 1 */
function compareYmd(a: string, b: string): number {
  const pa = parseYmd(a);
  const pb = parseYmd(b);
  if (!pa || !pb) return 0;
  const ta = Date.UTC(pa.y, pa.m - 1, pa.d);
  const tb = Date.UTC(pb.y, pb.m - 1, pb.d);
  if (ta < tb) return -1;
  if (ta > tb) return 1;
  return 0;
}

function clampYmd(ymd: string, min: string, max: string): string {
  if (compareYmd(ymd, min) < 0) return min;
  if (compareYmd(ymd, max) > 0) return max;
  return ymd;
}

function subtractDaysFromYmd(ymd: string, days: number): string {
  const p = parseYmd(ymd);
  if (!p) return ymd;
  const t = Date.UTC(p.y, p.m - 1, p.d) - days * 86_400_000;
  const z = new Date(t);
  return toYmd({ y: z.getUTCFullYear(), m: z.getUTCMonth() + 1, d: z.getUTCDate() });
}

function addMonths(y: number, m0: number, delta: number): { y: number; m0: number } {
  const d = new Date(Date.UTC(y, m0 + delta, 1));
  return { y: d.getUTCFullYear(), m0: d.getUTCMonth() };
}

function monthLabel(y: number, m0: number): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m0, 1)),
  );
}

function formatMediumYmd(ymd: string): string {
  const p = parseYmd(ymd);
  if (!p) return ymd;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(p.y, p.m - 1, p.d)));
}

function calendarCells(y: number, m0: number): (number | null)[] {
  const dim = new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
  const startPad = new Date(Date.UTC(y, m0, 1)).getUTCDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);
  return cells;
}

function ymdForDay(y: number, m0: number, day: number): string {
  return toYmd({ y, m: m0 + 1, d: day });
}

function isBetweenExclusive(ymd: string, from: string, to: string): boolean {
  return compareYmd(ymd, from) > 0 && compareYmd(ymd, to) < 0;
}

export type DateRangePickerProps = {
  /** Start date `YYYY-MM-DD` or empty for “no start” (server may still clamp). */
  from: string;
  /** End date `YYYY-MM-DD` or empty. */
  to: string;
  /** Inclusive minimum UTC day. */
  min: string;
  /** Inclusive maximum UTC day. */
  max: string;
  disabled?: boolean;
  /** Visible label (also used for `aria-labelledby` fragment). */
  label: string;
  /** Helper line under the label. */
  description?: string;
  onRangeChange: (from: string, to: string) => void;
  /** Prefix for generated ids. */
  idPrefix?: string;
  /** Less vertical padding   e.g. filter toolbars. */
  compact?: boolean;
};

export function DateRangePicker({
  from,
  to,
  min,
  max,
  disabled = false,
  label,
  description,
  onRangeChange,
  idPrefix = "date-range",
  compact = false,
}: DateRangePickerProps) {
  const baseId = useId();
  const labelId = `${idPrefix}-${baseId}-label`;
  const descId = `${idPrefix}-${baseId}-desc`;
  const panelId = `${idPrefix}-${baseId}-panel`;

  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [viewY, setViewY] = useState(() => {
    const anchor = parseYmd(from.trim() || max) ?? parseYmd(max)!;
    return anchor.y;
  });
  const [viewM0, setViewM0] = useState(() => {
    const anchor = parseYmd(from.trim() || max) ?? parseYmd(max)!;
    return anchor.m - 1;
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open) {
      setDraftFrom(from);
      setDraftTo(to);
      if (!wasOpenRef.current) {
        const anchor = parseYmd(from.trim() || max) ?? parseYmd(max)!;
        setViewY(anchor.y);
        setViewM0(anchor.m - 1);
      }
    }
    wasOpenRef.current = open;
  }, [open, from, to, max]);

  const rightMonth = useMemo(() => addMonths(viewY, viewM0, 1), [viewY, viewM0]);

  const canPrev = useMemo(() => {
    const prev = addMonths(viewY, viewM0, -1);
    const first = ymdForDay(prev.y, prev.m0, 1);
    return compareYmd(first, min) >= 0;
  }, [viewY, viewM0, min]);

  const canNext = useMemo(() => {
    const twoAhead = addMonths(viewY, viewM0, 2);
    const first = ymdForDay(twoAhead.y, twoAhead.m0, 1);
    return compareYmd(first, max) <= 0;
  }, [viewY, viewM0, max]);

  const shiftView = useCallback(
    (delta: number) => {
      const next = addMonths(viewY, viewM0, delta);
      setViewY(next.y);
      setViewM0(next.m0);
    },
    [viewY, viewM0],
  );

  const triggerLabel = useMemo(() => {
    const f = from.trim();
    const t = to.trim();
    if (!f && !t) return `Full window · ${formatMediumYmd(min)} – ${formatMediumYmd(max)}`;
    if (f && t) return `${formatMediumYmd(f)} → ${formatMediumYmd(t)}`;
    if (f) return `${formatMediumYmd(f)} → …`;
    if (t) return `… → ${formatMediumYmd(t)}`;
    return `${formatMediumYmd(min)} – ${formatMediumYmd(max)}`;
  }, [from, to, min, max]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const el = e.target as Node | null;
      if (!el || !rootRef.current?.contains(el)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function commitRange(nextFrom: string, nextTo: string) {
    let f = nextFrom.trim();
    let t = nextTo.trim();
    if (f) f = clampYmd(f, min, max);
    if (t) t = clampYmd(t, min, max);
    if (f && t && compareYmd(f, t) > 0) {
      const x = f;
      f = t;
      t = x;
    }
    onRangeChange(f, t);
  }

  function onDayPick(y: number, m0: number, day: number) {
    const ymd = ymdForDay(y, m0, day);
    if (compareYmd(ymd, min) < 0 || compareYmd(ymd, max) > 0) return;

    const f = draftFrom.trim();
    const t = draftTo.trim();
    let nextFrom = f;
    let nextTo = t;

    if (!f || (f && t)) {
      nextFrom = ymd;
      nextTo = "";
    } else {
      if (compareYmd(ymd, f) < 0) {
        nextTo = f;
        nextFrom = ymd;
      } else {
        nextFrom = f;
        nextTo = ymd;
      }
    }

    setDraftFrom(nextFrom);
    setDraftTo(nextTo);
    commitRange(nextFrom, nextTo);
  }

  function renderMonth(y: number, m0: number) {
    const cells = calendarCells(y, m0);
    const df = draftFrom.trim() || from.trim();
    const dt = draftTo.trim() || to.trim();

    return (
      <div className="min-w-[240px] flex-1">
        <p className="mb-2 text-center text-xs font-semibold text-zinc-800">{monthLabel(y, m0)}</p>
        <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-0.5">
          {cells.map((day, idx) => {
            if (day == null) {
              return <div key={`e-${y}-${m0}-${idx}`} className="h-8" />;
            }
            const ymd = ymdForDay(y, m0, day);
            const out = compareYmd(ymd, min) < 0 || compareYmd(ymd, max) > 0;
            const isStart = df && compareYmd(ymd, df) === 0;
            const isEnd = dt && compareYmd(ymd, dt) === 0;
            const inRange = df && dt && isBetweenExclusive(ymd, df, dt);

            return (
              <button
                key={`${y}-${m0}-${day}`}
                type="button"
                disabled={out}
                onClick={() => onDayPick(y, m0, day)}
                className={cn(
                  "relative h-8 rounded-md text-xs font-medium transition-colors",
                  out && "cursor-not-allowed text-zinc-300",
                  !out && "text-zinc-800 hover:bg-zinc-100",
                  isStart && "bg-sky-600 text-white hover:bg-sky-700",
                  isEnd && !isStart && "bg-sky-600 text-white hover:bg-sky-700",
                  inRange && "bg-sky-100 text-sky-950 hover:bg-sky-200",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (disabled) {
    return (
      <div>
        <p
          id={labelId}
          className={cn(
            "font-semibold uppercase tracking-wide text-zinc-500",
            compact ? "text-[11px]" : "text-xs",
          )}
        >
          {label}
        </p>
        {description ? (
          <p
            id={descId}
            className={cn(compact ? "sr-only" : "mt-0.5 text-xs text-zinc-500")}
          >
            {description}
          </p>
        ) : null}
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600",
            compact ? "mt-1.5 px-2.5 py-1.5 text-xs" : "mt-3 px-3 py-2 text-sm",
          )}
          aria-labelledby={labelId}
          aria-describedby={description ? descId : undefined}
        >
          <CalendarRange className={cn("shrink-0 text-zinc-400", compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
          <span className="font-medium text-zinc-800">{formatMediumYmd(max)}</span>
          <span className="text-zinc-400">(UTC)</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <p
        id={labelId}
        className={cn(
          "font-semibold uppercase tracking-wide text-zinc-500",
          compact ? "text-[11px]" : "text-xs",
        )}
      >
        {label}
      </p>
      {description ? (
        <p id={descId} className={cn(compact ? "sr-only" : "mt-0.5 text-xs text-zinc-500")}>
          {description}
        </p>
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        id={`${idPrefix}-trigger`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={panelId}
        aria-labelledby={labelId}
        aria-describedby={description ? descId : undefined}
        title={compact && description ? description : undefined}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-zinc-300 bg-white text-left text-sm shadow-sm transition-colors",
          compact ? "mt-1 max-w-full py-2 pl-2.5 pr-2" : "mt-3 max-w-md py-2.5 px-3",
          "hover:border-zinc-400 hover:bg-zinc-50",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400",
        )}
      >
        <CalendarRange className={cn("shrink-0 text-zinc-500", compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
        <span className="min-w-0 flex-1 truncate font-medium text-zinc-900">{triggerLabel}</span>
        <span className="shrink-0 text-xs text-zinc-500">UTC</span>
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={`${label} calendar`}
          className="absolute left-0 top-full z-50 mt-2 w-[min(100vw-2rem,520px)] rounded-xl border border-zinc-200 bg-white p-3 shadow-lg ring-1 ring-black/5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                onClick={() => {
                  const t = clampYmd(max, min, max);
                  const f = clampYmd(subtractDaysFromYmd(t, 6), min, max);
                  setDraftFrom(f);
                  setDraftTo(t);
                  onRangeChange(f, t);
                }}
              >
                Last 7 days
              </button>
              <button
                type="button"
                className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                onClick={() => {
                  const t = clampYmd(max, min, max);
                  const f = clampYmd(subtractDaysFromYmd(t, 29), min, max);
                  setDraftFrom(f);
                  setDraftTo(t);
                  onRangeChange(f, t);
                }}
              >
                Last 30 days
              </button>
              <button
                type="button"
                className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                onClick={() => {
                  setDraftFrom(min);
                  setDraftTo(max);
                  onRangeChange(min, max);
                }}
              >
                Full range
              </button>
              <button
                type="button"
                className="rounded-full border border-dashed border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                onClick={() => {
                  setDraftFrom("");
                  setDraftTo("");
                  onRangeChange("", "");
                }}
              >
                Clear
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous months"
                disabled={!canPrev}
                onClick={() => canPrev && shiftView(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next months"
                disabled={!canNext}
                onClick={() => canNext && shiftView(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="mt-2 text-xs text-zinc-500">
            Tap a day to set the start, then the end (order adjusts automatically). Presets apply immediately.
          </p>

          <div className="mt-3 flex flex-wrap justify-center gap-4">
            {renderMonth(viewY, viewM0)}
            {renderMonth(rightMonth.y, rightMonth.m0)}
          </div>

          <div className="mt-3 flex justify-end gap-2 border-t border-zinc-100 pt-2">
            <button
              type="button"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
