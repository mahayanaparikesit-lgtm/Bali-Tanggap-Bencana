import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDonasi, useUpdateDonasi, useGetLaporan,
  getGetDonasiQueryKey,
  type Donasi,
} from "@workspace/api-client-react";
import AdminLayout from "@/components/AdminLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatTanggalSingkat } from "@/lib/format";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

const GRID = "grid min-w-[920px] grid-cols-[minmax(160px,1fr)_100px_minmax(180px,1.3fr)_minmax(150px,1fr)_140px_120px_170px] items-center gap-3.5";

const STATUS_LABELS: Record<string, string> = {
  menunggu: "Menunggu",
  diterima: "Diterima",
  ditolak: "Ditolak",
};

function ActionBtn({ children, onClick, variant = "outline", disabled }: { children: React.ReactNode; onClick: () => void; variant?: "primary" | "outline"; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg px-3.5 py-2 text-[13px] font-bold disabled:opacity-50",
        variant === "primary" ? "bg-primary text-primary-foreground hover:bg-primary-hover" : "border border-border-strong text-text2 hover:border-text2 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function DonasiJumlah({ d }: { d: Donasi }) {
  if (d.jenis === "dana") {
    return <b className="font-mono text-[13px] text-status-done-fg">{formatRupiah(d.jumlah_dana ?? 0)}</b>;
  }
  return (
    <span className="flex min-w-0 flex-col gap-[2px]">
      <b className="truncate text-[13px] text-foreground">{d.nama_barang || "—"}</b>
      {d.jumlah_barang != null && <span className="text-[12px] text-text2">{d.jumlah_barang} unit</span>}
    </span>
  );
}

export default function AdminDonasi() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: donasi, isLoading } = useGetDonasi();
  const { data: laporan } = useGetLaporan();
  const updateDonasi = useUpdateDonasi();

  const laporanMap: Record<number, string> = {};
  for (const l of laporan ?? []) laporanMap[l.id] = l.judul;

  const handleUpdate = (id: number, status: "diterima" | "ditolak") => {
    updateDonasi.mutate({ id, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDonasiQueryKey() });
        toast({ title: `Donasi ${status === "diterima" ? "diterima" : "ditolak"}` });
      },
      onError: () => {
        toast({ title: "Gagal memperbarui donasi", variant: "destructive" });
      },
    });
  };

  return (
    <AdminLayout activePage="donasi">
      <div className="flex flex-wrap items-end justify-between gap-[18px]">
        <div className="flex flex-col gap-[5px]">
          <h1 className="text-[22px] font-extrabold tracking-[-0.02em]">Donasi</h1>
          <p className="text-sm text-text2">Konfirmasi atau tolak donasi dana dan barang yang masuk.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-2 px-[18px] py-3">
          <b className="text-sm font-extrabold">Daftar donasi</b>
          <span className="font-mono text-[12.5px] text-text2">{isLoading ? "…" : `${donasi?.length ?? 0} donasi`}</span>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-[18px]">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : donasi && donasi.length > 0 ? (
          <div className="overflow-x-auto">
            <div className={`${GRID} border-b border-border px-[18px] py-2.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-text3`}>
              <span>Donatur</span><span>Jenis</span><span>Dana / Barang</span><span>Laporan terkait</span><span>Status</span><span>Tanggal</span><span>Aksi</span>
            </div>
            {donasi.map(d => (
              <div key={d.id} className={`${GRID} border-b border-border py-3.5 pl-[15px] pr-[18px] last:border-b-0`}>
                <span className="flex min-w-0 flex-col gap-[3px]">
                  <b className="truncate text-[14.5px] font-bold">{d.nama_donatur}</b>
                  {d.kontak_donatur && <span className="truncate text-[12.5px] text-text2">{d.kontak_donatur}</span>}
                </span>
                <span className="text-[13px] text-text2 capitalize">{d.jenis}</span>
                <span><DonasiJumlah d={d} /></span>
                <span className="truncate text-[13px] text-text2">
                  {d.laporan_id != null ? (laporanMap[d.laporan_id] ?? `Laporan #${d.laporan_id}`) : "—"}
                </span>
                <span className="justify-self-start"><StatusBadge status={d.status} label={STATUS_LABELS[d.status]} /></span>
                <span className="font-mono text-[12.5px] text-text2">{formatTanggalSingkat(d.created_at)}</span>
                <span className="flex items-center gap-2">
                  {d.status === "menunggu" ? (
                    <>
                      <ActionBtn variant="primary" onClick={() => handleUpdate(d.id, "diterima")} disabled={updateDonasi.isPending}>Terima</ActionBtn>
                      <ActionBtn onClick={() => handleUpdate(d.id, "ditolak")} disabled={updateDonasi.isPending}>Tolak</ActionBtn>
                    </>
                  ) : <span className="text-[13px] text-text3">—</span>}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-14 text-center text-sm text-text2">Belum ada donasi yang masuk.</div>
        )}
      </div>
    </AdminLayout>
  );
}
