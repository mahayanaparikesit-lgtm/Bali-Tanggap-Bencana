import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCreateRelawan, getGetRelawanQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Users, Loader2 } from "lucide-react";
import { KtpUploadField } from "@/components/KtpUploadField";

const KEAHLIAN_OPTIONS = [
  "Medis", "SAR (Search & Rescue)", "Logistik", "Komunikasi", "Transportasi", "Psikologi", "Memasak", "Lainnya"
];

const BASE = import.meta.env.VITE_API_URL.replace(/\/$/, "");

export default function RelawanDaftar() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const createRelawan = useCreateRelawan();
  const [checking, setChecking] = useState(true);

  const [form, setForm] = useState({
    nama: "", nik: "", no_hp: "", email: "", alamat: "",
  });
  const [keahlian, setKeahlian] = useState<string[]>([]);
  // S4: KTP diunggah ke bucket privat — yang disimpan hanya path-nya.
  const [ktpPath, setKtpPath] = useState<string | null>(null);

  // Cek saat mount — jika sudah terdaftar, redirect ke profil
  useEffect(() => {
    if (!user?.email) { setChecking(false); return; }
    fetch(`${BASE}/api/relawan/cek-email?email=${encodeURIComponent(user.email)}`, {
      credentials: "include",
    })
      .then(r => r.json())
      .then((data: { terdaftar: boolean; relawan?: any }) => {
        if (data.terdaftar && data.relawan) {
          toast({
            title: "Sudah terdaftar",
            description: "Anda sudah memiliki data relawan. Mengarahkan ke profil Anda...",
          });
          navigate(`/relawan/${data.relawan.id}`);
        } else {
          // Pre-fill email dari akun
          setForm(f => ({ ...f, email: user.email, nama: user.nama || "" }));
          setChecking(false);
        }
      })
      .catch(() => {
        setForm(f => ({ ...f, email: user?.email || "", nama: user?.nama || "" }));
        setChecking(false);
      });
  }, [user]);

  const handleChange = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const toggleKeahlian = (k: string) =>
    setKeahlian(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama || !form.nik || !form.no_hp || !form.alamat) {
      toast({ title: "Lengkapi data", description: "Field bertanda * wajib diisi.", variant: "destructive" });
      return;
    }
    createRelawan.mutate({
      data: {
        nama: form.nama,
        nik: form.nik,
        no_hp: form.no_hp,
        email: form.email || null,
        alamat: form.alamat,
        keahlian,
        foto_ktp_path: ktpPath,
      }
    }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetRelawanQueryKey() });
        toast({ title: "Pendaftaran berhasil", description: "Data Anda sedang diverifikasi oleh admin." });
        navigate(`/relawan/${data.id}`);
      },
      onError: (err: any) => {
        const msg = err?.message || "";
        toast({
          title: "Gagal mendaftar",
          description: msg.includes("NIK") || msg.includes("Email") || msg.includes("sudah")
            ? msg
            : "Terjadi kesalahan saat mendaftar. Coba lagi.",
          variant: "destructive",
        });
      }
    });
  };

  if (checking) {
    return (
      <AppLayout title="Daftar Relawan" backHref="/relawan" backLabel="Dashboard" role="relawan">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-text3" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Daftar Relawan" backHref="/relawan" backLabel="Dashboard" role="relawan">
      <div className="max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-surface-2">
            <Users className="h-5 w-5 text-accent-ink" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Pendaftaran Relawan</h1>
            <p className="text-sm text-text2">Daftar sebagai relawan koordinasi bencana Bali</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="rounded-[10px] border-border bg-surface shadow-none">
            <CardHeader className="pb-3"><CardTitle className="text-base font-bold">Data Pribadi</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nama">Nama Lengkap *</Label>
                  <Input id="nama" value={form.nama} onChange={e => handleChange("nama", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="nik">NIK (KTP) *</Label>
                  <Input id="nik" placeholder="16 digit" maxLength={16} value={form.nik} onChange={e => handleChange("nik", e.target.value)} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="no_hp">No. HP / WhatsApp *</Label>
                  <Input id="no_hp" value={form.no_hp} onChange={e => handleChange("no_hp", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} className="mt-1" readOnly={!!user?.email} />
                </div>
              </div>
              <div>
                <Label htmlFor="alamat">Alamat Lengkap *</Label>
                <Textarea id="alamat" rows={3} value={form.alamat} onChange={e => handleChange("alamat", e.target.value)} className="mt-1" />
              </div>
              <KtpUploadField label="Foto KTP" path={ktpPath} onChange={setKtpPath}
                hint="Disimpan privat — hanya admin Pusdalops yang bisa membukanya untuk verifikasi." />
            </CardContent>
          </Card>

          <Card className="rounded-[10px] border-border bg-surface shadow-none">
            <CardHeader className="pb-3"><CardTitle className="text-base font-bold">Keahlian</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {KEAHLIAN_OPTIONS.map(k => (
                  <div key={k} className="flex items-center gap-2">
                    <Checkbox id={k} checked={keahlian.includes(k)} onCheckedChange={() => toggleKeahlian(k)} />
                    <Label htmlFor={k} className="cursor-pointer text-sm">{k}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" variant="secondary" disabled={createRelawan.isPending}>
            {createRelawan.isPending ? "Mendaftar..." : "Kirim Pendaftaran"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
