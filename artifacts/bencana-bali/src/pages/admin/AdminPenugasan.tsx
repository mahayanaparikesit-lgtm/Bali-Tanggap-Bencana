import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetPenugasan, useUpdatePenugasan, getGetPenugasanQueryKey, getGetDashboardStatistikQueryKey } from "@workspace/api-client-react";
import AdminLayout from "@/components/AdminLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatTanggalSingkat } from "@/lib/format";
import { cn } from "@/lib/utils";

const GRID = "grid min-w-[960px] grid-cols-[minmax(170px,1fr)_minmax(220px,1.4fr)_160px_140px_130px_120px_160px] items-center gap-3.5";

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

export default function AdminPenugasan() {
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = statusFilter !== "all" ? { status: statusFilter as any } : undefined;
  const { data: penugasan, isLoading } = useGetPenugasan(params);
  const updatePenugasan = useUpdatePenugasan();

  const handleUpdate = (id: number, status: "selesai" | "dibatalkan") => {
    updatePenugasan.mutate({ id, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPenugasanQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatistikQueryKey() });
        toast({ title: `Penugasan diperbarui: ${status}` });
      }
    });
  };

  return (
    <AdminLayout activePage="penugasan">
      <div className="flex flex-wrap items-end justify-between gap-[18px]">
        <div className="flex flex-col gap-[5px]">
          <h1 className="text-[22px] font-extrabold tracking-[-0.02em]">Penugasan</h1>
          <p className="text-sm text-text2">Pantau dan kelola penugasan relawan di lapangan.</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 border-border-strong bg-surface text-[13px] font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="aktif">Aktif</SelectItem>
            <SelectItem value="selesai">Selesai</SelectItem>
            <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-2 px-[18px] py-3">
          <b className="text-sm font-extrabold">Daftar penugasan</b>
          <span className="font-mono text-[12.5px] text-text2">{isLoading ? "…" : `${penugasan?.length ?? 0} penugasan`}</span>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-[18px]">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : penugasan && penugasan.length > 0 ? (
          <div className="overflow-x-auto">
            <div className={`${GRID} border-b border-border px-[18px] py-2.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-text3`}>
              <span>Relawan</span><span>Tugas</span><span>Lokasi</span><span>Grup</span><span>Status</span><span>Tanggal</span><span>Aksi</span>
            </div>
            {penugasan.map(p => (
              <div key={p.id} className={`${GRID} border-b border-border py-3.5 pl-[15px] pr-[18px] last:border-b-0`}>
                <span className="flex min-w-0 flex-col gap-[3px]">
                  <b className="truncate text-[14.5px] font-bold">{p.nama_relawan}</b>
                  <span className="text-[12.5px] text-text2">Laporan #{p.laporan_id}</span>
                </span>
                <span className="flex min-w-0 flex-col gap-[2px]">
                  <span className="truncate text-[13px] text-foreground">{p.detail_tugas}</span>
                  {p.catatan && <span className="truncate text-[11.5px] text-text3">{p.catatan}</span>}
                </span>
                <span className="truncate text-[13px] text-text2">{p.lokasi_tugas}</span>
                <span>
                  {p.link_grup ? (
                    <a href={p.link_grup} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-primary hover:no-underline">
                      Buka grup
                    </a>
                  ) : <span className="text-[13px] text-text3">—</span>}
                </span>
                <span className="justify-self-start"><StatusBadge status={p.status} /></span>
                <span className="font-mono text-[12.5px] text-text2">{formatTanggalSingkat(p.created_at)}</span>
                <span className="flex items-center gap-2">
                  {p.status === "aktif" ? (
                    <>
                      <ActionBtn variant="primary" onClick={() => handleUpdate(p.id, "selesai")} disabled={updatePenugasan.isPending}>Selesai</ActionBtn>
                      <ActionBtn onClick={() => handleUpdate(p.id, "dibatalkan")} disabled={updatePenugasan.isPending}>Batal</ActionBtn>
                    </>
                  ) : <span className="text-[13px] text-text3">—</span>}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-14 text-center text-sm text-text2">Tidak ada penugasan ditemukan.</div>
        )}
      </div>
    </AdminLayout>
  );
}
