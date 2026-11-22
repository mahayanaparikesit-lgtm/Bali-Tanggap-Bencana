import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.VITE_API_URL.replace(/\/$/, "");

// Hapus laporan permanen (admin). Server menolak (409) bila laporan sudah punya
// catatan donasi — pesannya ditampilkan di dialog, dialog tetap terbuka.
export function HapusLaporan({ id, judul, jumlahKebutuhan }: { id: number; judul: string; jumlahKebutuhan: number }) {
  const [buka, setBuka] = useState(false);
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  async function hapus() {
    setProses(true); setGalat(null);
    try {
      const res = await fetch(`${BASE}/api/laporan/${id}`, { method: "DELETE", credentials: "include" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setGalat(body?.message ?? `Gagal menghapus (kode ${res.status}).`); return; }
      // Semua daftar/statistik yang mungkin memuat laporan ini dimuat ulang.
      queryClient.invalidateQueries();
      setBuka(false);
      toast({ title: `Laporan LPR-${String(id).padStart(4, "0")} dihapus` });
      navigate("/admin/laporan");
    } catch {
      setGalat("Koneksi terputus. Coba lagi.");
    } finally {
      setProses(false);
    }
  }

  return (
    <AlertDialog open={buka} onOpenChange={o => { setBuka(o); if (!o) setGalat(null); }}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-status-act-br text-status-act-fg hover:bg-urgent-soft hover:text-status-act-fg">
          <Trash2 className="h-4 w-4" />Hapus laporan
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus laporan ini secara permanen?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-text2">
              <p><b className="text-foreground">LPR-{String(id).padStart(4, "0")} · {judul}</b></p>
              <p>Yang ikut terhapus: data laporan, foto KTP pelapor{jumlahKebutuhan ? `, ${jumlahKebutuhan} kebutuhan barang` : ", kebutuhan barang"}, dan penugasan relawan untuk laporan ini.</p>
              <p><b className="text-foreground">Tidak bisa dibatalkan.</b> Untuk laporan yang sudah ditangani, ubah statusnya saja.</p>
              {galat && <p className="rounded-lg bg-urgent-soft px-3 py-2 font-semibold text-status-act-fg">{galat}</p>}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={proses}>Batal</AlertDialogCancel>
          <Button onClick={hapus} disabled={proses} className="bg-urgent text-urgent-foreground hover:bg-urgent/90">
            {proses ? "Menghapus…" : "Hapus permanen"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
