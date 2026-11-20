import { NextRequest, NextResponse } from "next/server";
import { updateOrderTracking } from "@/lib/orders/order-store";
import { sendLifecycleEmail } from "@/lib/email/email-engine";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await req.json();

    const {
      courierName,
      trackingNumber,
      trackingUrl,
      dispatchStatus = "DISPATCHED",
      estimatedDelivery,
    } = body;

    const updatedOrder = updateOrderTracking(orderId, {
      courierName,
      trackingNumber,
      trackingUrl,
      dispatchStatus,
      estimatedDelivery,
    });

    // Send in-app notification & transactional alert
    try {
      await sendLifecycleEmail({
        eventType: "JOB_COMPLETED_DISPATCHED",
        recipient: {
          email: updatedOrder.customerEmail,
          name: updatedOrder.customerName,
          userId: updatedOrder.customerId,
        },
        referenceId: updatedOrder.orderNumber,
        data: {
          orderNumber: updatedOrder.orderNumber,
          customerName: updatedOrder.customerName,
          customerEmail: updatedOrder.customerEmail,
          productName: updatedOrder.productName,
          quantity: updatedOrder.quantity,
          carrier: updatedOrder.deliveryTracking?.courierName || "Courier",
          trackingNumber: updatedOrder.deliveryTracking?.trackingNumber || "",
          trackingUrl: updatedOrder.deliveryTracking?.trackingUrl || "",
          invoiceDownloadUrl: `/api/invoices/${updatedOrder.id}/pdf?userId=${updatedOrder.customerId}`,
          dispatchedAt: updatedOrder.deliveryTracking?.dispatchedAt || new Date().toISOString(),
        },
      });
    } catch (emailErr) {
      console.warn("[TRACKING_NOTIFICATION_WARN]", emailErr);
    }

    // Persist to Supabase if connected
    try {
      if (supabaseAdmin) {
        await supabaseAdmin
          .from("orders")
          .update({
            status: updatedOrder.status,
            pipeline_stage: updatedOrder.stage,
            updated_at: updatedOrder.updatedAt,
          })
          .eq("id", updatedOrder.id);

        await supabaseAdmin.from("order_status_history").insert({
          order_id: updatedOrder.id,
          to_stage: updatedOrder.stage,
          notes: `Courier: ${courierName || "Standard"}, Tracking #: ${trackingNumber || "N/A"} (${dispatchStatus})`,
        });
      }
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      message: `Tracking recorded for order ${updatedOrder.orderNumber}. In-app notification generated.`,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("[UPDATE_TRACKING_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update tracking." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  return POST(req, context);
}
