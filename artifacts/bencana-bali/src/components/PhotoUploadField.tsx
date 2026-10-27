import { useRef, useState } from "react";
import { Loader2, X, Camera } from "lucide-react";
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
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-2">
        {urls.map((url, i) => (
          <div key={url} className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Hapus foto"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {urls.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-strong text-text2 hover:border-primary hover:text-primary",
              uploading && "opacity-60",
            )}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            <span className="text-[10px] font-semibold">{uploading ? "Mengunggah…" : "Tambah"}</span>
          </button>
        )}
      </div>
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
