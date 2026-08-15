export type Rank = {
  id: string;
  title: string;
  titleAr: string;
  level: number;
  division: "command" | "officer" | "troop" | "training";
};

export type Department = {
  id: string;
  name: string;
  nameAr: string;
  color: string;
};

export type Officer = {
  id: string;
  badge: string;
  callsign: string;
  name: string;
  nameAr: string;
  cid?: string;
  discordId?: string;
  discordName?: string;
  discordAvatar?: string;
  rankId: string;
  departmentId: string;
  status: "on-duty" | "off-duty" | "suspended" | "leave" | "discharged";
  specialization: string[];
  squad?: string;
  joinedAt: string;
  email?: string;
  phone?: string;
  emergencyContact?: string;
  medals: string[];
  activityHours: number;
  performance: number;
  threats: number;
  medicalClear: boolean;
  fieldPoints?: number;
};

export type Leader = {
  id: string;
  name: string;
  nameAr: string;
  title: string;
  titleAr: string;
  badge: string;
  mandate: string;
  mandateAr: string;
  rank: string;
  photo?: string;
};

export type News = {
  id: string;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  category: "general" | "operational" | "urgent" | "internal";
  priority: "low" | "normal" | "high" | "critical";
  author: string;
  publishedAt: string;
  pinned: boolean;
  status: "draft" | "scheduled" | "published";
  image?: string;
  views: number;
  commentsEnabled: boolean;
};

export type MilitaryCode = {
  id: string;
  code: string;
  meaning: string;
  meaningAr: string;
  type: "10-code" | "signal" | "channel" | "protocol" | "callsign";
};

export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  timestamp: string;
  ip?: string;
};

export type SessionActivity = {
  id: string;
  user: string;
  ip: string;
  action: string;
  at: string;
};

export type Settings = {
  language: "ar" | "en";
  sound: boolean;
  lockdown: boolean;
  maintenance: boolean;
  twoFactor: boolean;
  inactivityMinutes: number;
  discordBotToken?: string;
  anthemUrl?: string;
  welcome?: {
    enabled: boolean;
    title: string;
    text: string;
    videoUrl: string;
  };
};
