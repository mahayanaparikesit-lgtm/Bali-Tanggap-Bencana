import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { colors, fonts, spacing } from "@/lib/theme";

export function ScreenHeader({ title, showBack, action }: { title: string; showBack?: boolean; action?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable onPress={() => router.back()} style={styles.iconButton} hitSlop={8}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.right}>
          {action}
          <Pressable onPress={() => logout()} style={styles.iconButton} hitSlop={8}>
            <Feather name="log-out" size={20} color={colors.text2} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    minHeight: 44,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontFamily: fonts.sansExtraBold,
    color: colors.text,
    textAlign: "center",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
  },
});
