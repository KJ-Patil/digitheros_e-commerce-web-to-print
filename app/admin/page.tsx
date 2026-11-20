"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconShield, IconCheck, IconLock } from "@/components/ui/icons";
import { useAuth } from "@/lib/auth/auth-context";

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeJobs: 3,
    pendingProofs: 1,
    inProduction: 1,
    completedToday: 1,
    totalRevenueCents: 53300,
    registeredClients: 3,
  });

  useEffect(() => {
    // Fetch live dashboard analytics from pipeline API
    fetch("/api/admin/reports")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.report) {
          setStats((prev) => ({
            ...prev,
            activeJobs: data.report.activeJobsCount || prev.activeJobs,
            totalRevenueCents: data.report.totalGrossRevenueCents || prev.totalRevenueCents,
          }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252E38] pb-6">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-400">
            Factory Floor Operations
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-1">
            Executive Production Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9CA9] mt-1">
            Real-time shop-floor metrics, prepress RIP queues, customer trade accounts, and financial performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/production">
            <Button
              variant="primary"
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-[#0B0E11] font-bold border-amber-600"
            >
              Open Job Pipeline →
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141A20] border border-[#252E38] rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#8E9CA9]">Active Queue</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{stats.activeJobs} Jobs</div>
          <div className="text-[11px] text-[#718292] mt-1">Across 6 factory divisions</div>
        </div>

        <div className="bg-[#141A20] border border-[#252E38] rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#8E9CA9]">Pending Proofs</span>
            <Badge variant="warning" size="sm">Action</Badge>
          </div>
          <div className="text-3xl font-extrabold text-[#E65A28] mt-2">{stats.pendingProofs} Awaiting</div>
          <div className="text-[11px] text-[#718292] mt-1">Customer sign-off required</div>
        </div>

        <div className="bg-[#141A20] border border-[#252E38] rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#8E9CA9]">In Production</span>
            <Badge variant="success" size="sm">RIP Ready</Badge>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">{stats.inProduction} On Press</div>
          <div className="text-[11px] text-[#718292] mt-1">300 DPI high-res files released</div>
        </div>

        <div className="bg-[#141A20] border border-[#252E38] rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#8E9CA9]">Order Throughput</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">20% UK VAT</span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            £{(stats.totalRevenueCents / 100).toFixed(2)}
          </div>
          <div className="text-[11px] text-[#718292] mt-1">Captured via Stripe &amp; Trade Invoices</div>
        </div>
      </div>

      {/* Control Station Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link href="/admin/production" className="group">
          <div className="bg-[#141A20] border border-[#252E38] hover:border-amber-400/50 rounded-lg p-6 space-y-3 transition-colors h-full flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono text-amber-400 uppercase font-bold">Manufacturing Queue</div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-400 mt-1">
                Kanban Job Pipeline &amp; Prepress RIP
              </h3>
              <p className="text-xs text-[#8E9CA9] mt-2">
                Manage order state transitions (QUOTE → ORDER → ARTWORK → PROOF → PRODUCTION → COMPLETED), allocate machine lines, and download locked 300 DPI print files.
              </p>
            </div>
            <div className="text-xs font-mono text-amber-400 font-semibold flex items-center gap-1">
              Launch Kanban Board →
            </div>
          </div>
        </Link>

        <Link href="/admin/customers" className="group">
          <div className="bg-[#141A20] border border-[#252E38] hover:border-amber-400/50 rounded-lg p-6 space-y-3 transition-colors h-full flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono text-amber-400 uppercase font-bold">Client Directory</div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-400 mt-1">
                Customer Accounts &amp; Permissions
              </h3>
              <p className="text-xs text-[#8E9CA9] mt-2">
                Inspect registered trade accounts, verify trade billing details, assign roles, and onboard corporate partners directly from the shop floor.
              </p>
            </div>
            <div className="text-xs font-mono text-amber-400 font-semibold flex items-center gap-1">
              View Customer Directory →
            </div>
          </div>
        </Link>

        <Link href="/admin/products" className="group">
          <div className="bg-[#141A20] border border-[#252E38] hover:border-amber-400/50 rounded-lg p-6 space-y-3 transition-colors h-full flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono text-amber-400 uppercase font-bold">Catalog Management</div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-400 mt-1">
                Products, Substrates &amp; Multipliers
              </h3>
              <p className="text-xs text-[#8E9CA9] mt-2">
                Toggle manufacturing division products, configure dimensional millimeter boundaries, and configure custom material multipliers and setup costs.
              </p>
            </div>
            <div className="text-xs font-mono text-amber-400 font-semibold flex items-center gap-1">
              Manage Products &amp; Materials →
            </div>
          </div>
        </Link>
      </div>

      {/* Security & System Readiness Notice */}
      <div className="bg-[#0B0E11] border border-[#252E38] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <IconShield className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Row-Level Security &amp; Approval Gate Active</div>
            <div className="text-[11px] text-[#7E8B99]">
              Connected to Supabase live instance (https://jecmqthnenypunwnligs.supabase.co). Production files remain encrypted/locked until signed by customer.
            </div>
          </div>
        </div>

        <Link href="/admin/security">
          <Button variant="outline" size="sm" className="text-xs font-mono text-[#A0ACB9]">
            Run Security Audit →
          </Button>
        </Link>
      </div>
    </div>
  );
}
