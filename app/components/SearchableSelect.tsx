"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export type SearchableSelectOption = { value: string; label: string };

type Props = {
  label: string;
  value: string;
  options: SearchableSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  ui?: "default" | "square";
  /** Tighter control for filter toolbars. */
  dense?: boolean;
  onChange: (value: string) => void;
};

export function SearchableSelect({
  label,
  value,
  options,
  placeholder = "Select…",
  disabled = false,
  ui = "default",
  dense = false,
  onChange,
}: Props) {
  const listboxId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      if (el.closest?.(`[data-searchable-select="${listboxId}"]`)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open, listboxId]);

  function commit(val: string) {
    onChange(val);
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <div className="relative" data-searchable-select={listboxId}>
      <p
        className={
          dense
            ? "text-[10px] font-semibold uppercase tracking-wide text-zinc-500"
            : "text-xs font-semibold uppercase tracking-wide text-zinc-500"
        }
      >
        {label}
      </p>
      <button
        ref={buttonRef}
        type="button"
        className={[
          dense
            ? "mt-0.5 inline-flex h-9 w-full items-center justify-between border px-2.5 text-xs shadow-sm transition-colors"
            : "mt-1 inline-flex h-10 w-full items-center justify-between border px-3 text-sm shadow-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-1 focus:ring-offset-white",
          disabled
            ? "cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400"
            : open
              ? "border-zinc-400 bg-white text-zinc-900"
              : "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50",
          ui === "square" ? "rounded-sm" : "rounded-md",
        ].join(" ")}
        onClick={() =>
          setOpen((v) => {
            const next = !v;
            if (next) {
              setQuery("");
              setActiveIndex(0);
            }
            return next;
          })
        }
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${listboxId}-listbox`}
      >
        <span className={selected ? "truncate" : "truncate text-zinc-500"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={[
            dense ? "ml-2 h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform" : "ml-3 h-4 w-4 shrink-0 text-zinc-500 transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          className={[
            "absolute z-20 mt-2 w-full overflow-hidden border border-zinc-200 bg-white shadow-xl ring-1 ring-black/5",
            ui === "square" ? "rounded-sm" : "rounded-md",
          ].join(" ")}
        >
          <div className="border-b border-zinc-100 p-2">
            <div
              className={[
                "flex items-center gap-2 border border-zinc-200 bg-white px-3 py-2 shadow-sm focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-300",
                ui === "square" ? "rounded-sm" : "rounded-md",
              ].join(" ")}
            >
              <Search className="h-4 w-4 text-zinc-400" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setOpen(false);
                  return;
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIndex((i) => Math.max(i - 1, 0));
                  return;
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  const pick = filtered[activeIndex];
                  if (pick) commit(pick.value);
                }
              }}
              />
            </div>
          </div>

          <ul
            id={`${listboxId}-listbox`}
            role="listbox"
            className="max-h-72 overflow-auto p-1"
            aria-label={label}
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-zinc-500">No matches</li>
            ) : (
              filtered.map((o, idx) => {
                const active = idx === activeIndex;
                const isSelected = o.value === value;
                return (
                  <li key={o.value} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      className={[
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                        active ? "bg-zinc-100 text-zinc-900" : "text-zinc-800 hover:bg-zinc-50",
                        ui === "square" ? "rounded-sm" : "rounded-md",
                      ].join(" ")}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => commit(o.value)}
                    >
                      <span className="min-w-0 flex-1 truncate">{o.label}</span>
                      {isSelected ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-900 text-white">
                          <Check className="h-4 w-4" aria-hidden />
                        </span>
                      ) : (
                        <span className="h-6 w-6" aria-hidden />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

