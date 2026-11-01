import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetLaporan, useUpdateLaporan, getGetLaporanQueryKey,
  useGetRelawan, useVerifikasiRelawan, getGetRelawanQueryKey,
  useGetInventaris, getGetInventarisQueryKey,
  getGetDashboardStatistikQueryKey,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Clock, TriangleAlert, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { JENIS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

type Queue = "laporan" | "relawan" | "stok";

function lamaMenunggu(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const menit = Math.floor(ms / 60000);
  if (menit < 60) return { label: `${menit} mnt`, urgent: menit >= 30 };
  const jam = Math.floor(menit / 60);
  if (jam < 24) return { label: `${jam} jam`, urgent: true };
  return { label: `${Math.floor(jam / 24)} hari`, urgent: true };
}

function maskKontak(kontak: string) {
  if (!kontak || kontak.length < 8) return kontak;
  return kontak.slice(0, 4) + "••••" + kontak.slice(-4);
}

function Tile({ active, onClick, icon, label, value, note, noteClass }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; value: number; note: string; noteClass: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2.5 rounded-xl border bg-surface px-[18px] py-4 text-left",
        active ? "border-primary shadow-[inset_4px_0_0_var(--primary)]" : "border-border",
      )}
    >
      <span className="flex items-center gap-2.5 text-[12.5px] font-bold uppercase tracking-[0.04em] text-text3">{icon}{label}</span>
      <b className="font-mono text-[38px] font-semibold leading-none tracking-[-0.03em]">{value}</b>
      <span className={cn("flex items-center gap-2 text-[13px] font-bold", noteClass)}>{note}</span>
    </button>
  );
}

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

export default function AdminDashboard() {
  const [queue, setQueue] = useState<Queue>("laporan");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: laporanMenunggu } = useGetLaporan({ status: "menunggu" });
  const { data: relawanMenunggu } = useGetRelawan({ status_verifikasi: "menunggu" });
  const { data: inventaris } = useGetInventaris();

  const updateLaporan = useUpdateLaporan();
  const verifikasiRelawan = useVerifikasiRelawan();

  const laporanSorted = useMemo(() => [...(laporanMenunggu ?? [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()), [laporanMenunggu]);
  const relawanSorted = useMemo(() => [...(relawanMenunggu ?? [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()), [relawanMenunggu]);
  const stokKritis = useMemo(() => (inventaris ?? []).filter(i => i.stok_sisa <= 5).sort((a, b) => a.stok_sisa - b.stok_sisa), [inventaris]);

  const total = laporanSorted.length + relawanSorted.length + stokKritis.length;

  const verifikasiLaporan = (id: number) => {
    updateLaporan.mutate({ id, data: { status: "terverifikasi" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLaporanQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatistikQueryKey() });
        toast({ title: "Laporan terverifikasi" });
      },
    });
  };

  const aksiRelawan = (id: number, status: "terverifikasi" | "ditolak") => {
    verifikasiRelawan.mutate({ id, data: { status_verifikasi: status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRelawanQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatistikQueryKey() });
        toast({ title: status === "terverifikasi" ? "Relawan terverifikasi" : "Relawan ditolak" });
      },
    });
  };

  const meta: Record<Queue, { title: string; count: string }> = {
    laporan: { title: "Laporan menunggu verifikasi", count: `${laporanSorted.length} laporan` },
    relawan: { title: "Relawan menunggu verifikasi", count: `${relawanSorted.length} pendaftar` },
    stok: { title: "Stok kritis", count: `${stokKritis.length} item` },
  };

  return (
    <AdminLayout activePage="antrian">
      <div className="flex flex-wrap items-end gap-[18px]">
        <div className="flex flex-col gap-[5px]">
          <h1 className="text-[22px] font-extrabold tracking-[-0.02em]">Antrian kerja</h1>
          <p className="text-sm text-text2">
            {total > 0 ? `${total} hal menunggu keputusan Anda. Mulai dari yang paling lama menunggu.` : "Semua antrian sudah bersih — tidak ada yang menunggu keputusan."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <Tile
          active={queue === "laporan"}
          onClick={() => setQueue("laporan")}
          icon={<Clock size={13} className="text-status-wait-fg" />}
          label="Laporan menunggu verifikasi"
          value={laporanSorted.length}
          note={laporanSorted.some(l => lamaMenunggu(l.created_at).urgent) ? `${laporanSorted.filter(l => lamaMenunggu(l.created_at).urgent).length} melewati batas 30 menit` : "Semua masih dalam batas waktu"}
          noteClass="text-primary"
        />
        <Tile
          active={queue === "relawan"}
          onClick={() => setQueue("relawan")}
          icon={<Clock size={13} className="text-status-wait-fg" />}
          label="Relawan menunggu verifikasi"
          value={relawanSorted.length}
          note={`${relawanSorted.filter(r => (r.keahlian ?? []).some(k => k.toLowerCase().includes("medis"))).length} punya keahlian medis`}
          noteClass="text-accent-ink"
        />
        <Tile
          active={queue === "stok"}
          onClick={() => setQueue("stok")}
          icon={<TriangleAlert size={13} className="text-primary" />}
          label="Stok kritis"
          value={stokKritis.length}
          note={stokKritis.length > 0 ? `Terendah: ${stokKritis[0].nama_barang} — sisa ${stokKritis[0].stok_sisa} ${stokKritis[0].satuan}` : "Tidak ada stok kritis"}
          noteClass="text-primary"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-2 px-[18px] py-3">
          <b className="text-sm font-extrabold">{meta[queue].title}</b>
          <span className="font-mono text-[12.5px] text-text2">{meta[queue].count}</span>
          <div className="flex-1" />
          <span className="text-[12.5px] text-text3">Urut: paling lama menunggu</span>
        </div>

        {queue === "laporan" && (
          laporanSorted.length === 0 ? (
            <div className="py-14 text-center text-sm text-text2">Tidak ada laporan menunggu verifikasi.</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid min-w-[860px] grid-cols-[78px_minmax(220px,1fr)_170px_150px_220px] gap-3.5 border-b border-border px-[18px] py-2.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-text3">
                <span>Menunggu</span><span>Laporan</span><span>Pelapor</span><span>Status</span><span>Tindakan</span>
              </div>
              {laporanSorted.map((l, i) => {
                const w = lamaMenunggu(l.created_at);
                return (
                  <div key={l.id} className={cn("grid min-w-[860px] grid-cols-[78px_minmax(220px,1fr)_170px_150px_220px] items-center gap-3.5 border-b border-border py-3.5 pl-[15px] pr-[18px] last:border-b-0", w.urgent ? "border-l-[3px] border-l-primary bg-primary-soft/40" : "border-l-[3px] border-l-transparent")}>
                    <span className={cn("font-mono text-[13.5px]", w.urgent ? "font-semibold text-primary" : "text-text2")}>{w.label}</span>
                    <span className="flex min-w-0 flex-col gap-[3px]">
                      <b className="text-[14.5px] font-bold">{l.judul}</b>
                      <span className="text-[12.5px] text-text2">
                        {l.lokasi} · {(l.foto_urls?.length ?? 0)} foto{l.jumlah_terdampak ? ` · ±${l.jumlah_terdampak.toLocaleString("id-ID")} jiwa` : ""}
                      </span>
                    </span>
                    <span className="flex flex-col gap-[3px] text-[13px] text-text2">
                      <b className="font-bold text-foreground">{l.nama_pelapor}</b>
                      <span className="font-mono text-xs">{maskKontak(l.kontak_pelapor)}</span>
                    </span>
                    <span className="justify-self-start"><StatusBadge status={l.status} /></span>
                    <span className="flex items-center gap-2">
                      <ActionBtn variant="primary" onClick={() => verifikasiLaporan(l.id)} disabled={updateLaporan.isPending}>Verifikasi</ActionBtn>
                      <Link href={`/admin/laporan/${l.id}`} className="text-[13px] font-bold hover:no-underline">Buka</Link>
                    </span>
                  </div>
                );
              })}
            </div>
          )
        )}

        {queue === "relawan" && (
          relawanSorted.length === 0 ? (
            <div className="py-14 text-center text-sm text-text2">Tidak ada relawan menunggu verifikasi.</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid min-w-[880px] grid-cols-[78px_minmax(220px,1fr)_190px_150px_220px] gap-3.5 border-b border-border px-[18px] py-2.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-text3">
                <span>Menunggu</span><span>Calon relawan</span><span>Keahlian</span><span>Status</span><span>Tindakan</span>
              </div>
              {relawanSorted.map(r => {
                const w = lamaMenunggu(r.created_at);
                return (
                  <div key={r.id} className={cn("grid min-w-[880px] grid-cols-[78px_minmax(220px,1fr)_190px_150px_220px] items-center gap-3.5 border-b border-border py-3.5 pl-[15px] pr-[18px] last:border-b-0", w.urgent ? "border-l-[3px] border-l-primary bg-primary-soft/40" : "border-l-[3px] border-l-transparent")}>
                    <span className={cn("font-mono text-[13.5px]", w.urgent ? "font-semibold text-primary" : "text-text2")}>{w.label}</span>
                    <span className="flex flex-col gap-[3px]">
                      <b className="text-[14.5px] font-bold">{r.nama}</b>
                      <span className="text-[12.5px] text-text2">{r.alamat}{(r.foto_ktp_signed_url ?? r.foto_ktp_url ?? undefined) ? " · KTP terlampir" : " · belum unggah KTP"}</span>
                    </span>
                    <span className="text-[13px] text-text2">{(r.keahlian ?? []).join(", ") || "—"}</span>
                    <span className="justify-self-start"><StatusBadge status={r.status_verifikasi} /></span>
                    <span className="flex items-center gap-2">
                      <ActionBtn variant="primary" onClick={() => aksiRelawan(r.id, "terverifikasi")} disabled={verifikasiRelawan.isPending}>Verifikasi</ActionBtn>
                      <ActionBtn onClick={() => aksiRelawan(r.id, "ditolak")} disabled={verifikasiRelawan.isPending}>Tolak</ActionBtn>
                      {(r.foto_ktp_signed_url ?? r.foto_ktp_url ?? undefined) && <a href={(r.foto_ktp_signed_url ?? r.foto_ktp_url ?? undefined)} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold hover:no-underline">Berkas</a>}
                    </span>
                  </div>
                );
              })}
            </div>
          )
        )}

        {queue === "stok" && (
          stokKritis.length === 0 ? (
            <div className="py-14 text-center text-sm text-text2">Tidak ada stok kritis saat ini.</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid min-w-[820px] grid-cols-[minmax(220px,1fr)_130px_170px_150px] gap-3.5 border-b border-border px-[18px] py-2.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-text3">
                <span>Item</span><span>Kategori</span><span>Sisa stok</span><span>Tindakan</span>
              </div>
              {stokKritis.map(item => (
                <div key={item.id} className="grid min-w-[820px] grid-cols-[minmax(220px,1fr)_130px_170px_150px] items-center gap-3.5 border-b border-border py-3.5 pl-[15px] pr-[18px] last:border-b-0">
                  <b className="text-[14.5px] font-bold">{item.nama_barang}</b>
                  <span className="text-[13px] text-text2">{item.kategori}</span>
                  <span className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-status-act-br bg-status-act-bg px-2 py-1 text-xs font-bold text-status-act-fg">
                      <TriangleAlert size={11} />
                      {item.stok_sisa} {item.satuan}
                    </span>
                  </span>
                  <Link href="/admin/inventaris" className="text-[13px] font-bold hover:no-underline">Kelola stok →</Link>
                </div>
              ))}
            </div>
          )
        )}

        <div className="flex flex-wrap items-center gap-3.5 border-t border-border bg-surface-2 px-[18px] py-3">
          <Info size={12} className="text-text3" />
          <span className="text-[12.5px] text-text2">Verifikasi laporan dan relawan langsung memperbarui data yang tampil di halaman transparansi publik.</span>
        </div>
      </div>
    </AdminLayout>
  );
}
