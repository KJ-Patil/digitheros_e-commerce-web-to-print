import { NextRequest, NextResponse } from "next/server";
import { calculateProductPrice, PricingRequest } from "@/lib/pricing/engine";

export async function POST(req: NextRequest) {
  try {
    const body: PricingRequest = await req.json();

    if (!body || !body.productSlug) {
      return NextResponse.json(
        { error: "INVALID_REQUEST: 'productSlug' is required." },
        { status: 400 }
      );
    }

    const result = calculateProductPrice(body);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown calculation error";
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
