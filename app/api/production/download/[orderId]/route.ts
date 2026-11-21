import { NextRequest, NextResponse } from "next/server";
import { checkProductionFileUnlockGate, findProofState } from "@/lib/proofs/proof-engine";
import { generateProductionPrintFile, generateProductionPngFile } from "@/lib/print-engine/generator";

/**
 * Server-Side Authoritative Production File Download Gate
 * 
 * Enforces Level 2 PRD Section 8 Rule:
 * Staff & systems CANNOT download or stream production print-ready files until
 * the customer has officially recorded a signed digital proof approval.
 * 
 * Returns HTTP 423 (Locked) if proof approval gate is locked.
 * Streams genuine 300 DPI PDF with bleed & crop marks when format=pdf.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");
    const userRole = searchParams.get("role") || req.headers.get("x-user-role");

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    // STAFF-ONLY RULE: Customers are denied access to raw factory production files
    if (userRole === "customer") {
      return NextResponse.json(
        {
          error: "ACCESS_DENIED",
          message: "STAFF-ONLY RULE: Registered customers are strictly prohibited from downloading internal factory production print files.",
          statusCode: 403,
        },
        { status: 403 }
      );
    }

    const gate = checkProductionFileUnlockGate(orderId);
    const proofState = findProofState(orderId);

    // GATE ENFORCEMENT: HTTP 423 Locked
    if (!gate.isUnlocked) {
      return NextResponse.json(
        {
          error: "APPROVAL_GATE_LOCKED",
          message: gate.reason,
          isUnlocked: false,
          currentVersion: proofState?.currentVersion || null,
          statusCode: 423,
        },
        { status: 423 }
      );
    }

    // Stream genuine binary PDF file if requested
    if (format === "pdf") {
      const pdfResult = generateProductionPrintFile(orderId);
      return new NextResponse(pdfResult.pdfContent, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${pdfResult.fileName}"`,
          "Content-Length": String(pdfResult.fileSizeBytes),
          "X-Digital-Signature": pdfResult.prepressSummary.digitalSignatureHash || "unverified",
        },
      });
    }

    // Stream genuine binary 300 DPI PNG file if requested
    if (format === "png") {
      const pngResult = generateProductionPngFile(orderId);
      return new NextResponse(new Uint8Array(pngResult.pngBuffer), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${pngResult.fileName}"`,
          "Content-Length": String(pngResult.fileSizeBytes),
          "X-Digital-Signature": pngResult.prepressSummary.digitalSignatureHash || "unverified",
        },
      });
    }

    // Unlocked: Authorized production payload metadata
    return NextResponse.json({
      success: true,
      isUnlocked: true,
      message: gate.reason,
      orderId: proofState?.orderId || orderId,
      orderNumber: proofState?.orderNumber || orderId,
      fileName: `${proofState?.orderNumber || orderId}_Production_Output_300DPI_Bleed.pdf`,
      downloadUrl: `/api/production/download/${orderId}?format=pdf`,
      pngDownloadUrl: `/api/production/download/${orderId}?format=png`,
      fileSize: "14.2 MB",
      status: "READY_FOR_PRESS",
      printSpecs: {
        dimensions: proofState?.dimensions || "Standard",
        resolution: "300 DPI",
        bleed: "3.0 mm",
        safeZone: "3.0 mm inner",
        colorProfile: "CMYK (ISO Coated v2 / FOGRA39)",
        iccProfile: {
          name: "ISO Coated v2 (ECI) / FOGRA39",
          standard: "ISO 15076-1 / ICC.1:2010-12",
          class: "prtr (Printer)",
          colorSpace: "CMYK",
          sizeBytes: 488,
          isEmbeddedBinary: true,
          downloadUrl: "/api/production/icc/FOGRA39",
        },
        cropMarks: true,
        spotSeparation: "CutContour (Magenta #FF00FF)",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Download check failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
