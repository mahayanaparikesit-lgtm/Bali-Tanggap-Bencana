import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "bali-rief-auth-token";

// expo-secure-store has no web implementation (throws "not a function") —
// only relevant for the browser preview (expo start --web), never a real
// deploy target, so localStorage is an acceptable fallback there.
const isWeb = Platform.OS === "web";

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

if (!BASE) {
  // Fails loudly at import time instead of every request silently hitting "undefined/api/...".
  console.warn("EXPO_PUBLIC_API_URL is not set — API calls will fail. Set it in .env.");
}

export async function getToken(): Promise<string | null> {
  if (isWeb) return localStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  if (isWeb) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T = unknown>(path: string, opts?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts?.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, { ...opts, headers });
  } catch {
    throw new ApiError("Tidak bisa terhubung ke server. Periksa koneksi internet Anda.", 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.message || "Terjadi kesalahan", res.status);
  }
  return data as T;
}
