"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export function DirSetter() {
  const { settings } = useStore();

  useEffect(() => {
    document.documentElement.dir = settings.language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = settings.language === "ar" ? "ar" : "en";
  }, [settings.language]);

  return null;
}
