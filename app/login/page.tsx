"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/navigation/public-nav";
import { PublicFooter } from "@/components/navigation/public-footer";
import { DemoNotice } from "@/components/ui/demo-notice";
import { IconShield, IconUser, IconLock } from "@/components/ui/icons";

export default function LoginPage() {
  const router = useRouter();
  const { user, loginAs, loginWithEmail, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const res = await loginWithEmail(email, password);
    if (res.success) {
      setMsg("Authenticated successfully.");
      if (email.includes("admin")) {
        router.push("/admin/production");
      } else {
        router.push("/customer/dashboard");
      }
    }
  };

  const handleQuickLogin = (roleKey: "customer" | "customer-b" | "admin", redirectPath: string) => {
    loginAs(roleKey);
    setMsg(`Switched session to ${roleKey.toUpperCase()}`);
    setTimeout(() => {
      router.push(redirectPath);
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4EE]">
      <DemoNotice
        module="MODULE 2 — AUTH & DATABASE LAYER"
        note="Supabase Authentication & Row-Level Security (RLS) active. Select or toggle your session role below."
      />
      <PublicNav />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#E65A28]">
            Authentication § 03
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#13171C] mt-1">
            Access Digital Heroes
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6977] mt-2">
            One unified backend with strict server-side Row Level Security separating Public Visitors,
            Registered Customers, and Factory Production Staff.
          </p>
        </div>

        {/* Current Active Session State */}
        {user && (
          <div className="mb-8 p-4 bg-white border border-[#E2E1D9] rounded-lg flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FAF9F5] border border-[#D5D4CB] flex items-center justify-center text-[#E65A28]">
                <IconUser className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-mono text-[#768391]">Active Authenticated Session:</div>
                <div className="text-sm font-bold text-[#13171C]">
                  {user.full_name} ({user.email})
                </div>
                <div className="text-[11px] text-[#556372]">{user.company_name}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant={user.role === "admin" ? "danger" : "info"} size="md">
                Role: {user.role.toUpperCase()}
              </Badge>
              <Button variant="outline" size="sm" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
        )}

        {msg && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-xs font-mono">
            ✓ {msg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Option A: Quick Test Logins for Evaluator */}
          <Card className="border-l-4 border-l-[#E65A28]">
            <div className="flex items-center gap-2 mb-3">
              <IconShield className="w-4 h-4 text-[#E65A28]" />
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#13171C]">
                Evaluation Quick Logins
              </h3>
            </div>
            <p className="text-xs text-[#5D6B7A] mb-4">
              Instantly activate seeded roles to test Row-Level Security isolation and pipeline permissions:
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleQuickLogin("customer", "/customer/dashboard")}
                className="w-full text-left p-3 rounded border border-[#E2E1D9] bg-[#FAF9F5] hover:bg-[#F2F1EA] transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#13171C] group-hover:text-[#E65A28]">
                    Customer A: Alex Miller
                  </span>
                  <Badge variant="info" size="sm">
                    Customer
                  </Badge>
                </div>
                <div className="text-[11px] font-mono text-[#768391] mt-0.5">
                  customer@digitalheroes.demo (Peak Coffee)
                </div>
                <div className="text-[10px] text-emerald-700 mt-1">
                  → Has 2 active orders (1 in production, 1 proof approved)
                </div>
              </button>

              <button
                onClick={() => handleQuickLogin("customer-b", "/customer/dashboard")}
                className="w-full text-left p-3 rounded border border-[#E2E1D9] bg-[#FAF9F5] hover:bg-[#F2F1EA] transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#13171C] group-hover:text-[#E65A28]">
                    Customer B: Jordan Lee
                  </span>
                  <Badge variant="info" size="sm">
                    Customer
                  </Badge>
                </div>
                <div className="text-[11px] font-mono text-[#768391] mt-0.5">
                  customer-b@digitalheroes.demo (Alpine Enduro)
                </div>
                <div className="text-[10px] text-amber-700 mt-1">
                  → RLS Test Target: Cannot see Customer A&apos;s data
                </div>
              </button>

              <button
                onClick={() => handleQuickLogin("admin", "/admin/production")}
                className="w-full text-left p-3 rounded border border-[#13171C] bg-[#12161A] text-white hover:bg-[#1C2228] transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-[#E65A28]">
                    Staff Admin: Sarah Connor
                  </span>
                  <Badge variant="danger" size="sm">
                    Admin
                  </Badge>
                </div>
                <div className="text-[11px] font-mono text-[#9BA8B6] mt-0.5">
                  admin@digitalheroes.demo (Factory Floor)
                </div>
                <div className="text-[10px] text-amber-300 mt-1">
                  → Full access to production queue & file download
                </div>
              </button>
            </div>
          </Card>

          {/* Option B: Standard Email/Password Form */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <IconLock className="w-4 h-4 text-[#13171C]" />
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#13171C]">
                Sign In With Credentials
              </h3>
            </div>
            <p className="text-xs text-[#5D6B7A] mb-4">
              Enter your registered customer or staff credentials:
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email Address</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="e.g. customer@digitalheroes.demo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="login-pass">Password</Label>
                <Input
                  id="login-pass"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Button variant="primary" type="submit" size="md">
                  Sign In →
                </Button>
                <Link
                  href="/"
                  className="text-xs font-mono text-[#6A7785] hover:text-[#13171C] underline"
                >
                  Continue as Visitor
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
