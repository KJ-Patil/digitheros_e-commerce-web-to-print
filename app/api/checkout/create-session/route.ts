import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, type CheckoutSessionInput } from "@/lib/orders/order-store";

/**
 * Stripe Simulated Checkout Session Creator
 * 
 * Server-authoritative:
 * Recalculates product prices, discounts, and VAT server-side to prevent client tampering.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customer,
      productSlug,
      widthMm,
      heightMm,
      quantity,
      materialCode,
      finishCode,
      cutTypeCode,
      shippingAddress,
      designId,
    } = body;

    if (!customer || !customer.id) {
      return NextResponse.json(
        { error: "AUTHENTICATION_REQUIRED: Customer account is required for checkout." },
        { status: 401 }
      );
    }

    if (!productSlug || !widthMm || !heightMm || !quantity || !shippingAddress) {
      return NextResponse.json(
        { error: "INVALID_REQUEST: Missing required product configuration or shipping address." },
        { status: 400 }
      );
    }

    const sessionInput: CheckoutSessionInput = {
      customer,
      productSlug,
      widthMm: Number(widthMm),
      heightMm: Number(heightMm),
      quantity: Number(quantity),
      materialCode,
      finishCode,
      cutTypeCode,
      shippingAddress,
      designId,
    };

    const result = createCheckoutSession(sessionInput);

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      checkoutUrl: result.checkoutUrl,
      orderNumber: result.orderDraft.orderNumber,
      orderId: result.orderDraft.id,
      pricing: result.orderDraft.pricing,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Checkout initialization failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
