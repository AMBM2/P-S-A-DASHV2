"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type {
  News,
  Officer,
  Leader,
  MilitaryCode,
  AuditEntry,
  Settings,
} from "./types";
import { supabase } from "./supabase";

type Collections = {
  news: News[];
  officers: Officer[];
  leaders: Leader[];
  codes: MilitaryCode[];
};

type Store = Collections & {
  settings: Settings;
  audit: AuditEntry[];
  loading: boolean;
  session: { discordId: string; officer: Officer | null } | null;
  login: (discordId: string, officer: Officer | null) => void;
  logout: () => void;
  addAudit: (action: string, entity: string) => void;
  upsert: <K extends keyof Collections>(key: K, item: Collections[K][number]) => void;
  remove: <K extends keyof Collections>(key: K, id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  nextBadge: () => string;
  nextCallsign: () => string;
  resetData: () => void;
  exportJSON: () => void;
  getRankTitle: (id: string) => string;
  getDepartmentTitle: (id: string) => string;
};

const DEFAULT_SETTINGS: Settings = {
  language: "ar",
  sound: true,
  lockdown: false,
  maintenance: false,
  twoFactor: true,
  inactivityMinutes: 15,
  anthemUrl: "https://www.youtube.com/watch?v=ecdPScS0MKo",
  welcome: {
    enabled: true,
    title: "مرحباً بكم في الأمن العام",
    text: "نرحب بكم في بوابة الأمن العام الرسمية. تفضلوا باستكشاف خدماتنا.",
    videoUrl: "https://www.youtube.com/embed/ecdPScS0MKo",
  },
  newsCategories: [
    { id: "general", labelAr: "عام", label: "General" },
    { id: "ziyarat", labelAr: "زيارات القطاعات", label: "Sector Visits" },
    { id: "mudamat", labelAr: "مداهمات", label: "Raids" },
    { id: "tamshit", labelAr: "تمشيط", label: "Sweeps" },
    { id: "internal", labelAr: "داخلي", label: "Internal" },
  ],
  fieldRoleId: "1527321813325971577",
};

const TABLE: Record<keyof Collections, string> = {
  news: "news",
  officers: "officers",
  leaders: "leaders",
  codes: "codes",
};

// SECURITY: the settings row is readable with the public anon key. Never let
// any secret-shaped key (bot tokens, API keys, service keys, passwords) reach
// the browser bundle, even if it was ever stored in the settings value.
const SECRET_KEYS = /token|secret|apikey|api_key|service_role|password|discordBotToken/i;
function stripSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripSecrets);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEYS.test(k)) continue;
      out[k] = stripSecrets(v);
    }
    return out;
  }
  return value;
}
function safeSettings(raw: any): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...(stripSecrets(raw?.value || {}) as Partial<Settings>),
    language: "ar",
  };
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [news, setNews] = useState<News[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [codes, setCodes] = useState<MilitaryCode[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Store["session"]>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("psa_session");
      if (raw) setSession(JSON.parse(raw));
    } catch {}
  }, []);

  const login = (discordId: string, officer: Officer | null) => {
    const s = { discordId, officer };
    setSession(s);
    try {
      localStorage.setItem("psa_session", JSON.stringify(s));
    } catch {}
  };

  const logout = () => {
    setSession(null);
    try {
      localStorage.removeItem("psa_session");
    } catch {}
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const [n, o, l, c, st] = await Promise.all([
        supabase.from("news").select("*").order("publishedAt", { ascending: false }),
        supabase.from("officers").select("*"),
        supabase.from("leaders").select("*"),
        supabase.from("codes").select("*"),
        supabase.from("settings").select("*").eq("key", "settings").single(),
      ]);
      if (!active) return;
      if (n.data) setNews(n.data as News[]);
      if (o.data) setOfficers(o.data as Officer[]);
      if (l.data) setLeaders(l.data as Leader[]);
      if (c.data) setCodes(c.data as MilitaryCode[]);
      if (st.data?.value) setSettings(safeSettings(st));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const tables = ["news", "officers", "leaders", "codes", "settings"] as const;
    const channels: { unsubscribe: () => void }[] = [];

    for (const t of tables) {
      const ch = supabase
        .channel(`realtime-${t}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: t },
          async (payload) => {
            if (t === "settings") {
              const { data } = await supabase
                .from("settings")
                .select("*")
                .eq("key", "settings")
                .single();
              if (data?.value) setSettings(safeSettings(data));
              return;
            }
            const query = supabase.from(t).select("*");
            const ordered =
              t === "news" ? query.order("publishedAt", { ascending: false }) : query;
            const { data } = await ordered;
            if (!data) return;
            if (t === "news") setNews(data as News[]);
            else if (t === "officers") setOfficers(data as Officer[]);
            else if (t === "leaders") setLeaders(data as Leader[]);
            else if (t === "codes") setCodes(data as MilitaryCode[]);
          }
        )
        .subscribe();
      channels.push(ch);
    }

    return () => {
      channels.forEach((c) => c.unsubscribe());
    };
  }, []);

  const addAudit = (action: string, entity: string) => {
    const entry: AuditEntry = {
      id: crypto.randomUUID(),
      actor: "Admin",
      action,
      entity,
      timestamp: new Date().toISOString(),
      ip: "127.0.0.1",
    };
    setAudit((prev) => [entry, ...prev].slice(0, 200));
    fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry, actor: session?.discordId || "" }),
    }).catch(() => {});
  };

  const upsert = <K extends keyof Collections>(key: K, item: Collections[K][number]) => {
    const lists: Collections = { news, officers, leaders, codes };
    const setters = {
      news: setNews,
      officers: setOfficers,
      leaders: setLeaders,
      codes: setCodes,
    };
    const existing = lists[key].find((x) => (x as { id: string }).id === (item as { id: string }).id);
    (setters[key] as unknown as React.Dispatch<React.SetStateAction<never[]>>)((prev: never[]) => {
      const list = prev as unknown as { id: string }[];
      return (existing
        ? list.map((x) => (x.id === (item as { id: string }).id ? item : x))
        : [item, ...list]) as never[];
    });
    addAudit(existing ? "Updated" : "Created", key);
    fetch("/api/store/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: TABLE[key], item, actor: session?.discordId || "" }),
    }).catch(() => {});
  };

  const remove = <K extends keyof Collections>(key: K, id: string) => {
    const setters = {
      news: setNews,
      officers: setOfficers,
      leaders: setLeaders,
      codes: setCodes,
    };
    (setters[key] as unknown as React.Dispatch<React.SetStateAction<never[]>>)((prev: never[]) =>
      (prev as unknown as { id: string }[]).filter((x) => x.id !== id) as never[]
    );
    addAudit("Deleted", key);
    fetch("/api/store/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: TABLE[key], id, actor: session?.discordId || "" }),
    }).catch(() => {});
  };

  const updateSettings = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: next, actor: session?.discordId || "" }),
      }).catch(() => {});
      return next;
    });
  };

  const nextBadge = () => {
    const max = officers.reduce((m, o) => {
      const n = parseInt(o.badge.replace(/\D/g, ""), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 1000);
    return `PSA-${String(max + 1).padStart(4, "0")}`;
  };

  const nextCallsign = () => {
    const n = officers.length + 1;
    const letters = ["Adam", "Bravo", "Charlie", "Delta"];
    return `${n}-${letters[(n - 1) % 4]}`;
  };

  const resetData = async () => {
    await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actor: session?.discordId || "" }),
    }).catch(() => {});
    window.location.reload();
  };

  const exportJSON = () => {
    const data = { news, officers, leaders, codes, settings, audit };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "psa-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRankTitle = (id: string) =>
    settings.ranks?.find((r) => r.id === id)?.titleAr ||
    settings.ranks?.find((r) => r.id === id)?.title ||
    id;

  const getDepartmentTitle = (id: string) =>
    settings.departments?.find((d) => d.id === id)?.nameAr ||
    settings.departments?.find((d) => d.id === id)?.name ||
    id;

  const store: Store = {
    news,
    officers,
    leaders,
    codes,
    settings,
    audit,
    loading,
    session,
    login,
    logout,
    addAudit,
    upsert,
    remove,
    updateSettings,
    nextBadge,
    nextCallsign,
    resetData,
    exportJSON,
    getRankTitle,
    getDepartmentTitle,
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
