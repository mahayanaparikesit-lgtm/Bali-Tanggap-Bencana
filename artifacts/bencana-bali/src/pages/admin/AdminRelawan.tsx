import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetRelawan, useVerifikasiRelawan, getGetRelawanQueryKey, getGetDashboardStatistikQueryKey, type Relawan } from "@workspace/api-client-react";
import AdminLayout from "@/components/AdminLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const GRID = "grid min-w-[960px] grid-cols-[minmax(190px,1fr)_120px_150px_190px_100px_150px_190px] items-center gap-3.5";

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

export default function AdminRelawan() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Relawan | null>(null);
  const [action, setAction] = useState<"terverifikasi" | "ditolak" | null>(null);
  const [catatan, setCatatan] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = statusFilter !== "all" ? { status_verifikasi: statusFilter as any } : undefined;
  const { data: relawan, isLoading } = useGetRelawan(params);
  const verifikasi = useVerifikasiRelawan();

  const handleVerify = () => {
    if (!selected || !action) return;
    verifikasi.mutate({ id: selected.id, data: { status_verifikasi: action, catatan_verifikasi: catatan || null } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRelawanQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatistikQueryKey() });
        toast({ title: action === "terverifikasi" ? "Relawan terverifikasi" : "Relawan ditolak" });
        setSelected(null); setAction(null); setCatatan("");
      }
    });
  };

  return (
    <AdminLayout activePage="relawan">
      <div className="flex flex-wrap items-end justify-between gap-[18px]">
        <div className="flex flex-col gap-[5px]">
          <h1 className="text-[22px] font-extrabold tracking-[-0.02em]">Relawan</h1>
          <p className="text-sm text-text2">Verifikasi KTP dan kelola pendaftaran relawan.</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 border-border-strong bg-surface text-[13px] font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            <SelectItem value="menunggu">Menunggu verifikasi</SelectItem>
            <SelectItem value="terverifikasi">Terverifikasi</SelectItem>
            <SelectItem value="ditolak">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-2 px-[18px] py-3">
          <b className="text-sm font-extrabold">Daftar relawan</b>
          <span className="font-mono text-[12.5px] text-text2">{isLoading ? "…" : `${relawan?.length ?? 0} relawan`}</span>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-[18px]">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : relawan && relawan.length > 0 ? (
          <div className="overflow-x-auto">
            <div className={`${GRID} border-b border-border px-[18px] py-2.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-text3`}>
              <span>Nama</span><span>NIK</span><span>Kontak</span><span>Keahlian</span><span>KTP</span><span>Status</span><span>Aksi</span>
            </div>
            {relawan.map(r => (
              <div key={r.id} className={`${GRID} border-b border-border py-3.5 pl-[15px] pr-[18px] last:border-b-0`}>
                <span className="flex min-w-0 flex-col gap-[3px]">
                  <b className="truncate text-[14.5px] font-bold">{r.nama}</b>
                  <span className="truncate text-[12.5px] text-text2">{r.alamat}</span>
                </span>
                <span className="font-mono text-[12.5px] text-text2">{r.nik}</span>
                <span className="flex min-w-0 flex-col gap-[2px] text-[13px] text-text2">
                  <span className="truncate">{r.no_hp}</span>
                  {r.email && <span className="truncate text-[11.5px] text-text3">{r.email}</span>}
                </span>
                <span className="truncate text-[13px] text-text2">{(r.keahlian ?? []).join(", ") || "—"}</span>
                <span>
                  {(r.foto_ktp_signed_url ?? r.foto_ktp_url ?? undefined) ? (
                    <a href={(r.foto_ktp_signed_url ?? r.foto_ktp_url ?? undefined)} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-primary hover:no-underline">
                      Lihat
                    </a>
                  ) : <span className="text-[13px] text-text3">—</span>}
                </span>
                <span className="justify-self-start"><StatusBadge status={r.status_verifikasi} /></span>
                <span className="flex items-center gap-2">
                  {r.status_verifikasi === "menunggu" ? (
                    <>
                      <ActionBtn variant="primary" onClick={() => { setSelected(r); setAction("terverifikasi"); }}>Verifikasi</ActionBtn>
                      <ActionBtn onClick={() => { setSelected(r); setAction("ditolak"); }}>Tolak</ActionBtn>
                    </>
                  ) : <span className="text-[13px] text-text3">—</span>}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-14 text-center text-sm text-text2">Tidak ada relawan ditemukan.</div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={open => { if (!open) { setSelected(null); setAction(null); setCatatan(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "terverifikasi" ? "Verifikasi relawan" : "Tolak relawan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">Relawan: <strong>{selected?.nama}</strong></p>
            <div>
              <Label>Catatan (opsional)</Label>
              <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={3} className="mt-1" placeholder="Alasan verifikasi/penolakan..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelected(null); setAction(null); setCatatan(""); }}>Batal</Button>
            <Button onClick={handleVerify} disabled={verifikasi.isPending} variant={action === "ditolak" ? "destructive" : "default"}>
              {verifikasi.isPending ? "Menyimpan..." : action === "terverifikasi" ? "Verifikasi" : "Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
