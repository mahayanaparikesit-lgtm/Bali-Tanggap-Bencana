import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useColorTheme } from "@/hooks/use-theme";
import { StatusBadge } from "@/components/StatusBadge";
import { ReportDetailOverlay } from "@/components/ReportDetailOverlay";
import { DisasterMap } from "@/components/DisasterMap";
import { TriangleIcon } from "@/components/icons/handoff-icons";
import { MapPin, ShieldCheck, Sun, Moon, TriangleAlert, LayoutDashboard, HeartHandshake, HandCoins, Info } from "lucide-react";
import { formatRupiah, formatRupiahRingkas, formatWaktu, JENIS_LABELS } from "@/lib/format";

const BASE = import.meta.env.VITE_API_URL.replace(/\/$/, "");

async function fetchJson(path: string) {
  const res = await fetch(`${BASE}${path}`);
  return res.json();
}

function StatTile({ value, label }: { value: string; label: string }) {
  const lines = label.split("\n");
  return (
    <div className="flex min-w-[132px] flex-col gap-[5px] rounded-[10px] border border-border bg-surface px-[18px] py-[14px]">
      <b className="font-mono text-[26px] font-semibold leading-none tracking-[-0.02em]">{value}</b>
      <span className="text-[12.5px] font-semibold leading-[1.3] text-text2">
        {lines.map((line, i) => (
          <span key={i} className="block">{line}</span>
        ))}
      </span>
    </div>
  );
}

function ReportCard({ laporan, onOpen }: { laporan: any; onOpen: () => void }) {
  const kebutuhanList: any[] = laporan.kebutuhan ?? [];
  const butuh = kebutuhanList.length > 0
    ? kebutuhanList.slice(0, 3).map(k => k.nama_item).join(", ")
    : "—";
  const relawanCount = laporan.relawan_bertugas?.length ?? 0;
  const foto = (laporan.foto_urls ?? [])[0];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && onOpen()}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-[10px] border border-border bg-surface transition-colors hover:border-primary"
    >
      <div className="relative aspect-[4/3] border-b border-border" style={!foto ? { background: "repeating-linear-gradient(135deg, var(--muted) 0 10px, var(--background) 10px 20px)" } : undefined}>
        {foto ? (
          <img src={foto} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <span className="font-mono text-[11.5px] leading-[1.5] tracking-[0.04em] text-text3">
              FOTO DOKUMENTASI<br />{JENIS_LABELS[laporan.jenis_bencana] ?? laporan.jenis_bencana}, {laporan.lokasi}
            </span>
          </div>
        )}
        <div className="absolute left-4 top-4">
          <StatusBadge status={laporan.status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-[11px] px-5 pb-[18px] pt-5">
        <span className="flex items-center gap-2 text-[13.5px] text-text2">
          <MapPin size={13} className="shrink-0 text-primary" />
          {laporan.lokasi}
        </span>
        <h3 className="text-xl font-extrabold leading-[1.2] tracking-[-0.015em]">
          {JENIS_LABELS[laporan.jenis_bencana] ?? laporan.jenis_bencana}
        </h3>
        <span className="font-mono text-[12.5px] text-text3">{formatWaktu(laporan.created_at)}</span>
        <div className="flex flex-col gap-1.5 border-t border-border pt-3.5">
          <span className="text-sm leading-[1.45] text-text2">
            <b className="font-bold text-foreground">Butuh:</b> {butuh}
          </span>
          <span className="font-mono text-[13.5px] text-foreground">
            {laporan.target_dana ? `Estimasi ${formatRupiah(laporan.target_dana)}` : "Estimasi belum dihitung"}
          </span>
        </div>
        <div className="flex-1" />
        <div className="mt-3.5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <span className="text-sm text-text2">
            <b className="font-mono font-semibold text-foreground">{relawanCount}</b> relawan bertugas
          </span>
          <div className="flex-1" />
          <span className="whitespace-nowrap text-sm font-bold text-primary">Lihat Detail</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { isDark, toggle } = useColorTheme();
  const [openId, setOpenId] = useState<number | null>(null);

  const { data: aktifList } = useQuery({ queryKey: ["laporan-aktif"], queryFn: () => fetchJson("/api/laporan/aktif") });
  const { data: statistik } = useQuery({ queryKey: ["dashboard-statistik"], queryFn: () => fetchJson("/api/dashboard/statistik") });
  const { data: transparansiList } = useQuery({ queryKey: ["transparansi-laporan"], queryFn: () => fetchJson("/api/transparansi/laporan") });

  const laporanAktif = aktifList?.length ?? null;
  const relawanBertugas = statistik?.penugasan_aktif ?? null;

  const list: any[] = transparansiList ?? [];
  const totalDana = list.reduce((s, l) =>
    s + (l.donasi ?? []).filter((d: any) => d.jenis === "dana").reduce((x: number, d: any) => x + (d.jumlah_dana || 0), 0), 0);
  const totalDonasi = list.reduce((s, l) => s + (l.donasi?.length ?? 0), 0);
  const kebutuhanMendesak = list.reduce((s, l) =>
    s + (l.kebutuhan ?? []).filter((k: any) => k.jumlah_terpenuhi < k.jumlah_dibutuhkan).length, 0);

  const terbaru = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);

  const dashboardHref = user
    ? user.role === "admin" ? "/admin" : user.role === "relawan" ? "/relawan" : user.role === "pelapor" ? "/pelapor" : "/donatur"
    : null;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Utility strip */}
      <div className="border-b border-border bg-surface-2 text-[12.5px] text-text2">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-4 px-6 py-[7px]">
          <span className="flex items-center gap-[7px] font-semibold text-foreground">
            <ShieldCheck size={13} />
            Layanan koordinasi bencana · Provinsi Bali
          </span>
          <span className="text-border-strong">|</span>
          <span>Darurat 24 jam: <b className="font-mono text-foreground">112</b> (bebas pulsa)</span>
          <span className="hidden text-border-strong sm:inline">|</span>
          <span className="hidden sm:inline">Pusdalops BPBD Bali: <b className="font-mono text-foreground">(0361) 251177</b></span>
          <div className="flex-1" />
          <button
            onClick={toggle}
            className="flex items-center gap-[7px] rounded-full border border-border-strong bg-transparent px-[11px] py-1 text-xs font-semibold text-text2 hover:border-text2 hover:text-foreground"
          >
            {isDark ? <Sun size={12} /> : <Moon size={12} />}
            {isDark ? "Mode terang" : "Mode gelap"}
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[1180px] items-center gap-8 px-6 py-3.5">
          <a href="#" className="flex items-center gap-[11px] text-foreground">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-primary">
              <TriangleIcon size={15} className="text-primary-foreground" />
            </span>
            <span className="flex flex-col leading-[1.15]">
              <b className="text-[17px] font-extrabold tracking-[-0.015em]">Bali-Rief</b>
              <span className="text-[11.5px] font-medium text-text3">Koordinasi Bencana Bali</span>
            </span>
          </a>
          <nav className="hidden items-center gap-[26px] text-sm font-semibold md:flex">
            <a href="#laporan" className="text-text2 hover:text-foreground hover:no-underline">Laporan Aktif</a>
            <a href="#peta" className="text-text2 hover:text-foreground hover:no-underline">Peta Lokasi</a>
            <a href="#transparansi" className="text-text2 hover:text-foreground hover:no-underline">Transparansi</a>
            <a href="#alur" className="text-text2 hover:text-foreground hover:no-underline">Cara Kerja</a>
            <span className="text-text3">Panduan Bencana</span>
          </nav>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {user ? (
              <Link href={dashboardHref!} className="flex items-center gap-[9px] rounded-lg bg-primary px-5 py-[11px] text-sm font-bold text-primary-foreground hover:bg-primary-hover hover:no-underline">
                Buka Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="px-3.5 py-[9px] text-sm font-semibold text-text2 hover:text-foreground hover:no-underline">Masuk</Link>
                <Link href="/lapor" className="flex items-center gap-[9px] rounded-lg bg-primary px-5 py-[11px] text-sm font-bold text-primary-foreground hover:bg-primary-hover hover:no-underline">
                  <TriangleAlert size={14} />
                  Lapor Bencana
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-[1180px] grid-cols-1 items-start gap-12 px-6 py-11 md:grid-cols-[1.05fr_0.95fr] md:gap-16 md:py-14">
        <div className="flex flex-col gap-[26px]">
          <span className="inline-flex items-center self-start rounded-full border border-border bg-surface-2 px-[13px] py-1.5 text-xs font-bold uppercase tracking-[0.06em] text-text2">
            Platform resmi koordinasi warga · relawan · donasi
          </span>
          <h1 className="max-w-[15ch] text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] md:text-[52px]">
            Satu alur untuk bencana di Bali.
          </h1>
          <p className="max-w-[46ch] text-lg leading-[1.5] text-text2 md:text-[19px]">
            Warga melapor dari lokasi kejadian, petugas memverifikasi, relawan ditugaskan, dan setiap rupiah bantuan tercatat terbuka untuk publik.
          </p>
          <div className="flex flex-wrap gap-3.5 pt-0.5">
            <StatTile value={laporanAktif != null ? String(laporanAktif) : "—"} label={"Laporan aktif\nditangani"} />
            <StatTile value={relawanBertugas != null ? String(relawanBertugas) : "—"} label={"Relawan\nbertugas"} />
            <StatTile value={formatRupiahRingkas(totalDana)} label={"Bantuan tercatat\n& terverifikasi"} />
          </div>
          <p className="max-w-[48ch] text-[13px] leading-[1.5] text-text3">
            Data diperbarui langsung dari Pusdalops. Dalam keadaan mengancam nyawa, hubungi <b className="font-mono text-text2">112</b> lebih dahulu — laporan di sini melengkapi, bukan menggantikan panggilan darurat.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <span className="pb-0.5 text-xs font-bold uppercase tracking-[0.06em] text-text3">Pilih jalur Anda</span>

          {user ? (
            <Link
              href={dashboardHref!}
              className="flex items-center gap-[18px] rounded-xl border border-primary bg-primary px-[22px] py-5 text-primary-foreground hover:bg-primary-hover hover:no-underline"
            >
              <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] bg-white/18">
                <LayoutDashboard size={20} />
              </span>
              <span className="flex flex-1 flex-col gap-1">
                <b className="text-[19px] font-extrabold tracking-[-0.01em]">Buka Dashboard {user.nama}</b>
                <span className="text-sm leading-[1.4] opacity-90">Lanjutkan sebagai {user.role} — akses semua fitur peran Anda.</span>
              </span>
              <span className="text-2xl opacity-80">›</span>
            </Link>
          ) : (
            <>
              <Link href="/lapor" className="flex items-center gap-[18px] rounded-xl border border-primary bg-primary px-[22px] py-5 text-primary-foreground hover:bg-primary-hover hover:no-underline">
                <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] bg-white/18">
                  <TriangleAlert size={20} />
                </span>
                <span className="flex flex-1 flex-col gap-1">
                  <b className="text-[19px] font-extrabold tracking-[-0.01em]">Lapor Bencana</b>
                  <span className="text-sm leading-[1.4] opacity-90">Tanpa perlu akun — kirim titik lokasi, foto, dan kondisi lapangan sekarang.</span>
                </span>
                <span className="text-2xl opacity-80">›</span>
              </Link>

              <Link href="/register" className="flex items-center gap-[18px] rounded-xl border border-border-strong bg-surface px-[22px] py-5 text-foreground hover:border-primary hover:no-underline">
                <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-accent-ink">
                  <HeartHandshake size={19} />
                </span>
                <span className="flex flex-1 flex-col gap-1">
                  <b className="text-[19px] font-extrabold tracking-[-0.01em]">Daftar Relawan</b>
                  <span className="text-sm leading-[1.4] text-text2">Isi keahlian dan wilayah kesiapan. Verifikasi 1×24 jam oleh koordinator.</span>
                </span>
                <span className="text-2xl text-text3">›</span>
              </Link>

              <a href="#transparansi" className="flex items-center gap-[18px] rounded-xl border border-border-strong bg-surface px-[22px] py-5 text-foreground hover:border-primary hover:no-underline">
                <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] bg-surface-2">
                  <HandCoins size={19} />
                </span>
                <span className="flex flex-1 flex-col gap-1">
                  <b className="text-[19px] font-extrabold tracking-[-0.01em]">Donasi &amp; Transparansi</b>
                  <span className="text-sm leading-[1.4] text-text2">Lihat kebutuhan mendesak dan rincian dana masuk sebelum berdonasi.</span>
                </span>
                <span className="text-2xl text-text3">›</span>
              </a>

              <div className="mt-1 flex items-start gap-2.5 rounded-[10px] border border-border bg-surface-2 px-[15px] py-[13px]">
                <Info size={14} className="mt-[3px] shrink-0 text-text3" />
                <span className="text-[13px] leading-[1.45] text-text2">
                  Belum punya akun? Laporan darurat bisa langsung dikirim tanpa mendaftar. Donasi dan daftar relawan tetap perlu akun singkat — verifikasi biasanya kurang dari 1×24 jam.
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Laporan masuk */}
      <section id="laporan" className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-[22px] px-6 py-11">
          <div className="flex flex-wrap items-end gap-5">
            <div className="flex flex-col gap-[7px]">
              <h2 className="text-2xl font-extrabold tracking-[-0.02em] md:text-[26px]">Laporan masuk</h2>
              <p className="text-[14.5px] text-text2">Semua laporan terbuka untuk publik, termasuk yang ditolak beserta alasannya.</p>
            </div>
            <div className="flex-1" />
            <Link href="/transparansi" className="text-sm font-bold hover:no-underline">
              Lihat semua {list.length} laporan →
            </Link>
          </div>
          {terbaru.length === 0 ? (
            <div className="py-16 text-center text-text2">Belum ada laporan tercatat.</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {terbaru.map(l => (
                <ReportCard key={l.id} laporan={l} onOpen={() => setOpenId(l.id)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Peta sebaran bencana */}
      <section id="peta" className="border-t border-border">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-[22px] px-6 py-11">
          <div className="flex flex-col gap-[7px]">
            <h2 className="text-2xl font-extrabold tracking-[-0.02em] md:text-[26px]">Peta Sebaran Bencana</h2>
            <p className="text-[14.5px] text-text2">
              Titik lokasi laporan terverifikasi di seluruh Bali. Klik pin untuk melihat ringkasan laporan.
            </p>
          </div>
          <DisasterMap laporan={list} onSelect={setOpenId} />
        </div>
      </section>

      {/* Cara kerjanya */}
      <section id="alur" className="border-t border-border">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-[26px] px-6 py-12">
          <h2 className="text-2xl font-extrabold tracking-[-0.02em] md:text-[26px]">Cara kerjanya</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-2.5 border-t-[3px] border-primary pt-4">
              <span className="font-mono text-[12.5px] font-semibold text-text3">01 · &lt;2 menit</span>
              <b className="text-[17px] font-extrabold">Warga melapor</b>
              <p className="text-[14.5px] leading-[1.5] text-text2">Titik lokasi, foto, dan tingkat kegentingan dikirim dari lapangan.</p>
            </div>
            <div className="flex flex-col gap-2.5 border-t-[3px] border-accent pt-4">
              <span className="font-mono text-[12.5px] font-semibold text-text3">02 · &lt;15 menit</span>
              <b className="text-[17px] font-extrabold">Petugas memverifikasi</b>
              <p className="text-[14.5px] leading-[1.5] text-text2">Admin Pusdalops memeriksa, menggabungkan laporan duplikat, dan menetapkan prioritas.</p>
            </div>
            <div className="flex flex-col gap-2.5 border-t-[3px] border-border-strong pt-4">
              <span className="font-mono text-[12.5px] font-semibold text-text3">03</span>
              <b className="text-[17px] font-extrabold">Relawan ditugaskan</b>
              <p className="text-[14.5px] leading-[1.5] text-text2">Penugasan dikirim ke relawan sesuai keahlian, dengan pembaruan status berkala.</p>
            </div>
            <div className="flex flex-col gap-2.5 border-t-[3px] border-border-strong pt-4">
              <span className="font-mono text-[12.5px] font-semibold text-text3">04</span>
              <b className="text-[17px] font-extrabold">Bantuan dicatat terbuka</b>
              <p className="text-[14.5px] leading-[1.5] text-text2">Setiap penerimaan dan penyaluran dana serta logistik muncul di halaman transparansi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Transparansi teaser */}
      <section id="transparansi" className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-10 px-6 py-12 md:grid-cols-[0.9fr_1.1fr] md:gap-14">
          <div className="flex flex-col gap-[18px]">
            <h2 className="text-[26px] font-extrabold leading-[1.15] tracking-[-0.025em] md:text-[30px]">
              Uangnya ke mana? Bisa Anda periksa sendiri.
            </h2>
            <p className="text-base leading-[1.55] text-text2 md:text-[16px]">
              Tidak ada angka yang disembunyikan: kas masuk, penyaluran per laporan, sampai daftar donatur. Semua bisa dilihat publik tanpa login.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/transparansi" className="rounded-[9px] bg-primary px-[22px] py-[13px] text-[15px] font-bold text-primary-foreground hover:bg-primary-hover hover:no-underline">
                Buka Halaman Transparansi
              </Link>
              <a href="#" className="rounded-[9px] border border-border-strong px-[22px] py-[13px] text-[15px] font-bold text-foreground hover:border-primary hover:no-underline">
                Unduh laporan bulanan (PDF)
              </a>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 bg-surface p-[22px]">
              <span className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-text3">Dana masuk</span>
              <b className="font-mono text-[28px] font-semibold tracking-[-0.02em]">{formatRupiahRingkas(totalDana)}</b>
              <span className="text-[13px] text-text2">dari {totalDonasi} donasi tercatat</span>
            </div>
            <div className="flex flex-col gap-1.5 bg-surface p-[22px]">
              <span className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-text3">Laporan tercatat</span>
              <b className="font-mono text-[28px] font-semibold tracking-[-0.02em] text-primary">{list.length}</b>
              <span className="text-[13px] text-text2">{laporanAktif ?? 0} masih aktif ditangani</span>
            </div>
            <div className="flex flex-col gap-1.5 bg-surface p-[22px]">
              <span className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-text3">Relawan bertugas</span>
              <b className="font-mono text-[28px] font-semibold tracking-[-0.02em]">{relawanBertugas ?? 0}</b>
              <span className="text-[13px] text-text2">penugasan aktif saat ini</span>
            </div>
            <div className="flex flex-col gap-1.5 bg-surface p-[22px]">
              <span className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-text3">Kebutuhan mendesak</span>
              <b className="font-mono text-[28px] font-semibold tracking-[-0.02em] text-accent-ink">{kebutuhanMendesak} item</b>
              <span className="text-[13px] text-text2">belum terpenuhi seluruhnya</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-10 px-6 pb-5 pt-11 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <span className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <TriangleIcon size={13} className="text-primary-foreground" />
              </span>
              <b className="text-base font-extrabold">Bali-Rief</b>
            </span>
            <p className="max-w-[34ch] text-[13.5px] leading-[1.55] text-text2">
              Sistem koordinasi bencana untuk warga, relawan, dan donatur di Provinsi Bali. Dikelola bersama Pusdalops BPBD dan jaringan relawan desa.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 text-[13.5px]">
            <b className="text-xs font-bold uppercase tracking-[0.06em] text-text3">Nomor darurat</b>
            <span className="text-text2">Darurat nasional <b className="font-mono text-foreground">112</b></span>
            <span className="text-text2">Pusdalops BPBD <b className="font-mono text-foreground">(0361) 251177</b></span>
            <span className="text-text2">SAR Denpasar <b className="font-mono text-foreground">115</b></span>
          </div>
          <div className="flex flex-col gap-2.5 text-[13.5px]">
            <b className="text-xs font-bold uppercase tracking-[0.06em] text-text3">Layanan</b>
            <Link href="/lapor" className="text-text2 hover:text-foreground hover:no-underline">Lapor bencana</Link>
            <Link href="/register" className="text-text2 hover:text-foreground hover:no-underline">Daftar relawan</Link>
            <Link href="/transparansi" className="text-text2 hover:text-foreground hover:no-underline">Donasi &amp; transparansi</Link>
          </div>
          <div className="flex flex-col gap-2.5 text-[13.5px]">
            <b className="text-xs font-bold uppercase tracking-[0.06em] text-text3">Informasi</b>
            <a href="#alur" className="text-text2 hover:text-foreground hover:no-underline">Cara kerja</a>
            <Link href="/login" className="text-text2 hover:text-foreground hover:no-underline">Masuk Staf/Admin</Link>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1180px] flex-wrap gap-5 border-t border-border px-6 pb-10 pt-4 text-[12.5px] text-text3">
          <span>© 2026 Bali-Rief · Koordinasi Bencana Bali</span>
          <div className="flex-1" />
          <span className="font-mono">Data laporan diperbarui langsung dari server</span>
        </div>
      </footer>

      {openId != null && <ReportDetailOverlay id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
