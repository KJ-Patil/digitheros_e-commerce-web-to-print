import { NextRequest, NextResponse } from "next/server";
import { generateProductionAnalytics } from "@/lib/production/pipeline";

/**
 * Production Throughput & Revenue Reports API
 * Computes machine line loads, division revenue breakdown, and pipeline volume.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || "admin";

    if (role !== "admin") {
      return NextResponse.json(
        { error: "ACCESS_DENIED: Financial reports require staff administrator clearance." },
        { status: 403 }
      );
    }

    const analytics = generateProductionAnalytics();
    return NextResponse.json(analytics);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to compile production reports";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
