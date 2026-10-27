import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, fonts, spacing, radius } from "@/lib/theme";

const KEAHLIAN_OPTIONS = [
  "Medis", "SAR (Search & Rescue)", "Logistik", "Komunikasi", "Transportasi", "Psikologi", "Memasak", "Lainnya",
];

export default function RelawanDaftar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: cek } = useQuery({
    queryKey: ["relawan-cek-email", user?.email],
    queryFn: () => apiFetch<{ terdaftar: boolean; relawan?: { id: number } }>(`/relawan/cek-email?email=${encodeURIComponent(user!.email)}`),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (cek?.terdaftar && cek.relawan) {
      router.replace(`/relawan/${cek.relawan.id}` as any);
    }
  }, [cek]);

  const [nama, setNama] = useState(user?.nama ?? "");
  const [nik, setNik] = useState("");
  const [noHp, setNoHp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [fotoKtpUrl, setFotoKtpUrl] = useState("");
  const [keahlian, setKeahlian] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleKeahlian = (k: string) =>
    setKeahlian(prev => (prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]));

  const handleSubmit = async () => {
    if (!nama || !nik || !noHp || !alamat) {
      setError("Field bertanda * wajib diisi.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const row = await apiFetch<{ id: number }>("/relawan", {
        method: "POST",
        body: JSON.stringify({
          nama, nik, no_hp: noHp,
          email: user?.email ?? null,
          alamat, keahlian,
          foto_ktp_url: fotoKtpUrl || null,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["relawan-cek-email"] });
      router.replace(`/relawan/${row.id}` as any);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal mendaftar. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenHeader title="Daftar Relawan" showBack />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Field label="Nama Lengkap *">
          <TextInput style={styles.input} value={nama} onChangeText={setNama} placeholder="Nama lengkap" placeholderTextColor={colors.text3} />
        </Field>
        <Field label="NIK (KTP) *">
          <TextInput style={styles.input} value={nik} onChangeText={setNik} placeholder="16 digit" placeholderTextColor={colors.text3} maxLength={16} keyboardType="number-pad" />
        </Field>
        <Field label="No. HP / WhatsApp *">
          <TextInput style={styles.input} value={noHp} onChangeText={setNoHp} placeholder="08xxxxxxxxxx" placeholderTextColor={colors.text3} keyboardType="phone-pad" />
        </Field>
        <Field label="Alamat Lengkap *">
          <TextInput style={[styles.input, styles.textarea]} value={alamat} onChangeText={setAlamat} placeholder="Alamat domisili" placeholderTextColor={colors.text3} multiline numberOfLines={3} />
        </Field>
        <Field label="URL Foto KTP">
          <TextInput style={styles.input} value={fotoKtpUrl} onChangeText={setFotoKtpUrl} placeholder="Link Google Drive, dll." placeholderTextColor={colors.text3} autoCapitalize="none" />
        </Field>

        <Text style={styles.label}>Keahlian</Text>
        <View style={styles.keahlianGrid}>
          {KEAHLIAN_OPTIONS.map(k => {
            const selected = keahlian.includes(k);
            return (
              <Pressable key={k} onPress={() => toggleKeahlian(k)} style={styles.keahlianRow}>
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Feather name="check" size={12} color={colors.primaryInk} />}
                </View>
                <Text style={styles.keahlianText}>{k}</Text>
              </Pressable>
            );
          })}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={colors.primaryInk} /> : <Text style={styles.buttonText}>Kirim Pendaftaran</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xl },
  field: { marginBottom: spacing.md },
  label: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.text, marginBottom: spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, fontFamily: fonts.sans,
    backgroundColor: colors.surface, color: colors.text,
  },
  textarea: { minHeight: 70, textAlignVertical: "top" },
  keahlianGrid: { marginBottom: spacing.lg },
  keahlianRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 8 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.borderStrong,
    alignItems: "center", justifyContent: "center",
  },
  checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  keahlianText: { fontSize: 14, fontFamily: fonts.sans, color: colors.text },
  error: { color: colors.destructive, fontFamily: fonts.sans, fontSize: 13, marginBottom: spacing.md },
  button: { backgroundColor: colors.primary, borderRadius: radius.lg, minHeight: 56, alignItems: "center", justifyContent: "center" },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.primaryInk, fontSize: 16, fontFamily: fonts.sansExtraBold },
});
