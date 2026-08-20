"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================= BUTTON ============================= */
export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger" | "success";
}) {
  const styles: Record<string, string> = {
    primary:
      "gold-shimmer relative border border-emerald-300/40 bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 text-white font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_10px_30px_-10px_rgba(var(--accent-rgb),0.7),0_4px_14px_-6px_rgba(var(--accent-rgb),0.45)] hover:from-emerald-300 hover:to-emerald-500 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_14px_38px_-10px_rgba(var(--accent-rgb),0.85)]",
    ghost: "text-zinc-300 hover:bg-white/5 hover:text-gold-200",
    outline:
      "border border-gold-400/35 text-gold-200 hover:border-gold-300/70 hover:bg-gold-400/10 hover:shadow-[0_8px_24px_-10px_rgba(var(--accent-rgb),0.5)] focus-visible:ring-2 focus-visible:ring-gold-300/40",
    danger:
      "gold-shimmer relative border border-rose-500/40 bg-gradient-to-b from-rose-500 to-red-700 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_26px_-12px_rgba(244,63,94,0.6)] hover:from-rose-400 hover:to-red-600",
    success:
      "gold-shimmer relative border border-emerald-500/40 bg-gradient-to-b from-emerald-500 to-emerald-700 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_26px_-12px_rgba(16,185,129,0.6)] hover:from-emerald-400 hover:to-emerald-600",
  };
  return (
    <button
      className={cn(
        "clip-notch-sm inline-flex items-center justify-center gap-2 rounded-[5px] px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none outline-none focus-visible:ring-2 focus-visible:ring-gold-300/50",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ============================= CARD ============================= */
export function Card({
  children,
  className,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "clip-notch hud-frame gold-shimmer group/card relative overflow-hidden border border-gold-400/20 bg-[rgba(var(--glass),0.66)] p-5 backdrop-blur-xl shadow-[0_18px_50px_-22px_rgba(0,0,0,0.8),0_0_0_1px_rgba(var(--accent-rgb),0.05)]",
        hover &&
          "transition-all duration-300 hover:-translate-y-1 hover:border-gold-300/50 hover:shadow-[0_0_0_1px_rgba(var(--accent-rgb),0.25),0_22px_60px_-20px_rgba(var(--accent-rgb),0.55),0_0_45px_-10px_rgba(var(--accent-rgb),0.35)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ============================= BADGE ============================= */
export function Badge({
  children,
  tone = "gold",
  className,
}: {
  children: React.ReactNode;
  tone?: "gold" | "amber" | "rose" | "green" | "slate" | "indigo";
  className?: string;
}) {
  const tones: Record<string, string> = {
    gold: "bg-gold-400/12 text-gold-200 border-gold-400/25",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    rose: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    slate: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
    indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  };
  return (
    <span
      className={cn(
        "clip-notch-sm inline-flex items-center gap-1 rounded-[4px] border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ============================= FIELD ============================= */
export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

/* ============================= INPUT / TEXTAREA ============================= */
export const inputClass =
  "w-full rounded-[6px] border border-gold-400/20 bg-obsidian-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)] outline-none transition duration-150 focus:border-gold-300/70 focus:bg-obsidian-800 focus:ring-2 focus:ring-gold-400/30 focus:shadow-[0_0_0_1px_rgba(var(--accent-rgb),0.18),0_0_22px_-8px_rgba(var(--accent-rgb),0.5)]";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, "min-h-[90px]", props.className)} />;
}

/* ============================= SELECT (custom, headless) ============================= */
/* Replaces the native <select> (whose options render as OS-browser-blue) with a
   fully themed, animated dropdown that matches the dark premium theme. */
type SelectOption = { value: string; label: React.ReactNode; disabled?: boolean };

export function Select({
  children,
  value,
  onChange,
  className,
  disabled,
  placeholder = "— اختر —",
  title,
}: React.SelectHTMLAttributes<HTMLSelectElement> & { placeholder?: string }) {
  const options = useMemo<SelectOption[]>(
    () =>
      React.Children.toArray(children)
        .filter((c): c is React.ReactElement<React.HTMLProps<HTMLOptionElement>> => React.isValidElement(c))
        .map((c) => ({
          value: String(c.props.value ?? ""),
          label: c.props.children,
          disabled: c.props.disabled,
        })),
    [children]
  );
  const current = options.find((o) => o.value === value) || options.find((o) => o.value === "");

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const measure = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const est = Math.min(options.length || 1, 8) * 40 + 14;
    const openUp = r.bottom + est + 12 > window.innerHeight && r.top - est - 12 > 0;
    setPos({ top: openUp ? r.top - 8 : r.bottom + 6, left: r.left, width: r.width });
  };

  const openMenu = () => {
    if (disabled) return;
    measure();
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const select = (opt: SelectOption) => {
    setOpen(false);
    if (opt.disabled || opt.value === value) return;
    onChange?.({ target: { value: opt.value } } as React.ChangeEvent<HTMLSelectElement>);
  };

  // Close on outside click / Escape / reposition on scroll & resize.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (btnRef.current?.contains(e.target as Node) || listRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => measure();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the highlighted option in view.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => Math.min(options.length - 1, a + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(options.length - 1);
        break;
      case "Enter":
      case " ": {
        e.preventDefault();
        const opt = options[active];
        if (opt) select(opt);
        break;
      }
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        title={title}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          inputClass,
          "flex items-center justify-between gap-2 text-left rtl:text-right disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        <span className={cn("truncate", !current && "text-zinc-500")}>
          {current ? current.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          className={cn("shrink-0 text-gold-300/80 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.div
                ref={listRef}
                role="listbox"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
                className="z-[100] max-h-72 overflow-y-auto scrollbar-thin rounded-xl border border-gold-400/25 bg-[#14161b]/95 p-1.5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.85),0_0_0_1px_rgba(var(--accent-rgb),0.08),0_0_40px_-18px_rgba(var(--accent-rgb),0.4)] backdrop-blur-xl"
              >
                {options.map((opt, i) => {
                  const sel = opt.value === value;
                  const act = i === active;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={sel}
                      data-index={i}
                      disabled={opt.disabled}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => select(opt)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left rtl:text-right text-sm transition-colors",
                        sel
                          ? "bg-gold-400/15 text-gold-100"
                          : act
                            ? "bg-white/5 text-zinc-100"
                            : "text-zinc-300 hover:bg-white/5",
                        opt.disabled && "cursor-not-allowed opacity-40"
                      )}
                    >
                      <span className="truncate">{opt.label}</span>
                      {sel && <Check size={14} className="shrink-0 text-gold-300" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

/* ============================= MODAL ============================= */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "glass-strong clip-notch hud-frame relative w-full overflow-hidden border border-gold-400/20 p-6 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95),0_0_0_1px_rgba(var(--accent-rgb),0.1),0_0_70px_-25px_rgba(var(--accent-rgb),0.35)] max-h-[90vh] overflow-y-auto scrollbar-thin",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/55 to-transparent" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold gold-text">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

/* ============================= PROGRESS BAR ============================= */
export function ProgressBar({
  value,
  color = "var(--accent)",
  className,
}: {
  value: number;
  color?: string;
  className?: string;
}) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-white/8", className)}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: color,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
    </div>
  );
}

/* ============================= STAT ============================= */
export function Stat({
  label,
  value,
  icon,
  tone = "gold",
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: string;
}) {
  const colors: Record<string, string> = {
    gold: "text-gold-300",
    green: "text-emerald-300",
    rose: "text-rose-300",
    indigo: "text-indigo-300",
  };
  return (
    <Card className="flex items-center gap-4">
      {icon && <div className={cn("text-2xl", colors[tone])}>{icon}</div>}
      <div>
        <div className="text-xs uppercase tracking-wider text-zinc-400">{label}</div>
        <div className={cn("font-display text-2xl font-bold", colors[tone])}>{value}</div>
      </div>
    </Card>
  );
}

/* ============================= EMPTY STATE ============================= */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 h-12 w-12 rounded-full border border-dashed border-gold-400/40" />
      <p className="text-zinc-400">{message}</p>
    </div>
  );
}