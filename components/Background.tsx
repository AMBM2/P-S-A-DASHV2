import { ParticlesBackground } from "@/components/ParticlesBackground";

export function Background() {
  const dust = Array.from({ length: 28 }, (_, i) => i);
  const stars = Array.from({ length: 70 }, (_, i) => {
    const gold = i % 5 === 0;
    return {
      key: i,
      top: `${(i * 47) % 100}%`,
      left: `${(i * 61) % 100}%`,
      size: 1 + ((i * 7) % 3),
      delay: `${(i * 0.37) % 4}s`,
      duration: `${2.5 + ((i * 13) % 4)}s`,
      gold,
    };
  });
  const shooting = [12, 38, 66, 84];
  return (
    <>
      <div className="space-layer" aria-hidden>
        {stars.map((s) => (
          <span
            key={s.key}
            className={s.gold ? "space-star gold-star" : "space-star"}
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
              animationDuration: s.duration,
            }}
          />
        ))}
        {shooting.map((t, i) => (
          <span
            key={t}
            className="space-shooting"
            style={{ top: `${t}%`, left: `${(t * 2) % 90 + 5}%`, animationDelay: `${i * 2.4}s` }}
          />
        ))}
        <div
          className="space-nebula"
          style={{ top: "-18%", right: "-10%", width: "560px", height: "560px", background: "radial-gradient(circle, rgba(120,100,220,0.18), rgba(217,180,91,0.10) 45%, transparent 70%)" }}
        />
        <div
          className="space-nebula"
          style={{ bottom: "-14%", left: "-12%", width: "520px", height: "520px", background: "radial-gradient(circle, rgba(40,70,160,0.16), rgba(217,180,91,0.08) 50%, transparent 72%)" }}
        />
        <div
          className="space-nebula"
          style={{ top: "42%", right: "32%", width: "360px", height: "360px", background: "radial-gradient(circle, rgba(150,90,40,0.12), rgba(217,180,91,0.07) 50%, transparent 70%)" }}
        />
        <div className="space-planet" style={{ top: "-120px", right: "-110px", width: "220px", height: "220px" }}>
          <span className="planet-ring" />
        </div>
        <div className="space-planet" style={{ bottom: "-90px", left: "-70px", width: "150px", height: "150px" }}>
          <span className="planet-ring" />
        </div>
      </div>
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
