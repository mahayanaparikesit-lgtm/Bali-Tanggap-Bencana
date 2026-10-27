import { View, Text, Pressable, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import type { Laporan } from "@workspace/api-zod";
import { apiFetch } from "@/lib/api";
import { FlowHeader } from "@/components/donasi/FlowHeader";
import { useDonationFlow } from "@/context/DonationFlowContext";
import { colors, fonts, radius, spacing } from "@/lib/theme";

function UangIcon({ color }: { color: string }) {
  return <Ionicons name="cash-outline" size={24} color={color} />;
}

function BarangIcon({ color }: { color: string }) {
  return <Ionicons name="cube-outline" size={24} color={color} />;
}

export default function PilihJenisDonasi() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const locationId = Number(id);
  const { update } = useDonationFlow();

  const { data: laporan } = useQuery({
    queryKey: ["laporan", locationId],
    queryFn: () => apiFetch<Laporan>(`/laporan/${locationId}`),
    enabled: !!locationId,
  });

  const choose = (type: "uang" | "barang") => {
    update({ locationId, donationType: type });
    router.push(`/donatur/lokasi/${locationId}/${type}` as any);
  };

  return (
    <View style={styles.flex}>
      <FlowHeader title="Jenis donasi" />
      <View style={styles.body}>
        <View style={{ gap: 6 }}>
          <Text style={styles.title}>Mau bantu dengan apa?</Text>
          {laporan && (
            <Text style={styles.subtitle}>
              Untuk <Text style={styles.subtitleBold}>{laporan.judul} — {laporan.lokasi}</Text>
            </Text>
          )}
        </View>

        <Pressable style={[styles.option, styles.optionSelected]} onPress={() => choose("uang")}>
          <View style={[styles.iconTile, { backgroundColor: colors.primarySoft }]}>
            <UangIcon color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={styles.optionTitle}>Donasi Uang</Text>
            <Text style={styles.optionDesc}>Disalurkan sesuai kebutuhan paling mendesak di lokasi.</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable style={styles.option} onPress={() => choose("barang")}>
          <View style={[styles.iconTile, { backgroundColor: colors.surface2 }]}>
            <BarangIcon color={colors.accentInk} />
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={styles.optionTitle}>Donasi Barang</Text>
            <Text style={styles.optionDesc}>Pilih dari daftar kebutuhan lokasi, antar sendiri atau dijemput.</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.md, gap: spacing.md },
  title: { fontSize: 23, fontFamily: fonts.sansExtraBold, color: colors.text, letterSpacing: -0.4, lineHeight: 28 },
  subtitle: { fontSize: 14.5, color: colors.text2, lineHeight: 20, fontFamily: fonts.sans },
  subtitleBold: { color: colors.text, fontFamily: fonts.sansBold },
  option: {
    minHeight: 120, flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong,
    borderRadius: radius.lg, padding: 18,
  },
  optionSelected: { borderWidth: 1.5, borderColor: colors.primary },
  iconTile: { width: 52, height: 52, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  optionTitle: { fontSize: 19, fontFamily: fonts.sansExtraBold, color: colors.text },
  optionDesc: { fontSize: 14, color: colors.text2, lineHeight: 20, fontFamily: fonts.sans },
  chevron: { fontSize: 22, color: colors.text3 },
});
