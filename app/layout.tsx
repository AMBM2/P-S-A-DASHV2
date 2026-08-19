import type { Metadata, Viewport } from "next";
import { Cairo, Tajawal, Orbitron } from "next/font/google";
import { ShieldCheck } from "lucide-react";
import { StoreProvider } from "@/lib/store";
import { Background } from "@/components/Background";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { SiteGate } from "@/components/SiteGate";
import { Navbar } from "@/components/Navbar";
import { Ticker } from "@/components/Ticker";
import { WelcomeModal } from "@/components/WelcomeModal";
import { DirSetter } from "@/components/DirSetter";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: "الأمن العام | P S A",
  description: "البوابة الإدارية لقوات الأمن العام على خادم Dash Roleplay",
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable} ${orbitron.variable}`}>
      <body>
        <StoreProvider>
          <DirSetter />
          <Background />
          <BackgroundMusic />
          <WelcomeModal />
          <SiteGate>
            <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] bg-gradient-to-r from-gold-600 via-gold-300 to-gold-600 shadow-[0_0_18px_rgba(220,180,94,0.6)]" />
            <Ticker />
            <Navbar />
            <main className="mx-auto max-w-[1500px] px-4 py-6 md:px-6">{children}</main>
            <footer className="clip-notch border-t border-gold-400/15 bg-[rgba(var(--glass),0.5)] py-6 text-center">
              <div className="mb-3 flex items-center justify-center gap-3 text-gold-400/70">
                <span className="h-px w-16 bg-gradient-to-l from-gold-400/50 to-transparent" />
                <ShieldCheck size={16} />
                <span className="h-px w-16 bg-gradient-to-r from-gold-400/50 to-transparent" />
              </div>
              <span className="gold-text font-semibold">الأمن العام</span>
              <span className="mx-2 text-zinc-600">—</span>
              <span className="text-xs text-zinc-500">P S A · بوابة الأمن العام · خادم Dash Roleplay</span>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="v100-badge">V100 · نظام القيادة</span>
              </div>
            </footer>
          </SiteGate>
        </StoreProvider>
      </body>
    </html>
  );
}
