import { NextRequest, NextResponse } from "next/server";
import { updateJobPipelineStage, type PipelineStage } from "@/lib/production/pipeline";
import { sendLifecycleEmail } from "@/lib/email/email-engine";

/**
 * Pipeline Stage Update API Handler
 * 
 * Enforces Prepress Security:
 * Cannot advance job to PRODUCTION if digital proof approval has not been signed.
 * Automatically logs immutable audit event.
 * Dispatches JOB_COMPLETED_DISPATCHED or PROOF_READY_FOR_REVIEW alerts on stage transitions.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await context.params;
    const body = await req.json();
    const { newStage, user, notes } = body;

    if (!jobId || !newStage) {
      return NextResponse.json(
        { error: "INVALID_REQUEST: jobId and newStage are required." },
        { status: 400 }
      );
    }

    const staff = user || {
      id: "00000000-0000-0000-0000-000000000099",
      fullName: "Sarah Connor (Staff #04)",
      role: "admin",
    };

    const updatedJob = updateJobPipelineStage(jobId, newStage as PipelineStage, staff, notes);

    // If job advanced to COMPLETED, dispatch JOB_COMPLETED_DISPATCHED alert
    if (newStage === "COMPLETED") {
      await sendLifecycleEmail({
        eventType: "JOB_COMPLETED_DISPATCHED",
        recipient: {
          email: updatedJob.customerEmail,
          name: updatedJob.customerName,
          userId: updatedJob.customerId,
        },
        referenceId: updatedJob.orderNumber,
        qualifier: "completed",
        data: {
          orderNumber: updatedJob.orderNumber,
          customerName: updatedJob.customerName,
          customerEmail: updatedJob.customerEmail,
          productName: updatedJob.productName,
          quantity: updatedJob.quantity,
          carrier: "DPD UK Tracked Express",
          trackingNumber: `DPD-GB-${Math.floor(10000000 + Math.random() * 90000000)}`,
          trackingUrl: "https://www.dpd.co.uk/tracking/DPD-GB-TRACK",
          invoiceDownloadUrl: `/api/invoices/${updatedJob.id}`,
          dispatchedAt: new Date().toISOString(),
        },
      }).catch((err) => {
        console.error("Non-blocking job completion email dispatch error:", err);
      });
    } else if (newStage === "PROOF") {
      await sendLifecycleEmail({
        eventType: "PROOF_READY_FOR_REVIEW",
        recipient: {
          email: updatedJob.customerEmail,
          name: updatedJob.customerName,
          userId: updatedJob.customerId,
        },
        referenceId: updatedJob.orderNumber,
        qualifier: updatedJob.proofVersion || "v1",
        data: {
          orderNumber: updatedJob.orderNumber,
          customerName: updatedJob.customerName,
          customerEmail: updatedJob.customerEmail,
          productName: updatedJob.productName,
          proofVersion: updatedJob.proofVersion || "v1",
          reviewUrl: `/customer/dashboard?order=${updatedJob.orderNumber}&view=proof`,
          specsSummary: updatedJob.specsSummary,
          changeRequestDeadlineHours: 24,
        },
      }).catch((err) => {
        console.error("Non-blocking proof review email dispatch error:", err);
      });
    }

    return NextResponse.json({
      success: true,
      message: `Job ${jobId} successfully advanced to ${newStage}.`,
      job: updatedJob,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Pipeline stage update failed";
    const status = msg.includes("ACCESS_DENIED")
      ? 403
      : msg.includes("APPROVAL_GATE_LOCKED")
      ? 423
      : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
