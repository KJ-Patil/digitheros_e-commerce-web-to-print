"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DivisionProductionSpec } from "@/lib/print-engine/specs";

interface ProductItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  min_width_mm: number;
  max_width_mm: number;
  min_height_mm: number;
  max_height_mm: number;
  bleed_margin_mm: number;
  safe_margin_mm: number;
  is_active: boolean;
}

interface ProductParameter {
  id: string;
  product_id: string;
  parameter_type: string;
  name: string;
  code: string;
  price_multiplier: number;
  setup_cost_cents: number;
  is_default: boolean;
}

export default function AdminProductsPage() {
  const [activeTab, setActiveTab] = useState<"CATALOG" | "SPECS">("CATALOG");

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [parameters, setParameters] = useState<ProductParameter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isAddParamModalOpen, setIsAddParamModalOpen] = useState(false);
  const [newParam, setNewParam] = useState({
    name: "",
    code: "",
    parameterType: "material",
    priceMultiplier: 1.15,
    setupCostCents: 500,
    isDefault: false,
  });

  // Prepress Production Specifications State
  const [specs, setSpecs] = useState<DivisionProductionSpec[]>([]);
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);
  const [selectedSpecForEdit, setSelectedSpecForEdit] = useState<DivisionProductionSpec | null>(null);
  const [editBleedMm, setEditBleedMm] = useState<number>(3.0);
  const [editSafeMarginMm, setEditSafeMarginMm] = useState<number>(3.0);
  const [editResolutionDpi, setEditResolutionDpi] = useState<number>(300);
  const [editToleranceMm, setEditToleranceMm] = useState<number>(0.5);
  const [isSavingSpec, setIsSavingSpec] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);

  const fetchCatalog = () => {
    setIsLoading(true);
    fetch("/api/admin/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.products || []);
          setParameters(data.parameters || []);
        }
      })
      .catch((err) => console.error("Catalog fetch error:", err))
      .finally(() => setIsLoading(false));
  };

  const fetchSpecs = () => {
    setIsLoadingSpecs(true);
    fetch("/api/admin/production-specs")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSpecs(data.specs || []);
        }
      })
      .catch((err) => console.error("Specs fetch error:", err))
      .finally(() => setIsLoadingSpecs(false));
  };

  useEffect(() => {
    fetchCatalog();
    fetchSpecs();
  }, []);

  const handleToggleProduct = async (product: ProductItem) => {
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_PRODUCT_STATUS",
          productId: product.id,
          productData: { isActive: !product.is_active },
        }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, is_active: !p.is_active } : p))
        );
        setMsg(`✓ Updated ${product.name} status to ${!product.is_active ? "Active" : "Disabled"}.`);
        setTimeout(() => setMsg(null), 3000);
      }
    } catch {
      alert("Failed to toggle product status.");
    }
  };

  const handleAddParameter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_PARAMETER",
          productId: selectedProduct.id,
          parameterData: newParam,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add parameter");

      setMsg(`✓ Added material option "${newParam.name}" to ${selectedProduct.name}!`);
      setIsAddParamModalOpen(false);
      setNewParam({
        name: "",
        code: "",
        parameterType: "material",
        priceMultiplier: 1.15,
        setupCostCents: 500,
        isDefault: false,
      });
      fetchCatalog();
      setTimeout(() => setMsg(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving option");
    }
  };

  const handleSaveSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpecForEdit) return;

    setIsSavingSpec(true);
    try {
      const res = await fetch("/api/admin/production-specs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          divisionSlug: selectedSpecForEdit.divisionSlug,
          updates: {
            defaultBleedMm: Number(editBleedMm),
            safeMarginMm: Number(editSafeMarginMm),
            resolutionDpi: Number(editResolutionDpi),
            cuttingToleranceMm: Number(editToleranceMm),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save specification");

      setMsg(`✓ Saved prepress specifications for ${selectedSpecForEdit.divisionName}.`);
      setSelectedSpecForEdit(null);
      fetchSpecs();
      setTimeout(() => setMsg(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error updating specification");
    } finally {
      setIsSavingSpec(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252E38] pb-6">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-400">
            Catalog &amp; Prepress Engineering
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Manufacturing Products &amp; Specifications
          </h1>
          <p className="text-xs text-[#8E9CA9] mt-1">
            Manage product dimensional limits, material multiplier formulas, and division-specific prepress specs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="info" size="md">
            6 PRD Divisions
          </Badge>
          <Badge variant="neutral" size="md">
            {products.length} Active Profiles
          </Badge>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded text-emerald-300 text-xs font-mono">
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#232B34] gap-6 text-xs font-mono uppercase tracking-wider">
        <button
          onClick={() => setActiveTab("CATALOG")}
          className={`pb-3 font-bold border-b-2 transition-colors ${
            activeTab === "CATALOG"
              ? "border-[#E65A28] text-white"
              : "border-transparent text-[#7F8D9D] hover:text-white"
          }`}
        >
          Products &amp; Materials ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("SPECS")}
          className={`pb-3 font-bold border-b-2 transition-colors ${
            activeTab === "SPECS"
              ? "border-[#E65A28] text-white"
              : "border-transparent text-[#7F8D9D] hover:text-white"
          }`}
        >
          Division Prepress &amp; Production Specs (6)
        </button>
      </div>

      {/* TAB 1: Products Grid */}
      {activeTab === "CATALOG" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-full p-8 text-center text-[#8E9CA9] font-mono text-xs">
              Loading manufacturing catalog...
            </div>
          ) : (
            products.map((prod) => {
              const prodParams = parameters.filter((p) => p.product_id === prod.id);

              return (
                <div
                  key={prod.id}
                  className={`bg-[#141A20] border rounded-lg p-5 flex flex-col justify-between transition-all ${
                    prod.is_active ? "border-[#252E38]" : "border-rose-900/40 opacity-75"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                          {prod.slug}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-0.5">{prod.name}</h3>
                      </div>
                      <Badge variant={prod.is_active ? "success" : "danger"} size="sm">
                        {prod.is_active ? "Active" : "Disabled"}
                      </Badge>
                    </div>

                    <p className="text-xs text-[#8E9CA9] leading-relaxed line-clamp-2">
                      {prod.description}
                    </p>

                    {/* Prepress Boundaries */}
                    <div className="p-3 bg-[#0B0E11] rounded border border-[#1E252D] space-y-1 text-[11px] font-mono text-[#CCD5DF]">
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Dimensions:</span>
                        <span>
                          {prod.min_width_mm}x{prod.min_height_mm}mm - {prod.max_width_mm}x
                          {prod.max_height_mm}mm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Bleed / Safe:</span>
                        <span>
                          {prod.bleed_margin_mm}mm bleed / {prod.safe_margin_mm}mm safe
                        </span>
                      </div>
                    </div>

                    {/* Associated Options */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono mb-2">
                        <span className="text-[#8E9CA9] uppercase font-bold">
                          Substrates &amp; Finishes ({prodParams.length})
                        </span>
                        <button
                          onClick={() => {
                            setSelectedProduct(prod);
                            setIsAddParamModalOpen(true);
                          }}
                          className="text-amber-400 hover:text-amber-300 font-bold underline"
                        >
                          + Add
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {prodParams.length === 0 ? (
                          <div className="text-[10px] text-[#556475] italic">No custom options attached.</div>
                        ) : (
                          prodParams.map((param) => (
                            <div
                              key={param.id}
                              className="flex items-center justify-between p-2 rounded bg-[#0E1318] border border-[#1A222B] text-xs font-mono"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-white font-bold">{param.name}</span>
                                {param.is_default && (
                                  <span className="text-[9px] bg-[#252E38] text-amber-300 px-1 rounded">
                                    DEFAULT
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#8E9CA9]">
                                {param.price_multiplier}x
                                {param.setup_cost_cents > 0 && ` +£${(param.setup_cost_cents / 100).toFixed(2)}`}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#1E252D] flex items-center justify-between mt-4">
                    <span className="text-[10px] font-mono text-[#556475]">ID: {prod.id.slice(0, 8)}...</span>
                    <Button
                      variant="dark-outline"
                      size="sm"
                      onClick={() => handleToggleProduct(prod)}
                      className="text-xs"
                    >
                      {prod.is_active ? "Disable Product" : "Enable Product"}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: Division Prepress Specifications */}
      {activeTab === "SPECS" && (
        <div className="space-y-6">
          <div className="p-4 bg-[#141A20] border border-[#252E38] rounded-lg text-xs font-mono text-[#8E9CA9] space-y-1">
            <div className="text-white font-bold flex items-center gap-2">
              <span>🏭</span> Factory Production Specifications Engine
            </div>
            <div>
              Authoritative prepress rules applied during server-side production file rendering.
            </div>
            <div className="text-amber-400 font-semibold">
              Hardware Specification Status: Internal Prepress Preset (Hardware profiles are clearly labelled placeholders until calibrated manufacturer profiles are supplied).
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoadingSpecs ? (
              <div className="col-span-full p-8 text-center text-[#8E9CA9] font-mono text-xs">
                Loading division specifications...
              </div>
            ) : (
              specs.map((spec) => (
                <div
                  key={spec.divisionSlug}
                  className="bg-[#141A20] border border-[#252E38] rounded-lg p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#E65A28] font-bold block">
                          Division {spec.divisionSlug}
                        </span>
                        <h3 className="text-base font-extrabold text-white mt-0.5">
                          {spec.divisionName}
                        </h3>
                      </div>
                      <Badge variant="neutral" size="sm">
                        {spec.outputFormat}
                      </Badge>
                    </div>

                    <div className="p-3 bg-[#0B0E11] rounded border border-[#1E252D] space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Bleed:</span>
                        <span className="text-white font-bold">{spec.defaultBleedMm} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Safe Margin:</span>
                        <span className="text-white font-bold">{spec.safeMarginMm} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Resolution:</span>
                        <span className="text-emerald-400 font-bold">{spec.resolutionDpi} DPI</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Color Mode:</span>
                        <span className="text-white">{spec.colorMode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Cutting Tolerance:</span>
                        <span className="text-white">±{spec.cuttingToleranceMm} mm</span>
                      </div>
                      {spec.spotColorName && (
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Spot Separation:</span>
                          <span className="text-amber-300 font-mono text-[10px]">{spec.spotColorName}</span>
                        </div>
                      )}
                    </div>

                    {/* Hardware Profile Placeholder Card */}
                    <div className="p-2.5 bg-[#0E1318] border border-amber-900/30 rounded text-[11px] font-mono space-y-1">
                      <div className="text-amber-400 font-bold text-[10px] uppercase flex items-center justify-between">
                        <span>Hardware Profile Placeholder</span>
                        <span className="text-[9px] text-[#718292]">Pending Calib</span>
                      </div>
                      <div className="text-[#CCD5DF] text-[10px]">
                        <span className="text-[#64748B]">Press:</span> {spec.hardwareProfilePlaceholder.primaryMachine}
                      </div>
                      <div className="text-[#CCD5DF] text-[10px]">
                        <span className="text-[#64748B]">Finishing:</span> {spec.hardwareProfilePlaceholder.finishingUnit}
                      </div>
                      <div className="text-[#CCD5DF] text-[10px]">
                        <span className="text-[#64748B]">RIP:</span> {spec.hardwareProfilePlaceholder.ripSoftware}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#1E252D] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#556475]">
                      {spec.supportsVariableData ? "✓ VDP Ready" : "Static Layout"}
                    </span>
                    <Button
                      variant="dark-outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSpecForEdit(spec);
                        setEditBleedMm(spec.defaultBleedMm);
                        setEditSafeMarginMm(spec.safeMarginMm);
                        setEditResolutionDpi(spec.resolutionDpi);
                        setEditToleranceMm(spec.cuttingToleranceMm);
                      }}
                      className="text-xs"
                    >
                      Edit Prepress Specs
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: Edit Prepress Spec Modal */}
      {selectedSpecForEdit && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#141A20] border border-[#27323E] rounded-lg max-w-md w-full p-6 space-y-5 shadow-2xl text-white">
            <div className="flex items-start justify-between border-b border-[#252E38] pb-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E65A28]">
                  Prepress Geometry Configuration
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedSpecForEdit.divisionName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSpecForEdit(null)}
                className="text-xs font-mono text-[#8E9CA9] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSpec} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0ACB9] uppercase text-[10px] mb-1">
                    Default Bleed (mm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={editBleedMm}
                    onChange={(e) => setEditBleedMm(Number(e.target.value))}
                    className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#A0ACB9] uppercase text-[10px] mb-1">
                    Safe Margin (mm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={editSafeMarginMm}
                    onChange={(e) => setEditSafeMarginMm(Number(e.target.value))}
                    className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0ACB9] uppercase text-[10px] mb-1">
                    Target Resolution (DPI)
                  </label>
                  <select
                    value={editResolutionDpi}
                    onChange={(e) => setEditResolutionDpi(Number(e.target.value))}
                    className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white font-mono"
                  >
                    <option value={300}>300 DPI (Standard Prepress)</option>
                    <option value={600}>600 DPI (Fine Laser/Direct UV)</option>
                    <option value={1200}>1200 DPI (Ultra Fine)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A0ACB9] uppercase text-[10px] mb-1">
                    Cut Tolerance (±mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.05"
                    max="5.0"
                    value={editToleranceMm}
                    onChange={(e) => setEditToleranceMm(Number(e.target.value))}
                    className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-[#0B0E11] border border-[#252E38] rounded text-[10px] text-[#7E8B99]">
                Updated specs take effect instantly in the PDF generator engine.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#252E38]">
                <Button
                  type="button"
                  variant="dark-outline"
                  size="sm"
                  onClick={() => setSelectedSpecForEdit(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSavingSpec}
                  className="bg-[#E65A28] hover:bg-[#CF4919] text-white font-bold"
                >
                  {isSavingSpec ? "Saving..." : "Save Prepress Settings"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Parameter Modal */}
      {isAddParamModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#141A20] border border-[#27323E] rounded-lg max-w-md w-full p-6 space-y-5 shadow-2xl text-white">
            <div className="flex items-start justify-between border-b border-[#252E38] pb-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  New Product Parameter
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Add Option to {selectedProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setIsAddParamModalOpen(false)}
                className="text-xs font-mono text-[#8E9CA9] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddParameter} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#A0ACB9] font-mono text-[10px] uppercase mb-1">
                  Parameter Type
                </label>
                <select
                  value={newParam.parameterType}
                  onChange={(e) => setNewParam({ ...newParam, parameterType: e.target.value })}
                  className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white font-mono"
                >
                  <option value="material">Material / Substrate</option>
                  <option value="finish">Surface Finish (Gloss/Matte)</option>
                  <option value="cut_type">Cut Contour Style</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A0ACB9] font-mono text-[10px] uppercase mb-1">
                  Option Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Brushed Silver Metallic"
                  value={newParam.name}
                  onChange={(e) => setNewParam({ ...newParam, name: e.target.value })}
                  className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[#A0ACB9] font-mono text-[10px] uppercase mb-1">
                  Option Code (Alphanumeric)
                </label>
                <input
                  type="text"
                  placeholder="e.g. BRUSHED_SILVER"
                  value={newParam.code}
                  onChange={(e) => setNewParam({ ...newParam, code: e.target.value.toUpperCase() })}
                  className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0ACB9] font-mono text-[10px] uppercase mb-1">
                    Price Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    max="5.0"
                    value={newParam.priceMultiplier}
                    onChange={(e) => setNewParam({ ...newParam, priceMultiplier: Number(e.target.value) })}
                    className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white font-mono"
                    required
                  />
                  <span className="text-[10px] text-[#708090]">e.g. 1.25 = +25%</span>
                </div>

                <div>
                  <label className="block text-[#A0ACB9] font-mono text-[10px] uppercase mb-1">
                    Setup Fee (£)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={newParam.setupCostCents / 100}
                    onChange={(e) =>
                      setNewParam({ ...newParam, setupCostCents: Math.round(Number(e.target.value) * 100) })
                    }
                    className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white font-mono"
                  />
                  <span className="text-[10px] text-[#708090]">e.g. £5.00</span>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full justify-center bg-amber-500 hover:bg-amber-600 text-[#0B0E11] font-bold"
                >
                  Save Material Option
                </Button>
                <Button
                  type="button"
                  variant="dark-outline"
                  size="sm"
                  onClick={() => setIsAddParamModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
