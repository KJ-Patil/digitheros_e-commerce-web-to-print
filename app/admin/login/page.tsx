"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { IconShield, IconLock } from "@/components/ui/icons";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, loginAdmin, loginAs, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError(null);
    setIsSubmitting(true);
    const res = await loginAdmin(email, password);
    setIsSubmitting(false);

    if (res.success) {
      router.push("/admin/production");
    } else {
      setError(res.error || "Authentication failed. Administrator clearance required.");
    }
  };

  const handleDemoAdmin = () => {
    loginAs("admin");
    router.push("/admin/production");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E11] text-white">
      {/* Top Banner */}
      <header className="border-b border-[#1E252D] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded bg-[#E65A28] text-white flex items-center justify-center font-mono font-bold text-sm">
            DH
          </span>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block">
              DIGITAL HEROES FACTORY
            </span>
            <span className="text-[10px] font-mono text-amber-400 tracking-wider block">
              INTERNAL PRODUCTION CLEARANCE
            </span>
          </div>
        </div>

        <Link
          href="/login"
          className="text-xs font-mono text-[#8E9CA9] hover:text-white underline"
        >
          ← Return to Customer Portal
        </Link>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-16 flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[#1C232B] border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <IconLock className="w-6 h-6" />
          </div>
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-400">
            Restricted Area
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1">
            Administrator Sign In
          </h1>
          <p className="text-xs text-[#8E9CA9] mt-2">
            Privileged access for factory floor operators, prepress RIP controllers, and operations managers.
          </p>
        </div>

        {user && user.role === "admin" && (
          <div className="mb-6 p-4 bg-[#141A20] border border-amber-500/30 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-xs text-[#8E9CA9]">Active Admin Session:</div>
              <div className="text-sm font-bold text-white">{user.full_name}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push("/admin/production")}
              >
                Go to Pipeline →
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
        )}

        <div className="bg-[#141A20] border border-[#252E38] rounded-xl p-6 shadow-2xl space-y-6">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded text-rose-300 text-xs font-mono flex items-start gap-2">
              <span className="shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-mono font-medium text-[#A0ACB9] uppercase tracking-wider mb-1.5"
              >
                Staff Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                placeholder="admin@digitalheroes.demo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B0E11] border border-[#2D3844] rounded px-3 py-2 text-sm text-white placeholder-[#5A6775] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-mono font-medium text-[#A0ACB9] uppercase tracking-wider"
                >
                  Password
                </label>
              </div>
              <input
                id="admin-password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B0E11] border border-[#2D3844] rounded px-3 py-2 text-sm text-white placeholder-[#5A6775] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                required
              />
            </div>

            <Button
              variant="primary"
              type="submit"
              size="lg"
              className="w-full justify-center bg-amber-500 hover:bg-amber-600 text-[#0B0E11] font-bold border-amber-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verifying Credentials..." : "Authenticate Admin Session →"}
            </Button>
          </form>

          {/* Quick Demo Staff Login */}
          <div className="pt-4 border-t border-[#1E252D]">
            <div className="text-[11px] font-mono text-[#788695] mb-2 uppercase tracking-wider">
              Evaluation Fast-Path
            </div>
            <button
              onClick={handleDemoAdmin}
              className="w-full text-left p-3 rounded border border-amber-500/30 bg-[#1A222B] hover:bg-[#202B36] transition-colors cursor-pointer group flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-amber-400">
                  Staff Admin: Sarah Connor
                </div>
                <div className="text-[11px] font-mono text-[#8E9CA9]">
                  admin@digitalheroes.demo (Full Production Rights)
                </div>
              </div>
              <Badge variant="danger" size="sm">
                Staff
              </Badge>
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-[#6B7988]">
            Not a factory administrator?{" "}
            <Link href="/login" className="text-[#E65A28] font-bold hover:underline">
              Customer Sign In
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
