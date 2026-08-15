"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { setController, notify } from "@/lib/audio";
import { isYoutubeUrl } from "@/lib/upload";

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundRef = useRef(settings.sound);
  soundRef.current = settings.sound;

  const anthem = settings.anthemUrl || "";
  const isYt = isYoutubeUrl(anthem);
  const videoId = extractVideoId(anthem);

  useEffect(() => {
    if (!anthem) return;
    let cancelled = false;
    let tick: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      if (tick) clearInterval(tick);
      tick = null;
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
        } catch {}
      }
      playerRef.current = null;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      setController(null);
    };

    const startOnInteraction = () => {
      if (soundRef.current && playerRef.current && typeof playerRef.current.playVideo === "function")
        playerRef.current.playVideo();
      if (soundRef.current && audioRef.current) audioRef.current.play();
    };

    const startTick = () => {
      if (tick) clearInterval(tick);
      tick = setInterval(() => notify(), 500);
    };

    // ---- Uploaded file: HTML5 audio ----
    if (!isYt) {
      const a = new Audio(anthem);
      a.loop = true;
      audioRef.current = a;
      a.addEventListener("loadeddata", () => {
        if (cancelled) return;
        playerRef.current = a;
        setController({
          play: () => a.play(),
          pause: () => a.pause(),
          setVolume: (v) => {
            a.volume = Math.max(0, Math.min(100, v)) / 100;
          },
          getVolume: () => (typeof a.volume === "number" ? a.volume * 100 : 100),
          getDuration: () => a.duration || 0,
          getCurrentTime: () => a.currentTime || 0,
          getState: () => (a.paused ? 2 : 1),
          seek: (t) => {
            a.currentTime = t;
          },
        });
        notify();
        startTick();
        if (soundRef.current) a.play();
      });
      window.addEventListener("pointerdown", startOnInteraction);
      window.addEventListener("keydown", startOnInteraction);
      return () => {
        cancelled = true;
        window.removeEventListener("pointerdown", startOnInteraction);
        window.removeEventListener("keydown", startOnInteraction);
        cleanup();
      };
    }

    // ---- YouTube: IFrame API ----
    const buildPlayer = (vid: string) => {
      if (cancelled || !window.YT?.Player) return;
      const div = document.createElement("div");
      div.id = "psa-bg-player";
      document.body.appendChild(div);
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
            startTick();
            if (soundRef.current) p.playVideo();
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
      window.removeEventListener("pointerdown", startOnInteraction);
      window.removeEventListener("keydown", startOnInteraction);
      cleanup();
    };
  }, [anthem, isYt, videoId]);

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    if (settings.sound) {
      if (typeof p.playVideo === "function") p.playVideo();
      else if (typeof p.play === "function") p.play();
    } else {
      if (typeof p.pauseVideo === "function") p.pauseVideo();
      else if (typeof p.pause === "function") p.pause();
    }
  }, [settings.sound]);

  return null;
}
