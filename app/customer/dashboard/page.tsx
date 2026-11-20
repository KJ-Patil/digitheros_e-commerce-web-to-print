"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Table, TableRow, TableCell } from "@/components/ui/table";
import {
  IconDownload,
} from "@/components/ui/icons";

export default function CustomerDashboardPage() {
  const [reorderStatus, setReorderStatus] = useState<string | null>(null);

  const handleReorder = (orderId: string) => {
    setReorderStatus(`One-click reorder initiated for ${orderId}. Added to checkout cart.`);
    setTimeout(() => setReorderStatus(null), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Customer Header & Profile Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DCDAD0] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#E65A28]">
              Customer Area § 10
            </span>
            <span className="text-xs text-[#8F9BA8]">•</span>
            <span className="text-xs font-mono text-[#576472]">Account ID: CUST-0941</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#13171C] mt-1">
            My Print Orders & Proofs
          </h1>
          <p className="text-sm text-[#5B6774] mt-1">
            Manage your past jobs, review active proofs, approve revisions, and reorder from saved artwork.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/#calculator">
            <Button variant="primary" size="sm">
              + New Print Configuration
            </Button>
          </Link>
        </div>
      </div>

      {reorderStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-xs font-mono font-medium flex items-center justify-between">
          <span>✓ {reorderStatus}</span>
          <button onClick={() => setReorderStatus(null)} className="font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Role Security Callout Banner */}
      <div className="p-3 bg-[#EAE9E1] border border-[#D5D4CB] rounded text-xs text-[#374151] flex items-center gap-2">
        <span className="font-mono font-bold text-[#13171C] uppercase">[Security Notice]</span>
        <span>
          Customer role boundaries active. You are viewing strictly your own profile and proof versions.
          Internal production files remain confidential to staff.
        </span>
      </div>

      {/* Stats / Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card badge="TOTAL">
          <div className="text-xs font-mono text-[#636F7B] uppercase">Active Orders</div>
          <div className="text-2xl font-extrabold text-[#13171C] mt-1">3 Jobs</div>
          <div className="text-[11px] text-[#7E8B99] mt-1">1 in Proof, 2 in Production</div>
        </Card>

        <Card badge="APPROVAL">
          <div className="text-xs font-mono text-[#636F7B] uppercase">Pending Proofs</div>
          <div className="text-2xl font-extrabold text-[#E65A28] mt-1">1 Action</div>
          <div className="text-[11px] text-[#7E8B99] mt-1">Requires your review</div>
        </Card>

        <Card badge="SAVED">
          <div className="text-xs font-mono text-[#636F7B] uppercase">Saved Designs</div>
          <div className="text-2xl font-extrabold text-[#13171C] mt-1">5 Templates</div>
          <div className="text-[11px] text-[#7E8B99] mt-1">Ready for 1-click repeat</div>
        </Card>

        <Card badge="BILLING">
          <div className="text-xs font-mono text-[#636F7B] uppercase">Total Invoiced</div>
          <div className="text-2xl font-extrabold text-[#13171C] mt-1">£ 1,485.00</div>
          <div className="text-[11px] text-[#7E8B99] mt-1">VAT receipts available</div>
        </Card>
      </div>

      {/* Module: Active Proofs & Version State */}
      <section id="proofs" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#E65A28]"></span>
            <h2 className="text-base font-bold text-[#13171C] tracking-tight">
              Active Proofs & Version Status (§ 08)
            </h2>
          </div>
          <span className="text-xs font-mono text-[#768391]">Version tracking: v1, v2, v3</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-[#E65A28]">
            <CardHeader
              tag="PROOF APPROVAL REQUIRED"
              title="ORD-2026-0892: Alpine Enduro Trail Bibs"
              subtitle="Division: Race & Event Numbers • Dimension: 210 x 148 mm"
              action={<Badge variant="PROOF">v1 Waiting</Badge>}
            />
            <div className="bg-[#FAF9F5] border border-[#E2E1D9] rounded p-3 mb-4 text-xs font-mono space-y-1">
              <div>Version: v1 (Rendered 2026-03-24 10:15)</div>
              <div>Safety Bleed: 3mm • Material: 100gsm Tyvek Tearproof</div>
              <div>Variable Data: 500 runners mapped via CSV</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => alert("Proof approved! Timestamp logged and unlocked for production.")}
              >
                ✓ Approve Proof v1
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alert("Change request form modal opened.")}
              >
                Request Change
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => alert("High-resolution proof preview opened.")}
              >
                View PDF Preview
              </Button>
            </div>
          </Card>

          <Card className="border-l-4 border-l-emerald-600">
            <CardHeader
              tag="APPROVED & LOCKED"
              title="ORD-2026-0891: Peak Coffee Roasters Gloss Labels"
              subtitle="Division: Labels & Stickers • Dimension: 75 x 50 mm"
              action={<Badge variant="success">v2 Approved</Badge>}
            />
            <div className="bg-[#FAF9F5] border border-[#E2E1D9] rounded p-3 mb-4 text-xs font-mono space-y-1">
              <div>Version: v2 (Approved by info@peakcoffee.co.uk)</div>
              <div>Signed At: 2026-03-23 16:42 • Fingerprint: #9f8c12a</div>
              <div>Status: In Production queue on Roland TrueVIS VG3</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-800 font-medium">
                Production file unlocked for printing. No further edits permitted.
              </span>
            </div>
          </Card>
        </div>
      </section>

      {/* Module: Saved Designs & 1-Click Reorder */}
      <section id="designs" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#13171C]"></span>
            <h2 className="text-base font-bold text-[#13171C] tracking-tight">
              Saved Designs & 1-Click Repeat (§ 09)
            </h2>
          </div>
          <span className="text-xs font-mono text-[#768391]">Re-order without re-uploading</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <div className="h-28 bg-[#EAE8E0] rounded border border-[#D5D3C8] mb-3 flex flex-col items-center justify-center text-xs font-mono text-[#576472]">
              <span className="font-bold text-sm text-[#13171C]">COLD BREW 250ML</span>
              <span className="text-[10px] text-[#7C8894]">Gold Foil Vinyl • 60x90mm</span>
            </div>
            <h4 className="text-sm font-bold text-[#13171C]">Cold Brew Front Label</h4>
            <p className="text-xs text-[#636F7B] mt-0.5">Last ordered: 500 units (£140.00)</p>
            <div className="mt-4 pt-3 border-t border-[#ECEBE4] flex items-center justify-between">
              <span className="text-xs font-mono text-[#7D8A98]">Approved v1</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReorder("DSGN-LABELS-01")}
              >
                1-Click Reorder
              </Button>
            </div>
          </Card>

          <Card>
            <div className="h-28 bg-[#EAE8E0] rounded border border-[#D5D3C8] mb-3 flex flex-col items-center justify-center text-xs font-mono text-[#576472]">
              <span className="font-bold text-sm text-[#13171C]">RACE BIBS 2025</span>
              <span className="text-[10px] text-[#7C8894]">Tyvek Waterproof • 210x148mm</span>
            </div>
            <h4 className="text-sm font-bold text-[#13171C]">Enduro Championship Template</h4>
            <p className="text-xs text-[#636F7B] mt-0.5">Last ordered: 250 units (£112.50)</p>
            <div className="mt-4 pt-3 border-t border-[#ECEBE4] flex items-center justify-between">
              <span className="text-xs font-mono text-[#7D8A98]">Approved v3</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReorder("DSGN-RACE-02")}
              >
                1-Click Reorder
              </Button>
            </div>
          </Card>

          <Card>
            <div className="h-28 bg-[#EAE8E0] rounded border border-[#D5D3C8] mb-3 flex flex-col items-center justify-center text-xs font-mono text-[#576472]">
              <span className="font-bold text-sm text-[#13171C]">ACRYLIC PODIUM TROPHY</span>
              <span className="text-[10px] text-[#7C8894]">10mm Laser Cast • 150x200mm</span>
            </div>
            <h4 className="text-sm font-bold text-[#13171C]">Annual Series Overall 1st-3rd</h4>
            <p className="text-xs text-[#636F7B] mt-0.5">Last ordered: 12 units (£320.00)</p>
            <div className="mt-4 pt-3 border-t border-[#ECEBE4] flex items-center justify-between">
              <span className="text-xs font-mono text-[#7D8A98]">Approved v1</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReorder("DSGN-TRPH-05")}
              >
                1-Click Reorder
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Module: Order History Table */}
      <section id="orders" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#E65A28]"></span>
            <h2 className="text-base font-bold text-[#13171C] tracking-tight">
              Order History & Invoice Archive (§ 07, § 10)
            </h2>
          </div>
          <span className="text-xs font-mono text-[#768391]">Xero-ready invoice structure</span>
        </div>

        <Table headers={["Order #", "Date", "Items / Division", "Qty", "Total (inc. VAT)", "Status", "Actions"]}>
          <TableRow>
            <TableCell className="font-mono font-bold text-[#13171C]">ORD-2026-0891</TableCell>
            <TableCell className="font-mono text-xs">2026-03-23</TableCell>
            <TableCell>Peak Coffee Bottle Labels (Labels & Stickers)</TableCell>
            <TableCell className="font-mono">1,000</TableCell>
            <TableCell className="font-mono font-semibold">£ 168.00</TableCell>
            <TableCell>
              <Badge variant="PRODUCTION" size="sm">
                Production
              </Badge>
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => alert("Downloading demo invoice PDF: INV-2026-0891.pdf")}
              >
                <IconDownload className="w-3.5 h-3.5 mr-1" /> Invoice
              </Button>
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="font-mono font-bold text-[#13171C]">ORD-2026-0892</TableCell>
            <TableCell className="font-mono text-xs">2026-03-24</TableCell>
            <TableCell>Alpine Enduro Tyvek Bibs (Race Numbers)</TableCell>
            <TableCell className="font-mono">500</TableCell>
            <TableCell className="font-mono font-semibold">£ 225.00</TableCell>
            <TableCell>
              <Badge variant="PROOF" size="sm">
                Proof
              </Badge>
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => alert("Downloading demo invoice PDF: INV-2026-0892.pdf")}
              >
                <IconDownload className="w-3.5 h-3.5 mr-1" /> Invoice
              </Button>
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="font-mono font-bold text-[#13171C]">ORD-2026-0850</TableCell>
            <TableCell className="font-mono text-xs">2026-02-14</TableCell>
            <TableCell>RedRock MTB Number Plates (MTB Boards)</TableCell>
            <TableCell className="font-mono">250</TableCell>
            <TableCell className="font-mono font-semibold">£ 315.00</TableCell>
            <TableCell>
              <Badge variant="COMPLETED" size="sm">
                Completed
              </Badge>
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReorder("ORD-2026-0850")}
              >
                Reorder
              </Button>
            </TableCell>
          </TableRow>
        </Table>
      </section>
    </div>
  );
}
