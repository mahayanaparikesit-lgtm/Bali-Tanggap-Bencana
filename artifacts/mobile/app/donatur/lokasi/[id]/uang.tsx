import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { FlowHeader } from "@/components/donasi/FlowHeader";
import { BottomBar } from "@/components/donasi/BottomBar";
import { useDonationFlow } from "@/context/DonationFlowContext";
import { useAuth } from "@/context/AuthContext";
import { colors, fonts, radius, spacing } from "@/lib/theme";
import { formatRupiah } from "@/lib/format";

const QUICK_AMOUNTS = [50000, 100000, 250000, 500000];

export default function FormDonasiUang() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const locationId = Number(id);
  const { user } = useAuth();
  const { state, update } = useDonationFlow();

  const [amount, setAmount] = useState<number | null>(state.amount);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState(state.donorName || user?.nama || "");
  const [anonymous, setAnonymous] = useState(state.anonymous);
  const [message, setMessage] = useState(state.note);

  const selectQuick = (v: number) => {
    setAmount(v);
    setCustomAmount("");
  };

  const onCustomChange = (text: string) => {
    const digits = text.replace(/\D/g, "");
    setCustomAmount(digits);
    setAmount(digits ? parseInt(digits, 10) : null);
  };

  const canContinue = !!amount && amount > 0 && !!donorName.trim();

  const handleContinue = () => {
    if (!canContinue) return;
    update({ locationId, donationType: "uang", amount, donorName: donorName.trim(), anonymous, note: message });
    router.push(`/donatur/lokasi/${locationId}/pembayaran` as any);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <FlowHeader title="Donasi uang" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 9 }}>
          <Text style={styles.label}>Pilih nominal</Text>
          <View style={styles.grid}>
            {QUICK_AMOUNTS.map(v => {
              const selected = amount === v && !customAmount;
              return (
                <Pressable key={v} style={[styles.amountChip, selected && styles.amountChipSelected]} onPress={() => selectQuick(v)}>
                  <Text style={[styles.amountChipText, selected && styles.amountChipTextSelected]}>{formatRupiah(v)}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.customRow}>
            <Text style={styles.customLabel}>Nominal lain</Text>
            <View style={{ flex: 1 }} />
            <TextInput
              style={styles.customInput}
              value={customAmount ? formatRupiah(parseInt(customAmount, 10)) : ""}
              onChangeText={onCustomChange}
              placeholder="Rp —"
              placeholderTextColor={colors.text3}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={{ gap: 9 }}>
          <Text style={styles.label}>Nama donatur</Text>
          <TextInput style={styles.input} value={donorName} onChangeText={setDonorName} placeholder="Nama Anda" />
          <Pressable style={styles.toggleRow} onPress={() => setAnonymous(a => !a)}>
            <Text style={styles.toggleLabel}>Donasi sebagai anonim</Text>
            <View style={[styles.switchTrack, anonymous && styles.switchTrackOn]}>
              <View style={[styles.switchThumb, anonymous && styles.switchThumbOn]} />
            </View>
          </Pressable>
        </View>

        <View style={{ gap: 9 }}>
          <Text style={styles.label}>Pesan atau doa <Text style={styles.optional}>(opsional)</Text></Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={message}
            onChangeText={setMessage}
            placeholder="Tulis pesan atau doa..."
            placeholderTextColor={colors.text3}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      <BottomBar
        primaryLabel="Lanjutkan"
        onPrimary={handleContinue}
        disabled={!canContinue}
        caption={amount ? `${formatRupiah(amount)} · donasi dana` : undefined}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  label: { fontSize: 14, fontFamily: fonts.sansExtraBold, color: colors.text },
  optional: { color: colors.text3, fontFamily: fonts.sansSemiBold },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  amountChip: {
    width: "47%", minHeight: 56, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md,
  },
  amountChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  amountChipText: { fontFamily: fonts.mono, fontSize: 16, fontWeight: "600", color: colors.text },
  amountChipTextSelected: { color: colors.primaryInk },
  customRow: {
    minHeight: 56, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md,
    backgroundColor: colors.surface, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 10,
  },
  customLabel: { fontSize: 15, color: colors.text3, fontFamily: fonts.sans },
  customInput: { fontFamily: fonts.mono, fontSize: 16, color: colors.text, textAlign: "right", minWidth: 100 },
  input: {
    minHeight: 52, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md,
    backgroundColor: colors.surface, paddingHorizontal: 15, fontSize: 15, color: colors.text, fontFamily: fonts.sans,
  },
  textarea: { minHeight: 88, textAlignVertical: "top", paddingTop: 14, lineHeight: 20 },
  toggleRow: {
    minHeight: 52, flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 15,
  },
  toggleLabel: { flex: 1, fontSize: 14.5, color: colors.text, fontFamily: fonts.sans },
  switchTrack: {
    width: 50, height: 30, borderRadius: 999, backgroundColor: colors.surface2,
    borderWidth: 1, borderColor: colors.borderStrong, padding: 3, justifyContent: "center",
  },
  switchTrackOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  switchThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
  switchThumbOn: { alignSelf: "flex-end", borderColor: colors.primary },
});
