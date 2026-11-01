import { cn } from "@/lib/utils";

// Garis "denyut seismograf" — motif merek redesign 2026 (logo, hero, alur).
export function Seismo({ className, strokeWidth = 2.5 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 150 28" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M0 18h34l6-12 9 20 7-16 6 8h88" />
    </svg>
  );
}

export function BrandMark({ size = 38, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-[11px] bg-ink dark:ring-1 dark:ring-ink-line", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" width={size * 0.63} height={size * 0.63} fill="none" stroke="hsl(var(--marigold))" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 13h4l2.5-6 4 11 3-8 2 3H22" />
      </svg>
    </span>
  );
}

export function Brand({ inverted, sub = "Koordinasi bencana Bali" }: { inverted?: boolean; sub?: string | null }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      <span className="flex flex-col leading-none">
        <b className={cn("text-[19px] font-extrabold tracking-[-0.03em]", inverted && "text-white")}>Bali-Rief</b>
        {sub && <small className={cn("mt-[3px] text-[11px] font-semibold", inverted ? "text-on-ink-2" : "text-text2")}>{sub}</small>}
      </span>
    </span>
  );
}

// Eyebrow mono kecil di atas judul seksi ("— LOKASI TERDAMPAK").
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 font-mono text-[11.5px] font-medium uppercase tracking-[0.12em] text-text2 before:h-0.5 before:w-[18px] before:bg-current before:content-['']", className)}>
      {children}
    </div>
  );
}
