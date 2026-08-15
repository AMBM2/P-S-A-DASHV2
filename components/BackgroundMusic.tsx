"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { setController, notify } from "@/lib/audio";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function extractVideoId(url?: string): string {
  if (!url) return "ecdPScS0MKo";
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : "ecdPScS0MKo";
}

export function BackgroundMusic() {
  const { settings } = useStore();
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const soundRef = useRef(settings.sound);
  soundRef.current = settings.sound;

  const videoId = extractVideoId(settings.anthemUrl);

  useEffect(() => {
    let cancelled = false;
    let tick: ReturnType<typeof setInterval> | null = null;

    const startOnInteraction = () => {
      if (soundRef.current && playerRef.current) playerRef.current.playVideo();
    };

    const buildPlayer = (vid: string) => {
      if (cancelled || !window.YT?.Player) return;
      if (!containerRef.current) {
        const div = document.createElement("div");
        div.id = "psa-bg-player";
        document.body.appendChild(div);
        containerRef.current = div;
      }
      const p = new window.YT.Player("psa-bg-player", {
        width: "0",
        height: "0",
        videoId: vid,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            playerRef.current = p;
            setController({
              play: () => p.playVideo(),
              pause: () => p.pauseVideo(),
              setVolume: (v) => p.setVolume(Math.max(0, Math.min(100, v))),
              getVolume: () => (typeof p.getVolume === "function" ? p.getVolume() : 100),
              getDuration: () => p.getDuration() || 0,
              getCurrentTime: () => p.getCurrentTime() || 0,
              getState: () => (typeof p.getPlayerState === "function" ? p.getPlayerState() : 0),
              seek: (t) => p.seekTo(t, true),
            });
            notify();
            if (soundRef.current) p.playVideo();
            if (tick) clearInterval(tick);
            tick = setInterval(() => notify(), 500);
          },
        },
      });
    };

    if (window.YT?.Player) {
      buildPlayer(videoId);
    } else {
      window.onYouTubeIframeAPIReady = () => {
        if (!cancelled) buildPlayer(videoId);
      };
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
    }

    window.addEventListener("pointerdown", startOnInteraction);
    window.addEventListener("keydown", startOnInteraction);

    return () => {
      cancelled = true;
      if (tick) clearInterval(tick);
      window.removeEventListener("pointerdown", startOnInteraction);
      window.removeEventListener("keydown", startOnInteraction);
    };
  }, [videoId]);

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    if (settings.sound) {
      p.playVideo();
    } else {
      p.pauseVideo();
    }
  }, [settings.sound]);

  return null;
}
