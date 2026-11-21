import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/orders/order-store";
import { createShipment, CarrierType } from "@/lib/shipping/carrier-adapter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let orderId: string | undefined;
    let carrier: CarrierType = "ROYAL_MAIL";
    let serviceCode: string | undefined;
    let packageFormat: any = "smallParcel";

    // Attempt to parse JSON body with fallback to query params
    try {
      const body = await req.json();
      orderId = body.orderId;
      if (body.carrier) carrier = body.carrier;
      serviceCode = body.serviceCode;
      if (body.packageFormat) packageFormat = body.packageFormat;
    } catch {
      // If PowerShell or client sent malformed JSON quotes, fallback to URL search params
      orderId = req.nextUrl.searchParams.get("orderId") || undefined;
      const qCarrier = req.nextUrl.searchParams.get("carrier");
      if (qCarrier) carrier = qCarrier as CarrierType;
    }

    if (!orderId) {
      orderId = req.nextUrl.searchParams.get("orderId") || undefined;
    }

    if (!orderId) {
      return NextResponse.json({ error: "Missing required orderId parameter." }, { status: 400 });
    }

    const order = getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: `Order '${orderId}' not found.` }, { status: 404 });
    }

    const result = await createShipment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      carrier: carrier as CarrierType,
      serviceCode,
      packageFormat,
      recipient: {
        fullName: order.shippingAddress.recipientName || order.customerName,
        companyName: order.shippingAddress.companyName,
        addressLine1: order.shippingAddress.addressLine1,
        addressLine2: order.shippingAddress.addressLine2,
        city: order.shippingAddress.city,
        county: order.shippingAddress.countyOrState,
        postcode: order.shippingAddress.postcode,
        countryCode: order.shippingAddress.country || "GB",
        phone: order.shippingAddress.phone,
        email: order.customerEmail,
      },
      items: [
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          productName: order.productName,
          quantity: order.quantity,
          weightGrams: Math.max(250, Math.round(order.quantity * 2)),
          valuePounds: +(order.pricing.subtotalCents / 100).toFixed(2),
        },
      ],
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("[CREATE_SHIPPING_LABEL_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate shipping label." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
