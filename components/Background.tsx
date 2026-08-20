import { ParticlesBackground } from "@/components/ParticlesBackground";

export function Background() {
  return (
    <>
      <div className="carbon-bg" aria-hidden />
      <div className="grid-backdrop" />
      <div className="tactical-grid" aria-hidden />
      <div className="hazard-stripes fixed inset-x-0 top-0 z-[5] h-[3px] opacity-60" aria-hidden />
      <div
        className="cyber-orb"
        style={{ top: "-12%", left: "-8%", width: "460px", height: "460px", background: "rgba(var(--accent-rgb),0.12)" }}
      />
      <div
        className="cyber-orb"
        style={{ bottom: "-14%", right: "-6%", width: "520px", height: "520px", background: "rgba(var(--jade-rgb),0.09)" }}
      />
      <div
        className="cyber-orb"
        style={{ top: "26%", right: "16%", width: "320px", height: "320px", background: "rgba(var(--accent-rgb),0.08)" }}
      />
      <div className="lux-vignette" />
      <ParticlesBackground />
    </>
  );
}