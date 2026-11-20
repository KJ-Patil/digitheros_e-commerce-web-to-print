import { NextRequest, NextResponse } from "next/server";
import { resendSandboxEmail } from "@/lib/email/email-engine";

/**
 * Admin Resend Email API
 * Allows authorized staff to manually trigger re-dispatch of an alert to customer.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const user = body.user || {
      id: "00000000-0000-0000-0000-000000000099",
      fullName: "Sarah Connor (Staff #04)",
      role: "admin",
    };

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "ACCESS_DENIED: Only production staff may trigger manual re-dispatches." },
        { status: 403 }
      );
    }

    const resent = resendSandboxEmail(id, {
      userId: user.id,
      fullName: user.fullName,
    });

    return NextResponse.json({
      success: true,
      message: `Email '${id}' re-transmitted to ${resent.to}.`,
      email: resent,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Resend operation failed";
    const status = msg.includes("NOT_FOUND") ? 404 : msg.includes("ACCESS_DENIED") ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
