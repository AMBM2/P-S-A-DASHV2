"use client";

export type AudioController = {
  play: () => void;
  pause: () => void;
  setVolume: (v: number) => void;
  getVolume: () => number;
  getDuration: () => number;
  getCurrentTime: () => number;
  getState: () => number;
  seek: (t: number) => void;
};

let controller: AudioController | null = null;
const listeners = new Set<() => void>();

export function setController(c: AudioController | null) {
  controller = c;
  listeners.forEach((fn) => fn());
}

export function getController(): AudioController | null {
  return controller;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function notify() {
  listeners.forEach((fn) => fn());
}
