import { NextRequest, NextResponse } from "next/server";
import { syncOrderToXero } from "@/lib/accounting/xero-client";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const result = await syncOrderToXero(orderId);

    return NextResponse.json({
      success: true,
      result: {
        mode: result.mode,
        invoiceNumber: result.invoiceNumber,
        orderNumber: result.orderNumber,
        xeroReference: result.xeroReference,
        status: result.status,
        currency: result.currency,
        subtotalPounds: result.subtotalPounds,
        vatPounds: result.vatPounds,
        totalPounds: result.totalPounds,
        pdfInvoiceFileName: result.pdfInvoiceFileName,
        message: result.message,
        timestamp: result.timestamp,
        mappedPayload: result.mappedPayload,
      },
    });
  } catch (error: any) {
    console.error("[XERO_SYNC_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync invoice with Xero." },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  return POST(req, context);
}
