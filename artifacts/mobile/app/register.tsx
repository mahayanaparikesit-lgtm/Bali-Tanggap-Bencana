import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { Link, router } from "expo-router";
import { useAuth, type UserRole } from "@/context/AuthContext";
import { colors, fonts, spacing, radius } from "@/lib/theme";

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: "pelapor", label: "Pelapor", desc: "Ketua RT/Banjar yang ingin melaporkan kejadian bencana" },
  { value: "donatur", label: "Donatur", desc: "Donasikan barang atau dana untuk korban bencana" },
];

export default function Register() {
  const { register } = useAuth();
  const [role, setRole] = useState<UserRole>("pelapor");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!nama || !email || !password) {
      setError("Semua field wajib diisi");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }
    setLoading(true);
    try {
      const user = await register({ nama, email, password, role });
      router.replace(`/${user.role}` as any);
    } catch (err: any) {
      setError(err.message ?? "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Buat Akun</Text>
        <Text style={styles.subtitle}>Pilih peran Anda dalam koordinasi bencana</Text>

        <View style={styles.roleRow}>
          {ROLES.map(r => {
            const selected = role === r.value;
            return (
              <Pressable
                key={r.value}
                onPress={() => setRole(r.value)}
                style={[styles.roleCard, selected && styles.roleCardSelected]}
              >
                <Text style={[styles.roleLabel, selected && styles.roleLabelSelected]}>{r.label}</Text>
                <Text style={styles.roleDesc}>{r.desc}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nama Lengkap</Text>
          <TextInput style={styles.input} value={nama} onChangeText={setNama} placeholder="Nama lengkap Anda" placeholderTextColor={colors.text3} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="nama@email.com"
            placeholderTextColor={colors.text3}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Minimal 6 karakter"
            placeholderTextColor={colors.text3}
            secureTextEntry
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.primaryInk} /> : <Text style={styles.buttonText}>Daftar sebagai {ROLES.find(r => r.value === role)?.label}</Text>}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Sudah punya akun? </Text>
          <Link href="/login" asChild>
            <Pressable>
              <Text style={styles.link}>Masuk</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, justifyContent: "center", padding: spacing.lg },
  title: { fontSize: 24, fontFamily: fonts.sansExtraBold, color: colors.text, textAlign: "center", letterSpacing: -0.4 },
  subtitle: { fontSize: 14, fontFamily: fonts.sans, color: colors.text2, textAlign: "center", marginTop: spacing.xs, marginBottom: spacing.lg },
  roleRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  roleCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  roleCardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  roleLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.text },
  roleLabelSelected: { color: colors.primary },
  roleDesc: { fontSize: 11, fontFamily: fonts.sans, color: colors.text2, marginTop: 2 },
  field: { marginBottom: spacing.md },
  label: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.text, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fonts.sans,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  error: { color: colors.destructive, fontFamily: fonts.sans, fontSize: 13, marginBottom: spacing.md },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.primaryInk, fontSize: 16, fontFamily: fonts.sansExtraBold },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
  footerText: { color: colors.text2, fontFamily: fonts.sans, fontSize: 14 },
  link: { color: colors.primary, fontSize: 14, fontFamily: fonts.sansBold },
});
