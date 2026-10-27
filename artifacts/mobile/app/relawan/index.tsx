import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable, RefreshControl, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import type { Penugasan } from "@workspace/api-zod";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/StatusBadge";
import { colors, fonts, radius, spacing, statusTokens } from "@/lib/theme";

// Sesuai design_handoff_bali_rief/Mobile Dashboard Relawan.dc.html, dengan
// penyesuaian jujur ke data yang benar-benar ada di backend:
// - "Jam bertugas" & "Prioritas 1" DIHAPUS — tidak ada field durasi/prioritas
//   di skema penugasan, bukan cuma disembunyikan tapi memang tidak dibuat.
// - "Menunggu Anda" (terima/tolak tugas) DIHAPUS — penugasan dibuat admin
//   langsung berstatus aktif, tidak ada alur terima/tolak di backend.
// - "Ubah status — sekali ketuk" nyata: Berangkat/Tiba/Ada kendala menulis ke
//   kolom catatan (real, lewat PATCH /penugasan/:id/lapangan yang baru
//   ditambahkan khusus relawan-atas-tugasnya-sendiri); hanya "Selesai" yang
//   benar-benar mengubah status baris penugasan.
// - Tab bar bawah cuma 2 item nyata (Tugas, Profil) — bukan 4 item seperti
//   mockup, karena screen Laporan/Posko terpisah belum ada di app ini.

type CekRelawan = { terdaftar: boolean; relawan?: { id: number; status_verifikasi: string; catatan_verifikasi: string | null } };

function formatWaktu(iso: string) {
  const d = new Date(iso);
  const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? jam + " WITA" : d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) + " " + jam;
}

const STATUS_LAPANGAN = ["Berangkat ke lokasi", "Tiba di lokasi", "Ada kendala"] as const;

function TugasAktifCard({ tugas, onRefetch }: { tugas: Penugasan; onRefetch: () => void }) {
  const [saving, setSaving] = useState<string | null>(null);
  const currentLabel = STATUS_LAPANGAN.find(l => tugas.catatan?.startsWith(l)) ?? null;

  const setLapangan = async (label: (typeof STATUS_LAPANGAN)[number]) => {
    setSaving(label);
    try {
      await apiFetch(`/penugasan/${tugas.id}/lapangan`, {
        method: "PATCH",
        body: JSON.stringify({ catatan: `${label} · diperbarui ${formatWaktu(new Date().toISOString())}` }),
      });
      onRefetch();
    } catch {
      // Biarkan senyap — tombol tetap bisa dicoba ulang, tidak fatal untuk alur utama.
    } finally {
      setSaving(null);
    }
  };

  const selesaikan = async () => {
    setSaving("Selesai");
    try {
      await apiFetch(`/penugasan/${tugas.id}/lapangan`, {
        method: "PATCH",
        body: JSON.stringify({ status: "selesai", catatan: `Tugas selesai · ${formatWaktu(new Date().toISOString())}` }),
      });
      onRefetch();
    } finally {
      setSaving(null);
    }
  };

  const bukaRute = () => {
    const q = encodeURIComponent(tugas.lokasi_tugas);
    Linking.openURL(`https://maps.google.com/?q=${q}`);
  };

  const isKendala = currentLabel === "Ada kendala";

  return (
    <View style={styles.activeCard}>
      <View style={{ padding: 15, gap: 11 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.mono}>LPR-{tugas.laporan_id} · ditugaskan {formatWaktu(tugas.created_at)}</Text>
            <Text style={styles.activeTitle}>{tugas.detail_tugas}</Text>
            <Text style={styles.activeLoc}>{tugas.lokasi_tugas}</Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.statusLabel}>Status Anda</Text>
            <Text style={styles.statusValue}>{currentLabel ?? "Aktif, belum ada pembaruan"}</Text>
          </View>
        </View>

        <View style={{ gap: 7 }}>
          <Text style={styles.quickLabel}>Ubah status — sekali ketuk</Text>
          <View style={styles.quickGrid}>
            {STATUS_LAPANGAN.map(label => {
              const active = currentLabel === label;
              return (
                <Pressable key={label} onPress={() => setLapangan(label)} disabled={!!saving} style={[styles.quickBtn, active && styles.quickBtnActive]}>
                  {saving === label ? <ActivityIndicator size="small" color={active ? colors.primaryInk : colors.text} /> : (
                    <Text style={[styles.quickBtnText, active && styles.quickBtnTextActive]}>{label}</Text>
                  )}
                </Pressable>
              );
            })}
            <Pressable onPress={selesaikan} disabled={!!saving} style={styles.quickBtn}>
              {saving === "Selesai" ? <ActivityIndicator size="small" color={colors.text} /> : <Text style={styles.quickBtnText}>Selesai</Text>}
            </Pressable>
          </View>
        </View>

        {isKendala && (
          <View style={styles.kendalaBox}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="alert-circle" size={15} color={statusTokens.act.fg} />
              <Text style={styles.kendalaTitle}>Kendala tercatat</Text>
            </View>
            <Text style={styles.kendalaDesc}>Hubungi Pusdalops kalau butuh bantuan koordinasi segera.</Text>
            <Pressable style={styles.kendalaCall} onPress={() => Linking.openURL("tel:+62361251177")}>
              <Text style={styles.kendalaCallText}>Telepon Pusdalops (0361) 251177</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.routeBtn} onPress={bukaRute}>
          <Text style={styles.routeBtnText}>Buka rute</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function RelawanDashboard() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [onDuty, setOnDuty] = useState(true);

  const { data: cek, isLoading: loadingCek, refetch: refetchCek } = useQuery({
    queryKey: ["relawan-cek-email", user?.email],
    queryFn: () => apiFetch<CekRelawan>(`/relawan/cek-email?email=${encodeURIComponent(user!.email)}`),
    enabled: !!user?.email,
  });
  const relawanId = cek?.relawan?.id;

  const { data: semuaPenugasan, isLoading: loadingPenugasan, refetch: refetchPenugasan, isRefetching } = useQuery({
    queryKey: ["penugasan-relawan", relawanId],
    queryFn: () => apiFetch<Penugasan[]>(`/penugasan?relawan_id=${relawanId}`),
    enabled: !!relawanId,
  });

  const aktif = (semuaPenugasan ?? []).filter(p => p.status === "aktif");
  const selesai = (semuaPenugasan ?? []).filter(p => p.status === "selesai");

  const initials = user?.nama?.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase() ?? "—";

  const refetchAll = () => {
    refetchPenugasan();
    queryClient.invalidateQueries({ queryKey: ["penugasan-relawan", relawanId] });
  };

  if (!user?.email || loadingCek) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  if (!cek?.terdaftar) {
    return (
      <View style={styles.center}>
        <Text style={styles.h1}>Belum terdaftar sebagai relawan</Text>
        <Text style={[styles.activeLoc, { textAlign: "center", marginTop: 8, marginBottom: 20 }]}>Daftarkan diri untuk bisa ditugaskan ke lokasi bencana.</Text>
        <Pressable style={styles.routeBtn} onPress={() => router.push("/relawan/daftar")}>
          <Text style={styles.routeBtnText}>Daftar Relawan</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.headerName}>{user?.nama}</Text>
          <Text style={styles.headerRole}>Relawan · {cek.relawan?.status_verifikasi === "terverifikasi" ? "terverifikasi" : "menunggu verifikasi"}</Text>
        </View>
        <Pressable onPress={() => setOnDuty(v => !v)} style={[styles.dutyPill, onDuty ? styles.dutyOn : styles.dutyOff]}>
          <Text style={[styles.dutyText, { color: onDuty ? statusTokens.done.fg : colors.text2 }]}>{onDuty ? "Bertugas" : "Istirahat"}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetchAll} colors={[colors.primary]} />}
      >
        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={styles.statLabel}>Tugas aktif</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{aktif.length}</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statLabel}>Tugas selesai</Text>
            <Text style={styles.statValue}>{selesai.length}</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statLabel}>Total penugasan</Text>
            <Text style={styles.statValue}>{semuaPenugasan?.length ?? 0}</Text>
          </View>
        </View>

        <View style={{ gap: 11 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={styles.sectionTitle}>Penugasan aktif</Text>
          </View>
          {loadingPenugasan ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
          ) : aktif.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada penugasan aktif.</Text>
          ) : (
            aktif.map(p => <TugasAktifCard key={p.id} tugas={p} onRefetch={refetchAll} />)
          )}
        </View>

        <View style={{ gap: 11 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.sectionTitle}>Penugasan Anda</Text>
          </View>
          {(semuaPenugasan ?? []).length === 0 ? (
            <Text style={styles.emptyText}>Belum ada riwayat penugasan.</Text>
          ) : (
            <View style={styles.listCard}>
              {(semuaPenugasan ?? []).map((p, i) => (
                <View key={p.id} style={[styles.listRow, i === (semuaPenugasan!.length - 1) && { borderBottomWidth: 0 }]}>
                  <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    <Text style={styles.listTitle} numberOfLines={1}>{p.detail_tugas}</Text>
                    <Text style={styles.mono}>LPR-{p.laporan_id} · {formatWaktu(p.created_at)}</Text>
                  </View>
                  <StatusBadge status={p.status} size="sm" />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 16) + 18 }]}>
        <View style={styles.tabItem}>
          <Ionicons name="clipboard" size={19} color={colors.primary} />
          <Text style={[styles.tabLabel, { color: colors.primary }]}>Tugas</Text>
        </View>
        <Pressable style={styles.tabItem} onPress={() => relawanId && router.push(`/relawan/${relawanId}` as any)}>
          <Ionicons name="person-outline" size={19} color={colors.text3} />
          <Text style={styles.tabLabel}>Profil</Text>
        </Pressable>
        <Pressable style={styles.tabItem} onPress={logout}>
          <Ionicons name="log-out-outline" size={19} color={colors.text3} />
          <Text style={styles.tabLabel}>Keluar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, padding: 24 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, paddingHorizontal: 16, paddingBottom: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.sansExtraBold, fontSize: 13, color: colors.text2 },
  headerName: { fontFamily: fonts.sansExtraBold, fontSize: 16, color: colors.text },
  headerRole: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.text3 },
  dutyPill: { minHeight: 38, paddingHorizontal: 14, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  dutyOn: { backgroundColor: statusTokens.done.bg, borderColor: statusTokens.done.br },
  dutyOff: { backgroundColor: colors.surface2, borderColor: colors.borderStrong },
  dutyText: { fontFamily: fonts.sansExtraBold, fontSize: 12.5 },
  body: { padding: 16, paddingBottom: 24, gap: 16 },
  statsRow: { flexDirection: "row", gap: 10 },
  statTile: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 13, gap: 4 },
  statLabel: { fontFamily: fonts.sansExtraBold, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5, color: colors.text3 },
  statValue: { fontFamily: fonts.mono, fontSize: 24, fontWeight: "600", color: colors.text },
  sectionTitle: { fontFamily: fonts.sansExtraBold, fontSize: 15, color: colors.text },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text2, textAlign: "center", paddingVertical: 12 },
  h1: { fontFamily: fonts.sansExtraBold, fontSize: 20, color: colors.text, textAlign: "center" },
  activeCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.lg, overflow: "hidden" },
  mono: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.text3 },
  activeTitle: { fontFamily: fonts.sansExtraBold, fontSize: 17, color: colors.text, lineHeight: 21 },
  activeLoc: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.text2, lineHeight: 19 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 11 },
  statusLabel: { fontFamily: fonts.sansExtraBold, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5, color: colors.text3 },
  statusValue: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.text },
  quickLabel: { fontFamily: fonts.sansExtraBold, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, color: colors.text3 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickBtn: { width: "47.5%", minHeight: 48, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 8 },
  quickBtnActive: { backgroundColor: colors.primary, borderWidth: 0 },
  quickBtnText: { fontFamily: fonts.sansExtraBold, fontSize: 13.5, color: colors.text, textAlign: "center" },
  quickBtnTextActive: { color: colors.primaryInk },
  kendalaBox: { backgroundColor: statusTokens.act.bg, borderWidth: 1, borderColor: statusTokens.act.br, borderRadius: radius.sm, padding: 12, gap: 8 },
  kendalaTitle: { fontFamily: fonts.sansExtraBold, fontSize: 13.5, color: statusTokens.act.fg },
  kendalaDesc: { fontFamily: fonts.sans, fontSize: 13, color: colors.text2, lineHeight: 18 },
  kendalaCall: { minHeight: 44, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  kendalaCallText: { fontFamily: fonts.sansExtraBold, fontSize: 13, color: colors.primaryInk },
  routeBtn: { minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  routeBtnText: { fontFamily: fonts.sansExtraBold, fontSize: 14.5, color: colors.text },
  listCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden" },
  listRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 15, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
  listTitle: { fontFamily: fonts.sansBold, fontSize: 14.5, color: colors.text },
  tabBar: { flexDirection: "row", backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 9, paddingHorizontal: 8, gap: 4 },
  tabItem: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", gap: 4 },
  tabLabel: { fontFamily: fonts.sansExtraBold, fontSize: 11, color: colors.text3 },
});
