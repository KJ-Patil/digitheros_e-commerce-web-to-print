import { NextRequest, NextResponse } from "next/server";
import { markNotificationAsRead } from "@/lib/email/email-engine";

/**
 * Mark a single in-app notification as read
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const userId = body.userId;

    if (!id || !userId) {
      return NextResponse.json(
        { error: "INVALID_REQUEST: notification ID and userId are required." },
        { status: 400 }
      );
    }

    const updated = markNotificationAsRead(id, userId);

    return NextResponse.json({
      success: true,
      message: "Notification marked as read.",
      notification: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update notification";
    const status = msg.includes("NOT_FOUND") ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
