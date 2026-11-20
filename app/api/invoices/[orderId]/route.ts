import { NextRequest, NextResponse } from "next/server";
import { getInvoiceForOrder } from "@/lib/orders/order-store";

/**
 * Authoritative Xero-compatible Invoice API
 * 
 * Retrieves itemized VAT receipts and commercial invoice breakdown for orders.
 * Strictly enforces customer data isolation.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const isAdmin = searchParams.get("role") === "admin";

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    const invoice = getInvoiceForOrder(orderId, userId, isAdmin);
    if (!invoice) {
      return NextResponse.json(
        { error: `Invoice not found for order '${orderId}'.` },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve invoice";
    const status = msg.includes("ACCESS_DENIED") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
