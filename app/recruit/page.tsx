"use client";

import { UserPlus, ShieldCheck, BadgeCheck, Users, Radio } from "lucide-react";
import { Card, Button, SectionTitle } from "@/components/ui";

export default function RecruitPage() {
  const steps = [
    { icon: BadgeCheck, title: "تقديم الطلب", desc: "أكمل نموذج الانضمام وأرفق معلوماتك الأساسية." },
    { icon: Users, title: "المقابلة", desc: "مراجعة من قبل ضباط التجنيد وتحديد القسم المناسب." },
    { icon: Radio, title: "التدريب", desc: "برنامج تدريبي قصير قبل منح الرتبة الميدانية." },
  ];

  return (
    <div>
      <div className="clip-notch relative mb-10 overflow-hidden border border-white/10 bg-gradient-to-bl from-accent-500/10 via-[#080a10] to-[#080a10] p-8 md:p-12">
        <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-accent-500/15 blur-3xl" />
        <div className="relative flex flex-col items-center gap-6 text-center md:flex-row md:text-right">
          <div className="clip-hex flex h-24 w-24 shrink-0 items-center justify-center border border-accent-400/40 bg-[#0e1320] shadow-lg">
            <UserPlus className="h-11 w-11 text-accent-400" />
          </div>
          <div className="max-w-xl">
            <div className="clip-notch-sm mb-3 inline-flex items-center gap-2 border border-accent-500/30 bg-accent-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-accent-300">
              <ShieldCheck size={14} /> انضم إلى قوات الأمن العام
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-50 md:text-5xl">
              كن جزءاً من الأمن العام
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400 md:text-base">
              نبحث عن أفراد ملتزمين لحماية النظام على خادم Dash Roleplay. قدّم الآن وابدأ رحلتك المهنية.
            </p>
            <div className="mt-5">
              <Button variant="primary" onClick={() => window.open("https://discord.com", "_blank")}>
                <UserPlus size={16} /> ابدأ التقديم
              </Button>
            </div>
          </div>
        </div>
      </div>

      <SectionTitle icon={ShieldCheck}>خطوات الانضمام</SectionTitle>
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <Card key={i} hover>
            <div className="clip-hex mb-3 flex h-12 w-12 items-center justify-center border border-accent-500/30 bg-accent-500/10">
              <s.icon className="h-6 w-6 text-accent-400" />
            </div>
            <h3 className="font-display text-lg font-bold text-slate-50">{s.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{s.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

