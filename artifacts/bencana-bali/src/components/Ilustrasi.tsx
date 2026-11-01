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

function isi(adegan: Adegan, W: number, H: number, gid: string) {
  let s = "";
  switch (adegan) {
    case "hero": {
      s = `<defs><linearGradient id="${gid}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6DDA6"/><stop offset=".55" stop-color="#EDB06C"/><stop offset="1" stop-color="#D98C55"/></linearGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#${gid}s)"/>
        <circle cx="${W * 0.6}" cy="${H * 0.43}" r="${H * 0.17}" fill="#F7C548"/>
        <path d="M${W * 0.42} ${H * 0.7} L${W * 0.82} ${H * 0.25} Q${W * 0.85} ${H * 0.22} ${W * 0.88} ${H * 0.25} L${W * 1.1} ${H * 0.62}Z" fill="#8D9C8E" opacity=".75"/>
        <path d="M${W * 0.55} ${H * 0.74} L${W * 0.86} ${H * 0.3} Q${W * 0.88} ${H * 0.27} ${W * 0.9} ${H * 0.3} L${W * 1.08} ${H * 0.68}Z" fill="#4B6563"/>`;
      s += gateHalf(W * 0.6, H * 0.05, H * 0.86, H * 0.52, "#2A2622", false) + gateHalf(W * 0.6, H * 0.05, H * 0.86, H * 0.52, "#2A2622", true);
      ["#9DBA68", "#86A859", "#6F944C", "#5B7F42", "#486B37", "#3A5A2F", "#2E4A27"].forEach((c, i) => {
        const y = H * 0.62 + i * H * 0.058;
        s += `<path d="M0 ${y} C${W * 0.25} ${y - 26}, ${W * 0.55} ${y + 24}, ${W} ${y - 14} L${W} ${H} L0 ${H}Z" fill="${c}"/>
          <path d="M0 ${y} C${W * 0.25} ${y - 26}, ${W * 0.55} ${y + 24}, ${W} ${y - 14}" stroke="#D5E39A" stroke-opacity=".35" stroke-width="2" fill="none"/>`;
      });
      s += palm(W * 0.08, H * 0.82, H * 0.42, 18, "#1F2A1E") + palm(W * 0.94, H * 0.9, H * 0.36, -14, "#1F2A1E");
      break;
    }
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
