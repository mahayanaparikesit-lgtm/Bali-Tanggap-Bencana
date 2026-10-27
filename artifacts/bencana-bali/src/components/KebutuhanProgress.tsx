import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Kebutuhan {
  id: number;
  kategori: string;
  nama_item: string;
  jumlah_dibutuhkan: number;
  jumlah_terpenuhi: number;
  satuan: string;
  keterangan?: string | null;
}

const KATEGORI_LABELS: Record<string, string> = {
  pangan: "Pangan",
  sandang: "Sandang",
  medis: "Medis",
  tempat_tinggal: "Tempat Tinggal",
  air_bersih: "Air Bersih",
  lainnya: "Lainnya",
};

export default function KebutuhanProgress({ items }: { items: Kebutuhan[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-text2 text-center py-4">Belum ada kebutuhan yang dicatat.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map(item => {
        const pct = item.jumlah_dibutuhkan > 0
          ? Math.min(100, Math.round((item.jumlah_terpenuhi / item.jumlah_dibutuhkan) * 100))
          : 0;

        return (
          <div key={item.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{item.nama_item}</span>
                <span className="text-xs text-text2 bg-surface-2 px-1.5 py-0.5 rounded">
                  {KATEGORI_LABELS[item.kategori] || item.kategori}
                </span>
              </div>
              <span className="text-xs text-text2 font-mono">
                {item.jumlah_terpenuhi}/{item.jumlah_dibutuhkan} {item.satuan}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={pct} className="h-2 flex-1" />
              <span className={cn(
                "text-xs font-bold w-10 text-right",
                pct === 100 ? "text-status-done-fg" : pct > 50 ? "text-status-wait-fg" : "text-status-act-fg"
              )}>
                {pct}%
              </span>
            </div>
            {item.keterangan && (
              <p className="text-xs text-text2">{item.keterangan}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
