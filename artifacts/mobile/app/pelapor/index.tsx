import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import type { Laporan } from "@workspace/api-zod";
import { apiFetch } from "@/lib/api";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { colors, fonts, spacing, radius, statusTokens } from "@/lib/theme";

export default function PelaporDashboard() {
  const { data: laporan, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["laporan-saya"],
    queryFn: () => apiFetch<Laporan[]>("/laporan/saya"),
  });

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title="Laporan Bencana"
        action={
          <Pressable onPress={() => router.push("/pelapor/laporan-baru")} style={styles.headerButton} hitSlop={8}>
            <Feather name="plus" size={20} color={colors.primary} />
          </Pressable>
        }
      />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={laporan ?? []}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Belum ada laporan. Buat laporan pertama Anda.</Text>
              <Pressable style={styles.emptyButton} onPress={() => router.push("/pelapor/laporan-baru")}>
                <Text style={styles.emptyButtonText}>Buat Laporan</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/pelapor/laporan/${item.id}` as any)}>
              <View style={styles.cardTop}>
                <StatusBadge status={item.status} />
                {item.jumlah_terdampak ? (
                  <View style={styles.chip}>
                    <Feather name="users" size={11} color={colors.text2} />
                    <Text style={styles.chipText}>{item.jumlah_terdampak} jiwa</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.judul}</Text>
              <View style={styles.cardMeta}>
                <Feather name="map-pin" size={11} color={colors.text2} />
                <Text style={styles.cardMetaText} numberOfLines={1}>{item.lokasi}</Text>
              </View>
              {item.status === "menunggu" && (
                <View style={[styles.hint, { backgroundColor: statusTokens.wait.bg, borderColor: statusTokens.wait.br }]}>
                  <Feather name="clock" size={12} color={statusTokens.wait.fg} />
                  <Text style={[styles.hintText, { color: statusTokens.wait.fg }]}>Menunggu verifikasi admin</Text>
                </View>
              )}
              {item.status === "terverifikasi" && (
                <View style={[styles.hint, { backgroundColor: statusTokens.ver.bg, borderColor: statusTokens.ver.br }]}>
                  <Feather name="check-circle" size={12} color={statusTokens.ver.fg} />
                  <Text style={[styles.hintText, { color: statusTokens.ver.fg }]}>Sudah ditampilkan ke donatur</Text>
                </View>
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  list: { padding: spacing.md, gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  chip: { flexDirection: "row", alignItems: "center", gap: 4 },
  chipText: { fontSize: 11, fontFamily: fonts.sans, color: colors.text2 },
  cardTitle: { fontSize: 15, fontFamily: fonts.sansBold, color: colors.text, marginBottom: 4 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMetaText: { fontSize: 12, fontFamily: fonts.sans, color: colors.text2, flexShrink: 1 },
  hint: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm,
    borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 6,
  },
  hintText: { fontSize: 11, fontFamily: fonts.sansBold, flexShrink: 1 },
  empty: { alignItems: "center", paddingVertical: spacing.xl * 2, paddingHorizontal: spacing.lg },
  emptyText: { color: colors.text2, fontFamily: fonts.sans, fontSize: 14, textAlign: "center", marginBottom: spacing.md },
  emptyButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 12 },
  emptyButtonText: { color: colors.primaryInk, fontFamily: fonts.sansExtraBold, fontSize: 14 },
});
