import { Redirect, router } from "expo-router";
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { colors, fonts, radius, spacing } from "@/lib/theme";

const ROLE_HOME: Record<string, string> = {
  admin: "/login",
  relawan: "/relawan",
  pelapor: "/pelapor",
  donatur: "/donatur",
};

// Landing screen: pengguna yang belum login melihat dua jalur — lapor darurat
// TANPA akun (POST /laporan sudah publik), atau masuk/daftar untuk relawan,
// donatur, dan pelapor yang mau riwayat laporannya tersimpan. Sebelumnya guest
// langsung dilempar ke /login tanpa jalur lapor darurat sama sekali.
export default function Index() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (user) {
    return <Redirect href={(ROLE_HOME[user.role] ?? "/login") as any} />;
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
        <Text style={styles.title}>Bali Tanggap Bencana</Text>
        <Text style={styles.subtitle}>Koordinasi warga, relawan, dan donasi bencana di Provinsi Bali</Text>

        <Text style={styles.sectionLabel}>Pilih jalur Anda</Text>

        <Pressable style={styles.primaryCard} onPress={() => router.push("/lapor")}>
          <View style={styles.primaryCardIcon}>
            <Ionicons name="warning" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.primaryCardTitle}>Lapor Bencana</Text>
            <Text style={styles.primaryCardDesc}>Tanpa perlu akun — kirim titik lokasi, foto, dan kondisi lapangan sekarang.</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable style={styles.secondaryCard} onPress={() => router.push("/login")}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.secondaryCardTitle}>Masuk</Text>
            <Text style={styles.secondaryCardDesc}>Untuk relawan, donatur, atau pelapor dengan akun.</Text>
          </View>
          <Text style={styles.chevronMuted}>›</Text>
        </Pressable>

        <Pressable style={styles.secondaryCard} onPress={() => router.push("/register")}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.secondaryCardTitle}>Daftar Relawan / Donatur</Text>
            <Text style={styles.secondaryCardDesc}>Buat akun singkat untuk menjadi relawan atau berdonasi.</Text>
          </View>
          <Text style={styles.chevronMuted}>›</Text>
        </Pressable>

        <View style={styles.footNote}>
          <Text style={styles.footNoteText}>
            Belum punya akun? Laporan darurat tetap bisa dikirim tanpa mendaftar. Darurat 24 jam: <Text style={styles.mono}>112</Text>.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, paddingHorizontal: spacing.lg, gap: spacing.sm },
  title: { fontSize: 24, fontFamily: fonts.sansExtraBold, color: colors.text, textAlign: "center", letterSpacing: -0.4 },
  subtitle: { fontSize: 14, fontFamily: fonts.sans, color: colors.text2, textAlign: "center", marginTop: spacing.xs, marginBottom: spacing.lg },
  sectionLabel: { fontFamily: fonts.sansExtraBold, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, color: colors.text3, marginBottom: spacing.xs },
  primaryCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm,
  },
  primaryCardIcon: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  primaryCardTitle: { fontFamily: fonts.sansExtraBold, fontSize: 17, color: colors.primaryInk },
  primaryCardDesc: { fontFamily: fonts.sans, fontSize: 13, color: colors.primaryInk, opacity: 0.9, lineHeight: 18 },
  secondaryCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm,
  },
  secondaryCardTitle: { fontFamily: fonts.sansExtraBold, fontSize: 16, color: colors.text },
  secondaryCardDesc: { fontFamily: fonts.sans, fontSize: 13, color: colors.text2, lineHeight: 18 },
  chevron: { fontSize: 24, color: colors.primaryInk, opacity: 0.85 },
  chevronMuted: { fontSize: 24, color: colors.text3 },
  footNote: { marginTop: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface2, padding: spacing.md },
  footNoteText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.text2, lineHeight: 18 },
  mono: { fontFamily: fonts.mono, color: colors.text },
});
