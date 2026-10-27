import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCreateLaporan, getGetLaporanQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhotoUploadField } from "@/components/PhotoUploadField";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Package, TriangleAlert, Info } from "lucide-react";

const JENIS_BENCANA = [
  { value: "banjir", label: "Banjir" },
  { value: "gempa_bumi", label: "Gempa Bumi" },
  { value: "tanah_longsor", label: "Tanah Longsor" },
  { value: "kebakaran", label: "Kebakaran" },
  { value: "angin_kencang", label: "Angin Kencang" },
  { value: "tsunami", label: "Tsunami" },
  { value: "lainnya", label: "Lainnya" },
];

const KATEGORI_OPTIONS = [
  "Makanan", "Minuman", "Pakaian", "Obat-obatan", "Perlengkapan Bayi",
  "Peralatan Dapur", "Tenda / Tempat Tinggal", "Selimut / Matras", "Lainnya",
];

const SATUAN_OPTIONS = ["pcs", "kg", "liter", "dus", "lusin", "sak", "unit", "lembar", "botol"];

const BASE = import.meta.env.VITE_API_URL.replace(/\/$/, "");

type KebutuhanItem = {
  kategori: string;
  nama_item: string;
  jumlah_dibutuhkan: string;
  satuan: string;
  keterangan: string;
};

function emptyKebutuhan(): KebutuhanItem {
  return { kategori: "", nama_item: "", jumlah_dibutuhkan: "", satuan: "pcs", keterangan: "" };
}

export default function LaporanBaru() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createLaporan = useCreateLaporan();
  const [submitting, setSubmitting] = useState(false);
  const [sentId, setSentId] = useState<number | null>(null);

  const [form, setForm] = useState({
    judul: "",
    jenis_bencana: "",
    lokasi: "",
    deskripsi: "",
    nama_pelapor: user?.nama ?? "",
    kontak_pelapor: "",
    jabatan_pelapor: "",
    jumlah_terdampak: "",
    lokasi_pengungsian: "",
  });
  const [fotoUrls, setFotoUrls] = useState<string[]>([]);
  const [fotoKtpUrl, setFotoKtpUrl] = useState<string[]>([]);

  const [kebutuhanList, setKebutuhanList] = useState<KebutuhanItem[]>([emptyKebutuhan()]);

  const handleChange = (key: string, value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  const updateKebutuhan = (i: number, key: keyof KebutuhanItem, value: string) =>
    setKebutuhanList(list => list.map((item, idx) => idx === i ? { ...item, [key]: value } : item));

  const addKebutuhan = () => setKebutuhanList(list => [...list, emptyKebutuhan()]);
  const removeKebutuhan = (i: number) => setKebutuhanList(list => list.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.judul || !form.jenis_bencana || !form.lokasi || !form.deskripsi || !form.nama_pelapor || !form.kontak_pelapor) {
      toast({ title: "Lengkapi data", description: "Field bertanda * wajib diisi.", variant: "destructive" });
      return;
    }

    const validKebutuhan = kebutuhanList.filter(k => k.nama_item && k.jumlah_dibutuhkan && k.kategori);

    setSubmitting(true);
    try {
      // Buat laporan dulu
      const res = await fetch(`${BASE}/api/laporan`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: form.judul,
          jenis_bencana: form.jenis_bencana,
          lokasi: form.lokasi,
          deskripsi: form.deskripsi,
          nama_pelapor: form.nama_pelapor,
          kontak_pelapor: form.kontak_pelapor,
          jabatan_pelapor: form.jabatan_pelapor || null,
          jumlah_terdampak: form.jumlah_terdampak ? parseInt(form.jumlah_terdampak) : null,
          lokasi_pengungsian: form.lokasi_pengungsian || null,
          foto_urls: fotoUrls,
          foto_ktp_url: fotoKtpUrl[0] ?? null,
        }),
      });
      const laporan = await res.json();

      // Simpan kebutuhan jika ada
      if (validKebutuhan.length > 0) {
        await fetch(`${BASE}/api/laporan/${laporan.id}/kebutuhan-bulk`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validKebutuhan.map(k => ({
            kategori: k.kategori,
            nama_item: k.nama_item,
            jumlah_dibutuhkan: parseInt(k.jumlah_dibutuhkan),
            satuan: k.satuan,
            keterangan: k.keterangan || null,
          }))),
        });
      }

      queryClient.invalidateQueries({ queryKey: getGetLaporanQueryKey() });
      setSentId(laporan.id);
    } catch {
      toast({ title: "Gagal mengirim laporan", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (sentId != null) {
    return (
      <AppLayout title="Laporan Terkirim" backHref={user ? "/pelapor" : "/"} backLabel={user ? "Dashboard" : "Beranda"} role={user ? "pelapor" : undefined}>
        <div className="mx-auto max-w-md space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-status-done-bg">
            <svg width="26" height="26" viewBox="0 0 12 12" aria-hidden="true">
              <circle cx="6" cy="6" r="5.2" className="fill-status-done-fg" />
              <polyline points="3.6,6.2 5.2,7.9 8.4,4.3" fill="none" stroke="var(--surface)" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Laporan berhasil dikirim</h1>
            <p className="mt-1 text-sm text-text2">Petugas Pusdalops akan memeriksa laporan Anda. Rata-rata verifikasi 15 menit.</p>
          </div>
          <Card className="rounded-[10px] border-border bg-surface text-left shadow-none">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text3">No. laporan</span>
                <span className="font-mono text-sm font-semibold">LPR-{sentId}</span>
              </div>
              <StatusBadge status="menunggu" />
              <p className="text-xs text-text2">Simpan nomor laporan ini. Petugas akan menghubungi Anda di {form.kontak_pelapor} bila perlu memastikan sesuatu.</p>
            </CardContent>
          </Card>
          <Button asChild variant="outline" className="w-full">
            <Link href={user ? "/pelapor" : "/"}>{user ? "Kembali ke Dashboard" : "Kembali ke Beranda"}</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Laporan Baru" backHref={user ? "/pelapor" : "/"} backLabel={user ? "Dashboard" : "Beranda"} role={user ? "pelapor" : undefined}>
      <div className="max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary-soft">
            <TriangleAlert size={19} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Form Laporan Bencana</h1>
            <p className="text-sm text-text2">Isi informasi kejadian bencana dengan lengkap dan akurat</p>
          </div>
        </div>

        {!user && (
          <div className="mb-6 flex items-start gap-2.5 rounded-[10px] border border-border bg-surface-2 px-4 py-3">
            <Info size={16} className="mt-0.5 shrink-0 text-primary" />
            <p className="text-sm text-text2">
              Ini laporan darurat — <b className="text-foreground">tidak perlu akun</b>. Cukup isi data di bawah dan kirim, petugas akan segera memeriksa.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="rounded-[10px] border-border bg-surface shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Informasi Kejadian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="judul">Judul Laporan *</Label>
                <Input id="judul" placeholder="cth: Banjir Parah di Desa Ubud" value={form.judul}
                  onChange={e => handleChange("judul", e.target.value)} className="mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Jenis Bencana *</Label>
                  <Select value={form.jenis_bencana} onValueChange={v => handleChange("jenis_bencana", v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih jenis..." />
                    </SelectTrigger>
                    <SelectContent>
                      {JENIS_BENCANA.map(j => (
                        <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="jumlah_terdampak">Jumlah Terdampak (jiwa)</Label>
                  <Input id="jumlah_terdampak" type="number" placeholder="0" value={form.jumlah_terdampak}
                    onChange={e => handleChange("jumlah_terdampak", e.target.value)} className="mt-1" />
                </div>
              </div>

              <div>
                <Label htmlFor="lokasi">Lokasi Kejadian *</Label>
                <Input id="lokasi" placeholder="cth: Banjar Ubud, Desa Ubud, Kec. Ubud, Gianyar" value={form.lokasi}
                  onChange={e => handleChange("lokasi", e.target.value)} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="lokasi_pengungsian">Lokasi Pengungsian</Label>
                <Input id="lokasi_pengungsian" placeholder="cth: Balai Banjar Ubud" value={form.lokasi_pengungsian}
                  onChange={e => handleChange("lokasi_pengungsian", e.target.value)} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="deskripsi">Deskripsi Kejadian *</Label>
                <Textarea id="deskripsi" placeholder="Jelaskan situasi bencana secara detail..." rows={4}
                  value={form.deskripsi} onChange={e => handleChange("deskripsi", e.target.value)} className="mt-1" />
              </div>

              <PhotoUploadField
                label="Foto Dokumentasi Kejadian"
                urls={fotoUrls}
                onChange={setFotoUrls}
                maxFiles={6}
                hint="Sampai 6 foto. Satu foto sudah cukup untuk mempercepat verifikasi."
              />
            </CardContent>
          </Card>

          <Card className="rounded-[10px] border-border bg-surface shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Informasi Pelapor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nama_pelapor">Nama Lengkap *</Label>
                  <Input id="nama_pelapor" placeholder="Nama Anda" value={form.nama_pelapor}
                    onChange={e => handleChange("nama_pelapor", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="jabatan_pelapor">Jabatan</Label>
                  <Input id="jabatan_pelapor" placeholder="cth: Ketua RT 03" value={form.jabatan_pelapor}
                    onChange={e => handleChange("jabatan_pelapor", e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="kontak_pelapor">Nomor HP / WhatsApp *</Label>
                <Input id="kontak_pelapor" placeholder="08xxxxxxxxxx" value={form.kontak_pelapor}
                  onChange={e => handleChange("kontak_pelapor", e.target.value)} className="mt-1" />
              </div>
              <PhotoUploadField
                label="Foto KTP (opsional)"
                urls={fotoKtpUrl}
                onChange={setFotoKtpUrl}
                maxFiles={1}
                hint="Membantu mempercepat verifikasi identitas pelapor. Hanya dilihat admin, tidak pernah ditampilkan publik."
              />
            </CardContent>
          </Card>

          {/* Daftar Kebutuhan */}
          <Card className="rounded-[10px] border-border bg-surface shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-accent-ink" />
                  <CardTitle className="text-base font-bold">Daftar Kebutuhan</CardTitle>
                </div>
                <span className="text-xs text-text3">Opsional — bisa ditambah admin nanti</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {kebutuhanList.map((item, i) => (
                <div key={i} className="space-y-3 rounded-[10px] border border-border bg-surface-2 p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-text2">Item #{i + 1}</span>
                    {kebutuhanList.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => removeKebutuhan(i)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Kategori</Label>
                      <Select value={item.kategori} onValueChange={v => updateKebutuhan(i, "kategori", v)}>
                        <SelectTrigger className="mt-1 h-8 text-xs">
                          <SelectValue placeholder="Pilih..." />
                        </SelectTrigger>
                        <SelectContent>
                          {KATEGORI_OPTIONS.map(k => (
                            <SelectItem key={k} value={k}>{k}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Nama Barang</Label>
                      <Input className="mt-1 h-8 text-xs" placeholder="cth: Beras, Selimut..." value={item.nama_item}
                        onChange={e => updateKebutuhan(i, "nama_item", e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Jumlah Dibutuhkan</Label>
                      <Input className="mt-1 h-8 text-xs" type="number" placeholder="10" value={item.jumlah_dibutuhkan}
                        onChange={e => updateKebutuhan(i, "jumlah_dibutuhkan", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Satuan</Label>
                      <Select value={item.satuan} onValueChange={v => updateKebutuhan(i, "satuan", v)}>
                        <SelectTrigger className="mt-1 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SATUAN_OPTIONS.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Keterangan (opsional)</Label>
                    <Input className="mt-1 h-8 text-xs" placeholder="cth: untuk 50 KK pengungsi" value={item.keterangan}
                      onChange={e => updateKebutuhan(i, "keterangan", e.target.value)} />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addKebutuhan} className="w-full gap-1.5 border-dashed">
                <Plus className="h-3.5 w-3.5" /> Tambah Item Kebutuhan
              </Button>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Mengirim..." : "Kirim Laporan"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
