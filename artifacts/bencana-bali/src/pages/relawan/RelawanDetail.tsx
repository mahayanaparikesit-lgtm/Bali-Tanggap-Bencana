import { useParams } from "wouter";
import { useGetRelawanById, useGetPenugasan, getGetRelawanByIdQueryKey, getGetPenugasanQueryKey } from "@workspace/api-client-react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Phone, Mail, MapPin, CreditCard, ExternalLink, Clock } from "lucide-react";

export default function RelawanDetail() {
  const { id } = useParams<{ id: string }>();
  const relawanId = parseInt(id);

  const { data: relawan, isLoading } = useGetRelawanById(relawanId, { query: { enabled: !!relawanId, queryKey: getGetRelawanByIdQueryKey(relawanId) } });
  const { data: penugasan } = useGetPenugasan({ relawan_id: relawanId }, { query: { enabled: !!relawanId, queryKey: getGetPenugasanQueryKey({ relawan_id: relawanId }) } });

  if (isLoading) return (
    <AppLayout title="Profil Relawan" backHref="/relawan" role="relawan">
      <div className="space-y-4"><Skeleton className="h-40 w-full" /></div>
    </AppLayout>
  );

  if (!relawan) return (
    <AppLayout title="Profil Relawan" backHref="/relawan" role="relawan">
      <p className="text-text2">Relawan tidak ditemukan.</p>
    </AppLayout>
  );

  return (
    <AppLayout title="Profil Relawan" backHref="/relawan" backLabel="Dashboard" role="relawan">
      <div className="max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{relawan.nama}</h1>
            <p className="mt-0.5 text-sm text-text2">
              Terdaftar: {new Date(relawan.created_at).toLocaleDateString("id-ID")}
            </p>
          </div>
          <StatusBadge status={relawan.status_verifikasi} />
        </div>

        {relawan.status_verifikasi === "menunggu" && (
          <div className="flex items-start gap-2.5 rounded-[10px] border border-status-wait-br bg-status-wait-bg px-4 py-3 text-sm text-status-wait-fg">
            <Clock size={15} className="mt-0.5 shrink-0" />
            Pendaftaran Anda sedang dalam proses verifikasi oleh admin. Harap menunggu konfirmasi.
          </div>
        )}

        <Card className="rounded-[10px] border-border bg-surface shadow-none">
          <CardHeader className="pb-3"><CardTitle className="text-base font-bold">Data Pribadi</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2"><User className="h-4 w-4 text-text2" /><span>{relawan.nama}</span></div>
            <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-text2" /><span className="font-mono">NIK: {relawan.nik}</span></div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-text2" /><span className="font-mono">{relawan.no_hp}</span></div>
            {relawan.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-text2" /><span>{relawan.email}</span></div>}
            <div className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 text-text2" /><span>{relawan.alamat}</span></div>
          </CardContent>
        </Card>

        {relawan.keahlian && relawan.keahlian.length > 0 && (
          <Card className="rounded-[10px] border-border bg-surface shadow-none">
            <CardHeader className="pb-3"><CardTitle className="text-base font-bold">Keahlian</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {relawan.keahlian.map(k => (
                  <Badge key={k} variant="secondary">{k}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {relawan.catatan_verifikasi && (
          <Card className="rounded-[10px] border-border bg-surface shadow-none">
            <CardContent className="p-4 text-sm">
              <p className="mb-1 font-medium">Catatan Verifikasi:</p>
              <p className="text-text2">{relawan.catatan_verifikasi}</p>
            </CardContent>
          </Card>
        )}

        {penugasan && penugasan.length > 0 && (
          <Card className="rounded-[10px] border-border bg-surface shadow-none">
            <CardHeader className="pb-3"><CardTitle className="text-base font-bold">Penugasan</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {penugasan.map(p => (
                <div key={p.id} className="rounded-[10px] border border-border p-3 text-sm">
                  <div className="mb-1 flex justify-between">
                    <p className="font-medium">{p.detail_tugas}</p>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="flex items-center gap-1 text-text2"><MapPin className="h-3 w-3" />{p.lokasi_tugas}</p>
                  {p.link_grup && (
                    <a href={p.link_grup} target="_blank" rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> Bergabung ke Grup
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
