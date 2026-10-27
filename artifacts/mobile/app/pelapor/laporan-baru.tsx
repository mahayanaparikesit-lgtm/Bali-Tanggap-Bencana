import { LaporanWizard } from "@/components/LaporanWizard";

// Rute ini tetap di balik RoleGuard(["pelapor"]) lewat app/pelapor/_layout.tsx —
// dipakai akun pelapor yang sudah login supaya laporannya nyambung ke riwayat
// di dashboard. Untuk pelaporan darurat tanpa akun, lihat app/lapor.tsx yang
// merender komponen wizard yang sama tanpa RoleGuard.
export default function LaporanBaruScreen() {
  return <LaporanWizard />;
}
