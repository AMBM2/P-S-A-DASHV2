"use client";

import { useMemo } from "react";
import { Particles, ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

function CyberParticles() {
  const options = useMemo<ISourceOptions>(
    () => ({
      fullScreen: { enable: false },
      fpsLimit: 60,
      background: { color: { value: "transparent" } },
      particles: {
        number: { value: 60, density: { enable: true, area: 1000 } },
        color: { value: ["#fde68a", "#facc15", "#fef3c7", "#fbbf24"] },
        opacity: { value: { min: 0.08, max: 0.4 } },
        size: { value: { min: 1, max: 2.6 } },
        move: {
          enable: true,
          speed: 0.35,
          direction: "top",
          random: true,
          straight: false,
          outModes: { default: "out" },
        },
        links: {
          enable: true,
          distance: 130,
          color: "#eab308",
          opacity: 0.1,
          width: 1,
        },
      },
      detectRetina: true,
    }),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Particles id="cyber-particles" options={options} />
    </div>
  );
}

export function ParticlesBackground() {
  return (
    <ParticlesProvider init={async (engine) => loadSlim(engine)}>
      <CyberParticles />
    </ParticlesProvider>
  );
}
