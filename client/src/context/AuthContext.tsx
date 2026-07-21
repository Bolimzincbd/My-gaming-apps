import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../api/http";
import type { User } from "../types";

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  region: string;
  languages: string[];
  playstyle: string;
  mlbbRole: string;
  mlbbLane: string;
  availability: string;
  trustScore?: number;
  preferredGames: string[];
  preferredModes: string[];
  gameRanks: Array<{ game: string; rank: string; rankValue: number }>;
  role: "user" | "seller";
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = "gmm_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api<{ user: User }>("/auth/me", {}, token);
        setUser(response.user);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [token]);

  const persist = (nextToken: string, nextUser: User) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const login = async (payload: { email: string; password: string }) => {
    const response = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    persist(response.token, response.user);
  };

  const register = async (payload: RegisterPayload) => {
    const response = await api<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    persist(response.token, response.user);
  };

  const refreshUser = async () => {
    if (!token) return;
    const response = await api<{ user: User }>("/auth/me", {}, token);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, token, loading, login, register, logout, refreshUser, setUser }), [user, token, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
