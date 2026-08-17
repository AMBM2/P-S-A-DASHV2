// Seamless background video embed. External YouTube URLs are converted into an
// auto-playing, muted, looping iframe with all player controls disabled, and an
// invisible pointer-events-none overlay covers the whole player so visitors can
// never pause, stop, click through to YouTube, or reveal YouTube branding.
export function extractYouTubeId(url: string): string | null {
  const m = String(url || "").match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

export function toYouTubeEmbed(url: string, videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?controls=0&autoplay=1&mute=1&loop=1&playsinline=1&rel=0&disablekb=1&playlist=${videoId}`;
}

export function VideoBackground({ src }: { src: string }) {
  const videoId = extractYouTubeId(src);
  if (!videoId) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden bg-black" aria-hidden>
      <iframe
        src={toYouTubeEmbed(src, videoId)}
        title="خلفية"
        className="pointer-events-none h-full w-full"
        style={{ objectFit: "cover" }}
        allow="autoplay; encrypted-media; picture-in-picture"
        tabIndex={-1}
      />
      {/* Invisible overlay — blocks every interaction with the video. */}
      <div className="pointer-events-none absolute inset-0 bg-black/55" />
    </div>
  );
}