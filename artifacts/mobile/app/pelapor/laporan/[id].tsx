import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Linking, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import type { Laporan, Kebutuhan, Penugasan } from "@workspace/api-zod";
import { apiFetch } from "@/lib/api";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { colors, fonts, spacing, radius, statusTokens } from "@/lib/theme";

type LaporanWithPenugasan = Laporan & { penugasan: Penugasan[] };

export default function LaporanDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const laporanId = Number(id);

  const { data: laporan, isLoading } = useQuery({
    queryKey: ["laporan", laporanId],
    queryFn: () => apiFetch<LaporanWithPenugasan>(`/laporan/${laporanId}`),
    enabled: !!laporanId,
  });

  const { data: kebutuhan } = useQuery({
    queryKey: ["laporan", laporanId, "kebutuhan"],
    queryFn: () => apiFetch<Kebutuhan[]>(`/laporan/${laporanId}/kebutuhan`),
    enabled: !!laporanId,
  });

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Detail Laporan" showBack />
      {isLoading || !laporan ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <StatusBadge status={laporan.status} />
          <Text style={styles.title}>{laporan.judul}</Text>
          <View style={styles.metaRow}>
            <Feather name="calendar" size={12} color={colors.text2} />
            <Text style={styles.metaText}>
              {new Date(laporan.created_at).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </Text>
          </View>

          <Section title="Informasi Kejadian">
            <InfoRow icon="map-pin" label="Lokasi" value={laporan.lokasi} />
            {laporan.lokasi_pengungsian ? (
              <InfoRow icon="home" label="Lokasi Pengungsian" value={laporan.lokasi_pengungsian} accent />
            ) : null}
            {laporan.jumlah_terdampak ? (
              <InfoRow icon="users" label="Jumlah Terdampak" value={`${laporan.jumlah_terdampak.toLocaleString("id-ID")} jiwa`} />
            ) : null}
            <View style={styles.divider} />
            <Text style={styles.fieldLabel}>Deskripsi</Text>
            <Text style={styles.fieldValue}>{laporan.deskripsi}</Text>
            {laporan.catatan_admin ? (
              <>
                <View style={styles.divider} />
                <Text style={[styles.fieldLabel, { color: colors.primary }]}>Catatan Admin</Text>
                <Text style={styles.fieldValue}>{laporan.catatan_admin}</Text>
              </>
            ) : null}
          </Section>

          {/* Data pelapor hanya dikirim API ke admin (lihat GET /laporan/:id). */}
          {laporan.nama_pelapor ? (
            <Section title="Pelapor">
              <InfoRow icon="user" label="" value={`${laporan.nama_pelapor}${laporan.jabatan_pelapor ? ` — ${laporan.jabatan_pelapor}` : ""}`} bare />
              {laporan.kontak_pelapor ? <InfoRow icon="phone" label="" value={laporan.kontak_pelapor} bare /> : null}
            </Section>
          ) : null}

          {laporan.foto_urls && laporan.foto_urls.length > 0 && (
            <Section title="Dokumentasi">
              {laporan.foto_urls.map((url, i) => (
                <Pressable key={i} onPress={() => Linking.openURL(url)} style={styles.photoLink}>
                  <Feather name="image" size={14} color={colors.primary} />
                  <Text style={styles.photoLinkText} numberOfLines={1}>Foto {i + 1}</Text>
                </Pressable>
              ))}
            </Section>
          )}

          <Section title="Kebutuhan Bantuan">
            {kebutuhan && kebutuhan.length > 0 ? (
              kebutuhan.map(k => {
                const pct = k.jumlah_dibutuhkan > 0 ? Math.min(100, Math.round((k.jumlah_terpenuhi / k.jumlah_dibutuhkan) * 100)) : 0;
                return (
                  <View key={k.id} style={styles.kebutuhanItem}>
                    <View style={styles.kebutuhanTop}>
                      <Text style={styles.kebutuhanName}>{k.nama_item}</Text>
                      <Text style={styles.kebutuhanCount}>{k.jumlah_terpenuhi}/{k.jumlah_dibutuhkan} {k.satuan}</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>Belum ada data kebutuhan.</Text>
            )}
          </Section>

          {laporan.penugasan && laporan.penugasan.length > 0 && (
            <Section title="Relawan Bertugas">
              {laporan.penugasan.map(p => (
                <View key={p.id} style={styles.penugasanItem}>
                  <View style={styles.penugasanTop}>
                    <Text style={styles.kebutuhanName}>{p.nama_relawan}</Text>
                    <StatusBadge status={p.status} />
                  </View>
                  <Text style={styles.fieldValue}>{p.detail_tugas}</Text>
                </View>
              ))}
            </Section>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ icon, label, value, accent, bare }: { icon: keyof typeof Feather.glyphMap; label: string; value: string; accent?: boolean; bare?: boolean }) {
  return (
    <View style={[styles.infoRow, bare && { marginBottom: spacing.xs }]}>
      <Feather name={icon} size={14} color={accent ? statusTokens.ver.fg : colors.text2} style={{ marginTop: 2 }} />
      <View style={styles.infoRowText}>
        {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: { fontSize: 22, fontFamily: fonts.sansExtraBold, color: colors.text, marginTop: spacing.sm, letterSpacing: -0.3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, marginBottom: spacing.lg },
  metaText: { fontSize: 12, fontFamily: fonts.mono, color: colors.text2 },
  section: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 14, fontFamily: fonts.sansExtraBold, color: colors.text, marginBottom: spacing.sm },
  infoRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  infoRowText: { flex: 1 },
  fieldLabel: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.text, marginBottom: 2 },
  fieldValue: { fontSize: 13, fontFamily: fonts.sans, color: colors.text2, lineHeight: 19 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  photoLink: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.xs },
  photoLinkText: { color: colors.primary, fontFamily: fonts.sansBold, fontSize: 13, textDecorationLine: "underline" },
  emptyText: { fontSize: 13, fontFamily: fonts.sans, color: colors.text2 },
  kebutuhanItem: { marginBottom: spacing.sm },
  kebutuhanTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  kebutuhanName: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.text },
  kebutuhanCount: { fontSize: 12, fontFamily: fonts.mono, color: colors.text2 },
  progressTrack: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: statusTokens.ver.fg },
  penugasanItem: { marginBottom: spacing.sm },
  penugasanTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
});
