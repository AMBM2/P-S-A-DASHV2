"use client";

import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { X, ChevronDown, ChevronUp, Check, type LucideIcon } from "lucide-react";
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
      "gold-shimmer relative border border-gold-300/50 bg-gradient-to-b from-gold-200 via-gold-400 to-gold-600 text-white font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_10px_30px_-10px_rgba(var(--accent-rgb),0.7),0_4px_14px_-6px_rgba(var(--accent-rgb),0.45)] hover:from-gold-100 hover:to-gold-500 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_14px_38px_-10px_rgba(var(--accent-rgb),0.85)]",
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
        "clip-notch-sm inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none outline-none focus-visible:ring-4 focus-visible:ring-gold-200/40",
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

/* ============================= SECTION TITLE ============================= */
export function SectionTitle({
  children,
  icon: Icon,
  className,
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center gap-3", className)}>
      <span className="clip-notch-sm flex h-8 w-8 shrink-0 items-center justify-center border border-gold-400/30 bg-gold-400/10 text-gold-200">
        {Icon ? <Icon size={15} /> : <span className="h-2 w-2 rotate-45 bg-gold-300" />}
      </span>
      <h2 className="font-display text-xl font-bold text-zinc-100">{children}</h2>
      <span className="gold-flourish flex-1" />
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

/* ============================= FIELD / LABEL (Radix) ============================= */
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
    <LabelPrimitive.Root className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">{label}</span>
      {children}
    </LabelPrimitive.Root>
  );
}

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("text-xs font-semibold uppercase tracking-wider text-zinc-300", className)}
    {...props}
  />
));
Label.displayName = "Label";

/* ============================= INPUT / TEXTAREA ============================= */
export const inputClass =
  "w-full rounded-[6px] border border-gold-400/20 bg-obsidian-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)] outline-none transition duration-150 focus:border-gold-300/70 focus:bg-obsidian-800 focus:ring-2 focus:ring-gold-400/30 focus:shadow-[0_0_0_1px_rgba(var(--accent-rgb),0.18),0_0_22px_-8px_rgba(var(--accent-rgb),0.5)]";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, "min-h-[90px]", props.className)} />;
}

/* ============================= SELECT (Radix) ============================= */
/* Drop-in replacement for native <select> backed by Radix primitives. Keeps the
   same API (<option> children + value/onChange) so every existing caller works
   unchanged. Options with an empty value render as the "placeholder" state. */
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
  const empty = options.find((o) => o.value === "");
  const current = options.find((o) => o.value === value && o.value !== "");
  const items = options.filter((o) => o.value !== "");

  return (
    <SelectPrimitive.Root value={String(value ?? "")} onValueChange={(v) => onChange?.({ target: { value: v } } as React.ChangeEvent<HTMLSelectElement>)} disabled={disabled}>
      <SelectPrimitive.Trigger
        title={title}
        className={cn(
          inputClass,
          "flex items-center justify-between gap-2 text-left rtl:text-right disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        <SelectPrimitive.Value>
          <span className={cn("truncate", !current && !empty && "text-zinc-500")}>
            {current?.label ?? (value === "" && empty ? empty.label : placeholder)}
          </span>
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon>
          <ChevronDown size={15} className="shrink-0 text-gold-300/80" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-[100] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-gold-400/25 bg-[#14161b]/95 p-1.5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.85),0_0_0_1px_rgba(var(--accent-rgb),0.08),0_0_40px_-18px_rgba(var(--accent-rgb),0.4)] backdrop-blur-xl"
        >
          <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1 text-gold-300/70">
            <ChevronUp size={13} />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="p-0.5">
            {items.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-lg px-3 py-2 text-right text-sm outline-none data-[highlighted]:bg-gold-400/15 data-[highlighted]:text-gold-100 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40"
              >
                <SelectPrimitive.ItemText>
                  <span className="truncate">{opt.label}</span>
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Check size={14} className="shrink-0 text-gold-300" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1 text-gold-300/70">
            <ChevronDown size={13} />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

/* ============================= MODAL (Radix Dialog + Framer) ============================= */
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
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
                onClick={onClose}
              />
            </DialogPrimitive.Overlay>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <DialogPrimitive.Content asChild forceMount>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 14 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 10 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "glass-strong clip-notch hud-frame relative w-full overflow-hidden border border-gold-400/20 p-6 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95),0_0_0_1px_rgba(var(--accent-rgb),0.1),0_0_70px_-25px_rgba(var(--accent-rgb),0.35)] max-h-[90vh] overflow-y-auto scrollbar-thin",
                    wide ? "max-w-3xl" : "max-w-lg"
                  )}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/55 to-transparent" />
                  <div className="mb-4 flex items-center justify-between">
                    <DialogPrimitive.Title className="font-display text-lg font-bold gold-text">
                      {title}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Close asChild>
                      <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                        aria-label="إغلاق"
                      >
                        <X size={20} />
                      </button>
                    </DialogPrimitive.Close>
                  </div>
                  {children}
                </motion.div>
              </DialogPrimitive.Content>
            </div>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

/* ============================= TABS (Radix) ============================= */
export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("flex flex-wrap gap-1 rounded-xl border border-gold-400/15 bg-obsidian-900/50 p-1", className)}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm transition-all outline-none data-[state=active]:bg-gold-400/15 data-[state=active]:text-gold-200 text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn("mt-2 outline-none", className)} {...props} />
));
TabsContent.displayName = "TabsContent";

/* ============================= TOOLTIP (Radix) ============================= */
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "glass-strong clip-notch-sm z-[130] border border-gold-400/25 px-3 py-1.5 text-xs text-zinc-200 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8)]",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = "TooltipContent";

/* ============================= SWITCH (Radix) ============================= */
export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-gold-400/30 bg-obsidian-800 transition-colors data-[state=checked]:bg-gold-400 data-[state=checked]:border-gold-400 outline-none disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block h-4 w-4 rounded-full bg-zinc-200 shadow-lg transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 rtl:data-[state=checked]:-translate-x-4" />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";

/* ============================= CHECKBOX (Radix) ============================= */
export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-gold-400/40 bg-obsidian-800 outline-none transition-colors data-[state=checked]:bg-gold-400 data-[state=checked]:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator>
      <Check size={12} strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";

/* ============================= SEPARATOR (Radix) ============================= */
export const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = "horizontal", ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    orientation={orientation}
    className={cn("shrink-0 bg-gold-400/15", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)}
    {...props}
  />
));
Separator.displayName = "Separator";

/* ============================= ACCORDION (Radix) ============================= */
export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("rounded-xl border border-gold-400/15 bg-obsidian-900/40", className)}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors outline-none hover:text-gold-200 [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown size={15} className="shrink-0 text-gold-300/80 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = "AccordionTrigger";

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-none"
    {...props}
  >
    <div className={cn("px-4 pb-4 pt-0 text-zinc-400", className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = "AccordionContent";

/* ============================= PROGRESS (Radix) ============================= */
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
    <ProgressPrimitive.Root
      value={value}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-white/8", className)}
      style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)" }}
    >
      <ProgressPrimitive.Indicator
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color, boxShadow: `0 0 10px ${color}` }}
      />
    </ProgressPrimitive.Root>
  );
}

/* ============================= DROPDOWN (Radix) ============================= */
export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "glass-strong clip-notch-sm z-[120] min-w-[190px] overflow-hidden border border-gold-400/25 p-1.5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.85),0_0_40px_-18px_rgba(var(--accent-rgb),0.4)]",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { danger?: boolean }
>(({ className, danger, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors data-[highlighted]:bg-gold-400/15 data-[highlighted]:text-gold-100",
      danger ? "text-rose-300 data-[highlighted]:bg-rose-500/15 data-[highlighted]:text-rose-200" : "text-zinc-200",
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn("px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-gold-400/15", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

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