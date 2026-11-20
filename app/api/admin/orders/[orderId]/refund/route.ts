import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const { reason = "Customer requested cancellation before RIP processing", staffNotes } = body;

    // 1. Update order payment status in Supabase
    if (supabaseAdmin) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "REFUNDED" })
        .eq("order_id", orderId);

      // Log in order audit history
      await supabaseAdmin.from("order_status_history").insert({
        order_id: orderId,
        new_stage: "QUOTE",
        notes: `REFUND ISSUED: ${reason}. Notes: ${staffNotes || "None"}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Order ${orderId} has been successfully refunded and cancelled.`,
      orderId,
      refundedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Refund processing failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
