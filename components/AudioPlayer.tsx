"use client";

import { useEffect, useRef, useState } from "react";
import { Music, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { getController, subscribe } from "@/lib/audio";
import { cn } from "@/lib/format";

function fmt(sec: number) {
  if (!sec || isNaN(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function AudioPlayer() {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [soundPref, setSoundPref] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setSoundPref(localStorage.getItem("psa_sound") !== "off");
    } catch {}
  }, []);

  useEffect(() => {
    const c = getController();
    if (c) {
      setVolume(c.getVolume());
      setPlaying(c.getState() === 1);
    }
    const unsub = subscribe(() => {
      const cc = getController();
      if (!cc) return;
      setVolume(cc.getVolume());
      setPlaying(cc.getState() === 1);
      const d = cc.getDuration();
      setDuration(d);
      setCurrent(cc.getCurrentTime());
    });
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => {
      unsub();
      document.removeEventListener("pointerdown", onDoc);
    };
  }, []);

  const togglePlay = () => {
    const c = getController();
    if (!c) return;
    if (playing) {
      c.pause();
      setSoundPref(false);
      try {
        localStorage.setItem("psa_sound", "off");
      } catch {}
    } else {
      c.play();
      setSoundPref(true);
      try {
        localStorage.setItem("psa_sound", "on");
      } catch {}
    }
  };

  const onVolume = (v: number) => {
    setVolume(v);
    const c = getController();
    if (c) c.setVolume(v);
  };

  const muted = volume === 0;
  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "rounded-lg border p-2 transition-colors",
          open
            ? "border-gold-300/60 bg-gold-400/15 text-gold-100"
            : "border-gold-400/20 text-zinc-300 hover:text-gold-100"
        )}
        title={soundPref ? "مشغل الصوت" : "مشغل الصوت"}
      >
        {playing && !muted ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 origin-top overflow-hidden rounded-xl border border-gold-400/30 bg-[rgba(var(--glass),0.92)] p-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />

          {/* Track info */}
          <div className="mb-3 flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gold-300/40 bg-obsidian-800 shadow-[0_0_14px_rgba(var(--accent-rgb),0.3)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/psa-logo.png" alt="النشيد" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                <Music size={13} className="shrink-0 text-gold-300" />
                <span className="truncate">النشيد الرسمي للأمن العام</span>
              </div>
              <div className="truncate text-xs text-zinc-400">Public Security Anthem</div>
            </div>
          </div>

          {/* Play / Pause + Volume */}
          <div className="mb-2 flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="gold-shimmer flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-300/50 bg-gradient-to-b from-emerald-300 via-emerald-400 to-emerald-600 text-white shadow-[0_4px_16px_-4px_rgba(var(--accent-rgb),0.6)] transition-transform active:scale-95"
            >
              {playing ? <Pause size={15} /> : <Play size={15} className="mr-0.5" />}
            </button>
            <div className="flex flex-1 items-center gap-2">
              <button
                onClick={() => onVolume(muted ? 100 : 0)}
                className="shrink-0 text-zinc-400 transition-colors hover:text-gold-200"
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => onVolume(Number(e.target.value))}
                className="gold-range h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10"
                style={{ accentColor: "var(--accent)" }}
                aria-label="مستوى الصوت"
              />
              <span className="w-8 shrink-0 text-right text-xs tabular-nums text-zinc-400">{volume}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <span className="w-9 shrink-0 text-[11px] tabular-nums text-zinc-400">{fmt(current)}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, var(--accent-500), var(--accent-bright))",
                  boxShadow: "0 0 8px rgba(var(--accent-rgb),0.6)",
                }}
              />
            </div>
            <span className="w-9 shrink-0 text-left text-[11px] tabular-nums text-zinc-400">{fmt(duration)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
