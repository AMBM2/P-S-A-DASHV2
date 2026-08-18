"use client";

import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/format";

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
      "gold-shimmer border border-gold-200/50 bg-gradient-to-b from-gold-100 via-gold-300 to-gold-500 text-black font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_10px_30px_-10px_rgba(var(--accent-rgb),0.6)] hover:from-gold-50 hover:to-gold-400 focus-visible:ring-2 focus-visible:ring-gold-200/70",
    ghost: "text-zinc-300 hover:bg-white/5 hover:text-gold-200",
    outline:
      "border border-gold-400/35 text-gold-200 hover:border-gold-300/70 hover:bg-gold-400/10 focus-visible:ring-2 focus-visible:ring-gold-300/40",
    danger:
      "gold-shimmer border border-rose-500/40 bg-gradient-to-b from-rose-500 to-red-700 text-white hover:from-rose-400 hover:to-red-600",
    success:
      "gold-shimmer border border-emerald-500/40 bg-gradient-to-b from-emerald-500 to-emerald-700 text-white hover:from-emerald-400 hover:to-emerald-600",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none outline-none",
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
        "gold-shimmer group/card relative overflow-hidden rounded-xl border border-gold-400/20 bg-[rgba(var(--glass),0.62)] p-5 backdrop-blur-xl",
        "before:pointer-events-none before:absolute before:left-2 before:top-2 before:h-3.5 before:w-3.5 before:border-l-2 before:border-t-2 before:border-gold-300/70 before:rounded-tl",
        "after:pointer-events-none after:absolute after:right-2 after:bottom-2 after:h-3.5 after:w-3.5 after:border-r-2 after:border-b-2 after:border-gold-300/70 after:rounded-br",
        hover &&
          "transition-all duration-300 hover:-translate-y-1 hover:border-gold-300/50 hover:shadow-[0_0_0_1px_rgba(var(--accent-rgb),0.25),0_18px_55px_-18px_rgba(var(--accent-rgb),0.55),0_0_45px_-10px_rgba(var(--accent-rgb),0.35)]",
        className
      )}
    >
      {/* corner ornaments */}
      <span className="pointer-events-none absolute right-2 top-2 h-3.5 w-3.5 rounded-tr border-r-2 border-t-2 border-gold-300/70" />
      <span className="pointer-events-none absolute bottom-2 left-2 h-3.5 w-3.5 rounded-bl border-b-2 border-l-2 border-gold-300/70" />
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
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
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
      <span className="text-xs uppercase tracking-wider text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-gold-400/20 bg-obsidian-800/80 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition duration-150 focus:border-gold-300/80 focus:ring-2 focus:ring-gold-400/40 focus:shadow-[0_0_0_1px_rgba(var(--accent-rgb),0.2),0_0_22px_-8px_rgba(var(--accent-rgb),0.55)]";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, "min-h-[90px]", props.className)} />;
}

export function Select({
  children,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative w-full">
      <select
        {...props}
        className={cn(
          inputClass,
          "appearance-none cursor-pointer bg-obsidian-800/80 pl-9 pr-3",
          className
        )}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center rounded-l-xl border-l border-gold-400/15 text-gold-300/80">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
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
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "glass-strong relative w-full overflow-hidden rounded-2xl p-6 max-h-[90vh] overflow-y-auto scrollbar-thin",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/55 to-transparent" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold gold-text">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
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
