export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(iso: string, lang: "ar" | "en" = "ar") {
  try {
    return new Date(iso).toLocaleString(lang === "ar" ? "ar-EG" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} س`;
  const days = Math.floor(hrs / 24);
  return `منذ ${days} يوم`;
}

export function number(n: number) {
  return n.toLocaleString("en-US");
}
