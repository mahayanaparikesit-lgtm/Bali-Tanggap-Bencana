import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { StatusBadge } from "@/components/StatusBadge";
import { ReportDetailOverlay } from "@/components/ReportDetailOverlay";
import { Eyebrow } from "@/components/brand/Brand";
import { PublicFooter, PublicHeader, UtilityStrip } from "@/components/public/PublicShell";
import { Info, UserCheck, Clock } from "lucide-react";
import { formatRupiah, formatRupiahRingkas, formatTanggalSingkat, JENIS_LABELS } from "@/lib/format";

const BASE = import.meta.env.VITE_API_URL.replace(/\/$/, "");

async function fetchJson(path: string) {
  const res = await fetch(`${BASE}${path}`);
  return res.json();
}

type Periode = "7" | "30" | "semua";

function dalamPeriode(iso: string, periode: Periode) {
  if (periode === "semua") return true;
  const hari = periode === "7" ? 7 : 30;
  const batas = Date.now() - hari * 24 * 60 * 60 * 1000;
  return new Date(iso).getTime() >= batas;
}

function exportDonasiCSV(list: any[]) {
  const rows: string[] = ["Tanggal,Donatur,Laporan,Jenis,Jumlah"];
  for (const l of list) {
    for (const d of l.donasi ?? []) {
      const jumlah = d.jenis === "dana" ? d.jumlah_dana : `${d.jumlah_barang} ${d.nama_barang}`;
      rows.push([
        new Date(d.created_at).toISOString().slice(0, 10),
        `"${(d.nama_donatur ?? "").replace(/"/g, '""')}"`,
        `"${(l.judul ?? "").replace(/"/g, '""')}"`,
        d.jenis,
        `"${jumlah}"`,
      ].join(","));
    }
  }
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `donasi-bali-rief-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportRingkasanPDF(list: any[], totalDana: number) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Transparansi - Bali-Rief", 14, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, 14, 22);

  const totalDampak = list.reduce((s, l) => s + (l.jumlah_terdampak || 0), 0);
  const totalDonasi = list.reduce((s, l) => s + (l.donasi?.length || 0), 0);

  autoTable(doc, {
    startY: 30,
    head: [["Total Laporan", "Jiwa Terdampak", "Total Donasi", "Total Dana"]],
    body: [[list.length.toString(), totalDampak.toLocaleString("id-ID"), totalDonasi.toString(), formatRupiah(totalDana)]],
    theme: "grid",
    headStyles: { fillColor: [207, 35, 23] },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [["Judul", "Jenis", "Lokasi", "Status", "Terdampak", "Donasi", "Tanggal"]],
    body: list.map(l => [
      l.judul, JENIS_LABELS[l.jenis_bencana] || l.jenis_bencana, l.lokasi,
      l.status, (l.jumlah_terdampak || 0).toLocaleString("id-ID"),
      (l.donasi?.length || 0).toString(), new Date(l.created_at).toLocaleDateString("id-ID"),
    ]),
    theme: "striped",
    headStyles: { fillColor: [207, 35, 23] },
    styles: { fontSize: 8 },
  });

  doc.save(`transparansi-bali-rief-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function StatCard({ label, value, valueClass, sub, subMuted }: { label: string; value: string; valueClass?: string; sub: string; subMuted?: string }) {
  return (
    <div className="flex flex-col gap-[7px] rounded-xl border border-border bg-surface p-5">
      <span className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-text3">{label}</span>
      <b className={`font-mono text-[30px] font-semibold leading-none tracking-[-0.025em] ${valueClass ?? ""}`}>{value}</b>
      <span className="text-[13px] text-text2">{sub}</span>
      {subMuted && <span className="font-mono text-[12.5px] text-text3">{subMuted}</span>}
    </div>
  );
}

function Bar({ pct, color = "bg-primary" }: { pct: number; color?: string }) {
  return (
    <div className="h-[7px] overflow-hidden rounded-[4px] bg-surface-2">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export default function Transparansi() {
  // Default "semua" (bukan 30 hari seperti di mockup) — data laporan yang ada
  // sekarang tersebar beberapa bulan, jadi default 30 hari akan tampil kosong.
  const [periode, setPeriode] = useState<Periode>("semua");
  const [openId, setOpenId] = useState<number | null>(null);

  const { data: allLaporan } = useQuery({ queryKey: ["transparansi-laporan"], queryFn: () => fetchJson("/api/transparansi/laporan") });
  const { data: statistik } = useQuery({ queryKey: ["dashboard-statistik"], queryFn: () => fetchJson("/api/dashboard/statistik") });

  const list: any[] = useMemo(() => (allLaporan ?? []).filter((l: any) => dalamPeriode(l.created_at, periode)), [allLaporan, periode]);
  const aktifList = useMemo(() => list.filter(l => l.status !== "selesai" && l.status !== "ditolak"), [list]);

  const totalDana = list.reduce((s, l) => s + (l.donasi ?? []).filter((d: any) => d.jenis === "dana").reduce((x: number, d: any) => x + (d.jumlah_dana || 0), 0), 0);
  const totalDonasi = list.reduce((s, l) => s + (l.donasi?.length ?? 0), 0);
  const totalDonatur = new Set(list.flatMap((l: any) => (l.donasi ?? []).map((d: any) => d.nama_donatur))).size;

  const danaPerJenis = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of list) {
      const dana = (l.donasi ?? []).filter((d: any) => d.jenis === "dana").reduce((x: number, d: any) => x + (d.jumlah_dana || 0), 0);
      if (dana > 0) map.set(l.jenis_bencana, (map.get(l.jenis_bencana) ?? 0) + dana);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [list]);

  const kebutuhanMendesak = useMemo(() => {
    const map = new Map<string, { butuh: number; penuh: number }>();
    for (const l of list) {
      for (const k of l.kebutuhan ?? []) {
        const cur = map.get(k.nama_item) ?? { butuh: 0, penuh: 0 };
        cur.butuh += k.jumlah_dibutuhkan;
        cur.penuh += k.jumlah_terpenuhi;
        map.set(k.nama_item, cur);
      }
    }
    return [...map.entries()]
      .filter(([, v]) => v.penuh < v.butuh)
      .sort((a, b) => (b[1].butuh - b[1].penuh) - (a[1].butuh - a[1].penuh))
      .slice(0, 4);
  }, [list]);

  const donasiTerbaru = useMemo(() => {
    return list
      .flatMap((l: any) => (l.donasi ?? []).map((d: any) => ({ ...d, laporan: l })))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);
  }, [list]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <UtilityStrip />
      <PublicHeader />

      <section className="mx-auto flex max-w-[1240px] flex-col gap-5 px-4 pb-7 pt-10 sm:px-6">
        <div className="flex flex-wrap items-end gap-7">
          <div className="flex max-w-[60ch] flex-col gap-2.5">
            <Eyebrow>Data publik · tanpa perlu masuk</Eyebrow>
            <h1 className="text-[clamp(34px,4.6vw,56px)] font-extrabold leading-none tracking-[-0.045em]">Uang masuk, uang keluar. <span className="bg-[linear-gradient(transparent_62%,hsl(var(--marigold))_62%_90%,transparent_90%)]">Semua terlihat.</span></h1>
            <p className="text-base leading-[1.55] text-text2 md:text-[16.5px]">
              Setiap laporan yang masuk, setiap rupiah yang tercatat, serta jumlah relawan bertugas ditampilkan apa adanya — termasuk laporan yang ditolak beserta alasannya.
            </p>
          </div>
          <div className="flex-1" />
          <div className="flex flex-col items-start gap-2.5">
            <div className="flex flex-wrap gap-[9px]">
              <button onClick={() => exportDonasiCSV(list)} className="rounded-lg border border-border-strong px-[15px] py-2.5 text-[13.5px] font-bold text-foreground hover:border-primary">
                Unduh CSV donasi
              </button>
              <button onClick={() => exportRingkasanPDF(list, totalDana)} className="rounded-lg border border-border-strong px-[15px] py-2.5 text-[13.5px] font-bold text-foreground hover:border-primary">
                Unduh ringkasan (PDF)
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-[11px] border-t border-border pt-4">
          <span className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-text3">Periode</span>
          <div className="flex overflow-hidden rounded-lg border border-border-strong">
            {([["7", "7 hari"], ["30", "30 hari"], ["semua", "Semua"]] as [Periode, string][]).map(([val, label], i) => (
              <button
                key={val}
                onClick={() => setPeriode(val)}
                className={`px-[15px] py-2 text-[13.5px] font-bold ${i === 1 ? "border-x border-border-strong" : ""} ${periode === val ? "bg-primary text-primary-foreground" : "bg-surface text-text2"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-[13px] text-text3">Angka di bawah mengikuti periode terpilih.</span>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1240px] grid-cols-1 gap-3.5 px-6 pb-9 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Dana masuk" value={formatRupiahRingkas(totalDana)} sub={`${totalDonatur} donatur · ${totalDonasi} donasi tercatat`} />
        <StatCard label="Laporan tercatat" value={String(list.length)} valueClass="text-primary" sub={`${aktifList.length} masih aktif ditangani`} />
        <StatCard label="Relawan bertugas" value={String(statistik?.penugasan_aktif ?? 0)} sub={`dari ${statistik?.total_relawan ?? 0} relawan terdaftar`} subMuted={`${statistik?.relawan_menunggu ?? 0} menunggu verifikasi`} />
        <StatCard label="Jiwa terdampak" value={list.reduce((s, l) => s + (l.jumlah_terdampak || 0), 0).toLocaleString("id-ID")} sub="tercatat pada periode ini" />
      </section>

      <section id="laporan" className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-6 py-10">
          <div className="flex flex-wrap items-end gap-5">
            <div className="flex flex-col gap-[7px]">
              <h2 className="text-2xl font-extrabold tracking-[-0.02em]">Laporan bencana</h2>
              <p className="text-[14.5px] text-text2">{list.length} laporan pada periode ini, termasuk yang ditolak beserta alasannya.</p>
            </div>
          </div>

          {list.length === 0 ? (
            <div className="py-16 text-center text-text2">Belum ada laporan pada periode ini.</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="hidden grid-cols-[1.45fr_0.8fr_180px_90px_130px_80px] gap-3.5 border-b border-border bg-surface-2 px-[18px] py-[11px] text-[11.5px] font-bold uppercase tracking-[0.06em] text-text3 md:grid">
                <span>Lokasi &amp; kejadian</span><span>Terdampak</span><span>Status</span><span>Relawan</span><span>Dana tercatat</span><span></span>
              </div>
              <div className="overflow-x-auto">
                {list.map(l => {
                  const dana = (l.donasi ?? []).filter((d: any) => d.jenis === "dana").reduce((s: number, d: any) => s + (d.jumlah_dana || 0), 0);
                  return (
                    <div key={l.id} className="grid min-w-[720px] grid-cols-[1.45fr_0.8fr_180px_90px_130px_80px] items-center gap-3.5 border-b border-border px-[18px] py-[15px] text-[14.5px] last:border-b-0">
                      <span className="flex flex-col gap-[3px]">
                        <b className="font-bold">{l.lokasi}</b>
                        <span className="text-[13px] text-text2">{JENIS_LABELS[l.jenis_bencana] ?? l.jenis_bencana} · lapor {formatTanggalSingkat(l.created_at)}</span>
                      </span>
                      <span className="font-mono text-[13.5px] text-text2">{l.jumlah_terdampak ? `${l.jumlah_terdampak.toLocaleString("id-ID")} jiwa` : "—"}</span>
                      <span className="justify-self-start"><StatusBadge status={l.status} /></span>
                      <span className="font-mono text-[13.5px] text-text2">{l.relawan_bertugas?.length ?? 0}</span>
                      <span className="font-mono text-[13.5px]">{dana > 0 ? formatRupiah(dana) : "Rp 0"}</span>
                      <button onClick={() => setOpenId(l.id)} className="justify-self-end text-[13.5px] font-bold text-primary hover:underline">Rincian</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2.5 rounded-[10px] border border-border bg-surface-2 px-[15px] py-[13px]">
            <Info size={14} className="mt-[3px] shrink-0 text-text3" />
            <span className="text-[13px] leading-[1.5] text-text2">
              Laporan yang ditolak tetap ditampilkan beserta alasannya lewat tombol "Rincian" di atas — tidak disembunyikan dari daftar publik.
            </span>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-start gap-11 px-6 py-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col gap-[18px]">
            <div className="flex flex-col gap-[7px]">
              <h2 className="text-2xl font-extrabold tracking-[-0.02em]">Dana per jenis bencana</h2>
              <p className="text-[14.5px] text-text2">Rincian {formatRupiahRingkas(totalDana)} dana tercatat pada periode ini, per jenis kejadian.</p>
            </div>
            {danaPerJenis.length === 0 ? (
              <p className="text-sm text-text2">Belum ada dana tercatat pada periode ini.</p>
            ) : (
              <div className="flex flex-col gap-3.5">
                {danaPerJenis.map(([jenis, dana], i) => {
                  const pct = totalDana > 0 ? Math.round((dana / totalDana) * 100) : 0;
                  return (
                    <div key={jenis} className="flex flex-col gap-[7px]">
                      <div className="flex items-baseline gap-2.5 text-[14.5px]">
                        <b className="font-bold">{JENIS_LABELS[jenis] ?? jenis}</b>
                        <div className="flex-1" />
                        <span className="font-mono text-[13.5px] text-text2">{pct}%</span>
                        <span className="min-w-[96px] text-right font-mono text-sm">{formatRupiah(dana)}</span>
                      </div>
                      <Bar pct={pct} color={i === 0 ? "bg-primary" : i === 1 ? "bg-accent" : "bg-border-strong"} />
                    </div>
                  );
                })}
              </div>
            )}
            <p className="border-t border-border pt-3.5 text-[13px] leading-[1.5] text-text3">
              Persentase dihitung dari dana yang tercatat masuk pada periode ini per jenis bencana. Rincian tiap donasi bisa dibuka lewat "Rincian" pada tabel laporan di atas.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3.5 rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-2.5">
                <h3 className="text-[17px] font-extrabold">Kebutuhan mendesak</h3>
                <span className="rounded-md border border-status-wait-br bg-status-wait-bg px-2 py-[3px] text-xs font-bold text-status-wait-fg">{kebutuhanMendesak.length} item</span>
              </div>
              {kebutuhanMendesak.length === 0 ? (
                <p className="text-sm text-text2">Semua kebutuhan tercatat sudah terpenuhi.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {kebutuhanMendesak.map(([nama, v], i) => {
                    const pct = Math.round((v.penuh / v.butuh) * 100);
                    return (
                      <div key={nama} className="flex flex-col gap-1.5">
                        <div className="flex items-baseline gap-2 text-sm">
                          <b className="font-bold">{nama}</b>
                          <div className="flex-1" />
                          <span className="font-mono text-[13px] text-text2">{v.penuh} / {v.butuh}</span>
                        </div>
                        <Bar pct={pct} color={i < 2 ? "bg-primary" : "bg-border-strong"} />
                      </div>
                    );
                  })}
                </div>
              )}
              <Link href="/donatur" className="rounded-[9px] bg-primary py-3 text-center text-[14.5px] font-bold text-primary-foreground hover:bg-primary-hover hover:no-underline">
                Donasi untuk kebutuhan ini
              </Link>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
              <h3 className="text-[17px] font-extrabold">Status relawan</h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-baseline gap-2.5">
                  <span>Terverifikasi</span>
                  <div className="flex-1 border-b border-dotted border-border-strong" />
                  <b className="font-mono font-semibold">{statistik?.relawan_terverifikasi ?? 0}</b>
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span>Menunggu verifikasi</span>
                  <div className="flex-1 border-b border-dotted border-border-strong" />
                  <b className="font-mono font-semibold">{statistik?.relawan_menunggu ?? 0}</b>
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span>Total terdaftar</span>
                  <div className="flex-1 border-b border-dotted border-border-strong" />
                  <b className="font-mono font-semibold">{statistik?.total_relawan ?? 0}</b>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-status-act-br bg-status-act-bg px-2.5 py-1 text-xs font-bold text-status-act-fg">
                  <UserCheck size={12} />
                  {statistik?.penugasan_aktif ?? 0} aktif bertugas
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-status-wait-br bg-status-wait-bg px-2.5 py-1 text-xs font-bold text-status-wait-fg">
                  <Clock size={12} />
                  {statistik?.relawan_menunggu ?? 0} menunggu verifikasi
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-6 py-10">
          <div className="flex flex-col gap-[7px]">
            <h2 className="text-2xl font-extrabold tracking-[-0.02em]">Donasi terbaru</h2>
            <p className="text-[14.5px] text-text2">Donasi dana dan barang yang baru masuk pada periode ini, langsung dari catatan sistem.</p>
          </div>
          {donasiTerbaru.length === 0 ? (
            <div className="py-10 text-center text-text2">Belum ada donasi pada periode ini.</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              {donasiTerbaru.map((d: any) => (
                <div key={d.id} className="flex flex-wrap items-center gap-3.5 border-b border-border px-[18px] py-3.5 text-sm last:border-b-0">
                  <span className="w-[110px] shrink-0 font-mono text-[13px] text-text2">{formatTanggalSingkat(d.created_at)}</span>
                  <b className="min-w-0 flex-1 font-bold">{d.nama_donatur}</b>
                  <span className="text-[13.5px] text-text2">{d.laporan.judul}</span>
                  <span className={`font-mono text-[13.5px] font-semibold ${d.jenis === "dana" ? "text-status-done-fg" : "text-text2"}`}>
                    {d.jenis === "dana" ? `+ ${formatRupiah(d.jumlah_dana)}` : `${d.jumlah_barang} × ${d.nama_barang}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-6 px-6 py-9 sm:grid-cols-3">
          <div className="flex flex-col gap-2 border-l-[3px] border-border-strong pl-4">
            <b className="text-[15px] font-extrabold">Dari mana angkanya</b>
            <p className="text-[13.5px] leading-[1.5] text-text2">Angka di halaman ini dihitung langsung dari data laporan, donasi, dan penugasan yang tersimpan di sistem — bukan ringkasan manual.</p>
          </div>
          <div className="flex flex-col gap-2 border-l-[3px] border-border-strong pl-4">
            <b className="text-[15px] font-extrabold">Siapa yang memeriksa</b>
            <p className="text-[13.5px] leading-[1.5] text-text2">Setiap laporan diverifikasi admin Pusdalops sebelum berstatus "Terverifikasi", dan penugasan relawan tercatat dengan waktu penugasan yang sebenarnya.</p>
          </div>
          <div className="flex flex-col gap-2 border-l-[3px] border-primary pl-4">
            <b className="text-[15px] font-extrabold">Menemukan kejanggalan?</b>
            <p className="text-[13.5px] leading-[1.5] text-text2">Hubungi Pusdalops BPBD Bali di <b className="font-mono">(0361) 251177</b>.</p>
          </div>
        </div>
      </section>

      <PublicFooter />

      {openId != null && <ReportDetailOverlay id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
