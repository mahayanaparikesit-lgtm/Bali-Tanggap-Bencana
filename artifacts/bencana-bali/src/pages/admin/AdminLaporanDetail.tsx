import { useState } from "react";
import { useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetLaporanById, useUpdateLaporan, useGetKebutuhanByLaporan,
  useCreateKebutuhan, useUpdateKebutuhan, useGetRelawan, useCreatePenugasan,
  getGetLaporanQueryKey, getGetLaporanByIdQueryKey, getGetKebutuhanByLaporanQueryKey,
  getGetDashboardStatistikQueryKey, getGetLaporanAktifQueryKey, getGetRelawanQueryKey
} from "@workspace/api-client-react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, JenisBadge } from "@/components/StatusBadge";
import KebutuhanProgress from "@/components/KebutuhanProgress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatRupiah } from "@/lib/format";
import { MapPin, Users, Phone, User, CheckCircle2, XCircle, Plus, ClipboardList, Banknote, FileText, ChevronDown, ChevronUp } from "lucide-react";

const KATEGORI_OPTIONS = ["pangan", "sandang", "medis", "tempat_tinggal", "air_bersih", "lainnya"];
const KATEGORI_LABELS: Record<string, string> = {
  pangan: "Pangan", sandang: "Sandang", medis: "Medis",
  tempat_tinggal: "Tempat Tinggal", air_bersih: "Air Bersih", lainnya: "Lainnya"
};

export default function AdminLaporanDetail() {
  const { id } = useParams<{ id: string }>();
  const laporanId = parseInt(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: laporan, isLoading } = useGetLaporanById(laporanId, { query: { enabled: !!laporanId, queryKey: getGetLaporanByIdQueryKey(laporanId) } });
  const { data: kebutuhan } = useGetKebutuhanByLaporan(laporanId, { query: { enabled: !!laporanId, queryKey: getGetKebutuhanByLaporanQueryKey(laporanId) } });
  const { data: relawanList } = useGetRelawan({ status_verifikasi: "terverifikasi" }, { query: { queryKey: getGetRelawanQueryKey({ status_verifikasi: "terverifikasi" }) } });

  const updateLaporan = useUpdateLaporan();
  const createKebutuhan = useCreateKebutuhan();
  const updateKebutuhan = useUpdateKebutuhan();
  const createPenugasan = useCreatePenugasan();

  const [catatan, setCatatan] = useState("");
  const [targetDana, setTargetDana] = useState("");
  const [kronologi, setKronologi] = useState("");
  const [showDanaForm, setShowDanaForm] = useState(false);
  const [newKebutuhan, setNewKebutuhan] = useState({ kategori: "", nama_item: "", jumlah_dibutuhkan: "", satuan: "" });
  const [newPenugasan, setNewPenugasan] = useState({ relawan_id: "", detail_tugas: "", lokasi_tugas: "", link_grup: "" });
  const [showKebutuhanForm, setShowKebutuhanForm] = useState(false);
  const [showPenugasanForm, setShowPenugasanForm] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<Record<number, string>>({});

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetLaporanQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetLaporanByIdQueryKey(laporanId) });
    queryClient.invalidateQueries({ queryKey: getGetDashboardStatistikQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetLaporanAktifQueryKey() });
  };

  const handleVerify = (status: "terverifikasi" | "selesai") => {
    updateLaporan.mutate({ id: laporanId, data: { status, catatan_admin: catatan || undefined } }, {
      onSuccess: () => { invalidateAll(); toast({ title: `Laporan diperbarui ke status: ${status}` }); }
    });
  };

  const handleAddKebutuhan = () => {
    if (!newKebutuhan.kategori || !newKebutuhan.nama_item || !newKebutuhan.jumlah_dibutuhkan || !newKebutuhan.satuan) return;
    createKebutuhan.mutate({
      id: laporanId,
      data: { ...newKebutuhan, jumlah_dibutuhkan: parseInt(newKebutuhan.jumlah_dibutuhkan) } as any
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetKebutuhanByLaporanQueryKey(laporanId) });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatistikQueryKey() });
        setNewKebutuhan({ kategori: "", nama_item: "", jumlah_dibutuhkan: "", satuan: "" });
        setShowKebutuhanForm(false);
        toast({ title: "Kebutuhan berhasil ditambahkan" });
      }
    });
  };

  const handleUpdateProgress = (kebutuhanId: number) => {
    const val = updateProgress[kebutuhanId];
    if (!val) return;
    updateKebutuhan.mutate({ id: kebutuhanId, data: { jumlah_terpenuhi: parseInt(val) } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetKebutuhanByLaporanQueryKey(laporanId) });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatistikQueryKey() });
        setUpdateProgress(p => { const n = { ...p }; delete n[kebutuhanId]; return n; });
        toast({ title: "Progress kebutuhan diperbarui" });
      }
    });
  };

  const handleAddPenugasan = () => {
    if (!newPenugasan.relawan_id || !newPenugasan.detail_tugas || !newPenugasan.lokasi_tugas) return;
    const relawan = relawanList?.find(r => r.id === parseInt(newPenugasan.relawan_id));
    if (!relawan) return;
    createPenugasan.mutate({
      data: {
        laporan_id: laporanId,
        relawan_id: parseInt(newPenugasan.relawan_id),
        detail_tugas: newPenugasan.detail_tugas,
        lokasi_tugas: newPenugasan.lokasi_tugas,
        link_grup: newPenugasan.link_grup || null,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatistikQueryKey() });
        setNewPenugasan({ relawan_id: "", detail_tugas: "", lokasi_tugas: "", link_grup: "" });
        setShowPenugasanForm(false);
        toast({ title: "Penugasan berhasil dibuat" });
      }
    });
  };

  if (isLoading) return (
    <AdminLayout activePage="laporan">
      <Skeleton className="h-64 w-full" />
    </AdminLayout>
  );

  if (!laporan) return (
    <AdminLayout activePage="laporan">
      <p className="text-text2">Laporan tidak ditemukan.</p>
    </AdminLayout>
  );

  return (
    <AdminLayout activePage="laporan">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-[18px]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <JenisBadge jenis={laporan.jenis_bencana} />
              <StatusBadge status={laporan.status} />
            </div>
            <h1 className="text-[20px] font-extrabold tracking-[-0.01em]">{laporan.judul}</h1>
          </div>
        </div>

        {/* Info */}
        <Card className="rounded-xl border-border bg-surface shadow-none">
          <CardHeader className="border-b border-border bg-surface-2 px-[18px] py-3">
            <CardTitle className="text-sm font-extrabold">Informasi kejadian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-[18px] text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-text3" />
              <span>{laporan.lokasi}</span>
            </div>
            {laporan.lokasi_pengungsian && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" />
                <span>Pengungsian: {laporan.lokasi_pengungsian}</span>
              </div>
            )}
            {laporan.jumlah_terdampak && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-text3" />
                <span className="font-mono">{laporan.jumlah_terdampak.toLocaleString("id-ID")}</span> jiwa terdampak
              </div>
            )}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-text3" />
              <span>{laporan.nama_pelapor}{laporan.jabatan_pelapor ? ` — ${laporan.jabatan_pelapor}` : ""}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-text3" />
              <span className="font-mono">{laporan.kontak_pelapor}</span>
            </div>
            <div className="mt-2 border-t border-border pt-2">
              <p className="text-text2">{laporan.deskripsi}</p>
            </div>
          </CardContent>
        </Card>

        {/* Dokumentasi & verifikasi identitas — foto KTP cuma tampil di sini
            (admin), tidak pernah dikirim ke halaman publik/transparansi. */}
        {((laporan.foto_urls?.length ?? 0) > 0 || laporan.foto_ktp_url) && (
          <Card className="rounded-xl border-border bg-surface shadow-none">
            <CardHeader className="border-b border-border bg-surface-2 px-[18px] py-3">
              <CardTitle className="text-sm font-extrabold">Dokumentasi & verifikasi identitas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-[18px]">
              {(laporan.foto_urls?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold text-text3">Foto kejadian ({laporan.foto_urls!.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {laporan.foto_urls!.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Foto kejadian ${i + 1}`} className="aspect-square w-full rounded-lg border border-border object-cover hover:opacity-90" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {laporan.foto_ktp_url && (
                <div>
                  <p className="mb-2 text-xs font-bold text-text3">Foto KTP pelapor — hanya untuk admin, jangan disebarkan</p>
                  <a href={laporan.foto_ktp_url} target="_blank" rel="noopener noreferrer" className="inline-block">
                    <img src={laporan.foto_ktp_url} alt="Foto KTP pelapor" className="h-40 rounded-lg border border-border object-cover hover:opacity-90" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Target Dana & Kronologi — hanya untuk laporan terverifikasi */}
        {laporan.status !== "menunggu" && (
          <Card className="rounded-xl border-border bg-surface shadow-none">
            <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border bg-surface-2 px-[18px] py-3">
              <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                <Banknote className="h-4 w-4 text-primary" /> Target dana & kronologi
              </CardTitle>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                onClick={() => setShowDanaForm(v => !v)}>
                {showDanaForm ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showDanaForm ? "Tutup" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 p-[18px]">
              {/* Tampilkan nilai aktif */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-surface-2 p-3">
                  <p className="mb-1 text-xs font-bold text-text3">Target dana</p>
                  <p className="font-mono font-bold text-primary">
                    {laporan.target_dana ? formatRupiah(laporan.target_dana) : "Belum diset"}
                  </p>
                </div>
                <div className="rounded-lg bg-surface-2 p-3">
                  <p className="mb-1 text-xs font-bold text-text3">Kronologi</p>
                  <p className="line-clamp-2 text-xs leading-relaxed text-text2">
                    {laporan.kronologi || <span className="italic text-text3">Belum diisi</span>}
                  </p>
                </div>
              </div>
              {showDanaForm && (
                <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-4">
                  <div>
                    <Label className="text-xs">Target dana (Rp)</Label>
                    <Input
                      type="number"
                      className="mt-1 h-8 text-xs"
                      placeholder={laporan.target_dana?.toString() || "cth: 5000000"}
                      value={targetDana}
                      onChange={e => setTargetDana(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-text3">Donatur akan melihat progress bar pencapaian target ini.</p>
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" /> Kronologi kejadian</Label>
                    <Textarea
                      rows={4}
                      className="mt-1 text-xs"
                      placeholder="Tuliskan kronologi kejadian secara urut..."
                      value={kronologi}
                      onChange={e => setKronologi(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    disabled={updateLaporan.isPending || (!targetDana && !kronologi)}
                    onClick={() => {
                      const payload: any = {};
                      if (targetDana) payload.target_dana = parseInt(targetDana);
                      if (kronologi) payload.kronologi = kronologi;
                      updateLaporan.mutate({ id: laporanId, data: payload }, {
                        onSuccess: () => {
                          invalidateAll();
                          setTargetDana("");
                          setKronologi("");
                          setShowDanaForm(false);
                          toast({ title: "Berhasil disimpan" });
                        }
                      });
                    }}
                  >
                    {updateLaporan.isPending ? "Menyimpan..." : "Simpan perubahan"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Verifikasi */}
        {laporan.status === "menunggu" && (
          <Card className="rounded-xl border-status-wait-br bg-status-wait-bg shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold text-status-wait-fg">Aksi verifikasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Catatan admin (opsional)</Label>
                <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2} className="mt-1" placeholder="Catatan untuk pelapor..." />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleVerify("terverifikasi")} className="flex-1" disabled={updateLaporan.isPending}>
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Verifikasi
                </Button>
                <Button variant="outline" onClick={() => handleVerify("selesai")} disabled={updateLaporan.isPending}>
                  <XCircle className="mr-1 h-4 w-4" /> Selesai
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kebutuhan */}
        <Card className="rounded-xl border-border bg-surface shadow-none">
          <CardHeader className="border-b border-border bg-surface-2 px-[18px] py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-extrabold">Kebutuhan bantuan</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowKebutuhanForm(!showKebutuhanForm)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Tambah
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-[18px]">
            {showKebutuhanForm && (
              <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Kategori</Label>
                    <Select value={newKebutuhan.kategori} onValueChange={v => setNewKebutuhan(f => ({ ...f, kategori: v }))}>
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue placeholder="Pilih..." />
                      </SelectTrigger>
                      <SelectContent>
                        {KATEGORI_OPTIONS.map(k => <SelectItem key={k} value={k}>{KATEGORI_LABELS[k]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Nama item</Label>
                    <Input className="mt-1 h-8 text-xs" value={newKebutuhan.nama_item} onChange={e => setNewKebutuhan(f => ({ ...f, nama_item: e.target.value }))} placeholder="cth: Beras" />
                  </div>
                  <div>
                    <Label className="text-xs">Jumlah dibutuhkan</Label>
                    <Input type="number" className="mt-1 h-8 text-xs" value={newKebutuhan.jumlah_dibutuhkan} onChange={e => setNewKebutuhan(f => ({ ...f, jumlah_dibutuhkan: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Satuan</Label>
                    <Input className="mt-1 h-8 text-xs" value={newKebutuhan.satuan} onChange={e => setNewKebutuhan(f => ({ ...f, satuan: e.target.value }))} placeholder="kg, pcs, liter..." />
                  </div>
                </div>
                <Button size="sm" onClick={handleAddKebutuhan} disabled={createKebutuhan.isPending}>
                  {createKebutuhan.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            )}
            <KebutuhanProgress items={kebutuhan || []} />
            {kebutuhan && kebutuhan.length > 0 && (
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs font-bold text-text3">Update progress:</p>
                {kebutuhan.map(k => (
                  <div key={k.id} className="flex items-center gap-2">
                    <span className="w-32 truncate text-xs text-text2">{k.nama_item}</span>
                    <Input type="number" className="h-7 w-24 text-xs" placeholder={String(k.jumlah_terpenuhi)}
                      value={updateProgress[k.id] || ""} onChange={e => setUpdateProgress(p => ({ ...p, [k.id]: e.target.value }))} />
                    <span className="text-xs text-text3">/ {k.jumlah_dibutuhkan} {k.satuan}</span>
                    <Button size="sm" className="h-7 px-2 text-xs" onClick={() => handleUpdateProgress(k.id)}>Simpan</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Penugasan */}
        <Card className="rounded-xl border-border bg-surface shadow-none">
          <CardHeader className="border-b border-border bg-surface-2 px-[18px] py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-extrabold">
                <ClipboardList className="h-4 w-4" /> Penugasan relawan
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowPenugasanForm(!showPenugasanForm)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Tugaskan
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-[18px]">
            {showPenugasanForm && (
              <div className="mb-4 space-y-3 rounded-lg border border-border bg-surface-2 p-4">
                <div>
                  <Label className="text-xs">Pilih relawan</Label>
                  <Select value={newPenugasan.relawan_id} onValueChange={v => setNewPenugasan(f => ({ ...f, relawan_id: v }))}>
                    <SelectTrigger className="mt-1 h-8 text-xs">
                      <SelectValue placeholder="Pilih relawan terverifikasi..." />
                    </SelectTrigger>
                    <SelectContent>
                      {relawanList?.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.nama}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Detail tugas</Label>
                  <Textarea rows={2} className="mt-1 text-xs" value={newPenugasan.detail_tugas} onChange={e => setNewPenugasan(f => ({ ...f, detail_tugas: e.target.value }))} placeholder="Deskripsi tugas yang harus dilakukan..." />
                </div>
                <div>
                  <Label className="text-xs">Lokasi tugas</Label>
                  <Input className="mt-1 h-8 text-xs" value={newPenugasan.lokasi_tugas} onChange={e => setNewPenugasan(f => ({ ...f, lokasi_tugas: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Link grup koordinasi (WhatsApp, Telegram, dll.)</Label>
                  <Input className="mt-1 h-8 text-xs" value={newPenugasan.link_grup} onChange={e => setNewPenugasan(f => ({ ...f, link_grup: e.target.value }))} placeholder="https://..." />
                </div>
                <Button size="sm" onClick={handleAddPenugasan} disabled={createPenugasan.isPending}>
                  {createPenugasan.isPending ? "Menyimpan..." : "Buat penugasan"}
                </Button>
              </div>
            )}
            {laporan.penugasan && laporan.penugasan.length > 0 ? (
              <div className="space-y-2">
                {laporan.penugasan.map(p => (
                  <div key={p.id} className="flex items-start justify-between rounded-lg border border-border p-3 text-sm">
                    <div>
                      <p className="font-medium">{p.detail_tugas}</p>
                      <p className="text-xs text-text2">{p.nama_relawan} — {p.lokasi_tugas}</p>
                      {p.link_grup && <a href={p.link_grup} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:no-underline">Link grup</a>}
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-text2">Belum ada penugasan untuk laporan ini.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
