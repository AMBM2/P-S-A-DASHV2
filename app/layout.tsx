import type { Metadata, Viewport } from "next";
import { Cairo, Tajawal, Space_Grotesk, Inter } from "next/font/google";
import { ShieldCheck } from "lucide-react";
import { StoreProvider } from "@/lib/store";
import { Background } from "@/components/Background";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { SiteGate } from "@/components/SiteGate";
import { Sidebar } from "@/components/Sidebar";
import { Ticker } from "@/components/Ticker";
import { WelcomeModal } from "@/components/WelcomeModal";
import { DirSetter } from "@/components/DirSetter";
import { CommandPalette } from "@/components/CommandPalette";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "الأمن العام | P S A",
  description: "البوابة الإدارية لقوات الأمن العام على خادم Dash Roleplay",
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} ${cairo.variable} ${tajawal.variable} ${spaceGrotesk.variable}`}>
      <body>
        <StoreProvider>
          <DirSetter />
          <Background />
          <BackgroundMusic />
          <WelcomeModal />
          <CommandPalette />
          <Toaster
            theme="light"
            position="top-center"
            richColors
            toastOptions={{
              style: {
                background: "rgba(255,255,255,0.96)",
                border: "1px solid rgba(15,23,42,0.1)",
                color: "#0f172a",
                borderRadius: "0.75rem",
              },
            }}
          />
          <SiteGate>
            <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] bg-gradient-to-r from-accent-700 via-accent-400 to-accent-700 shadow-[0_0_18px_rgba(var(--accent-rgb),0.5)]" />
            <Sidebar />
            <main className="mx-auto max-w-[1600px] px-4 py-8 md:px-8 lg:mr-80 lg:pr-2">
              <Ticker />
              {children}
            </main>
            <footer className="clip-notch border-t border-gray-200 bg-white/70 py-6 text-center backdrop-blur">
              <div className="mb-3 flex items-center justify-center gap-3 text-accent-500">
                <span className="h-px w-16 bg-gradient-to-l from-accent-400/50 to-transparent" />
                <ShieldCheck size={16} />
                <span className="h-px w-16 bg-gradient-to-r from-accent-400/50 to-transparent" />
              </div>
              <span className="font-semibold text-gray-900">الأمن العام</span>
              <span className="mx-2 text-gray-400">—</span>
              <span className="text-xs text-gray-500">P S A · بوابة الأمن العام · خادم Dash Roleplay</span>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="v100-badge">V300</span>
              </div>
            </footer>
          </SiteGate>
        </StoreProvider>
      </body>
    </html>
  );
}
