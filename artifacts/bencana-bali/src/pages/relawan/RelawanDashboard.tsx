import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useGetLaporanAktif, useGetPenugasan, getGetPenugasanQueryKey, type Penugasan } from "@workspace/api-client-react";
import {
  AlertTriangle, ArrowRight, CheckCircle2, Clock, Coffee, ExternalLink, MapPin, MapPinned, Navigation,
  PhoneCall, Plus, Radio, UserRound, Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { FotoBencana } from "@/components/Ilustrasi";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTanggalSingkat, JENIS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

// Dashboard relawan — mengikuti Mobile Dashboard Relawan (handoff) dan
// artifacts/mobile/app/relawan/index.tsx: hanya penugasan MILIK relawan ini,
// dengan ubah status sekali ketuk. Berangkat/Tiba/Ada kendala ditulis ke kolom
// catatan lewat PATCH /penugasan/:id/lapangan; hanya "Selesai" yang mengubah
// status penugasan. Toggle Bertugas/Istirahat masih lokal (belum ada kolomnya).

const BASE = import.meta.env.VITE_API_URL.replace(/\/$/, "");

type CekRelawan = { terdaftar: boolean; relawan?: { id: number; nama: string; status_verifikasi: string; catatan_verifikasi: string | null; keahlian?: string[] } };

const STATUS_LAPANGAN = [
  { l: "Berangkat ke lokasi", ikon: Navigation },
  { l: "Tiba di lokasi", ikon: MapPinned },
  { l: "Ada kendala", ikon: AlertTriangle },
] as const;

const jamSekarang = () => new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

async function patchLapangan(id: number, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/penugasan/${id}/lapangan`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "Gagal menyimpan status");
}

function KartuTugas({ t, onBerubah }: { t: Penugasan; onBerubah: () => void }) {
  const [simpan, setSimpan] = useState<string | null>(null);
  const [konfirmSelesai, setKonfirmSelesai] = useState(false);
  const [galat, setGalat] = useState("");
  const kini = STATUS_LAPANGAN.find(s => t.catatan?.startsWith(s.l))?.l ?? null;
  const waktuKini = t.catatan?.split("·")[1]?.trim();

  const ubah = async (label: string) => {
    setSimpan(label); setGalat("");
    try { await patchLapangan(t.id, { catatan: `${label} · ${jamSekarang()} WITA` }); onBerubah(); }
    catch (e) { setGalat((e as Error).message); }
    finally { setSimpan(null); }
  };
  const selesai = async () => {
    if (!konfirmSelesai) { setKonfirmSelesai(true); return; }
    setSimpan("Selesai"); setGalat("");
    try { await patchLapangan(t.id, { status: "selesai", catatan: `Tugas selesai · ${jamSekarang()} WITA` }); onBerubah(); }
    catch (e) { setGalat((e as Error).message); setKonfirmSelesai(false); }
    finally { setSimpan(null); }
  };

  return (
    <article className="overflow-hidden rounded-3xl border-2 border-primary bg-card">
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11.5px] text-text2">
          <span className="rounded-md bg-muted px-2 py-0.5 font-semibold text-foreground">LPR-{String(t.laporan_id).padStart(4, "0")}</span>
          ditugaskan {formatTanggalSingkat(t.created_at)}
          <StatusBadge status="aktif" label="Aktif bertugas" className="ml-auto" />
        </div>
        <h3 className="mt-3 text-[21px] font-extrabold leading-tight tracking-[-0.03em]">{t.detail_tugas}</h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-text2"><MapPin size={15} className="shrink-0" />{t.lokasi_tugas}</p>

        <div className={cn("mt-4 flex items-center gap-3 rounded-2xl px-4 py-3", kini === "Ada kendala" ? "bg-urgent-soft" : "bg-muted")}>
          <Radio size={18} className={kini === "Ada kendala" ? "text-urgent" : "text-text2"} />
          <div className="min-w-0">
            <small className="block font-mono text-[10.5px] uppercase tracking-[0.1em] text-text2">Status Anda</small>
            <b className="text-[15px]">{kini ?? "Aktif, belum ada pembaruan"}</b>
            {kini && waktuKini && <span className="ml-2 font-mono text-xs text-text2">{waktuKini}</span>}
          </div>
        </div>

        <small className="mt-4 block font-mono text-[10.5px] uppercase tracking-[0.1em] text-text2">Ubah status — sekali ketuk</small>
        <div className="mt-2 grid grid-cols-2 gap-2.5">
          {STATUS_LAPANGAN.map(({ l, ikon: Ikon }) => {
            const aktif = kini === l, kendala = l === "Ada kendala";
            return (
              <button key={l} onClick={() => ubah(l)} disabled={!!simpan} aria-pressed={aktif}
                className={cn("flex min-h-[64px] items-center gap-2.5 rounded-2xl border-2 px-3.5 text-left text-sm font-extrabold transition disabled:opacity-60",
                  aktif ? (kendala ? "border-urgent bg-urgent text-white" : "border-primary bg-primary text-primary-foreground") : "border-border bg-card hover:border-foreground")}>
                {simpan === l ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Ikon size={20} className={cn(!aktif && kendala && "text-urgent")} />}
                {l}
              </button>
            );
          })}
          <button onClick={selesai} disabled={!!simpan}
            className={cn("flex min-h-[64px] items-center gap-2.5 rounded-2xl border-2 px-3.5 text-left text-sm font-extrabold transition disabled:opacity-60",
              konfirmSelesai ? "border-status-done-fg bg-status-done-fg text-white" : "border-border bg-card hover:border-status-done-fg")}>
            {simpan === "Selesai" ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <CheckCircle2 size={20} className={konfirmSelesai ? "" : "text-status-done-fg"} />}
            {konfirmSelesai ? "Ketuk lagi untuk konfirmasi" : "Selesai"}
          </button>
        </div>
        {galat && <p className="mt-2 text-xs font-semibold text-destructive">{galat}</p>}

        {kini === "Ada kendala" && (
          <div className="mt-4 rounded-2xl border border-status-act-br bg-urgent-soft p-4">
            <b className="flex items-center gap-2 text-sm text-status-act-fg"><AlertTriangle size={16} />Kendala tercatat — koordinator melihat status ini</b>
            <p className="mt-1 text-xs text-text2">Butuh bantuan koordinasi segera? Hubungi Pusdalops.</p>
            <a href="tel:+62361251177" className="mt-3 inline-flex items-center gap-2 rounded-full bg-urgent px-4 py-2.5 text-sm font-bold text-white hover:no-underline">
              <PhoneCall size={16} />Telepon (0361) 251177
            </a>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border bg-muted/50 px-5 py-3.5">
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.lokasi_tugas)}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground hover:no-underline">
          <Navigation size={15} />Buka rute
        </a>
        {t.link_grup && (
          <a href={t.link_grup} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-border-strong px-4 py-2.5 text-[13px] font-bold hover:border-foreground hover:no-underline">
            <ExternalLink size={15} />Grup koordinasi
          </a>
        )}
        <span className="ml-auto self-center text-xs text-text2">Pembaruan langsung terlihat oleh admin</span>
      </div>
    </article>
  );
}

export default function RelawanDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [bertugas, setBertugas] = useState(() => {
    try { return localStorage.getItem("relawan-bertugas") !== "0"; } catch { return true; }
  });
  useEffect(() => { try { localStorage.setItem("relawan-bertugas", bertugas ? "1" : "0"); } catch { /* abaikan */ } }, [bertugas]);

  const { data: cek, isLoading: loadingCek } = useQuery({
    queryKey: ["relawan-cek-email", user?.email],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/relawan/cek-email?email=${encodeURIComponent(user!.email)}`, { credentials: "include" });
      return res.json() as Promise<CekRelawan>;
    },
    enabled: !!user?.email,
  });
  const relawan = cek?.relawan;
  const relawanId = relawan?.id;

  const { data: semua, isLoading: loadingTugas } = useGetPenugasan(
    { relawan_id: relawanId! },
    { query: { enabled: !!relawanId, queryKey: getGetPenugasanQueryKey({ relawan_id: relawanId }) } },
  );
  const { data: laporanAktif, isLoading: loadingLaporan } = useGetLaporanAktif();

  const aktif = (semua ?? []).filter(p => p.status === "aktif");
  const riwayat = (semua ?? []).filter(p => p.status !== "aktif");
  const inisial = user?.nama?.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase() ?? "—";
  const terverifikasi = relawan?.status_verifikasi === "terverifikasi";
  const muatUlang = () => queryClient.invalidateQueries({ queryKey: getGetPenugasanQueryKey({ relawan_id: relawanId }) });

  return (
    <AppLayout title="Dashboard Relawan" subtitle="Tugas lapangan Anda" role="relawan">
      {loadingCek ? (
        <Skeleton className="h-48 w-full rounded-3xl" />
      ) : !cek?.terdaftar ? (
        <div className="mx-auto max-w-lg rounded-3xl border-[1.5px] border-dashed border-border-strong bg-card px-6 py-12 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-muted"><UserRound size={26} /></span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.03em]">Belum terdaftar sebagai relawan</h1>
          <p className="mt-2 text-sm text-text2">Lengkapi data dan keahlian Anda. Setelah diverifikasi Pusdalops, penugasan akan muncul di sini.</p>
          <Link href="/relawan/daftar" className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:no-underline">
            <Plus size={17} />Daftar relawan
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Identitas + ringkasan */}
          <section className="rounded-[28px] bg-ink p-5 text-on-ink sm:p-7 dark:border dark:border-ink-line">
            <div className="flex flex-wrap items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-marigold text-xl font-extrabold text-ink">{inisial}</span>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[26px] font-extrabold tracking-[-0.035em] text-white">{user?.nama}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <StatusBadge status={relawan?.status_verifikasi ?? "menunggu"} label={terverifikasi ? "Relawan terverifikasi" : relawan?.status_verifikasi === "ditolak" ? "Pendaftaran ditolak" : "Menunggu verifikasi"} />
                  {(relawan?.keahlian ?? []).slice(0, 3).map(k => <span key={k} className="rounded-full border border-ink-line px-2.5 py-1 text-xs font-semibold">{k}</span>)}
                </div>
              </div>
              <button onClick={() => setBertugas(v => !v)} aria-pressed={bertugas}
                className={cn("flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-extrabold", bertugas ? "bg-status-done-bg text-status-done-fg" : "bg-white/10 text-on-ink")}>
                {bertugas ? <span className="h-2.5 w-2.5 rounded-full bg-status-done-fg shadow-[0_0_0_4px_rgba(31,110,72,.25)]" /> : <Coffee size={16} />}
                {bertugas ? "Bertugas" : "Istirahat"}
              </button>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-ink-line bg-ink-line">
              {[["Tugas aktif", aktif.length, true], ["Tugas selesai", riwayat.filter(r => r.status === "selesai").length, false], ["Total penugasan", semua?.length ?? 0, false]].map(([k, v, gold]) => (
                <div key={String(k)} className="bg-ink px-4 py-3.5">
                  <b className={cn("block font-mono text-[32px] font-semibold leading-none tracking-[-0.04em]", gold ? "text-marigold" : "text-white")}>{loadingTugas ? "—" : String(v)}</b>
                  <small className="mt-1.5 block text-xs text-on-ink-2">{k}</small>
                </div>
              ))}
            </div>
            {!terverifikasi && relawan?.catatan_verifikasi && (
              <p className="mt-4 rounded-xl bg-white/5 px-4 py-3 text-sm">Catatan admin: {relawan.catatan_verifikasi}</p>
            )}
          </section>

          <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-6">
              <section>
                <div className="mb-3 flex items-center gap-2.5">
                  <h2 className="text-xl font-extrabold tracking-[-0.03em]">Penugasan aktif</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs font-semibold">{aktif.length}</span>
                </div>
                {loadingTugas ? <Skeleton className="h-72 w-full rounded-3xl" />
                  : aktif.length === 0 ? (
                    <div className="rounded-3xl border-[1.5px] border-dashed border-border-strong bg-card px-6 py-12 text-center text-sm text-text2">
                      <Clock size={26} className="mx-auto mb-2.5" />
                      {bertugas ? "Belum ada penugasan aktif. Koordinator akan menugaskan Anda saat dibutuhkan." : "Anda sedang istirahat. Ubah ke Bertugas saat siap menerima tugas."}
                    </div>
                  ) : <div className="space-y-4">{aktif.map(t => <KartuTugas key={t.id} t={t} onBerubah={muatUlang} />)}</div>}
              </section>

              <section>
                <h2 className="mb-3 text-xl font-extrabold tracking-[-0.03em]">Riwayat penugasan</h2>
                <div className="overflow-hidden rounded-3xl border border-border bg-card">
                  {riwayat.length === 0 ? <p className="px-5 py-8 text-center text-sm text-text2">Belum ada tugas yang selesai.</p>
                    : riwayat.map(t => (
                      <div key={t.id} className="flex items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0">
                        <span className="min-w-0 flex-1">
                          <b className="block truncate text-sm">{t.detail_tugas}</b>
                          <small className="text-xs text-text2">{t.lokasi_tugas} · {formatTanggalSingkat(t.created_at)}</small>
                        </span>
                        <StatusBadge status={t.status} />
                      </div>
                    ))}
                </div>
              </section>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-3xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                  <b className="text-sm font-extrabold">Kejadian aktif di Bali</b>
                  <span className="font-mono text-xs text-text2">{laporanAktif?.length ?? 0}</span>
                </div>
                {loadingLaporan ? <div className="p-5"><Skeleton className="h-24 w-full" /></div>
                  : (laporanAktif ?? []).slice(0, 5).map(l => (
                    <div key={l.id} className="flex gap-3 border-b border-border px-4 py-3 last:border-b-0">
                      <FotoBencana jenis={l.jenis_bencana} label={false} className="h-14 w-16 shrink-0 rounded-xl" />
                      <div className="min-w-0">
                        <b className="line-clamp-1 text-[13.5px]">{l.judul}</b>
                        <small className="block truncate text-xs text-text2">{JENIS_LABELS[l.jenis_bencana] ?? l.jenis_bencana} · {l.lokasi}</small>
                        <small className="mt-0.5 flex items-center gap-2 text-xs text-text2">
                          {l.jumlah_terdampak ? <span className="flex items-center gap-1"><Users size={12} />{l.jumlah_terdampak.toLocaleString("id-ID")}</span> : null}
                          {l.jumlah_kebutuhan_pending > 0 && <span className="font-semibold text-status-wait-fg">{l.jumlah_kebutuhan_pending} kebutuhan</span>}
                        </small>
                      </div>
                    </div>
                  ))}
                <Link href="/#peta" className="flex items-center justify-between px-5 py-3 text-[13px] font-bold hover:bg-muted hover:no-underline">Lihat di peta <ArrowRight size={15} /></Link>
              </div>
              <div className="rounded-3xl bg-urgent-soft p-5">
                <b className="text-sm font-extrabold text-status-act-fg">Kontak darurat koordinator</b>
                <p className="mt-1 text-xs text-text2">Pusdalops BPBD Bali, 24 jam.</p>
                <a href="tel:+62361251177" className="mt-3 flex items-center gap-2 font-mono text-lg font-semibold hover:no-underline"><PhoneCall size={18} className="text-urgent" />(0361) 251177</a>
              </div>
              {relawanId && (
                <Link href={`/relawan/${relawanId}`} className="flex items-center justify-between rounded-3xl border border-border bg-card px-5 py-4 text-sm font-bold hover:border-foreground hover:no-underline">
                  <span className="flex items-center gap-2"><UserRound size={17} />Profil & data relawan</span><ArrowRight size={16} />
                </Link>
              )}
            </aside>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
