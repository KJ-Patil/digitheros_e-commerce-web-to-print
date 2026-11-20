"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  useEffect(() => {
    fetchCatalog();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252E38] pb-6">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-400">
            Catalog &amp; Substrates
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Manufacturing Products &amp; Materials
          </h1>
          <p className="text-xs text-[#8E9CA9] mt-1">
            Manage product dimensional limits, bleed boundaries, and material multiplier formulas across all 6 factory divisions.
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

      {/* Products Grid */}
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
                      {prod.is_active ? "ACTIVE" : "DISABLED"}
                    </Badge>
                  </div>

                  <p className="text-xs text-[#8E9CA9] line-clamp-2">{prod.description}</p>

                  {/* Specifications */}
                  <div className="p-2.5 bg-[#0B0E11] rounded border border-[#1E252D] text-[11px] font-mono text-[#A0ACB9] space-y-1">
                    <div className="flex justify-between">
                      <span>Width Range:</span>
                      <span className="text-white font-bold">
                        {prod.min_width_mm}mm - {prod.max_width_mm}mm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Height Range:</span>
                      <span className="text-white font-bold">
                        {prod.min_height_mm}mm - {prod.max_height_mm}mm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bleed / Safe Margin:</span>
                      <span className="text-white font-bold">
                        +{prod.bleed_margin_mm}mm / -{prod.safe_margin_mm}mm
                      </span>
                    </div>
                  </div>

                  {/* Materials list */}
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#708090] font-bold mb-1.5 flex justify-between">
                      <span>Configured Options ({prodParams.length})</span>
                    </div>
                    <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                      {prodParams.length === 0 ? (
                        <div className="text-[10px] font-mono text-[#5A6775]">
                          Default material baseline (1.000x multiplier)
                        </div>
                      ) : (
                        prodParams.map((param) => (
                          <div
                            key={param.id}
                            className="flex items-center justify-between text-[11px] font-mono bg-[#1A222B] px-2 py-1 rounded"
                          >
                            <span className="text-white truncate max-w-[140px]">
                              {param.name}
                            </span>
                            <span className="text-amber-400 font-bold">
                              {param.price_multiplier}x
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 mt-4 border-t border-[#1E252D] flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[11px] font-mono"
                    onClick={() => {
                      setSelectedProduct(prod);
                      setIsAddParamModalOpen(true);
                    }}
                  >
                    + Add Material
                  </Button>

                  <Button
                    variant={prod.is_active ? "danger" : "primary"}
                    size="sm"
                    className="text-[11px] font-mono"
                    onClick={() => handleToggleProduct(prod)}
                  >
                    {prod.is_active ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Parameter Modal */}
      {isAddParamModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#141A20] border border-[#2D3844] rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#252E38] pb-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                  {selectedProduct.name}
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Add Material / Finish Option
                </h3>
              </div>
              <button
                onClick={() => setIsAddParamModalOpen(false)}
                className="text-[#8E9CA9] hover:text-white font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddParameter} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0ACB9] font-mono text-[10px] uppercase mb-1">
                  Option Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brushed Silver Metallic Foil"
                  value={newParam.name}
                  onChange={(e) =>
                    setNewParam({
                      ...newParam,
                      name: e.target.value,
                      code: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                    })
                  }
                  className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white placeholder-[#5A6775]"
                />
              </div>

              <div>
                <label className="block text-[#A0ACB9] font-mono text-[10px] uppercase mb-1">
                  Option Code (Unique)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BRUSHED_SILVER"
                  value={newParam.code}
                  onChange={(e) => setNewParam({ ...newParam, code: e.target.value })}
                  className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0ACB9] font-mono text-[10px] uppercase mb-1">
                    Price Multiplier *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.0"
                    max="5.0"
                    required
                    value={newParam.priceMultiplier}
                    onChange={(e) =>
                      setNewParam({ ...newParam, priceMultiplier: Number(e.target.value) })
                    }
                    className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white font-mono"
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
                  variant="outline"
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
