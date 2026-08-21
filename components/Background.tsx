import { ParticlesBackground } from "@/components/ParticlesBackground";

export function Background() {
  return (
    <>
      {/* Cosmic nebula clouds */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 animate-[nebulaDrift_26s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 18% 8%, rgba(234,179,8,0.12), transparent 60%)," +
            "radial-gradient(ellipse 45% 38% at 85% 12%, rgba(202,138,4,0.10), transparent 58%)," +
            "radial-gradient(ellipse 40% 35% at 60% 95%, rgba(250,204,21,0.07), transparent 60%)," +
            "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(120,80,10,0.10), transparent 65%)",
        }}
      />
      {/* Twinkling starfield — layered */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-45"
        style={{
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 20% 30%, rgba(255,248,230,0.9), transparent), radial-gradient(1px 1px at 70% 20%, rgba(255,240,200,0.7), transparent), radial-gradient(1.5px 1.5px at 40% 70%, rgba(250,204,21,0.85), transparent), radial-gradient(1px 1px at 85% 60%, rgba(255,248,230,0.6), transparent), radial-gradient(1px 1px at 55% 45%, rgba(253,230,138,0.8), transparent), radial-gradient(1.5px 1.5px at 10% 80%, rgba(255,248,230,0.7), transparent), radial-gradient(1px 1px at 90% 35%, rgba(255,240,200,0.6), transparent), radial-gradient(1px 1px at 33% 15%, rgba(255,248,230,0.6), transparent)",
          backgroundRepeat: "repeat",
          backgroundSize: "420px 420px",
          animation: "twinkle 6s ease-in-out infinite",
        }}
      />
      {/* Second slower star layer for parallax depth */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 25% 55%, rgba(255,248,230,0.7), transparent), radial-gradient(1px 1px at 75% 75%, rgba(250,204,21,0.8), transparent), radial-gradient(1px 1px at 50% 25%, rgba(255,248,230,0.5), transparent), radial-gradient(1px 1px at 15% 40%, rgba(255,248,230,0.6), transparent), radial-gradient(1px 1px at 65% 90%, rgba(253,230,138,0.7), transparent)",
          backgroundRepeat: "repeat",
          backgroundSize: "680px 680px",
          animation: "twinkle 9s ease-in-out infinite reverse",
        }}
      />
      {/* Faint orbital grid */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, black, transparent)",
        }}
      />
      <ParticlesBackground />
    </>
  );
}
