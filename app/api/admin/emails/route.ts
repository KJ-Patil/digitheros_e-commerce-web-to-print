import { NextRequest, NextResponse } from "next/server";
import { getSandboxOutbox } from "@/lib/email/email-engine";

/**
 * Admin Sandbox Email Outbox API
 * 
 * Privileged Endpoint:
 * Accessible ONLY to staff administrators. Customers receive HTTP 403 Forbidden.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userRole = searchParams.get("role") || req.headers.get("x-user-role");

    // Guard: Only staff may inspect outbox
    if (userRole !== "admin") {
      return NextResponse.json(
        {
          error: "ACCESS_DENIED: Viewing the factory email dispatch outbox requires administrative staff privileges.",
        },
        { status: 403 }
      );
    }

    const eventType = searchParams.get("eventType") || undefined;
    const recipient = searchParams.get("recipient") || undefined;
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;

    const emails = getSandboxOutbox({
      eventType,
      recipient,
      search,
      status,
    });

    return NextResponse.json({
      success: true,
      totalCount: emails.length,
      emails,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to query email outbox";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
