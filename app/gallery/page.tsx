"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GALLERY_ITEMS, CATALOG_DIVISIONS } from "@/lib/catalog/products";
import { PublicNav } from "@/components/navigation/public-nav";
import { PublicFooter } from "@/components/navigation/public-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { IconBox, IconCheck } from "@/components/ui/icons";

export default function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filteredItems =
    activeFilter === "all"
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.divisionSlug === activeFilter);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4EE]">
      <DemoNotice
        module="WORK GALLERY"
        note="Real-work production archive organized by product family. All artwork shown passed preflight validation."
      />
      <PublicNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Gallery Header */}
        <div className="border-b border-[#DCDAD0] pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#E65A28]">
              Portfolio Archive
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#13171C] mt-1">
              Real Work Gallery
            </h1>
            <p className="text-xs sm:text-sm text-[#5B6875] mt-2 max-w-2xl leading-relaxed">
              Every job in this gallery was manufactured on our factory floor across our six divisions.
              Click any item to load its specifications directly into the parameter configurator.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="neutral" size="md">
              {filteredItems.length} Featured Jobs
            </Badge>
          </div>
        </div>

        {/* Division Filter Navigation */}
        <div className="flex flex-wrap items-center gap-2 mb-8 bg-[#EBE9E1] p-1.5 rounded-lg border border-[#D5D3C8]">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
              activeFilter === "all"
                ? "bg-[#13171C] text-white font-bold"
                : "text-[#576472] hover:text-[#13171C]"
            }`}
          >
            All Divisions
          </button>
          {CATALOG_DIVISIONS.map((div) => (
            <button
              key={div.slug}
              onClick={() => setActiveFilter(div.slug)}
              className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                activeFilter === div.slug
                  ? "bg-[#E65A28] text-white font-bold"
                  : "text-[#576472] hover:text-[#13171C]"
              }`}
            >
              {div.number}. {div.name}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const division = CATALOG_DIVISIONS.find((d) => d.slug === item.divisionSlug)!;

            return (
              <Card
                key={item.id}
                className="hover:border-[#E65A28] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Technical Spec Placeholder Art Surface */}
                  <div className="h-44 bg-[#EAE8E0] rounded border border-[#D5D3C8] mb-4 p-4 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <Badge variant="neutral" size="sm">
                        Div {division.number} • {division.name}
                      </Badge>
                      <span className="text-[10px] font-mono font-bold text-[#7B8896]">
                        {item.dimensions}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-bold font-mono text-[#13171C]">
                        {item.client}
                      </div>
                      <div className="text-xs font-mono text-[#E65A28] font-semibold">
                        {item.material}
                      </div>
                    </div>

                    {/* Subtle engineering watermark */}
                    <div className="absolute -bottom-4 -right-4 opacity-10 text-6xl font-mono font-extrabold text-[#13171C] pointer-events-none select-none">
                      {division.number}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#13171C]">{item.title}</h3>
                  <p className="text-xs text-[#5B6774] mt-1.5 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[#ECEBE4] space-y-1 text-xs font-mono text-[#4C5967]">
                    <div className="flex items-center gap-1.5">
                      <IconCheck className="w-3.5 h-3.5 text-[#E65A28] shrink-0" />
                      <span>Finish: {item.finish}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IconBox className="w-3.5 h-3.5 text-[#6B7988] shrink-0" />
                      <span>Press: {division.equipment.split(" ")[0]}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-[#ECEBE4] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#788594] uppercase">
                    Custom Sizing Available
                  </span>
                  <Link href={`/products/${item.productSlug}`}>
                    <Button variant="outline" size="sm">
                      Configure Product →
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
