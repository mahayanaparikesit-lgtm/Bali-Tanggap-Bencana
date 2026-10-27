import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "@/lib/theme";

// Belum ada foto dokumentasi asli — README handoff eksplisit menandai ini
// sebagai satu-satunya pengecualian fidelity: placeholder + caption boleh
// disederhanakan, ganti begitu foto asli tersedia.
export function PhotoPlaceholder({ caption, style }: { caption: string; style?: object }) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.caption} numberOfLines={2}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  caption: { fontFamily: fonts.mono, fontSize: 11, color: colors.text3, textAlign: "center" },
});
