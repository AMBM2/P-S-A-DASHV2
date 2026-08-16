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
  category: string;
  priority: "low" | "normal" | "high" | "critical";
  author: string;
  publishedAt: string;
  pinned: boolean;
  status: "draft" | "scheduled" | "published";
  image?: string;
  images?: string[];
  views: number;
};

export type NewsCategory = {
  id: string;
  labelAr: string;
  label: string;
};

export type MilitaryCode = {
  id: string;
  code: string;
  meaning: string;
  meaningAr: string;
  type: "10-code" | "signal" | "channel" | "protocol" | "callsign";
};

export type AdminUser = {
  id: string;
  userId: string;
  role: "master" | "admin" | "recruitment";
  note: string;
  active: boolean;
  createdAt: string;
};

export type Application = {
  id: string;
  name: string;
  nameAr: string;
  discordId: string;
  unit: string;
  ranks: string[];
  status: "pending" | "approved" | "denied";
  examScore: number;
  examAnswers: number[];
  reviewedBy: string | null;
  createdAt: string;
};

export type Cadet = {
  id: string;
  applicationId: string | null;
  discordId: string;
  name: string;
  nameAr: string;
  rankId: string;
  unit: string;
  status: "pending" | "enrolled" | "graduated" | "discharged";
  examScore: number;
  officerId: string | null;
  createdAt: string;
};

export type ExamQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  points: number;
  active: boolean;
  createdAt: string;
};

export type AccessLevel = "none" | "recruitment" | "admin" | "master";

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
  newsCategories?: NewsCategory[];
};
