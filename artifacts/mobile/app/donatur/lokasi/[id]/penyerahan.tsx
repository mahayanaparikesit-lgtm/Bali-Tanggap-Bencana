import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { Laporan } from "@workspace/api-zod";
import { apiFetch } from "@/lib/api";
import { FlowHeader } from "@/components/donasi/FlowHeader";
import { BottomBar } from "@/components/donasi/BottomBar";
import { useDonationFlow } from "@/context/DonationFlowContext";
import { colors, fonts, radius, spacing } from "@/lib/theme";

type Posko = { nama: string; alamat: string; kontak: string; kota: string };
type BencanaAktif = Laporan & { posko: Posko[] };

export default function MetodePenyerahan() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const locationId = Number(id);
  const { state, update } = useDonationFlow();

  const { data: aktifList } = useQuery({
    queryKey: ["donatur-bencana-aktif"],
    queryFn: () => apiFetch<BencanaAktif[]>("/donatur/bencana-aktif"),
  });
  const posko = aktifList?.find(l => l.id === locationId)?.posko?.[0];

  const select = (method: "antar" | "jemput") => update({ handoverMethod: method });

  const canContinue = state.handoverMethod === "antar" || (state.handoverMethod === "jemput" && state.pickupAddress.trim().length > 0);

  const handleContinue = () => {
    if (!canContinue) return;
    router.push(`/donatur/lokasi/${locationId}/ringkasan-barang` as any);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <FlowHeader title="Metode penyerahan" />
      <View style={styles.body}>
        <Pressable
          style={[styles.option, state.handoverMethod === "antar" && styles.optionSelected]}
          onPress={() => select("antar")}
        >
          <View style={styles.optionTop}>
            <View style={[styles.radio, state.handoverMethod === "antar" && styles.radioSelected]}>
              {state.handoverMethod === "antar" && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.optionTitle}>Antar sendiri ke posko</Text>
          </View>
          {state.handoverMethod === "antar" && posko && (
            <View style={styles.poskoCard}>
              <Text style={styles.poskoName}>{posko.nama}</Text>
              <Text style={styles.poskoAddr}>{posko.alamat}</Text>
              <Text style={styles.poskoContact}>{posko.kontak}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={[styles.option, state.handoverMethod === "jemput" && styles.optionSelected]}
          onPress={() => select("jemput")}
        >
          <View style={styles.optionTop}>
            <View style={[styles.radio, state.handoverMethod === "jemput" && styles.radioSelected]}>
              {state.handoverMethod === "jemput" && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.optionTitle}>Dijemput relawan</Text>
          </View>
          {state.handoverMethod === "jemput" && (
            <TextInput
              style={styles.pickupInput}
              value={state.pickupAddress}
              onChangeText={v => update({ pickupAddress: v })}
              placeholder="Alamat penjemputan barang"
              placeholderTextColor={colors.text3}
            />
          )}
        </Pressable>
      </View>

      <BottomBar primaryLabel="Lanjutkan" onPrimary={handleContinue} disabled={!canContinue} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.md, gap: spacing.md },
  option: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong,
    borderRadius: radius.md, padding: 15, gap: 11,
  },
  optionSelected: { borderWidth: 1.5, borderColor: colors.primary },
  optionTop: { flexDirection: "row", alignItems: "center", gap: 13 },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.borderStrong,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.primary },
  optionTitle: { fontSize: 15.5, fontFamily: fonts.sansExtraBold, color: colors.text, flex: 1 },
  poskoCard: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 13, gap: 4 },
  poskoName: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.text },
  poskoAddr: { fontSize: 13, color: colors.text2, lineHeight: 19, fontFamily: fonts.sans },
  poskoContact: { fontFamily: fonts.mono, fontSize: 12, color: colors.text3 },
  pickupInput: {
    minHeight: 52, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.sm,
    backgroundColor: colors.bg, paddingHorizontal: 13, fontSize: 14.5, color: colors.text, fontFamily: fonts.sans,
  },
});
