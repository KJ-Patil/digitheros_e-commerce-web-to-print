"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/navigation/public-nav";
import { PublicFooter } from "@/components/navigation/public-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input, Select, Label } from "@/components/ui/form";
import { DemoNotice } from "@/components/ui/demo-notice";
import {
  IconTag,
  IconFlag,
  IconBike,
  IconStamp,
  IconTrophy,
  IconLaser,
  IconCheck,
} from "@/components/ui/icons";

interface Division {
  id: string;
  number: string;
  title: string;
  tagline: string;
  specs: string;
  icon: React.ReactNode;
}

const DIVISIONS: Division[] = [
  {
    id: "labels",
    number: "01",
    title: "Labels & Stickers",
    tagline: "Custom die-cut waterproof vinyl, metallic foils, and roll labels.",
    specs: "0.1mm accuracy • UV gloss / matte / soft-touch",
    icon: <IconTag className="w-6 h-6 text-[#E65A28]" />,
  },
  {
    id: "race",
    number: "02",
    title: "Race & Event Numbers",
    tagline: "Waterproof Tyvek bibs with CSV variable data and barcode merging.",
    specs: "100gsm Tyvek • Per-row data merge • Auto-fit typography",
    icon: <IconFlag className="w-6 h-6 text-[#E65A28]" />,
  },
  {
    id: "mtb",
    number: "03",
    title: "MTB Boards",
    tagline: "Heavyweight polypropylene downhill & enduro handlebar plates.",
    specs: "800μ - 1000μ rigid PP • Direct UV print • 4-hole zip tie punch",
    icon: <IconBike className="w-6 h-6 text-[#E65A28]" />,
  },
  {
    id: "stamps",
    number: "04",
    title: "Commercial Stamps",
    tagline: "Self-inking precision rubber stamps for legal and corporate notary.",
    specs: "1000 DPI laser engraved vulcanized rubber • Trodat mechanics",
    icon: <IconStamp className="w-6 h-6 text-[#E65A28]" />,
  },
  {
    id: "trophies",
    number: "05",
    title: "Laser Trophies",
    tagline: "Multi-layer acrylic and hardwood awards with precision rotary engraving.",
    specs: "Cast PMMA acrylic • Walnut & maple bases • Vector vectorization",
    icon: <IconTrophy className="w-6 h-6 text-[#E65A28]" />,
  },
  {
    id: "laser",
    number: "06",
    title: "Laser-Cut Work",
    tagline: "Industrial cutting and etching on architectural metals, woods and plastics.",
    specs: "120W CO2 & Fiber bed • 1200x900mm table • CAD DXF support",
    icon: <IconLaser className="w-6 h-6 text-[#E65A28]" />,
  },
];

export default function StorefrontHomePage() {
  // Live Instant Pricing Demo Calculator State
  const [calcDivision, setCalcDivision] = useState("labels");
  const [calcWidth, setCalcWidth] = useState(75);
  const [calcHeight, setCalcHeight] = useState(50);
  const [calcQuantity, setCalcQuantity] = useState(250);

  // Instant pricing math (demo pricing rules, server-validated in Module 4)
  const areaSqCm = (calcWidth * calcHeight) / 100;
  const baseRatePerSqCm = 0.02; // £0.02 per sq cm
  const setupBase = 15.0;

  // Volume discount tier
  let discount = 0;
  if (calcQuantity >= 1000) discount = 0.35;
  else if (calcQuantity >= 500) discount = 0.25;
  else if (calcQuantity >= 250) discount = 0.15;
  else if (calcQuantity >= 100) discount = 0.08;

  const rawUnit = Math.max(0.12, areaSqCm * baseRatePerSqCm + setupBase / calcQuantity);
  const unitPrice = rawUnit * (1 - discount);
  const subtotal = unitPrice * calcQuantity;
  const vat = subtotal * 0.2; // 20% VAT
  const total = subtotal + vat;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4EE]">
      <DemoNotice
        module="MODULE 1 FOUNDATION & UI SYSTEM"
        note="Boutique-industrial storefront layout active. Navigate between Public, Customer, and Admin pipeline zones below."
      />
      <PublicNav />

      {/* Role Switcher Floating Bar */}
      <div className="bg-[#EBEAE3] border-b border-[#D7D6CC] py-2 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono uppercase font-bold text-[#13171C]">
              Demo Role Navigation:
            </span>
            <span className="text-[#647281] hidden sm:inline">
              Three roles share one single backend (PRD § 03)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-2.5 py-1 rounded bg-[#13171C] text-white font-mono font-semibold text-[11px]"
            >
              Public Visitor
            </Link>
            <Link
              href="/customer/dashboard"
              className="px-2.5 py-1 rounded bg-white hover:bg-[#F2F1EA] text-[#13171C] border border-[#CFCECB] font-mono text-[11px]"
            >
              Registered Customer →
            </Link>
            <Link
              href="/admin/production"
              className="px-2.5 py-1 rounded bg-white hover:bg-[#F2F1EA] text-[#13171C] border border-[#CFCECB] font-mono text-[11px]"
            >
              Production Admin →
            </Link>
            <Link
              href="/design-system"
              className="px-2.5 py-1 rounded bg-[#E65A28] text-white font-mono text-[11px] font-bold"
            >
              UI System Showcase
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-[#DCDAD0] pt-12 pb-16 bg-[#F5F4EE]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#EAE8E0] border border-[#D5D3C8] text-[11px] font-mono uppercase tracking-wider text-[#4E5967] mb-4">
                <span className="w-2 h-2 rounded-full bg-[#E65A28]"></span>
                Single-Platform Web-to-Print Architecture
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#13171C] leading-[1.08]">
                Six print divisions. <br />
                <span className="text-[#E65A28]">One owned platform.</span>
              </h1>
              <p className="text-base sm:text-lg text-[#556170] mt-4 leading-relaxed">
                Configure parameter-driven products, design in-browser inside strictly producible zones,
                approve versioned proofs, and release high-resolution print files straight to the production floor.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a href="#calculator">
                  <Button variant="primary" size="lg">
                    Instant Price Calculator ↓
                  </Button>
                </a>
                <a href="#divisions">
                  <Button variant="outline" size="lg">
                    Explore 6 Divisions
                  </Button>
                </a>
              </div>
            </div>

            {/* Micro Feature Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-[#E0DED4]">
              <div>
                <div className="text-xs font-mono uppercase text-[#73808F]">01. Product Logic</div>
                <div className="text-sm font-bold text-[#13171C] mt-0.5">Parameter-Driven</div>
                <div className="text-[11px] text-[#7E8B99]">Dynamic sizing, no SKU bloat</div>
              </div>
              <div>
                <div className="text-xs font-mono uppercase text-[#73808F]">02. Approval Gate</div>
                <div className="text-sm font-bold text-[#13171C] mt-0.5">Proof Versioning</div>
                <div className="text-[11px] text-[#7E8B99]">v1, v2 audit logs & gate</div>
              </div>
              <div>
                <div className="text-xs font-mono uppercase text-[#73808F]">03. Variable Engine</div>
                <div className="text-sm font-bold text-[#13171C] mt-0.5">CSV Variable-Data</div>
                <div className="text-[11px] text-[#7E8B99]">Server-side batch merge</div>
              </div>
              <div>
                <div className="text-xs font-mono uppercase text-[#73808F]">04. Production Floor</div>
                <div className="text-sm font-bold text-[#13171C] mt-0.5">Automated PDFs</div>
                <div className="text-[11px] text-[#7E8B99]">Order-based directories</div>
              </div>
            </div>
          </div>
        </section>

        {/* 6 Divisions Equal-Weight Hub */}
        <section id="divisions" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#DCDAD0] gap-4">
            <div>
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#E65A28]">
                Catalogue § 04
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#13171C] tracking-tight mt-0.5">
                The Six Print Divisions
              </h2>
            </div>
            <p className="text-xs font-mono text-[#6A7888] max-w-sm">
              Equal-weight hub tiles: Each division models infinite dimensional variants through dynamic configuration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DIVISIONS.map((div) => (
              <div
                key={div.id}
                className="group bg-white border border-[#E2E1D9] hover:border-[#E65A28] rounded-lg p-6 transition-all duration-200 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded bg-[#FAF9F5] border border-[#E8E7DF] flex items-center justify-center">
                      {div.icon}
                    </div>
                    <span className="font-mono text-xs font-bold text-[#8C98A6] tracking-widest">
                      {div.number}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#13171C] group-hover:text-[#E65A28] transition-colors">
                    {div.title}
                  </h3>
                  <p className="text-xs text-[#5D6A78] mt-2 leading-relaxed">
                    {div.tagline}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#ECEBE4]">
                  <div className="text-[10px] font-mono uppercase text-[#818E9C]">
                    Specifications
                  </div>
                  <div className="text-xs font-mono font-medium text-[#13171C] mt-0.5">
                    {div.specs}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#E65A28] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Configure Product →
                    </span>
                    <Badge variant="neutral" size="sm">
                      Parametric
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live Instant Price Calculator Preview */}
        <section id="calculator" className="py-16 bg-[#EBE9E1] border-y border-[#D6D4CA]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5">
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#E65A28]">
                  Instant Engine § 05
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#13171C] tracking-tight mt-1">
                  Live Price Calculator
                </h2>
                <p className="text-xs sm:text-sm text-[#556271] mt-2 leading-relaxed">
                  No quote forms, no 24-hour waiting. Dynamic calculations determine cost per square centimeter,
                  volume breakpoints, and VAT with automated discounts.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#394451]">
                    <IconCheck className="w-4 h-4 text-[#E65A28]" />
                    <span>Automatic volume discount breaks at 100, 250, 500, 1000 units</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#394451]">
                    <IconCheck className="w-4 h-4 text-[#E65A28]" />
                    <span>Subtotal + VAT verified on server before order capture</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#394451]">
                    <IconCheck className="w-4 h-4 text-[#E65A28]" />
                    <span>Xero-ready structured data output</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <Card className="shadow-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="calc-div">Product Division</Label>
                      <Select
                        id="calc-div"
                        value={calcDivision}
                        onChange={(e) => setCalcDivision(e.target.value)}
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
                      <Label htmlFor="calc-qty">Quantity</Label>
                      <Input
                        id="calc-qty"
                        type="number"
                        min="10"
                        step="10"
                        value={calcQuantity}
                        onChange={(e) => setCalcQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="calc-w">Width (mm)</Label>
                      <Input
                        id="calc-w"
                        type="number"
                        min="10"
                        value={calcWidth}
                        onChange={(e) => setCalcWidth(Math.max(10, parseInt(e.target.value) || 10))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="calc-h">Height (mm)</Label>
                      <Input
                        id="calc-h"
                        type="number"
                        min="10"
                        value={calcHeight}
                        onChange={(e) => setCalcHeight(Math.max(10, parseInt(e.target.value) || 10))}
                      />
                    </div>
                  </div>

                  {/* Live Calculation Display Box */}
                  <div className="mt-6 bg-[#F8F7F3] border border-[#E2E1D9] rounded-lg p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border-b border-[#E8E7DF] pb-4 mb-4">
                      <div>
                        <div className="text-[10px] font-mono text-[#7D8A98] uppercase">
                          Unit Area
                        </div>
                        <div className="text-sm font-bold font-mono text-[#13171C] mt-0.5">
                          {areaSqCm.toFixed(1)} cm²
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-[#7D8A98] uppercase">
                          Volume Tier
                        </div>
                        <div className="text-sm font-bold font-mono text-[#E65A28] mt-0.5">
                          {discount > 0 ? `-${(discount * 100).toFixed(0)}% Off` : "Standard"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-[#7D8A98] uppercase">
                          Unit Price
                        </div>
                        <div className="text-sm font-bold font-mono text-[#13171C] mt-0.5">
                          £ {unitPrice.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-[#7D8A98] uppercase">
                          Total (inc. VAT)
                        </div>
                        <div className="text-base font-extrabold font-mono text-[#13171C] mt-0.5">
                          £ {total.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="text-[#647281] font-mono">
                        Net: £{subtotal.toFixed(2)} • VAT (20%): £{vat.toFixed(2)}
                      </div>
                      <Link href="/customer/dashboard">
                        <Button variant="primary" size="sm">
                          Proceed to Designer & Proof →
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Real-Work Gallery Organised by Product Family */}
        <section id="gallery" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#DCDAD0] gap-4">
            <div>
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#E65A28]">
                Real Work Gallery § 12
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#13171C] tracking-tight mt-0.5">
                Organised by Product Family
              </h2>
            </div>
            <p className="text-xs font-mono text-[#6A7888] max-w-sm">
              Live examples from our factory floor. All artwork shown passed preflight validation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <div className="h-44 bg-[#E8E6DE] rounded border border-[#D5D3C8] mb-3 p-4 flex flex-col justify-between">
                <Badge variant="neutral" size="sm">
                  01. Labels
                </Badge>
                <div>
                  <div className="text-sm font-mono font-bold text-[#13171C]">
                    High-Tack Vinyl
                  </div>
                  <div className="text-xs text-[#636F7B]">Matte Laminate • Die-Cut</div>
                </div>
              </div>
              <h4 className="text-sm font-bold text-[#13171C]">Microbrewery Can Labels</h4>
              <p className="text-xs text-[#636F7B] mt-1">
                Moisture-proof substrate with precision contour cutting.
              </p>
            </Card>

            <Card>
              <div className="h-44 bg-[#E8E6DE] rounded border border-[#D5D3C8] mb-3 p-4 flex flex-col justify-between">
                <Badge variant="neutral" size="sm">
                  02. Race Numbers
                </Badge>
                <div>
                  <div className="text-sm font-mono font-bold text-[#13171C]">
                    Tyvek Waterproof
                  </div>
                  <div className="text-xs text-[#636F7B]">CSV Merged Runners 001-500</div>
                </div>
              </div>
              <h4 className="text-sm font-bold text-[#13171C]">Highland Trail Marathon</h4>
              <p className="text-xs text-[#636F7B] mt-1">
                Variable barcode merge, emergency sponsor block, and safety corner punch.
              </p>
            </Card>

            <Card>
              <div className="h-44 bg-[#E8E6DE] rounded border border-[#D5D3C8] mb-3 p-4 flex flex-col justify-between">
                <Badge variant="neutral" size="sm">
                  03. MTB Boards
                </Badge>
                <div>
                  <div className="text-sm font-mono font-bold text-[#13171C]">
                    800μ Polypropylene
                  </div>
                  <div className="text-xs text-[#636F7B]">Crash-Proof Impact Polymer</div>
                </div>
              </div>
              <h4 className="text-sm font-bold text-[#13171C]">Gravity National Series</h4>
              <p className="text-xs text-[#636F7B] mt-1">
                UV-cured pigment with high-contrast digits for race camera gates.
              </p>
            </Card>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
