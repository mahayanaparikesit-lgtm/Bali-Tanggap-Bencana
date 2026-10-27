import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useGetDashboardStatistik } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useColorTheme } from "@/hooks/use-theme";
import { TriangleIcon } from "@/components/icons/handoff-icons";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

// Shell sidebar khusus Konsol Admin, sesuai Dashboard Admin.dc.html — beda
// dari AppLayout (top-bar) yang dipakai peran lain. Item nav "Kelola" hanya
// berisi halaman yang benar-benar ada (tidak ada "Log aktivitas"/"Pengguna &
// peran" di mockup karena belum ada backend-nya).
function NavLink({ href, label, count, active }: { href: string; label: string; count?: string | number; active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-[11px] py-2.5 text-[13.5px] font-semibold hover:no-underline",
        active ? "bg-primary-soft text-foreground" : "text-text2 hover:bg-surface-2 hover:text-foreground",
      )}
    >
      {active && <span className="h-4 w-[5px] rounded-[3px] bg-primary" />}
      {label}
      <div className="flex-1" />
      {count != null && (
        <span
          className={cn(
            "rounded-[5px] px-1.5 py-0.5 font-mono text-xs font-semibold",
            active ? "bg-primary text-primary-foreground" : "text-text3",
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

export default function AdminLayout({ children, activePage = "antrian" }: { children: ReactNode; activePage?: "antrian" | "laporan" | "relawan" | "inventaris" | "penugasan" | "donasi" }) {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useColorTheme();
  const [, navigate] = useLocation();
  const { data: stats } = useGetDashboardStatistik();

  const initials = user?.nama?.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase() ?? "—";
  const antrianCount = (stats?.laporan_menunggu ?? 0) + (stats?.relawan_menunggu ?? 0) + (stats?.stok_kritis ?? 0);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <header className="sticky top-0 z-30 flex items-center gap-5 border-b border-border bg-surface px-[22px] py-2.5">
        <span className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-primary">
            <TriangleIcon size={13} className="text-primary-foreground" />
          </span>
          <b className="text-[15px] font-extrabold tracking-[-0.01em]">Bali-Rief</b>
          <span className="border-l border-border pl-2.5 text-xs font-bold text-text3">Konsol Admin · Pusdalops</span>
        </span>
        <div className="flex-1" />
        <button
          onClick={toggle}
          className="rounded-md border border-border-strong px-3 py-[7px] text-[12.5px] font-bold text-text2 hover:border-text2 hover:text-foreground"
        >
          {isDark ? <Sun size={12} className="mr-1.5 inline align-[-2px]" /> : <Moon size={12} className="mr-1.5 inline align-[-2px]" />}
          {isDark ? "Mode terang" : "Mode gelap"}
        </button>
        <span className="flex items-center gap-2.5 border-l border-border pl-1.5">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-border bg-surface-2 text-xs font-extrabold text-text2">
            {initials}
          </span>
          <span className="hidden flex-col leading-[1.2] sm:flex">
            <b className="text-[13px] font-bold">{user?.nama ?? "Admin"}</b>
            <span className="text-[11.5px] text-text3">Admin verifikator</span>
          </span>
          <button onClick={handleLogout} className="ml-1 rounded-md px-2 py-1 text-xs font-bold text-text2 hover:bg-surface-2 hover:text-foreground">
            Keluar
          </button>
        </span>
      </header>

      <div className="grid flex-1 grid-cols-[214px_1fr] items-start">
        <nav className="sticky top-[51px] flex min-h-[calc(100vh-51px)] flex-col gap-[3px] border-r border-border bg-surface p-3">
          <span className="px-2.5 pb-2 pt-1.5 text-[11px] font-extrabold uppercase tracking-[0.07em] text-text3">Pekerjaan</span>
          <NavLink href="/admin" label="Antrian kerja" count={antrianCount} active={activePage === "antrian"} />
          <span className="px-2.5 pb-2 pt-[18px] text-[11px] font-extrabold uppercase tracking-[0.07em] text-text3">Kelola</span>
          <NavLink href="/admin/laporan" label="Semua laporan" count={stats?.total_laporan} active={activePage === "laporan"} />
          <NavLink href="/admin/relawan" label="Relawan" count={stats?.total_relawan} active={activePage === "relawan"} />
          <NavLink href="/admin/inventaris" label="Logistik & stok" count={stats?.stok_kritis} active={activePage === "inventaris"} />
          <NavLink href="/admin/penugasan" label="Penugasan" count={stats?.penugasan_aktif} active={activePage === "penugasan"} />
          <NavLink href="/admin/donasi" label="Donasi" active={activePage === "donasi"} />
          <a href="/transparansi" className="flex items-center gap-2.5 rounded-lg px-[11px] py-2.5 text-[13.5px] font-semibold text-text2 hover:bg-surface-2 hover:text-foreground hover:no-underline">
            Transparansi publik
          </a>
        </nav>

        <main className="flex min-w-0 flex-col gap-[18px] px-[26px] py-[22px] pb-[60px]">{children}</main>
      </div>
    </div>
  );
}
