export const AR = {
  priority: {
    critical: "حرج",
    high: "مرتفع",
    normal: "عادي",
    low: "منخفض",
  } as Record<string, string>,
  category: {
    general: "عام",
    operational: "عملياتي",
    urgent: "عاجل",
    internal: "داخلي",
  } as Record<string, string>,
  officerStatus: {
    "on-duty": "في الخدمة",
    "off-duty": "خارج الخدمة",
    suspended: "موقوف",
    leave: "إجازة",
    discharged: "مُسرّح",
  } as Record<string, string>,
  status: {
    "on-duty": "في الخدمة",
    "off-duty": "خارج الخدمة",
    suspended: "موقوف",
    leave: "إجازة",
    discharged: "مُسرّح",
  } as Record<string, string>,
  codeType: {
    "10-code": "كود 10",
    signal: "إشارة",
    channel: "قناة",
    protocol: "بروتوكول",
    callsign: "نداء",
  } as Record<string, string>,
  vehicleStatus: {
    active: "نشط",
    maintenance: "صيانة",
    impounded: "محجوز",
    retired: "متقاعد",
  } as Record<string, string>,
  incidentSeverity: {
    low: "منخفض",
    medium: "متوسط",
    high: "مرتفع",
    critical: "حرج",
  } as Record<string, string>,
  incidentStatus: {
    open: "مفتوح",
    closed: "مغلق",
  } as Record<string, string>,
  warrantStatus: {
    Active: "نشط",
    Executed: "منفذ",
    Expired: "منتهي",
  } as Record<string, string>,
  newsStatus: {
    draft: "مسودة",
    scheduled: "مجدول",
    published: "منشور",
  } as Record<string, string>,
  division: {
    command: "قيادة",
    officer: "ضباط",
    troop: "أفراد",
  } as Record<string, string>,
};
