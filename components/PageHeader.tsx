import { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
  eyebrow = "الأمن العام",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="clip-notch relative mb-8 overflow-hidden border border-white/10 bg-[#0e1320] px-6 py-5 shadow-sm">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-400/50 to-transparent" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent-400/25 bg-accent-500/10 px-3 py-1 text-[11px] font-semibold tracking-[0.25em] text-accent-400">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500/15" />
            {eyebrow}
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-wide text-slate-50 md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{subtitle}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
      </div>
    </div>
  );
}

