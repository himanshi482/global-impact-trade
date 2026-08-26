"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => ({ ok: false }),
  register: async () => ({ ok: false }),
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      setUser(data.user || null);
    } catch (err) {
      console.error("Failed to load session", err);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  /**
   * @returns {Promise<{ok: true}|{ok: false, error: string}>}
   */
  const login = async ({ email, password }) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || "Login failed" };
      }
      setUser(data.user);
      window.location.assign("/dashboard");
      return { ok: true };
    } catch (err) {
      console.error("Login request failed", err);
      return { ok: false, error: "Network error. Please try again." };
    }
  };

  /**
   * @returns {Promise<{ok: true}|{ok: false, error: string}>}
   */
  const register = async (payload) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || "Registration failed" };
      }
      setUser(data.user);
      window.location.assign("/dashboard");
      return { ok: true };
    } catch (err) {
      console.error("Register request failed", err);
      return { ok: false, error: "Network error. Please try again." };
    }
  };

  const logout = async () => {
    setUser(null);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      console.warn("Logout request failed", err);
    }
    router.replace("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
