import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetLaporanQueryKey, getGetLaporanSayaQueryKey } from "@workspace/api-client-react";
import {
  ArrowRight, Beef, Check, ChevronLeft, Construction, HeartPulse, History, House, Info, LifeBuoy,
  LocateFixed, Minus, Eye, Activity, CircleEllipsis, CloudRain, Flame, Mountain, Waves, Wind, PhoneCall, Plus, RefreshCw, Send, ShieldCheck, Siren, Tent, Utensils, WifiOff, X, ZapOff,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Brand } from "@/components/brand/Brand";
import { LokasiPicker, jarakMeter, type Titik } from "@/components/LokasiPicker";
import { PhotoUploadField } from "@/components/PhotoUploadField";
import { KtpUploadField } from "@/components/KtpUploadField";
import { StatusBadge } from "@/components/StatusBadge";
import { LangkahBarang, keKebutuhan, ringkasBarang, type ItemMinta } from "@/components/lapor/LangkahBarang";
import { cn } from "@/lib/utils";

// Wizard Lapor v2 (PRD v3 § 7) — "ketuk, bukan ketik". Satu-satunya isian
// ketik yang wajib adalah nomor HP; deskripsi (kolom wajib di server) disusun
// otomatis dari pilihan pelapor.
//
// Catatan data:
// - Warga terdampak dikirim per kelompok (terdampak_pria, dst); total
//   jumlah_terdampak dihitung ulang di server.
// - Foto KTP diunggah ke bucket PRIVAT (S4) lewat KtpUploadField — yang dikirim
//   hanya foto_ktp_path. Masih opsional; PRD § 7 menyebut wajib, cukup ubah
//   `halangan` langkah 5 bila ingin diwajibkan.

const BASE = import.meta.env.VITE_API_URL.replace(/\/$/, "");
const DRAFT_KEY = "balirief-lapor-draft-v2";

const JENIS = [
  ["banjir", "Banjir"], ["tanah_longsor", "Tanah longsor"], ["angin_kencang", "Angin kencang"], ["gempa_bumi", "Gempa bumi"],
  ["kebakaran", "Kebakaran"], ["tsunami", "Tsunami / gelombang"], ["lainnya", "Lainnya"],
] as const;

const IKON_JENIS: Record<string, typeof Waves> = {
  banjir: CloudRain, tanah_longsor: Mountain, angin_kencang: Wind, gempa_bumi: Activity,
  kebakaran: Flame, tsunami: Waves, lainnya: CircleEllipsis,
};

// Warna khas tiap jenis — ikon & sorotan saat dipilih.
const WARNA_JENIS: Record<string, string> = {
  banjir: "#2F6FB0", tanah_longsor: "#8A5A34", angin_kencang: "#2F8A84", gempa_bumi: "#B7791F",
  kebakaran: "#D2461C", tsunami: "#1F7AA8", lainnya: "#6B675D",
};

const BAHAYA = [
  { k: "jiwa", l: "Mengancam jiwa", d: "Ada orang dalam bahaya sekarang", ikon: Siren, warna: "bg-urgent text-white" },
  { k: "serius", l: "Serius", d: "Rumah atau akses rusak, belum ada korban jiwa", ikon: House, warna: "bg-[#E7801C] text-white" },
  { k: "ringan", l: "Ringan", d: "Dampak kecil, perlu dipantau", ikon: Eye, warna: "bg-status-ver-fg text-white" },
] as const;

const KABUPATEN = ["Badung", "Bangli", "Buleleng", "Denpasar", "Gianyar", "Jembrana", "Karangasem", "Klungkung", "Tabanan"];

const KONDISI = [
  { k: "evakuasi", l: "Butuh evakuasi", i: Siren }, { k: "terjebak", l: "Ada orang terjebak", i: LifeBuoy },
  { k: "medis", l: "Butuh medis", i: HeartPulse }, { k: "pangan", l: "Butuh makanan / air", i: Utensils },
  { k: "akses", l: "Akses jalan terputus", i: Construction }, { k: "listrik", l: "Listrik padam", i: ZapOff },
  { k: "rumah", l: "Rumah rusak", i: House }, { k: "mengungsi", l: "Warga mengungsi", i: Tent },
  { k: "ternak", l: "Ternak terdampak", i: Beef },
] as const;

const KELOMPOK = [
  { k: "pria", l: "Pria dewasa", u: "18–59 th", c: "#125CA5" },
  { k: "wanita", l: "Wanita dewasa", u: "18–59 th", c: "#1F6E48" },
  { k: "anak", l: "Anak", u: "6–17 th", c: "#C98F0A" },
  { k: "balita", l: "Balita & bayi", u: "0–5 th", c: "#E7801C" },
  { k: "lansia", l: "Lansia", u: "60 th ke atas", c: "#6B675D" },
] as const;
type KelompokKey = (typeof KELOMPOK)[number]["k"];

const PIKTO: Record<KelompokKey, string> = {
  pria: '<circle cx="12" cy="5.5" r="3.2"/><path d="M7 21.5v-8a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v8h-3v-5.5h-4v5.5z"/>',
  wanita: '<circle cx="12" cy="5.5" r="3.2"/><path d="M10 10.5h4l3.6 8.3H15v2.7h-6v-2.7H6.4z"/>',
  anak: '<circle cx="12" cy="8.2" r="2.9"/><path d="M8.2 21.5V16a2.6 2.6 0 0 1 2.6-2.6h2.4A2.6 2.6 0 0 1 15.8 16v5.5h-2.4v-3.8h-2.8v3.8z"/>',
  balita: '<circle cx="12" cy="12" r="2.7"/><path d="M8.6 21.5v-2.8a2.6 2.6 0 0 1 2.6-2.6h1.6a2.6 2.6 0 0 1 2.6 2.6v2.8z"/>',
  lansia: '<circle cx="10.5" cy="5.5" r="3.2"/><path d="M6 21.5v-8a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v8h-3v-5.5h-3v5.5z"/><path d="M18.3 12.5v9M16.4 12.5h1.9" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
};
const Pikto = ({ k }: { k: KelompokKey }) => <svg viewBox="0 0 24 24" fill="currentColor" className="h-[26px] w-[26px]" dangerouslySetInnerHTML={{ __html: PIKTO[k] }} />;

const STEPS = ["Jenis bencana", "Lokasi", "Foto & kondisi", "Warga terdampak", "Barang dibutuhkan", "Kontak & kirim"];
const AKHIR = STEPS.length;

type Draft = {
  step: number;
  jenis: string | null;
  // Diisi pelapor bila memilih "Lainnya" (mis. hujan abu, kekeringan).
  jenisLain: string;
  bahaya: string | null;
  kabupaten: string | null;
  detail: string;
  titik: Titik | null;
  gps: Titik | null;
  akurasi: number | null;
  foto: string[];
  kondisi: string[];
  pengungsian: string;
  catatan: string;
  korban: Record<KelompokKey, number>;
  // Barang bantuan yang diminta pelapor (opsional) — dikirim ke kebutuhan-bulk.
  barang: ItemMinta[];
  hp: string;
  nama: string;
  ktpPath: string | null;
  setuju: boolean;
  disimpan: string | null;
};

const kosong = (nama = ""): Draft => ({
  step: 1, jenis: null, jenisLain: "", bahaya: null, kabupaten: null, detail: "", titik: null, gps: null, akurasi: null,
  foto: [], kondisi: [], pengungsian: "", catatan: "", korban: { pria: 0, wanita: 0, anak: 0, balita: 0, lansia: 0 }, barang: [],
  hp: "", nama, ktpPath: null, setuju: false, disimpan: null,
});

const jam = () => new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
const labelJenis = (k: string | null, lain?: string) =>
  k === "lainnya" && lain?.trim() ? lain.trim().replace(/^./, c => c.toUpperCase()) : JENIS.find(j => j[0] === k)?.[1] ?? "Kejadian";

function bacaDraft(): Draft | null {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    return d && d.jenis ? { ...kosong(), ...d } : null;
  } catch { return null; }
}

export function susunDeskripsi(d: Draft) {
  const bahaya = BAHAYA.find(b => b.k === d.bahaya);
  const kondisi = d.kondisi.map(k => KONDISI.find(x => x.k === k)?.l.toLowerCase()).filter(Boolean);
  const baris = [
    `${labelJenis(d.jenis, d.jenisLain)}${bahaya ? ` — tingkat bahaya: ${bahaya.l.toLowerCase()}` : ""}.`,
    kondisi.length ? `Kondisi: ${kondisi.join(", ")}.` : "Kondisi lapangan belum dipilih pelapor.",
  ];
  if (d.catatan.trim()) baris.push(`Catatan pelapor: ${d.catatan.trim()}`);
  return baris.join("\n");
}

// "0812…", "62812…", "812…" → "+62812…" (kolom isian sudah diawali +62).
function nomorHp(hp: string) {
  let n = hp.replace(/\D/g, "");
  if (n.startsWith("62")) n = n.slice(2);
  if (n.startsWith("0")) n = n.slice(1);
  return `+62${n}`;
}

function lokasiTeks(d: Draft) {
  return [d.detail.trim(), d.kabupaten].filter(Boolean).join(", ");
}

type Fase = { t: "isi" } | { t: "kirim" } | { t: "gagal"; pesan: string; offline: boolean } | { t: "terkirim"; id: number; barangGagal: boolean };

export default function LaporanBaru() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [d, setD] = useState<Draft>(() => bacaDraft() ?? kosong(user?.nama ?? ""));
  const [dipulihkan, setDipulihkan] = useState(() => !!bacaDraft());
  const [fase, setFase] = useState<Fase>({ t: "isi" });
  const [gpsStatus, setGpsStatus] = useState<"idle" | "cari" | "gagal">("idle");
  const [catatanBuka, setCatatanBuka] = useState(false);
  const [kelipatan, setKelipatan] = useState(1);
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // Simpan draf di perangkat tiap ada perubahan — sinyal putus tidak menghapus isian.
  useEffect(() => {
    if (fase.t === "terkirim" || !d.jenis) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* penyimpanan penuh/diblokir: tetap lanjut */ }
  }, [d, fase.t]);

  const ubah = (patch: Partial<Draft>) => setD(prev => ({ ...prev, ...patch, disimpan: jam() }));
  // Selalu dari nilai terbaru — ketukan beruntun yang cepat tidak boleh hilang.
  const ubahKorban = (k: KelompokKey, f: (n: number) => number) =>
    setD(prev => ({ ...prev, korban: { ...prev.korban, [k]: Math.max(0, Math.min(100000, f(prev.korban[k]))) }, disimpan: jam() }));
  const total = Object.values(d.korban).reduce((a, b) => a + b, 0);

  const halangan = useMemo(() => {
    if (d.step === 1) return !d.jenis ? "Pilih jenis bencana dulu"
      : d.jenis === "lainnya" && d.jenisLain.trim().length < 3 ? "Tulis jenis bencananya"
      : !d.bahaya ? "Pilih tingkat bahaya" : "";
    if (d.step === 2) return d.kabupaten || d.detail.trim().length >= 4 ? "" : "Pilih kabupaten/kota atau tulis nama tempat";
    if (d.step === AKHIR) {
      if (d.hp.replace(/\D/g, "").length < 9) return "Isi nomor HP (wajib)";
      if (!d.setuju) return "Centang pernyataan di bawah";
    }
    return "";
  }, [d]);

  const pindah = (s: number) => { setDipulihkan(false); ubah({ step: s }); window.scrollTo({ top: 0 }); };
  const lanjut = () => { if (!halangan) d.step < AKHIR ? pindah(d.step + 1) : kirim(); };

  const cariGps = () => {
    if (!("geolocation" in navigator)) { setGpsStatus("gagal"); return; }
    setGpsStatus("cari");
    navigator.geolocation.getCurrentPosition(
      p => {
        const t = { lat: p.coords.latitude, lng: p.coords.longitude };
        setGpsStatus("idle");
        ubah({ gps: t, titik: t, akurasi: Math.round(p.coords.accuracy) });
      },
      () => setGpsStatus("gagal"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  async function kirim() {
    setFase({ t: "kirim" });
    const judul = `${labelJenis(d.jenis, d.jenisLain)} di ${d.detail.trim() || d.kabupaten}`.slice(0, 200);
    try {
      const res = await fetch(`${BASE}/api/laporan`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul,
          jenis_bencana: d.jenis,
          lokasi: lokasiTeks(d).slice(0, 300),
          koordinat_lat: d.titik?.lat ?? null,
          koordinat_lng: d.titik?.lng ?? null,
          deskripsi: susunDeskripsi(d).slice(0, 5000),
          nama_pelapor: d.nama.trim() || "Anonim",
          kontak_pelapor: nomorHp(d.hp),
          jumlah_terdampak: total || null,
          terdampak_pria: d.korban.pria,
          terdampak_wanita: d.korban.wanita,
          terdampak_anak: d.korban.anak,
          terdampak_balita: d.korban.balita,
          terdampak_lansia: d.korban.lansia,
          lokasi_pengungsian: d.kondisi.includes("mengungsi") && d.pengungsian.trim() ? d.pengungsian.trim().slice(0, 300) : null,
          foto_urls: d.foto,
          foto_ktp_path: d.ktpPath,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFase({ t: "gagal", offline: false, pesan: body?.message ?? `Server menolak laporan (kode ${res.status}).` });
        return;
      }
      // Barang yang diminta pelapor — dikirim terpisah setelah laporan dibuat.
      // Gagal di sini tidak membatalkan laporan; pelapor diberi tahu di layar sukses.
      let barangGagal = false;
      if (d.barang.length) {
        try {
          const rk = await fetch(`${BASE}/api/laporan/${body.id}/kebutuhan-bulk`, {
            method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(keKebutuhan(d.barang)),
          });
          barangGagal = !rk.ok;
        } catch { barangGagal = true; }
      }
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* abaikan */ }
      queryClient.invalidateQueries({ queryKey: getGetLaporanQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetLaporanSayaQueryKey() });
      setFase({ t: "terkirim", id: body.id, barangGagal });
    } catch {
      setFase({ t: "gagal", offline: true, pesan: "Koneksi terputus." });
    }
  }

  // Coba kirim ulang otomatis begitu perangkat kembali online.
  useEffect(() => {
    if (fase.t === "gagal" && fase.offline && online) kirim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  const mulaiBaru = () => { try { localStorage.removeItem(DRAFT_KEY); } catch { /* abaikan */ } setD(kosong(user?.nama ?? "")); setDipulihkan(false); setFase({ t: "isi" }); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center gap-4 px-4 sm:px-6">
          <Link href={user ? "/pelapor" : "/"} className="hidden hover:no-underline sm:block"><Brand sub={null} /></Link>
          <Link href={user ? "/pelapor" : "/"} className="grid h-11 w-11 place-items-center rounded-full border border-border-strong bg-card sm:hidden" aria-label="Tutup">
            <X size={20} />
          </Link>
          <div className="min-w-0 flex-1 sm:text-center">
            <b className="block text-[15px] font-extrabold tracking-[-0.02em]">Lapor Bencana</b>
          </div>
          <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] px-2.5 py-1.5 text-[11.5px] font-bold",
            online ? "border-border-strong bg-card" : "border-status-wait-br bg-status-wait-bg text-status-wait-fg")}>
            {online ? <span className="h-2 w-2 rounded-full bg-status-done-fg" /> : <WifiOff size={14} />}{online ? "Online" : "Sinyal putus"}
          </span>
          <Link href={user ? "/pelapor" : "/"} className="hidden text-sm font-bold text-text2 hover:text-foreground hover:no-underline sm:block">Tutup</Link>
        </div>
      </header>

      {/* Pita langkah: judul tahap + stepper bernomor di atas latar ilustrasi. */}
      {fase.t === "isi" && (
        <section className="relative overflow-hidden bg-ink pb-24 pt-8 text-on-ink">
          <img src={`${import.meta.env.BASE_URL}hero-bali.jpg`} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-[70%_60%] opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/40" />
          <div className="relative mx-auto max-w-[880px] px-4 sm:px-6">
            <span className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-marigold">Langkah {d.step} dari {AKHIR}</span>
            <h1 className="mt-1.5 text-[clamp(30px,4vw,44px)] font-extrabold leading-none tracking-[-0.045em] text-white">{STEPS[d.step - 1]}</h1>
            <ol className="mt-7 grid grid-cols-6 gap-2">
              {STEPS.map((nama, i) => {
                const n = i + 1, selesai = n < d.step, kini = n === d.step;
                return (
                  <li key={nama}>
                    <button onClick={() => selesai && pindah(n)} disabled={!selesai} className="group flex w-full flex-col items-start gap-2 text-left disabled:cursor-default">
                      <span className="flex w-full items-center gap-2">
                        <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-sm font-semibold transition",
                          selesai ? "bg-marigold text-ink" : kini ? "bg-white text-ink" : "border border-white/25 text-white/60")}>
                          {selesai ? <Check size={16} /> : n}
                        </span>
                        <i className={cn("h-0.5 flex-1 rounded-full", n === AKHIR ? "invisible" : selesai ? "bg-marigold" : "bg-white/20")} />
                      </span>
                      <span className={cn("hidden text-[12.5px] font-bold sm:block", kini ? "text-white" : selesai ? "text-on-ink group-hover:text-white" : "text-white/50")}>{nama}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}

      <div className={cn("relative mx-auto max-w-[880px] px-4 pb-40 sm:px-6", fase.t === "isi" ? "-mt-16" : "pt-8")}>
        <main className={cn("mx-auto w-full", fase.t === "isi" ? "rounded-[28px] border border-border bg-card p-5 shadow-[0_30px_70px_-34px_rgba(28,40,22,.45)] sm:p-9" : "max-w-[640px]")}>
          {fase.t === "kirim" && (
            <Hasil ikon={<span className="h-10 w-10 animate-spin rounded-full border-4 border-border-strong border-t-primary" />} judul="Mengirim laporan…" teks="Mohon tunggu sebentar." />
          )}
          {fase.t === "gagal" && (
            <div className="pt-6">
              <div className="rounded-[20px] border-[1.5px] border-status-act-br bg-urgent-soft p-[18px]">
                <h2 className="flex items-center gap-2 text-[17px] font-extrabold text-status-act-fg">
                  {fase.offline ? <WifiOff size={20} /> : <Info size={20} />}{fase.offline ? "Gagal terkirim — koneksi terputus" : "Laporan belum bisa dikirim"}
                </h2>
                <p className="mt-2 text-[13.5px]">
                  {fase.offline
                    ? <>Tenang, laporan Anda <b>tersimpan di perangkat ini</b> dan akan dikirim ulang otomatis begitu sinyal kembali.</>
                    : fase.pesan}
                </p>
              </div>
              <button onClick={kirim} className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-extrabold text-primary-foreground">
                <RefreshCw size={19} />Coba kirim lagi
              </button>
              {!fase.offline && <button onClick={() => { setFase({ t: "isi" }); }} className="mt-2.5 w-full rounded-full border-[1.5px] border-border-strong py-3.5 text-sm font-bold">Periksa isian</button>}
              <a href="tel:112" className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-border-strong py-3.5 text-sm font-bold hover:no-underline"><PhoneCall size={17} />Darurat? Telepon 112</a>
            </div>
          )}
          {fase.t === "terkirim" && <Terkirim id={fase.id} barangGagal={fase.barangGagal} d={d} total={total} user={!!user} onBaru={mulaiBaru} />}

          {fase.t === "isi" && (
            <>
              {dipulihkan && (
                <div className="mb-4 flex items-center gap-2.5 rounded-[14px] bg-status-ver-bg px-3 py-2.5 text-[12.5px] font-semibold text-status-ver-fg">
                  <History size={16} className="shrink-0" />Draf {d.disimpan ? `pukul ${d.disimpan} ` : ""}dipulihkan
                  <button onClick={mulaiBaru} className="ml-auto font-extrabold underline">Mulai baru</button>
                </div>
              )}

              {d.step === 1 && (
                <section>
                  <Judul h="Apa yang terjadi?" p="Ketuk satu. Kalau tidak ada yang cocok, pilih Lainnya." />
                  <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {JENIS.map(([k, l]) => {
                      const Ikon = IKON_JENIS[k], on = d.jenis === k, w = WARNA_JENIS[k];
                      return (
                        <button key={k} onClick={() => ubah({ jenis: k })} aria-pressed={on}
                          style={on ? { borderColor: w, background: `${w}14`, boxShadow: `0 0 0 1px ${w}` } : undefined}
                          className={cn("relative flex min-h-[124px] flex-col justify-between gap-3 rounded-[20px] border-[1.5px] p-4 text-left transition hover:-translate-y-0.5",
                            on ? "" : "border-border bg-background hover:border-border-strong")}>
                          <span className="grid h-12 w-12 place-items-center rounded-2xl transition" style={on ? { background: w, color: "#fff" } : { background: `${w}1F`, color: w }}><Ikon size={24} /></span>
                          <b className="text-[15px] font-extrabold leading-tight tracking-[-0.01em]">{l}</b>
                          {on && <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full text-white" style={{ background: w }}><Check size={14} /></span>}
                        </button>
                      );
                    })}
                  </div>
                  {d.jenis === "lainnya" && (
                    <>
                      <Label hint="wajib untuk Lainnya" wajib>Bencana apa yang terjadi?</Label>
                      <input autoFocus className="h-[52px] w-full rounded-[14px] border-[1.5px] border-border-strong bg-card px-3.5 text-[14.5px] font-semibold outline-none focus:border-primary"
                        placeholder="Contoh: hujan abu, kekeringan, pohon tumbang" value={d.jenisLain} maxLength={60} onChange={e => ubah({ jenisLain: e.target.value })} />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {["Hujan abu", "Kekeringan", "Pohon tumbang", "Abrasi pantai", "Wabah penyakit"].map(c => (
                          <Chip key={c} on={d.jenisLain === c} onClick={() => ubah({ jenisLain: c })}>{c}</Chip>
                        ))}
                      </div>
                    </>
                  )}
                  <Label>Seberapa berbahaya?</Label>
                  <div className="space-y-2">
                    {BAHAYA.map(b => (
                      <button key={b.k} onClick={() => ubah({ bahaya: b.k })} aria-pressed={d.bahaya === b.k}
                        className={cn("flex min-h-[64px] w-full items-center gap-3 rounded-2xl border-[1.5px] px-3.5 py-3 text-left transition", d.bahaya === b.k ? "border-primary bg-primary-soft" : "border-border bg-background hover:border-border-strong")}>
                        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", b.warna)}><b.ikon size={20} /></span>
                        <span className="min-w-0"><b className="block text-[14.5px] font-extrabold">{b.l}</b><small className="block text-xs text-text2">{b.d}</small></span>
                        <span className={cn("ml-auto h-[22px] w-[22px] shrink-0 rounded-full border-2 border-border-strong", d.bahaya === b.k && "border-[7px] border-primary")} />
                      </button>
                    ))}
                  </div>
                  {d.bahaya === "jiwa" && (
                    <Catatan tone="urgent" icon={<PhoneCall size={15} />}>Jika ada nyawa terancam, <b>telepon 112 sekarang</b>. Lanjutkan laporan ini setelahnya.</Catatan>
                  )}
                </section>
              )}

              {d.step === 2 && (
                <section>
                  <Judul h="Di mana kejadiannya?" p="Pakai lokasi Anda, lalu geser pin ke titik kejadian kalau Anda tidak tepat di sana." />
                  {!d.gps ? (
                    <button onClick={cariGps} disabled={gpsStatus === "cari"} className="mt-4 flex h-[60px] w-full items-center justify-center gap-2.5 rounded-2xl bg-primary text-[15.5px] font-extrabold text-primary-foreground disabled:opacity-80">
                      {gpsStatus === "cari" ? <><span className="h-[18px] w-[18px] animate-spin rounded-full border-[2.5px] border-white/30 border-t-marigold" />Mencari sinyal GPS…</> : <><LocateFixed size={20} />Gunakan lokasi saya</>}
                    </button>
                  ) : (
                    <div className="mt-4 flex items-center gap-2.5 rounded-[14px] bg-status-done-bg px-3 py-2.5 text-[13px] font-bold text-status-done-fg">
                      <Check size={18} />Lokasi terkunci<span className="ml-auto font-mono text-[11.5px] font-medium">akurasi ±{d.akurasi} m</span>
                    </div>
                  )}
                  {gpsStatus === "gagal" && <Catatan tone="wait" icon={<Info size={15} />}>GPS tidak tersedia atau izinnya ditolak. Ketuk peta untuk memilih titik, atau cukup pilih kabupaten di bawah.</Catatan>}
                  <div className="mt-3">
                    <LokasiPicker titik={d.titik} gps={d.gps} akurasi={d.akurasi} onChange={t => ubah({ titik: t })} />
                    <div className="mt-2 flex flex-wrap justify-between gap-2 font-mono text-xs text-text2">
                      <span>{d.titik ? <>Titik <b className="text-foreground">{d.titik.lat.toFixed(5)}, {d.titik.lng.toFixed(5)}</b></> : "Ketuk peta untuk menaruh pin (opsional)"}</span>
                      {d.titik && d.gps && jarakMeter(d.gps, d.titik) > 15 && <span>pin digeser {jarakMeter(d.gps, d.titik)} m dari posisi Anda</span>}
                    </div>
                  </div>
                  <Label>Kabupaten / kota</Label>
                  <div className="flex flex-wrap gap-2">
                    {KABUPATEN.map(k => <Chip key={k} on={d.kabupaten === k} onClick={() => ubah({ kabupaten: d.kabupaten === k ? null : k })}>{k}</Chip>)}
                  </div>
                  <Label hint="opsional">Desa, banjar, atau patokan</Label>
                  <input className="h-[52px] w-full rounded-[14px] border-[1.5px] border-border-strong bg-card px-3.5 text-[14.5px] font-semibold outline-none focus:border-primary"
                    placeholder="Contoh: Banjar Kubu Kaja, dekat Pura Desa" value={d.detail} maxLength={200} onChange={e => ubah({ detail: e.target.value })} />
                  {!d.titik && <Catatan icon={<Info size={15} />}>Tanpa titik peta, laporan tetap terkirim dan tampil di peta pada titik perkiraan (pusat kabupaten).</Catatan>}
                </section>
              )}

              {d.step === 3 && (
                <section>
                  <Judul h="Foto & kondisi" p="Foto membantu verifikasi lebih cepat. Boleh dilewati." />
                  <div className="mt-4">
                    <PhotoUploadField label="Foto kejadian" urls={d.foto} onChange={u => ubah({ foto: u })} maxFiles={6} hint="Maks. 6 foto. Satu foto sudah cukup." />
                  </div>
                  <Label hint="pilih semua yang sesuai">Kondisi di lokasi</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {KONDISI.map(({ k, l, i: Ikon }) => {
                      const on = d.kondisi.includes(k);
                      return (
                        <button key={k} aria-pressed={on} onClick={() => setD(prev => ({ ...prev, disimpan: jam(), kondisi: prev.kondisi.includes(k) ? prev.kondisi.filter(x => x !== k) : [...prev.kondisi, k] }))}
                          className={cn("flex min-h-[56px] items-center gap-2.5 rounded-2xl border-[1.5px] px-3 py-2.5 text-left transition",
                            on ? "border-primary bg-primary-soft" : "border-border bg-background hover:border-border-strong")}>
                          <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", on ? "bg-primary text-primary-foreground" : "bg-muted")}><Ikon size={18} /></span>
                          <span className="min-w-0 flex-1 text-[13.5px] font-bold leading-tight">{l}</span>
                          {on && <Check size={16} className="shrink-0 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                  {d.kondisi.includes("mengungsi") && (
                    <>
                      <Label hint="opsional">Lokasi pengungsian</Label>
                      <input className="h-[52px] w-full rounded-[14px] border-[1.5px] border-border-strong bg-card px-3.5 text-[14.5px] font-semibold outline-none focus:border-primary"
                        placeholder="Contoh: Balai Banjar Kubu" value={d.pengungsian} maxLength={300} onChange={e => ubah({ pengungsian: e.target.value })} />
                    </>
                  )}
                  {catatanBuka || d.catatan ? (
                    <>
                      <Label hint="opsional">Catatan</Label>
                      <textarea rows={3} maxLength={1500} className="w-full resize-none rounded-[14px] border-[1.5px] border-border-strong bg-card px-3.5 py-3 text-[14.5px] outline-none focus:border-primary"
                        placeholder="Hal penting yang tidak ada di pilihan" value={d.catatan} onChange={e => ubah({ catatan: e.target.value })} />
                    </>
                  ) : (
                    <button onClick={() => setCatatanBuka(true)} className="mt-4 flex items-center gap-2 text-[13.5px] font-bold text-text2"><Plus size={16} />Tambah catatan (opsional)</button>
                  )}
                  <div className="mt-4 rounded-[14px] bg-muted px-3.5 py-3 text-[13px] leading-relaxed">
                    <small className="mb-1 block font-mono text-[10.5px] tracking-[0.1em] text-text2">DESKRIPSI OTOMATIS · DIKIRIM KE PETUGAS</small>
                    <span className="whitespace-pre-line">{susunDeskripsi(d)}</span>
                  </div>
                </section>
              )}

              {d.step === 4 && (
                <section>
                  <Judul h="Berapa orang terdampak?" p="Tekan + untuk tiap kelompok. Tidak tahu pasti? Isi perkiraan, petugas akan memperbaruinya." />
                  <div className="mt-4 rounded-[20px] bg-ink p-4 text-white">
                    <div className="flex items-end justify-between">
                      <div><small className="block text-[12.5px] text-on-ink">Total terdampak</small>
                        <b className="font-mono text-5xl font-semibold leading-[0.9] tracking-[-0.05em] text-marigold">{total}</b></div>
                      <span className="text-right text-xs text-on-ink-2">dihitung otomatis<br />{total ? `≈ ${Math.max(1, Math.round(total / 4))} KK` : "boleh 0 jika belum tahu"}</span>
                    </div>
                    <div className="mt-3.5 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-ink-line">
                      {total > 0 && KELOMPOK.map(g => d.korban[g.k] ? <i key={g.k} className="block h-full transition-[width]" style={{ width: `${(d.korban[g.k] / total) * 100}%`, background: g.c }} /> : null)}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[12.5px] font-semibold text-text2">
                    Tiap ketukan menambah
                    <div className="ml-auto flex rounded-full bg-muted p-[3px]" role="group" aria-label="Kelipatan tombol tambah">
                      {[1, 5, 10].map(n => (
                        <button key={n} onClick={() => setKelipatan(n)} aria-pressed={kelipatan === n}
                          className={cn("min-w-[44px] rounded-full px-3 py-[7px] font-mono text-xs font-semibold", kelipatan === n && "bg-primary text-marigold")}>+{n}</button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2.5 rounded-[18px] border border-border bg-card px-3">
                    {KELOMPOK.map(g => (
                      <div key={g.k} className="flex items-center gap-2.5 border-b border-border py-3 last:border-b-0">
                        <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl text-white" style={{ background: g.c }}><Pikto k={g.k} /></span>
                        <div className="min-w-0"><b className="block whitespace-nowrap text-sm font-extrabold">{g.l}</b><small className="font-mono text-[11px] text-text2">{g.u}</small></div>
                        <div className="ml-auto flex shrink-0 items-center gap-1">
                          <button aria-label={`Kurangi ${g.l}`} disabled={!d.korban[g.k]} onClick={() => ubahKorban(g.k, n => n - kelipatan)}
                            className="grid h-11 w-11 place-items-center rounded-xl border-[1.5px] border-border-strong bg-card disabled:opacity-35"><Minus size={18} /></button>
                          <input inputMode="numeric" aria-label={`Jumlah ${g.l}`} value={d.korban[g.k]} onFocus={e => e.target.select()}
                            onChange={e => { const v = parseInt(e.target.value.replace(/\D/g, ""), 10) || 0; ubahKorban(g.k, () => v); }}
                            className="h-11 w-[52px] rounded-[10px] bg-transparent text-center font-mono text-[21px] font-semibold outline-none focus:bg-muted" />
                          <button aria-label={`Tambah ${g.l}`} onClick={() => ubahKorban(g.k, n => n + kelipatan)}
                            className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Plus size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Catatan tone="ver" icon={<ShieldCheck size={15} />}>Hanya jumlah per kelompok, tanpa nama. Rincian ini dipakai admin untuk merencanakan bantuan, misalnya perlengkapan bayi atau kebutuhan lansia.</Catatan>
                </section>
              )}

              {d.step === 5 && (
                <LangkahBarang barang={d.barang} jenis={d.jenis} kondisi={d.kondisi} korban={d.korban}
                  onChange={f => setD(prev => ({ ...prev, barang: f(prev.barang), disimpan: jam() }))} />
              )}

              {d.step === AKHIR && (
                <section>
                  <Judul h="Kontak & kirim" p="Petugas menghubungi nomor ini bila perlu memastikan sesuatu." />
                  <Label hint="wajib" wajib>Nomor HP / WhatsApp</Label>
                  <div className="flex h-14 overflow-hidden rounded-[14px] border-[1.5px] border-border-strong bg-card focus-within:border-primary">
                    <span className="grid place-items-center border-r-[1.5px] border-border-strong bg-muted px-3 font-mono font-semibold">+62</span>
                    <input inputMode="tel" autoComplete="tel" placeholder="812 3456 7890" value={d.hp} maxLength={18}
                      onChange={e => ubah({ hp: e.target.value.replace(/[^\d ]/g, "") })}
                      className="w-full bg-transparent px-3 font-mono text-lg font-semibold tracking-[0.04em] outline-none" />
                  </div>
                  <Label hint='opsional — kosong tampil sebagai "Anonim"'>Nama</Label>
                  <input className="h-[52px] w-full rounded-[14px] border-[1.5px] border-border-strong bg-card px-3.5 text-[14.5px] font-semibold outline-none focus:border-primary"
                    placeholder="Anonim" value={d.nama} maxLength={100} onChange={e => ubah({ nama: e.target.value })} />
                  <div className="mt-5">
                    <KtpUploadField label="Foto KTP (opsional)" path={d.ktpPath} onChange={p => ubah({ ktpPath: p })}
                      hint="Mempercepat verifikasi identitas. Disimpan privat — hanya admin Pusdalops yang bisa membukanya, lewat tautan sementara." />
                  </div>
                  <Label>Periksa sebelum kirim</Label>
                  <div className="rounded-[18px] border border-border bg-card px-3.5">
                    <Ringkas k="Jenis" v={labelJenis(d.jenis, d.jenisLain)} s={BAHAYA.find(b => b.k === d.bahaya)?.l} onUbah={() => pindah(1)} />
                    <Ringkas k="Lokasi" v={lokasiTeks(d) || "—"} s={d.titik ? `${d.titik.lat.toFixed(5)}, ${d.titik.lng.toFixed(5)}` : "tanpa titik peta"} mono onUbah={() => pindah(2)} />
                    <Ringkas k="Foto" v={d.foto.length ? `${d.foto.length} foto` : "Tanpa foto"} s={`${d.kondisi.length} kondisi dipilih`} onUbah={() => pindah(3)} />
                    <Ringkas k="Warga" v={`${total} orang`} s={KELOMPOK.filter(g => d.korban[g.k]).map(g => `${g.l.split(" ")[0]} ${d.korban[g.k]}`).join(" · ") || "belum diisi"} onUbah={() => pindah(4)} />
                    <Ringkas k="Barang" v={d.barang.length ? `${d.barang.length} barang diminta` : "Tidak ada"} s={d.barang.length ? ringkasBarang(d.barang) : undefined} onUbah={() => pindah(5)} />
                    <Ringkas k="Pelapor" v={d.nama.trim() || "Anonim"} />
                  </div>
                  <button onClick={() => ubah({ setuju: !d.setuju })} aria-pressed={d.setuju} className="mt-3.5 flex w-full items-start gap-3 text-left text-[13px]">
                    <span className={cn("grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg border-2", d.setuju ? "border-primary bg-primary text-marigold" : "border-border-strong bg-card text-transparent")}><Check size={16} /></span>
                    Saya menyatakan laporan ini benar. Laporan palsu dapat dikenai sanksi hukum.
                  </button>
                </section>
              )}
            </>
          )}
        </main>

      </div>

      {fase.t === "isi" && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card">
          <div className="mx-auto flex max-w-[880px] items-center gap-3 px-4 pb-4 pt-3 sm:px-6">
            <div className="hidden min-w-0 flex-1 text-xs text-text2 sm:block lg:max-w-none">
              {halangan ? <span className="flex items-center gap-1.5"><Info size={13} />{halangan}</span> : d.disimpan ? `Draf tersimpan otomatis · ${d.disimpan}` : "Draf tersimpan otomatis di perangkat"}
            </div>
            {d.step > 1 && (
              <button onClick={() => pindah(d.step - 1)} className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-[1.5px] border-border-strong" aria-label="Langkah sebelumnya"><ChevronLeft size={22} /></button>
            )}
            <div className="flex flex-1 flex-col sm:max-w-[340px]">
              <button onClick={lanjut} disabled={!!halangan}
                className={cn("flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-extrabold disabled:bg-border-strong disabled:text-text2",
                  d.step === AKHIR ? "bg-urgent text-urgent-foreground" : "bg-primary text-primary-foreground")}>
                {d.step === AKHIR ? <><Send size={19} />Kirim laporan</> : <>Lanjut <ArrowRight size={19} /></>}
              </button>
              <span className="mt-1.5 text-center text-xs text-text2 sm:hidden">{halangan || (d.disimpan ? `Draf tersimpan · ${d.disimpan}` : "Draf tersimpan otomatis")}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Terkirim({ id, barangGagal, d, total, user, onBaru }: { id: number; barangGagal: boolean; d: Draft; total: number; user: boolean; onBaru: () => void }) {
  return (
    <div className="flex flex-col items-center pt-8 text-center">
      <div className="grid h-[88px] w-[88px] place-items-center rounded-full bg-status-done-bg text-status-done-fg"><Check size={42} /></div>
      <h1 className="mt-[18px] text-[28px] font-extrabold leading-[1.05] tracking-[-0.04em]">Laporan diterima.</h1>
      <p className="mt-2 max-w-[340px] text-sm text-text2">Petugas Pusdalops akan memverifikasi dan bisa menghubungi {nomorHp(d.hp)} bila perlu.</p>
      <div className="mt-4 font-mono text-[22px] font-semibold tracking-[0.02em]">LPR-{String(id).padStart(4, "0")}</div>
      <StatusBadge status="menunggu" className="mt-2.5" />
      <div className="mt-5 w-full rounded-[18px] border border-border bg-card px-3.5 text-left">
        <Ringkas k="Kejadian" v={labelJenis(d.jenis, d.jenisLain)} s={lokasiTeks(d)} />
        <Ringkas k="Warga" v={`${total} orang`} s={KELOMPOK.filter(g => d.korban[g.k]).map(g => `${g.l.split(" ")[0]} ${d.korban[g.k]}`).join(" · ") || "belum diisi"} />
        {d.barang.length > 0 && <Ringkas k="Barang" v={`${d.barang.length} barang diminta`} s={ringkasBarang(d.barang)} />}
      </div>
      {barangGagal && (
        <Catatan tone="wait" icon={<Info size={15} />}>Laporan terkirim, tetapi daftar barang gagal tersimpan. Sebutkan barang yang dibutuhkan saat petugas menghubungi Anda.</Catatan>
      )}
      <Catatan icon={<Info size={15} />}>Laporan tampil di peta dan daftar publik setelah diverifikasi admin, untuk mencegah titik palsu. Simpan nomor laporan di atas.</Catatan>
      <div className="mt-5 flex w-full flex-col gap-2.5">
        {user && <Link href={`/pelapor/laporan/${id}`} className="flex h-14 items-center justify-center rounded-2xl bg-primary font-extrabold text-primary-foreground hover:no-underline">Lacak status laporan</Link>}
        <Link href={user ? "/pelapor" : "/"} className={cn("flex h-14 items-center justify-center rounded-2xl font-extrabold hover:no-underline", user ? "border-[1.5px] border-border-strong" : "bg-primary text-primary-foreground")}>
          {user ? "Ke dashboard" : "Kembali ke beranda"}
        </Link>
        <button onClick={onBaru} className="py-2 text-sm font-bold text-text2 underline">Buat laporan lain</button>
      </div>
    </div>
  );
}

function Judul({ h, p }: { h: string; p: string }) {
  return (<><h2 className="text-[24px] font-extrabold leading-[1.1] tracking-[-0.035em] sm:text-[28px]">{h}</h2><p className="mt-1.5 text-[14.5px] text-text2">{p}</p></>);
}

function Label({ children, hint, wajib }: { children: React.ReactNode; hint?: string; wajib?: boolean }) {
  return (
    <div className="mb-2.5 mt-7 flex items-baseline justify-between gap-3">
      <span className="text-[15px] font-extrabold tracking-[-0.01em]">{children}</span>
      {hint && <em className={cn("text-xs font-semibold not-italic text-text2", wajib && "text-urgent")}>{hint}</em>}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={on}
      className={cn("inline-flex min-h-11 items-center gap-1.5 rounded-full border-[1.5px] px-4 py-2 text-[13.5px] font-bold transition",
        on ? "border-primary bg-primary-soft text-primary" : "border-border bg-card text-text2 hover:border-border-strong hover:text-foreground")}>
      {on && <Check size={15} />}{children}
    </button>
  );
}

function Catatan({ children, icon, tone }: { children: React.ReactNode; icon: React.ReactNode; tone?: "urgent" | "wait" | "ver" }) {
  const c = tone === "urgent" ? "bg-urgent-soft text-status-act-fg" : tone === "wait" ? "bg-status-wait-bg text-status-wait-fg" : tone === "ver" ? "bg-status-ver-bg text-status-ver-fg" : "bg-muted text-text2";
  return <div className={cn("mt-3 flex gap-2 rounded-xl px-3 py-2.5 text-left text-xs leading-[1.45]", c)}><span className="mt-px shrink-0">{icon}</span><span>{children}</span></div>;
}

function Ringkas({ k, v, s, mono, onUbah }: { k: string; v: string; s?: string; mono?: boolean; onUbah?: () => void }) {
  return (
    <div className="flex items-start gap-2.5 border-b border-border py-3 last:border-b-0">
      <span className="w-[66px] shrink-0 pt-0.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-text2">{k}</span>
      <span className="min-w-0 flex-1 text-[13.5px] font-semibold">{v}{s && <small className={cn("mt-0.5 block text-xs font-medium text-text2", mono && "font-mono")}>{s}</small>}</span>
      {onUbah && <button onClick={onUbah} className="shrink-0 pl-1.5 text-[12.5px] font-extrabold underline">Ubah</button>}
    </div>
  );
}

function Hasil({ ikon, judul, teks }: { ikon: React.ReactNode; judul: string; teks: string }) {
  return (
    <div className="flex flex-col items-center pt-10 text-center">
      <div className="grid h-[88px] w-[88px] place-items-center rounded-full bg-muted">{ikon}</div>
      <h2 className="mt-[18px] text-[26px] font-extrabold tracking-[-0.04em]">{judul}</h2>
      <p className="mt-2 text-sm text-text2">{teks}</p>
    </div>
  );
}
