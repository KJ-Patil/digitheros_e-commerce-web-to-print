"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { useAuth } from "@/lib/auth/auth-context";

export function AdminNav() {
  const { user } = useAuth();
  const staffName = user?.role === "admin" ? user.full_name : "Sarah Connor (Staff #04)";

  return (
    <header className="sticky top-0 z-40 bg-[#12161A] text-white border-b border-[#2A333C]">
      {/* Route guard annotation */}
      <div className="bg-[#0B0E11] px-4 py-1 text-[11px] font-mono text-[#8B98A6] flex items-center justify-between border-b border-[#1E252D]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span className="text-[#E0E5EC] font-semibold">ROLE: ADMINISTRATOR / PRODUCTION FLOOR</span>
          <span className="text-[#515E6D]">|</span>
          <span className="text-amber-400 font-semibold">[PRIVILEGED INTERNAL PIPELINE]</span>
        </div>
        <div className="hidden sm:block text-[#6E7B89]">Staff: {staffName}</div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded bg-[#E65A28] text-white flex items-center justify-center font-mono font-bold text-xs">
              DH
            </span>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">
                PRODUCTION DASHBOARD
              </span>
              <span className="text-[10px] font-mono text-[#8E9CA9] tracking-wider block">
                FACTORY PIPELINE CONTROL
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-xs font-mono uppercase tracking-wider text-[#A0ACB9]">
            <Link
              href="/admin/production"
              className="px-2.5 py-1.5 rounded bg-[#242C35] text-white font-semibold"
            >
              Job Pipeline
            </Link>
            <Link
              href="/admin/production#orders"
              className="px-2.5 py-1.5 hover:text-white transition-colors"
            >
              Order Queue
            </Link>
            <Link
              href="/admin/production#files"
              className="px-2.5 py-1.5 hover:text-white transition-colors"
            >
              Print Files
            </Link>
            <Link
              href="/admin/production#reports"
              className="px-2.5 py-1.5 hover:text-white transition-colors"
            >
              Throughput & Reports
            </Link>
            <Link
              href="/admin/security"
              className="px-2.5 py-1.5 hover:text-white transition-colors text-emerald-400 font-bold"
            >
              Security Audit
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-mono text-[#8E9CA9] hover:text-white underline"
          >
            Switch Role
          </Link>
          <Badge variant="danger" size="sm">
            Admin Cleared
          </Badge>
        </div>
      </div>
    </header>
  );
}
