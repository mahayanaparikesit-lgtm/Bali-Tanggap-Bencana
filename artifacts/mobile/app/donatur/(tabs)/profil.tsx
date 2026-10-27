import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { colors, fonts, spacing, radius } from "@/lib/theme";

export default function ProfilTab() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.label}>Nama</Text>
          <Text style={styles.value}>{user?.nama}</Text>
          <View style={styles.divider} />
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
        <Pressable style={styles.logout} onPress={() => logout()}>
          <Text style={styles.logoutText}>Keluar</Text>
        </Pressable>
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
  body: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: 15,
  },
  label: { fontSize: 12, fontFamily: fonts.sansExtraBold, textTransform: "uppercase", letterSpacing: 0.5, color: colors.text3, marginBottom: 4 },
  value: { fontSize: 15.5, fontFamily: fonts.sansSemiBold, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  logout: {
    minHeight: 52, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderStrong,
    alignItems: "center", justifyContent: "center",
  },
  logoutText: { fontSize: 16, fontFamily: fonts.sansExtraBold, color: colors.text },
});
