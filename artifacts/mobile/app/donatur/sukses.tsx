import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { BottomBar } from "@/components/donasi/BottomBar";
import { colors, fonts, radius, spacing, statusTokens } from "@/lib/theme";
import { formatRupiah } from "@/lib/format";

export default function DonasiSukses() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { donasiId, locationId, jenis, amount, itemCount, judul, lokasi } = useLocalSearchParams<{
    donasiId: string; locationId: string; jenis: "uang" | "barang"; amount?: string; itemCount?: string; judul: string; lokasi: string;
  }>();

  const handleLihatBukti = () => {
    // Belum ada layar "bukti donasi" tersendiri — arahkan ke detail lokasi yang
    // datanya (dana terkumpul / kebutuhan terpenuhi) sudah ikut ter-update.
    queryClient.invalidateQueries({ queryKey: ["donatur-bencana-aktif"] });
    queryClient.invalidateQueries({ queryKey: ["laporan", Number(locationId)] });
    router.replace(`/donatur/lokasi/${locationId}` as any);
  };

  const handleBackHome = () => {
    router.replace("/donatur");
  };

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={[styles.body, { paddingTop: insets.top + 96 }]}>
        <View style={styles.checkTile}>
          <Ionicons name="checkmark-circle" size={36} color={statusTokens.done.fg} />
        </View>
        <View style={{ gap: 9 }}>
          <Text style={styles.title}>Donasi berhasil</Text>
          <Text style={styles.desc}>
            Terima kasih. Donasi Anda langsung masuk ke kas bantuan {lokasi} dan akan tampil di halaman transparansi.
          </Text>
        </View>
        <View style={styles.card}>
          {jenis === "uang" ? (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Nominal</Text>
              <Text style={[styles.rowValueMono, { color: colors.primary, fontSize: 17 }]}>{formatRupiah(Number(amount ?? 0))}</Text>
            </View>
          ) : (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Jenis barang</Text>
              <Text style={styles.rowValue}>{itemCount} jenis</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tujuan</Text>
            <Text style={[styles.rowValue, { textAlign: "right" }]}>{judul}{"\n"}{lokasi}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>No. donasi</Text>
            <Text style={styles.rowValueMono}>DON-{donasiId}</Text>
          </View>
        </View>
      </ScrollView>
      <BottomBar
        primaryLabel="Lihat Bukti Donasi"
        onPrimary={handleLihatBukti}
        secondaryLabel="Kembali ke Beranda"
        onSecondary={handleBackHome}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: 20, paddingBottom: spacing.xl, gap: 20 },
  checkTile: {
    width: 64, height: 64, borderRadius: 18, backgroundColor: statusTokens.done.bg,
    borderWidth: 1, borderColor: statusTokens.done.br, alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 27, fontFamily: fonts.sansExtraBold, color: colors.text, letterSpacing: -0.5, lineHeight: 32 },
  desc: { fontSize: 15, color: colors.text2, lineHeight: 22, fontFamily: fonts.sans },
  card: { width: "100%", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden" },
  row: { paddingHorizontal: 15, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", gap: 10 },
  rowLabel: { flex: 1, fontSize: 14, color: colors.text2, fontFamily: fonts.sans },
  rowValue: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.text },
  rowValueMono: { fontFamily: fonts.mono, fontSize: 15, fontWeight: "600", color: colors.text },
});
