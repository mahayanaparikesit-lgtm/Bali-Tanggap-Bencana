import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { statusTokens, fonts, type StatusKey } from "@/lib/theme";

// Satu-satunya StatusBadge di app mobile — jangan bikin styling status baru di
// tempat lain. Spec: design_handoff_bali_rief/README.md § Accessibility rule
// (non-negotiable): setiap status HARUS warna + bentuk ikon + label sekaligus,
// tidak pernah cuma warna. Bentuk ikon per status juga tidak boleh ditukar
// (mis. "aktif" segitiga, bukan lingkaran) karena itu bagian dari sinyal yang
// harus tetap bisa dibedakan tanpa warna sama sekali.
// Ikon pakai @expo/vector-icons (Ionicons), bukan bentuk SVG generik — tapi
// silhouette per status tetap sengaja dibedakan: "wait" jam, "ver" perisai,
// "act" segitiga (ikon "play", sesuai aturan di atas), "done" lingkaran-centang,
// "rej" lingkaran-silang.
const STATUS_LABELS: Record<StatusKey, string> = {
  wait: "Menunggu",
  ver: "Terverifikasi",
  act: "Aktif — ditangani",
  done: "Selesai",
  rej: "Ditolak",
};

// Backend (laporan/penugasan/relawan) masih pakai string Bahasa Indonesia
// langsung ("menunggu", "aktif", dst) — bukan 5-key system di handoff.
// "dibatalkan" tidak ada di spec handoff; dipetakan ke "rej" (paling dekat
// secara makna: proses berhenti, bukan status positif).
const BACKEND_TO_KEY: Record<string, StatusKey> = {
  menunggu: "wait",
  terverifikasi: "ver",
  selesai: "done",
  aktif: "act",
  ditolak: "rej",
  dibatalkan: "rej",
};

function resolveStatusKey(status: string): StatusKey {
  if (status in statusTokens) return status as StatusKey;
  return BACKEND_TO_KEY[status] ?? "wait";
}

function StatusIcon({ status, size, color }: { status: StatusKey; size: number; color: string }) {
  if (status === "wait") return <Ionicons name="time-outline" size={size} color={color} />;
  if (status === "ver") return <Ionicons name="shield-checkmark-outline" size={size} color={color} />;
  if (status === "act") return <Ionicons name="play" size={size} color={color} />;
  if (status === "done") return <Ionicons name="checkmark-circle" size={size} color={color} />;
  // rej
  return <Ionicons name="close-circle" size={size} color={color} />;
}

export function StatusBadge({
  status: rawStatus,
  label,
  note,
  size = "md",
}: {
  status: StatusKey | string;
  label?: string;
  note?: string;
  size?: "sm" | "md";
}) {
  const status = resolveStatusKey(rawStatus);
  const t = statusTokens[status];
  const text = (label ?? STATUS_LABELS[status]) + (note ? ` — ${note}` : "");
  const isMd = size === "md";
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: t.bg,
          borderColor: t.br,
          paddingHorizontal: isMd ? 10 : 8,
          paddingVertical: isMd ? 5 : 3,
        },
      ]}
    >
      <StatusIcon status={status} size={isMd ? 12.5 : 12} color={t.fg} />
      <Text style={{ color: t.fg, fontFamily: fonts.sansBold, fontSize: isMd ? 12.5 : 12 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderRadius: 7,
    alignSelf: "flex-start",
  },
});
