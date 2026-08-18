import type {
  News,
  Officer,
  Leader,
  MilitaryCode,
  Department,
  Rank,
} from "./types";

export const RANKS: Rank[] = [
  { id: "r-council", title: "Presidential Council Leader", titleAr: "قائد المجلس الرئاسي", level: 30, division: "command" },
  { id: "r-governor", title: "DASH Governor", titleAr: "حاكم داش", level: 29, division: "command" },
  { id: "r-supreme", title: "Supreme Commander", titleAr: "القائد الأعلى", level: 28, division: "command" },
  { id: "r-supreme-mil", title: "Supreme Commander of Military Forces", titleAr: "القائد الأعلى للقوات العسكرية", level: 27, division: "command" },
  { id: "r-pm", title: "Prime Minister", titleAr: "رئيس الوزراء", level: 26, division: "command" },
  { id: "r-vpm", title: "Deputy Prime Minister", titleAr: "نائب رئيس الوزراء", level: 25, division: "command" },
  { id: "r-pmadv", title: "Advisor to the PM", titleAr: "مستشار رئيس الوزراء", level: 24, division: "command" },
  { id: "r-minister-def", title: "Minister of Defense", titleAr: "وزير الدفاع", level: 23, division: "command" },
  { id: "r-minister-justice", title: "Minister of Justice", titleAr: "وزير العدل", level: 23, division: "command" },
  { id: "r-minister-health", title: "Minister of Health", titleAr: "وزير الصحة", level: 23, division: "command" },
  { id: "r-minister", title: "Minister of Interior", titleAr: "وزير الداخلية", level: 23, division: "command" },
  { id: "r-vminister-def", title: "Deputy Minister of Defense", titleAr: "نائب وزير الدفاع", level: 22, division: "command" },
  { id: "r-vminister-justice", title: "Deputy Minister of Justice", titleAr: "نائب وزير العدل", level: 22, division: "command" },
  { id: "r-vminister-health", title: "Deputy Minister of Health", titleAr: "نائب وزير الصحة", level: 22, division: "command" },
  { id: "r-vminister", title: "Deputy Minister of Interior", titleAr: "نائب وزير الداخلية", level: 22, division: "command" },
  { id: "r-minadv", title: "Ministerial Advisor", titleAr: "مستشار وزاري", level: 21, division: "command" },
  { id: "r-councilmember", title: "Supreme Council Members", titleAr: "أعضاء المجلس الأعلى", level: 21, division: "command" },
  { id: "r-intelhead", title: "Head of General Intelligence", titleAr: "رئيس الاستخبارات العامة", level: 21, division: "command" },
  { id: "r-dir", title: "Director of Public Security", titleAr: "مدير الأمن العام", level: 21, division: "command" },
  { id: "r-inteldep", title: "Deputy Head of General Intelligence", titleAr: "نائب رئيس الاستخبارات العامة", level: 20, division: "command" },
  { id: "r-dirdep", title: "Deputy Director of Public Security", titleAr: "نائب مدير الأمن العام", level: 20, division: "command" },
  { id: "r-lgen", title: "Lieutenant General", titleAr: "فريق أول", level: 19, division: "officer" },
  { id: "r-mgen", title: "Major General", titleAr: "لواء", level: 18, division: "officer" },
  { id: "r-brig", title: "Brigadier", titleAr: "عميد", level: 17, division: "officer" },
  { id: "r-col", title: "Colonel", titleAr: "عقيد", level: 16, division: "officer" },
  { id: "r-ltcol", title: "Lieutenant Colonel", titleAr: "مقدم", level: 15, division: "officer" },
  { id: "r-major", title: "Major", titleAr: "رائد", level: 14, division: "officer" },
  { id: "r-capt", title: "Captain", titleAr: "نقيب", level: 13, division: "officer" },
  { id: "r-1lt", title: "First Lieutenant", titleAr: "ملازم أول", level: 12, division: "officer" },
  { id: "r-lt", title: "Lieutenant", titleAr: "ملازم", level: 11, division: "officer" },
  { id: "r-msg", title: "Master Sergeant", titleAr: "رئيس رقباء", level: 10, division: "troop" },
  { id: "r-sfc", title: "Sergeant First Class", titleAr: "رقيب أول", level: 9, division: "troop" },
  { id: "r-sgt", title: "Sergeant", titleAr: "رقيب", level: 8, division: "troop" },
  { id: "r-lcpl", title: "Lance Corporal", titleAr: "وكيل رقيب", level: 7, division: "troop" },
  { id: "r-cpl", title: "Corporal", titleAr: "عريف", level: 6, division: "troop" },
  { id: "r-pfc", title: "Private First Class", titleAr: "جندي أول", level: 5, division: "troop" },
  { id: "r-pvt", title: "Private", titleAr: "جندي", level: 4, division: "troop" },
  { id: "r-tr4", title: "Lance Corporal Trainee", titleAr: "وكيل رقيب تحت التدريب", level: 3, division: "training" },
  { id: "r-tr3", title: "Corporal Trainee", titleAr: "عريف تحت التدريب", level: 2, division: "training" },
  { id: "r-tr2", title: "Private First Class Trainee", titleAr: "جندي أول تحت التدريب", level: 1, division: "training" },
  { id: "r-tr1", title: "Recruit Trainee", titleAr: "جندي تحت التدريب", level: 0, division: "training" },
];

export const DEPARTMENTS: Department[] = [
  { id: "d-hq", name: "Headquarters", nameAr: "القيادة العامة", color: "#D9B45B" },
  { id: "d-patrol", name: "Patrol Division", nameAr: "قسم الدوريات", color: "#E6C97D" },
  { id: "d-traffic", name: "Traffic Unit", nameAr: "وحدة المرور", color: "#C29A44" },
  { id: "d-k9", name: "K9 Unit", nameAr: "وحدة الكلاب", color: "#F3D489" },
  { id: "d-swats", name: "SWAT", nameAr: "مكافحة الشغب", color: "#A37E32" },
  { id: "d-inv", name: "Investigations", nameAr: "التحقيقات", color: "#B9A05A" },
  { id: "d-int", name: "Internal Affairs", nameAr: "الشؤون الداخلية", color: "#D9B45B" },
];

// All records now live in Supabase — these seed arrays are intentionally empty.
export const SEED_LEADERS: Leader[] = [];
export const SEED_OFFICERS: Officer[] = [];
export const SEED_NEWS: News[] = [];
export const SEED_CODES: MilitaryCode[] = [];
