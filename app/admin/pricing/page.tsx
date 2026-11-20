"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PricingRule {
  id: string;
  product_id: string;
  base_rate_per_sqcm_cents: number;
  min_order_cents: number;
  setup_fee_cents: number;
  vat_percentage: number;
}

interface VolumeDiscount {
  id: string;
  division_id?: string;
  product_id?: string;
  min_quantity: number;
  discount_percentage: number;
}

interface ProductRef {
  id: string;
  name: string;
  slug: string;
}

export default function AdminPricingPage() {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [volumeDiscounts, setVolumeDiscounts] = useState<VolumeDiscount[]>([]);
  const [products, setProducts] = useState<ProductRef[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<{ rule: PricingRule; productName: string } | null>(null);
  const [ruleForm, setRuleForm] = useState({
    baseRatePerSqcmCents: 2,
    minOrderCents: 1500,
    setupFeeCents: 1000,
    vatPercentage: 20.0,
  });
  const [isAddTierModalOpen, setIsAddTierModalOpen] = useState(false);
  const [newTier, setNewTier] = useState({ minQuantity: 2000, discountPercentage: 40.0 });
  const [msg, setMsg] = useState<string | null>(null);

  const fetchPricing = () => {
    setIsLoading(true);
    fetch("/api/admin/pricing")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPricingRules(data.pricingRules || []);
          setVolumeDiscounts(data.volumeDiscounts || []);
          setProducts(data.products || []);
        }
      })
      .catch((err) => console.error("Pricing fetch error:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const handleEditRuleClick = (rule: PricingRule) => {
    const prod = products.find((p) => p.id === rule.product_id);
    setSelectedRule({ rule, productName: prod?.name || "Product Rule" });
    setRuleForm({
      baseRatePerSqcmCents: rule.base_rate_per_sqcm_cents,
      minOrderCents: rule.min_order_cents,
      setupFeeCents: rule.setup_fee_cents,
      vatPercentage: rule.vat_percentage,
    });
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRule) return;

    try {
      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_RULE",
          ruleId: selectedRule.rule.id,
          ruleData: ruleForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setMsg(`✓ Updated pricing formula for ${selectedRule.productName}!`);
      setSelectedRule(null);
      fetchPricing();
      setTimeout(() => setMsg(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving rule");
    }
  };

  const handleAddTier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_VOLUME_TIER",
          discountData: newTier,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add tier");

      setMsg(`✓ Added ${newTier.minQuantity}+ units tier with ${newTier.discountPercentage}% discount!`);
      setIsAddTierModalOpen(false);
      fetchPricing();
      setTimeout(() => setMsg(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error adding tier");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252E38] pb-6">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-400">
            Commercial Rates
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Pricing Rules &amp; Volume Discount Matrices
          </h1>
          <p className="text-xs text-[#8E9CA9] mt-1">
            Configure millimetre surface area base rates, minimum order floors, setup fees, and bulk discount curves.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddTierModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-[#0B0E11] font-bold border-amber-600"
          >
            + Add Discount Tier
          </Button>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded text-emerald-300 text-xs font-mono">
          {msg}
        </div>
      )}

      {/* Product Pricing Rules Table */}
      <div className="bg-[#141A20] border border-[#252E38] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Product Surface Area &amp; Base Rates
          </h3>
          <span className="text-xs font-mono text-[#8E9CA9]">
            Integer Cent Precision (£0.01 = 1 cent)
          </span>
        </div>

        <div className="overflow-x-auto border border-[#252E38] rounded">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0B0E11] text-[#8E9CA9] uppercase text-[10px] border-b border-[#252E38]">
              <tr>
                <th className="p-3">Product Name</th>
                <th className="p-3">Base Rate (cm²)</th>
                <th className="p-3">Min Order Value</th>
                <th className="p-3">Prepress Setup Fee</th>
                <th className="p-3">UK VAT Rate</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E252D] text-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[#8E9CA9]">
                    Loading pricing rules...
                  </td>
                </tr>
              ) : pricingRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[#8E9CA9]">
                    No pricing rules found in database.
                  </td>
                </tr>
              ) : (
                pricingRules.map((r) => {
                  const prod = products.find((p) => p.id === r.product_id);
                  return (
                    <tr key={r.id} className="hover:bg-[#1A222B] transition-colors">
                      <td className="p-3 font-semibold text-white">
                        {prod?.name || "Manufacturing Product"}
                        <span className="text-[10px] text-[#708090] block">{prod?.slug}</span>
                      </td>
                      <td className="p-3 text-amber-400 font-bold">
                        £{(r.base_rate_per_sqcm_cents / 100).toFixed(2)} / cm²
                      </td>
                      <td className="p-3 text-[#CBD5E1]">
                        £{(r.min_order_cents / 100).toFixed(2)}
                      </td>
                      <td className="p-3 text-[#A0ACB9]">
                        £{(r.setup_fee_cents / 100).toFixed(2)}
                      </td>
                      <td className="p-3 text-[#A0ACB9]">
                        {r.vat_percentage}%
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] font-mono"
                          onClick={() => handleEditRuleClick(r)}
                        >
                          Edit Formula
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Volume Discounts Matrix */}
      <div className="bg-[#141A20] border border-[#252E38] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Volume Discount Tiers (All Divisions)
          </h3>
          <span className="text-xs font-mono text-[#8E9CA9]">
            Automatically Applied at Checkout
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {volumeDiscounts.length === 0 ? (
            <div className="col-span-full p-4 text-center text-[#8E9CA9] text-xs font-mono">
              Loading volume discount tiers...
            </div>
          ) : (
            volumeDiscounts.map((tier) => (
              <div
                key={tier.id}
                className="bg-[#0B0E11] border border-[#252E38] rounded-lg p-4 text-center space-y-1"
              >
                <div className="text-[10px] font-mono uppercase text-[#708090]">
                  Min Quantity Threshold
                </div>
                <div className="text-xl font-extrabold text-white">
                  {tier.min_quantity.toLocaleString()}+ units
                </div>
                <div className="text-sm font-bold text-emerald-400 pt-1">
                  {tier.discount_percentage}% OFF
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Pricing Rule Modal */}
      {selectedRule && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#141A20] border border-[#2D3844] rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#252E38] pb-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                  Rule Configuration
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {selectedRule.productName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRule(null)}
                className="text-[#8E9CA9] hover:text-white font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0ACB9] font-mono text-[10px] uppercase mb-1">
                  Base Rate per Square Centimetre (Cents)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={ruleForm.baseRatePerSqcmCents}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, baseRatePerSqcmCents: Number(e.target.value) })
                  }
                  className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white font-mono"
                />
                <span className="text-[10px] text-[#708090]">
                  Current: £{(ruleForm.baseRatePerSqcmCents / 100).toFixed(2)} per cm²
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0ACB9] font-mono text-[10px] uppercase mb-1">
                    Min Order (£)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="5"
                    required
                    value={ruleForm.minOrderCents / 100}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        minOrderCents: Math.round(Number(e.target.value) * 100),
                      })
                    }
                    className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#A0ACB9] font-mono text-[10px] uppercase mb-1">
                    Setup Fee (£)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={ruleForm.setupFeeCents / 100}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        setupFeeCents: Math.round(Number(e.target.value) * 100),
                      })
                    }
                    className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A0ACB9] font-mono text-[10px] uppercase mb-1">
                  VAT Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  required
                  value={ruleForm.vatPercentage}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, vatPercentage: Number(e.target.value) })
                  }
                  className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white font-mono"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full justify-center bg-amber-500 hover:bg-amber-600 text-[#0B0E11] font-bold"
                >
                  Save Pricing Rule
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRule(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Volume Tier Modal */}
      {isAddTierModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#141A20] border border-[#2D3844] rounded-lg max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#252E38] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Add Volume Discount Tier
              </h3>
              <button
                onClick={() => setIsAddTierModalOpen(false)}
                className="text-[#8E9CA9] hover:text-white font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddTier} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0ACB9] font-mono text-[10px] uppercase mb-1">
                  Minimum Order Quantity *
                </label>
                <input
                  type="number"
                  min="10"
                  required
                  value={newTier.minQuantity}
                  onChange={(e) =>
                    setNewTier({ ...newTier, minQuantity: Number(e.target.value) })
                  }
                  placeholder="e.g. 2500"
                  className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[#A0ACB9] font-mono text-[10px] uppercase mb-1">
                  Discount Percentage (%) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="80"
                  required
                  value={newTier.discountPercentage}
                  onChange={(e) =>
                    setNewTier({ ...newTier, discountPercentage: Number(e.target.value) })
                  }
                  placeholder="e.g. 40"
                  className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white font-mono"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full justify-center bg-amber-500 hover:bg-amber-600 text-[#0B0E11] font-bold"
                >
                  Add Discount Tier
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddTierModalOpen(false)}
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
