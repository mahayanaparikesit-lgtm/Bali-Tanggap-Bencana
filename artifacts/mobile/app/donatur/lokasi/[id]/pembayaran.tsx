import { View, Text, Pressable, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { FlowHeader } from "@/components/donasi/FlowHeader";
import { BottomBar } from "@/components/donasi/BottomBar";
import { useDonationFlow } from "@/context/DonationFlowContext";
import { colors, fonts, radius, spacing } from "@/lib/theme";
import { formatRupiah } from "@/lib/format";

const METHODS = [
  { key: "transfer" as const, label: "Transfer bank", desc: "Virtual account, verifikasi otomatis" },
  { key: "ewallet" as const, label: "E-wallet", desc: "Saldo dompet digital" },
  { key: "qris" as const, label: "QRIS", desc: "Pindai kode di aplikasi bank apa pun" },
];

export default function MetodePembayaran() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const locationId = Number(id);
  const { state, update } = useDonationFlow();

  const select = (key: typeof METHODS[number]["key"]) => update({ paymentMethod: key });

  const handleContinue = () => {
    if (!state.paymentMethod) return;
    router.push(`/donatur/lokasi/${locationId}/ringkasan-uang` as any);
  };

  return (
    <View style={styles.flex}>
      <FlowHeader title="Metode pembayaran" />
      <View style={styles.body}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total donasi</Text>
          <Text style={styles.totalValue}>{formatRupiah(state.amount ?? 0)}</Text>
        </View>

        <View style={styles.list}>
          {METHODS.map((m, i) => {
            const selected = state.paymentMethod === m.key;
            return (
              <Pressable
                key={m.key}
                style={[styles.row, i === METHODS.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => select(m.key)}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{m.label}</Text>
                  <Text style={styles.rowDesc}>{m.desc}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <BottomBar primaryLabel="Bayar Sekarang" onPrimary={handleContinue} disabled={!state.paymentMethod} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.md, gap: spacing.md },
  totalCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: 15, flexDirection: "row", alignItems: "center", gap: 10,
  },
  totalLabel: { flex: 1, fontSize: 14, color: colors.text2, fontFamily: fonts.sans },
  totalValue: { fontFamily: fonts.mono, fontSize: 19, fontWeight: "600", color: colors.primary },
  list: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden" },
  row: {
    minHeight: 64, paddingHorizontal: 15, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
    flexDirection: "row", alignItems: "center", gap: 13,
  },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.borderStrong,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.primary },
  rowTitle: { fontSize: 15.5, fontFamily: fonts.sansBold, color: colors.text },
  rowDesc: { fontSize: 12.5, color: colors.text3, fontFamily: fonts.sans, marginTop: 2 },
});
