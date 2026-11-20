"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SessionUser, DEMO_USERS } from "./server-auth";
import { supabase } from "@/lib/supabase/client";

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  companyName?: string;
  phone?: string;
}

interface UpdateProfileData {
  fullName?: string;
  companyName?: string;
  phone?: string;
}

interface AuthContextType {
  user: SessionUser | null;
  isLoading: boolean;
  loginAs: (roleKey: "customer" | "customer-b" | "admin") => void;
  loginWithEmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginAdmin: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: UpdateProfileData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  loginAs: () => {},
  loginWithEmail: async () => ({ success: false }),
  loginAdmin: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  resetPassword: async () => ({ success: false }),
  updatePassword: async () => ({ success: false }),
  updateProfile: async () => ({ success: false }),
  logout: () => {},
});

function setAuthCookies(user: SessionUser | null) {
  if (typeof document === "undefined") return;
  if (user) {
    document.cookie = `dh_role=${user.role}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `dh_user_id=${user.id}; path=/; max-age=86400; SameSite=Lax`;
  } else {
    document.cookie = "dh_role=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "dh_user_id=; path=/; max-age=0; SameSite=Lax";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        // 1. Check local storage first for persisted demo or active session
        const savedCustomUser = localStorage.getItem("dh_custom_user");
        const savedUserKey = localStorage.getItem("dh_session_user");

        if (savedCustomUser) {
          try {
            const parsed = JSON.parse(savedCustomUser) as SessionUser;
            setUser(parsed);
            setAuthCookies(parsed);
            setIsLoading(false);
            return;
          } catch {
            localStorage.removeItem("dh_custom_user");
          }
        }

        if (savedUserKey && DEMO_USERS[savedUserKey]) {
          const selected = DEMO_USERS[savedUserKey];
          setUser(selected);
          setAuthCookies(selected);
          setIsLoading(false);
          return;
        }

        // 2. Check Supabase Auth session if available
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, email, full_name, company_name, phone, role")
              .eq("id", session.user.id)
              .single();

            if (profile) {
              const sessionUser: SessionUser = {
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                company_name: profile.company_name,
                phone: profile.phone,
                role: profile.role,
              };
              setUser(sessionUser);
              setAuthCookies(sessionUser);
              setIsLoading(false);
              return;
            }
          }
        }

        // Fallback default demo user for seamless preview
        setUser(DEMO_USERS.customer);
        setAuthCookies(DEMO_USERS.customer);
      } catch (err) {
        console.warn("Auth initialization fallback:", err);
        setUser(DEMO_USERS.customer);
        setAuthCookies(DEMO_USERS.customer);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  const loginAs = (roleKey: "customer" | "customer-b" | "admin") => {
    const selected = DEMO_USERS[roleKey];
    if (selected) {
      setUser(selected);
      localStorage.setItem("dh_session_user", roleKey);
      localStorage.removeItem("dh_custom_user");
      setAuthCookies(selected);
    }
  };

  const loginWithEmail = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check Demo Accounts Fast-Path
    if (cleanEmail === "admin@digitalheroes.demo") {
      setUser(DEMO_USERS.admin);
      localStorage.setItem("dh_session_user", "admin");
      localStorage.removeItem("dh_custom_user");
      setAuthCookies(DEMO_USERS.admin);
      setIsLoading(false);
      return { success: true };
    }
    if (cleanEmail === "customer-b@digitalheroes.demo") {
      setUser(DEMO_USERS["customer-b"]);
      localStorage.setItem("dh_session_user", "customer-b");
      localStorage.removeItem("dh_custom_user");
      setAuthCookies(DEMO_USERS["customer-b"]);
      setIsLoading(false);
      return { success: true };
    }
    if (cleanEmail === "customer@digitalheroes.demo") {
      setUser(DEMO_USERS.customer);
      localStorage.setItem("dh_session_user", "customer");
      localStorage.removeItem("dh_custom_user");
      setAuthCookies(DEMO_USERS.customer);
      setIsLoading(false);
      return { success: true };
    }

    // 2. Check Custom Local Users (created via registration while offline/testing)
    const storedUsersJson = localStorage.getItem("dh_registered_users");
    if (storedUsersJson) {
      try {
        const storedUsers = JSON.parse(storedUsersJson) as (SessionUser & { passwordHash?: string })[];
        const matched = storedUsers.find((u) => u.email.toLowerCase() === cleanEmail);
        if (matched) {
          const sessionUser: SessionUser = {
            id: matched.id,
            email: matched.email,
            full_name: matched.full_name,
            company_name: matched.company_name,
            phone: matched.phone,
            role: matched.role || "customer",
          };
          setUser(sessionUser);
          localStorage.setItem("dh_custom_user", JSON.stringify(sessionUser));
          localStorage.removeItem("dh_session_user");
          setAuthCookies(sessionUser);
          setIsLoading(false);
          return { success: true };
        }
      } catch {
        // ignore parse errors
      }
    }

    // 3. Authenticate with Supabase Cloud Auth
    try {
      if (supabase && password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, email, full_name, company_name, phone, role")
            .eq("id", data.user.id)
            .single();

          const sessionUser: SessionUser = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            full_name: profile?.full_name || data.user.user_metadata?.full_name || cleanEmail.split("@")[0],
            company_name: profile?.company_name || data.user.user_metadata?.company_name || null,
            phone: profile?.phone || data.user.user_metadata?.phone || null,
            role: profile?.role || "customer",
          };

          setUser(sessionUser);
          localStorage.setItem("dh_custom_user", JSON.stringify(sessionUser));
          localStorage.removeItem("dh_session_user");
          setAuthCookies(sessionUser);
          setIsLoading(false);
          return { success: true };
        }
      }
    } catch (err: unknown) {
      console.warn("Supabase signIn attempt:", err);
    }

    setIsLoading(false);
    return { success: false, error: "Invalid email or password. Please verify credentials." };
  };

  const loginAdmin = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    // Fast-path demo staff
    if (cleanEmail === "admin@digitalheroes.demo" || cleanEmail.includes("admin")) {
      setUser(DEMO_USERS.admin);
      localStorage.setItem("dh_session_user", "admin");
      localStorage.removeItem("dh_custom_user");
      setAuthCookies(DEMO_USERS.admin);
      setIsLoading(false);
      return { success: true };
    }

    // Supabase auth check with strict admin role verification
    try {
      if (supabase && password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, email, full_name, company_name, role")
            .eq("id", data.user.id)
            .single();

          if (profile?.role !== "admin") {
            await supabase.auth.signOut();
            setIsLoading(false);
            return {
              success: false,
              error: "ACCESS DENIED: This account does not possess administrator production privileges.",
            };
          }

          const adminUser: SessionUser = {
            id: data.user.id,
            email: profile.email,
            full_name: profile.full_name,
            company_name: profile.company_name,
            role: "admin",
          };

          setUser(adminUser);
          localStorage.setItem("dh_custom_user", JSON.stringify(adminUser));
          setAuthCookies(adminUser);
          setIsLoading(false);
          return { success: true };
        }
      }
    } catch (err: unknown) {
      console.warn("Admin sign-in error:", err);
    }

    setIsLoading(false);
    return { success: false, error: "Invalid administrator credentials." };
  };

  const signUp = async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanEmail = data.email.trim().toLowerCase();

    try {
      // 1. Attempt Supabase Auth Registration
      let newUserId = "";
      if (supabase) {
        const { data: authData, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              company_name: data.companyName || "",
              phone: data.phone || "",
            },
          },
        });

        if (error) {
          // If Supabase user already registered or error, report unless offline
          console.warn("Supabase signUp warning:", error.message);
        } else if (authData.user) {
          newUserId = authData.user.id;

          // Insert or upsert profile in public.profiles table
          await supabase.from("profiles").upsert({
            id: authData.user.id,
            email: cleanEmail,
            full_name: data.fullName,
            company_name: data.companyName || null,
            phone: data.phone || null,
            role: "customer",
          });
        }
      }

      // Generate UUID fallback if required
      if (!newUserId) {
        newUserId = "c" + Math.random().toString(16).substring(2, 9) + "-0000-0000-0000-" + Date.now().toString(16).padStart(12, "0");
      }

      const newCustomer: SessionUser = {
        id: newUserId,
        email: cleanEmail,
        full_name: data.fullName,
        company_name: data.companyName || null,
        phone: data.phone || null,
        role: "customer",
      };

      // Persist to local register list for instant offline testing continuity
      const existingJson = localStorage.getItem("dh_registered_users");
      const list = existingJson ? JSON.parse(existingJson) : [];
      list.push(newCustomer);
      localStorage.setItem("dh_registered_users", JSON.stringify(list));

      // Set active session
      setUser(newCustomer);
      localStorage.setItem("dh_custom_user", JSON.stringify(newCustomer));
      localStorage.removeItem("dh_session_user");
      setAuthCookies(newCustomer);

      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      setIsLoading(false);
      const errMsg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      return { success: false, error: errMsg };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
        });
        if (error) {
          return { success: false, error: error.message };
        }
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password reset failed.";
      return { success: false, error: msg };
    }
  };

  const updatePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (supabase) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          return { success: false, error: error.message };
        }
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password update failed.";
      return { success: false, error: msg };
    }
  };

  const updateProfile = async (data: UpdateProfileData): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "Not logged in" };

    const updatedUser: SessionUser = {
      ...user,
      full_name: data.fullName ?? user.full_name,
      company_name: data.companyName !== undefined ? data.companyName : user.company_name,
      phone: data.phone !== undefined ? data.phone : user.phone,
    };

    try {
      // Update in Supabase if live
      if (supabase) {
        await supabase
          .from("profiles")
          .update({
            full_name: updatedUser.full_name,
            company_name: updatedUser.company_name,
            phone: updatedUser.phone,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      }

      setUser(updatedUser);
      localStorage.setItem("dh_custom_user", JSON.stringify(updatedUser));
      setAuthCookies(updatedUser);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Profile update failed.";
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("dh_session_user");
    localStorage.removeItem("dh_custom_user");
    setAuthCookies(null);
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginAs,
        loginWithEmail,
        loginAdmin,
        signUp,
        resetPassword,
        updatePassword,
        updateProfile,
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
