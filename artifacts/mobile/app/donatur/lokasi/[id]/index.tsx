import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { Laporan, Kebutuhan } from "@workspace/api-zod";
import { apiFetch } from "@/lib/api";
import { PhotoPlaceholder } from "@/components/donasi/PhotoPlaceholder";
import { BottomBar } from "@/components/donasi/BottomBar";
import { colors, fonts, radius, spacing } from "@/lib/theme";
import { formatRupiah } from "@/lib/format";

type BencanaAktif = Laporan & { total_dana_terkumpul: number };

export default function DetailLokasi() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const locationId = Number(id);
  const insets = useSafeAreaInsets();

  const { data: laporan, isLoading } = useQuery({
    queryKey: ["laporan", locationId],
    queryFn: () => apiFetch<Laporan>(`/laporan/${locationId}`),
    enabled: !!locationId,
  });

  const { data: kebutuhan } = useQuery({
    queryKey: ["laporan", locationId, "kebutuhan"],
    queryFn: () => apiFetch<Kebutuhan[]>(`/laporan/${locationId}/kebutuhan`),
    enabled: !!locationId,
  });

  const { data: aktifList } = useQuery({
    queryKey: ["donatur-bencana-aktif"],
    queryFn: () => apiFetch<BencanaAktif[]>("/donatur/bencana-aktif"),
  });
  const terkumpul = aktifList?.find(l => l.id === locationId)?.total_dana_terkumpul ?? 0;
  // target_dana ada di kolom DB tapi hilang dari tipe Laporan yang di-generate
  // (drift pre-existing di @workspace/api-zod, sama seperti di web — bukan bug baru).
  const target = (laporan as (typeof laporan & { target_dana?: number | null }) | undefined)?.target_dana ?? null;
  const pct = target && target > 0 ? Math.min(100, Math.round((terkumpul / target) * 100)) : 0;

  const photoCount = Math.max(1, laporan?.foto_urls?.length ?? 0);

  if (isLoading || !laporan) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={styles.photoWrap}>
          <PhotoPlaceholder caption={`FOTO 1 — ${laporan.jenis_bencana} ${laporan.lokasi}`} style={StyleSheet.absoluteFill} />
          <Pressable style={[styles.backBtn, { top: insets.top + 12 }]} onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.backChevron}>‹</Text>
          </Pressable>
          {photoCount > 1 && (
            <View style={styles.dots}>
              {Array.from({ length: Math.min(photoCount, 5) }).map((_, i) => (
                <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
              ))}
            </View>
          )}
          <View style={styles.photoCounter}>
            <Text style={styles.photoCounterText}>1/{photoCount} · geser</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={{ gap: 8 }}>
            <Text style={styles.metaText}>{laporan.lokasi}</Text>
            <Text style={styles.title}>{laporan.judul}</Text>
            <Text style={styles.desc}>{laporan.deskripsi}</Text>
          </View>

          {target ? (
            <View style={styles.fundCard}>
              <View style={styles.fundRow}>
                <Text style={styles.fundAmount}>{formatRupiah(terkumpul)}</Text>
                <Text style={styles.fundTarget}>dari target {formatRupiah(target)}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.fundNote}>{pct}% terkumpul</Text>
            </View>
          ) : null}

          <View style={styles.needsCard}>
            <Text style={styles.needsHeader}>Rincian kebutuhan</Text>
            {kebutuhan && kebutuhan.length > 0 ? (
              kebutuhan.map((k, i) => (
                <View key={k.id} style={[styles.needsRow, i === kebutuhan.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.needsName}>{k.nama_item}</Text>
                  <Text style={styles.needsCount}>{k.jumlah_terpenuhi} / {k.jumlah_dibutuhkan}</Text>
                </View>
              ))
            ) : (
              <View style={styles.needsRow}>
                <Text style={styles.needsName}>Kebutuhan sedang didata</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <BottomBar
        primaryLabel="Donasi Sekarang"
        onPrimary={() => router.push(`/donatur/lokasi/${locationId}/jenis` as any)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  photoWrap: { height: 260, position: "relative" },
  backBtn: {
    position: "absolute", left: 16, width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  backChevron: { fontSize: 20, color: colors.text },
  dots: { position: "absolute", bottom: 14, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.borderStrong },
  dotActive: { backgroundColor: colors.primary },
  photoCounter: {
    position: "absolute", bottom: 12, right: 14, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  photoCounterText: { fontFamily: fonts.mono, fontSize: 11, color: colors.text2 },
  content: { padding: 16, gap: 16 },
  metaText: { fontSize: 13, color: colors.text2, fontFamily: fonts.sans },
  title: { fontSize: 23, fontFamily: fonts.sansExtraBold, color: colors.text, letterSpacing: -0.4, lineHeight: 28 },
  desc: { fontSize: 14.5, color: colors.text2, lineHeight: 22, fontFamily: fonts.sans },
  fundCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 15, gap: 11 },
  fundRow: { flexDirection: "row", alignItems: "baseline", gap: 8, flexWrap: "wrap" },
  fundAmount: { fontFamily: fonts.mono, fontSize: 20, fontWeight: "600", color: colors.primary },
  fundTarget: { fontSize: 13, color: colors.text2, fontFamily: fonts.sans },
  progressTrack: { height: 9, borderRadius: 5, backgroundColor: colors.surface2, overflow: "hidden" },
  progressFill: { height: 9, backgroundColor: colors.primary },
  fundNote: { fontSize: 12.5, color: colors.text3, fontFamily: fonts.sans },
  needsCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden" },
  needsHeader: {
    padding: 15, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
    fontSize: 12, fontFamily: fonts.sansExtraBold, textTransform: "uppercase", letterSpacing: 0.5, color: colors.text3,
  },
  needsRow: {
    paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  needsName: { flex: 1, fontSize: 14, fontFamily: fonts.sansBold, color: colors.text },
  needsCount: { fontFamily: fonts.mono, fontSize: 13, color: colors.text2 },
});
