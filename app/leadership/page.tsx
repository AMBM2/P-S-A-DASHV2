"use client";

import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, Badge } from "@/components/ui";

export default function LeadershipPage() {
  const { leaders, settings } = useStore();
  const lang = settings.language;

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "صفحة القادة" : "Leadership"}
        subtitle={
          lang === "ar"
            ? "كبار مسؤولي قوات الأمن العام — الأسماء والرتب والصور الرسمية"
            : "Senior command staff of Public Security — names, ranks and official portraits"
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {leaders.map((l, i) => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card hover className="group flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 opacity-60 blur-sm transition-opacity group-hover:opacity-100" />
                <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-gold-400/50 bg-obsidian-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={l.photo || "/psa-logo.png"}
                    alt={l.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-gold-400/40 bg-black/80 px-2 py-0.5">
                  <Crown className="h-3 w-3 text-gold-300" />
                </div>
              </div>

              <Badge tone="gold" className="mb-2">{l.badge}</Badge>
              <h3 className="font-display text-lg font-bold text-white">
                {lang === "ar" ? l.nameAr : l.name}
              </h3>
              <div className="mt-1 font-display text-sm font-semibold gold-text">
                {lang === "ar" ? l.titleAr : l.title}
              </div>
              <div className="mt-0.5 text-xs text-zinc-400">{l.rank}</div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
