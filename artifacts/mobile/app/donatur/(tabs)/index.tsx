import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { useQuery } from "@tanstack/react-query";
import type { Laporan, Kebutuhan } from "@workspace/api-zod";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/StatusBadge";
import { PhotoPlaceholder } from "@/components/donasi/PhotoPlaceholder";
import { colors, fonts, radius, spacing } from "@/lib/theme";
import { formatRupiahShort } from "@/lib/format";

type BencanaAktif = Laporan & { kebutuhan: Kebutuhan[]; koordinator: string | null; total_dana_terkumpul: number };

function PinIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12">
      <Path d="M6 11.2C6 11.2 10 7.6 10 4.9A4 4 0 0 0 2 4.9C2 7.6 6 11.2 6 11.2Z" fill="none" stroke={colors.primary} strokeWidth={1.5} />
      <Circle cx={6} cy={4.9} r={1.3} fill={colors.primary} />
    </Svg>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

function initials(nama?: string): string {
  if (!nama) return "?";
  const parts = nama.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || nama[0].toUpperCase();
}

export default function DonaturHome() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["donatur-bencana-aktif"],
    queryFn: () => apiFetch<BencanaAktif[]>("/donatur/bencana-aktif"),
  });

  const lokasiCount = data?.length ?? 0;
  const terkumpul = (data ?? []).reduce((s, l) => s + (l.total_dana_terkumpul || 0), 0);

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greetingText}>{greeting()}, {user?.nama?.split(" ")[0] ?? "Donatur"}</Text>
          <Text style={styles.headerTitle}>Bantu hari ini</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user?.nama)}</Text>
        </View>
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <View style={styles.tilesRow}>
              <View style={styles.tile}>
                <Text style={styles.tileLabel}>Lokasi butuh bantuan</Text>
                <Text style={styles.tileValuePrimary}>{lokasiCount}</Text>
              </View>
              <View style={styles.tile}>
                <Text style={styles.tileLabel}>Total terkumpul</Text>
                <Text style={styles.tileValue}>{formatRupiahShort(terkumpul)}</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>Lokasi terdampak</Text>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : (
            <Text style={styles.emptyText}>Belum ada lokasi yang membutuhkan bantuan saat ini.</Text>
          )
        }
        renderItem={({ item }) => {
          const needsLine = item.kebutuhan.length > 0
            ? `Butuh: ${item.kebutuhan.slice(0, 3).map(k => k.nama_item).join(", ")}`
            : "Kebutuhan sedang didata";
          return (
            <Pressable style={styles.card} onPress={() => router.push(`/donatur/lokasi/${item.id}` as any)}>
              <View style={styles.cardPhoto}>
                <PhotoPlaceholder caption={`FOTO — ${item.jenis_bencana} ${item.lokasi}`} style={StyleSheet.absoluteFill} />
                <View style={styles.cardBadge}>
                  <StatusBadge status={item.status} size="sm" />
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardMeta}>
                  <PinIcon />
                  <Text style={styles.cardMetaText}>{item.lokasi}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.judul}</Text>
                <Text style={styles.cardNeeds} numberOfLines={2}>{needsLine}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greetingText: { fontSize: 12.5, color: colors.text3, fontFamily: fonts.sansSemiBold },
  headerTitle: { fontSize: 20, color: colors.text, fontFamily: fonts.sansExtraBold, letterSpacing: -0.4 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 13, fontFamily: fonts.sansExtraBold, color: colors.text2 },
  list: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  tilesRow: { flexDirection: "row", gap: 10, marginBottom: spacing.md },
  tile: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: 14, gap: 5,
  },
  tileLabel: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, letterSpacing: 0.5, textTransform: "uppercase", color: colors.text3 },
  tileValuePrimary: { fontFamily: fonts.mono, fontSize: 26, fontWeight: "600", lineHeight: 28, color: colors.primary },
  tileValue: { fontFamily: fonts.mono, fontSize: 22, fontWeight: "600", lineHeight: 25, color: colors.text },
  sectionTitle: { fontSize: 15, fontFamily: fonts.sansExtraBold, color: colors.text, marginBottom: spacing.sm },
  emptyText: { fontSize: 13.5, color: colors.text3, textAlign: "center", marginTop: spacing.lg, fontFamily: fonts.sans },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, overflow: "hidden",
  },
  cardPhoto: { aspectRatio: 16 / 9, position: "relative" },
  cardBadge: { position: "absolute", top: 12, left: 12 },
  cardBody: { padding: 14, gap: 8 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 7 },
  cardMetaText: { fontSize: 13, color: colors.text2, fontFamily: fonts.sans },
  cardTitle: { fontSize: 17, fontFamily: fonts.sansExtraBold, color: colors.text, lineHeight: 21 },
  cardNeeds: { fontSize: 13.5, color: colors.text2, lineHeight: 19, fontFamily: fonts.sans },
});
