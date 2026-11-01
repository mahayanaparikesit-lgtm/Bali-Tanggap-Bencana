import { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { Laporan } from "@workspace/api-zod";
import { apiFetch, ApiError } from "@/lib/api";
import { FlowHeader } from "@/components/donasi/FlowHeader";
import { BottomBar } from "@/components/donasi/BottomBar";
import { useDonationFlow } from "@/context/DonationFlowContext";
import { colors, fonts, radius, spacing } from "@/lib/theme";

type Posko = { nama: string; alamat: string };
type BencanaAktif = Laporan & { posko: Posko[] };

export default function RingkasanBarang() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const locationId = Number(id);
  const { state } = useDonationFlow();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { data: laporan } = useQuery({
    queryKey: ["laporan", locationId],
    queryFn: () => apiFetch<Laporan>(`/laporan/${locationId}`),
    enabled: !!locationId,
  });
  const { data: aktifList } = useQuery({
    queryKey: ["donatur-bencana-aktif"],
    queryFn: () => apiFetch<BencanaAktif[]>("/donatur/bencana-aktif"),
  });
  const posko = aktifList?.find(l => l.id === locationId)?.posko?.[0];

  const handleConfirm = async () => {
    setError("");
    setSubmitting(true);
    try {
      // Backend menyimpan satu jenis barang per baris donasi — donasi barang
      // dengan beberapa item dikirim sebagai beberapa POST /donasi berurutan.
      let lastId = 0;
      for (const item of state.items) {
        const row = await apiFetch<{ id: number }>("/donasi", {
          method: "POST",
          body: JSON.stringify({
            laporan_id: locationId,
            jenis: "barang",
            nama_barang: item.namaItem,
            jumlah_barang: item.jumlah,
            nama_donatur: state.donorName.trim() || "Anonim",
            tampilkan_nama: !state.anonymous,
            // Progres kebutuhan baru bertambah setelah admin menerima donasi ini.
            kebutuhan_id: item.kebutuhanId,
            pesan: state.note || null,
          }),
        });
        lastId = row.id;
      }
      router.replace({
        pathname: "/donatur/sukses",
        params: {
          donasiId: String(lastId),
          locationId: String(locationId),
          jenis: "barang",
          itemCount: String(state.items.length),
          judul: laporan?.judul ?? "",
          lokasi: laporan?.lokasi ?? "",
        },
      } as any);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal mengirim donasi. Periksa koneksi Anda.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.flex}>
      <FlowHeader title="Ringkasan donasi" />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <View style={styles.rowCol}>
            <Text style={styles.eyebrow}>Lokasi tujuan</Text>
            <Text style={styles.rowColValue}>{laporan ? `${laporan.judul} — ${laporan.lokasi}` : "—"}</Text>
          </View>
          {state.items.map((item, i) => (
            <View key={item.namaItem} style={styles.row}>
              <Text style={styles.rowLabel}>{item.namaItem}</Text>
              <Text style={styles.rowValueMono}>{item.jumlah}</Text>
            </View>
          ))}
          <View style={styles.rowCol}>
            <Text style={styles.eyebrow}>Metode penyerahan</Text>
            {state.handoverMethod === "antar" ? (
              <>
                <Text style={styles.rowColValue}>Antar sendiri — {posko?.nama ?? "Posko"}</Text>
                {posko && <Text style={styles.rowColValueMuted}>{posko.alamat}</Text>}
              </>
            ) : (
              <>
                <Text style={styles.rowColValue}>Dijemput relawan</Text>
                <Text style={styles.rowColValueMuted}>{state.pickupAddress}</Text>
              </>
            )}
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>Nama donatur</Text>
            <Text style={styles.rowValue}>{state.donorName}</Text>
          </View>
        </View>
        <Text style={styles.footnote}>Petugas posko mencatat serah terima dan mengunggah buktinya ke halaman transparansi.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <BottomBar primaryLabel="Konfirmasi Donasi Barang" onPrimary={handleConfirm} loading={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.md, gap: spacing.md },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden" },
  row: { paddingHorizontal: 15, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", gap: 10 },
  rowCol: { paddingHorizontal: 15, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 4 },
  eyebrow: { fontSize: 12, fontFamily: fonts.sansExtraBold, textTransform: "uppercase", letterSpacing: 0.5, color: colors.text3 },
  rowLabel: { flex: 1, fontSize: 14.5, color: colors.text2, fontFamily: fonts.sans },
  rowValue: { fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text },
  rowValueMono: { fontFamily: fonts.mono, fontSize: 15, fontWeight: "600", color: colors.text },
  rowColValue: { fontSize: 15.5, fontFamily: fonts.sansBold, color: colors.text, lineHeight: 21 },
  rowColValueMuted: { fontSize: 13, color: colors.text2, lineHeight: 19, fontFamily: fonts.sans },
  footnote: { fontSize: 13, color: colors.text3, lineHeight: 19, fontFamily: fonts.sans },
  error: { fontSize: 13, color: "#B81F14", fontFamily: fonts.sans },
});
