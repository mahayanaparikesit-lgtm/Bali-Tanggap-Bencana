import type { ReactNode } from "react";
import { Link } from "wouter";
import { TriangleAlert } from "lucide-react";
import { Brand, Seismo } from "@/components/brand/Brand";

// Kerangka halaman Masuk / Daftar — panel ilustrasi di kiri (desktop), form di kanan.
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-ink lg:block">
        <img src={`${import.meta.env.BASE_URL}hero-bali.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover object-[68%_center]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,40,22,.1)_0%,rgba(28,40,22,.78)_100%)]" />
        <div className="absolute inset-x-10 bottom-10 text-white">
          <h2 className="text-[64px] font-extrabold leading-[0.85] tracking-[-0.06em]">Bali<br /><span className="text-marigold">bangkit bersama.</span></h2>
          <Seismo className="mt-4 h-7 w-[150px] text-marigold" />
          <p className="mt-4 max-w-[380px] text-sm text-on-ink">Satu akun untuk berdonasi, melacak laporan Anda, atau menjalankan tugas sebagai relawan dan admin Pusdalops.</p>
        </div>
      </aside>
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="hover:no-underline"><Brand /></Link>
          <Link href="/lapor" className="inline-flex items-center gap-1.5 rounded-full bg-urgent px-3.5 py-2 text-[13px] font-bold text-urgent-foreground hover:bg-urgent-hover hover:no-underline">
            <TriangleAlert size={15} />Lapor tanpa akun
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </div>
    </div>
  );
}
