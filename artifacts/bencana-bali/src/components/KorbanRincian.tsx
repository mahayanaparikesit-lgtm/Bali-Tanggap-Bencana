import { cn } from "@/lib/utils";

// Rincian warga terdampak per kelompok (kolom terdampak_* di laporan).
// Hanya angka agregat, tanpa nama. Tidak tampil bila semua kelompok 0
// (laporan lama / dari klien yang belum mengirim rincian).

const KELOMPOK = [
  { k: "terdampak_pria", l: "Pria dewasa", c: "#125CA5" },
  { k: "terdampak_wanita", l: "Wanita dewasa", c: "#1F6E48" },
  { k: "terdampak_anak", l: "Anak", c: "#C98F0A" },
  { k: "terdampak_balita", l: "Balita & bayi", c: "#E7801C" },
  { k: "terdampak_lansia", l: "Lansia", c: "#6B675D" },
] as const;

type Sumber = Partial<Record<(typeof KELOMPOK)[number]["k"], number | null>>;

export function adaRincianKorban(l: Sumber) {
  return KELOMPOK.some(g => (l[g.k] ?? 0) > 0);
}

export function KorbanRincian({ laporan, className }: { laporan: Sumber; className?: string }) {
  if (!adaRincianKorban(laporan)) return null;
  const total = KELOMPOK.reduce((a, g) => a + (laporan[g.k] ?? 0), 0);
  return (
    <div className={cn("rounded-[18px] border border-border bg-card p-4", className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-text2">Warga terdampak</span>
          <b className="block font-mono text-[34px] font-semibold leading-none tracking-[-0.04em]">{total.toLocaleString("id-ID")}</b>
        </div>
        <span className="text-right text-xs text-text2">angka agregat,<br />tanpa nama</span>
      </div>
      <div className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted">
        {KELOMPOK.map(g => (laporan[g.k] ?? 0) > 0 && <i key={g.k} className="block h-full" style={{ width: `${((laporan[g.k] ?? 0) / total) * 100}%`, background: g.c }} />)}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {KELOMPOK.map(g => (
          <div key={g.k} className="rounded-xl bg-muted px-2 py-2 text-center">
            <span className="mx-auto mb-1 block h-1.5 w-6 rounded-full" style={{ background: g.c }} />
            <b className="block font-mono text-lg font-semibold">{(laporan[g.k] ?? 0).toLocaleString("id-ID")}</b>
            <small className="block text-[11px] leading-tight text-text2">{g.l}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
