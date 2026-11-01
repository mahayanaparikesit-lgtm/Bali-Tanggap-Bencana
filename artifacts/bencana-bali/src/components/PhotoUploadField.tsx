import { useRef, useState } from "react";
import { Loader2, X, Camera, Plus } from "lucide-react";
import { uploadFiles, UploadError } from "@/lib/upload";
import { cn } from "@/lib/utils";

// Widget unggah foto asli (input file -> POST /uploads -> URL) — pengganti
// pola "tempel link" lama. Dipakai untuk foto kejadian (multi) dan foto KTP
// (single, lewat maxFiles=1).
export function PhotoUploadField({
  urls,
  onChange,
  maxFiles = 6,
  label,
  hint,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  label: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError("");
    const remaining = maxFiles - urls.length;
    const files = Array.from(fileList).slice(0, Math.max(0, remaining));
    if (files.length === 0) return;

    setUploading(true);
    try {
      const newUrls = await uploadFiles(files);
      onChange([...urls, ...newUrls]);
    } catch (e) {
      setError(e instanceof UploadError ? e.message : "Gagal mengunggah foto. Periksa koneksi Anda.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (i: number) => onChange(urls.filter((_, idx) => idx !== i));

  return (
    <div>
      <label className="mb-2 block text-sm font-bold">{label}</label>
      {urls.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex w-full items-center gap-4 rounded-2xl border-[1.5px] border-dashed border-border-strong bg-card px-4 py-4 text-left transition hover:border-primary hover:bg-primary-soft",
            uploading && "opacity-60",
          )}
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          </span>
          <span className="min-w-0">
            <b className="block text-[14.5px]">{uploading ? "Mengunggah…" : "Ambil atau pilih foto"}</b>
            <small className="text-xs text-text2">Kamera di ponsel, atau pilih dari galeri / berkas</small>
          </span>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {urls.map((url, i) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-2xl border border-border">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white"
                aria-label="Hapus foto"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {urls.length < maxFiles && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] border-dashed border-border-strong text-text2 hover:border-primary hover:text-foreground"
              aria-label="Tambah foto"
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              <span className="text-xs font-semibold">{uploading ? "Mengunggah…" : "Tambah"}</span>
            </button>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={maxFiles > 1}
        capture={maxFiles === 1 ? "environment" : undefined}
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      {hint && !error && <p className="mt-1 text-xs text-text3">{hint}</p>}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
