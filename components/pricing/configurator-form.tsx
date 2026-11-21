"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CatalogProduct } from "@/lib/catalog/products";
import {
  calculateProductPrice,
  PricingCalculationResult,
  VOLUME_DISCOUNT_TIERS,
} from "@/lib/pricing/engine";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Label } from "@/components/ui/form";
import { BlueprintPreview } from "@/components/catalog/blueprint-preview";
import { ErrorState } from "@/components/ui/error-state";
import { IconCheck, IconShield } from "@/components/ui/icons";

interface ConfiguratorFormProps {
  product: CatalogProduct;
  divisionName: string;
}

export function ConfiguratorForm({ product, divisionName }: ConfiguratorFormProps) {
  // Dimensions & quantity
  const [widthMm, setWidthMm] = useState<number>(product.defaultWidthMm);
  const [heightMm, setHeightMm] = useState<number>(product.defaultHeightMm);
  const [quantity, setQuantity] = useState<number>(250);

  // Parameter selections
  const materials = product.parameters.filter((p) => p.type === "material");
  const finishes = product.parameters.filter((p) => p.type === "finish");
  const cutTypes = product.parameters.filter((p) => p.type === "cut_type");

  const [selectedMaterialCode, setSelectedMaterialCode] = useState<string>(
    materials[0]?.code || ""
  );
  const [selectedFinishCode, setSelectedFinishCode] = useState<string>(
    finishes[0]?.code || ""
  );
  const [selectedCutCode, setSelectedCutCode] = useState<string>(
    cutTypes[0]?.code || ""
  );

  // Derived validation during render (React 19 / Next 16 compliant - no cascading effects)
  let validationError: string | null = null;
  if (widthMm < product.minWidthMm || widthMm > product.maxWidthMm) {
    validationError = `Width must be between ${product.minWidthMm}mm and ${product.maxWidthMm}mm.`;
  } else if (heightMm < product.minHeightMm || heightMm > product.maxHeightMm) {
    validationError = `Height must be between ${product.minHeightMm}mm and ${product.maxHeightMm}mm.`;
  } else if (quantity <= 0) {
    validationError = "Quantity must be at least 1 unit.";
  }

  // Authoritative calculation derived directly from state
  const calculation: PricingCalculationResult = React.useMemo(() => {
    return calculateProductPrice({
      productSlug: product.slug,
      widthMm: Math.min(product.maxWidthMm, Math.max(product.minWidthMm, widthMm || product.minWidthMm)),
      heightMm: Math.min(product.maxHeightMm, Math.max(product.minHeightMm, heightMm || product.minHeightMm)),
      quantity: Math.max(1, quantity || 1),
      materialCode: selectedMaterialCode,
      finishCode: selectedFinishCode,
      cutTypeCode: selectedCutCode,
    });
  }, [
    product,
    widthMm,
    heightMm,
    quantity,
    selectedMaterialCode,
    selectedFinishCode,
    selectedCutCode,
  ]);

  const activeMaterial =
    materials.find((m) => m.code === selectedMaterialCode) || materials[0];
  const activeCut =
    cutTypes.find((c) => c.code === selectedCutCode) || cutTypes[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left: Technical CAD Blueprint & Live Specs */}
      <div className="lg:col-span-6 space-y-6">
        <BlueprintPreview
          widthMm={widthMm}
          heightMm={heightMm}
          bleedMm={product.bleedMm}
          safeMarginMm={product.safeMarginMm}
          shapeName={activeCut?.name || "Standard Cut"}
          materialName={activeMaterial?.name || "Standard"}
        />

        {/* Manufacturing Rules Specs */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#13171C]">
              Manufacturing Specifications
            </h3>
            <span className="text-[10px] font-mono text-[#E65A28] font-bold">
              Roland / Mimaki Tolerance
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono text-[#384451] mb-4">
            <div className="p-2.5 bg-[#FAF9F5] rounded border border-[#E2E1D9]">
              <span className="text-[10px] text-[#7A8896] block uppercase">Allowed Width</span>
              <span className="font-bold">
                {product.minWidthMm} - {product.maxWidthMm} mm
              </span>
            </div>
            <div className="p-2.5 bg-[#FAF9F5] rounded border border-[#E2E1D9]">
              <span className="text-[10px] text-[#7A8896] block uppercase">Allowed Height</span>
              <span className="font-bold">
                {product.minHeightMm} - {product.maxHeightMm} mm
              </span>
            </div>
            <div className="p-2.5 bg-[#FAF9F5] rounded border border-[#E2E1D9]">
              <span className="text-[10px] text-[#7A8896] block uppercase">Required Bleed</span>
              <span className="font-bold text-[#E65A28]">+{product.bleedMm} mm</span>
            </div>
            <div className="p-2.5 bg-[#FAF9F5] rounded border border-[#E2E1D9]">
              <span className="text-[10px] text-[#7A8896] block uppercase">Safe Inner Margin</span>
              <span className="font-bold text-emerald-700">-{product.safeMarginMm} mm</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-[#525E6C]">
            {product.specsList.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <IconCheck className="w-3.5 h-3.5 text-[#E65A28] shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Approval Gate Policy */}
        <div className="p-4 bg-[#EAE8DF] border border-[#D8D6CC] rounded-lg text-xs text-[#455260] flex items-start gap-2.5">
          <IconShield className="w-4 h-4 text-[#E65A28] shrink-0 mt-0.5" />
          <div>
            <span className="font-mono font-bold text-[#13171C] uppercase block mb-0.5">
              Production Security & Approval Gate
            </span>
            Pricing is calculated on the server. Production-ready files (300 DPI PDF) remain locked
            until you approve the digital proof revision.
          </div>
        </div>
      </div>

      {/* Right: Interactive Configuration Form */}
      <div className="lg:col-span-6 space-y-6">
        <Card>
          <div className="border-b border-[#ECEBE4] pb-4 mb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-[#E65A28] uppercase tracking-wider">
                  {divisionName}
                </span>
                <span className="text-xs text-[#9AA5B2]">•</span>
                <span className="text-[10px] font-mono text-[#677583]">Dynamic Sizing Engine</span>
              </div>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#13171C] mt-1">
              {product.name}
            </h1>
            <p className="text-xs text-[#5E6A77] mt-1">{product.shortTagline}</p>
          </div>

          {validationError && (
            <div className="mb-4">
              <ErrorState title="Input Constraint Warning" message={validationError} />
            </div>
          )}

          <div className="space-y-5">
            {/* 1. Dimension Inputs */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label required>Dimensions (Millimeters)</Label>
                <span className="text-[11px] font-mono text-[#768492]">
                  Area: {((widthMm * heightMm) / 100).toFixed(1)} cm²
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-mono text-[#6E7B89] block mb-1">
                    Width (mm) [{product.minWidthMm} - {product.maxWidthMm}]
                  </span>
                  <Input
                    type="number"
                    min={product.minWidthMm}
                    max={product.maxWidthMm}
                    value={widthMm}
                    onChange={(e) => setWidthMm(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#6E7B89] block mb-1">
                    Height (mm) [{product.minHeightMm} - {product.maxHeightMm}]
                  </span>
                  <Input
                    type="number"
                    min={product.minHeightMm}
                    max={product.maxHeightMm}
                    value={heightMm}
                    onChange={(e) => setHeightMm(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* 2. Substrate / Material Selector */}
            {materials.length > 0 && (
              <div>
                <Label required>Substrate Material</Label>
                <Select
                  value={selectedMaterialCode}
                  onChange={(e) => setSelectedMaterialCode(e.target.value)}
                  options={materials.map((m) => ({
                    label: `${m.name} ${
                      m.multiplier > 1.0 ? `(+${Math.round((m.multiplier - 1) * 100)}%)` : ""
                    }`,
                    value: m.code,
                  }))}
                />
              </div>
            )}

            {/* 3. Finishes & Cut Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {finishes.length > 0 && (
                <div>
                  <Label>Surface Finish</Label>
                  <Select
                    value={selectedFinishCode}
                    onChange={(e) => setSelectedFinishCode(e.target.value)}
                    options={finishes.map((f) => ({
                      label: f.name,
                      value: f.code,
                    }))}
                  />
                </div>
              )}

              {cutTypes.length > 0 && (
                <div>
                  <Label>Cut Style</Label>
                  <Select
                    value={selectedCutCode}
                    onChange={(e) => setSelectedCutCode(e.target.value)}
                    options={cutTypes.map((c) => ({
                      label: c.name,
                      value: c.code,
                    }))}
                  />
                </div>
              )}
            </div>

            {/* 4. Quantity & Volume Breakpoints */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label required>Quantity</Label>
                <span className="text-[11px] font-mono text-[#E65A28] font-bold">
                  {calculation.breakdown.volumeDiscountLabel}
                </span>
              </div>
              <Input
                type="number"
                min="1"
                step="10"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />

              {/* Volume Discount Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {VOLUME_DISCOUNT_TIERS.filter((t) => t.minQuantity > 0)
                  .reverse()
                  .map((tier) => (
                    <button
                      key={tier.minQuantity}
                      type="button"
                      onClick={() => setQuantity(tier.minQuantity)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        quantity === tier.minQuantity
                          ? "bg-[#13171C] text-white border-[#13171C] font-bold"
                          : "bg-[#FAF9F5] text-[#556372] border-[#D5D4CB] hover:bg-[#F0EFE8]"
                      }`}
                    >
                      {tier.minQuantity} pcs (-{tier.discountPercentage}%)
                    </button>
                  ))}
              </div>
            </div>

            {/* 5. Authoritative Pricing Breakdown */}
            <div className="bg-[#FAF9F5] border border-[#E2E1D9] rounded-lg p-5 mt-6">
              <div className="flex items-center justify-between border-b border-[#E8E7DF] pb-2 mb-3">
                <span className="text-[10px] font-mono uppercase text-[#73808E] font-bold">
                  Server Price Breakdown (Xero Ready)
                </span>
                {calculation.breakdown.isMinimumOrderApplied && (
                  <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                    Min Order Applied
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-[#556372]">
                  <span>Effective Unit Price</span>
                  <span className="text-[#13171C] font-bold">
                    {calculation.formatted.unitPrice} / unit
                  </span>
                </div>

                <div className="flex justify-between text-[#556372]">
                  <span>Subtotal Net ({calculation.quantity} units)</span>
                  <span>{calculation.formatted.subtotal}</span>
                </div>

                {calculation.breakdown.discountSavingsCents > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Volume Discount Savings</span>
                    <span>-{calculation.formatted.discountSavings}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#556372]">
                  <span>VAT ({calculation.breakdown.vatPercentage}% Inclusive)</span>
                  <span>{calculation.formatted.vat}</span>
                </div>

                <div className="pt-2 border-t border-[#E8E7DF] flex justify-between text-base font-extrabold text-[#13171C]">
                  <span>Total (inc. VAT)</span>
                  <span className="text-[#E65A28]">{calculation.formatted.total}</span>
                </div>
              </div>

              {/* Action Buttons: 3 Equal-Sized Pillars */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
                <Link
                  href={`/designer?product=${product.slug}&w=${widthMm}&h=${heightMm}&qty=${quantity}`}
                  className="w-full block"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full h-12 text-xs sm:text-sm font-bold text-white px-2 text-center flex items-center justify-center shadow-sm"
                  >
                    Proceed to Designer
                  </Button>
                </Link>

                <Link
                  href="/cart"
                  onClick={() => {
                    try {
                      const existing = localStorage.getItem("dh_cart_items");
                      const items = existing ? JSON.parse(existing) : [];
                      items.push({
                        id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                        productSlug: product.slug,
                        productName: product.name,
                        widthMm,
                        heightMm,
                        quantity,
                        materialCode: selectedMaterialCode,
                        materialName: materials.find((m) => m.code === selectedMaterialCode)?.name,
                        finishCode: selectedFinishCode,
                        finishName: finishes.find((f) => f.code === selectedFinishCode)?.name,
                        cutTypeCode: selectedCutCode,
                        cutTypeName: cutTypes.find((c) => c.code === selectedCutCode)?.name,
                      });
                      localStorage.setItem("dh_cart_items", JSON.stringify(items));
                    } catch (e) {
                      console.warn("Cart storage warning:", e);
                    }
                  }}
                  className="w-full block"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-12 text-xs sm:text-sm font-bold border-[#13171C] text-[#13171C] hover:bg-[#FAF9F5] px-2 text-center flex items-center justify-center"
                  >
                    Add to Cart 🛒
                  </Button>
                </Link>

                <Link
                  href={`/checkout?product=${product.slug}&width=${widthMm}&height=${heightMm}&qty=${quantity}&material=${selectedMaterialCode || ""}&finish=${selectedFinishCode || ""}&cutType=${selectedCutCode || ""}`}
                  className="w-full block"
                >
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full h-12 text-xs sm:text-sm font-bold text-white px-2 text-center flex items-center justify-center"
                  >
                    Quick Checkout
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
