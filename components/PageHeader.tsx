import { ReactNode } from "react";
import { LanguageToggle } from "./LanguageToggle";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="mb-3 flex items-center gap-3">
          <span className="h-px w-10 bg-gradient-to-l from-gold-400/70 to-transparent" />
          <span className="text-xs uppercase tracking-[0.35em] text-gold-300">
            الأمن العام
          </span>
          <span className="h-px w-10 bg-gradient-to-r from-gold-400/70 to-transparent" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-wide text-white md:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-zinc-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <LanguageToggle />
        {action}
      </div>
    </div>
  );
}
