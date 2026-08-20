"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHotkeys } from "@mantine/hooks";
import { Command } from "cmdk";
import {
  Home,
  Crown,
  Users,
  Fingerprint,
  Radio,
  UserPlus,
  LayoutDashboard,
  Search,
} from "lucide-react";

const ITEMS = [
  { id: "home", label: "الرئيسية", desc: "نظرة عامة على القيادة", href: "/", icon: Home },
  { id: "leadership", label: "القادة", desc: "قيادة الأمن العام", href: "/leadership", icon: Crown },
  { id: "personnel", label: "الأفراد", desc: "سجل أعضاء القوة", href: "/personnel", icon: Users },
  { id: "lookup", label: "الاستعلام", desc: "التحقق من الهوية", href: "/lookup", icon: Fingerprint },
  { id: "field", label: "الميدان", desc: "قيادة عمليات الميدان", href: "/field", icon: Radio },
  { id: "recruit", label: "التجنيد", desc: "تقديم طلب تجنيد", href: "/recruit", icon: UserPlus },
  { id: "admin", label: "لوحة التحكم", desc: "الإعدادات والإدارة", href: "/admin", icon: LayoutDashboard },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useHotkeys([
    ["mod+K", () => setOpen((o) => !o)],
    ["Escape", () => setOpen(false)],
  ]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-[12vh]">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <Command
        loop
        className="glass-strong clip-notch hud-frame relative w-full max-w-xl overflow-hidden border border-gold-400/25 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95),0_0_50px_-15px_rgba(var(--accent-rgb),0.4)]"
      >
        <div className="flex items-center gap-2 border-b border-gold-400/20 px-4">
          <Search size={16} className="text-gold-300" />
          <Command.Input
            autoFocus
            placeholder="ابحث عن قسم… (الرئيسية، الأفراد، لوحة التحكم)"
            className="w-full bg-transparent py-3.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none"
          />
        </div>
        <Command.List className="scrollbar-thin max-h-80 overflow-y-auto p-2">
          <Command.Empty className="py-10 text-center text-sm text-zinc-500">
            لا توجد نتائج
          </Command.Empty>
          <Command.Group heading="التنقل السريع">
            {ITEMS.map((item) => (
              <Command.Item
                key={item.id}
                value={item.id}
                onSelect={() => {
                  router.push(item.href);
                  setOpen(false);
                }}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 data-[selected=true]:bg-gold-400/15 data-[selected=true]:text-gold-100"
              >
                <item.icon size={16} className="text-gold-300/80" />
                <span className="font-medium">{item.label}</span>
                <span className="mr-auto text-xs text-zinc-500">{item.desc}</span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
        <div className="flex items-center justify-between border-t border-gold-400/20 px-4 py-2 text-[10px] uppercase tracking-widest text-zinc-500">
          <span>⌘K · تنقّل</span>
          <span>ESC · إغلاق</span>
        </div>
      </Command>
    </div>
  );
}