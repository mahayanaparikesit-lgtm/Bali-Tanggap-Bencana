import { cn } from "@/lib/utils";

// Satu-satunya StatusBadge di app web — jangan bikin styling status baru di
// tempat lain. Spec: design_handoff_bali_rief/README.md § Accessibility rule
// (non-negotiable): setiap status HARUS warna + bentuk ikon + label sekaligus,
// tidak pernah cuma warna. Bentuk ikon per status juga tidak boleh ditukar
// (mis. "aktif" segitiga, bukan lingkaran). Sama persis dengan StatusBadge
// mobile (artifacts/mobile/src/components/StatusBadge.tsx) — jaga konsisten.
export type StatusKey = "wait" | "ver" | "act" | "done" | "rej";

const STATUS_LABELS: Record<StatusKey, string> = {
  wait: "Menunggu verifikasi",
  ver: "Terverifikasi",
  act: "Aktif — ditangani",
  done: "Selesai",
  rej: "Ditolak",
};

const STATUS_CLASS: Record<StatusKey, string> = {
  wait: "bg-status-wait-bg text-status-wait-fg border-status-wait-br",
  ver: "bg-status-ver-bg text-status-ver-fg border-status-ver-br",
  act: "bg-status-act-bg text-status-act-fg border-status-act-br",
  done: "bg-status-done-bg text-status-done-fg border-status-done-br",
  rej: "bg-status-rej-bg text-status-rej-fg border-status-rej-br",
};

// Backend (laporan/penugasan/relawan/donasi) masih pakai string Bahasa
// Indonesia langsung ("menunggu", "aktif", dst) — bukan 5-key system di
// handoff. "dibatalkan" tidak ada di spec handoff; dipetakan ke "rej" (paling
// dekat secara makna: proses berhenti, bukan status positif). "diterima"
// (status donasi) dipetakan ke "done" — donasi yang sudah dikonfirmasi admin.
const BACKEND_TO_KEY: Record<string, StatusKey> = {
  menunggu: "wait",
  terverifikasi: "ver",
  selesai: "done",
  aktif: "act",
  diterima: "done",
  ditolak: "rej",
  dibatalkan: "rej",
};

function resolveStatusKey(status: string): StatusKey {
  if (status === "wait" || status === "ver" || status === "act" || status === "done" || status === "rej") return status;
  return BACKEND_TO_KEY[status] ?? "wait";
}

function StatusIcon({ status, size }: { status: StatusKey; size: number }) {
  if (status === "wait") {
    return (
      <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true">
        <circle cx={5} cy={5} r={3.6} fill="none" stroke="currentColor" strokeWidth={2} />
      </svg>
    );
  }
  if (status === "ver") {
    return (
      <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true">
        <rect x={1.6} y={1.6} width={6.8} height={6.8} fill="currentColor" transform="rotate(45 5 5)" />
      </svg>
    );
  }
  if (status === "act") {
    return (
      <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true">
        <polygon points="5,0.8 9.4,9 0.6,9" fill="currentColor" />
      </svg>
    );
  }
  if (status === "done") {
    return (
      <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true">
        <circle cx={6} cy={6} r={5.2} fill="currentColor" />
        <polyline points="3.6,6.2 5.2,7.9 8.4,4.3" fill="none" stroke="hsl(var(--card))" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // rej
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true">
      <line x1={2} y1={2} x2={8} y2={8} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1={8} y1={2} x2={2} y2={8} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function StatusBadge({ status: rawStatus, label, className }: { status: string; label?: string; className?: string }) {
  const status = resolveStatusKey(rawStatus);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[7px] whitespace-nowrap rounded-[7px] border px-[11px] py-[6px] text-[12.5px] font-bold",
        STATUS_CLASS[status],
        className,
      )}
    >
      <StatusIcon status={status} size={11} />
      {label ?? STATUS_LABELS[status]}
    </span>
  );
}

const JENIS_LABELS: Record<string, string> = {
  banjir: "Banjir",
  gempa_bumi: "Gempa Bumi",
  tanah_longsor: "Tanah Longsor",
  kebakaran: "Kebakaran",
  angin_kencang: "Angin Kencang",
  tsunami: "Tsunami",
  lainnya: "Lainnya",
};

export function JenisBadge({ jenis }: { jenis: string }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-text2">
      {JENIS_LABELS[jenis] || jenis}
    </span>
  );
}

export function KategoriBadge({ kategori }: { kategori: string }) {
  const labels: Record<string, string> = {
    pangan: "Pangan", sandang: "Sandang", medis: "Medis",
    tempat_tinggal: "Tempat Tinggal", air_bersih: "Air Bersih", lainnya: "Lainnya",
  };
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-md border border-border bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-text2">
      {labels[kategori] || kategori}
    </span>
  );
}
