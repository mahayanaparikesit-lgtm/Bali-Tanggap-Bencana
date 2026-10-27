import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radius } from "@/lib/theme";

// Tombol utama selalu 56px, pinned di bawah (dijangkau satu tangan) — lihat
// design_handoff_bali_rief/README.md § Spacing/shape.
export function BottomBar({
  primaryLabel,
  onPrimary,
  disabled,
  loading,
  caption,
  secondaryLabel,
  onSecondary,
}: {
  primaryLabel: string;
  onPrimary: () => void;
  disabled?: boolean;
  loading?: boolean;
  caption?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
      <Pressable
        style={[styles.primary, (disabled || loading) && styles.primaryDisabled]}
        onPress={onPrimary}
        disabled={disabled || loading}
      >
        {loading ? <ActivityIndicator color={colors.primaryInk} /> : <Text style={styles.primaryText}>{primaryLabel}</Text>}
      </Pressable>
      {secondaryLabel && (
        <Pressable style={styles.secondary} onPress={onSecondary}>
          <Text style={styles.secondaryText}>{secondaryLabel}</Text>
        </Pressable>
      )}
      {caption && <Text style={styles.caption}>{caption}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  primary: {
    minHeight: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryDisabled: { opacity: 0.5 },
  primaryText: { color: colors.primaryInk, fontFamily: fonts.sansExtraBold, fontSize: 17 },
  secondary: {
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: colors.text, fontFamily: fonts.sansExtraBold, fontSize: 16 },
  caption: { fontSize: 12.5, color: colors.text3, textAlign: "center", fontFamily: fonts.sans },
});
