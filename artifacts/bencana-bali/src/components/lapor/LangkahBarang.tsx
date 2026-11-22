import { useMemo, useState } from "react";
import {
  Baby, BriefcaseMedical, Check, Droplets, Minus, Package, Plus, Shirt, Soup, Sparkles, Siren, Tent, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Langkah "Barang dibutuhkan" di wizard lapor — pelapor bisa meminta barang
// bantuan langsung saat melapor. Tetap "ketuk, bukan ketik": katalog barang
// siap pilih + saran otomatis dari kondisi & jumlah warga. Jumlah awal adalah
// perkiraan kasar; admin mencocokkan lagi dengan stok gudang sebelum
// permintaan dibuka untuk donatur. Dikirim ke POST /laporan/:id/kebutuhan-bulk.

export type KategoriServer = "pangan" | "sandang" | "medis" | "tempat_tinggal" | "air_bersih" | "lainnya";

export type ItemMinta = {
  id: string;
  kategori: KategoriServer;
  nama: string;
  jumlah: number;
  satuan: string;
  mendesak: boolean;
};

type Warga = { total: number; kk: number; balita: number; lansia: number; anak: number; wanita: number };

type Katalog = {
  id: string;
  g: GrupKey;
  kategori: KategoriServer;
  nama: string;
  satuan: string;
  ket?: string;
  saran: (w: Warga) => number;
};

const GRUP = [
  { k: "pangan", l: "Makanan", ikon: Soup },
  { k: "air", l: "Air bersih", ikon: Droplets },
  { k: "medis", l: "Kesehatan", ikon: BriefcaseMedical },
  { k: "hunian", l: "Tempat tinggal", ikon: Tent },
  { k: "sandang", l: "Pakaian & kebersihan", ikon: Shirt },
  { k: "rentan", l: "Bayi & lansia", ikon: Baby },
  { k: "lain", l: "Lainnya", ikon: Package },
] as const;
type GrupKey = (typeof GRUP)[number]["k"];

const c = (min: number, v: number) => Math.max(min, Math.ceil(v));

export const KATALOG: Katalog[] = [
  { id: "beras", g: "pangan", kategori: "pangan", nama: "Beras", satuan: "kg", saran: w => c(10, w.kk * 5) },
  { id: "nasi", g: "pangan", kategori: "pangan", nama: "Makanan siap saji", satuan: "bungkus", ket: "nasi bungkus, roti", saran: w => c(20, w.total * 2) },
  { id: "mi", g: "pangan", kategori: "pangan", nama: "Mi instan", satuan: "dus", ket: "isi 40", saran: w => c(2, w.total / 10) },
  { id: "kaleng", g: "pangan", kategori: "pangan", nama: "Lauk kaleng", satuan: "kaleng", ket: "sarden, kornet", saran: w => c(12, w.total) },
  { id: "minyak", g: "pangan", kategori: "pangan", nama: "Minyak goreng", satuan: "liter", saran: w => c(5, w.kk) },
  { id: "telur", g: "pangan", kategori: "pangan", nama: "Telur", satuan: "rak", ket: "isi 30", saran: w => c(2, w.kk / 3) },

  { id: "airminum", g: "air", kategori: "air_bersih", nama: "Air minum kemasan", satuan: "dus", ket: "isi 24 botol", saran: w => c(5, w.total / 4) },
  { id: "galon", g: "air", kategori: "air_bersih", nama: "Air galon", satuan: "galon", saran: w => c(5, w.kk / 2) },
  { id: "jeriken", g: "air", kategori: "air_bersih", nama: "Jeriken", satuan: "unit", saran: w => c(5, w.kk) },
  { id: "tandon", g: "air", kategori: "air_bersih", nama: "Tandon air", satuan: "unit", ket: "untuk posko", saran: w => c(1, w.kk / 20) },
  { id: "penjernih", g: "air", kategori: "air_bersih", nama: "Tablet penjernih air", satuan: "strip", saran: w => c(5, w.kk) },

  { id: "p3k", g: "medis", kategori: "medis", nama: "Kotak P3K", satuan: "paket", saran: w => c(1, w.kk / 10) },
  { id: "obat", g: "medis", kategori: "medis", nama: "Obat-obatan umum", satuan: "paket", ket: "demam, batuk, maag", saran: w => c(2, w.kk / 5) },
  { id: "oralit", g: "medis", kategori: "medis", nama: "Oralit", satuan: "sachet", ket: "cegah diare", saran: w => c(20, w.total) },
  { id: "masker", g: "medis", kategori: "medis", nama: "Masker", satuan: "box", saran: w => c(2, w.total / 50) },
  { id: "kayuputih", g: "medis", kategori: "medis", nama: "Minyak kayu putih", satuan: "botol", saran: w => c(5, w.kk) },

  { id: "terpal", g: "hunian", kategori: "tempat_tinggal", nama: "Terpal", satuan: "lembar", saran: w => c(5, w.kk) },
  { id: "tenda", g: "hunian", kategori: "tempat_tinggal", nama: "Tenda keluarga", satuan: "unit", saran: w => c(1, w.kk / 2) },
  { id: "tikar", g: "hunian", kategori: "tempat_tinggal", nama: "Tikar", satuan: "lembar", saran: w => c(5, w.kk) },
  { id: "selimut", g: "hunian", kategori: "tempat_tinggal", nama: "Selimut", satuan: "lembar", saran: w => c(10, w.total) },
  { id: "kasur", g: "hunian", kategori: "tempat_tinggal", nama: "Kasur lipat", satuan: "unit", saran: w => c(5, w.total / 2) },
  { id: "senter", g: "hunian", kategori: "tempat_tinggal", nama: "Senter / lampu darurat", satuan: "unit", saran: w => c(5, w.kk) },

  { id: "pakaian", g: "sandang", kategori: "sandang", nama: "Pakaian layak pakai", satuan: "paket", saran: w => c(10, w.total) },
  { id: "sarung", g: "sandang", kategori: "sandang", nama: "Sarung", satuan: "lembar", saran: w => c(10, w.total) },
  { id: "hygiene", g: "sandang", kategori: "sandang", nama: "Paket kebersihan diri", satuan: "paket", ket: "sabun, sikat gigi, sampo", saran: w => c(5, w.kk) },
  { id: "pembalut", g: "sandang", kategori: "sandang", nama: "Pembalut", satuan: "pak", saran: w => c(5, w.wanita || w.total / 4) },
  { id: "handuk", g: "sandang", kategori: "sandang", nama: "Handuk", satuan: "lembar", saran: w => c(10, w.total) },

  { id: "popokbayi", g: "rentan", kategori: "sandang", nama: "Popok bayi", satuan: "pak", saran: w => c(3, w.balita * 2) },
  { id: "mpasi", g: "rentan", kategori: "pangan", nama: "Makanan bayi (MPASI)", satuan: "paket", ket: "bubur bayi", saran: w => c(3, w.balita * 2) },
  { id: "telon", g: "rentan", kategori: "medis", nama: "Minyak telon", satuan: "botol", saran: w => c(2, w.balita) },
  { id: "popokdewasa", g: "rentan", kategori: "sandang", nama: "Popok dewasa", satuan: "pak", saran: w => c(2, w.lansia) },
  { id: "kursiroda", g: "rentan", kategori: "medis", nama: "Kursi roda / tongkat", satuan: "unit", saran: () => 1 },
  { id: "susuanak", g: "rentan", kategori: "pangan", nama: "Susu UHT anak", satuan: "dus", ket: "untuk anak 1 th ke atas", saran: w => c(2, (w.anak + w.balita) / 6) },

  { id: "kebersihan", g: "lain", kategori: "lainnya", nama: "Alat kebersihan", satuan: "paket", ket: "sekop, sapu, ember", saran: w => c(2, w.kk / 5) },
  { id: "karung", g: "lain", kategori: "lainnya", nama: "Karung pasir", satuan: "karung", saran: () => 50 },
  { id: "genset", g: "lain", kategori: "lainnya", nama: "Genset", satuan: "unit", saran: () => 1 },
  { id: "gergaji", g: "lain", kategori: "lainnya", nama: "Gergaji mesin", satuan: "unit", ket: "pohon tumbang", saran: () => 1 },
  { id: "dapur", g: "lain", kategori: "lainnya", nama: "Perlengkapan dapur umum", satuan: "paket", ket: "kompor, panci, gas", saran: () => 1 },
];

const SATUAN_CUSTOM = ["unit", "paket", "pcs", "kg", "liter", "dus", "lembar"];
export const MAKS_BARANG = 20;

// Saran barang dari isian langkah sebelumnya — urutan = prioritas.
const SARAN_KONDISI: Record<string, string[]> = {
  pangan: ["nasi", "airminum", "beras"],
  mengungsi: ["tikar", "selimut", "hygiene", "terpal"],
  medis: ["p3k", "obat"],
  rumah: ["terpal"],
  listrik: ["senter"],
  evakuasi: ["selimut"],
};
const SARAN_JENIS: Record<string, string[]> = {
  banjir: ["airminum", "oralit", "kebersihan", "karung"],
  tanah_longsor: ["terpal", "kebersihan"],
  angin_kencang: ["terpal", "gergaji"],
  gempa_bumi: ["tenda", "terpal"],
  kebakaran: ["pakaian", "selimut"],
  tsunami: ["airminum", "tenda", "pakaian"],
};

export function hitungWarga(korban: Record<string, number>): Warga {
  const total = Object.values(korban).reduce((a, b) => a + b, 0);
  return {
    total, kk: Math.max(1, Math.round(total / 4)),
    balita: korban.balita ?? 0, lansia: korban.lansia ?? 0, anak: korban.anak ?? 0, wanita: korban.wanita ?? 0,
  };
}

function keItem(k: Katalog, w: Warga): ItemMinta {
  return { id: k.id, kategori: k.kategori, nama: k.nama, satuan: k.satuan, jumlah: k.saran(w), mendesak: false };
}

export function ringkasBarang(barang: ItemMinta[]) {
  if (!barang.length) return "Tidak meminta barang";
  const nama = barang.slice(0, 3).map(b => b.nama.toLowerCase()).join(", ");
  return barang.length > 3 ? `${nama}, +${barang.length - 3} lainnya` : nama;
}

/** Bentuk body untuk POST /laporan/:id/kebutuhan-bulk. */
export function keKebutuhan(barang: ItemMinta[]) {
  return barang.map(b => ({
    kategori: b.kategori,
    nama_item: b.nama.trim().slice(0, 120),
    jumlah_dibutuhkan: Math.max(1, Math.min(1_000_000, Math.round(b.jumlah))),
    satuan: b.satuan.trim().slice(0, 30) || "unit",
    keterangan: b.mendesak ? "MENDESAK — diminta pelapor" : "Diminta pelapor",
  }));
}

type Props = {
  barang: ItemMinta[];
  onChange: (f: (prev: ItemMinta[]) => ItemMinta[]) => void;
  jenis: string | null;
  kondisi: string[];
  korban: Record<string, number>;
};

export function LangkahBarang({ barang, onChange, jenis, kondisi, korban }: Props) {
  const w = useMemo(() => hitungWarga(korban), [korban]);
  const [grup, setGrup] = useState<GrupKey>("pangan");
  const [lain, setLain] = useState({ nama: "", jumlah: "", satuan: "unit" });
  const penuh = barang.length >= MAKS_BARANG;
  const dipilih = new Set(barang.map(b => b.id));

  const saran = useMemo(() => {
    const ids = [
      ...kondisi.flatMap(k => SARAN_KONDISI[k] ?? []),
      ...(jenis ? SARAN_JENIS[jenis] ?? [] : []),
      ...(w.balita ? ["popokbayi", "mpasi"] : []),
      ...(w.lansia ? ["popokdewasa"] : []),
    ];
    return [...new Set(ids)].map(id => KATALOG.find(k => k.id === id)!).filter(Boolean).slice(0, 8);
  }, [kondisi, jenis, w.balita, w.lansia]);
  const saranSisa = saran.filter(k => !dipilih.has(k.id));

  const tambah = (k: Katalog) => onChange(prev => prev.some(b => b.id === k.id) || prev.length >= MAKS_BARANG ? prev : [...prev, keItem(k, w)]);
  const toggle = (k: Katalog) => onChange(prev => prev.some(b => b.id === k.id) ? prev.filter(b => b.id !== k.id) : prev.length >= MAKS_BARANG ? prev : [...prev, keItem(k, w)]);
  const tambahSemua = () => onChange(prev => {
    const ada = new Set(prev.map(b => b.id));
    return [...prev, ...saranSisa.filter(k => !ada.has(k.id)).map(k => keItem(k, w))].slice(0, MAKS_BARANG);
  });
  const ubahItem = (id: string, patch: Partial<ItemMinta>) => onChange(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  const hapus = (id: string) => onChange(prev => prev.filter(b => b.id !== id));

  const tambahLain = () => {
    const nama = lain.nama.trim(), jumlah = parseInt(lain.jumlah, 10) || 1;
    if (nama.length < 2 || penuh) return;
    onChange(prev => [...prev, { id: `lain-${Date.now()}`, kategori: "lainnya", nama, jumlah, satuan: lain.satuan, mendesak: false }]);
    setLain({ nama: "", jumlah: "", satuan: "unit" });
  };

  const jumlahPerGrup = (g: GrupKey) => barang.filter(b => KATALOG.find(k => k.id === b.id)?.g === g || (g === "lain" && b.id.startsWith("lain-"))).length;
  const mendesak = barang.filter(b => b.mendesak).length;

  return (
    <section>
      <h2 className="text-[24px] font-extrabold leading-[1.1] tracking-[-0.035em] sm:text-[28px]">Barang apa yang dibutuhkan?</h2>
      <p className="mt-1.5 text-[14.5px] text-text2">Ketuk barang yang paling dibutuhkan warga. Boleh dilewati — petugas tetap menilai kebutuhan di lapangan.</p>

      {saran.length > 0 && (
        <div className="mt-5 rounded-[20px] border-[1.5px] border-primary/25 bg-primary-soft p-4">
          <div className="flex items-start gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-marigold"><Sparkles size={18} /></span>
            <div className="min-w-0 flex-1">
              <b className="block text-[14.5px] font-extrabold">Saran dari isian Anda</b>
              <small className="block text-xs text-text2">
                Berdasarkan jenis bencana, kondisi lokasi{w.total ? <> & <b className="text-foreground">{w.total} warga</b> (≈ {w.kk} KK)</> : ""}. Jumlah bisa diubah.
              </small>
            </div>
            {saranSisa.length > 1 && !penuh && (
              <button onClick={tambahSemua} className="hidden shrink-0 rounded-full bg-primary px-3.5 py-2 text-[12.5px] font-extrabold text-primary-foreground sm:block">Tambah semua</button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {saran.map(k => {
              const on = dipilih.has(k.id);
              return (
                <button key={k.id} onClick={() => tambah(k)} disabled={on || penuh} aria-pressed={on}
                  className={cn("inline-flex min-h-10 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-1.5 text-[13px] font-bold transition",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-primary/30 bg-card hover:border-primary disabled:opacity-50")}>
                  {on ? <Check size={14} /> : <Plus size={14} />}{k.nama}
                  <span className={cn("font-mono text-[11.5px] font-medium", on ? "text-primary-foreground/80" : "text-text2")}>· {k.saran(w)} {k.satuan}</span>
                </button>
              );
            })}
          </div>
          {saranSisa.length > 1 && !penuh && (
            <button onClick={tambahSemua} className="mt-3 w-full rounded-full bg-primary py-2.5 text-[13px] font-extrabold text-primary-foreground sm:hidden">Tambah semua saran</button>
          )}
        </div>
      )}

      {/* Katalog per kategori */}
      <div className="mb-2.5 mt-7 flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-extrabold tracking-[-0.01em]">Pilih dari katalog</span>
        <em className="text-xs font-semibold not-italic text-text2">ketuk lagi untuk batal</em>
      </div>
      {/* HP: geser dengan jari. Layar lebar (mouse tidak bisa geser samping): turun baris, semua terlihat. */}
      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="tablist" aria-label="Kategori barang">
        {GRUP.map(g => {
          const on = grup === g.k, n = jumlahPerGrup(g.k);
          return (
            <button key={g.k} role="tab" aria-selected={on} onClick={() => setGrup(g.k)}
              className={cn("inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-[1.5px] px-3.5 text-[13px] font-bold transition",
                on ? "border-ink bg-ink text-white" : "border-border bg-card text-text2 hover:border-border-strong hover:text-foreground")}>
              <g.ikon size={16} />{g.l}
              {n > 0 && <span className={cn("grid h-5 min-w-5 place-items-center rounded-full px-1 font-mono text-[11px]", on ? "bg-marigold text-ink" : "bg-primary text-primary-foreground")}>{n}</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {KATALOG.filter(k => k.g === grup).map(k => {
          const item = barang.find(b => b.id === k.id), on = !!item;
          return (
            <button key={k.id} onClick={() => toggle(k)} aria-pressed={on} disabled={!on && penuh}
              className={cn("relative flex min-h-[76px] flex-col items-start justify-between gap-1.5 rounded-2xl border-[1.5px] px-3.5 py-3 text-left transition disabled:opacity-45",
                on ? "border-primary bg-primary-soft" : "border-border bg-background hover:-translate-y-0.5 hover:border-border-strong")}>
              <span className="pr-7">
                <b className="block text-[13.5px] font-extrabold leading-tight">{k.nama}</b>
                {k.ket && <small className="mt-0.5 block text-[11.5px] leading-tight text-text2">{k.ket}</small>}
              </span>
              <span className={cn("font-mono text-[11.5px]", on ? "font-semibold text-primary" : "text-text2")}>
                {on ? `${item!.jumlah} ${item!.satuan}` : `saran ${k.saran(w)} ${k.satuan}`}
              </span>
              <span className={cn("absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full",
                on ? "bg-primary text-primary-foreground" : "border-[1.5px] border-border-strong text-text2")}>
                {on ? <Check size={14} /> : <Plus size={14} />}
              </span>
            </button>
          );
        })}
      </div>

      {grup === "lain" && (
        <div className="mt-3 rounded-2xl border-[1.5px] border-dashed border-border-strong p-3.5">
          <b className="block text-[13.5px] font-extrabold">Barang lain yang tidak ada di daftar</b>
          <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
            <input value={lain.nama} maxLength={120} onChange={e => setLain(s => ({ ...s, nama: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && tambahLain()} placeholder="Contoh: kantong jenazah, perahu karet"
              className="h-12 min-w-0 flex-1 rounded-xl border-[1.5px] border-border-strong bg-card px-3 text-[14px] font-semibold outline-none focus:border-primary" />
            <div className="flex gap-2">
              <input value={lain.jumlah} inputMode="numeric" placeholder="Jml" aria-label="Jumlah"
                onChange={e => setLain(s => ({ ...s, jumlah: e.target.value.replace(/\D/g, "").slice(0, 7) }))}
                className="h-12 w-20 rounded-xl border-[1.5px] border-border-strong bg-card px-3 text-center font-mono text-[15px] font-semibold outline-none focus:border-primary" />
              <select value={lain.satuan} onChange={e => setLain(s => ({ ...s, satuan: e.target.value }))} aria-label="Satuan"
                className="h-12 rounded-xl border-[1.5px] border-border-strong bg-card px-2.5 text-[13.5px] font-bold outline-none focus:border-primary">
                {SATUAN_CUSTOM.map(s => <option key={s}>{s}</option>)}
              </select>
              <button onClick={tambahLain} disabled={lain.nama.trim().length < 2 || penuh}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:bg-border-strong disabled:text-text2" aria-label="Tambah barang">
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daftar permintaan */}
      <div className="mb-2.5 mt-7 flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-extrabold tracking-[-0.01em]">Daftar permintaan</span>
        <em className="text-xs font-semibold not-italic text-text2">
          {barang.length ? `${barang.length} barang${mendesak ? ` · ${mendesak} mendesak` : ""}` : "opsional"}
        </em>
      </div>
      {barang.length === 0 ? (
        <div className="rounded-[18px] border-[1.5px] border-dashed border-border-strong px-4 py-6 text-center">
          <Package size={26} className="mx-auto text-text2" />
          <p className="mt-2 text-[13.5px] font-semibold">Belum ada barang dipilih.</p>
          <p className="mt-0.5 text-xs text-text2">Ketuk saran atau barang di katalog — atau langsung lanjut bila tidak tahu.</p>
        </div>
      ) : (
        <ul className="rounded-[18px] border border-border bg-card px-3">
          {barang.map(b => {
            const langkah = b.jumlah >= 100 ? 10 : b.jumlah >= 20 ? 5 : 1;
            return (
              <li key={b.id} className="flex flex-wrap items-center gap-x-2.5 gap-y-2 border-b border-border py-3 last:border-b-0">
                <div className="min-w-0 flex-1 basis-[150px]">
                  <b className="flex items-center gap-1.5 text-[14px] font-extrabold leading-tight">
                    {b.nama}
                    {b.mendesak && <span className="rounded-full bg-urgent px-1.5 py-px text-[10px] font-extrabold uppercase tracking-[0.06em] text-white">Mendesak</span>}
                  </b>
                  <button onClick={() => ubahItem(b.id, { mendesak: !b.mendesak })} aria-pressed={b.mendesak}
                    className={cn("mt-1 inline-flex items-center gap-1 text-[12px] font-bold", b.mendesak ? "text-urgent" : "text-text2 hover:text-foreground")}>
                    <Siren size={13} />{b.mendesak ? "Ditandai mendesak" : "Tandai mendesak"}
                  </button>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-1">
                  <button aria-label={`Kurangi ${b.nama}`} disabled={b.jumlah <= 1} onClick={() => ubahItem(b.id, { jumlah: Math.max(1, b.jumlah - langkah) })}
                    className="grid h-10 w-10 place-items-center rounded-xl border-[1.5px] border-border-strong bg-card disabled:opacity-35"><Minus size={16} /></button>
                  <label className="flex h-10 items-baseline justify-center gap-1 rounded-[10px] px-1 focus-within:bg-muted">
                    <input inputMode="numeric" aria-label={`Jumlah ${b.nama}`} value={b.jumlah} onFocus={e => e.target.select()}
                      onChange={e => ubahItem(b.id, { jumlah: Math.max(1, Math.min(1_000_000, parseInt(e.target.value.replace(/\D/g, ""), 10) || 1)) })}
                      className="h-10 w-[52px] bg-transparent text-right font-mono text-[18px] font-semibold outline-none" />
                    <span className="min-w-[30px] max-w-[64px] truncate text-[11.5px] font-semibold text-text2">{b.satuan}</span>
                  </label>
                  <button aria-label={`Tambah ${b.nama}`} onClick={() => ubahItem(b.id, { jumlah: Math.min(1_000_000, b.jumlah + langkah) })}
                    className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Plus size={16} /></button>
                  <button aria-label={`Hapus ${b.nama}`} onClick={() => hapus(b.id)}
                    className="ml-1 grid h-10 w-9 place-items-center rounded-xl text-text2 hover:bg-urgent-soft hover:text-urgent"><Trash2 size={16} /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {penuh && <p className="mt-2 text-xs font-semibold text-status-wait-fg">Maksimal {MAKS_BARANG} jenis barang per laporan.</p>}

      <div className="mt-3 flex gap-2 rounded-xl bg-muted px-3 py-2.5 text-left text-xs leading-[1.45] text-text2">
        <Package size={15} className="mt-px shrink-0" />
        <span>Jumlah cukup perkiraan. Admin Pusdalops mencocokkan dengan stok gudang dan kondisi lapangan sebelum permintaan dibuka untuk donatur.</span>
      </div>
    </section>
  );
}
