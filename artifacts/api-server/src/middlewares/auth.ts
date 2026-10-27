import jwt from "jsonwebtoken";

// Dipakai untuk klien yang tidak bisa persist cookie session (mis. mobile/React Native).
// Selain SESSION_SECRET, deploy production sebaiknya set JWT_SECRET sendiri.
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "bali-tanggap-bencana-secret";
const JWT_EXPIRES_IN = "30d";

export interface AuthContext {
  userId: number;
  role: string;
}

export function signAuthToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function getTokenAuth(req: any): AuthContext | null {
  const header = req.headers?.authorization;
  if (typeof header !== "string" || !header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (typeof payload?.userId !== "number" || typeof payload?.role !== "string") return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

// Sumber kebenaran sesi: cookie session (web) ATAU Bearer token (mobile). Session diprioritaskan
// kalau ada; kalau tidak, coba token. Hasilnya dipasang di req.auth oleh requireAuth/requireRole.
export function getAuthContext(req: any): AuthContext | null {
  const session = req.session;
  if (session?.userId) {
    return { userId: session.userId, role: session.role };
  }
  return getTokenAuth(req);
}

export function requireAuth(req: any, res: any, next: any) {
  const auth = getAuthContext(req);
  if (!auth) {
    return res.status(401).json({ message: "Belum login" });
  }
  req.auth = auth;
  return next();
}

export function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    const auth = getAuthContext(req);
    if (!auth) {
      return res.status(401).json({ message: "Belum login" });
    }
    if (!roles.includes(auth.role)) {
      return res.status(403).json({ message: "Tidak diizinkan" });
    }
    req.auth = auth;
    return next();
  };
}
