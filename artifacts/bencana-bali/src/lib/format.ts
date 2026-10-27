// Helper format bersama — dipakai di semua halaman publik yang sudah di-redesign
// sesuai design_handoff_bali_rief (Landing Page, Transparansi, dst). Jangan
// duplikat ulang di tiap halaman, import dari sini.

export function formatRupiah(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export function formatRupiahRingkas(n: number) {
  if (Math.abs(n) >= 1_000_000_000) return "Rp " + (n / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "").replace(".", ",") + " M";
  if (Math.abs(n) >= 1_000_000) return "Rp " + (n / 1_000_000).toFixed(1).replace(/\.0$/, "").replace(".", ",") + " jt";
  return formatRupiah(n);
}

export function formatWaktu(iso: string) {
  const d = new Date(iso);
  const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const sameDay = d.toDateString() === new Date().toDateString();
  if (sameDay) return `Hari ini, ${jam} WITA`;
  return `${d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}, ${jam} WITA`;
}

export function formatTanggalSingkat(iso: string) {
  const d = new Date(iso);
  const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  return `${d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} ${jam}`;
}

export function formatKoordinat(lat: unknown, lng: unknown) {
  if (lat == null || lng == null) return null;
  const la = Number(lat), lo = Number(lng);
  if (Number.isNaN(la) || Number.isNaN(lo)) return null;
  return `${la.toFixed(5)}, ${lo.toFixed(5)}`;
}

export const JENIS_LABELS: Record<string, string> = {
  banjir: "Banjir", gempa_bumi: "Gempa Bumi", tanah_longsor: "Tanah Longsor",
  kebakaran: "Kebakaran", angin_kencang: "Angin Kencang", tsunami: "Tsunami", lainnya: "Lainnya",
};
