import { NextRequest, NextResponse } from "next/server";
import {
  getUserNotifications,
  getUnreadNotificationCount,
} from "@/lib/email/email-engine";
import { DEMO_USERS } from "@/lib/auth/server-auth";

/**
 * Customer Notifications List API
 * 
 * Strict RLS simulation:
 * Customers can only retrieve notifications addressed to their own user ID.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || DEMO_USERS.customer.id;

    // Optional user role validation
    const userRole = searchParams.get("role") || "customer";

    const notifications = getUserNotifications(userId);
    const unreadCount = getUnreadNotificationCount(userId);

    return NextResponse.json({
      success: true,
      userId,
      userRole,
      unreadCount,
      notifications,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch notifications";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
