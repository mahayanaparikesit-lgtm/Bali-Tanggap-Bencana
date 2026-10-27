import type { ColorValue } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Ikon bottom tab bar donatur, pakai @expo/vector-icons (Ionicons) — sebelumnya
// bentuk SVG generik (segitiga/pin/lingkaran/kotak belah ketupat) yang tidak
// benar-benar merepresentasikan konsep tab-nya. expo-router's Tabs.Screen
// tabBarIcon cuma ngasih `color` (lihat app/donatur/(tabs)/_layout.tsx), jadi
// prop di sini tetap cuma `color` — ColorValue karena tipe itu yang dikirim RN
// 0.86, walau nilainya selalu string dari theme.
export function BerandaIcon({ color }: { color: ColorValue }) {
  return <Ionicons name="home" size={17} color={color} />;
}

export function LokasiIcon({ color }: { color: ColorValue }) {
  return <Ionicons name="location" size={17} color={color} />;
}

export function RiwayatIcon({ color }: { color: ColorValue }) {
  return <Ionicons name="time" size={17} color={color} />;
}

export function ProfilIcon({ color }: { color: ColorValue }) {
  return <Ionicons name="person" size={17} color={color} />;
}
