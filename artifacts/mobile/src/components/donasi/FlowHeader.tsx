import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, fonts } from "@/lib/theme";

// Header spec: design_handoff_bali_rief — chevron-back 44x44 di kiri (margin -10
// biar rata dengan konten), judul 16px/800, padding-bottom 14, border-bottom.
export function FlowHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 14 }]}>
      <Pressable onPress={onBack ?? (() => router.back())} style={styles.back} hitSlop={8}>
        <Text style={styles.chevron}>‹</Text>
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: {
    width: 44,
    height: 44,
    marginLeft: -10,
    alignItems: "center",
    justifyContent: "center",
  },
  chevron: { fontSize: 22, color: colors.text },
  title: { fontFamily: fonts.sansExtraBold, fontSize: 16, color: colors.text },
});
