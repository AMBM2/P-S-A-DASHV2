const DEFAULT_KEY = "P5a!Admin#CyberGate@2026";
const KEY_STORAGE = "psa_admin_master_key";
const AUTH_STORAGE = "psa_admin_authed";

export function getMasterKey(): string {
  if (typeof window === "undefined") return DEFAULT_KEY;
  return window.localStorage.getItem(KEY_STORAGE) || DEFAULT_KEY;
}

export function setMasterKey(k: string) {
  window.localStorage.setItem(KEY_STORAGE, k);
}

export function meetsPolicy(k: string): boolean {
  return (
    k.length >= 24 &&
    /[a-z]/.test(k) &&
    /[A-Z]/.test(k) &&
    /[0-9]/.test(k) &&
    /[^A-Za-z0-9]/.test(k)
  );
}

export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(AUTH_STORAGE) === "1";
}

export function setAuthed(v: boolean) {
  if (typeof window === "undefined") return;
  if (v) window.sessionStorage.setItem(AUTH_STORAGE, "1");
  else window.sessionStorage.removeItem(AUTH_STORAGE);
}
