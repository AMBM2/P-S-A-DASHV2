"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui";
import { isYoutubeUrl } from "@/lib/upload";

const STORAGE_KEY = "psa_welcome_seen";

export function WelcomeModal() {
  const { settings } = useStore();
  const welcome = settings.welcome;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!welcome?.enabled) return;
    let shown = false;
    try {
      shown = sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {}
    if (shown) return;
    const t = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(t);
  }, [welcome?.enabled]);

  const close = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  };

  if (!welcome?.enabled || !welcome.videoUrl) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />

          <motion.div
            initial={{ scale: 0.9, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative w-3/4 max-w-[1300px] overflow-hidden rounded-2xl border border-gold-300/40 bg-obsidian-900/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />

            <button
              onClick={close}
              className="absolute right-3 top-3 z-10 rounded-full border border-gold-400/30 bg-black/40 p-1.5 text-zinc-300 transition-colors hover:text-gold-200"
              aria-label="إغلاق"
            >
              <X size={16} />
            </button>

            {/* Video */}
            <div className="relative aspect-video w-full bg-black">
              {isYoutubeUrl(welcome.videoUrl) ? (
                <iframe
                  src={`${welcome.videoUrl}?autoplay=1&mute=1&rel=0&controls=1`}
                  title={welcome.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={welcome.videoUrl}
                  className="h-full w-full object-contain"
                  autoPlay
                  muted
                  loop
                  controls
                  playsInline
                />
              )}
            </div>

            {/* Text */}
            <div className="p-6 pt-4">
              <div className="mb-2 flex items-center gap-2">
                <Info size={17} className="text-gold-300" />
                <h2 className="font-display text-lg font-bold gold-text">{welcome.title}</h2>
              </div>
              <p className="text-sm leading-relaxed text-zinc-300">{welcome.text}</p>
              <div className="mt-5 flex justify-end">
                <Button onClick={close}>حسناً، فهمت</Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
