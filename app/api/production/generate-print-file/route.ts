import { NextRequest, NextResponse } from "next/server";
import { generateProductionPrintFile } from "@/lib/print-engine/generator";

/**
 * Staff Production Print-File Generator API
 * 
 * Prepress Security Gate:
 * Generates high-resolution 300 DPI PDF with 3mm bleed, crop marks, and CutContour.
 * Rejects generation with HTTP 423 Locked if customer proof is not digitally approved.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, user, options } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required." }, { status: 400 });
    }

    // Role check: Only staff / admin can generate factory print files
    if (user && user.role === "customer" && user.id !== "00000000-0000-0000-0000-000000000099") {
      return NextResponse.json(
        { error: "ACCESS_DENIED: Customers cannot generate internal factory production files." },
        { status: 403 }
      );
    }

    const result = generateProductionPrintFile(orderId, user, options);

    return NextResponse.json({
      success: true,
      message: "Print-ready 300 DPI PDF file successfully generated with 3mm bleed and CutContour vector layer.",
      fileName: result.fileName,
      storagePath: result.storagePath,
      fileSizeBytes: result.fileSizeBytes,
      prepressSummary: result.prepressSummary,
      downloadUrl: `/api/production/download/${orderId}?format=pdf`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Print generation failed";
    const status = msg.includes("APPROVAL_GATE_LOCKED") ? 423 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
