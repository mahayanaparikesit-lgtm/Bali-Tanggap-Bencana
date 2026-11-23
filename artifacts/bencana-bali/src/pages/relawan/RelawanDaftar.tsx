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
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { KtpUploadField } from "@/components/KtpUploadField";
import { cn } from "@/lib/utils";

// Form data relawan — tahap 2 dari pendaftaran relawan:
// (1) buat akun peran Relawan di /register, (2) form ini, (3) verifikasi admin.
// Penugasan hanya bisa diberikan ke relawan terverifikasi (dijaga server).

const KEAHLIAN_OPTIONS = [
  "Medis", "SAR (Search & Rescue)", "Logistik", "Komunikasi", "Transportasi", "Psikologi", "Memasak", "Lainnya",
];
const KABUPATEN = ["Badung", "Bangli", "Buleleng", "Denpasar", "Gianyar", "Jembrana", "Karangasem", "Klungkung", "Tabanan"];

const BASE = import.meta.env.VITE_API_URL.replace(/\/$/, "");

// "0812…", "62812…", "812…" → "+62812…"
function nomorHp(hp: string) {
  let n = hp.replace(/\D/g, "");
  if (n.startsWith("62")) n = n.slice(2);
  if (n.startsWith("0")) n = n.slice(1);
  return `+62${n}`;
}

export default function RelawanDaftar() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const createRelawan = useCreateRelawan();
  const [checking, setChecking] = useState(true);

  const [form, setForm] = useState({ nama: "", nik: "", no_hp: "", email: "", alamat: "" });
  const [kabupaten, setKabupaten] = useState<string | null>(null);
  const [keahlian, setKeahlian] = useState<string[]>([]);
  const [keahlianLain, setKeahlianLain] = useState("");
  // S4: KTP diunggah ke bucket privat — yang disimpan hanya path-nya.
  const [ktpPath, setKtpPath] = useState<string | null>(null);
  const [setuju, setSetuju] = useState(false);
  const [coba, setCoba] = useState(false);

  // Cek saat mount — jika sudah terdaftar, kembali ke dashboard (status tampil di sana).
  useEffect(() => {
    if (!user?.email) { setChecking(false); return; }
    fetch(`${BASE}/api/relawan/cek-email?email=${encodeURIComponent(user.email)}`, { credentials: "include" })
      .then(r => r.json())
      .then((data: { terdaftar: boolean; relawan?: any }) => {
        if (data.terdaftar && data.relawan) {
          toast({ title: "Sudah terdaftar", description: "Data relawan Anda sudah ada. Status verifikasi tampil di dashboard." });
          navigate("/relawan");
        } else {
          setForm(f => ({ ...f, email: user.email, nama: user.nama || "" }));
          setChecking(false);
        }
      })
      .catch(() => {
        setForm(f => ({ ...f, email: user?.email || "", nama: user?.nama || "" }));
        setChecking(false);
      });
  }, [user]);

  const ubah = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }));
  const toggleKeahlian = (k: string) => setKeahlian(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);

  const hpDigit = form.no_hp.replace(/\D/g, "");
  const galat = {
    nama: form.nama.trim().length < 3 ? "Tulis nama lengkap sesuai KTP" : "",
    nik: !/^\d{16}$/.test(form.nik) ? `NIK harus 16 digit (sekarang ${form.nik.length})` : "",
    no_hp: hpDigit.length < 9 || hpDigit.length > 13 ? "Isi nomor HP aktif, 9–13 digit" : "",
    kabupaten: !kabupaten ? "Pilih kabupaten/kota domisili" : "",
    alamat: form.alamat.trim().length < 8 ? "Tulis alamat (desa/banjar, jalan)" : "",
    keahlian: keahlian.length === 0 ? "Pilih minimal satu keahlian" : keahlian.includes("Lainnya") && keahlianLain.trim().length < 3 ? "Tulis keahlian lainnya" : "",
    ktp: !ktpPath ? "Unggah foto KTP untuk verifikasi identitas" : "",
    setuju: !setuju ? "Centang pernyataan di bawah" : "",
  };
  const adaGalat = Object.values(galat).some(Boolean);
  const Galat = ({ k }: { k: keyof typeof galat }) => coba && galat[k] ? <p className="mt-1 text-xs font-semibold text-destructive">{galat[k]}</p> : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCoba(true);
    if (adaGalat) {
      toast({ title: "Lengkapi data", description: Object.values(galat).find(Boolean), variant: "destructive" });
      return;
    }
    const daftarKeahlian = keahlian.map(k => k === "Lainnya" ? `Lainnya: ${keahlianLain.trim()}` : k);
    createRelawan.mutate({
      data: {
        nama: form.nama.trim(),
        nik: form.nik,
        no_hp: nomorHp(form.no_hp),
        email: form.email || null,
        alamat: `${form.alamat.trim()}, ${kabupaten}`,
        keahlian: daftarKeahlian,
        foto_ktp_path: ktpPath,
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRelawanQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["relawan-cek-email"] });
        toast({ title: "Pendaftaran terkirim", description: "Pusdalops akan memverifikasi data Anda. Status tampil di dashboard." });
        navigate("/relawan");
      },
      onError: (err: any) => {
        const msg = err?.message || "";
        toast({
          title: "Gagal mendaftar",
          description: /NIK|Email|sudah|HP|tidak valid|wajib/i.test(msg) ? msg : "Terjadi kesalahan saat mendaftar. Coba lagi.",
          variant: "destructive",
        });
      },
    });
  };

  if (checking) {
    return (
      <AppLayout title="Daftar Relawan" backHref="/relawan" backLabel="Dashboard" role="relawan">
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-text3" /></div>
      </AppLayout>
    );
  }

  const TAHAP = [["Buat akun", true], ["Lengkapi data", false], ["Verifikasi Pusdalops", false]] as const;

  return (
    <AppLayout title="Daftar Relawan" backHref="/relawan" backLabel="Dashboard" role="relawan">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-extrabold tracking-[-0.03em]">Lengkapi data relawan</h1>
        <p className="mt-1 text-sm text-text2">Data ini dipakai Pusdalops untuk memverifikasi identitas dan mencocokkan tugas dengan keahlian Anda.</p>

        {/* Tahapan pendaftaran */}
        <ol className="mt-5 grid grid-cols-3 gap-2">
          {TAHAP.map(([nama, selesai], i) => {
            const kini = i === 1;
            return (
              <li key={nama} className={cn("rounded-xl border px-3 py-2.5", selesai ? "border-status-done-br bg-status-done-bg" : kini ? "border-primary bg-primary-soft" : "border-border bg-card")}>
                <span className={cn("grid h-6 w-6 place-items-center rounded-full font-mono text-xs font-semibold",
                  selesai ? "bg-status-done-fg text-white" : kini ? "bg-primary text-primary-foreground" : "bg-muted text-text2")}>
                  {selesai ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <b className="mt-1.5 block text-[12.5px] leading-tight">{nama}</b>
              </li>
            );
          })}
        </ol>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">
          <Card className="rounded-[14px] border-border bg-surface shadow-none">
            <CardHeader className="pb-3"><CardTitle className="text-base font-bold">Data diri</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="nama">Nama lengkap (sesuai KTP) *</Label>
                  <Input id="nama" autoComplete="name" value={form.nama} maxLength={100} onChange={e => ubah("nama", e.target.value)} className="mt-1" />
                  <Galat k="nama" />
                </div>
                <div>
                  <Label htmlFor="nik">NIK *</Label>
                  <Input id="nik" inputMode="numeric" placeholder="16 digit" maxLength={16} value={form.nik}
                    onChange={e => ubah("nik", e.target.value.replace(/\D/g, ""))} className="mt-1 font-mono tracking-[0.06em]" />
                  <Galat k="nik" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="no_hp">Nomor HP / WhatsApp *</Label>
                  <div className="mt-1 flex h-10 overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                    <span className="grid place-items-center border-r border-input bg-muted px-2.5 font-mono text-sm font-semibold">+62</span>
                    <input id="no_hp" inputMode="tel" autoComplete="tel" placeholder="812 3456 7890" maxLength={16} value={form.no_hp}
                      onChange={e => ubah("no_hp", e.target.value.replace(/[^\d ]/g, ""))} className="w-full bg-transparent px-3 font-mono text-sm outline-none" />
                  </div>
                  <Galat k="no_hp" />
                </div>
                <div>
                  <Label htmlFor="email">Email akun</Label>
                  <Input id="email" type="email" value={form.email} readOnly className="mt-1 bg-muted" />
                  <p className="mt-1 text-xs text-text2">Mengikuti akun Anda, untuk masuk ke dashboard relawan.</p>
                </div>
              </div>
              <div>
                <Label>Domisili — kabupaten/kota *</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {KABUPATEN.map(k => (
                    <button key={k} type="button" onClick={() => setKabupaten(k)} aria-pressed={kabupaten === k}
                      className={cn("rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition",
                        kabupaten === k ? "border-primary bg-primary-soft text-primary" : "border-border text-text2 hover:border-border-strong hover:text-foreground")}>
                      {k}
                    </button>
                  ))}
                </div>
                <Galat k="kabupaten" />
              </div>
              <div>
                <Label htmlFor="alamat">Alamat *</Label>
                <Textarea id="alamat" rows={2} maxLength={300} placeholder="Desa/banjar, nama jalan" value={form.alamat} onChange={e => ubah("alamat", e.target.value)} className="mt-1" />
                <Galat k="alamat" />
              </div>
              <div>
                <KtpUploadField label="Foto KTP *" path={ktpPath} onChange={setKtpPath} subjudul="Pastikan NIK dan nama terbaca jelas."
                  hint="Wajib untuk verifikasi identitas. Disimpan privat — hanya admin Pusdalops yang bisa membukanya." />
                <Galat k="ktp" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[14px] border-border bg-surface shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Keahlian *</CardTitle>
              <p className="text-xs text-text2">Pilih semua yang Anda kuasai — dipakai untuk mencocokkan tugas.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {KEAHLIAN_OPTIONS.map(k => {
                  const on = keahlian.includes(k);
                  return (
                    <button key={k} type="button" onClick={() => toggleKeahlian(k)} aria-pressed={on}
                      className={cn("flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-[13px] font-semibold transition",
                        on ? "border-primary bg-primary-soft text-primary" : "border-border hover:border-border-strong")}>
                      <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded border", on ? "border-primary bg-primary text-primary-foreground" : "border-border-strong")}>
                        {on && <Check className="h-3 w-3" />}
                      </span>
                      {k}
                    </button>
                  );
                })}
              </div>
              {keahlian.includes("Lainnya") && (
                <Input className="mt-3" maxLength={60} placeholder="Contoh: operator alat berat, penerjemah bahasa Inggris"
                  value={keahlianLain} onChange={e => setKeahlianLain(e.target.value)} />
              )}
              <Galat k="keahlian" />
            </CardContent>
          </Card>

          <div>
            <button type="button" onClick={() => setSetuju(v => !v)} aria-pressed={setuju} className="flex w-full items-start gap-3 text-left text-[13px]">
              <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2", setuju ? "border-primary bg-primary text-primary-foreground" : "border-border-strong")}>
                {setuju && <Check className="h-3.5 w-3.5" />}
              </span>
              Data di atas benar, dan saya bersedia dihubungi serta mengikuti arahan koordinator Pusdalops saat bertugas.
            </button>
            <Galat k="setuju" />
          </div>

          <div className="flex gap-2.5 rounded-xl bg-muted px-3.5 py-3 text-xs leading-relaxed text-text2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            Setelah dikirim, status Anda <b className="mx-1 text-foreground">Menunggu verifikasi</b>. Penugasan baru bisa diberikan setelah Pusdalops memverifikasi.
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={createRelawan.isPending}>
            {createRelawan.isPending ? "Mengirim…" : "Kirim pendaftaran"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
