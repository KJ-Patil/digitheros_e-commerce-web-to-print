import { NextRequest, NextResponse } from "next/server";
import { processPaymentWebhook } from "@/lib/orders/order-store";
import { sendLifecycleEmail } from "@/lib/email/email-engine";

/**
 * Stripe Payment Webhook Handler
 * 
 * Idempotent: repeated deliveries for the same event ID are safely acknowledged
 * without creating duplicate orders or modifying state multiple times.
 * Dispatches ORDER_CONFIRMED lifecycle email alert upon successful payment capture.
 */
export async function POST(req: NextRequest) {
  try {
    const event = await req.json();

    if (!event || !event.id || !event.type) {
      return NextResponse.json({ error: "Invalid webhook payload structure." }, { status: 400 });
    }

    const result = processPaymentWebhook(event);

    // If order successfully captured and not a duplicate webhook delivery, trigger ORDER_CONFIRMED alert
    if (result.order && !result.duplicate) {
      await sendLifecycleEmail({
        eventType: "ORDER_CONFIRMED",
        recipient: {
          email: result.order.customerEmail,
          name: result.order.customerName,
          userId: result.order.customerId,
        },
        referenceId: result.order.orderNumber,
        qualifier: "initial",
        data: {
          orderNumber: result.order.orderNumber,
          customerName: result.order.customerName,
          customerEmail: result.order.customerEmail,
          divisionName: result.order.divisionName,
          productName: result.order.productName,
          specsSummary: result.order.specsSummary,
          quantity: result.order.quantity,
          subtotalCents: result.order.pricing.subtotalCents,
          vatCents: result.order.pricing.vatCents,
          totalCents: result.order.pricing.totalCents,
          shippingAddress: result.order.shippingAddress,
          estimatedDispatchDays: 3,
        },
      }).catch((err) => {
        console.error("Non-blocking email dispatch notification error:", err);
      });
    }

    return NextResponse.json({
      received: true,
      duplicate: result.duplicate,
      message: result.message,
      orderId: result.order?.id,
      orderNumber: result.order?.orderNumber,
      stage: result.order?.stage,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook processing error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
