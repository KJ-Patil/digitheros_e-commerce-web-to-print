import { NextRequest, NextResponse } from "next/server";
import { allocateJobMachine, type MachineLine } from "@/lib/production/pipeline";

/**
 * Machine Allocation API Handler
 * Assigns printing/finishing machine line and floor operator to a production job.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await context.params;
    const body = await req.json();
    const { machine, operator, user } = body;

    if (!jobId || !machine || !operator) {
      return NextResponse.json(
        { error: "INVALID_REQUEST: jobId, machine, and operator are required." },
        { status: 400 }
      );
    }

    const staff = user || {
      id: "00000000-0000-0000-0000-000000000099",
      fullName: "Sarah Connor (Staff #04)",
      role: "admin",
    };

    const updatedJob = allocateJobMachine(jobId, machine as MachineLine, operator, staff);

    return NextResponse.json({
      success: true,
      message: `Job ${jobId} allocated to ${updatedJob.machineName} (Operator: ${operator}).`,
      job: updatedJob,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Machine allocation failed";
    const status = msg.includes("ACCESS_DENIED") ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
