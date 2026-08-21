import type { Metadata, Viewport } from "next";
import { Cairo, Tajawal, Space_Grotesk, Inter } from "next/font/google";
import { ShieldCheck } from "lucide-react";
import { StoreProvider } from "@/lib/store";
import { Sidebar } from "@/components/Sidebar";
import { Ticker } from "@/components/Ticker";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo" });
const tajawal = Tajawal({ subsets: ["arabic", "latin"], weight: ["400", "500", "700", "800"], variable: "--font-tajawal" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "الأمن العام | P S A",
  description: "البوابة الإدارية لقوات الأمن العام على خادم Dash Roleplay",
};

export const viewport: Viewport = {
  themeColor: "#080a10",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} ${cairo.variable} ${tajawal.variable} ${spaceGrotesk.variable}`}>
      <body>
        <StoreProvider>
          <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] bg-gradient-to-r from-accent-700 via-accent-400 to-accent-700 shadow-[0_0_18px_rgba(var(--accent-rgb),0.5)]" />
          <Sidebar />
          <main className="mx-auto max-w-[1600px] px-4 py-8 md:px-8 lg:mr-80 lg:pr-2">
            <Ticker />
            {children}
          </main>
          <footer className="clip-notch border-t border-white/10 bg-[#0b0f18]/80 py-6 text-center backdrop-blur">
            <div className="mb-3 flex items-center justify-center gap-3 text-accent-500">
              <span className="h-px w-16 bg-gradient-to-l from-accent-400/50 to-transparent" />
              <ShieldCheck size={16} />
              <span className="h-px w-16 bg-gradient-to-r from-accent-400/50 to-transparent" />
            </div>
            <span className="font-semibold text-slate-50">الأمن العام</span>
            <span className="mx-2 text-slate-500">—</span>
            <span className="text-xs text-slate-400">P S A · بوابة الأمن العام · خادم Dash Roleplay</span>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="v100-badge">V300</span>
            </div>
          </footer>
          <Toaster theme="dark" position="top-center" richColors />
        </StoreProvider>
      </body>
    </html>
  );
}

