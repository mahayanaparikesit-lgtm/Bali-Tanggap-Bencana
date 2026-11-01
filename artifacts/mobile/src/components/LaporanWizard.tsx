import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Polygon } from "react-native-svg";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { apiFetch, ApiError } from "@/lib/api";
import { uploadFiles, uploadKtp, UploadError } from "@/lib/upload";
import { useAuth } from "@/context/AuthContext";
import { colors, fonts, radius, spacing, statusTokens } from "@/lib/theme";

// Wizard 5 langkah sesuai design_handoff_bali_rief/Mobile Lapor Bencana.dc.html.
// Dipakai oleh dua rute: app/pelapor/laporan-baru.tsx (di balik RoleGuard
// pelapor, untuk akun yang laporannya mau nyambung ke dashboard) dan
// app/lapor.tsx (rute publik tanpa login, untuk pelaporan darurat). Karena itu
// komponen ini TIDAK BOLEH mewajibkan `user` — useAuth() dipakai untuk
// prefill nama saja kalau sudah login, sisanya harus tetap jalan untuk tamu.
//
// Backend (POST /laporan) tidak punya field "tingkat kegentingan" terpisah —
// di mockup itu cuma UI, digabung ke teks deskripsi. Foto kejadian & foto KTP
// sekarang diunggah sungguhan lewat POST /api/uploads (lib/upload.ts), bukan
// lagi pratinjau lokal + tempel link manual.

type Jenis = "banjir" | "gempa_bumi" | "tanah_longsor" | "kebakaran" | "angin_kencang" | "tsunami" | "lainnya";

const JENIS_OPTIONS: { value: Jenis; label: string }[] = [
  { value: "banjir", label: "Banjir" },
  { value: "tanah_longsor", label: "Longsor" },
  { value: "angin_kencang", label: "Angin kencang" },
  { value: "gempa_bumi", label: "Gempa" },
  { value: "kebakaran", label: "Kebakaran" },
  { value: "lainnya", label: "Lainnya" },
];

const TAGS = ["Akses jalan tertutup", "Butuh air bersih", "Ada lansia & anak", "Ada korban luka", "Listrik mati"];

type PhotoState = { id: string; uri: string; url: string | null; uploading: boolean; error: string | null };

function newPhotoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function uploadOne(uri: string): Promise<{ url: string | null; error: string | null }> {
  try {
    const [url] = await uploadFiles([uri]);
    return { url: url ?? null, error: null };
  } catch (e) {
    return { url: null, error: e instanceof UploadError ? e.message : "Gagal mengunggah foto. Periksa koneksi Anda." };
  }
}

// Ikon jenis bencana pakai @expo/vector-icons (bukan bentuk SVG generik lagi)
// supaya tiap jenis benar-benar bisa dikenali sendiri tanpa label.
function JenisIcon({ jenis, color }: { jenis: Jenis; color: string }) {
  const size = 18;
  if (jenis === "banjir") return <MaterialCommunityIcons name="waves" size={size} color={color} />;
  if (jenis === "tsunami") return <MaterialCommunityIcons name="tsunami" size={size} color={color} />;
  if (jenis === "tanah_longsor") return <MaterialCommunityIcons name="landslide" size={size} color={color} />;
  if (jenis === "angin_kencang") return <MaterialCommunityIcons name="weather-windy" size={size} color={color} />;
  if (jenis === "gempa_bumi") return <MaterialCommunityIcons name="pulse" size={size} color={color} />;
  if (jenis === "kebakaran") return <Ionicons name="flame" size={size} color={color} />;
  return <Ionicons name="help-circle-outline" size={size} color={color} />;
}

function DoneIcon({ size = 26 }: { size?: number }) {
  return <Ionicons name="checkmark-circle" size={size} color={statusTokens.done.fg} />;
}

function PhotoTile({ photo, onRemove }: { photo: PhotoState; onRemove: () => void }) {
  return (
    <View style={styles.photoThumbWrap}>
      <View style={styles.photoThumbBox}>
        <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
        {photo.uploading && (
          <View style={styles.photoOverlay}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
        <Pressable style={styles.photoRemoveBtn} onPress={onRemove} hitSlop={6}>
          <Text style={styles.photoRemoveText}>×</Text>
        </Pressable>
      </View>
      {photo.error && <Text style={styles.photoErrorText} numberOfLines={2}>{photo.error}</Text>}
    </View>
  );
}

export function LaporanWizard() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sentId, setSentId] = useState<number | null>(null);

  const [jenis, setJenis] = useState<Jenis | null>(null);
  const [gawat, setGawat] = useState<"segera" | "menunggu">("segera");

  const [lokasi, setLokasi] = useState("");
  const [koordinat, setKoordinat] = useState<{ lat: number; lng: number; akurasi: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const [photos, setPhotos] = useState<PhotoState[]>([]);
  const [ktpPhoto, setKtpPhoto] = useState<PhotoState | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [catatan, setCatatan] = useState("");
  const [jumlahTerdampak, setJumlahTerdampak] = useState(0);
  const [namaPelapor, setNamaPelapor] = useState(user?.nama ?? "");
  const [kontak, setKontak] = useState("");

  const toggleTag = (t: string) => setTags(cur => cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t]);

  const handleGetLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Izin lokasi ditolak", "Aktifkan izin lokasi untuk mengisi koordinat otomatis.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setKoordinat({ lat: pos.coords.latitude, lng: pos.coords.longitude, akurasi: Math.round(pos.coords.accuracy ?? 0) });
      const geo = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      const g = geo[0];
      if (g && !lokasi) {
        setLokasi([g.street, g.subregion ?? g.city, g.region].filter(Boolean).join(", "));
      }
    } catch {
      Alert.alert("Gagal mengambil lokasi", "Coba lagi atau isi lokasi secara manual di bawah.");
    } finally {
      setLocating(false);
    }
  };

  const addPhoto = async (from: "camera" | "gallery") => {
    const perm = from === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Izin ditolak", from === "camera" ? "Aktifkan izin kamera." : "Aktifkan izin galeri.");
      return;
    }
    const result = from === "camera"
      ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    const id = newPhotoId();
    let full = false;
    setPhotos(cur => {
      if (cur.length >= 6) { full = true; return cur; }
      return [...cur, { id, uri, url: null, uploading: true, error: null }];
    });
    if (full) return;

    const { url, error: uploadError } = await uploadOne(uri);
    setPhotos(cur => cur.map(p => p.id === id ? { ...p, url, uploading: false, error: uploadError } : p));
  };

  const removePhoto = (id: string) => setPhotos(cur => cur.filter(p => p.id !== id));

  const addKtpPhoto = async (from: "camera" | "gallery") => {
    const perm = from === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Izin ditolak", from === "camera" ? "Aktifkan izin kamera." : "Aktifkan izin galeri.");
      return;
    }
    const result = from === "camera"
      ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    const id = newPhotoId();
    setKtpPhoto({ id, uri, url: null, uploading: true, error: null });

    // S4: KTP ke bucket privat — `url` di sini berisi path, bukan URL publik.
    let url: string | null = null, uploadError: string | null = null;
    try { url = await uploadKtp(uri); }
    catch (e) { uploadError = e instanceof UploadError ? e.message : "Gagal mengunggah foto KTP. Periksa koneksi Anda."; }
    setKtpPhoto(cur => (cur && cur.id === id ? { ...cur, url, uploading: false, error: uploadError } : cur));
  };

  const removeKtpPhoto = () => setKtpPhoto(null);

  const jenisLabel = jenis ? JENIS_OPTIONS.find(j => j.value === jenis)!.label : "—";

  const buildDeskripsi = () => {
    const parts: string[] = [];
    parts.push(gawat === "segera" ? "Perlu bantuan segera." : "Bisa menunggu.");
    if (tags.length) parts.push(tags.join(" · ") + ".");
    if (catatan.trim()) parts.push(catatan.trim());
    return parts.join(" ");
  };

  const canSubmit = !!jenis && !!lokasi && !!kontak && !!namaPelapor.trim();
  const photosBusy = photos.some(p => p.uploading) || !!ktpPhoto?.uploading;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError("Lengkapi jenis bencana, lokasi, nama, dan nomor kontak sebelum mengirim.");
      setStep(!jenis ? 1 : !lokasi ? 2 : 4);
      return;
    }
    if (photosBusy) {
      setError("Tunggu foto selesai diunggah sebelum mengirim.");
      setStep(3);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const foto_urls = photos.filter(p => p.url).map(p => p.url as string);
      const row = await apiFetch<{ id: number }>("/laporan", {
        method: "POST",
        body: JSON.stringify({
          judul: `${jenisLabel} — ${lokasi}`.slice(0, 120),
          jenis_bencana: jenis,
          lokasi,
          koordinat_lat: koordinat?.lat ?? null,
          koordinat_lng: koordinat?.lng ?? null,
          deskripsi: buildDeskripsi(),
          nama_pelapor: namaPelapor.trim(),
          kontak_pelapor: kontak,
          jumlah_terdampak: jumlahTerdampak || null,
          foto_urls,
          foto_ktp_path: ktpPhoto?.url ?? null,
        }),
      });
      setSentId(row.id);
      setSent(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal mengirim laporan. Periksa koneksi Anda.");
    } finally {
      setSubmitting(false);
    }
  };

  const back = () => {
    setError("");
    if (step === 1) { router.back(); return; }
    setStep(s => s - 1);
  };
  const next = () => setStep(s => Math.min(5, s + 1));

  const primaryLabel = sent ? "" : step === 5 ? (submitting ? "Mengirim…" : "Kirim laporan sekarang")
    : step === 1 ? "Lanjut ke lokasi" : step === 2 ? "Lanjut ke foto" : step === 3 ? "Lanjut ke keterangan" : "Periksa laporan";

  const stepValid = step === 1 ? !!jenis : step === 2 ? !!lokasi : step === 4 ? (!!namaPelapor.trim() && !!kontak) : true;

  const primaryAction = () => {
    if (step === 5) { handleSubmit(); return; }
    if (!stepValid) {
      setError(
        step === 1 ? "Pilih jenis bencana dulu."
          : step === 2 ? "Isi lokasi kejadian dulu."
          : !namaPelapor.trim() ? "Isi nama pelapor dulu."
          : "Isi nomor kontak dulu."
      );
      return;
    }
    setError("");
    next();
  };

  if (sent) {
    return (
      <View style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.body, { paddingTop: insets.top + 24 }]}>
          <View style={styles.doneTile}><DoneIcon /></View>
          <Text style={styles.h1}>Laporan terkirim</Text>
          <Text style={styles.lede}>Petugas Pusdalops memeriksa laporan Anda.</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>No. laporan</Text>
              <Text style={styles.rowValueMono}>LPR-{sentId}</Text>
            </View>
            <View style={[styles.wjetBadge, { backgroundColor: statusTokens.wait.bg, borderColor: statusTokens.wait.br }]}>
              <Ionicons name="time-outline" size={11} color={statusTokens.wait.fg} />
              <Text style={[styles.wjetText, { color: statusTokens.wait.fg }]}>Menunggu verifikasi</Text>
            </View>
            <Text style={styles.hint}>Anda akan dihubungi di {kontak} bila petugas perlu memastikan sesuatu.</Text>
          </View>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
          <Pressable style={styles.secondaryBtn} onPress={() => router.replace((user ? "/pelapor" : "/") as any)}>
            <Text style={styles.secondaryBtnText}>{user ? "Kembali ke Dashboard" : "Kembali ke Beranda"}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={back} style={styles.back} hitSlop={8}>
            <Text style={styles.chevron}>‹</Text>
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Lapor Bencana</Text>
            <Text style={styles.headerStep}>Langkah {step} dari 5</Text>
          </View>
        </View>
        <View style={styles.barsRow}>
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={[styles.bar, i <= step && styles.barActive]} />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View style={{ gap: 16 }}>
            <View style={{ gap: 6 }}>
              <Text style={styles.h1}>Apa yang terjadi?</Text>
              <Text style={styles.lede}>Pilih satu. Kalau nyawa terancam, hubungi <Text style={styles.mono}>112</Text> dulu.</Text>
            </View>
            {!user && (
              <View style={styles.noteBox}>
                <Ionicons name="information-circle" size={16} color={colors.primary} />
                <Text style={styles.noteText}>Ini laporan darurat — <Text style={{ fontFamily: fonts.sansExtraBold, color: colors.text }}>tidak perlu akun</Text>. Cukup isi data di langkah berikut, petugas akan segera memeriksa.</Text>
              </View>
            )}
            <View style={styles.grid2}>
              {JENIS_OPTIONS.map(j => {
                const active = jenis === j.value;
                return (
                  <Pressable key={j.value} onPress={() => setJenis(j.value)} style={[styles.tile, active && styles.tileActive]}>
                    <JenisIcon jenis={j.value} color={active ? colors.primary : colors.text} />
                    <Text style={[styles.tileText, active && styles.tileTextActive]}>{j.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Seberapa gawat sekarang?</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable onPress={() => setGawat("segera")} style={[styles.seg, gawat === "segera" && styles.segActive]}>
                  <Text style={[styles.segText, gawat === "segera" && styles.segTextActive]}>Perlu bantuan segera</Text>
                </Pressable>
                <Pressable onPress={() => setGawat("menunggu")} style={[styles.seg, gawat === "menunggu" && styles.segActive]}>
                  <Text style={[styles.segText, gawat === "menunggu" && styles.segTextActive]}>Bisa menunggu</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={{ gap: 14 }}>
            <View style={{ gap: 6 }}>
              <Text style={styles.h1}>Di mana lokasinya?</Text>
              <Text style={styles.lede}>Lokasi tepat membuat relawan tidak salah jalan.</Text>
            </View>
            <Pressable onPress={handleGetLocation} disabled={locating} style={styles.gpsBtn}>
              {locating ? <ActivityIndicator color={colors.primaryInk} /> : <Ionicons name="locate" size={18} color={colors.primaryInk} />}
              <Text style={styles.gpsBtnText}>{locating ? "Mengambil lokasi…" : "Pakai lokasi saya sekarang"}</Text>
            </Pressable>
            {koordinat && (
              <View style={[styles.card, { borderColor: statusTokens.done.br }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <DoneIcon size={13} />
                  <Text style={[styles.doneLabel]}>Lokasi terkunci · akurasi ±{koordinat.akurasi} m</Text>
                </View>
                <Text style={styles.coordMono}>{koordinat.lat.toFixed(5)}, {koordinat.lng.toFixed(5)}</Text>
              </View>
            )}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Alamat / patokan lokasi</Text>
              <TextInput
                style={styles.textareaInput}
                value={lokasi}
                onChangeText={setLokasi}
                placeholder="mis. 200 m timur Pura Desa, dekat jembatan"
                placeholderTextColor={colors.text3}
                multiline
              />
              <Text style={styles.hintSmall}>Patokan tetap terkirim walau GPS gagal.</Text>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={{ gap: 14 }}>
            <View style={{ gap: 6 }}>
              <Text style={styles.h1}>Ada foto kondisinya?</Text>
              <Text style={styles.lede}>Satu foto sudah cukup untuk mempercepat verifikasi.</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable style={styles.photoActionBtn} onPress={() => addPhoto("camera")}>
                <Text style={styles.photoActionText}>Kamera</Text>
              </Pressable>
              <Pressable style={styles.photoActionBtn} onPress={() => addPhoto("gallery")}>
                <Text style={styles.photoActionText}>Galeri</Text>
              </Pressable>
            </View>
            <View style={styles.photoGrid}>
              {photos.map(p => (
                <PhotoTile key={p.id} photo={p} onRemove={() => removePhoto(p.id)} />
              ))}
              {photos.length < 6 && (
                <Pressable style={styles.photoAdd} onPress={() => addPhoto("gallery")}>
                  <Text style={styles.photoAddText}>+</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={{ gap: 14 }}>
            <View style={{ gap: 6 }}>
              <Text style={styles.h1}>Ceritakan singkat</Text>
              <Text style={styles.lede}>Ketuk yang sesuai — tidak perlu menulis panjang.</Text>
            </View>
            <View style={styles.chipRow}>
              {TAGS.map(t => {
                const active = tags.includes(t);
                return (
                  <Pressable key={t} onPress={() => toggleTag(t)} style={[styles.tagChip, active && styles.tagChipActive]}>
                    <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>{t}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Catatan tambahan (opsional)</Text>
              <TextInput
                style={styles.textareaInput}
                value={catatan}
                onChangeText={setCatatan}
                placeholder="mis. Air masuk rumah setinggi pinggang, warga mengungsi ke balai desa."
                placeholderTextColor={colors.text3}
                multiline
              />
            </View>
            <View style={[styles.card, { flexDirection: "row", alignItems: "center", gap: 12 }]}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.cardLabel}>Perkiraan warga terdampak</Text>
                <Text style={styles.hintSmall}>Boleh kira-kira</Text>
              </View>
              <Pressable style={styles.stepperBtn} onPress={() => setJumlahTerdampak(v => Math.max(0, v - 5))}>
                <Text style={styles.stepperBtnText}>−</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{jumlahTerdampak}</Text>
              <Pressable style={styles.stepperBtn} onPress={() => setJumlahTerdampak(v => v + 5)}>
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Nama pelapor *</Text>
              <TextInput
                style={styles.nameInput}
                value={namaPelapor}
                onChangeText={setNamaPelapor}
                placeholder="Nama lengkap Anda"
                placeholderTextColor={colors.text3}
              />
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Nomor yang bisa dihubungi *</Text>
              <TextInput
                style={styles.input}
                value={kontak}
                onChangeText={setKontak}
                placeholder="08xxxxxxxxxx"
                placeholderTextColor={colors.text3}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Foto KTP (opsional)</Text>
              <Text style={styles.hintSmall}>Membantu mempercepat verifikasi identitas. Hanya dilihat petugas, tidak pernah ditampilkan publik.</Text>
              {ktpPhoto ? (
                <View style={styles.ktpRow}>
                  <PhotoTile photo={ktpPhoto} onRemove={removeKtpPhoto} />
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable style={styles.photoActionBtn} onPress={() => addKtpPhoto("camera")}>
                    <Text style={styles.photoActionText}>Kamera</Text>
                  </Pressable>
                  <Pressable style={styles.photoActionBtn} onPress={() => addKtpPhoto("gallery")}>
                    <Text style={styles.photoActionText}>Galeri</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={{ gap: 14 }}>
            <View style={{ gap: 6 }}>
              <Text style={styles.h1}>Periksa sebelum kirim</Text>
              <Text style={styles.lede}>Ketuk baris untuk memperbaiki.</Text>
            </View>
            <View style={styles.card}>
              <ReviewRow label="Jenis" value={`${jenisLabel} · ${gawat === "segera" ? "perlu bantuan segera" : "bisa menunggu"}`} onEdit={() => setStep(1)} />
              <View style={styles.divider} />
              <ReviewRow label="Lokasi" value={lokasi || "—"} sub={koordinat ? `${koordinat.lat.toFixed(5)}, ${koordinat.lng.toFixed(5)} · ±${koordinat.akurasi} m` : undefined} onEdit={() => setStep(2)} />
              <View style={styles.divider} />
              <ReviewRow
                label="Foto"
                value={photos.length ? `${photos.filter(p => p.url).length}/${photos.length} foto terunggah` : "Tidak ada"}
                onEdit={() => setStep(3)}
              />
              <View style={styles.divider} />
              <ReviewRow label="Keterangan" value={[tags.join(" · "), jumlahTerdampak ? `±${jumlahTerdampak} jiwa` : null].filter(Boolean).join(" · ") || "—"} onEdit={() => setStep(4)} />
              <View style={styles.divider} />
              <ReviewRow
                label="Pelapor"
                value={`${namaPelapor || "—"} · ${kontak || "—"}`}
                sub={ktpPhoto?.url ? "Foto KTP terlampir" : ktpPhoto?.uploading ? "Foto KTP sedang diunggah…" : "Tanpa foto KTP"}
                onEdit={() => setStep(4)}
              />
            </View>
            <View style={styles.noteBox}>
              <View style={styles.checkTile}>
                <Svg width={13} height={13} viewBox="0 0 12 12"><Polygon points="2.6,6.2 4.8,8.6 9.4,3.6" fill="none" stroke={colors.primaryInk} /></Svg>
              </View>
              <Text style={styles.noteText}>Saya menyatakan laporan ini benar. Laporan palsu dapat diproses sesuai hukum.</Text>
            </View>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
        <Pressable
          style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
          onPress={primaryAction}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color={colors.primaryInk} /> : <Text style={styles.primaryBtnText}>{primaryLabel}</Text>}
        </Pressable>
        <View style={styles.footerBottomRow}>
          <Pressable onPress={back}><Text style={styles.backLink}>‹ Kembali</Text></Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function ReviewRow({ label, value, sub, onEdit }: { label: string; value: string; sub?: string; onEdit: () => void }) {
  return (
    <Pressable onPress={onEdit} style={styles.reviewRow}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.reviewLabel}>{label}</Text>
        <Text style={styles.reviewValue}>{value}</Text>
        {sub && <Text style={styles.coordMono}>{sub}</Text>}
      </View>
      <Text style={styles.editLink}>Ubah</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44 },
  back: { width: 44, height: 44, marginLeft: -10, alignItems: "center", justifyContent: "center" },
  chevron: { fontSize: 22, color: colors.text },
  headerTitle: { fontFamily: fonts.sansExtraBold, fontSize: 16, color: colors.text },
  headerStep: { fontFamily: fonts.mono, fontSize: 12, color: colors.text3 },
  barsRow: { flexDirection: "row", gap: 5, paddingVertical: 12 },
  bar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.border },
  barActive: { backgroundColor: colors.primary },
  body: { padding: 16, paddingBottom: 24, gap: 16 },
  h1: { fontFamily: fonts.sansExtraBold, fontSize: 24, color: colors.text, letterSpacing: -0.4, lineHeight: 28 },
  lede: { fontFamily: fonts.sans, fontSize: 14.5, color: colors.text2, lineHeight: 20 },
  mono: { fontFamily: fonts.mono, color: colors.text },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: "47.5%", minHeight: 76, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, padding: 14, justifyContent: "center", gap: 8,
  },
  tileActive: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primarySoft },
  tileText: { fontFamily: fonts.sansBold, fontSize: 14.5, color: colors.text },
  tileTextActive: { color: colors.primary },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, gap: 9 },
  cardLabel: { fontFamily: fonts.sansExtraBold, fontSize: 13.5, color: colors.text },
  seg: { flex: 1, minHeight: 48, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center", padding: 8 },
  segActive: { backgroundColor: colors.primary, borderWidth: 0 },
  segText: { fontFamily: fonts.sansExtraBold, fontSize: 13.5, color: colors.text2 },
  segTextActive: { color: colors.primaryInk },
  gpsBtn: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.primary, borderRadius: radius.lg, padding: 16 },
  gpsBtnText: { fontFamily: fonts.sansExtraBold, fontSize: 16.5, color: colors.primaryInk },
  doneLabel: { fontFamily: fonts.sansExtraBold, fontSize: 13, color: statusTokens.done.fg },
  coordMono: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.text2 },
  textareaInput: { minHeight: 60, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.sm, padding: 13, fontSize: 14.5, color: colors.text, fontFamily: fonts.sans, textAlignVertical: "top" },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.sm, padding: 13, fontSize: 15, color: colors.text, fontFamily: fonts.mono },
  nameInput: { minHeight: 48, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.sm, padding: 13, fontSize: 15, color: colors.text, fontFamily: fonts.sans },
  hintSmall: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.text3, lineHeight: 18 },
  photoActionBtn: { flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md },
  photoActionText: { fontFamily: fonts.sansExtraBold, fontSize: 15, color: colors.text },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photoThumbWrap: { width: "31%", gap: 4 },
  photoThumbBox: { width: "100%", aspectRatio: 1, borderRadius: radius.sm, backgroundColor: colors.surface2, overflow: "hidden" },
  photoThumb: { width: "100%", height: "100%" },
  photoOverlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(23,28,38,0.55)", alignItems: "center", justifyContent: "center" },
  photoRemoveBtn: { position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(23,28,38,0.7)", alignItems: "center", justifyContent: "center" },
  photoRemoveText: { color: "#fff", fontSize: 14, lineHeight: 16, fontFamily: fonts.sansBold },
  photoErrorText: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.destructive, lineHeight: 13 },
  photoAdd: { width: "31%", aspectRatio: 1, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderStrong, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  photoAddText: { fontSize: 24, color: colors.text2 },
  ktpRow: { flexDirection: "row" },
  noteBox: { flexDirection: "row", gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 13, alignItems: "flex-start" },
  noteText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.text2, lineHeight: 19 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 10 },
  tagChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  tagChipText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.text2 },
  tagChipTextActive: { color: colors.primary },
  stepperBtn: { width: 44, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  stepperBtnText: { fontSize: 20, color: colors.text },
  stepperValue: { fontFamily: fonts.mono, fontSize: 17, fontWeight: "600", color: colors.text, minWidth: 44, textAlign: "center" },
  reviewRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  reviewLabel: { fontFamily: fonts.sansExtraBold, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, color: colors.text3 },
  reviewValue: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.text, lineHeight: 20 },
  editLink: { fontFamily: fonts.sansExtraBold, fontSize: 14, color: colors.primary, padding: 10 },
  divider: { height: 1, backgroundColor: colors.border },
  checkTile: { width: 24, height: 24, borderRadius: 6, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.destructive },
  footer: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 16, paddingTop: 12, gap: 9 },
  primaryBtn: { minHeight: 56, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  primaryBtnDisabled: { backgroundColor: colors.borderStrong },
  primaryBtnText: { fontFamily: fonts.sansExtraBold, fontSize: 16.5, color: colors.primaryInk },
  footerBottomRow: { flexDirection: "row", alignItems: "center", minHeight: 24 },
  backLink: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.text2, padding: 4 },
  doneTile: { width: 56, height: 56, borderRadius: 16, backgroundColor: statusTokens.done.bg, borderWidth: 1, borderColor: statusTokens.done.br, alignItems: "center", justifyContent: "center" },
  wjetBadge: { flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start", borderWidth: 1, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 5 },
  wjetText: { fontFamily: fonts.sansBold, fontSize: 12.5 },
  hint: { fontFamily: fonts.sans, fontSize: 13, color: colors.text2, lineHeight: 19 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowLabel: { fontFamily: fonts.sansBold, fontSize: 12.5, color: colors.text3 },
  rowValueMono: { fontFamily: fonts.mono, fontSize: 15, fontWeight: "600", color: colors.text },
  secondaryBtn: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  secondaryBtnText: { fontFamily: fonts.sansExtraBold, fontSize: 15.5, color: colors.text },
});
