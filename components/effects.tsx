"use client";

import { cn } from "@/lib/utils";

/* ===================== AURORA BACKGROUND (Magic UI style) ===================== */
export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div
        className="absolute -inset-[10%] animate-[aurora_16s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 18% -5%, rgba(234,179,8,0.16), transparent 60%)," +
            "radial-gradient(ellipse 45% 40% at 85% 8%, rgba(202,138,4,0.13), transparent 58%)," +
            "radial-gradient(ellipse 60% 55% at 50% 110%, rgba(250,204,21,0.09), transparent 62%)",
        }}
      />
    </div>
  );
}

/* ===================== BORDER BEAM (Magic UI style) ===================== */
export function BorderBeam({
  className,
  size = 170,
  duration = 7,
  colorFrom = "rgba(234,179,8,0.85)",
  colorTo = "rgba(234,179,8,0)",
}: {
  className?: string;
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
}) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]", className)} aria-hidden>
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: size,
          height: size,
          transform: "translate(-50%,-50%)",
          background: `conic-gradient(from 0deg, transparent 0deg, ${colorFrom} 60deg, ${colorTo} 120deg, transparent 180deg, transparent 360deg)`,
          animation: `spin ${duration}s linear infinite`,
        }}
      />
    </div>
  );
}

/* ===================== GLOWING CARD (Aceternity style) ===================== */
export function GlowCard({
  children,
  className,
  intensity = 0.5,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) {
  return (
    <div
      className={cn(
        "group/glow relative rounded-2xl p-px transition-all duration-300",
        "bg-[radial-gradient(circle_at_30%_0%,rgba(234,179,8,0.45),transparent_45%)]",
        className
      )}
      style={{ boxShadow: `0 0 ${20 + intensity * 30}px -6px rgba(234,179,8,${0.24 * intensity})` }}
    >
      <div className="clip-notch relative overflow-hidden bg-[rgba(var(--glass),0.7)] backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}