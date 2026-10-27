import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, type UserRole } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Heart, FileText, Check } from "lucide-react";
import { TriangleIcon } from "@/components/icons/handoff-icons";
import { cn } from "@/lib/utils";

const ROLES: { value: UserRole; label: string; desc: string; icon: React.ElementType; color: string }[] = [
  {
    value: "donatur",
    label: "Donatur",
    desc: "Donasikan barang atau dana untuk membantu korban bencana",
    icon: Heart,
    color: "text-accent-ink",
  },
  {
    value: "pelapor",
    label: "Pelapor",
    desc: "Ketua RT/Banjar yang ingin melaporkan kejadian bencana",
    icon: FileText,
    color: "text-primary",
  },
];

export default function Register() {
  const { register } = useAuth();
  const [, navigate] = useLocation();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("donatur");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register({ nama, email, password, role });
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "relawan") navigate("/relawan");
      else if (user.role === "pelapor") navigate("/pelapor");
      else navigate("/donatur");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <Link href="/">
            <div className="inline-flex cursor-pointer items-center gap-[11px]">
              <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-primary">
                <TriangleIcon size={15} className="text-primary-foreground" />
              </span>
              <span className="flex flex-col items-start leading-[1.15]">
                <b className="text-[17px] font-extrabold tracking-[-0.015em] text-foreground">Bali-Rief</b>
                <span className="text-[11.5px] font-medium text-text3">Koordinasi Bencana Bali</span>
              </span>
            </div>
          </Link>
        </div>

        <Card className="rounded-[12px] border border-border bg-surface shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-extrabold tracking-tight">Buat Akun</CardTitle>
            <CardDescription>Daftarkan diri Anda dan pilih peran dalam platform koordinasi bencana</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>Pilih Peran Anda</Label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map(r => {
                    const Icon = r.icon;
                    const selected = role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={cn(
                          "relative flex flex-col items-start gap-1 rounded-[10px] border p-3 text-left transition-colors",
                          selected
                            ? "border-primary bg-primary-soft"
                            : "border-border hover:border-border-strong"
                        )}
                      >
                        {selected && (
                          <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                            <Check className="h-2.5 w-2.5 text-primary-foreground" />
                          </span>
                        )}
                        <Icon className={cn("h-5 w-5", r.color)} />
                        <span className="text-sm font-semibold">{r.label}</span>
                        <span className="text-xs leading-tight text-text2">{r.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input
                  id="nama"
                  placeholder="Nama lengkap Anda"
                  value={nama}
                  onChange={e => setNama(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text3 hover:text-foreground"
                    onClick={() => setShowPass(v => !v)}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-[8px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Daftar sebagai {ROLES.find(r => r.value === role)?.label}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-text2">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Masuk
              </Link>
            </p>
            <p className="mt-2 text-center text-sm text-text2">
              <Link href="/" className="hover:underline">
                ← Kembali ke beranda
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
