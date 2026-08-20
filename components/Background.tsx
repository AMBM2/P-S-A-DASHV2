import { ParticlesBackground } from "@/components/ParticlesBackground";

export function Background() {
  return (
    <>
      {/* Ambiant tactical glows */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 38% at 18% -5%, rgba(234,179,8,0.13), transparent 62%)," +
            "radial-gradient(ellipse 42% 34% at 88% 8%, rgba(16,185,129,0.08), transparent 58%)," +
            "radial-gradient(ellipse 50% 45% at 50% 112%, rgba(234,179,8,0.07), transparent 62%)",
        }}
      />
      {/* Static raster grid */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, black, transparent)",
        }}
      />
      {/* Hazard top strip */}
      <div className="hazard-stripes fixed inset-x-0 top-0 z-[5] h-[3px] opacity-60" aria-hidden />
      <ParticlesBackground />
    </>
  );
}