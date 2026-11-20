import { NextRequest, NextResponse } from "next/server";
import { processPaymentWebhook } from "@/lib/orders/order-store";
import { sendLifecycleEmail } from "@/lib/email/email-engine";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Internal Simulated Payment Webhook Handler
 * 
 * Supports Success, Failure, and Cancellation outcomes.
 * Idempotent: repeated deliveries for the same event ID are safely acknowledged
 * without creating duplicate orders or modifying state multiple times.
 * Dispatches in-app alerts and records audit trail into Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    const event = await req.json();

    if (!event || !event.id || !event.type) {
      return NextResponse.json({ error: "Invalid webhook payload structure." }, { status: 400 });
    }

    const result = processPaymentWebhook(event);

    // If order successfully captured and not a duplicate webhook delivery, sync to Supabase and trigger alerts
    if (result.order && !result.duplicate) {
      if (event.type === "checkout.session.completed") {
        // Persist payment record into Supabase public.payments
        if (supabaseAdmin) {
          try {
            await supabaseAdmin.from("payments").insert({
              order_id: result.order.id,
              provider: "demo_simulated",
              transaction_id: result.order.paymentDetails.transactionId || `pi_sim_${Date.now()}`,
              amount_cents: result.order.pricing.totalCents,
              currency: "GBP",
              status: "PAID",
              payment_method_details: {
                brand: result.order.paymentDetails.cardBrand || "visa",
                last4: result.order.paymentDetails.cardLast4 || "4242",
                simulation: true,
                environment: "DEMO_SIMULATION",
              },
            });

            await supabaseAdmin.from("orders").update({
              stage: "PROOF",
              updated_at: new Date().toISOString(),
            }).eq("id", result.order.id);
          } catch (dbErr) {
            console.warn("Non-blocking Supabase payment sync warning:", dbErr);
          }
        }

        // Trigger in-app lifecycle notification
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
          console.error("Non-blocking notification error:", err);
        });
      } else if (event.type === "checkout.session.failed") {
        // Persist failed payment record into Supabase
        if (supabaseAdmin) {
          try {
            await supabaseAdmin.from("payments").insert({
              order_id: result.order.id,
              provider: "demo_simulated",
              transaction_id: `fail_${Date.now()}`,
              amount_cents: result.order.pricing.totalCents,
              currency: "GBP",
              status: "FAILED",
              payment_method_details: {
                reason: result.order.paymentDetails.declineReason || "Card declined",
                simulation: true,
              },
            });
          } catch (dbErr) {
            console.warn("Non-blocking Supabase failed payment sync warning:", dbErr);
          }
        }
      }
    }

    return NextResponse.json({
      received: true,
      success: result.success,
      duplicate: result.duplicate,
      message: result.message,
      orderId: result.order?.id,
      orderNumber: result.order?.orderNumber,
      stage: result.order?.stage,
      status: result.order?.status,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook processing error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
