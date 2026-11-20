import { NextRequest, NextResponse } from "next/server";
import { getOrders, getSavedDesigns } from "@/lib/orders/order-store";

/**
 * Orders & Saved Designs API
 * Returns tenant-isolated orders and saved design templates for the customer.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId") || undefined;
    const isAdmin = searchParams.get("role") === "admin";
    const type = searchParams.get("type"); // "designs" or "orders"

    if (type === "designs") {
      if (!customerId) {
        return NextResponse.json({ error: "customerId required for saved designs" }, { status: 400 });
      }
      const designs = getSavedDesigns(customerId);
      return NextResponse.json(designs);
    }

    const orders = getOrders(customerId, isAdmin);
    return NextResponse.json(orders);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch orders";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
