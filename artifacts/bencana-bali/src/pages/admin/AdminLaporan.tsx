import { useState } from "react";
import { Link } from "wouter";
import { useGetLaporan } from "@workspace/api-client-react";
import AdminLayout from "@/components/AdminLayout";
import { StatusBadge, JenisBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTanggalSingkat } from "@/lib/format";

const GRID = "grid min-w-[900px] grid-cols-[minmax(220px,1fr)_130px_180px_130px_150px_120px_60px] items-center gap-3.5";

export default function AdminLaporan() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const params = statusFilter !== "all" ? { status: statusFilter as any } : undefined;
  const { data: laporan, isLoading } = useGetLaporan(params);

  return (
    <AdminLayout activePage="laporan">
      <div className="flex flex-wrap items-end justify-between gap-[18px]">
        <div className="flex flex-col gap-[5px]">
          <h1 className="text-[22px] font-extrabold tracking-[-0.02em]">Semua laporan</h1>
          <p className="text-sm text-text2">Verifikasi dan kelola laporan bencana yang masuk.</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 border-border-strong bg-surface text-[13px] font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            <SelectItem value="menunggu">Menunggu</SelectItem>
            <SelectItem value="terverifikasi">Terverifikasi</SelectItem>
            <SelectItem value="selesai">Selesai</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-2 px-[18px] py-3">
          <b className="text-sm font-extrabold">Daftar laporan</b>
          <span className="font-mono text-[12.5px] text-text2">{isLoading ? "…" : `${laporan?.length ?? 0} laporan`}</span>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-[18px]">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : laporan && laporan.length > 0 ? (
          <div className="overflow-x-auto">
            <div className={`${GRID} border-b border-border px-[18px] py-2.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-text3`}>
              <span>Laporan</span><span>Jenis</span><span>Lokasi</span><span>Terdampak</span><span>Status</span><span>Tanggal</span><span />
            </div>
            {laporan.map(l => (
              <Link key={l.id} href={`/admin/laporan/${l.id}`} className={`${GRID} border-b border-border py-3.5 pl-[15px] pr-[18px] last:border-b-0 hover:bg-surface-2 hover:no-underline`}>
                <span className="flex min-w-0 flex-col gap-[3px]">
                  <b className="truncate text-[14.5px] font-bold text-foreground">{l.judul}</b>
                  <span className="truncate text-[12.5px] text-text2">{l.nama_pelapor}</span>
                </span>
                <span className="justify-self-start"><JenisBadge jenis={l.jenis_bencana} /></span>
                <span className="truncate text-[13px] text-text2">{l.lokasi}</span>
                <span className="font-mono text-[13px] text-text2">
                  {l.jumlah_terdampak ? `±${l.jumlah_terdampak.toLocaleString("id-ID")} jiwa` : "—"}
                </span>
                <span className="justify-self-start"><StatusBadge status={l.status} /></span>
                <span className="font-mono text-[12.5px] text-text2">{formatTanggalSingkat(l.created_at)}</span>
                <span className="justify-self-end text-[13px] font-bold text-primary">Buka</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-14 text-center text-sm text-text2">Tidak ada laporan ditemukan.</div>
        )}
      </div>
    </AdminLayout>
  );
}
