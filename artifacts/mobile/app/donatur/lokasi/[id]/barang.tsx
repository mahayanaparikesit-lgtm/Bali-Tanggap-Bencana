import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Polyline } from "react-native-svg";
import { useQuery } from "@tanstack/react-query";
import type { Kebutuhan } from "@workspace/api-zod";
import { apiFetch } from "@/lib/api";
import { FlowHeader } from "@/components/donasi/FlowHeader";
import { BottomBar } from "@/components/donasi/BottomBar";
import { useDonationFlow, type BarangItem } from "@/context/DonationFlowContext";
import { useAuth } from "@/context/AuthContext";
import { colors, fonts, radius, spacing } from "@/lib/theme";

function CheckIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 12 12">
      <Polyline points="2.6,6.2 4.8,8.6 9.4,3.6" fill="none" stroke={colors.primaryInk} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}

export default function FormDonasiBarang() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const locationId = Number(id);
  const { user } = useAuth();
  const { state, update } = useDonationFlow();

  const { data: kebutuhan, isLoading } = useQuery({
    queryKey: ["laporan", locationId, "kebutuhan"],
    queryFn: () => apiFetch<Kebutuhan[]>(`/laporan/${locationId}/kebutuhan`),
    enabled: !!locationId,
  });

  const [qty, setQty] = useState<Record<number, number>>({});
  const [donorName, setDonorName] = useState(state.donorName || user?.nama || "");
  const [anonymous, setAnonymous] = useState(state.anonymous);
  const [note, setNote] = useState(state.note);

  const toggle = (k: Kebutuhan) => {
    setQty(q => {
      const next = { ...q };
      if (next[k.id]) delete next[k.id];
      else next[k.id] = 1;
      return next;
    });
  };

  const adjust = (id: number, delta: number) => {
    setQty(q => {
      const cur = q[id] ?? 1;
      const nextVal = Math.max(1, cur + delta);
      return { ...q, [id]: nextVal };
    });
  };

  const selectedItems = (kebutuhan ?? []).filter(k => qty[k.id]);
  const totalItems = selectedItems.reduce((s, k) => s + (qty[k.id] ?? 0), 0);
  const canContinue = selectedItems.length > 0 && !!donorName.trim();

  const handleContinue = () => {
    if (!canContinue) return;
    const items: BarangItem[] = selectedItems.map(k => ({ kebutuhanId: k.id, namaItem: k.nama_item, jumlah: qty[k.id] }));
    update({ locationId, donationType: "barang", items, donorName: donorName.trim(), anonymous, note });
    router.push(`/donatur/lokasi/${locationId}/penyerahan` as any);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <FlowHeader title="Donasi barang" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 9 }}>
          <Text style={styles.label}>Pilih dari kebutuhan lokasi</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={styles.needsCard}>
              {(kebutuhan ?? []).map((k, i) => {
                const selected = !!qty[k.id];
                const kurang = Math.max(0, k.jumlah_dibutuhkan - k.jumlah_terpenuhi);
                return (
                  <View key={k.id} style={[styles.needRow, i === (kebutuhan?.length ?? 0) - 1 && { borderBottomWidth: 0 }]}>
                    <Pressable style={styles.needMain} onPress={() => toggle(k)}>
                      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                        {selected && <CheckIcon />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.needName}>{k.nama_item}</Text>
                        <Text style={styles.needSub}>{k.satuan} · kurang {kurang}</Text>
                      </View>
                    </Pressable>
                    {selected && (
                      <View style={styles.stepper}>
                        <Pressable style={styles.stepBtn} onPress={() => adjust(k.id, -1)}>
                          <Text style={styles.stepBtnText}>−</Text>
                        </Pressable>
                        <Text style={styles.stepValue}>{qty[k.id]}</Text>
                        <Pressable style={styles.stepBtn} onPress={() => adjust(k.id, 1)}>
                          <Text style={styles.stepBtnText}>+</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
              {(kebutuhan ?? []).length === 0 && (
                <View style={styles.needMain}><Text style={styles.needSub}>Belum ada data kebutuhan untuk lokasi ini.</Text></View>
              )}
            </View>
          )}
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
          <Text style={styles.label}>Catatan <Text style={styles.optional}>(opsional)</Text></Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={note}
            onChangeText={setNote}
            placeholder="cth: barang siap diantar besok pagi"
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
        caption={selectedItems.length > 0 ? `${selectedItems.length} jenis barang dipilih · ${totalItems} item` : undefined}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  label: { fontSize: 14, fontFamily: fonts.sansExtraBold, color: colors.text },
  optional: { color: colors.text3, fontFamily: fonts.sansSemiBold },
  needsCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden" },
  needRow: {
    minHeight: 60, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  needMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  checkbox: {
    width: 26, height: 26, borderRadius: 7, borderWidth: 1.5, borderColor: colors.borderStrong,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  needName: { fontSize: 15, fontFamily: fonts.sansBold, color: colors.text },
  needSub: { fontSize: 12.5, color: colors.text3, fontFamily: fonts.sans, marginTop: 2 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
  stepBtn: {
    width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.borderStrong,
    alignItems: "center", justifyContent: "center",
  },
  stepBtnText: { fontSize: 18, color: colors.text2 },
  stepValue: { fontFamily: fonts.mono, fontSize: 15, minWidth: 26, textAlign: "center", color: colors.text },
  input: {
    minHeight: 52, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md,
    backgroundColor: colors.surface, paddingHorizontal: 15, fontSize: 15, color: colors.text, fontFamily: fonts.sans,
  },
  textarea: { minHeight: 80, textAlignVertical: "top", paddingTop: 14, lineHeight: 20 },
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
