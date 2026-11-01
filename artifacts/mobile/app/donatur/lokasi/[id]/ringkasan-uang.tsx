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
import { formatRupiah } from "@/lib/format";

const PAYMENT_LABELS: Record<string, string> = { transfer: "Transfer bank", ewallet: "E-wallet", qris: "QRIS" };

export default function RingkasanUang() {
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

  const handleConfirm = async () => {
    setError("");
    setSubmitting(true);
    try {
      const row = await apiFetch<{ id: number }>("/donasi", {
        method: "POST",
        body: JSON.stringify({
          laporan_id: locationId,
          jenis: "dana",
          jumlah_dana: state.amount,
          // Nama asli tetap disimpan (untuk admin); tampil di publik hanya bila tidak anonim.
          nama_donatur: state.donorName.trim() || "Anonim",
          tampilkan_nama: !state.anonymous,
          pesan: state.note || null,
        }),
      });
      router.replace({
        pathname: "/donatur/sukses",
        params: { donasiId: String(row.id), locationId: String(locationId), jenis: "uang", amount: String(state.amount ?? 0), judul: laporan?.judul ?? "", lokasi: laporan?.lokasi ?? "" },
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
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Nominal</Text>
            <Text style={styles.rowValueMono}>{formatRupiah(state.amount ?? 0)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Metode bayar</Text>
            <Text style={styles.rowValue}>{state.paymentMethod ? PAYMENT_LABELS[state.paymentMethod] : "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Nama donatur</Text>
            <Text style={styles.rowValue}>{state.anonymous ? "Anonim" : state.donorName}</Text>
          </View>
          {state.note ? (
            <View style={[styles.rowCol, { borderBottomWidth: 0 }]}>
              <Text style={styles.eyebrow}>Pesan</Text>
              <Text style={styles.rowColValueMuted}>{state.note}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.footnote}>Donasi tercatat di halaman transparansi publik dalam 1×24 jam.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <BottomBar primaryLabel="Konfirmasi & Bayar" onPrimary={handleConfirm} loading={submitting} />
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
  rowValueMono: { fontFamily: fonts.mono, fontSize: 17, fontWeight: "600", color: colors.primary },
  rowColValue: { fontSize: 15.5, fontFamily: fonts.sansBold, color: colors.text, lineHeight: 21 },
  rowColValueMuted: { fontSize: 14.5, color: colors.text2, lineHeight: 20, fontFamily: fonts.sans },
  footnote: { fontSize: 13, color: colors.text3, lineHeight: 19, fontFamily: fonts.sans },
  error: { fontSize: 13, color: "#B81F14", fontFamily: fonts.sans },
});
