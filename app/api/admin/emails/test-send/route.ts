import { NextRequest, NextResponse } from "next/server";
import {
  sendLifecycleEmail,
  type EmailEventType,
} from "@/lib/email/email-engine";

/**
 * Admin Test Dispatch API
 * Allows staff to simulate and verify dispatch of all 5 lifecycle email templates.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      eventType,
      recipientEmail,
      recipientName,
      referenceId,
      qualifier,
      templateData,
      user,
      forceResend,
    } = body;

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "ACCESS_DENIED: Test dispatch utility is restricted to administrators." },
        { status: 403 }
      );
    }

    if (!eventType || !recipientEmail || !referenceId || !templateData) {
      return NextResponse.json(
        {
          error:
            "INVALID_REQUEST: eventType, recipientEmail, referenceId, and templateData are required.",
        },
        { status: 400 }
      );
    }

    const result = await sendLifecycleEmail({
      eventType: eventType as EmailEventType,
      recipient: {
        email: recipientEmail,
        name: recipientName || "Test Customer",
        userId: user.id,
      },
      referenceId,
      qualifier: qualifier || "test",
      data: templateData,
      forceResend: Boolean(forceResend),
      requestedByStaff: {
        userId: user.id,
        fullName: user.fullName || "Admin Operator",
      },
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Test dispatch failed";
    const status = msg.includes("SECURITY_VIOLATION")
      ? 422
      : msg.includes("ACCESS_DENIED")
      ? 403
      : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
