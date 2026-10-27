import { LaporanWizard } from "@/components/LaporanWizard";

// Rute publik untuk lapor darurat TANPA login — sengaja di app/lapor.tsx (top
// level), bukan di bawah app/pelapor/ supaya tidak ikut kena RoleGuard di
// app/pelapor/_layout.tsx. POST /laporan sudah publik/tanpa auth di backend;
// hambatan sebelumnya cuma penjagaan rute di sisi mobile ini.
export default function LaporScreen() {
  return <LaporanWizard />;
}
