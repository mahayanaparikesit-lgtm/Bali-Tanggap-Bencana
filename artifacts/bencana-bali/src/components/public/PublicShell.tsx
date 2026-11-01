import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Menu, Moon, Sun, TriangleAlert, X, HandHeart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useColorTheme } from "@/hooks/use-theme";
import { Brand, BrandMark } from "@/components/brand/Brand";
import { cn } from "@/lib/utils";

// Kerangka halaman publik (Beranda, Transparansi, Lapor) — redesign 2026.
// Satu sumber untuk strip darurat, header, dan footer supaya tiap halaman
// publik tidak menyalin ulang markup-nya.

export function dashboardHref(role: string) {
  return role === "admin" ? "/admin" : role === "relawan" ? "/relawan" : role === "pelapor" ? "/pelapor" : "/donatur";
}

const NAV = [
  { href: "/#laporan", label: "Kejadian" },
  { href: "/#peta", label: "Peta" },
  { href: "/transparansi", label: "Transparansi" },
  { href: "/#alur", label: "Cara kerja" },
  { href: "/#faq", label: "Tanya jawab" },
];

export function UtilityStrip({ info }: { info?: ReactNode }) {
  const { isDark, toggle } = useColorTheme();
  return (
    <div className="bg-ink text-[12.5px] text-on-ink">
      <div className="mx-auto flex h-10 max-w-[1240px] items-center gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          {info ?? <span className="truncate">Layanan koordinasi bencana · Provinsi Bali</span>}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-[18px] font-mono">
          <span>Darurat <b className="text-white">112</b></span>
          <span className="hidden sm:inline">Pusdalops <b className="text-white">(0361) 251177</b></span>
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 font-sans font-semibold text-on-ink-2 hover:text-white"
            aria-label={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
          >
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
            <span className="hidden md:inline">{isDark ? "Terang" : "Gelap"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function PublicHeader() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={cn("sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md transition-colors", scrolled || open ? "border-border" : "border-transparent")}>
      <div className="mx-auto flex h-[72px] max-w-[1240px] items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="hover:no-underline" onClick={() => setOpen(false)}>
          <Brand />
        </Link>
        <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
          {NAV.map(n => (
            <a key={n.href} href={n.href} className="rounded-full px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted hover:no-underline">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <Link href={dashboardHref(user.role)} className="hidden rounded-full bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground hover:bg-primary-hover hover:no-underline sm:inline-flex">
              Dashboard {user.nama.split(" ")[0]}
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden px-2.5 py-2 text-sm font-bold hover:no-underline sm:inline">Masuk</Link>
              <Link href="/donatur" className="hidden items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground hover:bg-primary-hover hover:no-underline md:inline-flex">
                <HandHeart size={16} />Donasi
              </Link>
            </>
          )}
          <Link href="/lapor" className="inline-flex items-center gap-1.5 rounded-full bg-urgent px-4 py-2.5 text-[13px] font-bold text-urgent-foreground hover:bg-urgent-hover hover:no-underline" aria-label="Lapor bencana">
            <TriangleAlert size={16} /><span className="hidden sm:inline">Lapor Bencana</span><span className="sm:hidden">Lapor</span>
          </Link>
          <button
            className="grid h-[42px] w-[42px] place-items-center rounded-full border border-border-strong lg:hidden"
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            aria-label="Menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-border bg-background px-4 pb-5 pt-2 lg:hidden" aria-label="Navigasi seluler">
          {NAV.map(n => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="block border-b border-border py-3.5 text-[15px] font-bold hover:no-underline">
              {n.label}
            </a>
          ))}
          <div className="mt-4 flex gap-2">
            {user ? (
              <Link href={dashboardHref(user.role)} className="flex-1 rounded-full bg-primary py-3 text-center text-sm font-bold text-primary-foreground hover:no-underline">Buka dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="flex-1 rounded-full border border-border-strong py-3 text-center text-sm font-bold hover:no-underline">Masuk</Link>
                <Link href="/donatur" className="flex-1 rounded-full bg-primary py-3 text-center text-sm font-bold text-primary-foreground hover:no-underline">Donasi</Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-24 bg-ink pb-8 pt-16 text-on-ink dark:border-t dark:border-ink-line">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-8 border-b border-ink-line pb-10">
          <h2 className="max-w-[640px] text-[clamp(34px,5vw,64px)] font-extrabold leading-[0.95] tracking-[-0.05em] text-white">
            Dalam bahaya? <span className="text-marigold">Telepon 112</span> dulu.
          </h2>
          <div className="flex flex-wrap gap-3.5">
            {[["Darurat nasional", "112", true], ["Pusdalops BPBD Bali", "(0361) 251177", false], ["Basarnas", "115", false]].map(([k, v, red]) => (
              <div key={String(k)} className="min-w-[170px] rounded-[18px] border border-ink-line px-[18px] py-3.5">
                <small className="block text-xs text-on-ink-2">{k}</small>
                <b className={cn("mt-1 block font-mono text-[26px] font-semibold tracking-[-0.02em]", red ? "text-[#FF7A6E]" : "text-white")}>{v}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <span className="flex items-center gap-2.5">
              <BrandMark />
              <span className="flex flex-col leading-none">
                <b className="text-[19px] font-extrabold tracking-[-0.03em] text-white">Bali-Rief</b>
                <small className="mt-[3px] text-[11px] font-semibold text-on-ink-2">Koordinasi bencana Bali</small>
              </span>
            </span>
            <p className="mt-3.5 max-w-[300px] text-sm">Satu alur untuk melapor, menyalurkan bantuan, dan melacak penanganan bencana di Provinsi Bali.</p>
          </div>
          <FooterCol title="Layanan" links={[["/lapor", "Lapor bencana"], ["/donatur", "Donasi"], ["/register", "Buat akun"], ["/login", "Masuk"]]} />
          <FooterCol title="Informasi" links={[["/transparansi", "Transparansi"], ["/#alur", "Cara kerja"], ["/#faq", "Tanya jawab"]]} />
          <FooterCol title="Petugas" links={[["/login", "Masuk relawan"], ["/login", "Masuk admin Pusdalops"]]} />
        </div>
        <div className="flex flex-wrap justify-between gap-4 border-t border-ink-line pt-5 font-mono text-[11.5px] text-on-ink-2">
          <span>© 2026 Bali-Rief</span>
          <span>Data diperbarui langsung dari laporan terverifikasi</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-on-ink-2">{title}</h4>
      {links.map(([href, label]) => (
        <a key={label} href={href} className="block py-1 text-sm hover:text-marigold hover:no-underline">{label}</a>
      ))}
    </div>
  );
}

// Bar aksi menempel di bawah layar ponsel — dua jalur utama selalu terjangkau jempol.
export function MobileActionBar() {
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 flex gap-2 rounded-[22px] border border-border bg-card p-2 shadow-lg sm:hidden">
      <Link href="/lapor" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-urgent py-3.5 text-sm font-bold text-urgent-foreground hover:no-underline">
        <TriangleAlert size={17} />Lapor
      </Link>
      <Link href="/donatur" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:no-underline">
        <HandHeart size={17} />Donasi
      </Link>
    </div>
  );
}
