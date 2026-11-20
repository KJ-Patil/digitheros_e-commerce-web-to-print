"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { useAuth } from "@/lib/auth/auth-context";

export function CustomerNav() {
  const { user } = useAuth();
  const customerName = user ? user.full_name : "Alex Miller (Demo)";
  const customerEmail = user ? user.email : "customer@digitalheroes.demo";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E2E1D9]">
      {/* Route guard annotation */}
      <div className="bg-[#FAF9F5] border-b border-[#ECEBE4] px-4 py-1 text-[11px] font-mono text-[#6A7684] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>ROLE: REGISTERED CUSTOMER</span>
          <span className="text-[#ACB7C4]">|</span>
          <span className="text-emerald-800 font-semibold">[RLS ISOLATION ACTIVE]</span>
        </div>
        <div className="hidden sm:block">Session: {customerName} ({customerEmail})</div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded bg-[#13171C] text-white flex items-center justify-center font-mono font-bold text-xs">
              DH
            </span>
            <span className="font-bold text-sm tracking-tight text-[#13171C]">
              CUSTOMER PORTAL
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-xs font-mono uppercase tracking-wider text-[#4D5866]">
            <Link
              href="/customer/dashboard"
              className="px-2.5 py-1.5 rounded bg-[#F2F1EA] text-[#13171C] font-semibold"
            >
              Overview
            </Link>
            <Link
              href="/customer/dashboard#proofs"
              className="px-2.5 py-1.5 hover:text-[#13171C] transition-colors"
            >
              Proofs & Versions
            </Link>
            <Link
              href="/customer/dashboard#alerts"
              className="px-2.5 py-1.5 hover:text-[#13171C] transition-colors text-[#E65A28] font-bold"
            >
              Alerts
            </Link>
            <Link
              href="/customer/dashboard#designs"
              className="px-2.5 py-1.5 hover:text-[#13171C] transition-colors"
            >
              Saved Designs
            </Link>
            <Link
              href="/customer/dashboard#orders"
              className="px-2.5 py-1.5 hover:text-[#13171C] transition-colors"
            >
              Order History
            </Link>
            <Link
              href="/customer/dashboard#invoices"
              className="px-2.5 py-1.5 hover:text-[#13171C] transition-colors"
            >
              Invoices
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-mono text-[#576472] hover:text-[#13171C] underline"
          >
            Switch Role
          </Link>
          <Badge variant="info" size="sm">
            {user?.role === "admin" ? "Admin Preview" : "Customer Mode"}
          </Badge>
        </div>
      </div>
    </header>
  );
}
