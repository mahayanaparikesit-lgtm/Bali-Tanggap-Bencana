import { Card, CardContent } from "@/components/ui/card";
import { TriangleAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md rounded-[12px] border border-border bg-surface shadow-none">
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-2">
            <TriangleAlert size={24} className="text-primary" />
            <h1 className="text-2xl font-extrabold tracking-tight">404 Halaman tidak ditemukan</h1>
          </div>

          <p className="mt-4 text-sm text-text2">
            Halaman yang Anda cari tidak tersedia atau belum ditambahkan ke router.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
