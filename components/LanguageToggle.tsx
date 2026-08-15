"use client";

import { Languages } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/format";

export function LanguageToggle() {
  const { settings, updateSettings } = useStore();
  return (
    <div className="flex items-center gap-1 rounded-lg border border-gold-400/25 p-0.5">
      <Languages size={15} className="mx-1 text-zinc-400" />
      {(["ar", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => updateSettings({ language: l })}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-bold uppercase",
            settings.language === l
              ? "bg-gold-400/20 text-gold-200"
              : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
