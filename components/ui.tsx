"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as LabelPrimitive from "@radix-ui/react-label";
import { X, type LucideIcon } from "lucide-react";
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
      "relative border border-transparent bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary-hover hover:shadow-lg active:bg-primary-active",
    ghost: "text-muted-foreground hover:bg-black/5 hover:text-gray-900",
    outline:
      "border border-primary/40 text-primary hover:border-primary/70 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring/40",
    danger:
      "relative border border-transparent bg-destructive text-destructive-foreground shadow-md hover:bg-destructive-hover hover:shadow-lg active:bg-destructive-hover",
    success:
      "relative border border-transparent bg-success text-success-foreground shadow-md hover:opacity-90 hover:shadow-lg active:opacity-80",
  };
  return (
    <button
      className={cn(
        "clip-notch-sm inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
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
        "clip-notch relative overflow-hidden border border-gray-200 bg-white p-6 shadow-md",
        hover &&
          "transition-all duration-200 hover:border-primary/40 hover:shadow-lg",
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
      <span className="clip-notch-sm flex h-8 w-8 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
        {Icon ? <Icon size={15} /> : <span className="h-2 w-2 rotate-45 bg-primary" />}
      </span>
      <h2 className="font-display text-xl font-bold text-gray-900">{children}</h2>
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
    gold: "bg-primary/10 text-primary border-primary/25",
    amber: "bg-warning/15 text-warning border-warning/30",
    rose: "bg-destructive/15 text-destructive border-destructive/30",
    green: "bg-success/15 text-success border-success/30",
    slate: "bg-gray-100 text-gray-600 border-gray-200",
    indigo: "bg-primary/15 text-primary border-primary/30",
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

/* ============================= FIELD / LABEL ============================= */
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
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">{label}</span>
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
    className={cn("text-xs font-semibold uppercase tracking-wider text-gray-600", className)}
    {...props}
  />
));
Label.displayName = "Label";

/* ============================= INPUT ============================= */
export const inputClass =
  "w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition duration-150 focus:border-primary focus:ring-4 focus:ring-primary/10";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, "min-h-[90px]", props.className)} />;
}

/* ============================= PROGRESS ============================= */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-gray-200", className)}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* ============================= EMPTY STATE ============================= */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-400">
      {message}
    </div>
  );
}

/* ============================= TOOLTIP ============================= */
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-lg",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = "TooltipContent";

/* ============================= TABS ============================= */
export const Tabs = TabsPrimitive.Root;
export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1", className)}
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
      "flex-1 rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 transition-colors data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";
export const TabsContent = TabsPrimitive.Content;

/* ============================= SEPARATOR ============================= */
export const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    className={cn("bg-gray-200", className)}
    {...props}
  />
));
Separator.displayName = "Separator";

/* ============================= SWITCH ============================= */
export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";

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
                className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm"
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
                    "clip-notch relative max-h-[88vh] w-full overflow-y-auto border border-gray-200 bg-white p-6 shadow-2xl",
                    wide ? "max-w-3xl" : "max-w-lg"
                  )}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <DialogPrimitive.Title className="font-display text-lg font-bold text-gray-900">
                      {title}
                    </DialogPrimitive.Title>
                    <button
                      onClick={onClose}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    >
                      <X size={18} />
                    </button>
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
