import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { colors, fonts, spacing, radius } from "@/lib/theme";

const ROLE_HOME: Record<string, string> = {
  relawan: "/relawan",
  pelapor: "/pelapor",
  donatur: "/donatur",
};

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) {
      setError("Email dan password wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === "admin") {
        setError("Akun admin hanya bisa login lewat aplikasi web, bukan aplikasi mobile ini.");
        return;
      }
      router.replace((ROLE_HOME[user.role] ?? "/login") as any);
    } catch (err: any) {
      setError(err.message ?? "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Bali Tanggap Bencana</Text>
        <Text style={styles.subtitle}>Masuk ke akun Anda</Text>

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
            placeholder="Password"
            placeholderTextColor={colors.text3}
            secureTextEntry
            autoComplete="password"
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.primaryInk} /> : <Text style={styles.buttonText}>Masuk</Text>}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Belum punya akun? </Text>
          <Link href="/register" asChild>
            <Pressable>
              <Text style={styles.link}>Daftar</Text>
            </Pressable>
          </Link>
        </View>

        <Link href="/transparansi" asChild>
          <Pressable style={styles.transparansiLink}>
            <Text style={styles.link}>Lihat Transparansi Bantuan →</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, justifyContent: "center", padding: spacing.lg },
  title: { fontSize: 24, fontFamily: fonts.sansExtraBold, color: colors.text, textAlign: "center", letterSpacing: -0.4 },
  subtitle: { fontSize: 14, fontFamily: fonts.sans, color: colors.text2, textAlign: "center", marginTop: spacing.xs, marginBottom: spacing.xl },
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
  error: {
    color: colors.destructive,
    fontFamily: fonts.sans,
    fontSize: 13,
    marginBottom: spacing.md,
  },
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
  transparansiLink: { alignItems: "center", marginTop: spacing.xl },
});
