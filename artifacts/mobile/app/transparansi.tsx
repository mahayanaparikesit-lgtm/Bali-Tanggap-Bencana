import { useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { colors, fonts, spacing, radius, statusTokens } from "@/lib/theme";
import { formatRupiah, formatRupiahShort } from "@/lib/format";

type Donasi = { id: number; jenis: string; jumlah_dana: number | null; jumlah_barang: number | null; nama_barang: string | null; nama_donatur: string; created_at: string };
type Kebutuhan = { id: number; nama_item: string; jumlah_dibutuhkan: number; jumlah_terpenuhi: number; satuan: string; keterangan: string | null };
type TransparansiLaporan = {
  id: number; judul: string; jenis_bencana: string; lokasi: string; status: string;
  jumlah_terdampak: number | null; created_at: string;
  kebutuhan: Kebutuhan[]; relawan_bertugas: string[]; donasi: Donasi[];
};

export default function Transparansi() {
  const { data: laporan, isLoading } = useQuery({
    queryKey: ["transparansi-laporan"],
    queryFn: () => apiFetch<TransparansiLaporan[]>("/transparansi/laporan"),
  });

  const totalDampak = (laporan ?? []).reduce((s, l) => s + (l.jumlah_terdampak || 0), 0);
  const totalDonasi = (laporan ?? []).reduce((s, l) => s + l.donasi.length, 0);
  const totalDana = (laporan ?? []).reduce(
    (s, l) => s + l.donasi.filter(d => d.jenis === "dana").reduce((x, d) => x + (d.jumlah_dana ?? 0), 0),
    0
  );

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Transparansi" showBack />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={laporan ?? []}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.statsRow}>
              <StatTile label="Jiwa Terdampak" value={totalDampak.toLocaleString("id-ID")} />
              <StatTile label="Dana Terkumpul" value={formatRupiahShort(totalDana)} />
              <StatTile label="Total Donasi" value={String(totalDonasi)} />
            </View>
          }
          renderItem={({ item }) => <LaporanCard laporan={item} />}
        />
      )}
    </View>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LaporanCard({ laporan }: { laporan: TransparansiLaporan }) {
  const [showKebutuhan, setShowKebutuhan] = useState(false);
  const [showDonasi, setShowDonasi] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <StatusBadge status={laporan.status} />
      </View>
      <Text style={styles.cardTitle}>{laporan.judul}</Text>
      <View style={styles.metaRow}>
        <Feather name="map-pin" size={11} color={colors.text2} />
        <Text style={styles.metaText}>{laporan.lokasi}</Text>
        {laporan.jumlah_terdampak ? (
          <>
            <Feather name="users" size={11} color={colors.text2} style={{ marginLeft: spacing.sm }} />
            <Text style={styles.metaText}>{laporan.jumlah_terdampak} jiwa</Text>
          </>
        ) : null}
      </View>

      {laporan.relawan_bertugas.length > 0 && (
        <View style={styles.tagRow}>
          {laporan.relawan_bertugas.map((nama, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{nama}</Text>
            </View>
          ))}
        </View>
      )}

      {laporan.kebutuhan.length > 0 && (
        <View style={styles.expandSection}>
          <Pressable style={styles.expandHeader} onPress={() => setShowKebutuhan(v => !v)}>
            <Feather name="file-text" size={13} color={colors.primary} />
            <Text style={styles.expandHeaderText}>
              {showKebutuhan ? "Sembunyikan" : "Lihat"} kebutuhan ({laporan.kebutuhan.length})
            </Text>
            <Feather name={showKebutuhan ? "chevron-up" : "chevron-down"} size={14} color={colors.primary} />
          </Pressable>
          {showKebutuhan && laporan.kebutuhan.map(k => {
            const pct = k.jumlah_dibutuhkan > 0 ? Math.min(100, Math.round((k.jumlah_terpenuhi / k.jumlah_dibutuhkan) * 100)) : 0;
            const sisa = Math.max(0, k.jumlah_dibutuhkan - k.jumlah_terpenuhi);
            return (
              <View key={k.id} style={styles.kebutuhanItem}>
                <View style={styles.kebutuhanTop}>
                  <Text style={styles.kebutuhanName}>{k.nama_item}</Text>
                  <View style={[
                    styles.sisaChip,
                    { backgroundColor: sisa === 0 ? statusTokens.done.bg : statusTokens.wait.bg, borderColor: sisa === 0 ? statusTokens.done.br : statusTokens.wait.br },
                  ]}>
                    <Text style={[styles.sisaChipText, { color: sisa === 0 ? statusTokens.done.fg : statusTokens.wait.fg }]}>
                      {sisa === 0 ? "Terpenuhi" : `Sisa ${sisa} ${k.satuan}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct}%` }, sisa === 0 && { backgroundColor: statusTokens.done.fg }]} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {laporan.donasi.length > 0 && (
        <View style={styles.expandSection}>
          <Pressable style={styles.expandHeader} onPress={() => setShowDonasi(v => !v)}>
            <Feather name="heart" size={13} color={colors.accentInk} />
            <Text style={[styles.expandHeaderText, { color: colors.accentInk }]}>
              {showDonasi ? "Sembunyikan" : "Lihat"} donasi ({laporan.donasi.length})
            </Text>
            <Feather name={showDonasi ? "chevron-up" : "chevron-down"} size={14} color={colors.accentInk} />
          </Pressable>
          {showDonasi && laporan.donasi.map(d => (
            <View key={d.id} style={styles.donasiItem}>
              <Feather name={d.jenis === "dana" ? "dollar-sign" : "package"} size={13} color={d.jenis === "dana" ? statusTokens.done.fg : colors.accentInk} />
              <Text style={styles.donasiName} numberOfLines={1}>{d.nama_donatur}</Text>
              <Text style={[styles.donasiValue, { color: d.jenis === "dana" ? statusTokens.done.fg : colors.accentInk }]}>
                {d.jenis === "dana" ? formatRupiah(d.jumlah_dana ?? 0) : `${d.jumlah_barang}× ${d.nama_barang}`}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.footer}>
        Dilaporkan {new Date(laporan.created_at).toLocaleDateString("id-ID")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  statTile: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, alignItems: "center" },
  statValue: { fontSize: 15, fontFamily: fonts.sansExtraBold, color: colors.text },
  statLabel: { fontSize: 10, fontFamily: fonts.sans, color: colors.text2, marginTop: 2, textAlign: "center" },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  cardTop: { flexDirection: "row", marginBottom: 6 },
  cardTitle: { fontSize: 15, fontFamily: fonts.sansBold, color: colors.text, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.sm },
  metaText: { fontSize: 11, fontFamily: fonts.sans, color: colors.text2 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: spacing.sm },
  tag: { backgroundColor: colors.surface2, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  tagText: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.text2 },
  expandSection: { marginBottom: spacing.sm },
  expandHeader: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 },
  expandHeaderText: { fontSize: 12, fontFamily: fonts.sansExtraBold, color: colors.primary },
  kebutuhanItem: { backgroundColor: colors.bg, borderRadius: radius.sm, padding: spacing.sm, marginBottom: 6 },
  kebutuhanTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  kebutuhanName: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.text },
  sisaChip: { borderRadius: radius.sm, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  sisaChipText: { fontSize: 10, fontFamily: fonts.sansBold },
  progressTrack: { height: 5, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 5, backgroundColor: statusTokens.ver.fg },
  donasiItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs, backgroundColor: colors.bg, borderRadius: radius.sm, padding: spacing.sm, marginBottom: 4 },
  donasiName: { flex: 1, fontSize: 12, fontFamily: fonts.sansBold, color: colors.text },
  donasiValue: { fontSize: 12, fontFamily: fonts.sansExtraBold },
  footer: { fontSize: 10, fontFamily: fonts.sans, color: colors.text2, marginTop: 4 },
});
