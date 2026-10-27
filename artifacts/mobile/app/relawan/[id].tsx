import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Linking, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import type { Relawan, Penugasan } from "@workspace/api-zod";
import { apiFetch } from "@/lib/api";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { colors, fonts, spacing, radius, statusTokens } from "@/lib/theme";

export default function RelawanDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const relawanId = Number(id);

  const { data: relawan, isLoading } = useQuery({
    queryKey: ["relawan", relawanId],
    queryFn: () => apiFetch<Relawan>(`/relawan/${relawanId}`),
    enabled: !!relawanId,
  });

  const { data: penugasan } = useQuery({
    queryKey: ["penugasan", { relawan_id: relawanId }],
    queryFn: () => apiFetch<Penugasan[]>(`/penugasan?relawan_id=${relawanId}`),
    enabled: !!relawanId,
  });

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Profil Relawan" showBack />
      {isLoading || !relawan ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.top}>
            <Text style={styles.title}>{relawan.nama}</Text>
            <StatusBadge status={relawan.status_verifikasi} />
          </View>
          <Text style={styles.metaText}>Terdaftar: {new Date(relawan.created_at).toLocaleDateString("id-ID")}</Text>

          {relawan.status_verifikasi === "menunggu" && (
            <View style={[styles.notice, { backgroundColor: statusTokens.wait.bg, borderColor: statusTokens.wait.br }]}>
              <Feather name="clock" size={14} color={statusTokens.wait.fg} />
              <Text style={[styles.noticeText, { color: statusTokens.wait.fg }]}>Pendaftaran Anda sedang diverifikasi oleh admin. Harap menunggu konfirmasi.</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Pribadi</Text>
            <InfoRow icon="user" value={relawan.nama} />
            <InfoRow icon="credit-card" value={`NIK: ${relawan.nik}`} />
            <InfoRow icon="phone" value={relawan.no_hp} />
            {relawan.email ? <InfoRow icon="mail" value={relawan.email} /> : null}
            <InfoRow icon="map-pin" value={relawan.alamat} />
          </View>

          {relawan.keahlian && relawan.keahlian.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Keahlian</Text>
              <View style={styles.tagRow}>
                {relawan.keahlian.map(k => (
                  <View key={k} style={styles.tag}>
                    <Text style={styles.tagText}>{k}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {relawan.catatan_verifikasi ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Catatan Verifikasi</Text>
              <Text style={styles.fieldValue}>{relawan.catatan_verifikasi}</Text>
            </View>
          ) : null}

          {penugasan && penugasan.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Penugasan</Text>
              {penugasan.map(p => (
                <View key={p.id} style={styles.penugasanItem}>
                  <View style={styles.penugasanTop}>
                    <Text style={styles.penugasanTitle}>{p.detail_tugas}</Text>
                    <StatusBadge status={p.status} />
                  </View>
                  <View style={styles.infoRow}>
                    <Feather name="map-pin" size={12} color={colors.text2} />
                    <Text style={styles.metaTextSmall}>{p.lokasi_tugas}</Text>
                  </View>
                  {p.link_grup ? (
                    <Pressable onPress={() => Linking.openURL(p.link_grup!)} style={styles.groupLink}>
                      <Feather name="external-link" size={12} color={colors.primary} />
                      <Text style={styles.groupLinkText}>Bergabung ke Grup</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function InfoRow({ icon, value }: { icon: keyof typeof Feather.glyphMap; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={14} color={colors.text2} />
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { padding: spacing.lg, paddingBottom: spacing.xl },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20, fontFamily: fonts.sansExtraBold, color: colors.text },
  metaText: { fontSize: 12, fontFamily: fonts.mono, color: colors.text2, marginTop: 2, marginBottom: spacing.md },
  notice: {
    flexDirection: "row", gap: spacing.sm, borderWidth: 1, borderRadius: radius.sm,
    padding: spacing.md, marginBottom: spacing.md,
  },
  noticeText: { flex: 1, fontSize: 12, fontFamily: fonts.sans },
  section: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 14, fontFamily: fonts.sansExtraBold, color: colors.text, marginBottom: spacing.sm },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  fieldValue: { fontSize: 13, fontFamily: fonts.sans, color: colors.text, flexShrink: 1 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  tag: { backgroundColor: colors.bg, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: colors.border },
  tagText: { fontSize: 12, fontFamily: fonts.sans, color: colors.text },
  penugasanItem: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.sm },
  penugasanTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  penugasanTitle: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.text, flexShrink: 1 },
  metaTextSmall: { fontSize: 11, fontFamily: fonts.sans, color: colors.text2 },
  groupLink: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  groupLinkText: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.primary, textDecorationLine: "underline" },
});
