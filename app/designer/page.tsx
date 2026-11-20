"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CATALOG_DIVISIONS } from "@/lib/catalog/products";
import { CanvasDesigner } from "@/components/designer/canvas-designer";
import { ArtworkUploader } from "@/components/designer/artwork-uploader";
import { PublicNav } from "@/components/navigation/public-nav";
import { PublicFooter } from "@/components/navigation/public-footer";
import { DemoNotice } from "@/components/ui/demo-notice";
import { Button } from "@/components/ui/button";

function DesignerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productSlug = searchParams.get("product") || "vinyl-stickers";
  const widthParam = parseInt(searchParams.get("w") || "75");
  const heightParam = parseInt(searchParams.get("h") || "50");

  // Find product
  let product = CATALOG_DIVISIONS[0].products[0];
  for (const div of CATALOG_DIVISIONS) {
    const match = div.products.find((p) => p.slug === productSlug);
    if (match) {
      product = match;
      break;
    }
  }

  const widthMm = isNaN(widthParam) ? product.defaultWidthMm : widthParam;
  const heightMm = isNaN(heightParam) ? product.defaultHeightMm : heightParam;

  // Active designer tab: "canvas" vs "upload"
  const [activeTab, setActiveTab] = useState<"canvas" | "upload">("canvas");

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4EE]">
      <DemoNotice
        module="IN-BROWSER DESIGNER & ARTWORK UPLOAD"
        note="Print bounding box constraints active. Artwork is locked to safe zones before production file generation."
      />
      <PublicNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Designer Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCDAD0] pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#6A7886] mb-1">
              <Link href="/" className="hover:text-[#13171C]">
                Storefront
              </Link>
              <span>/</span>
              <Link href={`/products/${product.slug}`} className="hover:text-[#13171C]">
                {product.name}
              </Link>
              <span>/</span>
              <span className="text-[#13171C] font-bold">Web-to-Print Designer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#13171C]">
              Design & Preflight Studio
            </h1>
            <p className="text-xs sm:text-sm text-[#5B6877] mt-1">
              Configured: {widthMm} × {heightMm} mm (+{product.bleedMm}mm Bleed • -{product.safeMarginMm}mm Safe Zone)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-[#EAE8E0] p-1 rounded border border-[#D5D3CB] text-xs font-mono">
              <button
                onClick={() => setActiveTab("canvas")}
                className={`px-3 py-1.5 rounded uppercase font-semibold transition-colors cursor-pointer ${
                  activeTab === "canvas"
                    ? "bg-[#13171C] text-white shadow-sm"
                    : "text-[#5B6877] hover:text-[#13171C]"
                }`}
              >
                In-Browser Canvas
              </button>
              <button
                onClick={() => setActiveTab("upload")}
                className={`px-3 py-1.5 rounded uppercase font-semibold transition-colors cursor-pointer ${
                  activeTab === "upload"
                    ? "bg-[#13171C] text-white shadow-sm"
                    : "text-[#5B6877] hover:text-[#13171C]"
                }`}
              >
                Upload Artwork (PDF/SVG/AI)
              </button>
            </div>

            <Link href={`/products/${product.slug}`}>
              <Button variant="outline" size="sm">
                ← Reconfigure
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab View: Canvas vs Upload */}
        {activeTab === "canvas" ? (
          <CanvasDesigner
            productSlug={product.slug}
            productName={product.name}
            widthMm={widthMm}
            heightMm={heightMm}
            bleedMm={product.bleedMm}
            safeMarginMm={product.safeMarginMm}
            onSaveProof={() => {
              alert(
                `Digital Proof v1 Created!\nProduct: ${product.name}\nDimensions: ${widthMm}x${heightMm}mm\nRedirecting to Customer Proof Review...`
              );
              router.push("/customer/dashboard#proofs");
            }}
          />
        ) : (
          <ArtworkUploader
            productName={product.name}
            targetWidthMm={widthMm}
            targetHeightMm={heightMm}
            bleedMm={product.bleedMm}
            onUploadComplete={(report) => {
              alert(
                `Preflight passed for '${report.fileName}'!\nTarget: ${widthMm}x${heightMm}mm (+${product.bleedMm}mm bleed)\nRedirecting to Proof Review...`
              );
              router.push("/customer/dashboard#proofs");
            }}
          />
        )}
      </main>

      <PublicFooter />
    </div>
  );
}

export default function DesignerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-mono text-xs">
          Loading Prepress Studio...
        </div>
      }
    >
      <DesignerContent />
    </Suspense>
  );
}
