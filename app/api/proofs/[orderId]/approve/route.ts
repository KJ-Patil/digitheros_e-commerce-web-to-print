import { NextRequest, NextResponse } from "next/server";
import { approveProofRevision } from "@/lib/proofs/proof-engine";
import { sendLifecycleEmail } from "@/lib/email/email-engine";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    const body = await req.json();

    const { versionNumber, customerNotes, user } = body;

    if (!versionNumber || !user || !user.id) {
      return NextResponse.json(
        { error: "INVALID_REQUEST: versionNumber and authenticating user are required." },
        { status: 400 }
      );
    }

    const updatedState = approveProofRevision(
      orderId,
      Number(versionNumber),
      user,
      customerNotes
    );

    const approvedRev = updatedState.revisions.find((r) => r.versionNumber === Number(versionNumber));

    // Dispatch PROOF_APPROVED transactional lifecycle alert
    if (approvedRev && approvedRev.approvedBy) {
      await sendLifecycleEmail({
        eventType: "PROOF_APPROVED",
        recipient: {
          email: user.email || "customer@digitalheroes.demo",
          name: user.fullName || user.full_name || updatedState.customerName,
          userId: user.id,
        },
        referenceId: updatedState.orderNumber,
        qualifier: `v${versionNumber}`,
        data: {
          orderNumber: updatedState.orderNumber,
          customerName: user.fullName || user.full_name || updatedState.customerName,
          customerEmail: user.email || "customer@digitalheroes.demo",
          productName: updatedState.productName,
          proofVersion: `v${versionNumber}`,
          digitalSignatureHash:
            approvedRev.digitalSignatureHash ||
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          approvedAt: approvedRev.approvedAt || new Date().toISOString(),
          machineAllocationName: "Roland TrueVIS VG3-640 (ECO-UV Inkjet & Cutter)",
        },
      }).catch((err) => {
        console.error("Non-blocking proof approval email error:", err);
      });
    }

    return NextResponse.json({
      success: true,
      message: `Proof revision v${versionNumber} officially approved. Production files unlocked.`,
      proofState: updatedState,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Approval processing error";
    const status = msg.includes("SECURITY_VIOLATION") ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
