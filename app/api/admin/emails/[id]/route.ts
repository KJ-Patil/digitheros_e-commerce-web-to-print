import { NextRequest, NextResponse } from "next/server";
import { getSandboxEmailById } from "@/lib/email/email-engine";

/**
 * Admin Get Single Dispatched Email API
 * Returns full email metadata, headers, rendered responsive HTML, and plaintext.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const userRole = searchParams.get("role") || req.headers.get("x-user-role");

    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "ACCESS_DENIED: Inspecting email transmission files requires staff role." },
        { status: 403 }
      );
    }

    const email = getSandboxEmailById(id);
    if (!email) {
      return NextResponse.json(
        { error: `NOT_FOUND: Email '${id}' not found in dispatch store.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      email,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve email";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
