import { NextRequest, NextResponse } from "next/server";
import { getOrderProofState, PROOF_STORE } from "@/lib/proofs/proof-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      // Return all proofs for demo console
      return NextResponse.json(Object.values(PROOF_STORE));
    }

    const state = getOrderProofState(orderId);
    if (!state) {
      return NextResponse.json({ error: "Proof state not found for order" }, { status: 404 });
    }

    return NextResponse.json(state);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching proof history";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
