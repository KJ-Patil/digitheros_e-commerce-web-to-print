import { NextRequest, NextResponse } from "next/server";
import { BATCH_JOBS_STORE } from "@/lib/print-engine/variable-data";

/**
 * Variable-Data Batch Job Status API
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await context.params;

    const job = BATCH_JOBS_STORE[jobId];
    if (!job) {
      return NextResponse.json(
        { error: `Variable merge job '${jobId}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Status check failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
