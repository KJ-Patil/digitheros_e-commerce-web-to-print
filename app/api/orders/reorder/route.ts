import { NextRequest, NextResponse } from "next/server";
import {
  reorderFromExistingOrder,
  reorderFromSavedDesign,
} from "@/lib/orders/order-store";

/**
 * 1-Click Reorder API Handler
 * 
 * Supports 1-click repeat from:
 * 1. An existing order (sourceOrderId)
 * 2. A saved design template (designId)
 * 
 * Recalculates current pricing authoritatively on the server, creates a new order,
 * sets status to PAID, and queues the initial proof v1 slot in the pipeline.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceOrderId, designId, quantity, user } = body;

    if (!user || !user.id) {
      return NextResponse.json(
        { error: "AUTHENTICATION_REQUIRED: User must be signed in to reorder." },
        { status: 401 }
      );
    }

    if (!sourceOrderId && !designId) {
      return NextResponse.json(
        { error: "INVALID_REQUEST: Either sourceOrderId or designId must be specified." },
        { status: 400 }
      );
    }

    let newOrder;
    if (sourceOrderId) {
      newOrder = reorderFromExistingOrder(sourceOrderId, user, quantity);
    } else if (designId) {
      newOrder = reorderFromSavedDesign(designId, user, quantity);
    }

    return NextResponse.json({
      success: true,
      message: `1-Click reorder successful. Order ${newOrder?.orderNumber} created.`,
      order: newOrder,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Reorder processing failed";
    const status = msg.includes("SECURITY_VIOLATION") ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
