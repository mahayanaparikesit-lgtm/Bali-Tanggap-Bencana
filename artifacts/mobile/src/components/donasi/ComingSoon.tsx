import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, spacing } from "@/lib/theme";

// Tab ini belum ada di scope Mobile Alur Donasi.dc.html — desainnya ada di
// file handoff lain (mis. Pilih Tempat Donasi.dc.html untuk "Lokasi") yang
// belum diimplementasikan. Placeholder jujur, bukan konten isian.
export function ComingSoon({ title, note }: { title: string; note: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.note}>{note}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 20, fontFamily: fonts.sansExtraBold, color: colors.text, letterSpacing: -0.4 },
  body: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  note: { fontSize: 14, color: colors.text3, textAlign: "center", fontFamily: fonts.sans },
});
