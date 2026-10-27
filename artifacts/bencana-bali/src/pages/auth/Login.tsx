import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { TriangleIcon } from "@/components/icons/handoff-icons";

export default function Login() {
  const { login } = useAuth();
  const [location, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectTo = new URLSearchParams(location.split("?")[1] ?? "").get("redirect");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      if (redirectTo) {
        navigate(decodeURIComponent(redirectTo));
      } else if (user.role === "admin") navigate("/admin");
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
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
            <CardTitle className="text-2xl font-extrabold tracking-tight">Masuk</CardTitle>
            <CardDescription>Masuk ke akun Anda untuk mengakses platform</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
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
                Masuk
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-text2">
              Belum punya akun?{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Daftar sekarang
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
