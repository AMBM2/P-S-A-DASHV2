import { ParticlesBackground } from "@/components/ParticlesBackground";

export function Background() {
  const dust = Array.from({ length: 28 }, (_, i) => i);
  return (
    <>
      <div className="grid-backdrop" />
      <div className="gold-dust" aria-hidden>
        {dust.map((i) => (
          <span
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              animationDelay: `${(i * 0.7) % 12}s`,
              animationDuration: `${10 + (i % 5)}s`,
              transform: `scale(${0.6 + ((i % 3) * 0.4)})`,
            }}
          />
        ))}
      </div>
      <div
        className="cyber-orb"
        style={{ top: "-10%", left: "-8%", width: "420px", height: "420px", background: "rgba(217,180,91,0.13)" }}
      />
      <div
        className="cyber-orb"
        style={{ bottom: "-12%", right: "-6%", width: "500px", height: "500px", background: "rgba(243,212,137,0.09)" }}
      />
      <div
        className="cyber-orb"
        style={{ top: "30%", right: "18%", width: "300px", height: "300px", background: "rgba(194,154,68,0.10)" }}
      />
      <div className="lux-vignette" />
      <ParticlesBackground />
    </>
  );
}
