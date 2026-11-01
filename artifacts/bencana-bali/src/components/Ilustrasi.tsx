import { useId } from "react";

// Ilustrasi datar per jenis bencana — dipakai sebagai PENGGANTI foto bila
// laporan belum punya foto dokumentasi (bukan foto karangan; jelas terlihat
// sebagai gambar ilustrasi). Sumber desain: redesign/index.html (prototipe).
// Isi SVG dibangun dari konstanta di file ini saja, tidak pernah dari input
// pengguna, jadi aman dipasang lewat dangerouslySetInnerHTML.

export type Adegan = "hero" | "banjir" | "longsor" | "angin" | "gempa" | "kebakaran" | "gelombang" | "lainnya";

const JENIS_KE_ADEGAN: Record<string, Adegan> = {
  banjir: "banjir",
  tanah_longsor: "longsor",
  angin_kencang: "angin",
  gempa_bumi: "gempa",
  kebakaran: "kebakaran",
  tsunami: "gelombang",
  lainnya: "lainnya",
};

export function adeganDariJenis(jenis: string | null | undefined): Adegan {
  return JENIS_KE_ADEGAN[jenis ?? ""] ?? "lainnya";
}

function palm(x: number, y: number, h: number, lean: number, col: string) {
  const tx = x + lean * 1.6, ty = y - h;
  const fr = [[-46, -6, -60, 22], [-30, -22, -50, -6], [0, -30, 10, -34], [30, -22, 52, -4], [44, -4, 58, 24]]
    .map(([a, b, c, d]) => `<path d="M${tx} ${ty} q${a} ${b} ${c} ${d}" stroke="${col}" stroke-width="6" fill="none" stroke-linecap="round"/>`).join("");
  return `<path d="M${x} ${y} q${lean} ${-h / 2} ${lean * 1.6} ${-h}" stroke="${col}" stroke-width="6" fill="none" stroke-linecap="round"/>${fr}`;
}

function house(x: number, y: number, w: number, wall: string, roof: string) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${w * 0.62}" fill="${wall}"/><path d="M${x - 8} ${y + 2} L${x + w / 2} ${y - w * 0.42} L${x + w + 8} ${y + 2}Z" fill="${roof}"/><rect x="${x + w * 0.38}" y="${y + w * 0.22}" width="${w * 0.24}" height="${w * 0.4}" fill="#3B2E25" opacity=".55"/>`;
}

// Candi bentar: menara bertingkat dengan sisi dalam terbelah lurus.
function gateHalf(c: number, gap: number, B: number, H: number, col: string, mirror: boolean) {
  const cut = c - gap / 2;
  const steps = [[0, 20], [30, 34], [70, 50], [115, 66], [165, 84], [220, 110]];
  let pts: number[][] = [[cut, B], [cut, B - H]];
  steps.forEach(([dy, dx], i) => {
    const nx = steps[i + 1];
    pts.push([cut - dx, B - H + dy]);
    pts.push([cut - dx, nx ? B - H + nx[0] : B]);
  });
  if (mirror) pts = pts.map(([x, y]) => [2 * c - x, y]);
  return `<path d="M${pts.map(p => p.join(" ")).join(" L")}Z" fill="${col}"/>`;
}

// ---------- Hero: pura meru di tepi danau saat matahari terbenam ----------
// Kanvas tetap 1200×640. Komposisi: langit hangat + awan, matahari besar,
// gunung berlapis, pura meru bertingkat di tengah-kanan, danau dengan
// pantulan, penjor & bunga kamboja di kiri bawah, daun tropis di kedua sudut.

function awan(x: number, y: number, k: number) {
  const c = (dx: number, dy: number, r: number) => `<circle cx="${x + dx * k}" cy="${y + dy * k}" r="${r * k}"/>`;
  return `<g fill="#FCF0CF" opacity=".92">${c(0, 0, 34)}${c(38, -14, 42)}${c(82, -2, 32)}${c(116, 8, 22)}<rect x="${x - 10 * k}" y="${y}" width="${140 * k}" height="${30 * k}" rx="${15 * k}"/></g>`;
}

function daun(x: number, y: number, len: number, rot: number, col: string) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0 Q${len * 0.5} ${-len * 0.24} ${len} 0 Q${len * 0.5} ${len * 0.24} 0 0Z" fill="${col}"/>
    <path d="M0 0 L${len * 0.96} 0" stroke="#000" stroke-opacity=".18" stroke-width="2"/>${[0.25, 0.45, 0.65].map(t => `<path d="M${len * t} 0 l${len * 0.08} ${-len * 0.09} M${len * t} 0 l${len * 0.08} ${len * 0.09}" stroke="#000" stroke-opacity=".12" stroke-width="1.5"/>`).join("")}</g>`;
}

function kamboja(cx: number, cy: number, r: number, rot: number) {
  let s = `<g transform="translate(${cx} ${cy}) rotate(${rot})">`;
  for (let i = 0; i < 5; i++) s += `<ellipse cx="${r * 0.62}" cy="0" rx="${r * 0.62}" ry="${r * 0.36}" transform="rotate(${i * 72})" fill="#FFF7E0" stroke="#EBCB88" stroke-width="1.2"/>`;
  return s + `<circle r="${r * 0.32}" fill="#F4B92A"/><circle r="${r * 0.14}" fill="#E39B12"/></g>`;
}

function palmBesar(x: number, y: number, h: number, lean: number, col: string) {
  const tx = x + lean, ty = y - h;
  const fr = [[-120, 10], [-90, -40], [-40, -70], [20, -72], [80, -42], [118, 8], [60, 40], [-70, 36]]
    .map(([dx, dy]) => `<path d="M${tx} ${ty} q${dx * 0.5} ${dy - 30} ${dx} ${dy + 20}" stroke="${col}" stroke-width="9" fill="none" stroke-linecap="round"/>`).join("");
  return `<path d="M${x} ${y} Q${x + lean * 0.2} ${y - h * 0.6} ${tx} ${ty}" stroke="${col}" stroke-width="12" fill="none" stroke-linecap="round"/>${fr}`;
}

function meru(cx: number, base: number) {
  let s = `<rect x="${cx - 128}" y="${base}" width="256" height="16" fill="#6E4A2C"/><rect x="${cx - 160}" y="${base + 14}" width="320" height="10" fill="#57391F"/>`;
  // badan dasar dengan pintu
  s += `<rect x="${cx - 52}" y="${base - 44}" width="104" height="44" fill="#A5693B"/><rect x="${cx - 13}" y="${base - 34}" width="26" height="34" fill="#4A2F1B"/>`;
  let y = base - 44, w = 236;
  for (let i = 0; i < 7; i++) {
    const rh = 15 - i * 0.6, bh = i === 0 ? 0 : 11;
    if (bh) { s += `<rect x="${cx - w * 0.2}" y="${y - bh}" width="${w * 0.4}" height="${bh}" fill="#9A6236"/>`; y -= bh; }
    s += `<path d="M${cx - w / 2} ${y} L${cx + w / 2} ${y} L${cx + w * 0.3} ${y - rh} L${cx - w * 0.3} ${y - rh}Z" fill="#3B2F26"/><path d="M${cx - w / 2} ${y} L${cx + w / 2} ${y}" stroke="#5E4A3A" stroke-width="2"/>`;
    y -= rh; w -= 28;
  }
  return s + `<rect x="${cx - 4}" y="${y - 22}" width="8" height="22" fill="#3B2F26"/><circle cx="${cx}" cy="${y - 24}" r="6" fill="#C98F0A"/>`;
}

function gedong(cx: number, base: number, k: number) {
  return `<rect x="${cx - 26 * k}" y="${base - 30 * k}" width="${52 * k}" height="${30 * k}" fill="#8E5B35"/>
    <path d="M${cx - 44 * k} ${base - 30 * k} L${cx + 44 * k} ${base - 30 * k} L${cx + 22 * k} ${base - 50 * k} L${cx - 22 * k} ${base - 50 * k}Z" fill="#3B2F26"/>
    <path d="M${cx - 26 * k} ${base - 50 * k} L${cx + 26 * k} ${base - 50 * k} L${cx + 10 * k} ${base - 64 * k} L${cx - 10 * k} ${base - 64 * k}Z" fill="#3B2F26"/>`;
}

function heroBali(gid: string) {
  const W = 1200, H = 640, lake = 548, cx = 790;
  let s = `<defs>
    <linearGradient id="${gid}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE6AE"/><stop offset=".55" stop-color="#F7D488"/><stop offset="1" stop-color="#F1C26B"/></linearGradient>
    <linearGradient id="${gid}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3CB78"/><stop offset="1" stop-color="#D9A954"/></linearGradient>
    <clipPath id="${gid}c"><rect x="0" y="${lake}" width="${W}" height="${H - lake}"/></clipPath></defs>
    <rect width="${W}" height="${H}" fill="url(#${gid}l)"/>`;
  s += awan(70, 140, 1.15) + awan(380, 96, 0.75) + awan(980, 110, 1) + awan(1090, 230, 0.7) + awan(-30, 330, 0.9);
  s += `<circle cx="${cx + 40}" cy="300" r="138" fill="#F6C24F"/><circle cx="${cx + 40}" cy="300" r="96" fill="#F8CE62" opacity=".7"/>`;
  s += [[560, 190], [606, 214], [648, 198]].map(([x, y]) => `<path d="M${x} ${y} q9 -9 18 0 q9 -9 18 0" stroke="#6B4E2E" stroke-width="3" fill="none" stroke-linecap="round"/>`).join("");
  // gunung berlapis
  s += `<path d="M-20 470 L170 360 Q230 330 290 360 L520 470Z" fill="#B8AE87" opacity=".75"/>
    <path d="M520 480 L960 238 Q990 220 1020 238 L1260 390 V480Z" fill="#93A08A"/>
    <path d="M990 229 L1020 238 L1260 390 V480 L1100 480Z" fill="#7F8D78"/>
    <path d="M360 480 L610 350 Q640 334 670 350 L900 480Z" fill="#A6AC90"/>
    <rect y="440" width="${W}" height="46" fill="#F3D99C" opacity=".35"/>`;
  // garis pepohonan
  let pohon = "";
  for (let x = -20; x <= W + 20; x += 34) pohon += `<circle cx="${x}" cy="${500 + ((x * 7) % 9)}" r="${24 + ((x * 13) % 10)}"/>`;
  s += `<g fill="#5E7646">${pohon}</g><rect y="505" width="${W}" height="${lake - 505}" fill="#4F663B"/>`;
  // kompleks pura
  const pura = meru(cx, lake - 26) + gedong(cx - 210, lake - 10, 1) + gedong(cx + 220, lake - 10, 0.9)
    + `<g fill="#465E35"><circle cx="${cx - 300}" cy="${lake - 40}" r="34"/><circle cx="${cx - 268}" cy="${lake - 60}" r="28"/><circle cx="${cx + 310}" cy="${lake - 44}" r="32"/><circle cx="${cx + 340}" cy="${lake - 26}" r="26"/></g>`;
  s += pura;
  // danau + pantulan
  s += `<rect y="${lake}" width="${W}" height="${H - lake}" fill="url(#${gid}a)"/>
    <g clip-path="url(#${gid}c)" opacity=".22" transform="translate(0 ${lake * 2}) scale(1 -1)">${pura}</g>
    <ellipse cx="${cx + 40}" cy="${lake + 34}" rx="90" ry="7" fill="#FCE4A0" opacity=".75"/>
    <g stroke="#FCE7B0" stroke-width="3" stroke-linecap="round" opacity=".6">${[[600, 572, 90], [760, 596, 140], [940, 584, 70], [480, 610, 60], [1040, 612, 80]].map(([x, y, w]) => `<path d="M${x} ${y} h${w}"/>`).join("")}</g>`;
  // tepi rumput depan
  s += `<path d="M0 560 Q220 545 400 604 L400 ${H} L0 ${H}Z" fill="#6E8D3E"/><path d="M880 ${H} Q1010 568 1200 556 V${H}Z" fill="#6E8D3E"/>
    <path d="M0 600 Q180 588 330 640 H0Z" fill="#587A31"/>`;
  // penjor
  s += `<path d="M165 ${H} Q140 400 240 262 Q300 196 340 300" stroke="#B9862F" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M175 ${H} Q152 404 248 270 Q304 210 336 300" stroke="#F0CF6B" stroke-width="3" fill="none"/>`;
  [[160, 560], [156, 500], [158, 440], [170, 380], [192, 326], [222, 284], [262, 250], [300, 248], [326, 268]].forEach(([x, y], i) => {
    s += `<path d="M${x} ${y} l${i % 2 ? 14 : -14} 18 l${i % 2 ? -4 : 4} 6" stroke="#E9C25A" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  });
  s += `<path d="M340 300 q-12 26 0 46 q12 -20 0 -46Z" fill="#E7B84B"/><path d="M340 346 v40 M334 346 v30 M346 346 v30" stroke="#D9A43A" stroke-width="2"/>`;
  // daun tropis di sudut
  s += daun(-10, H + 6, 230, -58, "#3F6B2E") + daun(30, H + 10, 200, -32, "#4E7F35") + daun(-20, H - 30, 170, -84, "#2F5524")
    + daun(W + 10, H + 6, 230, -122, "#3F6B2E") + daun(W - 30, H + 10, 200, -148, "#4E7F35") + daun(W + 20, H - 40, 170, -96, "#2F5524");
  s += palmBesar(1110, 600, 250, -36, "#2E4A26");
  // kamboja
  s += kamboja(66, 596, 26, 10) + kamboja(118, 626, 22, 40) + kamboja(34, 552, 18, -20) + kamboja(1150, 612, 20, 25) + kamboja(1182, 580, 15, -10);
  return s;
}

// ---------- Foto per jenis bencana ----------
// Foto contoh dari tim (public/bencana/<jenis>.jpg) — dipakai bila laporan
// belum punya foto dokumentasi sendiri. Selalu diberi label "Foto ilustrasi"
// supaya tidak terbaca sebagai foto asli lokasi.
const JENIS_FOTO = ["banjir", "tanah_longsor", "angin_kencang", "gempa_bumi", "kebakaran", "tsunami", "lainnya"];

export function fotoJenis(jenis: string | null | undefined) {
  const j = JENIS_FOTO.includes(jenis ?? "") ? jenis : "lainnya";
  return `${import.meta.env.BASE_URL.replace(/\/$/, "")}/bencana/${j}.jpg`;
}

export function FotoBencana({ jenis, className, label = true }: { jenis: string | null | undefined; className?: string; label?: boolean }) {
  return (
    <span className={`relative block overflow-hidden ${className ?? ""}`}>
      <img src={fotoJenis(jenis)} alt="" className="h-full w-full object-cover" loading="lazy" />
      {label && <span className="absolute right-2 top-2 rounded-md bg-black/45 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-white/90">Foto ilustrasi</span>}
    </span>
  );
}

function isi(adegan: Adegan, W: number, H: number, gid: string) {
  let s = "";
  switch (adegan) {
    case "hero":
      s = heroBali(gid);
      break;
    case "banjir":
      s = `<rect width="400" height="300" fill="#B8C5CC"/><path d="M0 150 Q100 110 200 140 T400 120 V300 H0Z" fill="#8FA294"/>
        ${palm(330, 190, 110, 10, "#3E4F3E")}${house(60, 140, 90, "#E7DCC6", "#B5552F")}${house(200, 152, 70, "#DCCFB4", "#9C4A2C")}
        <rect y="185" width="400" height="300" fill="#5F7F92"/>`;
      for (let i = 0; i < 6; i++) s += `<path d="M${-20 + i * 13} ${200 + i * 17} q25 -8 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" stroke="#A9C1CE" stroke-width="2.5" fill="none" opacity=".7"/>`;
      break;
    case "longsor":
      s = `<rect width="400" height="300" fill="#CDD5C9"/><path d="M0 120 Q120 40 240 70 T400 60 V300 H0Z" fill="#5C8A4A"/>
        <path d="M150 62 Q190 120 170 180 Q160 240 210 300 H300 Q250 230 262 170 Q275 110 220 60Z" fill="#8A5A34"/>
        <path d="M180 90 Q205 150 196 210" stroke="#6B4224" stroke-width="5" fill="none" opacity=".6"/>
        ${palm(70, 210, 100, 8, "#2F4A2A")}${palm(350, 220, 80, -6, "#2F4A2A")}
        <path d="M0 250 L140 238 M300 226 L400 218" stroke="#E8E1D0" stroke-width="10"/>`;
      for (let i = 0; i < 14; i++) s += `<circle cx="${205 + ((i * 37) % 90)}" cy="${200 + ((i * 53) % 90)}" r="${4 + (i % 3) * 3}" fill="#5E3B1F" opacity=".75"/>`;
      break;
    case "angin":
      s = `<rect width="400" height="300" fill="#9CADB6"/>`;
      for (let i = 0; i < 22; i++) s += `<line x1="${(i * 41) % 440 - 20}" y1="${(i * 29) % 180}" x2="${(i * 41) % 440 + 20}" y2="${(i * 29) % 180 + 40}" stroke="#E4EBEE" stroke-width="2" opacity=".55"/>`;
      s += `<path d="M0 220 Q200 200 400 215 V300 H0Z" fill="#6D7F63"/>${house(120, 170, 100, "#E2D6BD", "#7C6A5A")}
        <rect x="250" y="70" width="70" height="14" fill="#9AA3A8" transform="rotate(-24 285 77)"/>
        ${palm(50, 240, 130, 46, "#2F3F2C")}${palm(360, 250, 110, 40, "#2F3F2C")}`;
      break;
    case "gempa":
      s = `<rect width="400" height="300" fill="#D9D2C3"/><path d="M0 150 Q200 120 400 150 V300 H0Z" fill="#A7957A"/>
        <g transform="rotate(-9 200 200)">${house(130, 140, 120, "#E7DCC6", "#9C4A2C")}</g>
        <path d="M0 236 L70 230 L96 252 L140 226 L176 258 L232 230 L290 254 L340 236 L400 244" stroke="#3A2E22" stroke-width="7" fill="none" stroke-linejoin="round"/>
        <rect x="290" y="150" width="40" height="70" fill="#C9BCA2" transform="rotate(14 310 185)"/>`;
      break;
    case "kebakaran":
      s = `<rect width="400" height="300" fill="#E7AE78"/>
        <circle cx="120" cy="70" r="40" fill="#B9876A" opacity=".7"/><circle cx="170" cy="55" r="34" fill="#A7795F" opacity=".6"/><circle cx="90" cy="40" r="26" fill="#C29478" opacity=".6"/>
        <path d="M0 170 Q150 120 400 160 V300 H0Z" fill="#A98A4C"/><path d="M0 220 Q200 190 400 225 V300 H0Z" fill="#8C6F3A"/>`;
      [[90, 170, 1], [140, 178, 0.8], [60, 190, 0.7], [190, 184, 0.6]].forEach(([x, y, k]) => {
        s += `<path d="M${x} ${y} q${-18 * k} ${-30 * k} ${2 * k} ${-62 * k} q${4 * k} ${26 * k} ${16 * k} ${22 * k} q${10 * k} ${22 * k} ${-18 * k} ${40 * k}Z" fill="#E2531D"/><path d="M${x} ${y} q${-8 * k} ${-16 * k} ${2 * k} ${-34 * k} q${8 * k} ${18 * k} ${-2 * k} ${34 * k}Z" fill="#F6B13A"/>`;
      });
      for (let i = 0; i < 5; i++) s += `<line x1="${250 + i * 28}" y1="200" x2="${250 + i * 28}" y2="${150 - (i % 2) * 16}" stroke="#3A2E22" stroke-width="5"/>`;
      break;
    case "gelombang":
      s = `<rect width="400" height="300" fill="#B9CCD3"/><rect y="120" width="400" height="180" fill="#3F6F8C"/>
        <path d="M-10 190 C60 120 140 110 190 150 C150 140 130 170 160 190 Z" fill="#5E93AE"/><path d="M-10 190 C60 128 140 116 186 148" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M0 240 Q200 205 400 240 V300 H0Z" fill="#E6D6AE"/>${palm(330, 255, 120, -18, "#2F3F2C")}`;
      break;
    default:
      s = `<rect width="400" height="300" fill="#DCD5C5"/><path d="M0 200 Q200 160 400 200 V300 H0Z" fill="#8FA294"/>
        <circle cx="200" cy="120" r="48" fill="none" stroke="#6B675D" stroke-width="8"/>
        <path d="M184 106 q16 -22 32 0 q4 14 -16 20 v12" stroke="#6B675D" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="200" cy="152" r="5" fill="#6B675D"/>`;
  }
  return s;
}

export function Ilustrasi({
  adegan,
  className,
  posisi = "xMidYMid",
  lebar,
  tinggi,
}: {
  adegan: Adegan;
  className?: string;
  posisi?: "xMidYMid" | "xMinYMid" | "xMaxYMid" | "xMidYMax";
  lebar?: number;
  tinggi?: number;
}) {
  const gid = "il" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const W = lebar ?? (adegan === "hero" ? 1200 : 400);
  const H = tinggi ?? (adegan === "hero" ? 640 : 300);
  const html = `<defs><filter id="${gid}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch" result="t"/>
      <feColorMatrix in="t" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope=".2"/></feComponentTransfer>
      <feBlend in2="SourceGraphic" mode="multiply"/></filter></defs>
    <g filter="url(#${gid})">${isi(adegan, W, H, gid)}</g>`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio={`${posisi} slice`}
      className={className}
      role="img"
      aria-label="Ilustrasi — belum ada foto dokumentasi"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
