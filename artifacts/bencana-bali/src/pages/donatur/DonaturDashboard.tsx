import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, Banknote, Check, CheckCircle2, ChevronRight, Copy, HandHeart, Home, Loader2, MapPin,
  Minus, Package, Plus, QrCode, Search, Truck, Users, Wallet, EyeOff,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { FotoBencana } from "@/components/Ilustrasi";
import { KorbanRincian } from "@/components/KorbanRincian";
import { PhotoUploadField } from "@/components/PhotoUploadField";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah, formatRupiahRingkas, JENIS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

// Donasi — redesign 2026. Satu halaman dengan tiga tampilan: daftar lokasi →
// detail lokasi → alur donasi bertahap (uang atau barang) → sukses. Data dari
// GET /donatur/bencana-aktif; donasi lewat POST /donasi (satu baris per jenis
// barang, sama seperti mobile). Nama tampil di publik sesuai pilihan anonim.

const BASE = import.meta.env.VITE_API_URL.replace(/\/$/, "");
const NOMINAL = [50000, 100000, 250000, 500000, 1000000, 2000000];
const PESAN_CEPAT = ["Semoga lekas pulih", "Tetap semangat, Bali!", "Doa terbaik dari jauh"];
const PHONE_REGEX = /^(?:\+62|62|0)8[1-9][0-9]{6,10}$/;
const REKENING = { bank: "BNI", nomor: "012 345 6789", nama: "BPBD Provinsi Bali" };

async function fetchBencanaAktif() {
  const res = await fetch(`${BASE}/api/donatur/bencana-aktif`, { credentials: "include" });
  if (!res.ok) throw new Error("Gagal memuat lokasi");
  return res.json();
}

async function kirimDonasi(data: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/donasi`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? "Gagal mengirim donasi. Coba lagi.");
  return json as { id: number };
}

const pctDana = (b: any) => (b.target_dana > 0 ? Math.min(100, Math.round(((b.total_dana_terkumpul || 0) / b.target_dana) * 100)) : null);
const sisa = (k: any) => Math.max(0, (k.jumlah_dibutuhkan || 0) - (k.jumlah_terpenuhi || 0));
// "Mendesak" diturunkan dari data nyata: dana < 20% target, atau ada kebutuhan < 30% terpenuhi.
const mendesak = (b: any) => {
  const p = pctDana(b);
  return (p != null && p < 20) || (b.kebutuhan ?? []).some((k: any) => k.jumlah_dibutuhkan > 0 && k.jumlah_terpenuhi / k.jumlah_dibutuhkan < 0.3);
};

type Tampilan =
  | { t: "daftar" }
  | { t: "detail"; id: number }
  | { t: "donasi"; id: number; jenis: "dana" | "barang"; kebutuhanAwal?: number }
  | { t: "sukses"; id: number; jenis: "dana" | "barang"; ids: number[]; ringkas: string };

export default function DonaturDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: bencana = [], isLoading } = useQuery<any[]>({ queryKey: ["donatur-bencana-aktif"], queryFn: fetchBencanaAktif });
  const [tampil, setTampil] = useState<Tampilan>({ t: "daftar" });
  const pindah = (v: Tampilan) => { setTampil(v); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const lokasi = "id" in tampil ? bencana.find(b => b.id === tampil.id) : null;

  return (
    <AppLayout
      title={tampil.t === "daftar" ? "Donasi" : lokasi?.judul ?? "Donasi"}
      subtitle={tampil.t === "daftar" ? "Pilih lokasi terdampak" : lokasi?.lokasi}
      backHref={tampil.t === "daftar" ? "/" : undefined}
      backLabel="Beranda"
      role="donatur"
    >
      {tampil.t === "daftar" && <Daftar bencana={bencana} loading={isLoading} nama={user?.nama ?? ""} onBuka={id => pindah({ t: "detail", id })} onDonasi={id => pindah({ t: "donasi", id, jenis: "dana" })} />}
      {tampil.t === "detail" && lokasi && <Detail b={lokasi} onKembali={() => pindah({ t: "daftar" })} onDonasi={(jenis, k) => pindah({ t: "donasi", id: lokasi.id, jenis, kebutuhanAwal: k })} />}
      {tampil.t === "donasi" && lokasi && (
        <AlurDonasi key={`${lokasi.id}-${tampil.jenis}`} b={lokasi} jenis={tampil.jenis} kebutuhanAwal={tampil.kebutuhanAwal} namaAwal={user?.nama ?? ""}
          onBatal={() => pindah({ t: "detail", id: lokasi.id })}
          onSelesai={(ids, ringkas) => { queryClient.invalidateQueries({ queryKey: ["donatur-bencana-aktif"] }); pindah({ t: "sukses", id: lokasi.id, jenis: tampil.jenis, ids, ringkas }); }} />
      )}
      {tampil.t === "sukses" && lokasi && <Sukses b={lokasi} jenis={tampil.jenis} ids={tampil.ids} ringkas={tampil.ringkas} onLagi={() => pindah({ t: "daftar" })} />}
      {"id" in tampil && !lokasi && !isLoading && (
        <div className="py-20 text-center text-text2">Lokasi tidak ditemukan. <button className="font-bold underline" onClick={() => pindah({ t: "daftar" })}>Kembali</button></div>
      )}
    </AppLayout>
  );
}

/* ------------------------------ Daftar lokasi ------------------------------ */
function Daftar({ bencana, loading, nama, onBuka, onDonasi }: { bencana: any[]; loading: boolean; nama: string; onBuka: (id: number) => void; onDonasi: (id: number) => void }) {
  const [jenis, setJenis] = useState("semua");
  const [urut, setUrut] = useState<"mendesak" | "terbaru" | "terdampak">("mendesak");
  const [cari, setCari] = useState("");
  const jenisAda = [...new Set(bencana.map(b => b.jenis_bencana))];
  const total = bencana.reduce((s, b) => s + (b.total_dana_terkumpul || 0), 0);
  const nMendesak = bencana.filter(mendesak).length;

  const list = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return bencana
      .filter(b => jenis === "semua" || b.jenis_bencana === jenis)
      .filter(b => !q || `${b.judul} ${b.lokasi}`.toLowerCase().includes(q))
      .sort((a, b) => urut === "terbaru" ? +new Date(b.created_at) - +new Date(a.created_at)
        : urut === "terdampak" ? (b.jumlah_terdampak || 0) - (a.jumlah_terdampak || 0)
        : Number(mendesak(b)) - Number(mendesak(a)) || (pctDana(a) ?? 100) - (pctDana(b) ?? 100));
  }, [bencana, jenis, urut, cari]);

  return (
    <div className="space-y-7">
      <section className="grid gap-6 rounded-[28px] bg-ink p-6 text-on-ink sm:p-8 lg:grid-cols-[1.4fr_1fr] dark:border dark:border-ink-line">
        <div>
          <span className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-on-ink-2">Halo, {nama.split(" ")[0] || "donatur"}</span>
          <h1 className="mt-2 text-[clamp(30px,4vw,46px)] font-extrabold leading-[1.02] tracking-[-0.045em] text-white">Bantu lokasi yang <span className="text-marigold">paling membutuhkan.</span></h1>
          <p className="mt-3 max-w-md text-sm">Pilih lokasi, lihat kebutuhannya per item, lalu donasi uang atau barang. Semua tercatat terbuka di halaman Transparansi.</p>
        </div>
        <div className="grid grid-cols-3 gap-px self-end overflow-hidden rounded-2xl border border-ink-line bg-ink-line">
          {[["Lokasi aktif", String(bencana.length), false], ["Mendesak", String(nMendesak), true], ["Dana diterima", formatRupiahRingkas(total), false]].map(([k, v, g]) => (
            <div key={String(k)} className="bg-ink px-3.5 py-3.5">
              <b className={cn("block font-mono text-[22px] font-semibold leading-none tracking-[-0.03em] sm:text-[26px]", g ? "text-marigold" : "text-white")}>{loading ? "—" : v}</b>
              <small className="mt-1.5 block text-xs text-on-ink-2">{k}</small>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-full border-[1.5px] border-border-strong bg-card px-4 focus-within:border-primary sm:max-w-xs">
          <Search size={16} className="text-text2" />
          <input value={cari} onChange={e => setCari(e.target.value)} placeholder="Cari desa atau kejadian" className="w-full bg-transparent text-sm outline-none" />
        </label>
        {["semua", ...jenisAda].map(j => (
          <button key={j} onClick={() => setJenis(j)} aria-pressed={jenis === j}
            className={cn("rounded-full border-[1.5px] px-4 py-2 text-[13px] font-bold", jenis === j ? "border-primary bg-primary text-primary-foreground" : "border-border-strong")}>
            {j === "semua" ? "Semua" : JENIS_LABELS[j] ?? j}
          </button>
        ))}
        <select value={urut} onChange={e => setUrut(e.target.value as typeof urut)} className="ml-auto h-11 rounded-full border-[1.5px] border-border-strong bg-card px-4 text-[13px] font-bold">
          <option value="mendesak">Paling mendesak</option>
          <option value="terbaru">Terbaru</option>
          <option value="terdampak">Terdampak terbanyak</option>
        </select>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-[440px] rounded-3xl" />)}</div>
      ) : list.length === 0 ? (
        <div className="rounded-3xl border-[1.5px] border-dashed border-border-strong px-5 py-16 text-center text-text2">Tidak ada lokasi yang cocok.</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(b => {
            const p = pctDana(b), butuh = (b.kebutuhan ?? []).filter((k: any) => sisa(k) > 0);
            return (
              <article key={b.id} className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-shadow hover:shadow-[0_18px_40px_-24px_rgba(14,27,46,.45)]">
                <button onClick={() => onBuka(b.id)} className="relative block aspect-[16/10] overflow-hidden text-left" aria-label={`Lihat ${b.judul}`}>
                  {b.foto_urls?.[0] ? <img src={b.foto_urls[0]} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <FotoBencana jenis={b.jenis_bencana} label={false} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" />}
                  {mendesak(b) && <span className="absolute right-3 top-3 rounded-full bg-urgent px-2.5 py-1 text-xs font-bold text-white">Mendesak</span>}
                </button>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text2">
                    <span className="font-semibold text-foreground">{JENIS_LABELS[b.jenis_bencana] ?? b.jenis_bencana}</span>
                    {!b.foto_urls?.[0] && <><span>·</span><span>foto ilustrasi</span></>}
                  </div>
                  <h3 className="mt-2 line-clamp-2 min-h-[2.3em] text-[20px] font-extrabold leading-[1.15] tracking-[-0.035em]">{b.judul}</h3>
                  <span className="mt-1.5 flex items-center gap-1.5 text-[13px] text-text2"><MapPin size={14} className="shrink-0" /><span className="truncate">{b.lokasi}</span></span>
                  <div className="mt-5 rounded-2xl bg-muted/60 p-3.5">
                    <div className="flex items-baseline justify-between">
                      <b className="font-mono text-[17px] font-semibold">{formatRupiahRingkas(b.total_dana_terkumpul || 0)}</b>
                      <span className="text-[12.5px] text-text2">{p != null ? `${p}% dari ${formatRupiahRingkas(b.target_dana)}` : "target belum ditetapkan"}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-card"><i className="block h-full rounded-full bg-primary" style={{ width: `${p ?? 0}%` }} /></div>
                    <div className="mt-3 flex gap-4 text-[12.5px] text-text2">
                      {b.jumlah_terdampak ? <span className="flex items-center gap-1.5"><Users size={14} />{b.jumlah_terdampak.toLocaleString("id-ID")} jiwa</span> : null}
                      <span className="flex items-center gap-1.5"><Package size={14} />{butuh.length} kebutuhan terbuka</span>
                    </div>
                  </div>
                  <div className="mt-3 flex min-h-[28px] flex-wrap gap-1.5">
                    {butuh.slice(0, 2).map((k: any) => <span key={k.id} className="rounded-full border border-border px-2.5 py-1 text-[12px] font-semibold">{k.nama_item}</span>)}
                    {butuh.length > 2 && <span className="px-1.5 py-1 text-[12px] font-semibold text-text2">+{butuh.length - 2} lagi</span>}
                  </div>
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                    <button onClick={() => onBuka(b.id)} className="rounded-full border-[1.5px] border-border-strong py-2.5 text-[13px] font-bold hover:border-foreground">Detail</button>
                    <button onClick={() => onDonasi(b.id)} className="flex items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-[13px] font-bold text-primary-foreground hover:bg-primary-hover">
                      <HandHeart size={15} />Donasi
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Detail lokasi ------------------------------ */
function Detail({ b, onKembali, onDonasi }: { b: any; onKembali: () => void; onDonasi: (jenis: "dana" | "barang", kebutuhanId?: number) => void }) {
  const p = pctDana(b);
  const keb: any[] = b.kebutuhan ?? [];
  return (
    <div>
      <button onClick={onKembali} className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-text2 hover:text-foreground"><ArrowLeft size={16} />Semua lokasi</button>
      <div className="grid items-start gap-7 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-6">
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl">
            {b.foto_urls?.[0] ? <img src={b.foto_urls[0]} alt={`Foto dokumentasi ${b.judul}`} className="h-full w-full object-cover" /> : <FotoBencana jenis={b.jenis_bencana} className="h-full w-full" />}
            {mendesak(b) && <span className="absolute left-4 top-4 rounded-md bg-urgent px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white">Mendesak</span>}
          </div>
          {b.foto_urls?.length > 1 && (
            <div className="grid grid-cols-4 gap-2.5">{b.foto_urls.slice(1, 5).map((u: string) => <img key={u} src={u} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />)}</div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2"><StatusBadge status={b.status} /><span className="font-mono text-xs text-text2">{JENIS_LABELS[b.jenis_bencana] ?? b.jenis_bencana}</span></div>
            <h1 className="mt-3 text-[clamp(28px,3.4vw,40px)] font-extrabold leading-[1.05] tracking-[-0.045em]">{b.judul}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-text2"><MapPin size={15} />{b.lokasi}</p>
            <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed">{b.kronologi || b.deskripsi}</p>
          </div>
          <KorbanRincian laporan={b} />

          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">Kebutuhan di lokasi</h2>
              <span className="text-xs text-text2">dicatat relawan · progres bertambah setelah donasi diterima admin</span>
            </div>
            {keb.length === 0 ? (
              <div className="rounded-3xl border-[1.5px] border-dashed border-border-strong px-5 py-10 text-center text-sm text-text2">Relawan belum mencatat kebutuhan per item. Donasi uang tetap bisa disalurkan.</div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-border bg-card">
                {keb.map(k => {
                  const kp = Math.min(100, Math.round(((k.jumlah_terpenuhi || 0) / Math.max(1, k.jumlah_dibutuhkan)) * 100));
                  const s = sisa(k);
                  return (
                    <div key={k.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-4 last:border-b-0">
                      <div className="min-w-0 flex-1 basis-60">
                        <div className="flex items-baseline justify-between gap-3">
                          <b className="text-[15px]">{k.nama_item}</b>
                          <span className="font-mono text-xs text-text2"><b className="font-semibold text-foreground">{(k.jumlah_terpenuhi || 0).toLocaleString("id-ID")}</b> / {k.jumlah_dibutuhkan.toLocaleString("id-ID")} {k.satuan}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><i className={cn("block h-full rounded-full", kp < 30 ? "bg-urgent" : kp >= 100 ? "bg-status-done-fg" : "bg-primary")} style={{ width: `${kp}%` }} /></div>
                      </div>
                      {s > 0 ? (
                        <button onClick={() => onDonasi("barang", k.id)} className="rounded-full border-[1.5px] border-border-strong px-3.5 py-2 text-[12.5px] font-bold hover:border-foreground">Bantu barang ini</button>
                      ) : <StatusBadge status="selesai" label="Terpenuhi" />}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-3xl border border-border bg-card p-5">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-text2">Dana diterima</span>
            <b className="mt-1 block font-mono text-[34px] font-semibold leading-none tracking-[-0.04em]">{formatRupiah(b.total_dana_terkumpul || 0)}</b>
            {p != null && <>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted"><i className="block h-full rounded-full bg-primary" style={{ width: `${p}%` }} /></div>
              <p className="mt-2 text-xs text-text2"><b className="text-foreground">{p}%</b> dari target {formatRupiah(b.target_dana)}</p>
            </>}
            <div className="mt-5 grid gap-2">
              <button onClick={() => onDonasi("dana")} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-extrabold text-primary-foreground hover:bg-primary-hover"><Banknote size={20} />Donasi uang</button>
              <button onClick={() => onDonasi("barang")} className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-border-strong text-base font-extrabold hover:border-foreground"><Package size={20} />Donasi barang</button>
            </div>
          </div>
          <div className="space-y-3 rounded-3xl bg-muted p-5 text-sm">
            {b.koordinator && <p><span className="block font-mono text-[10.5px] uppercase tracking-[0.1em] text-text2">Koordinator lapangan</span><b>{b.koordinator}</b></p>}
            {b.lokasi_pengungsian && <p><span className="block font-mono text-[10.5px] uppercase tracking-[0.1em] text-text2">Lokasi pengungsian</span><b>{b.lokasi_pengungsian}</b></p>}
            <p className="text-xs text-text2">Setiap donasi diperiksa admin Pusdalops sebelum dihitung, lalu tampil di halaman <Link href="/transparansi" className="font-bold text-foreground underline">Transparansi</Link>.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------ Alur donasi ------------------------------ */
type Item = { kebutuhanId: number | null; nama: string; jumlah: number; satuan: string };

function AlurDonasi({ b, jenis, kebutuhanAwal, namaAwal, onBatal, onSelesai }: {
  b: any; jenis: "dana" | "barang"; kebutuhanAwal?: number; namaAwal: string;
  onBatal: () => void; onSelesai: (ids: number[], ringkas: string) => void;
}) {
  const keb: any[] = (b.kebutuhan ?? []).filter((k: any) => sisa(k) > 0);
  const [step, setStep] = useState(1);
  const [nominal, setNominal] = useState<number | null>(100000);
  const [nominalLain, setNominalLain] = useState("");
  const [items, setItems] = useState<Record<number, number>>(() => (kebutuhanAwal ? { [kebutuhanAwal]: 1 } : {}));
  const [lain, setLain] = useState({ nama: "", jumlah: "" });
  const [nama, setNama] = useState(namaAwal);
  const [anonim, setAnonim] = useState(false);
  const [hp, setHp] = useState("");
  const [pesan, setPesan] = useState("");
  const [metode, setMetode] = useState<"transfer" | "qris" | "ewallet">("transfer");
  const [bukti, setBukti] = useState<string[]>([]);
  const [serah, setSerah] = useState<"antar" | "jemput">("antar");
  const [alamatJemput, setAlamatJemput] = useState("");
  const [kirim, setKirim] = useState(false);
  const [galat, setGalat] = useState("");
  const [salin, setSalin] = useState(false);

  useEffect(() => { setGalat(""); }, [step]);

  const jumlahDana = nominalLain ? parseInt(nominalLain.replace(/\D/g, ""), 10) || 0 : nominal ?? 0;
  const daftarItem: Item[] = [
    ...Object.entries(items).filter(([, q]) => q > 0).map(([id, q]) => {
      const k = keb.find(x => x.id === Number(id));
      return { kebutuhanId: Number(id), nama: k?.nama_item ?? "Barang", jumlah: q, satuan: k?.satuan ?? "" };
    }),
    ...(lain.nama.trim() && parseInt(lain.jumlah, 10) > 0 ? [{ kebutuhanId: null, nama: lain.nama.trim(), jumlah: parseInt(lain.jumlah, 10), satuan: "" }] : []),
  ];

  const LANGKAH = jenis === "dana" ? ["Nominal", "Data Anda", "Pembayaran"] : ["Pilih barang", "Data & penyerahan", "Periksa"];
  const halangan =
    step === 1 ? (jenis === "dana" ? (jumlahDana < 10000 ? "Minimal donasi Rp 10.000" : "") : daftarItem.length === 0 ? "Pilih minimal satu barang" : "")
    : step === 2 ? (nama.trim().length < 2 ? "Isi nama Anda" : !PHONE_REGEX.test(hp.replace(/[\s-]/g, "")) ? "Nomor HP belum valid" : jenis === "barang" && serah === "jemput" && alamatJemput.trim().length < 8 ? "Isi alamat penjemputan" : "")
    : "";

  const ubahItem = (id: number, d: number) => setItems(prev => {
    const k = keb.find(x => x.id === id);
    const n = Math.max(0, Math.min(sisa(k) || 9999, (prev[id] ?? 0) + d));
    return { ...prev, [id]: n };
  });

  async function konfirmasi() {
    setKirim(true); setGalat("");
    const dasar = { laporan_id: b.id, nama_donatur: nama.trim(), kontak_donatur: hp.trim(), tampilkan_nama: !anonim };
    try {
      if (jenis === "dana") {
        const r = await kirimDonasi({ ...dasar, jenis: "dana", jumlah_dana: jumlahDana, pesan: pesan.trim() || null, bukti_transfer_url: bukti[0] ?? null });
        onSelesai([r.id], formatRupiah(jumlahDana));
      } else {
        const serahTeks = serah === "antar" ? "Diantar sendiri ke posko" : `Minta dijemput: ${alamatJemput.trim()}`;
        const ids: number[] = [];
        for (const it of daftarItem) {
          const r = await kirimDonasi({ ...dasar, jenis: "barang", nama_barang: it.nama, jumlah_barang: it.jumlah, kebutuhan_id: it.kebutuhanId ?? undefined, pesan: [serahTeks, pesan.trim()].filter(Boolean).join(" · ") });
          ids.push(r.id);
        }
        onSelesai(ids, `${daftarItem.length} jenis barang`);
      }
    } catch (e) {
      setGalat((e as Error).message);
    } finally {
      setKirim(false);
    }
  }

  const lanjut = () => { if (halangan) { setGalat(halangan); return; } step < 3 ? setStep(step + 1) : konfirmasi(); };

  return (
    <div className="grid items-start gap-7 lg:grid-cols-[1.5fr_1fr]">
      <div>
        <button onClick={step === 1 ? onBatal : () => setStep(step - 1)} className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-text2 hover:text-foreground">
          <ArrowLeft size={16} />{step === 1 ? "Kembali ke lokasi" : "Langkah sebelumnya"}
        </button>
        <ol className="mb-6 grid grid-cols-3 gap-2">
          {LANGKAH.map((l, i) => (
            <li key={l} className="min-w-0">
              <i className={cn("block h-1.5 rounded-full", i + 1 < step ? "bg-primary" : i + 1 === step ? "bg-marigold" : "bg-border")} />
              <span className={cn("mt-2 block truncate text-xs font-bold", i + 1 === step ? "text-foreground" : "text-text2")}>{i + 1}. {l}</span>
            </li>
          ))}
        </ol>

        <div className="rounded-3xl border border-border bg-card p-5 sm:p-7">
          {/* ---------- DANA ---------- */}
          {jenis === "dana" && step === 1 && (
            <section>
              <Judul h="Berapa yang ingin Anda donasikan?" p="Pilih nominal atau tulis sendiri. Seluruh dana dicatat terbuka." />
              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {NOMINAL.map(n => (
                  <button key={n} onClick={() => { setNominal(n); setNominalLain(""); }} aria-pressed={!nominalLain && nominal === n}
                    className={cn("rounded-2xl border-2 px-4 py-4 text-left transition", !nominalLain && nominal === n ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground")}>
                    <small className="block font-mono text-[11px] opacity-70">Rp</small>
                    <b className="font-mono text-[22px] font-semibold tracking-[-0.03em]">{n.toLocaleString("id-ID")}</b>
                  </button>
                ))}
              </div>
              <Label>Nominal lain</Label>
              <div className="flex h-14 items-center gap-2 rounded-2xl border-[1.5px] border-border-strong px-4 focus-within:border-primary">
                <span className="font-mono font-semibold text-text2">Rp</span>
                <input inputMode="numeric" value={nominalLain} placeholder="Tulis nominal"
                  onChange={e => { const v = e.target.value.replace(/\D/g, ""); setNominalLain(v ? parseInt(v, 10).toLocaleString("id-ID") : ""); }}
                  className="w-full bg-transparent font-mono text-lg font-semibold outline-none" />
              </div>
            </section>
          )}

          {/* ---------- BARANG ---------- */}
          {jenis === "barang" && step === 1 && (
            <section>
              <Judul h="Barang apa yang ingin Anda kirim?" p="Pilih dari kebutuhan yang dicatat relawan — paling tepat sasaran." />
              {keb.length > 0 ? (
                <div className="mt-5 space-y-2.5">
                  {keb.map(k => {
                    const q = items[k.id] ?? 0;
                    return (
                      <div key={k.id} className={cn("flex items-center gap-3 rounded-2xl border-2 px-4 py-3", q > 0 ? "border-primary" : "border-border")}>
                        <span className="min-w-0 flex-1"><b className="block text-[15px]">{k.nama_item}</b><small className="text-xs text-text2">masih dibutuhkan {sisa(k).toLocaleString("id-ID")} {k.satuan}</small></span>
                        <div className="flex items-center gap-1">
                          <button aria-label={`Kurangi ${k.nama_item}`} disabled={!q} onClick={() => ubahItem(k.id, -1)} className="grid h-11 w-11 place-items-center rounded-xl border-[1.5px] border-border-strong disabled:opacity-35"><Minus size={18} /></button>
                          <input inputMode="numeric" aria-label={`Jumlah ${k.nama_item}`} value={q} onFocus={e => e.target.select()}
                            onChange={e => { const v = parseInt(e.target.value.replace(/\D/g, ""), 10) || 0; setItems(p => ({ ...p, [k.id]: Math.min(sisa(k), v) })); }}
                            className="h-11 w-14 rounded-lg bg-transparent text-center font-mono text-lg font-semibold outline-none focus:bg-muted" />
                          <button aria-label={`Tambah ${k.nama_item}`} onClick={() => ubahItem(k.id, 1)} className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Plus size={18} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="mt-5 rounded-2xl bg-muted px-4 py-3 text-sm text-text2">Belum ada kebutuhan per item. Tulis barang yang ingin Anda kirim di bawah.</p>}
              <Label hint="opsional">Barang lain</Label>
              <div className="grid grid-cols-[1fr_110px] gap-2">
                <input value={lain.nama} onChange={e => setLain(v => ({ ...v, nama: e.target.value }))} maxLength={80} placeholder="Nama barang" className="h-12 rounded-2xl border-[1.5px] border-border-strong bg-card px-4 text-sm font-semibold outline-none focus:border-primary" />
                <input value={lain.jumlah} inputMode="numeric" onChange={e => setLain(v => ({ ...v, jumlah: e.target.value.replace(/\D/g, "") }))} placeholder="Jumlah" className="h-12 rounded-2xl border-[1.5px] border-border-strong bg-card px-4 font-mono text-sm font-semibold outline-none focus:border-primary" />
              </div>
            </section>
          )}

          {/* ---------- DATA ANDA ---------- */}
          {step === 2 && (
            <section>
              <Judul h="Data Anda" p="Untuk konfirmasi donasi. Nomor HP tidak pernah tampil di publik." />
              <Label>Nama</Label>
              <input value={nama} onChange={e => setNama(e.target.value)} maxLength={100} className="h-12 w-full rounded-2xl border-[1.5px] border-border-strong bg-card px-4 text-sm font-semibold outline-none focus:border-primary" />
              <button onClick={() => setAnonim(v => !v)} aria-pressed={anonim} className={cn("mt-3 flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left", anonim ? "border-primary" : "border-border")}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted"><EyeOff size={18} /></span>
                <span className="min-w-0 flex-1"><b className="block text-sm">Donasi sebagai anonim</b><small className="text-xs text-text2">Di halaman Transparansi tampil "Anonim". Nama Anda hanya dilihat admin.</small></span>
                <span className={cn("relative h-7 w-12 shrink-0 rounded-full transition", anonim ? "bg-primary" : "bg-border-strong")}><i className={cn("absolute top-1 h-5 w-5 rounded-full bg-white transition-all", anonim ? "left-6" : "left-1")} /></span>
              </button>
              <Label>Nomor HP / WhatsApp</Label>
              <input value={hp} inputMode="tel" onChange={e => setHp(e.target.value.replace(/[^\d+ ]/g, ""))} placeholder="0812 3456 7890" maxLength={18} className="h-12 w-full rounded-2xl border-[1.5px] border-border-strong bg-card px-4 font-mono text-base font-semibold outline-none focus:border-primary" />

              {jenis === "barang" && (
                <>
                  <Label>Cara penyerahan</Label>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {([["antar", "Antar sendiri", "Ke posko / lokasi pengungsian", Home], ["jemput", "Dijemput relawan", "Relawan menghubungi Anda", Truck]] as const).map(([k, l, d, Ikon]) => (
                      <button key={k} onClick={() => setSerah(k)} aria-pressed={serah === k} className={cn("flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left", serah === k ? "border-primary" : "border-border")}>
                        <Ikon size={20} /><span><b className="block text-sm">{l}</b><small className="text-xs text-text2">{d}</small></span>
                      </button>
                    ))}
                  </div>
                  {serah === "antar" && <p className="mt-2.5 rounded-2xl bg-muted px-4 py-3 text-xs text-text2">{b.lokasi_pengungsian ? <>Antar ke <b className="text-foreground">{b.lokasi_pengungsian}</b>. </> : ""}Admin Pusdalops akan mengonfirmasi titik posko lewat WhatsApp.</p>}
                  {serah === "jemput" && <textarea value={alamatJemput} onChange={e => setAlamatJemput(e.target.value)} rows={2} maxLength={300} placeholder="Alamat penjemputan" className="mt-2.5 w-full resize-none rounded-2xl border-[1.5px] border-border-strong bg-card px-4 py-3 text-sm outline-none focus:border-primary" />}
                </>
              )}

              <Label hint="opsional">{jenis === "dana" ? "Pesan untuk warga" : "Catatan kondisi barang"}</Label>
              {jenis === "dana" && <div className="mb-2 flex flex-wrap gap-2">{PESAN_CEPAT.map(p => <button key={p} onClick={() => setPesan(p)} className={cn("rounded-full border-[1.5px] px-3.5 py-2 text-[12.5px] font-bold", pesan === p ? "border-primary bg-primary text-primary-foreground" : "border-border-strong")}>{p}</button>)}</div>}
              <textarea value={pesan} onChange={e => setPesan(e.target.value)} rows={2} maxLength={500} placeholder={jenis === "dana" ? "Tulis pesan" : "Contoh: baru, masih tersegel"} className="w-full resize-none rounded-2xl border-[1.5px] border-border-strong bg-card px-4 py-3 text-sm outline-none focus:border-primary" />
            </section>
          )}

          {/* ---------- PEMBAYARAN / PERIKSA ---------- */}
          {step === 3 && jenis === "dana" && (
            <section>
              <Judul h="Pilih cara bayar" p="Lakukan pembayaran, lalu unggah bukti agar verifikasi lebih cepat." />
              <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
                {([["transfer", "Transfer bank", Wallet], ["qris", "QRIS", QrCode], ["ewallet", "e-Wallet", Banknote]] as const).map(([k, l, Ikon]) => (
                  <button key={k} onClick={() => setMetode(k)} aria-pressed={metode === k} className={cn("flex items-center gap-2.5 rounded-2xl border-2 px-4 py-3.5 text-sm font-extrabold", metode === k ? "border-primary" : "border-border")}>
                    <Ikon size={19} />{l}{metode === k && <Check size={16} className="ml-auto" />}
                  </button>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-ink p-5 text-on-ink">
                {metode === "transfer" ? (
                  <>
                    <small className="font-mono text-[11px] uppercase tracking-[0.1em] text-on-ink-2">Rekening tujuan</small>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      <b className="font-mono text-2xl font-semibold text-white">{REKENING.bank} {REKENING.nomor}</b>
                      <button onClick={() => { navigator.clipboard?.writeText(REKENING.nomor.replace(/\s/g, "")); setSalin(true); setTimeout(() => setSalin(false), 1800); }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">{salin ? <Check size={14} /> : <Copy size={14} />}{salin ? "Tersalin" : "Salin"}</button>
                    </div>
                    <p className="mt-1 text-sm">a.n. {REKENING.nama} · kode unik <b className="font-mono text-marigold">BTB-{String(b.id).padStart(4, "0")}</b></p>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-white text-ink"><QrCode size={64} strokeWidth={1.4} /></span>
                    <p className="text-sm">{metode === "qris" ? "Pindai kode QRIS resmi BPBD Bali yang dikirim admin lewat WhatsApp setelah Anda konfirmasi." : "Tautan pembayaran e-wallet dikirim admin lewat WhatsApp setelah Anda konfirmasi."} <span className="text-on-ink-2">(Prototipe — belum terhubung ke gateway pembayaran.)</span></p>
                  </div>
                )}
              </div>
              <div className="mt-5">
                <PhotoUploadField label="Bukti pembayaran (opsional)" urls={bukti} onChange={setBukti} maxFiles={1} hint="Bisa juga menyusul. Admin mencocokkan dengan mutasi rekening." />
              </div>
            </section>
          )}
          {step === 3 && jenis === "barang" && (
            <section>
              <Judul h="Periksa sebelum dikirim" p="Setelah dikirim, admin akan menghubungi Anda untuk penyerahan." />
              <div className="mt-5 overflow-hidden rounded-2xl border border-border">
                {daftarItem.map(it => (
                  <div key={it.nama} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0">
                    <b className="text-sm">{it.nama}</b><span className="font-mono text-sm font-semibold">{it.jumlah.toLocaleString("id-ID")} {it.satuan}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm"><span className="text-text2">Penyerahan:</span> <b>{serah === "antar" ? "Antar sendiri ke posko" : `Dijemput — ${alamatJemput}`}</b></p>
            </section>
          )}

          {galat && <p className="mt-4 rounded-xl bg-urgent-soft px-4 py-3 text-sm font-semibold text-status-act-fg">{galat}</p>}
          <button onClick={lanjut} disabled={kirim}
            className={cn("mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-extrabold text-primary-foreground disabled:opacity-60", step === 3 ? "bg-urgent text-white" : "bg-primary")}>
            {kirim ? <Loader2 size={20} className="animate-spin" /> : step === 3 ? <HandHeart size={20} /> : null}
            {step < 3 ? <>Lanjut <ArrowRight size={19} /></> : jenis === "dana" ? `Konfirmasi donasi ${formatRupiah(jumlahDana)}` : "Kirim donasi barang"}
          </button>
        </div>
      </div>

      {/* Ringkasan menempel */}
      <aside className="lg:sticky lg:top-24">
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="relative h-32">
            {b.foto_urls?.[0] ? <img src={b.foto_urls[0]} alt="" className="h-full w-full object-cover" /> : <FotoBencana jenis={b.jenis_bencana} label={false} className="h-full w-full" />}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
            <b className="absolute bottom-3 left-4 right-4 line-clamp-2 text-[15px] font-extrabold text-white">{b.judul}</b>
          </div>
          <div className="space-y-2.5 p-5 text-sm">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-text2">Ringkasan</span>
            <Baris k="Jenis" v={jenis === "dana" ? "Donasi uang" : "Donasi barang"} />
            {jenis === "dana" ? <Baris k="Nominal" v={jumlahDana ? formatRupiah(jumlahDana) : "—"} mono /> : <Baris k="Barang" v={daftarItem.length ? daftarItem.map(i => `${i.nama} ×${i.jumlah}`).join(", ") : "—"} />}
            <Baris k="Tampil sebagai" v={anonim ? "Anonim" : nama.trim() || "—"} />
            {jenis === "dana" && step === 3 && <Baris k="Metode" v={metode === "transfer" ? "Transfer bank" : metode === "qris" ? "QRIS" : "e-Wallet"} />}
            <p className="border-t border-dashed border-border-strong pt-3 text-xs text-text2">Donasi berstatus <b className="text-foreground">menunggu</b> sampai diperiksa admin, lalu tercatat di Transparansi.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------ Sukses ------------------------------ */
function Sukses({ b, jenis, ids, ringkas, onLagi }: { b: any; jenis: "dana" | "barang"; ids: number[]; ringkas: string; onLagi: () => void }) {
  return (
    <div className="mx-auto max-w-xl text-center">
      <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-status-done-bg text-status-done-fg"><CheckCircle2 size={48} /></span>
      <h1 className="mt-5 text-[34px] font-extrabold leading-[1.05] tracking-[-0.045em]">Terima kasih. Donasi Anda tercatat.</h1>
      <p className="mt-2 text-text2">{jenis === "dana" ? `${ringkas} untuk ` : `${ringkas} untuk `}<b className="text-foreground">{b.judul}</b>.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">{ids.map(id => <span key={id} className="rounded-lg bg-muted px-2.5 py-1 font-mono text-sm font-semibold">DNS-{String(id).padStart(4, "0")}</span>)}</div>
      <StatusBadge status="menunggu" className="mt-3" />
      <ol className="mt-7 space-y-3 rounded-3xl border border-border bg-card p-5 text-left text-sm">
        {[
          ["Donasi terkirim", "Barusan", true],
          [jenis === "dana" ? "Admin mencocokkan pembayaran" : "Admin menghubungi Anda untuk penyerahan", "lewat WhatsApp", false],
          [jenis === "dana" ? "Dana dihitung & tampil di Transparansi" : "Barang diterima — progres kebutuhan bertambah", "setelah diperiksa", false],
        ].map(([t, s, d], i) => (
          <li key={String(t)} className="flex items-start gap-3">
            <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold", d ? "bg-primary text-marigold" : "border-2 border-border-strong text-text2")}>{d ? <Check size={14} /> : i + 1}</span>
            <span><b className="block">{t}</b><small className="text-xs text-text2">{s}</small></span>
          </li>
        ))}
      </ol>
      <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
        <Link href="/transparansi" className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-border-strong font-extrabold hover:border-foreground hover:no-underline">Lihat Transparansi <ChevronRight size={18} /></Link>
        <button onClick={onLagi} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary font-extrabold text-primary-foreground">Bantu lokasi lain</button>
      </div>
    </div>
  );
}

function Judul({ h, p }: { h: string; p: string }) {
  return <><h2 className="text-[24px] font-extrabold leading-tight tracking-[-0.035em]">{h}</h2><p className="mt-1 text-sm text-text2">{p}</p></>;
}

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return <div className="mb-2 mt-6 flex justify-between font-mono text-[11px] uppercase tracking-[0.1em] text-text2"><span>{children}</span>{hint && <em className="font-sans text-xs font-semibold normal-case not-italic tracking-normal">{hint}</em>}</div>;
}

function Baris({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return <div className="flex justify-between gap-4"><span className="text-text2">{k}</span><b className={cn("text-right", mono && "font-mono")}>{v}</b></div>;
}
