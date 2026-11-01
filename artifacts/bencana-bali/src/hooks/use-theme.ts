import { useCallback, useEffect, useState } from "react";

// Toggle .dark di <html> — dipakai bareng skema warna di index.css yang sudah
// ada (:root vs .dark), bukan atribut data-theme (itu cuma sintaks khusus
// prototipe .dc.html di design_handoff_bali_rief, bukan bagian dari desainnya).
function getInitial(): boolean {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem("theme");
  if (stored === "dark") return true;
  // Default selalu terang (mode gelap hanya bila pengguna memilihnya sendiri),
  // tidak mengikuti pengaturan gelap sistem operasi.
  return false;
}

export function useColorTheme() {
  const [isDark, setIsDark] = useState(getInitial);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggle = useCallback(() => {
    setIsDark(v => {
      const next = !v;
      window.localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return { isDark, toggle };
}
