import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATALOG_DIVISIONS, GALLERY_ITEMS } from "@/lib/catalog/products";
import { PublicNav } from "@/components/navigation/public-nav";
import { PublicFooter } from "@/components/navigation/public-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { IconCheck, IconBox } from "@/components/ui/icons";

interface DivisionPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return CATALOG_DIVISIONS.map((div) => ({
    slug: div.slug,
  }));
}

export default async function DivisionPage({ params }: DivisionPageProps) {
  const { slug } = await params;
  const division = CATALOG_DIVISIONS.find((d) => d.slug === slug);

  if (!division) {
    notFound();
  }

  const relatedGallery = GALLERY_ITEMS.filter((g) => g.divisionSlug === slug);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4EE]">
      <DemoNotice
        module={`DIVISION ${division.number} — ${division.name.toUpperCase()}`}
        note="Parameter-driven product modeling active. Configure dynamic dimensions without duplicate SKUs."
      />
      <PublicNav />

      <main className="flex-1">
        {/* Division Header Banner */}
        <section className="bg-[#12161A] text-white border-b border-[#27323E] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#E65A28] font-bold tracking-widest uppercase">
                  Division {division.number}
                </span>
                <span className="text-xs text-[#526071]">•</span>
                <span className="font-mono text-xs text-[#9BA8B6]">
                  Tolerance: {division.specsSummary}
                </span>
              </div>
              <Link href="/#divisions">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#384350] bg-[#1E252D] text-white hover:bg-[#2A3440]"
                >
                  ← All 6 Divisions
                </Button>
              </Link>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              {division.name}
            </h1>
            <p className="text-sm sm:text-base text-[#9AA7B5] mt-3 max-w-2xl leading-relaxed">
              {division.description}
            </p>

            {/* Hardware & Turnaround Specs Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-[#232B34] text-xs font-mono">
              <div>
                <span className="text-[#6C7B8B] block uppercase text-[10px]">Production Hardware</span>
                <span className="text-[#DDE4EC] font-semibold block mt-0.5">{division.equipment}</span>
              </div>
              <div>
                <span className="text-[#6C7B8B] block uppercase text-[10px]">Turnaround Time</span>
                <span className="text-[#DDE4EC] font-semibold block mt-0.5">{division.typicalTurnaround}</span>
              </div>
              <div>
                <span className="text-[#6C7B8B] block uppercase text-[10px]">Model Architecture</span>
                <span className="text-[#E65A28] font-bold block mt-0.5">Infinite Dynamic Sizing</span>
              </div>
            </div>
          </div>
        </section>

        {/* Division Content: Products & Substrates */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Products Column */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCDAD0]">
                <div>
                  <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#E65A28]">
                    Products in Range
                  </span>
                  <h2 className="text-xl font-bold text-[#13171C]">Configurable Product Line</h2>
                </div>
                <Badge variant="neutral" size="sm">
                  {division.products.length} Base Product
                </Badge>
              </div>

              {division.products.map((prod) => (
                <Card key={prod.id} className="hover:border-[#E65A28] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#E65A28]">
                          SKU-FREE PARAMETRIC
                        </span>
                        <span className="text-xs text-[#8A96A3]">•</span>
                        <span className="font-mono text-xs text-[#556372]">
                          Bleed: +{prod.bleedMm}mm
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#13171C] mt-1">{prod.name}</h3>
                      <p className="text-xs text-[#5C6876] mt-2 leading-relaxed">
                        {prod.description}
                      </p>

                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono text-[#384351]">
                        <div className="p-2 bg-[#FAF9F5] rounded border border-[#E2E1D9]">
                          <span className="text-[10px] text-[#788594] block uppercase">Min/Max Width</span>
                          <span>{prod.minWidthMm} - {prod.maxWidthMm} mm</span>
                        </div>
                        <div className="p-2 bg-[#FAF9F5] rounded border border-[#E2E1D9]">
                          <span className="text-[10px] text-[#788594] block uppercase">Min/Max Height</span>
                          <span>{prod.minHeightMm} - {prod.maxHeightMm} mm</span>
                        </div>
                        <div className="p-2 bg-[#FAF9F5] rounded border border-[#E2E1D9]">
                          <span className="text-[10px] text-[#788594] block uppercase">Base Rate</span>
                          <span>£{(prod.baseRatePerSqCmCents / 100).toFixed(2)} / cm²</span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-1">
                        {prod.specsList.map((spec, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-[#455260]">
                            <IconCheck className="w-3.5 h-3.5 text-[#E65A28] shrink-0" />
                            <span>{spec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <Link href={`/products/${prod.slug}`}>
                        <Button variant="primary" size="md">
                          Configure & Price →
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Related Division Gallery */}
              {relatedGallery.length > 0 && (
                <div className="pt-6">
                  <div className="pb-3 border-b border-[#DCDAD0] mb-4">
                    <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#E65A28]">
                      Production Proofs
                    </span>
                    <h3 className="text-base font-bold text-[#13171C]">
                      Real Client Work from Division {division.number}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {relatedGallery.map((item) => (
                      <Card key={item.id}>
                        <div className="h-28 bg-[#EAE8E0] rounded border border-[#D5D3C8] mb-3 p-3 flex flex-col justify-between">
                          <span className="text-[10px] font-mono font-bold text-[#13171C] uppercase">
                            {item.client}
                          </span>
                          <div>
                            <div className="text-xs font-mono font-bold text-[#13171C]">
                              {item.dimensions}
                            </div>
                            <div className="text-[11px] text-[#556372]">{item.material}</div>
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-[#13171C]">{item.title}</h4>
                        <p className="text-xs text-[#5C6876] mt-1">{item.description}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar: Certified Substrates & Technical Rules */}
            <div className="lg:col-span-4 space-y-6">
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <IconBox className="w-4 h-4 text-[#E65A28]" />
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#13171C]">
                    Certified Substrates
                  </h3>
                </div>
                <p className="text-xs text-[#5D6B7A] mb-4">
                  Materials calibrated on our {division.equipment.split(" ")[0]} press:
                </p>
                <ul className="space-y-2 text-xs">
                  {division.substrates.map((sub, i) => (
                    <li
                      key={i}
                      className="p-2.5 rounded bg-[#FAF9F5] border border-[#E2E1D9] text-[#2D3742] font-medium"
                    >
                      {sub}
                    </li>
                  ))}
                </ul>
              </Card>

              <Card>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#13171C] mb-2">
                  Browse Other Divisions
                </h3>
                <div className="space-y-1.5 text-xs font-mono">
                  {CATALOG_DIVISIONS.map((d) => (
                    <Link
                      key={d.slug}
                      href={`/divisions/${d.slug}`}
                      className={`block px-3 py-2 rounded transition-colors ${
                        d.slug === slug
                          ? "bg-[#13171C] text-white font-bold"
                          : "hover:bg-[#FAF9F5] text-[#475564]"
                      }`}
                    >
                      {d.number}. {d.name}
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
