import { NextRequest, NextResponse } from "next/server";
import { getInvoiceForOrder } from "@/lib/orders/order-store";
import { generateInvoicePdf } from "@/lib/orders/invoice-pdf";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId") || undefined;
    const isAdmin = url.searchParams.get("isAdmin") === "true";

    const invoice = getInvoiceForOrder(orderId, userId, isAdmin);

    if (!invoice) {
      return NextResponse.json(
        {
          error: "Invoice not found or access denied.",
          code: "INVOICE_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Generate internal PDF
    const { fileName, pdfBuffer } = generateInvoicePdf(invoice);

    // Save/Upsert invoice record to Supabase if available
    try {
      if (supabaseAdmin) {
        await supabaseAdmin.from("invoices").upsert(
          {
            order_id: invoice.orderId,
            invoice_number: invoice.invoiceNumber,
            subtotal_cents: invoice.subtotalCents,
            vat_cents: invoice.vatCents,
            total_cents: invoice.totalCents,
            currency: invoice.currency,
            pdf_storage_path: `invoices/${fileName}`,
            xero_invoice_id: invoice.xeroReference,
          },
          { onConflict: "order_id" }
        );
      }
    } catch {
      // Non-blocking for local/in-memory fallback
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("[INVOICE_PDF_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to generate invoice PDF.", details: error.message },
      { status: 500 }
    );
  }
}
