"use client";

import React, { createContext, useContext, useState } from "react";
import { SessionUser, DEMO_USERS } from "./server-auth";

interface AuthContextType {
  user: SessionUser | null;
  isLoading: boolean;
  loginAs: (roleKey: "customer" | "customer-b" | "admin") => void;
  loginWithEmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  loginAs: () => {},
  loginWithEmail: async () => ({ success: false }),
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    if (typeof window !== "undefined") {
      const savedUserKey = localStorage.getItem("dh_session_user");
      if (savedUserKey && DEMO_USERS[savedUserKey]) {
        return DEMO_USERS[savedUserKey];
      }
    }
    return DEMO_USERS.customer;
  });
  const [isLoading, setIsLoading] = useState(false);

  const loginAs = (roleKey: "customer" | "customer-b" | "admin") => {
    const selected = DEMO_USERS[roleKey];
    if (selected) {
      setUser(selected);
      localStorage.setItem("dh_session_user", roleKey);
    }
  };

  const loginWithEmail = async (email: string) => {
    setIsLoading(true);
    // Support test credentials as defined in PRD
    if (email === "admin@digitalheroes.demo" || email.includes("admin")) {
      setUser(DEMO_USERS.admin);
      localStorage.setItem("dh_session_user", "admin");
      setIsLoading(false);
      return { success: true };
    } else if (email === "customer-b@digitalheroes.demo") {
      setUser(DEMO_USERS["customer-b"]);
      localStorage.setItem("dh_session_user", "customer-b");
      setIsLoading(false);
      return { success: true };
    } else {
      setUser(DEMO_USERS.customer);
      localStorage.setItem("dh_session_user", "customer");
      setIsLoading(false);
      return { success: true };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("dh_session_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginAs,
        loginWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
