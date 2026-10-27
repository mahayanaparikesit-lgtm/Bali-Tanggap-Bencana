import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { PhotoUploadField } from "@/components/PhotoUploadField";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, JenisBadge } from "@/components/StatusBadge";
import { formatRupiah, JENIS_LABELS } from "@/lib/format";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MapPin, Users, Package, Heart, Building2,
  Phone, Check, Loader2, Banknote, Box,
  Images, FileText, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.VITE_API_URL.replace(/\/$/, "");

async function fetchBencanaAktif() {
  const res = await fetch(`${BASE}/api/donatur/bencana-aktif`, { credentials: "include" });
  return res.json();
}

class SubmitDonasiError extends Error {}

async function submitDonasi(data: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/donasi`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new SubmitDonasiError(json?.message ?? "Gagal mengirim donasi. Coba lagi.");
  }
  return json;
}

const NOMINAL_OPTIONS = [50000, 100000, 250000, 500000, 1000000];

// Nomor Indonesia: 0/62/+62 diikuti 8, lalu 8-11 digit lagi.
const PHONE_REGEX = /^(?:\+62|62|0)8[1-9][0-9]{6,10}$/;
function isValidPhone(v: string) {
  return PHONE_REGEX.test(v.replace(/[\s-]/g, ""));
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="h-3 w-3 shrink-0" /> {message}
    </p>
  );
}

// ──── Modal: Detail Bencana ────
function DetailModal({ bencana, open, onClose }: { bencana: any; open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<"info" | "foto" | "kebutuhan" | "posko">("info");

  if (!bencana) return null;

  const tabs = [
    { key: "info", label: "Kronologi", icon: FileText },
    { key: "foto", label: "Foto", icon: Images },
    { key: "kebutuhan", label: "Kebutuhan", icon: Package },
    { key: "posko", label: "Posko", icon: Building2 },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="p-5 pb-3 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <JenisBadge jenis={bencana.jenis_bencana} />
            <StatusBadge status={bencana.status} />
          </div>
          <DialogTitle className="text-base leading-snug">{bencana.judul}</DialogTitle>
          <div className="flex items-center gap-1.5 text-xs text-text2 mt-1">
            <MapPin className="h-3 w-3" />{bencana.lokasi}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors shrink-0",
                  tab === t.key
                    ? "border-b-2 border-primary text-primary"
                    : "text-text2 hover:text-foreground"
                )}>
                <Icon className="h-3.5 w-3.5" />{t.label}
              </button>
            );
          })}
        </div>

        <div className="p-5 space-y-4">
          {/* Tab: Kronologi */}
          {tab === "info" && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-text3 uppercase tracking-wide mb-2">Deskripsi Kejadian</p>
                <p className="text-sm leading-relaxed">{bencana.deskripsi}</p>
              </div>
              {bencana.kronologi ? (
                <div>
                  <p className="text-xs font-semibold text-text3 uppercase tracking-wide mb-2">Kronologi</p>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{bencana.kronologi}</p>
                </div>
              ) : (
                <p className="text-sm text-text2 italic">Kronologi belum tersedia.</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                {bencana.jumlah_terdampak && (
                  <div className="bg-surface-2 rounded-[10px] p-3">
                    <Users className="h-4 w-4 text-primary mb-1" />
                    <p className="font-bold text-lg">{bencana.jumlah_terdampak.toLocaleString("id-ID")}</p>
                    <p className="text-xs text-text2">Jiwa Terdampak</p>
                  </div>
                )}
                {bencana.lokasi_pengungsian && (
                  <div className="bg-surface-2 rounded-[10px] p-3">
                    <MapPin className="h-4 w-4 text-status-ver-fg mb-1" />
                    <p className="font-semibold text-sm leading-tight">{bencana.lokasi_pengungsian}</p>
                    <p className="text-xs text-text2">Lokasi Pengungsian</p>
                  </div>
                )}
              </div>
              {bencana.catatan_admin && (
                <div className="bg-status-ver-bg border border-status-ver-br rounded-[10px] p-3">
                  <p className="text-xs font-semibold text-status-ver-fg mb-1">Catatan Tim BPBD</p>
                  <p className="text-sm text-status-ver-fg">{bencana.catatan_admin}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Foto */}
          {tab === "foto" && (
            <div>
              {bencana.foto_urls?.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {bencana.foto_urls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`Foto ${i + 1}`}
                        className="w-full h-40 object-cover rounded-[10px] border border-border hover:opacity-90 transition-opacity" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Images className="h-10 w-10 mx-auto mb-2 text-text3 opacity-60" />
                  <p className="text-sm text-text2">Belum ada foto dokumentasi.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Kebutuhan */}
          {tab === "kebutuhan" && (
            <div>
              {bencana.kebutuhan?.length > 0 ? (
                <div className="space-y-2.5">
                  {bencana.kebutuhan.map((k: any) => {
                    const pct = Math.min(100, Math.round((k.jumlah_terpenuhi / k.jumlah_dibutuhkan) * 100));
                    const sisa = Math.max(0, k.jumlah_dibutuhkan - k.jumlah_terpenuhi);
                    return (
                      <div key={k.id} className="border border-border rounded-[10px] p-3">
                        <div className="flex items-start justify-between mb-1.5">
                          <div>
                            <p className="font-semibold text-sm">{k.nama_item}</p>
                            <p className="text-xs text-text2">{k.kategori}</p>
                          </div>
                          <span className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ml-2",
                            sisa === 0
                              ? "bg-status-done-bg text-status-done-fg border-status-done-br"
                              : "bg-status-wait-bg text-status-wait-fg border-status-wait-br"
                          )}>
                            {sisa === 0 ? "Terpenuhi" : `Sisa ${sisa} ${k.satuan}`}
                          </span>
                        </div>
                        <Progress value={pct} className={cn("h-2 mb-1", sisa === 0 ? "[&>div]:bg-status-done-fg" : "")} />
                        <div className="flex justify-between text-xs text-text2">
                          <span>{k.jumlah_terpenuhi} / {k.jumlah_dibutuhkan} {k.satuan}</span>
                          <span>{pct}%</span>
                        </div>
                        {k.keterangan && <p className="text-xs text-text3 mt-1 italic">{k.keterangan}</p>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-10 w-10 mx-auto mb-2 text-text3 opacity-60" />
                  <p className="text-sm text-text2">Belum ada daftar kebutuhan.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Posko */}
          {tab === "posko" && (
            <div className="space-y-3">
              {!bencana.posko?.length && (
                <p className="text-sm text-text2">Belum ada data posko untuk lokasi ini.</p>
              )}
              {bencana.posko?.map((p: any, i: number) => (
                <div key={i} className="border border-border rounded-[10px] p-4">
                  <p className="font-semibold text-sm mb-1">{p.nama}</p>
                  <div className="flex items-start gap-1.5 text-xs text-text2 mb-1">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{p.alamat}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text2">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <a href={`tel:${p.kontak}`} className="hover:text-primary">{p.kontak}</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type DonasiForm = {
  namaDonatur: string;
  kontakDonatur: string;
  nominalPilihan: number | null;
  nominalCustom: string;
  metodeBayar: string;
  pesan: string;
  buktiUrls: string[];
  selectedKebutuhan: any | null;
  namaBarang: string;
  jumlahBarang: string;
  kondisiBarang: string;
};

function emptyForm(namaDonatur: string): DonasiForm {
  return {
    namaDonatur,
    kontakDonatur: "",
    nominalPilihan: null,
    nominalCustom: "",
    metodeBayar: "transfer",
    pesan: "",
    buktiUrls: [],
    selectedKebutuhan: null,
    namaBarang: "",
    jumlahBarang: "",
    kondisiBarang: "",
  };
}

// ──── Modal: Donasi ────
function DonasiModal({ bencana, open, onClose, onSuccess }: {
  bencana: any; open: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [step, setStep] = useState<"jenis" | "form" | "konfirmasi" | "sukses">("jenis");
  const [donasiJenis, setDonasiJenis] = useState<"dana" | "barang" | null>(null);
  const [form, setForm] = useState<DonasiForm>(() => emptyForm(user?.nama ?? ""));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [hasilDonasi, setHasilDonasi] = useState<any | null>(null);

  const set = <K extends keyof DonasiForm>(key: K, value: DonasiForm[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  function reset() {
    setStep("jenis");
    setDonasiJenis(null);
    setForm(emptyForm(user?.nama ?? ""));
    setErrors({});
    setSubmitError("");
    setHasilDonasi(null);
  }

  const nominalFinal = form.nominalPilihan || parseInt(form.nominalCustom.replace(/\D/g, "") || "0");

  function validateBiodata(errs: Record<string, string>) {
    if (!form.namaDonatur.trim() || form.namaDonatur.trim().length < 2) {
      errs.namaDonatur = "Nama lengkap wajib diisi.";
    }
    if (!form.kontakDonatur.trim()) {
      errs.kontakDonatur = "Nomor HP/WhatsApp wajib diisi.";
    } else if (!isValidPhone(form.kontakDonatur)) {
      errs.kontakDonatur = "Format nomor tidak valid, contoh: 081234567890.";
    }
  }

  function handleLanjutDana() {
    const errs: Record<string, string> = {};
    validateBiodata(errs);
    if (!nominalFinal || nominalFinal < 10000) {
      errs.nominal = "Pilih atau isi nominal minimal Rp 10.000.";
    }
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep("konfirmasi");
  }

  function handleLanjutBarang() {
    const errs: Record<string, string> = {};
    validateBiodata(errs);
    if (!form.namaBarang.trim()) errs.namaBarang = "Nama barang wajib diisi.";
    const jumlah = parseInt(form.jumlahBarang || "0");
    if (!form.jumlahBarang || isNaN(jumlah) || jumlah < 1) {
      errs.jumlahBarang = "Jumlah barang wajib diisi, minimal 1.";
    }
    if (!form.kondisiBarang.trim() || form.kondisiBarang.trim().length < 5) {
      errs.kondisiBarang = "Jelaskan kondisi barang minimal 5 karakter.";
    }
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep("konfirmasi");
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload: Record<string, unknown> = {
        laporan_id: bencana?.id,
        jenis: donasiJenis,
        nama_donatur: form.namaDonatur.trim(),
        kontak_donatur: form.kontakDonatur.trim(),
      };
      if (donasiJenis === "dana") {
        payload.jumlah_dana = nominalFinal;
        payload.pesan = form.pesan || null;
        payload.bukti_transfer_url = form.buktiUrls[0] ?? null;
      } else {
        payload.nama_barang = form.namaBarang.trim();
        payload.jumlah_barang = parseInt(form.jumlahBarang || "1");
        payload.pesan = form.kondisiBarang.trim();
        if (form.selectedKebutuhan) payload.kebutuhan_id = form.selectedKebutuhan.id;
      }
      const hasil = await submitDonasi(payload);
      setHasilDonasi(hasil);
      onSuccess();
      setStep("sukses");
    } catch (e) {
      setSubmitError(e instanceof SubmitDonasiError ? e.message : "Gagal mengirim donasi. Periksa koneksi Anda.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { onClose(); reset(); } }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base leading-tight pr-6">Donasi — {bencana?.judul}</DialogTitle>
        </DialogHeader>

        {/* Pilih jenis */}
        {step === "jenis" && (
          <div className="space-y-4">
            <p className="text-sm text-text2">Pilih jenis donasi:</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setDonasiJenis("dana"); setStep("form"); }}
                className="flex flex-col items-center gap-3 rounded-[10px] border border-border p-5 hover:border-primary hover:bg-primary-soft transition-all text-center">
                <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center">
                  <Banknote className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Donasi Dana</p>
                  <p className="text-xs text-text2 mt-0.5">Transfer ke rekening resmi</p>
                </div>
              </button>
              <button onClick={() => { setDonasiJenis("barang"); setStep("form"); }}
                className="flex flex-col items-center gap-3 rounded-[10px] border border-border p-5 hover:border-accent hover:bg-surface-2 transition-all text-center">
                <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center">
                  <Box className="h-6 w-6 text-accent-ink" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Donasi Barang</p>
                  <p className="text-xs text-text2 mt-0.5">Antarkan ke posko terdekat</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Form Dana */}
        {step === "form" && donasiJenis === "dana" && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Pilih nominal</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {NOMINAL_OPTIONS.map(n => (
                  <button key={n} onClick={() => { set("nominalPilihan", n); set("nominalCustom", ""); }}
                    className={cn("rounded-[8px] border py-2 px-1.5 text-xs font-semibold transition-all",
                      form.nominalPilihan === n ? "border-primary bg-primary-soft text-primary" : "border-border hover:border-text2/40")}>
                    {formatRupiah(n)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Atau nominal lain</Label>
              <Input placeholder="Rp 0" value={form.nominalCustom}
                onChange={e => { set("nominalCustom", e.target.value); set("nominalPilihan", null); }} className="mt-1" />
              <FieldError message={errors.nominal} />
            </div>
            <div>
              <Label className="text-xs">Metode Pembayaran</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[{ v: "transfer", l: "Transfer Bank" }, { v: "qris", l: "QRIS" }, { v: "ewallet", l: "e-Wallet" }].map(m => (
                  <button key={m.v} onClick={() => set("metodeBayar", m.v)}
                    className={cn("rounded-[8px] border py-2 px-1.5 text-xs font-semibold transition-all",
                      form.metodeBayar === m.v ? "border-primary bg-primary-soft text-primary" : "border-border")}>
                    {m.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="nama_donatur">Nama Donatur *</Label>
              <Input id="nama_donatur" placeholder="Nama lengkap Anda" value={form.namaDonatur}
                onChange={e => set("namaDonatur", e.target.value)}
                className={cn("mt-1", errors.namaDonatur && "border-destructive")} />
              <FieldError message={errors.namaDonatur} />
            </div>
            <div>
              <Label htmlFor="kontak_donatur">No. HP / WhatsApp *</Label>
              <Input id="kontak_donatur" placeholder="081234567890" value={form.kontakDonatur}
                onChange={e => set("kontakDonatur", e.target.value)}
                className={cn("mt-1", errors.kontakDonatur && "border-destructive")} />
              <FieldError message={errors.kontakDonatur} />
            </div>
            <div>
              <Label className="text-xs">Pesan (opsional)</Label>
              <Textarea placeholder="Semangat..." value={form.pesan} onChange={e => set("pesan", e.target.value)} rows={2} className="mt-1" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("jenis")} className="flex-1">Kembali</Button>
              <Button onClick={handleLanjutDana} className="flex-1">Lanjut</Button>
            </div>
          </div>
        )}

        {step === "konfirmasi" && donasiJenis === "dana" && (
          <div className="space-y-4">
            <div className="rounded-[10px] bg-surface-2 p-4 space-y-3">
              <p className="font-semibold text-sm">Ringkasan Donasi Dana</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-text2">Jumlah</span>
                  <span className="font-bold text-lg text-primary">{formatRupiah(nominalFinal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text2">Metode</span>
                  <span className="font-medium capitalize">{form.metodeBayar.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text2">Nama</span>
                  <span className="font-medium">{form.namaDonatur}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text2">Kontak</span>
                  <span className="font-medium">{form.kontakDonatur}</span>
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold text-text3 mb-2">Rekening Tujuan</p>
                <div className="bg-card rounded-[8px] border border-border p-3 space-y-1">
                  <p className="font-bold">BNI — 012 345 6789</p>
                  <p className="text-sm">a.n. BPBD Provinsi Bali</p>
                  <p className="text-xs text-text2">Kode unik: BTB-{bencana?.id?.toString().padStart(4, "0")}</p>
                </div>
              </div>
            </div>

            <PhotoUploadField
              label="Bukti Transfer (opsional)"
              urls={form.buktiUrls}
              onChange={urls => set("buktiUrls", urls)}
              maxFiles={1}
              hint="Sudah transfer? Unggah bukti sekarang agar verifikasi lebih cepat. Bisa juga menyusul kemudian."
            />

            {submitError && (
              <div className="flex items-start gap-2 rounded-[8px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {submitError}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("form")} className="flex-1">Kembali</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Konfirmasi Donasi
              </Button>
            </div>
          </div>
        )}

        {/* Form Barang */}
        {step === "form" && donasiJenis === "barang" && (
          <div className="space-y-4">
            <div className="rounded-[10px] bg-surface-2 border border-border p-4">
              <p className="text-sm font-semibold text-accent-ink mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Antarkan ke Posko Terdekat
              </p>
              <div className="space-y-2">
                {!bencana?.posko?.length && (
                  <p className="text-xs text-text2">Belum ada data posko untuk lokasi ini.</p>
                )}
                {bencana?.posko?.slice(0, 2).map((p: any, i: number) => (
                  <div key={i} className="bg-card rounded-[8px] p-3 border border-border">
                    <p className="font-semibold text-xs">{p.nama}</p>
                    <p className="text-xs text-text2">{p.alamat}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3 text-text2" />
                      <p className="text-xs text-text2">{p.kontak}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {bencana?.kebutuhan?.filter((k: any) => k.jumlah_terpenuhi < k.jumlah_dibutuhkan).length > 0 && (
              <div>
                <Label className="text-xs font-semibold">Pilih dari Daftar Kebutuhan</Label>
                <p className="text-xs text-text2 mb-1.5">Klik untuk memilih, atau isi manual</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {bencana.kebutuhan.filter((k: any) => k.jumlah_terpenuhi < k.jumlah_dibutuhkan).map((k: any) => {
                    const sisa = k.jumlah_dibutuhkan - k.jumlah_terpenuhi;
                    const pct = Math.round((k.jumlah_terpenuhi / k.jumlah_dibutuhkan) * 100);
                    const isSelected = form.selectedKebutuhan?.id === k.id;
                    return (
                      <button key={k.id}
                        onClick={() => { set("selectedKebutuhan", k); set("namaBarang", k.nama_item); }}
                        className={cn("w-full text-left rounded-[8px] border px-3 py-2 transition-all",
                          isSelected ? "border-primary bg-primary-soft" : "border-border hover:border-primary/40")}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-medium">{k.nama_item}</span>
                          <span className="text-xs text-text2">Sisa {sisa} {k.satuan}</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="nama_barang">Nama Barang *</Label>
              <Input id="nama_barang" placeholder="cth: Beras, Selimut..." value={form.namaBarang}
                onChange={e => { set("namaBarang", e.target.value); set("selectedKebutuhan", null); }}
                className={cn("mt-1", errors.namaBarang && "border-destructive")} />
              <FieldError message={errors.namaBarang} />
            </div>
            <div>
              <Label htmlFor="jumlah_barang">Jumlah *</Label>
              <Input id="jumlah_barang" type="number" min={1} placeholder="10" value={form.jumlahBarang}
                onChange={e => set("jumlahBarang", e.target.value)}
                className={cn("mt-1", errors.jumlahBarang && "border-destructive")} />
              <FieldError message={errors.jumlahBarang} />
            </div>
            <div>
              <Label htmlFor="kondisi_barang">Kondisi Barang / Catatan *</Label>
              <Textarea id="kondisi_barang" placeholder="cth: Baju layak pakai, ukuran campur dewasa & anak"
                value={form.kondisiBarang} onChange={e => set("kondisiBarang", e.target.value)} rows={2}
                className={cn("mt-1", errors.kondisiBarang && "border-destructive")} />
              <FieldError message={errors.kondisiBarang} />
            </div>
            <div>
              <Label htmlFor="nama_donatur_barang">Nama Donatur *</Label>
              <Input id="nama_donatur_barang" placeholder="Nama lengkap Anda" value={form.namaDonatur}
                onChange={e => set("namaDonatur", e.target.value)}
                className={cn("mt-1", errors.namaDonatur && "border-destructive")} />
              <FieldError message={errors.namaDonatur} />
            </div>
            <div>
              <Label htmlFor="kontak_donatur_barang">No. HP / WhatsApp *</Label>
              <Input id="kontak_donatur_barang" placeholder="081234567890" value={form.kontakDonatur}
                onChange={e => set("kontakDonatur", e.target.value)}
                className={cn("mt-1", errors.kontakDonatur && "border-destructive")} />
              <FieldError message={errors.kontakDonatur} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("jenis")} className="flex-1">Kembali</Button>
              <Button onClick={handleLanjutBarang} className="flex-1">Lanjut</Button>
            </div>
          </div>
        )}

        {step === "konfirmasi" && donasiJenis === "barang" && (
          <div className="space-y-4">
            <div className="rounded-[10px] bg-surface-2 p-4 space-y-1.5 text-sm">
              <p className="font-semibold text-sm mb-1.5">Ringkasan Donasi Barang</p>
              <div className="flex justify-between"><span className="text-text2">Barang</span><span className="font-medium">{form.namaBarang}</span></div>
              <div className="flex justify-between"><span className="text-text2">Jumlah</span><span className="font-medium">{form.jumlahBarang}</span></div>
              <div className="flex justify-between"><span className="text-text2">Nama</span><span className="font-medium">{form.namaDonatur}</span></div>
              <div className="flex justify-between"><span className="text-text2">Kontak</span><span className="font-medium">{form.kontakDonatur}</span></div>
              <div className="pt-1.5 border-t border-border">
                <span className="text-text2">Kondisi/catatan</span>
                <p className="mt-0.5">{form.kondisiBarang}</p>
              </div>
            </div>
            <p className="text-xs text-text2">Setelah dikonfirmasi, antarkan barang ke salah satu posko yang tertera sebelumnya.</p>

            {submitError && (
              <div className="flex items-start gap-2 rounded-[8px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {submitError}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("form")} className="flex-1">Kembali</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Daftarkan Donasi
              </Button>
            </div>
          </div>
        )}

        {/* Sukses */}
        {step === "sukses" && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-status-done-bg flex items-center justify-center mx-auto">
              <svg width={26} height={26} viewBox="0 0 12 12" aria-hidden="true">
                <circle cx={6} cy={6} r={5.2} className="fill-status-done-fg" />
                <polyline points="3.6,6.2 5.2,7.9 8.4,4.3" fill="none" stroke="hsl(var(--card))" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">
                {donasiJenis === "dana" ? "Donasi Dana Terdaftar" : "Donasi Barang Terdaftar"}
              </h3>
              <p className="text-text2 text-sm mt-1">
                {donasiJenis === "dana"
                  ? "Silakan transfer ke rekening BPBD Bali sesuai ringkasan sebelumnya. Terima kasih!"
                  : `Antarkan ${form.namaBarang} ke posko terdekat. Terima kasih!`}
              </p>
            </div>
            <Card className="rounded-[10px] border-border bg-surface text-left shadow-none">
              <CardContent className="space-y-2.5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text3">No. donasi</span>
                  <span className="font-mono text-sm font-semibold">
                    {hasilDonasi?.id ? `DNS-${hasilDonasi.id}` : "—"}
                  </span>
                </div>
                <StatusBadge status="menunggu" />
              </CardContent>
            </Card>
            <Button onClick={() => { onClose(); reset(); }} className="w-full">Selesai</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ──── Kartu Lokasi — sesuai Pilih Tempat Donasi.dc.html ────
// "Mendesak"/"Prioritas" bukan kategori tersimpan di backend — diturunkan dari
// data real (dana masih di bawah 20% atau jiwa terdampak terbanyak), bukan label bebas.
function BencanaCard({ bencana, isPalingTerdampak, onDonasi, onDetail }: {
  bencana: any;
  isPalingTerdampak: boolean;
  onDonasi: () => void;
  onDetail: () => void;
}) {
  const terkumpul = bencana.total_dana_terkumpul || 0;
  const target = bencana.target_dana || 0;
  const danaPct = target > 0 ? Math.min(100, Math.round((terkumpul / target) * 100)) : null;
  const foto = bencana.foto_urls?.[0];
  const jumlahKebutuhan = bencana.kebutuhan?.length ?? 0;

  const mendesak = danaPct !== null && danaPct < 20;
  const pill = mendesak
    ? { label: "Mendesak", cls: "bg-primary text-primary-foreground" }
    : isPalingTerdampak
    ? { label: "Prioritas", cls: "bg-accent text-accent-ink" }
    : null;

  return (
    <Card className="flex flex-col overflow-hidden rounded-[6px] border-0 shadow-[0_1px_3px_rgba(15,23,42,0.07),0_8px_24px_rgba(15,23,42,0.06)]">
      {/* Aksen urgensi di atas foto — sinyal cepat tanpa harus baca pill/teks. */}
      <div className={cn("h-[3px] shrink-0", mendesak ? "bg-primary" : isPalingTerdampak ? "bg-accent" : "bg-transparent")} />
      <div className="relative aspect-[4/3] border-b border-border" style={!foto ? { background: "repeating-linear-gradient(135deg, var(--muted) 0 10px, var(--background) 10px 20px)" } : undefined}>
        {foto ? (
          <img src={foto} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <span className="font-mono text-xs leading-[1.5] tracking-[0.04em] text-text3">
              FOTO LOKASI<br />{JENIS_LABELS[bencana.jenis_bencana] ?? bencana.jenis_bencana} — {bencana.lokasi}
            </span>
          </div>
        )}
        {pill && (
          <span className={cn("absolute left-[18px] top-[18px] rounded-full px-3.5 py-[7px] text-[11px] font-extrabold uppercase tracking-[0.09em] shadow-sm", pill.cls)}>
            {pill.label}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3.5 px-[26px] pb-[22px] pt-[26px]">
        <div className="flex items-start justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 text-sm text-text2">
            <MapPin size={13} className="shrink-0 text-primary" />
            <span className="truncate">{bencana.lokasi}</span>
          </span>
          {bencana.koordinator && (
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-text3">
              <Users className="h-3 w-3" /> {bencana.koordinator}
            </span>
          )}
        </div>
        <h2 className="font-serif text-2xl font-bold leading-[1.2]">{bencana.judul}</h2>
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 text-[13px] text-text2">
          {bencana.jumlah_terdampak ? <span>{bencana.jumlah_terdampak.toLocaleString("id-ID")} Pengungsi</span> : null}
          <span>{jumlahKebutuhan} Kebutuhan</span>
        </div>

        <div className="mt-1.5 space-y-2 border-t border-border pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <b className="whitespace-nowrap text-[22px] font-extrabold tracking-[-0.02em] text-primary">{formatRupiah(terkumpul)}</b>
            <button onClick={onDetail} className="whitespace-nowrap text-[14.5px] font-bold text-primary hover:underline">Lihat Detail</button>
          </div>
          {target > 0 && (
            <div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className={cn("h-full rounded-full", mendesak ? "bg-primary" : "bg-accent")}
                  style={{ width: `${danaPct}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[11.5px] text-text3">
                <span>{danaPct}% dari target</span>
                <span>Target {formatRupiah(target)}</span>
              </div>
            </div>
          )}
        </div>

        <Button onClick={onDonasi} size="sm" className="mt-1 gap-1.5">
          <Heart className="h-3.5 w-3.5" /> Donasikan Bantuan
        </Button>
      </div>
    </Card>
  );
}

// ──── Main Page ────
export default function DonaturDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: bencana = [], isLoading } = useQuery({
    queryKey: ["donatur-bencana-aktif"],
    queryFn: fetchBencanaAktif,
  });

  const [donasiTarget, setDonasiTarget] = useState<any | null>(null);
  const [detailTarget, setDetailTarget] = useState<any | null>(null);

  function handleDonasiSuccess() {
    queryClient.invalidateQueries({ queryKey: ["donatur-bencana-aktif"] });
  }

  const terdampakTertinggi = bencana.length > 0
    ? Math.max(...bencana.map((b: any) => b.jumlah_terdampak || 0))
    : 0;

  // Ringkasan cepat di header — dihitung dari data yang sama dipakai kartu
  // (bukan kategori tersimpan terpisah), sekadar menonjolkan skala kebutuhan
  // saat ini tanpa mengulang pola "grid kartu statistik generik".
  const mendesakCount = bencana.filter((b: any) => {
    const target = b.target_dana || 0;
    if (target <= 0) return false;
    const pct = Math.min(100, Math.round(((b.total_dana_terkumpul || 0) / target) * 100));
    return pct < 20;
  }).length;

  return (
    <AppLayout title="Pilih Tempat Donasi" subtitle="Bali Tanggap Bencana" role="donatur" showLogout>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap" />
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 border-b border-border pb-6">
          <div className="max-w-xl">
            <h1 className="font-serif text-[34px] font-bold leading-[1.05] tracking-[-0.01em] sm:text-[40px]">Lokasi Terdampak</h1>
            <p className="mt-2 text-sm text-text2">Halo, {user?.nama} — pilih lokasi untuk melihat detail dan berdonasi.</p>
          </div>
          {!isLoading && bencana.length > 0 && (
            <div className="flex items-center gap-5">
              <div>
                <b className="block font-mono text-[28px] font-extrabold leading-none tracking-[-0.02em]">{bencana.length}</b>
                <span className="text-xs text-text2">Lokasi aktif</span>
              </div>
              {mendesakCount > 0 && (
                <div className="border-l border-border pl-5">
                  <b className="block font-mono text-[28px] font-extrabold leading-none tracking-[-0.02em] text-primary">{mendesakCount}</b>
                  <span className="text-xs text-text2">Butuh dana mendesak</span>
                </div>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="overflow-hidden rounded-[6px] border border-border">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="space-y-3 p-[26px]">
                  <Skeleton className="h-3.5 w-2/5" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-3.5 w-3/5" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : bencana.length === 0 ? (
          <Card className="rounded-[10px] border-border bg-surface shadow-none">
            <CardContent className="py-16 text-center text-text2">
              <Heart className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium mb-1 text-foreground">Belum ada bencana yang membutuhkan donasi</p>
              <p className="text-sm">Laporan bencana baru akan muncul setelah diverifikasi admin.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {bencana.map((b: any) => (
              <BencanaCard
                key={b.id}
                bencana={b}
                isPalingTerdampak={terdampakTertinggi > 0 && b.jumlah_terdampak === terdampakTertinggi}
                onDonasi={() => setDonasiTarget(b)}
                onDetail={() => setDetailTarget(b)}
              />
            ))}
          </div>
        )}
      </div>

      <DetailModal
        bencana={detailTarget}
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
      />

      <DonasiModal
        bencana={donasiTarget}
        open={!!donasiTarget}
        onClose={() => setDonasiTarget(null)}
        onSuccess={handleDonasiSuccess}
      />
    </AppLayout>
  );
}
