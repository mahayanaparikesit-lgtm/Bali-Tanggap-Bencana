import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { StatusBadge } from "@/components/StatusBadge";
import { JENIS_LABELS } from "@/lib/format";

// Peta sebaran laporan bencana se-Bali. Dipakai di Home.tsx, menerima data
// yang sama dari query "transparansi-laporan" (sudah difilter backend —
// laporan "menunggu" tidak pernah ikut) jadi tidak ada fetch duplikat di sini.

const BALI_CENTER: [number, number] = [-8.4, 115.2];
const BALI_ZOOM = 10;

// Warna pin ikut warna status yang sama persis dengan StatusBadge (token CSS
// --status-*-fg di index.css) supaya bahasa visual konsisten di seluruh app.
const STATUS_PIN_COLOR: Record<string, string> = {
  menunggu: "var(--status-wait-fg)",
  terverifikasi: "var(--status-ver-fg)",
  aktif: "var(--status-act-fg)",
  selesai: "var(--status-done-fg)",
  ditolak: "var(--status-rej-fg)",
  dibatalkan: "var(--status-rej-fg)",
};

// Laporan tanpa koordinat (pelapor tidak menaruh pin, atau dari klien lama)
// tetap tampil di peta pada titik PERKIRAAN: pusat kabupaten yang dikenali dari
// teks lokasi. Popup menandainya "lokasi perkiraan" supaya tidak dikira presisi.
const PUSAT: Record<string, [number, number]> = {
  Badung: [-8.58, 115.18], Bangli: [-8.29, 115.35], Buleleng: [-8.18, 115.05], Denpasar: [-8.65, 115.22], Gianyar: [-8.47, 115.31],
  Jembrana: [-8.36, 114.63], Karangasem: [-8.39, 115.55], Klungkung: [-8.54, 115.4], Tabanan: [-8.46, 115.1],
};
const ALIAS: Record<string, string> = {
  kuta: "Badung", jimbaran: "Badung", "nusa dua": "Badung", seminyak: "Badung", canggu: "Badung", mengwi: "Badung", kerobokan: "Badung", uluwatu: "Badung",
  sanur: "Denpasar", renon: "Denpasar", ubud: "Gianyar", sukawati: "Gianyar", blahbatuh: "Gianyar", tegallalang: "Gianyar", kedewatan: "Gianyar",
  kintamani: "Bangli", songan: "Bangli", susut: "Bangli", singaraja: "Buleleng", sukasada: "Buleleng", pancasari: "Buleleng", gerokgak: "Buleleng",
  lovina: "Buleleng", seririt: "Buleleng", tejakula: "Buleleng", tegallinggah: "Buleleng", amlapura: "Karangasem", kubu: "Karangasem", abang: "Karangasem",
  sidemen: "Karangasem", bebandem: "Karangasem", tianyar: "Karangasem", rendang: "Karangasem", semarapura: "Klungkung", "nusa penida": "Klungkung",
  negara: "Jembrana", pekutatan: "Jembrana", gilimanuk: "Jembrana", bedugul: "Tabanan", kediri: "Tabanan", baturiti: "Tabanan",
};

function posisiLaporan(l: any): { pos: [number, number]; perkiraan: string | null } | null {
  const lat = Number(l.koordinat_lat), lng = Number(l.koordinat_lng);
  if (l.koordinat_lat != null && l.koordinat_lng != null && Number.isFinite(lat) && Number.isFinite(lng)) return { pos: [lat, lng], perkiraan: null };
  const teks = `${l.lokasi ?? ""} ${l.judul ?? ""}`.toLowerCase();
  const kab = Object.keys(PUSAT).find(k => teks.includes(k.toLowerCase()))
    ?? Object.entries(ALIAS).find(([a]) => new RegExp(`\\b${a}\\b`).test(teks))?.[1];
  if (!kab) return null;
  // Geser sedikit per id supaya beberapa titik perkiraan di kabupaten sama tidak bertumpuk.
  const g = ((l.id * 37) % 11 - 5) * 0.006, h = ((l.id * 53) % 11 - 5) * 0.006;
  return { pos: [PUSAT[kab][0] + g, PUSAT[kab][1] + h], perkiraan: kab };
}

function buildPinIcon(status: string) {
  const color = STATUS_PIN_COLOR[status] ?? "var(--primary)";
  const html = `
    <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.7 23.3 0 15 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="15" cy="15" r="5.5" fill="white"/>
    </svg>
  `;
  return L.divIcon({
    html,
    className: "disaster-map-pin",
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -36],
  });
}

export function DisasterMap({ laporan, onSelect }: { laporan: any[]; onSelect?: (id: number) => void }) {
  const titikList = useMemo(
    () => (laporan ?? []).map(l => ({ l, p: posisiLaporan(l) })).filter((x): x is { l: any; p: NonNullable<ReturnType<typeof posisiLaporan>> } => x.p != null),
    [laporan],
  );

  if (titikList.length === 0) {
    return (
      <div className="flex h-[420px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 text-center">
        <span className="text-[15px] font-semibold text-text2">Belum ada titik lokasi untuk ditampilkan.</span>
        <span className="max-w-[38ch] text-[13px] text-text3">
          Peta akan menampilkan titik begitu ada laporan terverifikasi yang menyertakan koordinat lokasi.
        </span>
      </div>
    );
  }

  return (
    <div className="isolate h-[420px] w-full overflow-hidden rounded-xl border border-border sm:h-[480px]">
      <MapContainer
        center={BALI_CENTER}
        zoom={BALI_ZOOM}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {titikList.map(({ l, p }) => (
          <Marker
            key={l.id}
            position={p.pos}
            icon={buildPinIcon(l.status)}
          >
            <Popup minWidth={220}>
              <div className="flex flex-col gap-2 py-0.5">
                <StatusBadge status={l.status} className="self-start" />
                <b className="text-[14.5px] font-extrabold leading-[1.25]">{l.judul}</b>
                <span className="text-[13px] font-semibold text-text2">
                  {JENIS_LABELS[l.jenis_bencana] ?? l.jenis_bencana}
                </span>
                <span className="text-[13px] text-text2">{l.lokasi}</span>
                {p.perkiraan && <span className="text-[11.5px] text-text3">Lokasi perkiraan (pusat {p.perkiraan}) — pelapor tidak menaruh titik peta</span>}
                {l.jumlah_terdampak ? (
                  <span className="font-mono text-[12.5px] text-text3">
                    {Number(l.jumlah_terdampak).toLocaleString("id-ID")} jiwa terdampak
                  </span>
                ) : null}
                {onSelect && (
                  <button
                    onClick={() => onSelect(l.id)}
                    className="mt-1 text-left text-[13px] font-bold text-primary hover:underline"
                  >
                    Lihat detail lengkap →
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
