"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/navigation/public-nav";
import { PublicFooter } from "@/components/navigation/public-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableRow, TableCell } from "@/components/ui/table";
import { Input, Select, Textarea, Label } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { DemoNotice } from "@/components/ui/demo-notice";
import {
  IconBox,
  IconTag,
  IconLock,
  IconUnlock,
  IconRefresh,
} from "@/components/ui/icons";

export default function DesignSystemPage() {
  const [btnLoading, setBtnLoading] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4EE]">
      <DemoNotice
        module="MODULE 1 — UI SYSTEM SPECIFICATION"
        note="Boutique-industrial design tokens, components, pipeline status badges, and responsive surfaces."
      />
      <PublicNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="border-b border-[#DCDAD0] pb-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#E65A28]">
                Design Specification § 12
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#13171C] mt-1">
                Boutique-Industrial Design System
              </h1>
              <p className="text-sm text-[#5B6774] mt-1 max-w-2xl">
                Engineered for Digital Heroes: High-density technical precision, confident terracotta accents,
                warm tactile oatmeal base, and zero generic e-commerce bloat.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" size="sm">
                  View Storefront
                </Button>
              </Link>
              <Link href="/admin/production">
                <Button variant="secondary" size="sm">
                  Production View
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {/* 1. Brand Tokens & Color Surfaces */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 bg-[#E65A28] rounded-none"></span>
              <h2 className="text-sm font-mono uppercase tracking-wider font-bold text-[#13171C]">
                01. Industrial Color System & Palette
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 bg-white border border-[#E2E1D9] rounded-lg">
                <div className="h-12 rounded bg-[#E65A28] mb-2 flex items-center justify-center text-white text-xs font-mono font-bold">
                  #E65A28
                </div>
                <div className="text-xs font-bold text-[#13171C]">Terracotta Accent</div>
                <div className="text-[10px] font-mono text-[#7D8A98]">Action / CTA Priority</div>
              </div>
              <div className="p-3 bg-white border border-[#E2E1D9] rounded-lg">
                <div className="h-12 rounded bg-[#13171C] mb-2 flex items-center justify-center text-white text-xs font-mono font-bold">
                  #13171C
                </div>
                <div className="text-xs font-bold text-[#13171C]">Technical Ink</div>
                <div className="text-[10px] font-mono text-[#7D8A98]">Headings & High-Spec</div>
              </div>
              <div className="p-3 bg-white border border-[#E2E1D9] rounded-lg">
                <div className="h-12 rounded bg-[#F5F4EE] border border-[#D5D4CB] mb-2 flex items-center justify-center text-[#13171C] text-xs font-mono font-bold">
                  #F5F4EE
                </div>
                <div className="text-xs font-bold text-[#13171C]">Oatmeal Canvas</div>
                <div className="text-[10px] font-mono text-[#7D8A98]">Tactile Base Surface</div>
              </div>
              <div className="p-3 bg-white border border-[#E2E1D9] rounded-lg">
                <div className="h-12 rounded bg-[#0F1317] mb-2 flex items-center justify-center text-emerald-400 text-xs font-mono font-bold">
                  #0F1317
                </div>
                <div className="text-xs font-bold text-[#13171C]">Factory Charcoal</div>
                <div className="text-[10px] font-mono text-[#7D8A98]">Admin Pipeline Console</div>
              </div>
              <div className="p-3 bg-white border border-[#E2E1D9] rounded-lg">
                <div className="h-12 rounded bg-emerald-700 mb-2 flex items-center justify-center text-white text-xs font-mono font-bold">
                  #047857
                </div>
                <div className="text-xs font-bold text-[#13171C]">Approved Green</div>
                <div className="text-[10px] font-mono text-[#7D8A98]">Unlocked For Print</div>
              </div>
              <div className="p-3 bg-white border border-[#E2E1D9] rounded-lg">
                <div className="h-12 rounded bg-amber-600 mb-2 flex items-center justify-center text-white text-xs font-mono font-bold">
                  #D97706
                </div>
                <div className="text-xs font-bold text-[#13171C]">Proof Pending</div>
                <div className="text-[10px] font-mono text-[#7D8A98]">Approval Gate Active</div>
              </div>
            </div>
          </section>

          {/* 2. Pipeline Badges & Status Indicators */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 bg-[#13171C] rounded-none"></span>
              <h2 className="text-sm font-mono uppercase tracking-wider font-bold text-[#13171C]">
                02. PRD Production Pipeline Stages & State Badges
              </h2>
            </div>
            <Card>
              <div className="mb-4">
                <p className="text-xs text-[#636F7B]">
                  Every job transitions sequentially across the strict factory pipeline:
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge variant="QUOTE">01. Quote</Badge>
                  <span className="text-xs text-[#9AA5B1]">→</span>
                  <Badge variant="ORDER">02. Order</Badge>
                  <span className="text-xs text-[#9AA5B1]">→</span>
                  <Badge variant="ARTWORK">03. Artwork</Badge>
                  <span className="text-xs text-[#9AA5B1]">→</span>
                  <Badge variant="PROOF">04. Proof</Badge>
                  <span className="text-xs text-[#9AA5B1]">→</span>
                  <Badge variant="PRODUCTION">05. Production</Badge>
                  <span className="text-xs text-[#9AA5B1]">→</span>
                  <Badge variant="COMPLETED">06. Completed</Badge>
                </div>
              </div>

              <div className="border-t border-[#ECEBE4] pt-4 mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 p-2 bg-[#FAFAF8] rounded border border-[#E2E1D9]">
                  <IconLock className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="text-xs font-bold text-[#13171C]">Approval Gate: LOCKED</div>
                    <div className="text-[10px] font-mono text-[#7B8896]">PDF generation blocked</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-emerald-50/70 rounded border border-emerald-200">
                  <IconUnlock className="w-4 h-4 text-emerald-700" />
                  <div>
                    <div className="text-xs font-bold text-emerald-950">Approval Gate: SIGNED</div>
                    <div className="text-[10px] font-mono text-emerald-800">Print files unlocked</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-sky-50/70 rounded border border-sky-200">
                  <IconRefresh className="w-4 h-4 text-sky-700" />
                  <div>
                    <div className="text-xs font-bold text-sky-950">Proof Revision: v2</div>
                    <div className="text-[10px] font-mono text-sky-800">Change request logged</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-purple-50/70 rounded border border-purple-200">
                  <IconTag className="w-4 h-4 text-purple-700" />
                  <div>
                    <div className="text-xs font-bold text-purple-950">CSV Merge: 450 Rows</div>
                    <div className="text-[10px] font-mono text-purple-800">Variable-data queue</div>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* 3. Action Buttons & Controls */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 bg-[#E65A28] rounded-none"></span>
              <h2 className="text-sm font-mono uppercase tracking-wider font-bold text-[#13171C]">
                03. Button Hierarchy & Interactive States
              </h2>
            </div>
            <Card>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary Accent</Button>
                <Button variant="secondary">Secondary Industrial</Button>
                <Button variant="outline">Technical Outline</Button>
                <Button variant="ghost">Ghost Option</Button>
                <Button variant="danger">Reject / Cancel</Button>
                <Button
                  variant="primary"
                  isLoading={btnLoading}
                  onClick={() => setBtnLoading(!btnLoading)}
                >
                  {btnLoading ? "Processing..." : "Toggle Loading"}
                </Button>
              </div>

              <div className="border-t border-[#ECEBE4] pt-4 mt-4 flex flex-wrap items-center gap-3">
                <Button variant="primary" size="sm">
                  Small Button
                </Button>
                <Button variant="primary" size="md">
                  Medium Default
                </Button>
                <Button variant="primary" size="lg">
                  Large Callout
                </Button>
              </div>
            </Card>
          </section>

          {/* 4. Form Controls & Specification Inputs */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 bg-[#13171C] rounded-none"></span>
              <h2 className="text-sm font-mono uppercase tracking-wider font-bold text-[#13171C]">
                04. Technical Form Controls & Dimension Inputs
              </h2>
            </div>
            <Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="product-type" required>
                    Product Division
                  </Label>
                  <Select
                    id="product-type"
                    options={[
                      { label: "Labels & Stickers", value: "labels" },
                      { label: "Race & Event Numbers", value: "race" },
                      { label: "MTB Boards", value: "mtb" },
                      { label: "Stamps", value: "stamps" },
                      { label: "Trophies", value: "trophies" },
                      { label: "Laser-Cut Work", value: "laser" },
                    ]}
                  />
                </div>

                <div>
                  <Label htmlFor="width" required>
                    Width (mm)
                  </Label>
                  <Input id="width" type="number" defaultValue="75" placeholder="e.g. 75" />
                </div>

                <div>
                  <Label htmlFor="height" required>
                    Height (mm)
                  </Label>
                  <Input id="height" type="number" defaultValue="50" placeholder="e.g. 50" />
                </div>

                <div>
                  <Label htmlFor="qty" required>
                    Quantity
                  </Label>
                  <Input id="qty" type="number" defaultValue="250" placeholder="e.g. 250" />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#ECEBE4] grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notes">Artwork Instruction / Special Bleed</Label>
                  <Textarea
                    id="notes"
                    rows={2}
                    placeholder="Enter custom spot UV or laser cut edge instructions..."
                  />
                </div>
                <div>
                  <Label htmlFor="error-demo">Input Error State (Validation)</Label>
                  <Input
                    id="error-demo"
                    defaultValue="0"
                    error="Quantity must be at least 25 units for this material tier."
                  />
                </div>
              </div>
            </Card>
          </section>

          {/* 5. Data Tables (Job Pipeline Sample) */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 bg-[#E65A28] rounded-none"></span>
              <h2 className="text-sm font-mono uppercase tracking-wider font-bold text-[#13171C]">
                05. Production Job Table & Spec Display
              </h2>
            </div>
            <Table
              headers={[
                "Job ID",
                "Division",
                "Customer",
                "Specs / Qty",
                "Proof State",
                "Pipeline Stage",
                "File Gate",
              ]}
            >
              <TableRow>
                <TableCell className="font-mono font-bold text-[#13171C]">
                  ORD-2026-0891
                </TableCell>
                <TableCell>Labels & Stickers</TableCell>
                <TableCell>Peak Coffee Roasters</TableCell>
                <TableCell className="font-mono text-xs">75x50mm Vinyl • 1,000 pcs</TableCell>
                <TableCell>
                  <Badge variant="success" size="sm">
                    Proof v2 Approved
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="PRODUCTION" size="sm">
                    Production
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-mono font-bold">
                    <IconUnlock className="w-3.5 h-3.5" /> UNLOCKED
                  </span>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-mono font-bold text-[#13171C]">
                  ORD-2026-0892
                </TableCell>
                <TableCell>Race Numbers</TableCell>
                <TableCell>Alpine Enduro Trail</TableCell>
                <TableCell className="font-mono text-xs">Tyvek 210x148mm • 500 pcs</TableCell>
                <TableCell>
                  <Badge variant="warning" size="sm">
                    Proof v1 Pending
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="PROOF" size="sm">
                    Proof
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-mono font-bold">
                    <IconLock className="w-3.5 h-3.5" /> LOCKED
                  </span>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-mono font-bold text-[#13171C]">
                  ORD-2026-0893
                </TableCell>
                <TableCell>MTB Boards</TableCell>
                <TableCell>RedRock Gravity Cup</TableCell>
                <TableCell className="font-mono text-xs">800μ Polypropylene • 250 pcs</TableCell>
                <TableCell>
                  <Badge variant="danger" size="sm">
                    v1 Changes Requested
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="ARTWORK" size="sm">
                    Artwork
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-rose-700 text-xs font-mono font-bold">
                    <IconLock className="w-3.5 h-3.5" /> LOCKED
                  </span>
                </TableCell>
              </TableRow>
            </Table>
          </section>

          {/* 6. Empty States & Error Alerts */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 bg-[#13171C] rounded-none"></span>
              <h2 className="text-sm font-mono uppercase tracking-wider font-bold text-[#13171C]">
                06. Empty States & System Alerts
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EmptyState
                icon={<IconBox className="w-6 h-6" />}
                title="No Pending Proofs"
                description="All your submitted artwork orders are approved or undergoing pre-flight check."
                actionLabel="Configure New Product"
                onAction={() => alert("Action triggered: Configure new product")}
              />

              <div className="space-y-4">
                <ErrorState
                  title="Approval Gate Enforcement"
                  message="Production files cannot be downloaded. Proof revision v1 has pending customer change requests. Production file generation is halted."
                  retryAction={() => alert("Verification check requested")}
                />
                <ErrorState
                  title="Variable-Data CSV Syntax Warning"
                  message="Row 142 in 'racers.csv' has missing 'Emergency Contact' column. Auto-fit cannot safely truncate required safety fields."
                />
              </div>
            </div>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
