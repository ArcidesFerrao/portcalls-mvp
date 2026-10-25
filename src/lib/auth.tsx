import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { UNAUTHORIZED_EVENT } from "./api";
import type { Role } from "./roles";

export type { Role };

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role: Role;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

// O cookie de sessão é httpOnly: o JavaScript nunca o lê.
// Por isso perguntamos ao servidor quem somos (GET /api/auth/me).
async function request(path: string, init?: RequestInit) {
  return fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await request("/auth/me");
      setUser(res.ok ? ((await res.json()) as AuthUser) : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Se a sessão expirar a meio do uso, qualquer pedido da API responde 401
  // e o api.ts emite este evento. Limpar o utilizador faz o ProtectedRoute
  // mandar para o login.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Não foi possível iniciar sessão");
      }
      await refresh();
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await request("/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuth tem de ser usado dentro de <AuthProvider>");
  return ctx;
}
