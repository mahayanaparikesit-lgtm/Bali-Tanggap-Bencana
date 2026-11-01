import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRupiah, formatWaktu, formatKoordinat, JENIS_LABELS } from "@/lib/format";
import { KorbanRincian } from "@/components/KorbanRincian";

const BASE = import.meta.env.VITE_API_URL.replace(/\/$/, "");

async function fetchJson(path: string) {
  const res = await fetch(`${BASE}${path}`);
  return res.json();
}

// Overlay detail laporan fullscreen — satu-satunya, dipakai dari Home (grid
// "Laporan masuk") dan Transparansi (tabel laporan aktif) supaya perilakunya
// identik di kedua tempat. Pola dari Landing Page.dc.html § detail laporan.
export function ReportDetailOverlay({ id, onClose }: { id: number; onClose: () => void }) {
  const { data: laporan } = useQuery({ queryKey: ["laporan", id], queryFn: () => fetchJson(`/api/laporan/${id}`) });
  const { data: transparansiList } = useQuery({ queryKey: ["transparansi-laporan"], queryFn: () => fetchJson("/api/transparansi/laporan") });
  const ringkasan = (transparansiList ?? []).find((l: any) => l.id === id);

  const kebutuhan: any[] = ringkasan?.kebutuhan ?? [];
  const penugasan: any[] = laporan?.penugasan ?? [];
  const foto: string[] = laporan?.foto_urls ?? [];
  const koordinat = laporan ? formatKoordinat(laporan.koordinat_lat, laporan.koordinat_lng) : null;
  const statusUbah = laporan && laporan.updated_at && laporan.updated_at !== laporan.created_at;

  return (
    <div className="fixed inset-0 z-[60] overflow-auto bg-background">
      <div className="sticky top-0 z-[2] flex items-center gap-4 border-b border-border bg-surface px-6 py-3.5">
        <button
          onClick={onClose}
          className="flex items-center gap-[9px] rounded-lg border border-border-strong bg-transparent px-4 py-2.5 text-sm font-bold text-foreground hover:border-primary hover:text-primary"
        >
          ‹ Kembali
        </button>
        <div className="flex-1" />
        <span className="font-mono text-[12.5px] text-text3">LPR-{id}</span>
      </div>

      {!laporan ? (
        <div className="py-24 text-center text-text2">Memuat laporan…</div>
      ) : (
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-9 px-6 pb-16 pt-7 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex flex-col gap-3">
              <div
                className="flex aspect-video items-center justify-center rounded-[10px] border border-border"
                style={{ background: foto[0] ? undefined : "repeating-linear-gradient(135deg, var(--muted) 0 12px, var(--background) 12px 24px)" }}
              >
                {foto[0] ? (
                  <img src={foto[0]} alt="" className="h-full w-full rounded-[10px] object-cover" />
                ) : (
                  <span className="text-center font-mono text-[12.5px] leading-[1.6] text-text3">
                    FOTO UTAMA LAPORAN<br />{JENIS_LABELS[laporan.jenis_bencana] ?? laporan.jenis_bencana}, {laporan.lokasi}
                  </span>
                )}
              </div>
              {foto.length > 1 && (
                <div className="grid grid-cols-3 gap-3">
                  {foto.slice(1, 4).map((url: string, i: number) => (
                    <div key={i} className="aspect-[4/3] overflow-hidden rounded-lg border border-border">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-[15px] font-extrabold uppercase tracking-[0.04em] text-text3">Keterangan laporan</h2>
              <p className="text-base leading-[1.6] text-text2">{laporan.deskripsi}</p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-[15px] font-extrabold uppercase tracking-[0.04em] text-text3">Rincian kebutuhan</h2>
              <div className="overflow-hidden rounded-[10px] border border-border bg-surface">
                <div className="grid grid-cols-[minmax(0,1.4fr)_110px_130px] gap-3.5 border-b border-border bg-surface-2 px-4 py-2.5 text-[11.5px] font-extrabold uppercase tracking-[0.06em] text-text3">
                  <span>Item</span><span>Jumlah</span><span>Pemenuhan</span>
                </div>
                {kebutuhan.length === 0 ? (
                  <div className="px-4 py-3.5 text-sm text-text2">Kebutuhan belum didata.</div>
                ) : kebutuhan.map((k: any) => (
                  <div key={k.id} className="grid grid-cols-[minmax(0,1.4fr)_110px_130px] items-center gap-3.5 border-b border-border px-4 py-3.5 text-[14.5px] last:border-b-0">
                    <b className="font-bold">{k.nama_item}</b>
                    <span className="font-mono text-[13.5px] text-text2">{k.jumlah_dibutuhkan} {k.satuan}</span>
                    <span className="text-[13.5px] text-text2">{k.jumlah_terpenuhi} terpenuhi</span>
                  </div>
                ))}
                <div className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="text-text2">Estimasi kebutuhan dana</span>
                  <div className="flex-1" />
                  <b className="font-mono text-[15px] font-semibold">{laporan.target_dana ? formatRupiah(laporan.target_dana) : "Belum dihitung"}</b>
                </div>
              </div>
            </div>

            {ringkasan?.donasi?.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="text-[15px] font-extrabold uppercase tracking-[0.04em] text-text3">Donasi masuk ({ringkasan.donasi.length})</h2>
                <div className="overflow-hidden rounded-[10px] border border-border bg-surface">
                  {ringkasan.donasi.slice(0, 8).map((d: any) => (
                    <div key={d.id} className="flex items-center gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0">
                      <span className="flex-1 font-semibold">{d.nama_donatur}</span>
                      <span className="font-mono text-[13px] text-text2">
                        {d.jenis === "dana" ? formatRupiah(d.jumlah_dana) : `${d.jumlah_barang} × ${d.nama_barang}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex flex-col gap-3 rounded-[10px] border border-border bg-surface p-[22px]">
              <StatusBadge status={laporan.status} className="self-start" />
              <h1 className="text-[28px] font-extrabold leading-[1.15] tracking-[-0.025em]">{JENIS_LABELS[laporan.jenis_bencana] ?? laporan.jenis_bencana}</h1>
              <span className="text-[15px] text-text2">{laporan.lokasi}</span>
              <span className="font-mono text-[13px] text-text3">
                Masuk {formatWaktu(laporan.created_at)}{koordinat ? ` · ${koordinat}` : ""}
              </span>
              <div className="flex flex-wrap gap-[22px] border-t border-border pt-3.5">
                <span className="flex flex-col gap-[3px]">
                  <span className="text-xs font-bold uppercase tracking-[0.05em] text-text3">Terdampak</span>
                  <b className="font-mono text-[17px] font-semibold">{laporan.jumlah_terdampak?.toLocaleString("id-ID") ?? "—"} jiwa</b>
                </span>
                <span className="flex flex-col gap-[3px]">
                  <span className="text-xs font-bold uppercase tracking-[0.05em] text-text3">Relawan</span>
                  <b className="font-mono text-[17px] font-semibold">{penugasan.length || (ringkasan?.relawan_bertugas?.length ?? 0)} orang</b>
                </span>
                {laporan.nama_pelapor && (
                  <span className="flex flex-col gap-[3px]">
                    <span className="text-xs font-bold uppercase tracking-[0.05em] text-text3">Pelapor</span>
                    <b className="text-[15px] font-bold">{laporan.nama_pelapor}</b>
                  </span>
                )}
              </div>
            </div>

            <KorbanRincian laporan={laporan} />

            <div className="flex flex-col gap-4 rounded-[10px] border border-border bg-surface p-[22px]">
              <h2 className="text-[15px] font-extrabold uppercase tracking-[0.04em] text-text3">Riwayat status</h2>
              <div className="ml-1 border-l-2 border-border pb-4 pl-4">
                <div className="grid grid-cols-[96px_1fr] items-start gap-3.5">
                  <span className="font-mono text-[12.5px] text-text3">{formatWaktu(laporan.created_at)}</span>
                  <span className="flex flex-col gap-[3px]">
                    <b className="text-[14.5px] font-bold">Laporan masuk</b>
                    {laporan.nama_pelapor && (
                      <span className="text-[13px] leading-[1.45] text-text2">Dikirim oleh {laporan.nama_pelapor}</span>
                    )}
                  </span>
                </div>
              </div>
              {statusUbah && (
                <div className="ml-1 border-l-2 border-border pl-4">
                  <div className="grid grid-cols-[96px_1fr] items-start gap-3.5">
                    <span className="font-mono text-[12.5px] text-text3">{formatWaktu(laporan.updated_at)}</span>
                    <span className="flex flex-col gap-[3px]">
                      <b className="text-[14.5px] font-bold">Status terkini</b>
                      <span className="text-[13px] leading-[1.45] text-text2">Diperbarui menjadi "{laporan.status}"</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3.5 rounded-[10px] border border-border bg-surface p-[22px]">
              <h2 className="text-[15px] font-extrabold uppercase tracking-[0.04em] text-text3">Relawan ditugaskan</h2>
              {penugasan.length === 0 ? (
                <span className="text-[13px] leading-[1.5] text-text3">
                  {ringkasan?.relawan_bertugas?.length ? ringkasan.relawan_bertugas.join(", ") : "Belum ada relawan ditugaskan."}
                </span>
              ) : penugasan.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0">
                  <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-xs font-extrabold text-text2">
                    {p.nama_relawan?.split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase()}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                    <b className="text-[14.5px] font-bold">{p.nama_relawan}</b>
                    <span className="text-[12.5px] text-text2">{p.detail_tugas || "Relawan lapangan"}</span>
                  </span>
                  <span className="font-mono text-xs text-text3">{formatWaktu(p.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
