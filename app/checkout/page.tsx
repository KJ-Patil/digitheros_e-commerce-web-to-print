"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import {
  IconCheck,
  IconLock,
  IconShield,
} from "@/components/ui/icons";
import { calculatePrice, getProductBySlug, type PricingCalculationResult } from "@/lib/pricing/engine";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Extract initial query parameters with robust fallbacks
  const productSlug = searchParams.get("product") || "vinyl-stickers";
  const initialWidth = Number(searchParams.get("width")) || 75;
  const initialHeight = Number(searchParams.get("height")) || 50;
  const initialQty = Number(searchParams.get("qty")) || 500;
  const materialCode = searchParams.get("material") || undefined;
  const finishCode = searchParams.get("finish") || undefined;
  const cutTypeCode = searchParams.get("cutType") || undefined;

  // Selected catalog item
  const foundProduct = getProductBySlug(productSlug);
  const product = foundProduct || {
    slug: productSlug,
    name: "Custom Print Specification",
    divisionSlug: "labels",
  };

  // Shipping Form State
  const [shipping, setShipping] = useState({
    recipientName: user?.full_name || "Alex Miller",
    companyName: "Peak Coffee Roasters",
    addressLine1: "14 Foundry Lane",
    addressLine2: "Suite 4B",
    city: "Sheffield",
    postcode: "S3 8HQ",
    country: "United Kingdom",
  });

  const [deliveryMethod, setDeliveryMethod] = useState<"standard" | "express">("standard");
  const deliveryCostCents = deliveryMethod === "express" ? 850 : 0;

  // Payment Form State (Simulated Stripe)
  const [cardBrand, setCardBrand] = useState<"visa" | "mastercard">("visa");
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvc, setCvc] = useState("•••");
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    orderId: string;
    totalCents: number;
    vatCents: number;
    invoiceNumber: string;
  } | null>(null);

  // Authoritative server-side price calculation
  const priceResult: PricingCalculationResult = React.useMemo(() => {
    try {
      return calculatePrice({
        productSlug: product.slug,
        widthMm: initialWidth,
        heightMm: initialHeight,
        quantity: initialQty,
        materialCode,
        finishCode,
        cutTypeCode,
      });
    } catch {
      // Fallback
      return calculatePrice({
        productSlug: "vinyl-stickers",
        widthMm: 75,
        heightMm: 50,
        quantity: 500,
      });
    }
  }, [product.slug, initialWidth, initialHeight, initialQty, materialCode, finishCode, cutTypeCode]);

  const grandTotalCents = priceResult.breakdown.totalCents + deliveryCostCents;

  const handlePayAndOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const currentUser = user
        ? {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
          }
        : {
            id: "00000000-0000-0000-0000-000000000001",
            email: "customer@digitalheroes.demo",
            fullName: shipping.recipientName,
            role: "customer",
          };

      // 1. Create Checkout Session via Server API
      const sessionRes = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: currentUser,
          productSlug: product.slug,
          widthMm: initialWidth,
          heightMm: initialHeight,
          quantity: initialQty,
          materialCode,
          finishCode,
          cutTypeCode,
          shippingAddress: shipping,
        }),
      });

      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(sessionData.error || "Failed to create checkout session");

      // 2. Simulate Webhook Completion (Stripe checkout.session.completed)
      const webhookRes = await fetch("/api/checkout/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `evt_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          type: "checkout.session.completed",
          data: {
            object: {
              id: sessionData.sessionId,
              order_id: sessionData.orderId,
              payment_status: "paid",
              payment_intent: `pi_test_${Date.now()}`,
              amount_total: grandTotalCents,
              card_brand: cardBrand,
              card_last4: cardBrand === "visa" ? "4242" : "5555",
            },
          },
        }),
      });

      const webhookData = await webhookRes.json();
      if (!webhookRes.ok) throw new Error(webhookData.error || "Payment webhook verification failed");

      setCompletedOrder({
        orderNumber: sessionData.orderNumber,
        orderId: sessionData.orderId,
        totalCents: grandTotalCents,
        vatCents: priceResult.breakdown.vatCents,
        invoiceNumber: `INV-${sessionData.orderNumber.replace("ORD-", "")}`,
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Payment processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (completedOrder) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-lg p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <IconCheck className="w-6 h-6 stroke-[3]" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-800">
                Payment Authorized • Order Captured
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight">
                Thank you! Order {completedOrder.orderNumber} is Confirmed.
              </h1>
              <p className="text-sm text-emerald-900/80 leading-relaxed">
                Your payment of <strong>£{(completedOrder.totalCents / 100).toFixed(2)}</strong> (including £{(completedOrder.vatCents / 100).toFixed(2)} UK VAT) has been verified. Initial proof rendering slot <strong>v1</strong> has been queued for your approval.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-emerald-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-white/80 p-3 rounded border border-emerald-200">
              <span className="text-emerald-700 block uppercase">Order ID</span>
              <span className="font-bold text-emerald-950 text-sm">{completedOrder.orderNumber}</span>
            </div>
            <div className="bg-white/80 p-3 rounded border border-emerald-200">
              <span className="text-emerald-700 block uppercase">Invoice Ref (Xero)</span>
              <span className="font-bold text-emerald-950 text-sm">{completedOrder.invoiceNumber}</span>
            </div>
            <div className="bg-white/80 p-3 rounded border border-emerald-200">
              <span className="text-emerald-700 block uppercase">Next Pipeline Stage</span>
              <span className="font-bold text-emerald-950 text-sm inline-flex items-center gap-1">
                <Badge variant="PROOF" size="sm">PROOF v1</Badge>
              </span>
            </div>
          </div>
        </div>

        {/* Pipeline Guidance */}
        <Card className="bg-[#FAF9F5] border-[#E2E1D9]">
          <h3 className="text-sm font-bold text-[#13171C] uppercase font-mono tracking-wider">
            Factory Floor Pipeline Guarantee
          </h3>
          <p className="text-xs text-[#556270] mt-2 leading-relaxed">
            Per Digital Heroes strict production protocols, your physical production files remain securely locked until you review and digitally sign off on Proof Revision v1.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href="/customer/dashboard#proofs">
              <Button variant="primary" size="md">
                Review Proof v1 in Customer Dashboard →
              </Button>
            </Link>
            <Link href="/#calculator">
              <Button variant="outline" size="md">
                Configure Another Job
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Checkout Breadcrumb Header */}
      <div className="border-b border-[#DCDAD0] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[#7D8A98]">
          <Link href="/#calculator" className="hover:text-[#13171C]">Configurator</Link>
          <span>/</span>
          <span className="text-[#E65A28] font-bold">Stripe Checkout</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#13171C] mt-2">
          Secure Order Checkout
        </h1>
        <p className="text-sm text-[#596675] mt-1">
          Review specifications, confirm delivery destination, and authorize test payment.
        </p>
      </div>

      {/* Main Grid: Form Left, Summary Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Delivery & Payment Details (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Shipping Destination */}
          <Card>
            <CardHeader
              tag="DELIVERY DESTINATION"
              title="1. Shipping Address"
              subtitle="Where should our dispatch team deliver your print job?"
            />
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Recipient Full Name</Label>
                  <Input
                    value={shipping.recipientName}
                    onChange={(e) => setShipping({ ...shipping, recipientName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Company / Organisation (Optional)</Label>
                  <Input
                    value={shipping.companyName}
                    onChange={(e) => setShipping({ ...shipping, companyName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Address Line 1</Label>
                <Input
                  value={shipping.addressLine1}
                  onChange={(e) => setShipping({ ...shipping, addressLine1: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Town / City</Label>
                  <Input
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Postcode</Label>
                  <Input
                    value={shipping.postcode}
                    onChange={(e) => setShipping({ ...shipping, postcode: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input value={shipping.country} disabled className="bg-[#EAE8E0]" />
                </div>
              </div>
            </div>

            {/* Delivery Method Selection */}
            <div className="mt-6 pt-6 border-t border-[#ECEBE4]">
              <span className="text-xs font-mono font-bold uppercase text-[#13171C] block mb-3">
                Courier Service Level
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label
                  onClick={() => setDeliveryMethod("standard")}
                  className={`p-3 rounded border cursor-pointer flex flex-col justify-between transition-colors ${
                    deliveryMethod === "standard"
                      ? "border-[#E65A28] bg-[#FDF5F2] text-[#13171C]"
                      : "border-[#DCDAD0] bg-white hover:bg-[#FAF9F5]"
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>Royal Mail 48 Tracked</span>
                    <span className="font-mono text-emerald-700 uppercase">Free</span>
                  </div>
                  <span className="text-[11px] text-[#717F8D] mt-1">2-3 business days after production</span>
                </label>

                <label
                  onClick={() => setDeliveryMethod("express")}
                  className={`p-3 rounded border cursor-pointer flex flex-col justify-between transition-colors ${
                    deliveryMethod === "express"
                      ? "border-[#E65A28] bg-[#FDF5F2] text-[#13171C]"
                      : "border-[#DCDAD0] bg-white hover:bg-[#FAF9F5]"
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>DPD Pre-12:00 Priority</span>
                    <span className="font-mono text-[#13171C]">£ 8.50</span>
                  </div>
                  <span className="text-[11px] text-[#717F8D] mt-1">Guaranteed next morning dispatch</span>
                </label>
              </div>
            </div>
          </Card>

          {/* Payment Section (Simulated Stripe Test Mode) */}
          <Card className="border border-[#13171C]">
            <CardHeader
              tag="PAYMENT METHOD"
              title="2. Simulated Stripe Card Checkout"
              subtitle="Level 2 Prototype: Test Mode. Zero actual money charged."
              action={
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#E65A28] font-bold">
                  <IconShield className="w-3.5 h-3.5" /> TEST MODE ACTIVE
                </span>
              }
            />

            <div className="p-3 bg-amber-50 border border-amber-300 rounded text-xs text-amber-900 mb-4 font-mono">
              <strong>Compliance Notice:</strong> Real card details are never stored or transmitted in plain text. Test cards below are strictly sandbox fixtures.
            </div>

            <form onSubmit={handlePayAndOrder} className="space-y-4">
              {/* Test Card Quick Selector */}
              <div>
                <Label>Choose Test Card Profile</Label>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setCardBrand("visa");
                      setCardNumber("4242 •••• •••• 4242");
                    }}
                    className={`p-2.5 rounded border text-left font-mono ${
                      cardBrand === "visa"
                        ? "border-[#13171C] bg-[#13171C] text-white font-bold"
                        : "border-[#D5D3C8] bg-white text-[#4A5562]"
                    }`}
                  >
                    💳 Visa Test (4242)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCardBrand("mastercard");
                      setCardNumber("5555 •••• •••• 5555");
                    }}
                    className={`p-2.5 rounded border text-left font-mono ${
                      cardBrand === "mastercard"
                        ? "border-[#13171C] bg-[#13171C] text-white font-bold"
                        : "border-[#D5D3C8] bg-white text-[#4A5562]"
                    }`}
                  >
                    💳 Mastercard (5555)
                  </button>
                </div>
              </div>

              <div>
                <Label>Simulated Card Number</Label>
                <Input value={cardNumber} readOnly className="font-mono bg-[#FAF9F5]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Expiration Date</Label>
                  <Input value={expiry} onChange={(e) => setExpiry(e.target.value)} className="font-mono" />
                </div>
                <div>
                  <Label>Security Code (CVC)</Label>
                  <Input value={cvc} onChange={(e) => setCvc(e.target.value)} className="font-mono" />
                </div>
              </div>

              <div className="pt-4 border-t border-[#ECEBE4]">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center text-sm font-bold uppercase tracking-wider py-3"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span>Processing Stripe Transaction...</span>
                  ) : (
                    <span>
                      Pay £{(grandTotalCents / 100).toFixed(2)} & Complete Order →
                    </span>
                  )}
                </Button>
                <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-[#7D8A98] mt-2">
                  <IconLock className="w-3.5 h-3.5" />
                  <span>256-bit encrypted checkout session • Webhook verified</span>
                </div>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Authoritative Order Summary (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="bg-[#FAF9F5] border-2 border-[#13171C] shadow-md">
            <div className="pb-4 border-b border-[#E2E1D9]">
              <span className="text-[11px] font-mono font-bold uppercase text-[#E65A28]">
                Specification Summary
              </span>
              <h3 className="text-lg font-extrabold text-[#13171C] mt-1">
                {product.name}
              </h3>
              <p className="text-xs text-[#5D6A78]">
                Division: {product.divisionSlug.toUpperCase()}
              </p>
            </div>

            {/* Spec Details Table */}
            <div className="py-3 text-xs space-y-2 border-b border-[#E2E1D9] font-mono">
              <div className="flex justify-between">
                <span className="text-[#7A8795]">Finished Cut Size:</span>
                <span className="font-bold text-[#13171C]">{initialWidth} x {initialHeight} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A8795]">Production Area:</span>
                <span className="text-[#13171C]">{priceResult.dimensions.areaSqCm} cm²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A8795]">Print Substrate:</span>
                <span className="font-semibold text-[#13171C]">
                  {priceResult.selectedParameters.material.name}
                </span>
              </div>
              {priceResult.selectedParameters.finish && (
                <div className="flex justify-between">
                  <span className="text-[#7A8795]">Protective Finish:</span>
                  <span className="text-[#13171C]">
                    {priceResult.selectedParameters.finish.name}
                  </span>
                </div>
              )}
              {priceResult.selectedParameters.cutType && (
                <div className="flex justify-between">
                  <span className="text-[#7A8795]">Tooling & Cut:</span>
                  <span className="text-[#13171C]">
                    {priceResult.selectedParameters.cutType.name}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-[#7A8795]">Production Run:</span>
                <span className="font-bold text-[#13171C]">{initialQty.toLocaleString()} units</span>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="pt-4 text-xs space-y-2">
              <div className="flex justify-between text-[#576472]">
                <span>Base Line Item ({initialQty} @ £{(priceResult.breakdown.unitPriceCents / 100).toFixed(2)}/ea)</span>
                <span className="font-mono">
                  £{((priceResult.breakdown.unitPriceCents * initialQty) / 100).toFixed(2)}
                </span>
              </div>

              {priceResult.breakdown.discountSavingsCents > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <span>Volume Discount Savings</span>
                    <Badge variant="success" size="sm">
                      {priceResult.breakdown.volumeDiscountLabel}
                    </Badge>
                  </span>
                  <span className="font-mono">
                    -£{(priceResult.breakdown.discountSavingsCents / 100).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-[#576472]">
                <span>Machine Setup & Tooling Amortization</span>
                <span className="font-mono">
                  £{(priceResult.breakdown.setupFeeCents / 100).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-[#576472]">
                <span>Dispatch & Courier</span>
                <span className="font-mono">
                  {deliveryCostCents === 0 ? "FREE" : `£${(deliveryCostCents / 100).toFixed(2)}`}
                </span>
              </div>

              <div className="pt-2 border-t border-[#E2E1D9] flex justify-between text-[#13171C] font-medium">
                <span>Net Subtotal</span>
                <span className="font-mono font-bold">
                  £{(priceResult.breakdown.subtotalCents / 100).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-[#576472]">
                <span>UK VAT (20.0% Standard Rate)</span>
                <span className="font-mono">
                  £{(priceResult.breakdown.vatCents / 100).toFixed(2)}
                </span>
              </div>

              {/* Total Payable */}
              <div className="pt-3 border-t-2 border-[#13171C] flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-extrabold text-[#13171C] block uppercase font-mono">
                    Total Inc. VAT
                  </span>
                  <span className="text-[10px] text-[#788593]">Xero invoice generated automatically</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-[#E65A28] font-mono">
                    £{(grandTotalCents / 100).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-[#788593] block font-mono">GBP</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center font-mono text-xs text-[#7D8A98]">
          Initializing Secure Stripe Checkout Session...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
