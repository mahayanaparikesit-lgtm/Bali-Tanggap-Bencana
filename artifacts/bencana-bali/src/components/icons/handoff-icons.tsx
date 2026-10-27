// Dulu berisi 5 ikon bentuk-geometris polos (DiamondIcon/RingIcon/
// SquareDiamondIcon/PinIcon + TriangleIcon) hasil terjemahan 1:1 dari glyph
// placeholder di design_handoff_bali_rief — bukan ikon sungguhan, dan tampak
// seperti "AI slop". Sudah diganti lucide-react (ikon library resmi app ini,
// lihat mis. PhotoUploadField.tsx) di semua tempat KECUALI satu: TriangleIcon
// di bawah ini tetap dipakai sebagai bentuk segitiga pada logo tile merah
// "Bali-Rief" (lockup di header/footer) — itu identitas brand, bukan ikon
// konsep yang perlu diganti. Jangan hapus TriangleIcon ini, dan jangan tambah
// ikon baru di file ini — pakai lucide-react untuk kebutuhan ikon lainnya.
export function TriangleIcon({ size = 13, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true" className={className}>
      <polygon points="5,1 9.2,8.8 0.8,8.8" fill="currentColor" />
    </svg>
  );
}
