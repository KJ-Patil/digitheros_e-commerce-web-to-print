import { NextRequest, NextResponse } from "next/server";
import { markAllNotificationsAsRead } from "@/lib/email/email-engine";

/**
 * Mark all notifications as read for current authenticated user
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "INVALID_REQUEST: userId is required." },
        { status: 400 }
      );
    }

    const markedCount = markAllNotificationsAsRead(userId);

    return NextResponse.json({
      success: true,
      message: `${markedCount} notifications marked as read.`,
      markedCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to mark notifications";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
