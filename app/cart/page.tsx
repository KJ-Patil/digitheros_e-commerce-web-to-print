"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/navigation/public-nav";
import { PublicFooter } from "@/components/navigation/public-footer";
import { calculatePrice } from "@/lib/pricing/engine";

export interface CartItem {
  id: string;
  productSlug: string;
  productName: string;
  divisionSlug?: string;
  widthMm: number;
  heightMm: number;
  quantity: number;
  materialCode?: string;
  materialName?: string;
  finishCode?: string;
  finishName?: string;
  cutTypeCode?: string;
  cutTypeName?: string;
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("dh_cart_items");
      if (stored) {
        setCartItems(JSON.parse(stored));
      } else {
        // Pre-seed with default configured item if cart is empty for testing
        const sampleItem: CartItem = {
          id: "item_sample_1",
          productSlug: "vinyl-stickers",
          productName: "Custom Vinyl Stickers",
          divisionSlug: "labels",
          widthMm: 75,
          heightMm: 50,
          quantity: 500,
          materialCode: "GLOSS_VINYL",
          materialName: "White Gloss Vinyl (100um)",
        };
        setCartItems([sampleItem]);
        localStorage.setItem("dh_cart_items", JSON.stringify([sampleItem]));
      }
    } catch {
      // ignore
    } finally {
      setIsLoaded(false);
      setIsLoaded(true);
    }
  }, []);

  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem("dh_cart_items", JSON.stringify(items));
  };

  const updateQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      removeItem(id);
      return;
    }
    const updated = cartItems.map((item) =>
      item.id === id ? { ...item, quantity: newQty } : item
    );
    saveCart(updated);
  };

  const removeItem = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id);
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  // Calculate prices for all cart items
  const pricedItems = cartItems.map((item) => {
    try {
      const calc = calculatePrice({
        productSlug: item.productSlug,
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        quantity: item.quantity,
        materialCode: item.materialCode,
        finishCode: item.finishCode,
        cutTypeCode: item.cutTypeCode,
      });
      return {
        ...item,
        unitPriceCents: calc.breakdown.unitPriceCents,
        subtotalCents: calc.breakdown.subtotalCents,
        discountCents: calc.breakdown.discountSavingsCents,
        vatCents: calc.breakdown.vatCents,
        totalCents: calc.breakdown.totalCents,
        appliedDiscountPercentage: calc.breakdown.volumeDiscountPercentage,
      };
    } catch {
      return {
        ...item,
        unitPriceCents: 20,
        subtotalCents: item.quantity * 20,
        discountCents: 0,
        vatCents: Math.round(item.quantity * 20 * 0.2),
        totalCents: Math.round(item.quantity * 20 * 1.2),
        appliedDiscountPercentage: 0,
      };
    }
  });

  const cartNetSubtotalCents = pricedItems.reduce((sum, item) => sum + item.subtotalCents, 0);
  const cartTotalDiscountCents = pricedItems.reduce((sum, item) => sum + item.discountCents, 0);
  const cartVatCents = pricedItems.reduce((sum, item) => sum + item.vatCents, 0);
  const cartGrandTotalCents = pricedItems.reduce((sum, item) => sum + item.totalCents, 0);

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) return;
    const firstItem = cartItems[0];
    router.push(
      `/checkout?product=${firstItem.productSlug}&width=${firstItem.widthMm}&height=${firstItem.heightMm}&qty=${firstItem.quantity}&material=${firstItem.materialCode || ""}`
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4EE]">
      <PublicNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCDAD0] pb-6 mb-8">
          <div>
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#E65A28]">
              Prepress Cart
            </span>
            <h1 className="text-3xl font-extrabold text-[#13171C] mt-1">
              Your Configured Order
            </h1>
            <p className="text-xs sm:text-sm text-[#5B6774] mt-1">
              Review print dimensions, selected substrates, volume discounts, and VAT before checkout.
            </p>
          </div>

          {cartItems.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearCart}>
              Clear Cart
            </Button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E2E1D9] p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="text-4xl">🛒</div>
            <h2 className="text-lg font-bold text-[#13171C]">Your cart is currently empty</h2>
            <p className="text-xs text-[#5D6B7A]">
              Choose a product from our 6 manufacturing divisions to configure custom dimensions and materials.
            </p>
            <div className="pt-2">
              <Link href="/#calculator">
                <Button variant="primary" size="md">
                  Launch Product Configurator →
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {pricedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-[#E2E1D9] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#13171C]">{item.productName}</h3>
                      {item.appliedDiscountPercentage > 0 && (
                        <Badge variant="success" size="sm">
                          {item.appliedDiscountPercentage}% Vol Discount
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs font-mono text-[#576472]">
                      Dimensions: <strong className="text-[#13171C]">{item.widthMm} × {item.heightMm} mm</strong> (+3mm Bleed)
                    </div>
                    {item.materialName && (
                      <div className="text-xs font-mono text-[#576472]">
                        Substrate: <span className="text-[#13171C]">{item.materialName}</span>
                      </div>
                    )}
                    <div className="text-xs font-mono text-emerald-700 font-semibold pt-1">
                      Unit: £{(item.unitPriceCents / 100).toFixed(2)} / unit
                    </div>
                  </div>

                  {/* Quantity and Line Total */}
                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-3">
                    <div className="flex items-center border border-[#CFCECB] rounded bg-[#FAF9F5]">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 100)}
                        className="px-2.5 py-1 text-xs font-bold text-[#556372] hover:bg-[#EAE8E0]"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        step="50"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                        className="w-20 text-center text-xs font-mono font-bold bg-white p-1 border-x border-[#CFCECB] text-[#13171C]"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 100)}
                        className="px-2.5 py-1 text-xs font-bold text-[#556372] hover:bg-[#EAE8E0]"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold text-[#13171C]">
                        £{(item.totalCents / 100).toFixed(2)}
                      </div>
                      <div className="text-[10px] font-mono text-[#7D8A98]">
                        inc. £{(item.vatCents / 100).toFixed(2)} VAT
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[11px] text-rose-600 hover:underline font-mono mt-1 block"
                      >
                        Remove item
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-2">
                <Link href="/#calculator" className="text-xs font-mono text-[#576472] hover:text-[#13171C] underline">
                  ← Add Another Product Specification
                </Link>
              </div>
            </div>

            {/* Pricing Summary Card */}
            <div className="bg-white border border-[#E2E1D9] rounded-lg p-6 space-y-5 shadow-sm sticky top-24">
              <h3 className="text-sm font-bold text-[#13171C] uppercase font-mono tracking-wider border-b border-[#ECEBE4] pb-3">
                Financial Summary
              </h3>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[#576472]">
                  <span>Items Gross Subtotal:</span>
                  <span>£{((cartNetSubtotalCents + cartTotalDiscountCents) / 100).toFixed(2)}</span>
                </div>

                {cartTotalDiscountCents > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Volume Discount Savings:</span>
                    <span>-£{(cartTotalDiscountCents / 100).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#576472]">
                  <span>Net Taxable Subtotal:</span>
                  <span>£{(cartNetSubtotalCents / 100).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-[#576472]">
                  <span>UK VAT (20.0%):</span>
                  <span>£{(cartVatCents / 100).toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t border-[#13171C] flex justify-between items-center text-sm font-extrabold text-[#13171C]">
                  <span>Total Amount (GBP):</span>
                  <span className="text-[#E65A28] text-base">
                    £{(cartGrandTotalCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-center"
                  onClick={handleProceedToCheckout}
                >
                  Proceed to Secure Checkout →
                </Button>
              </div>

              <div className="p-3 bg-[#FAF9F5] border border-[#E2E1D9] rounded text-[11px] text-[#556372] space-y-1">
                <div className="font-bold text-[#13171C]">Factory SLA Guarantee:</div>
                <div>• Prepress proof review within 2 business hours</div>
                <div>• Production RIP files generated only after proof approval</div>
                <div>• Xero-ready official VAT invoice provided</div>
              </div>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
