import { NextRequest, NextResponse } from "next/server";
import { processCarrierTrackingWebhook, CarrierType } from "@/lib/shipping/carrier-adapter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const carrierQuery = req.nextUrl.searchParams.get("carrier") || "ROYAL_MAIL";
    const carrier = carrierQuery.toUpperCase().includes("DPD") ? "DPD" : "ROYAL_MAIL";

    const payload = await req.json();

    const webhookResult = processCarrierTrackingWebhook(carrier as CarrierType, payload);

    return NextResponse.json({
      received: true,
      result: webhookResult,
    });
  } catch (error: any) {
    console.error("[CARRIER_TRACKING_WEBHOOK_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process tracking webhook." },
      { status: 500 }
    );
  }
}
