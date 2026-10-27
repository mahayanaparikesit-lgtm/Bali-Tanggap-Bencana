// Token sumber: design_handoff_bali_rief/README.md — palet & status FIXED, jangan
// diganti manual. Merah/oranye sengaja dipilih untuk konteks darurat, jangan biru/ungu.
export const colors = {
  bg: "#F6F7F9",
  surface: "#FFFFFF",
  surface2: "#EDEFF3",
  border: "#D6DAE1",
  borderStrong: "#B3B9C7",
  text: "#171C26",
  text2: "#5C6370",
  text3: "#788191",

  primary: "#CF2317",
  primaryHover: "#AE1E13",
  primaryInk: "#FFFFFF",
  primarySoft: "#FDEEED",
  accent: "#EE862B",
  accentInk: "#7E3E07",

  // Legacy aliases kept so existing screens (built pre-handoff) keep compiling —
  // baru diselaraskan bertahap saat screen itu di-redesign ulang.
  background: "#F6F7F9",
  foreground: "#171C26",
  card: "#FFFFFF",
  mutedForeground: "#5C6370",
  destructive: "#B81F14",
  onColor: "#FFFFFF",
  secondary: "#EE862B",
  primaryBorder: "#AE1E13",
  statusMenunggu: "#9B4D08",
  statusTerverifikasi: "#125CA5",
  statusSelesai: "#1E6748",
  statusAktif: "#B81F14",
  statusDitolak: "#535965",
  statusDibatalkan: "#535965",
};

// 5-status system dari handoff §Status tokens — SELALU dipakai lewat StatusBadge,
// jangan dibaca langsung kecuali menulis StatusBadge itu sendiri.
export const statusTokens = {
  wait: { fg: "#9B4D08", bg: "#FDE9D8", br: "#F1B47E" },
  ver: { fg: "#125CA5", bg: "#E3F0FC", br: "#82B8ED" },
  done: { fg: "#1E6748", bg: "#E0F5EC", br: "#8DCEB3" },
  rej: { fg: "#535965", bg: "#E8EAED", br: "#B5BAC5" },
  act: { fg: "#B81F14", bg: "#FCE9E8", br: "#EE928B" },
} as const;

export type StatusKey = keyof typeof statusTokens;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  pill: 999,
};

// Plus Jakarta Sans (UI/heading) + IBM Plex Mono (angka/waktu/ID) — lihat
// design_handoff_bali_rief/README.md §Typography. Dimuat lewat useFonts di app/_layout.tsx.
export const fonts = {
  sans: "PlusJakartaSans_400Regular",
  sansMedium: "PlusJakartaSans_500Medium",
  sansSemiBold: "PlusJakartaSans_600SemiBold",
  sansBold: "PlusJakartaSans_700Bold",
  sansExtraBold: "PlusJakartaSans_800ExtraBold",
  mono: "IBMPlexMono_400Regular",
  monoMedium: "IBMPlexMono_500Medium",
  monoSemiBold: "IBMPlexMono_600SemiBold",
};
