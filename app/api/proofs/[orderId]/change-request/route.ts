import { NextRequest, NextResponse } from "next/server";
import { requestProofChanges } from "@/lib/proofs/proof-engine";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    const body = await req.json();

    const { versionNumber, changeInstructions, user } = body;

    if (!versionNumber || !changeInstructions || !user) {
      return NextResponse.json(
        { error: "INVALID_REQUEST: versionNumber, changeInstructions, and user are required." },
        { status: 400 }
      );
    }

    const updatedState = requestProofChanges(
      orderId,
      Number(versionNumber),
      user,
      changeInstructions
    );

    return NextResponse.json({
      success: true,
      message: `Change request logged for v${versionNumber}. New revision queued. Production gate remains locked.`,
      proofState: updatedState,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Change request error";
    const status = msg.includes("SECURITY_VIOLATION") ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
