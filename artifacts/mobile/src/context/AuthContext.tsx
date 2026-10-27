import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiFetch, setToken, clearToken, getToken } from "@/lib/api";

export type UserRole = "admin" | "relawan" | "donatur" | "pelapor";

export interface AuthUser {
  id: number;
  nama: string;
  email: string;
  role: UserRole;
}

interface RegisterInput {
  nama: string;
  email: string;
  password: string;
  role?: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await apiFetch<AuthUser>("/auth/me");
        setUser(me);
      } catch {
        await clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const u = await apiFetch<AuthUser & { token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await setToken(u.token);
    setUser(u);
    return u;
  };

  const register = async (data: RegisterInput) => {
    const u = await apiFetch<AuthUser & { token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    await setToken(u.token);
    setUser(u);
    return u;
  };

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      await clearToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
