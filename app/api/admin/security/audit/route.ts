import { NextRequest, NextResponse } from "next/server";
import { runComprehensiveSecurityAudit } from "@/lib/security/audit-engine";

/**
 * Privileged Security & QA Audit API
 * 
 * Executes full security assessment and returns structured report.
 * Requires administrator role.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userRole = searchParams.get("role") || req.headers.get("x-user-role");

    // Guard: Only administrators may access live penetration test audit
    if (userRole !== "admin") {
      return NextResponse.json(
        {
          error: "ACCESS_DENIED: Viewing the factory security audit report requires administrative staff privileges.",
        },
        { status: 403 }
      );
    }

    const report = runComprehensiveSecurityAudit();

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate security audit";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
