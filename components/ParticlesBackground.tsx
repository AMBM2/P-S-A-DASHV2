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
        color: { value: ["#D9B45B", "#F3D489", "#E6C97D"] },
        opacity: { value: { min: 0.1, max: 0.55 } },
        size: { value: { min: 1, max: 2.6 } },
        move: {
          enable: true,
          speed: 0.5,
          direction: "top",
          random: true,
          straight: false,
          outModes: { default: "out" },
        },
        links: {
          enable: true,
          distance: 130,
          color: "#D9B45B",
          opacity: 0.15,
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
