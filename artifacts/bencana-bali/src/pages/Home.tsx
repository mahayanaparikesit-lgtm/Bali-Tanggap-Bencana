import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, ArrowUpRight, HandHeart, HardHat, MapPin, PhoneCall, Plus, Siren, Users, Package,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/StatusBadge";
import { ReportDetailOverlay } from "@/components/ReportDetailOverlay";
import { DisasterMap } from "@/components/DisasterMap";
import { FotoBencana } from "@/components/Ilustrasi";
import { Eyebrow, Seismo } from "@/components/brand/Brand";
import { MobileActionBar, PublicFooter, PublicHeader, UtilityStrip, dashboardHref } from "@/components/public/PublicShell";
import { formatRupiahRingkas, formatWaktu, JENIS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.VITE_API_URL.replace(/\/$/, "");

// Laporan yang baru disetujui admin muncul di peta & daftar tanpa muat ulang manual.
const SEGAR = { refetchInterval: 60_000, refetchOnWindowFocus: true } as const;

async function fetchJson(path: string) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Progres kebutuhan per laporan = rata-rata persentase tiap item (satuan antar
// item berbeda — liter, lembar, paket — jadi tidak bisa dijumlah langsung).
function progresKebutuhan(kebutuhan: any[]) {
  if (!kebutuhan?.length) return null;
  const pct = kebutuhan.map(k => Math.min(1, (k.jumlah_terpenuhi || 0) / Math.max(1, k.jumlah_dibutuhkan || 1)));
  return Math.round((pct.reduce((a, b) => a + b, 0) / pct.length) * 100);
}

function danaDiterima(l: any) {
  return (l.donasi ?? []).filter((d: any) => d.jenis === "dana").reduce((x: number, d: any) => x + (d.jumlah_dana || 0), 0);
}

function KartuLaporan({ l, onOpen }: { l: any; onOpen: () => void }) {
  const foto = (l.foto_urls ?? [])[0];
  const pk = progresKebutuhan(l.kebutuhan);
  const belum = (l.kebutuhan ?? []).filter((k: any) => k.jumlah_terpenuhi < k.jumlah_dibutuhkan);
  const selesai = l.status === "selesai";
  const tgl = new Date(l.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-shadow hover:shadow-[0_18px_40px_-26px_rgba(28,40,22,.5)]">
      <button onClick={onOpen} className="relative block aspect-[16/10] overflow-hidden text-left" aria-label={`Lihat detail ${l.judul}`}>
        {foto ? <img src={foto} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
          : <FotoBencana jenis={l.jenis_bencana} label={false} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" />}
        {selesai && <span className="absolute right-3 top-3 rounded-full bg-card/95 px-2.5 py-1 text-xs font-bold text-status-done-fg">Selesai</span>}
      </button>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text2">
          <span className="font-semibold text-foreground">{JENIS_LABELS[l.jenis_bencana] ?? l.jenis_bencana}</span>
          <span>·</span><span>{tgl}</span>{!foto && <><span>·</span><span>foto ilustrasi</span></>}
        </div>
        <h3 className="mt-2 line-clamp-2 min-h-[2.3em] text-[20px] font-extrabold leading-[1.15] tracking-[-0.035em]">{l.judul}</h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-text2"><MapPin size={14} className="shrink-0" /><span className="truncate">{l.lokasi}</span></p>

        <div className="mt-5 rounded-2xl bg-muted/60 p-3.5">
          {pk == null ? (
            <p className="text-[13px] text-text2">Kebutuhan sedang dicatat relawan di lokasi.</p>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-text2">Kebutuhan terpenuhi</span>
                <b className="font-mono text-[15px] font-semibold">{pk}%</b>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-card"><i className="block h-full rounded-full bg-primary" style={{ width: `${pk}%` }} /></div>
            </>
          )}
          <div className="mt-3 flex gap-4 text-[12.5px] text-text2">
            {l.jumlah_terdampak ? <span className="flex items-center gap-1.5"><Users size={14} />{Number(l.jumlah_terdampak).toLocaleString("id-ID")} jiwa</span> : null}
            <span className="flex items-center gap-1.5"><HardHat size={14} />{l.relawan_bertugas?.length ?? 0} relawan</span>
          </div>
        </div>

        <div className="mt-3 flex min-h-[28px] flex-wrap gap-1.5">
          {belum.slice(0, 2).map((k: any) => <span key={k.id} className="rounded-full border border-border px-2.5 py-1 text-[12px] font-semibold">{k.nama_item}</span>)}
          {belum.length > 2 && <span className="rounded-full px-1.5 py-1 text-[12px] font-semibold text-text2">+{belum.length - 2} lagi</span>}
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <button onClick={onOpen} className="rounded-full border-[1.5px] border-border-strong py-2.5 text-[13px] font-bold hover:border-foreground">Detail</button>
          {selesai
            ? <span className="grid place-items-center rounded-full bg-muted py-2.5 text-[13px] font-bold text-text2">Sudah tertangani</span>
            : <Link href="/donatur" className="flex items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-[13px] font-bold text-primary-foreground hover:bg-primary-hover hover:no-underline"><HandHeart size={15} />Donasi</Link>}
        </div>
      </div>
    </article>
  );
}

const FAQ: [string, string][] = [
  ["Apakah saya harus punya akun untuk melapor?", "Tidak. Laporan darurat bisa dikirim tanpa akun — cukup nomor HP supaya petugas bisa menghubungi balik. Isian disimpan di perangkat selama mengisi, jadi tidak hilang bila sinyal putus."],
  ["Berapa lama laporan diverifikasi?", "Operator Pusdalops memeriksa setiap laporan, menggabungkan laporan ganda, lalu menetapkan prioritas. Laporan baru tampil di peta dan daftar publik setelah diverifikasi, untuk mencegah titik palsu."],
  ["Ke mana donasi saya disalurkan?", "Ke lokasi yang Anda pilih, untuk kebutuhan yang dicatat relawan di poskonya. Dana baru dihitung sebagai terkumpul setelah diterima dan dicek admin, dan semuanya tampil di halaman Transparansi."],
  ["Bisakah saya donasi barang, bukan uang?", "Bisa. Pilih barang dari daftar kebutuhan lokasi lewat akun donatur, lalu antar ke posko atau minta dijemput relawan."],
  ["Bagaimana cara menjadi relawan?", "Buat akun dengan peran Relawan, lalu lengkapi data diri, nomor HP, keahlian, dan foto KTP. Admin Pusdalops memverifikasi identitas Anda; setelah terverifikasi, penugasan akan muncul di dashboard relawan. Pertanyaan: hubungi Pusdalops di (0361) 251177."],
];

export default function Home() {
  const { user } = useAuth();
  const [openId, setOpenId] = useState<number | null>(null);
  const [filter, setFilter] = useState("semua");
  const [faqOpen, setFaqOpen] = useState(0);

  const { data: aktifList } = useQuery({ queryKey: ["laporan-aktif"], queryFn: () => fetchJson("/api/laporan/aktif"), ...SEGAR });
  const { data: statistik } = useQuery({ queryKey: ["dashboard-statistik"], queryFn: () => fetchJson("/api/dashboard/statistik"), ...SEGAR });
  const { data: transparansiList, isLoading } = useQuery({ queryKey: ["transparansi-laporan"], queryFn: () => fetchJson("/api/transparansi/laporan"), ...SEGAR });

  const list: any[] = transparansiList ?? [];
  const laporanAktif: number | null = aktifList ? aktifList.length : null;
  const relawanBertugas: number | null = statistik?.penugasan_aktif ?? null;
  const totalDana = list.reduce((s, l) => s + danaDiterima(l), 0);
  const totalDonasi = list.reduce((s, l) => s + (l.donasi?.length ?? 0), 0);
  const totalTarget = list.filter(l => l.status !== "selesai").reduce((s, l) => s + (l.target_dana || 0), 0);
  const danaAktif = list.filter(l => l.status !== "selesai").reduce((s, l) => s + danaDiterima(l), 0);
  const kebTotal: number | null = statistik?.kebutuhan_total ?? null;
  const kebPenuh: number | null = statistik?.kebutuhan_terpenuhi ?? null;
  const terbaru = aktifList?.[0];

  const urut = useMemo(() => [...list].sort((a, b) => {
    if ((a.status === "selesai") !== (b.status === "selesai")) return a.status === "selesai" ? 1 : -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }), [list]);
  const jenisAda = useMemo(() => [...new Set(list.map(l => l.jenis_bencana))], [list]);
  const tampil = urut.filter(l => filter === "semua" || l.jenis_bencana === filter).slice(0, 6);

  const strip = laporanAktif ? (
    <>
      <b className="shrink-0 rounded-[5px] bg-urgent px-2 py-0.5 font-mono text-[10.5px] tracking-[0.12em] text-white">AKTIF</b>
      <span className="truncate">{laporanAktif} kejadian sedang ditangani{terbaru ? ` · terbaru: ${terbaru.judul}, ${terbaru.lokasi}` : ""}</span>
      <a href="#laporan" className="hidden shrink-0 font-bold text-marigold hover:no-underline sm:inline">Lihat →</a>
    </>
  ) : undefined;

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground sm:pb-0">
      <UtilityStrip info={strip} />
      <PublicHeader />

      <main>
        {/* ---------- HERO ---------- */}
        <div className="mx-auto max-w-[1240px] px-4 pt-3.5 sm:px-6">
          <div className="relative h-[640px] overflow-hidden rounded-[26px] bg-[#FED07A] text-white sm:h-[clamp(500px,74vh,640px)] sm:rounded-[34px]">
            <img src={`${import.meta.env.BASE_URL}hero-bali.jpg`} alt="Ilustrasi pura di tepi danau Bali saat matahari terbenam" className="absolute inset-0 h-full w-full object-cover object-[68%_center]" fetchPriority="high" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(28,40,22,0)_48%,rgba(28,40,22,.62)_100%)]" />

            <div className="absolute left-4 right-4 top-4 flex items-center gap-2.5 self-start rounded-full border border-white/20 bg-ink/60 py-2 pl-2.5 pr-3.5 text-[13px] font-semibold sm:left-[22px] sm:right-auto sm:top-[22px]">
              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", laporanAktif ? "bg-urgent shadow-[0_0_0_4px_rgba(210,38,28,.3)]" : "bg-status-done-fg")} />
              {laporanAktif == null ? "Memuat status…" : laporanAktif ? `${laporanAktif} kejadian sedang ditangani` : "Tidak ada kejadian aktif saat ini"}
            </div>

            <div className="absolute left-4 right-4 top-[72px] rounded-[22px] bg-card p-[18px] text-foreground sm:left-auto sm:right-[22px] sm:top-[22px] sm:w-[300px]">
              <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-text2">Dana diterima &amp; tercatat</div>
              <div className="mt-1.5 font-mono text-[34px] font-semibold leading-none tracking-[-0.03em]">{transparansiList ? formatRupiahRingkas(totalDana) : "—"}</div>
              {totalTarget > 0 && (
                <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-muted"><i className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (danaAktif / totalTarget) * 100)}%` }} /></div>
              )}
              <div className="mt-2 flex justify-between text-xs text-text2">
                <span><b className="font-mono font-semibold text-foreground">{totalDonasi}</b> donasi diterima</span>
                {totalTarget > 0 && <span>target aktif {formatRupiahRingkas(totalTarget)}</span>}
              </div>
              <Link href="/transparansi" className="mt-3.5 flex items-center justify-between border-t border-dashed border-border-strong pt-3 text-[13px] font-bold hover:no-underline">
                Lihat ke mana dananya <ArrowUpRight size={16} />
              </Link>
            </div>

            <div className="absolute bottom-[22px] left-[18px] flex flex-col items-start gap-1.5 sm:bottom-[26px] sm:left-[34px] sm:flex-row sm:items-end sm:gap-[22px]">
              <h1 className="text-[118px] font-extrabold leading-[0.74] tracking-[-0.075em] text-[#FFF8EA] sm:text-[clamp(120px,19vw,248px)]">Bali</h1>
              <div className="sm:pb-2.5">
                <b className="block text-[clamp(22px,2.6vw,34px)] font-extrabold leading-none tracking-[-0.03em]">bangkit<br /><span className="text-marigold">bersama.</span></b>
                <Seismo className="mt-3 h-7 w-[150px] text-marigold" />
              </div>
            </div>
            <div className="absolute bottom-[22px] right-4 sm:bottom-[30px] sm:right-[26px]">
              <a href="#laporan" className="inline-flex items-center gap-2 rounded-full bg-marigold px-[18px] py-[13px] text-sm font-bold text-ink hover:brightness-110 hover:no-underline sm:px-7 sm:py-[17px] sm:text-[15.5px]">
                Lokasi terdampak <ArrowRight size={17} />
              </a>
            </div>
          </div>

          <div className="mt-14 grid items-end gap-6 md:grid-cols-[1.15fr_1fr] md:gap-14">
            <h2 className="text-[clamp(32px,3.8vw,48px)] font-extrabold leading-[1.02] tracking-[-0.045em]">
              Satu alur untuk bencana di Bali. <em className="not-italic text-urgent">Lapor, bantu, lacak.</em>
            </h2>
            <p className="max-w-[460px] text-base text-text2">Warga melapor, Pusdalops memverifikasi, relawan bergerak, dan setiap rupiah tercatat di halaman transparansi. Pilih peran Anda.</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <JalurCard href="/lapor" n="01 · tanpa akun" title="Lapor bencana" icon={<Siren size={24} />} tone="urgent"
              desc="Lima langkah singkat: jenis, lokasi, foto & kondisi, warga terdampak, kirim. Sebagian besar cukup diketuk." cta="Buat laporan" />
            <JalurCard href={user ? dashboardHref(user.role) : "/donatur"} n="02 · uang / barang" title="Donasi ke lokasi" icon={<HandHeart size={24} />} tone="ink"
              desc="Pilih lokasi terdampak dan lihat kebutuhannya per item. Uang atau barang, keduanya dilacak sampai tersalur." cta="Pilih lokasi" />
            <JalurCard href="/register?peran=relawan" n="03 · diverifikasi" title="Jadi relawan" icon={<HardHat size={24} />} tone="gold"
              desc="Daftar sendiri, lengkapi data dan keahlian, lalu Pusdalops memverifikasi sebelum Anda ditugaskan." cta="Daftar relawan" />
          </div>
          <div className="mt-4 flex items-center gap-2.5 text-[13.5px] text-text2">
            <PhoneCall size={16} className="shrink-0 text-urgent" />
            <span>Dalam bahaya langsung? <b className="text-foreground">Telepon 112 dulu</b>, baru lapor di sini.</span>
          </div>
        </div>

        {/* ---------- PETA & STATUS ---------- */}
        <section id="peta" className="scroll-mt-20 pt-24">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
            <div className="grid gap-10 rounded-[26px] bg-ink p-[18px] dark:border dark:border-ink-line text-on-ink sm:rounded-[34px] sm:p-11 lg:grid-cols-[1.35fr_1fr]">
              <div className="overflow-hidden rounded-3xl">
                <DisasterMap laporan={list} onSelect={setOpenId} />
              </div>
              <div>
                <Eyebrow className="text-on-ink-2">Data langsung · Pusdalops</Eyebrow>
                <h2 className="mt-3.5 text-[clamp(34px,4.6vw,56px)] font-extrabold leading-none tracking-[-0.045em] text-white">
                  Hari ini Bali <span className="text-marigold">sedang ditangani.</span>
                </h2>
                <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-ink-line bg-ink-line">
                  <Angka v={laporanAktif} k="Laporan aktif" />
                  <Angka v={relawanBertugas} k="Penugasan relawan aktif" gold />
                  <Angka v={statistik?.laporan_selesai ?? null} k="Laporan selesai ditangani" />
                  <Angka v={kebTotal != null && kebPenuh != null ? `${kebPenuh}/${kebTotal}` : null} k="Item kebutuhan terpenuhi" />
                </div>
                <p className="mt-4 text-[13px] text-on-ink-2">Hanya laporan yang sudah diverifikasi admin yang tampil di peta. Ketuk pin untuk melihat ringkasannya.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- LAPORAN ---------- */}
        <section id="laporan" className="scroll-mt-20 pt-24">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <Eyebrow>Lokasi terdampak</Eyebrow>
                <h2 className="mt-3.5 text-[clamp(34px,4.6vw,56px)] font-extrabold leading-none tracking-[-0.045em]">Butuh bantuan <em className="not-italic text-urgent">sekarang.</em></h2>
              </div>
              <div className="flex max-w-[420px] flex-col items-start gap-3.5">
                <p className="text-[15px] text-text2">Yang masih ditangani tampil lebih dulu. Kebutuhan dicatat per item oleh relawan di posko.</p>
                <Link href="/transparansi" className="inline-flex items-center gap-1.5 border-b-2 border-foreground pb-0.5 text-sm font-bold hover:no-underline">
                  Lihat semua {list.length} laporan <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {jenisAda.length > 1 && (
              <div className="mt-7 flex flex-wrap gap-2" role="group" aria-label="Saring jenis bencana">
                {["semua", ...jenisAda].map(j => {
                  const n = j === "semua" ? list.length : list.filter(l => l.jenis_bencana === j).length;
                  return (
                    <button key={j} onClick={() => setFilter(j)} aria-pressed={filter === j}
                      className={cn("inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-[15px] py-[9px] text-[13px] font-bold",
                        filter === j ? "border-primary bg-primary text-primary-foreground" : "border-border-strong")}>
                      {j === "semua" ? "Semua" : JENIS_LABELS[j] ?? j}<span className="font-mono text-[11px] opacity-60">{n}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {isLoading ? (
              <div className="mt-6 grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map(i => <div key={i} className="h-[460px] animate-pulse rounded-3xl bg-muted" />)}
              </div>
            ) : tampil.length === 0 ? (
              <div className="mt-6 rounded-3xl border-[1.5px] border-dashed border-border-strong px-5 py-16 text-center text-text2">
                Belum ada laporan terverifikasi. Melihat kejadian? <Link href="/lapor" className="font-bold text-foreground underline">Laporkan sekarang</Link>.
              </div>
            ) : (
              <div className="mt-6 grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
                {tampil.map(l => <KartuLaporan key={l.id} l={l} onOpen={() => setOpenId(l.id)} />)}
              </div>
            )}
          </div>
        </section>

        {/* ---------- CARA KERJA ---------- */}
        <section id="alur" className="scroll-mt-20 pt-24">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <Eyebrow>Cara kerjanya</Eyebrow>
                <h2 className="mt-3.5 text-[clamp(34px,4.6vw,56px)] font-extrabold leading-none tracking-[-0.045em]">
                  Dari laporan ke <span className="bg-[linear-gradient(transparent_62%,hsl(var(--marigold))_62%_90%,transparent_90%)]">bukti penyaluran.</span>
                </h2>
              </div>
              <p className="max-w-[420px] text-[15px] text-text2">Setiap laporan melewati empat tahap yang sama, dan statusnya selalu bisa dilihat publik.</p>
            </div>
            <ol className="relative mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* garis penghubung antar-tahap (desktop) */}
              <span aria-hidden="true" className="absolute left-[28px] right-[28px] top-[27px] hidden h-0.5 bg-border-strong lg:block" />
              {[
                ["Warga melapor", "± 3 menit · tanpa akun", "Jenis bencana, lokasi, foto, kondisi, dan jumlah warga terdampak.", "Menunggu verifikasi"],
                ["Petugas memeriksa", "Pusdalops", "Operator mencocokkan dengan laporan lain. Laporan ganda digabung.", "Terverifikasi"],
                ["Relawan bergerak", "relawan & logistik", "Relawan ditugaskan, kebutuhan dicatat per item lalu dibuka untuk donasi.", "Aktif ditangani"],
                ["Semua tercatat", "bukti publik", "Dana dan barang yang diterima tampil di halaman Transparansi.", "Selesai"],
              ].map(([h, t, p, s], i) => (
                <li key={h} className="relative flex flex-col rounded-3xl border border-border bg-card p-5">
                  <span className={cn("relative z-[1] grid h-[54px] w-[54px] place-items-center rounded-2xl font-mono text-xl font-semibold",
                    i === 3 ? "bg-marigold text-ink" : "bg-primary text-primary-foreground")}>{i + 1}</span>
                  <span className="mt-4 font-mono text-[11px] uppercase tracking-[0.1em] text-text2">{t}</span>
                  <h3 className="mt-1 text-[21px] font-extrabold tracking-[-0.035em]">{h}</h3>
                  <p className="mt-2 flex-1 text-[14px] text-text2">{p}</p>
                  <span className="mt-4 border-t border-dashed border-border-strong pt-3 text-xs text-text2">Status publik: <b className="text-foreground">{s}</b></span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- TRANSPARANSI ---------- */}
        <section id="transparansi" className="scroll-mt-20 pt-24">
          <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-4 sm:px-6 md:grid-cols-[1fr_1.1fr] md:gap-14">
            <div>
              <Eyebrow>Transparansi · tanpa login</Eyebrow>
              <h2 className="mt-3.5 text-[clamp(34px,4.6vw,56px)] font-extrabold leading-none tracking-[-0.045em]">
                Uang masuk, uang keluar. <span className="bg-[linear-gradient(transparent_62%,hsl(var(--marigold))_62%_90%,transparent_90%)]">Semua terlihat.</span>
              </h2>
              <p className="mt-4 max-w-[460px] text-base text-text2">Dana baru dihitung setelah diterima dan dicek admin. Rincian per laporan, daftar donatur (nama tampil sesuai pilihan donatur), dan kebutuhan tiap posko bisa dibuka publik.</p>
              <Link href="/transparansi" className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary-hover hover:no-underline">
                Buka transparansi <ArrowRight size={17} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2">
              <Tile k="Dana diterima" v={transparansiList ? formatRupiahRingkas(totalDana) : "—"} s={`dari ${totalDonasi} donasi`} />
              <Tile k="Laporan tercatat" v={transparansiList ? String(list.length) : "—"} s={`${laporanAktif ?? 0} masih ditangani`} />
              <Tile k="Penugasan relawan" v={relawanBertugas != null ? String(relawanBertugas) : "—"} s="aktif saat ini" />
              <Tile k="Kebutuhan belum terpenuhi" v={kebTotal != null && kebPenuh != null ? `${kebTotal - kebPenuh} item` : "—"} s="di seluruh posko" accent />
            </div>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" className="scroll-mt-20 pt-24">
          <div className="mx-auto grid max-w-[1240px] gap-8 px-4 sm:px-6 md:grid-cols-[.9fr_1.4fr] md:gap-14">
            <div>
              <Eyebrow>Tanya jawab</Eyebrow>
              <h2 className="mt-3.5 text-[clamp(34px,4.6vw,56px)] font-extrabold leading-none tracking-[-0.045em]">Yang sering ditanyakan.</h2>
              <p className="mt-4 text-text2">Belum terjawab? Hubungi Pusdalops di <b className="font-mono text-foreground">(0361) 251177</b>.</p>
            </div>
            <div className="border-t-[1.5px] border-foreground">
              {FAQ.map(([q, a], i) => {
                const open = faqOpen === i;
                return (
                  <div key={q} className="border-b border-border-strong">
                    <button onClick={() => setFaqOpen(open ? -1 : i)} aria-expanded={open}
                      className="flex w-full items-center justify-between gap-4 py-5 text-left text-[17px] font-bold tracking-[-0.02em]">
                      {q}
                      <span className={cn("grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border-[1.5px] border-border-strong transition-transform", open && "rotate-45 border-primary bg-primary text-marigold")}>
                        <Plus size={16} />
                      </span>
                    </button>
                    {open && <p className="max-w-[620px] pb-5 text-[15px] text-text2">{a}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
      <MobileActionBar />
      {openId != null && <ReportDetailOverlay id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function JalurCard({ href, n, title, desc, cta, icon, tone }: { href: string; n: string; title: string; desc: string; cta: string; icon: React.ReactNode; tone: "urgent" | "ink" | "gold" }) {
  const ic = tone === "urgent" ? "bg-urgent text-white" : tone === "ink" ? "bg-ink text-marigold" : "bg-marigold text-ink";
  const Comp: any = href.startsWith("#") ? "a" : Link;
  return (
    <Comp href={href} className="relative flex flex-col gap-3.5 overflow-hidden rounded-[22px] border border-border bg-card p-[22px] transition hover:-translate-y-0.5 hover:border-foreground hover:no-underline">
      {tone === "urgent" && <span className="absolute inset-y-0 left-0 w-1 bg-urgent" />}
      <div className="flex items-center justify-between">
        <span className={cn("grid h-12 w-12 place-items-center rounded-[14px]", ic)}>{icon}</span>
        <span className="font-mono text-xs text-text2">{n}</span>
      </div>
      <h3 className="text-[21px] font-extrabold tracking-[-0.03em]">{title}</h3>
      <p className="flex-1 text-sm text-text2">{desc}</p>
      <span className="flex items-center gap-1.5 text-[13.5px] font-bold">{cta} <ArrowRight size={16} /></span>
    </Comp>
  );
}

function Angka({ v, k, gold }: { v: number | string | null; k: string; gold?: boolean }) {
  return (
    <div className="bg-ink p-[18px]">
      <div className={cn("font-mono text-[34px] font-semibold leading-none tracking-[-0.04em] sm:text-[40px]", gold ? "text-marigold" : "text-white")}>{v ?? "—"}</div>
      <div className="mt-2 text-[12.5px] text-on-ink-2">{k}</div>
    </div>
  );
}

function Tile({ k, v, s, accent }: { k: string; v: string; s: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 bg-card p-[22px]">
      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-text2">{k}</span>
      <b className={cn("font-mono text-[30px] font-semibold tracking-[-0.03em]", accent && "text-accent-ink")}>{v}</b>
      <span className="text-[13px] text-text2">{s}</span>
    </div>
  );
}
