import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Peta kecil untuk langkah Lokasi di wizard lapor: pin bisa diketuk atau
// digeser ke titik kejadian (pelapor sering tidak berdiri tepat di lokasi).

export type Titik = { lat: number; lng: number };

const BALI: [number, number] = [-8.4, 115.2];

const pinIcon = L.divIcon({
  html: `<svg width="34" height="44" viewBox="0 0 34 44" style="display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">
    <path d="M17 43C13 33 2 27 2 16A15 15 0 0 1 32 16C32 27 21 33 17 43Z" fill="hsl(3 76% 47%)" stroke="#fff" stroke-width="2.5"/>
    <circle cx="17" cy="16" r="5.5" fill="#fff"/></svg>`,
  className: "lapor-pin",
  iconSize: [34, 44],
  iconAnchor: [17, 43],
});

function KlikPeta({ onPick }: { onPick: (t: Titik) => void }) {
  useMapEvents({ click: e => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

function Ikuti({ titik, zoom }: { titik: Titik | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (titik) map.setView([titik.lat, titik.lng], Math.max(map.getZoom(), zoom));
    // sengaja hanya saat titik GPS berubah, bukan tiap geser pin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titik?.lat, titik?.lng]);
  return null;
}

export function LokasiPicker({
  titik,
  gps,
  akurasi,
  onChange,
}: {
  titik: Titik | null;
  gps: Titik | null;
  akurasi: number | null;
  onChange: (t: Titik) => void;
}) {
  return (
    <div className="isolate h-[260px] overflow-hidden rounded-[18px] border border-border-strong">
      <MapContainer center={titik ? [titik.lat, titik.lng] : BALI} zoom={titik ? 16 : 9} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <KlikPeta onPick={onChange} />
        <Ikuti titik={gps} zoom={16} />
        {gps && akurasi != null && (
          <Circle center={[gps.lat, gps.lng]} radius={akurasi} pathOptions={{ color: "#125CA5", weight: 1, fillOpacity: 0.12 }} />
        )}
        {titik && (
          <Marker
            position={[titik.lat, titik.lng]}
            icon={pinIcon}
            draggable
            eventHandlers={{ dragend: e => { const p = (e.target as L.Marker).getLatLng(); onChange({ lat: p.lat, lng: p.lng }); } }}
          />
        )}
      </MapContainer>
    </div>
  );
}

// Jarak kasar (meter) antara posisi GPS dan pin — untuk keterangan "pin digeser N m".
export function jarakMeter(a: Titik, b: Titik) {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
