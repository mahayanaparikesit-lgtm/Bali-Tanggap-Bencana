import { Link } from "wouter";
import { useGetLaporanSaya } from "@workspace/api-client-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, JenisBadge } from "@/components/StatusBadge";
import { Plus, MapPin, Users, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PelaporDashboard() {
  // S10: hanya laporan milik akun ini, termasuk yang masih menunggu verifikasi.
  const { data: laporan, isLoading } = useGetLaporanSaya();

  return (
    <AppLayout
      title="Dashboard Pelapor"
      subtitle="Bali-Rief"
      role="pelapor"
      actions={
        <Button asChild size="sm">
          <Link href="/pelapor/laporan-baru">
            <Plus className="h-4 w-4 mr-1" /> Laporan Baru
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Laporan Bencana</h1>
            <p className="mt-1 text-sm text-text2">
              Semua laporan bencana yang telah disampaikan
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
        ) : laporan && laporan.length > 0 ? (
          <div className="space-y-3">
            {laporan.map(l => (
              <Link key={l.id} href={`/pelapor/laporan/${l.id}`}>
                <Card className="cursor-pointer rounded-[10px] border-border bg-surface shadow-none transition-colors hover:border-primary">
                  <CardContent className="p-5">
                    {l.status === "menunggu" && (
                      <div className="mb-3 flex items-center gap-2 rounded-[8px] border border-status-wait-br bg-status-wait-bg px-3 py-2 text-xs text-status-wait-fg">
                        <Clock size={13} className="shrink-0" />
                        <span>Menunggu verifikasi admin — laporan belum terlihat oleh donatur</span>
                      </div>
                    )}
                    {l.status === "terverifikasi" && (
                      <div className="mb-3 flex items-center gap-2 rounded-[8px] border border-status-ver-br bg-status-ver-bg px-3 py-2 text-xs text-status-ver-fg">
                        <CheckCircle2 size={13} className="shrink-0" />
                        <span>Terverifikasi — laporan sudah ditampilkan kepada donatur</span>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <JenisBadge jenis={l.jenis_bencana} />
                          <StatusBadge status={l.status} />
                        </div>
                        <h3 className="truncate text-sm font-semibold">{l.judul}</h3>
                        <div className="mt-2 flex items-center gap-4 text-xs text-text2">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {l.lokasi}
                          </span>
                          {l.jumlah_terdampak && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" /> {l.jumlah_terdampak} jiwa
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="h-3 w-3" />
                            {new Date(l.created_at).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="rounded-[10px] border-border bg-surface shadow-none">
            <CardContent className="py-16 text-center">
              <p className="mb-4 text-text2">Belum ada laporan. Buat laporan pertama Anda.</p>
              <Button asChild>
                <Link href="/pelapor/laporan-baru">
                  <Plus className="h-4 w-4 mr-1" /> Buat Laporan
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
