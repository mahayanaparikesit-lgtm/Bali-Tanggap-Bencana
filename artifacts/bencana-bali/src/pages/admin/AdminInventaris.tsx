import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetInventaris, useCreateInventaris, useCreateTransaksiInventaris,
  useGetTransaksiByInventaris,
  getGetInventarisQueryKey, getGetDashboardStatistikQueryKey,
  type Inventaris,
} from "@workspace/api-client-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { KategoriBadge } from "@/components/StatusBadge";
import { TriangleAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatTanggalSingkat } from "@/lib/format";
import { cn } from "@/lib/utils";

const KATEGORI_OPTIONS = [
  { value: "pangan", label: "Pangan" },
  { value: "sandang", label: "Sandang" },
  { value: "medis", label: "Medis" },
  { value: "tempat_tinggal", label: "Tempat Tinggal" },
  { value: "air_bersih", label: "Air Bersih" },
  { value: "lainnya", label: "Lainnya" },
];

const GRID = "grid min-w-[760px] grid-cols-[minmax(200px,1fr)_140px_110px_110px_120px_150px] items-center gap-3.5";

function TransaksiHistory({ id }: { id: number }) {
  const { data } = useGetTransaksiByInventaris(id);
  if (!data || data.length === 0) return <p className="text-xs text-text3">Belum ada transaksi.</p>;
  return (
    <div className="max-h-48 space-y-2 overflow-y-auto">
      {data.map(t => (
        <div key={t.id} className="flex items-center gap-2 text-xs">
          <span className={cn("font-mono font-bold", t.jenis === "masuk" ? "text-status-done-fg" : "text-status-act-fg")}>
            {t.jenis === "masuk" ? "+" : "-"}{t.jumlah}
          </span>
          <span className="text-text2">{t.keterangan}</span>
          <span className="ml-auto text-text3">{formatTanggalSingkat(t.created_at)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminInventaris() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: inventaris, isLoading } = useGetInventaris();
  const createInventaris = useCreateInventaris();
  const createTransaksi = useCreateTransaksiInventaris();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventaris | null>(null);
  const [newItem, setNewItem] = useState({ nama_barang: "", kategori: "", satuan: "", stok_awal: "" });
  const [transaksi, setTransaksi] = useState({ jenis: "masuk", jumlah: "", keterangan: "" });

  const handleAddItem = () => {
    if (!newItem.nama_barang || !newItem.kategori || !newItem.satuan || !newItem.stok_awal) return;
    createInventaris.mutate({
      data: { ...newItem, stok_awal: parseInt(newItem.stok_awal) } as any
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInventarisQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatistikQueryKey() });
        setNewItem({ nama_barang: "", kategori: "", satuan: "", stok_awal: "" });
        setShowAddForm(false);
        toast({ title: "Barang berhasil ditambahkan" });
      }
    });
  };

  const handleTransaksi = () => {
    if (!selectedItem || !transaksi.jumlah || !transaksi.keterangan) return;
    createTransaksi.mutate({
      id: selectedItem.id,
      data: { jenis: transaksi.jenis as any, jumlah: parseInt(transaksi.jumlah), keterangan: transaksi.keterangan }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInventarisQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatistikQueryKey() });
        setTransaksi({ jenis: "masuk", jumlah: "", keterangan: "" });
        setSelectedItem(null);
        toast({ title: "Transaksi berhasil dicatat" });
      }
    });
  };

  return (
    <AdminLayout activePage="inventaris">
      <div className="flex flex-wrap items-end justify-between gap-[18px]">
        <div className="flex flex-col gap-[5px]">
          <h1 className="text-[22px] font-extrabold tracking-[-0.02em]">Logistik & stok</h1>
          <p className="text-sm text-text2">Catat dan pantau stok barang donasi.</p>
        </div>
        <Button onClick={() => setShowAddForm(v => !v)}>Tambah barang</Button>
      </div>

      {showAddForm && (
        <div className="rounded-xl border border-primary-border bg-primary-soft p-[18px]">
          <b className="text-sm font-extrabold">Tambah barang baru</b>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <Label className="text-xs">Nama barang</Label>
              <Input className="mt-1 h-8 text-xs" value={newItem.nama_barang} onChange={e => setNewItem(f => ({ ...f, nama_barang: e.target.value }))} placeholder="cth: Beras 5kg" />
            </div>
            <div>
              <Label className="text-xs">Kategori</Label>
              <Select value={newItem.kategori} onValueChange={v => setNewItem(f => ({ ...f, kategori: v }))}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>{KATEGORI_OPTIONS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Satuan</Label>
              <Input className="mt-1 h-8 text-xs" value={newItem.satuan} onChange={e => setNewItem(f => ({ ...f, satuan: e.target.value }))} placeholder="kg, pcs, liter..." />
            </div>
            <div>
              <Label className="text-xs">Stok awal</Label>
              <Input type="number" className="mt-1 h-8 text-xs" value={newItem.stok_awal} onChange={e => setNewItem(f => ({ ...f, stok_awal: e.target.value }))} />
            </div>
          </div>
          <Button size="sm" className="mt-3" onClick={handleAddItem} disabled={createInventaris.isPending}>
            {createInventaris.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-2 px-[18px] py-3">
          <b className="text-sm font-extrabold">Daftar barang</b>
          <span className="font-mono text-[12.5px] text-text2">{isLoading ? "…" : `${inventaris?.length ?? 0} item`}</span>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-[18px]">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : inventaris && inventaris.length > 0 ? (
          <div className="overflow-x-auto">
            <div className={`${GRID} border-b border-border px-[18px] py-2.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-text3`}>
              <span>Barang</span><span>Kategori</span><span>Masuk</span><span>Keluar</span><span>Sisa</span><span>Aksi</span>
            </div>
            {inventaris.map(item => {
              const kritis = item.stok_sisa <= 5;
              return (
                <div key={item.id} className={`${GRID} border-b border-border py-3.5 pl-[15px] pr-[18px] last:border-b-0`}>
                  <span className="flex min-w-0 flex-col gap-[3px]">
                    <b className="truncate text-[14.5px] font-bold">{item.nama_barang}</b>
                    <span className="text-[12.5px] text-text2">{item.satuan}</span>
                  </span>
                  <span className="justify-self-start"><KategoriBadge kategori={item.kategori} /></span>
                  <span className="font-mono text-[13px] text-status-done-fg">+{item.stok_masuk}</span>
                  <span className="font-mono text-[13px] text-status-act-fg">-{item.stok_keluar}</span>
                  <span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-xs font-bold",
                        kritis ? "border-status-act-br bg-status-act-bg text-status-act-fg" : "border-status-done-br bg-status-done-bg text-status-done-fg",
                      )}
                    >
                      {kritis && <TriangleAlert size={11} />}
                      {item.stok_sisa}
                    </span>
                  </span>
                  <span>
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="rounded-lg border border-border-strong px-3 py-1.5 text-[12.5px] font-bold text-text2 hover:border-text2 hover:text-foreground"
                    >
                      Transaksi
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-14 text-center text-sm text-text2">Belum ada barang di inventaris. Tambah barang pertama.</div>
        )}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={open => { if (!open) setSelectedItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaksi: {selectedItem?.nama_barang}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Jenis transaksi</Label>
                <Select value={transaksi.jenis} onValueChange={v => setTransaksi(f => ({ ...f, jenis: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masuk">Barang masuk (+)</SelectItem>
                    <SelectItem value="keluar">Barang keluar (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Jumlah ({selectedItem?.satuan})</Label>
                <Input type="number" className="mt-1 h-8 text-xs" value={transaksi.jumlah} onChange={e => setTransaksi(f => ({ ...f, jumlah: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Keterangan</Label>
              <Textarea rows={2} className="mt-1 text-xs" value={transaksi.keterangan} onChange={e => setTransaksi(f => ({ ...f, keterangan: e.target.value }))} placeholder="Sumber/tujuan barang..." />
            </div>
            <div className="border-t border-border pt-3">
              <p className="mb-2 text-xs font-bold text-text3">Riwayat transaksi</p>
              {selectedItem && <TransaksiHistory id={selectedItem.id} />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)}>Tutup</Button>
            <Button onClick={handleTransaksi} disabled={createTransaksi.isPending}>
              {createTransaksi.isPending ? "Menyimpan..." : "Catat transaksi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
