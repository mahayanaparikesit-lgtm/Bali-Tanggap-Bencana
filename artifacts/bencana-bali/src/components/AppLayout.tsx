import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { ArrowLeft, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useColorTheme } from "@/hooks/use-theme";
import { BrandMark } from "@/components/brand/Brand";

// Kerangka halaman setelah login (pelapor, relawan, donatur) — redesign 2026.
// Admin memakai AdminLayout (sidebar). Props sengaja tidak berubah dari versi
// lama supaya semua halaman yang memakainya tetap jalan.
interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  role?: "pelapor" | "relawan" | "admin" | "donatur";
  actions?: ReactNode;
  showLogout?: boolean;
}

const roleLabels = {
  pelapor: "Pelapor",
  relawan: "Relawan",
  admin: "Admin",
  donatur: "Donatur",
};

export default function AppLayout({ children, title, subtitle, backHref, backLabel, role, actions, showLogout }: AppLayoutProps) {
  const { logout, user } = useAuth();
  const { isDark, toggle } = useColorTheme();

  const handleLogout = async () => {
    await logout();
    window.location.href = import.meta.env.BASE_URL || "/";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="shrink-0 hover:no-underline" aria-label="Beranda Bali-Rief">
            <BrandMark size={36} />
          </Link>
          {backHref && (
            <Link href={backHref} className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border-strong px-3 py-1.5 text-[13px] font-bold hover:border-foreground hover:no-underline sm:inline-flex">
              <ArrowLeft className="h-4 w-4" />
              {backLabel || "Kembali"}
            </Link>
          )}
          {backHref && (
            <Link href={backHref} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border-strong sm:hidden" aria-label={backLabel || "Kembali"}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-[16px] font-extrabold tracking-[-0.025em]">{title}</span>
            {subtitle && <span className="hidden truncate text-xs text-text2 sm:block">{subtitle}</span>}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            {role && (
              <span className="rounded-full bg-ink px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-marigold">
                {roleLabels[role]}
              </span>
            )}
            <button onClick={toggle} className="grid h-9 w-9 place-items-center rounded-full text-text2 hover:bg-muted hover:text-foreground" title={isDark ? "Mode terang" : "Mode gelap"} aria-label={isDark ? "Mode terang" : "Mode gelap"}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {(showLogout || user) && (
              <button onClick={handleLogout} title="Keluar" aria-label="Keluar" className="grid h-9 w-9 place-items-center rounded-full text-text2 hover:bg-muted hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}

export function NavTabs({ tabs }: { tabs: { href: string; label: string }[] }) {
  const [location] = useLocation();
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto rounded-full bg-muted p-1">
      {tabs.map(tab => (
        <Link key={tab.href} href={tab.href} className="hover:no-underline">
          <span className={cn(
            "block whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors",
            location === tab.href ? "bg-primary text-primary-foreground" : "text-text2 hover:text-foreground"
          )}>
            {tab.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
