import { NextRequest, NextResponse } from "next/server";
import { sendLifecycleEmail } from "@/lib/email/email-engine";

/**
 * In-Memory Quote Store for Bespoke Inquiries
 */
export interface QuoteRequestRecord {
  id: string;
  quoteNumber: string;
  divisionSlug: string;
  divisionName: string;
  productSlug: string;
  productName: string;
  dimensionsMm: { width: number; height: number };
  quantity: number;
  specsSummary: string;
  customerName: string;
  customerEmail: string;
  companyName?: string;
  notes?: string;
  targetResponseHours: number;
  estimatedPriceCents?: number;
  status: "SUBMITTED" | "ESTIMATING" | "SENT" | "CONVERTED" | "DECLINED";
  createdAt: string;
}

export const QUOTE_REQUESTS_STORE: QuoteRequestRecord[] = [
  {
    id: "quo_001",
    quoteNumber: "QUO-2026-0042",
    divisionSlug: "laser-cutting",
    divisionName: "Laser-Cut Work",
    productSlug: "laser-cut-acrylic-signage",
    productName: "Laser-Cut Acrylic Directional Signs",
    dimensionsMm: { width: 600, height: 400 },
    quantity: 12,
    specsSummary: "5mm Frosted Matte Acrylic • Flame Polished Edges • 600x400mm",
    customerName: "Jordan Lee",
    customerEmail: "customer-b@digitalheroes.demo",
    companyName: "Alpine Enduro Club",
    notes: "Requires four 10mm pre-drilled corner holes for stainless steel standoffs.",
    targetResponseHours: 2,
    estimatedPriceCents: 38400,
    status: "SUBMITTED",
    createdAt: "2026-03-24T15:20:00.000Z",
  },
];

/**
 * Submit Bespoke Trade Quote Request API
 * Creates quote inquiry and dispatches QUOTE_SUBMITTED lifecycle alert.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerEmail,
      companyName,
      divisionSlug,
      divisionName,
      productSlug,
      productName,
      widthMm,
      heightMm,
      quantity,
      specsSummary,
      notes,
      estimatedPriceCents,
      userId,
    } = body;

    if (
      !customerName ||
      !customerEmail ||
      !productName ||
      !widthMm ||
      !heightMm ||
      !quantity
    ) {
      return NextResponse.json(
        {
          error:
            "INVALID_REQUEST: customerName, customerEmail, productName, dimensions, and quantity are required.",
        },
        { status: 400 }
      );
    }

    const quoteSeq = (QUOTE_REQUESTS_STORE.length + 43).toString().padStart(4, "0");
    const quoteNumber = `QUO-2026-${quoteSeq}`;

    const quoteRecord: QuoteRequestRecord = {
      id: `quo_${Date.now()}`,
      quoteNumber,
      divisionSlug: divisionSlug || "custom-print",
      divisionName: divisionName || "Custom Fabrication",
      productSlug: productSlug || "bespoke-work",
      productName,
      dimensionsMm: {
        width: Number(widthMm),
        height: Number(heightMm),
      },
      quantity: Number(quantity),
      specsSummary: specsSummary || `${widthMm}x${heightMm}mm custom specification`,
      customerName,
      customerEmail,
      companyName,
      notes,
      targetResponseHours: 2,
      estimatedPriceCents: estimatedPriceCents ? Number(estimatedPriceCents) : undefined,
      status: "SUBMITTED",
      createdAt: new Date().toISOString(),
    };

    QUOTE_REQUESTS_STORE.unshift(quoteRecord);

    // Dispatch QUOTE_SUBMITTED email alert via Email Engine
    const emailResult = await sendLifecycleEmail({
      eventType: "QUOTE_SUBMITTED",
      recipient: {
        email: customerEmail,
        name: customerName,
        userId,
      },
      referenceId: quoteNumber,
      qualifier: "initial",
      data: {
        quoteNumber,
        customerName,
        customerEmail,
        divisionName: quoteRecord.divisionName,
        productName: quoteRecord.productName,
        specsSummary: quoteRecord.specsSummary,
        dimensionsMm: quoteRecord.dimensionsMm,
        quantity: quoteRecord.quantity,
        estimatedPriceCents: quoteRecord.estimatedPriceCents,
        customerNotes: quoteRecord.notes,
        targetResponseHours: quoteRecord.targetResponseHours,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Quote request ${quoteNumber} registered. Confirmation email dispatched.`,
      quote: quoteRecord,
      emailAlert: emailResult,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Quote submission failed";
    const status = msg.includes("SECURITY_VIOLATION") ? 422 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

/**
 * List quotes (Filtered by user or all for admin)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const userRole = searchParams.get("role") || "customer";

    let quotes = [...QUOTE_REQUESTS_STORE];
    if (userRole !== "admin" && userId) {
      // In demo, check email or customer
      quotes = quotes.filter(
        (q) => q.customerEmail.includes("customer") || q.customerEmail.includes("demo")
      );
    }

    return NextResponse.json({
      success: true,
      quotes,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve quotes";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
