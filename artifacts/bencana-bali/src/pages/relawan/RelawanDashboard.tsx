import { Link, useLocation } from "wouter";
import { useGetLaporanAktif, useGetPenugasan } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, JenisBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MapPin, ClipboardList, ExternalLink, UserCheck, X, Calendar, CheckCircle2, Clock, FileWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatTanggalSingkat } from "@/lib/format";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.VITE_API_URL.replace(/\/$/, "");

// ──── Panel: wadah seksi konten, sesuai pola AdminDashboard/AdminPenugasan
// (rounded-xl + header bar bg-surface-2 + daftar baris) supaya dashboard
// relawan terasa satu keluarga visual dengan konsol admin, bukan bahasa
// desain terpisah (kartu-kartu lepas dengan shadow masing-masing). ────
function SectionPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("overflow-hidden rounded-xl border border-border bg-surface", className)}>{children}</div>;
}

function SectionPanelHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-border bg-surface-2 px-[18px] py-3">
      {icon}
      <b className="text-sm font-extrabold">{title}</b>
      {count != null && <span className="font-mono text-[12.5px] text-text2">{count}</span>}
    </div>
  );
}

export default function RelawanDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: laporanAktif, isLoading: loadingLaporan } = useGetLaporanAktif();
  const { data: penugasan, isLoading: loadingPenugasan } = useGetPenugasan({ status: "aktif" });

  // Cek apakah user ini sudah punya data relawan (by email)
  const { data: cekRelawan, isLoading: loadingCek } = useQuery({
    queryKey: ["relawan-cek-email", user?.email],
    queryFn: async () => {
      if (!user?.email) return { terdaftar: false };
      const res = await fetch(`${BASE}/api/relawan/cek-email?email=${encodeURIComponent(user.email)}`, {
        credentials: "include",
      });
      return res.json() as Promise<{ terdaftar: boolean; relawan?: any }>;
    },
    enabled: !!user?.email,
  });

  const sudahDaftar = cekRelawan?.terdaftar;
  const dataRelawan = cekRelawan?.relawan;

  const statusIcon = dataRelawan?.status_verifikasi === "terverifikasi"
    ? <CheckCircle2 size={15} />
    : dataRelawan?.status_verifikasi === "ditolak"
    ? <X className="h-3.5 w-3.5" />
    : <Clock size={14} />;

  const statusText = dataRelawan?.status_verifikasi === "terverifikasi"
    ? "Anda telah terverifikasi sebagai relawan aktif"
    : dataRelawan?.status_verifikasi === "ditolak"
    ? "Pendaftaran Anda ditolak. Hubungi admin untuk informasi lebih lanjut."
    : "Pendaftaran Anda sedang menunggu verifikasi admin";

  const statusClass = dataRelawan?.status_verifikasi === "terverifikasi"
    ? "bg-status-ver-bg border-status-ver-br text-status-ver-fg"
    : dataRelawan?.status_verifikasi === "ditolak"
    ? "bg-status-rej-bg border-status-rej-br text-status-rej-fg"
    : "bg-status-wait-bg border-status-wait-br text-status-wait-fg";

  return (
    <AppLayout
      title="Dashboard Relawan"
      role="relawan"
      actions={
        !loadingCek && !sudahDaftar ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/relawan/daftar">
              <Plus className="h-4 w-4 mr-1" /> Daftar Relawan
            </Link>
          </Button>
        ) : null
      }
    >
      <div className="space-y-5">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.02em]">Pusat Relawan</h1>
          <p className="mt-1 text-sm text-text2">Pantau penugasan aktif Anda dan situasi bencana terkini di lapangan.</p>
        </div>

        {/* Status pendaftaran relawan */}
        {!loadingCek && sudahDaftar && dataRelawan && (
          <div className={cn("flex items-start gap-3 rounded-xl border px-5 py-4", statusClass)}>
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card">{statusIcon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{statusText}</p>
              {dataRelawan.catatan_verifikasi && (
                <p className="mt-0.5 text-xs opacity-80">Catatan admin: {dataRelawan.catatan_verifikasi}</p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 shrink-0 border-current px-2 text-xs"
              onClick={() => navigate(`/relawan/${dataRelawan.id}`)}
            >
              <UserCheck className="h-3.5 w-3.5 mr-1" /> Lihat Profil
            </Button>
          </div>
        )}

        {!loadingCek && !sudahDaftar && (
          <Card className="rounded-xl border-dashed border-border-strong bg-surface shadow-none">
            <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2">
                <UserCheck className="h-5 w-5 text-text2" />
              </span>
              <p className="text-sm font-bold">Belum terdaftar sebagai relawan</p>
              <p className="mb-1 max-w-sm text-xs text-text2">Daftarkan diri Anda untuk bisa ditugaskan ke lokasi bencana</p>
              <Button asChild size="sm" variant="secondary">
                <Link href="/relawan/daftar">
                  <Plus className="h-4 w-4 mr-1" /> Daftar Sekarang
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Penugasan Aktif diletakkan sebagai fokus utama (kolom lebar) karena
            ini yang paling actionable buat relawan — ada tugas + lokasi + link
            koordinasi. Laporan Aktif jadi panel kesadaran situasi di sampingnya,
            lebih ringkas karena sifatnya informatif, bukan tindakan langsung. */}
        <div className="grid items-start gap-5 lg:grid-cols-[1.7fr_1fr]">
          {/* Penugasan Aktif */}
          <SectionPanel>
            <SectionPanelHeader
              icon={<ClipboardList className="h-4 w-4 text-accent-ink" />}
              title="Penugasan Aktif"
              count={!loadingPenugasan ? `${penugasan?.length ?? 0} penugasan` : undefined}
            />
            {loadingPenugasan ? (
              <div className="space-y-2 p-[18px]">{[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : penugasan && penugasan.length > 0 ? (
              <div>
                {penugasan.map(p => (
                  <div key={p.id} className="border-b border-border px-[18px] py-4 last:border-b-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <StatusBadge status={p.status} />
                      <span className="ml-auto flex shrink-0 items-center gap-1 font-mono text-[11px] text-text3">
                        <Calendar className="h-3 w-3" /> {formatTanggalSingkat(p.created_at)}
                      </span>
                    </div>
                    <p className="text-[15px] font-bold leading-snug">{p.detail_tugas}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text2">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" /> {p.lokasi_tugas}
                      </span>
                      <span>Relawan: {p.nama_relawan}</span>
                    </div>
                    {p.link_grup && (
                      <a href={p.link_grup} target="_blank" rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                        <ExternalLink className="h-3 w-3" /> Bergabung ke Grup
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-[18px] py-14 text-center text-sm text-text2">Belum ada penugasan aktif.</div>
            )}
          </SectionPanel>

          {/* Laporan Aktif */}
          <SectionPanel>
            <SectionPanelHeader
              icon={<FileWarning size={16} className="text-primary" />}
              title="Laporan Aktif"
              count={!loadingLaporan ? `${laporanAktif?.length ?? 0} laporan` : undefined}
            />
            {loadingLaporan ? (
              <div className="space-y-2 p-[18px]">{[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : laporanAktif && laporanAktif.length > 0 ? (
              <div>
                {laporanAktif.map(l => (
                  <div key={l.id} className="border-b border-border px-4 py-3.5 last:border-b-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <JenisBadge jenis={l.jenis_bencana} />
                      <span className="ml-auto shrink-0 font-mono text-[11px] text-text3">
                        {formatTanggalSingkat(l.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-bold leading-snug">{l.judul}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text2">
                      <span className="flex min-w-0 items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{l.lokasi}</span>
                      </span>
                      {l.jumlah_terdampak ? (
                        <span className="shrink-0">{l.jumlah_terdampak.toLocaleString("id-ID")} jiwa terdampak</span>
                      ) : null}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={l.status} />
                      {l.jumlah_kebutuhan_pending > 0 && (
                        <Badge variant="outline" className="border-status-wait-br bg-status-wait-bg text-[11px] text-status-wait-fg">
                          {l.jumlah_kebutuhan_pending} kebutuhan
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-[18px] py-14 text-center text-sm text-text2">Tidak ada laporan aktif saat ini.</div>
            )}
          </SectionPanel>
        </div>
      </div>
    </AppLayout>
  );
}
