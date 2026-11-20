export interface ProofRevision {
  id: string;
  orderId: string;
  orderNumber: string;
  versionNumber: number; // 1, 2, 3 ...
  status: "PENDING" | "CHANGES_REQUESTED" | "APPROVED";
  previewUrl: string;
  changeNotes?: string;
  createdAt: string;
  approvedBy?: {
    userId: string;
    email: string;
    fullName: string;
    role: string;
  };
  approvedAt?: string;
  digitalSignatureHash?: string;
  customerNotes?: string;
}

export interface OrderProofState {
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  productName: string;
  dimensions: string;
  currentVersion: number;
  isUnlockedForProduction: boolean;
  revisions: ProofRevision[];
}

export const INITIAL_PROOF_STORE: Record<string, OrderProofState> = {
  "o1000000-0000-0000-0000-000000000001": {
    orderId: "o1000000-0000-0000-0000-000000000001",
    orderNumber: "ORD-2026-0891",
    customerId: "00000000-0000-0000-0000-000000000001",
    customerName: "Alex Miller (Peak Coffee)",
    productName: "Custom Die-Cut Vinyl Stickers",
    dimensions: "75 x 50 mm (3mm Bleed)",
    currentVersion: 2,
    isUnlockedForProduction: true,
    revisions: [
      {
        id: "pr-0891-1",
        orderId: "o1000000-0000-0000-0000-000000000001",
        orderNumber: "ORD-2026-0891",
        versionNumber: 1,
        status: "CHANGES_REQUESTED",
        previewUrl: "/proofs/ORD-0891_v1.png",
        changeNotes: "Client requested darker roast bean illustration and 1mm wider safe border.",
        createdAt: "2026-03-22T10:14:00Z",
      },
      {
        id: "pr-0891-2",
        orderId: "o1000000-0000-0000-0000-000000000001",
        orderNumber: "ORD-2026-0891",
        versionNumber: 2,
        status: "APPROVED",
        previewUrl: "/proofs/ORD-0891_v2.png",
        changeNotes: "Adjusted contrast and thickened safe zone.",
        createdAt: "2026-03-23T14:30:00Z",
        approvedBy: {
          userId: "00000000-0000-0000-0000-000000000001",
          email: "customer@digitalheroes.demo",
          fullName: "Alex Miller",
          role: "customer",
        },
        approvedAt: "2026-03-23T16:42:00Z",
        digitalSignatureHash: "sha256:9f8c12a83bd82c44e0b5711a4f",
        customerNotes: "Approved for production printing on Roland press.",
      },
    ],
  },
  "o1000000-0000-0000-0000-000000000002": {
    orderId: "o1000000-0000-0000-0000-000000000002",
    orderNumber: "ORD-2026-0892",
    customerId: "00000000-0000-0000-0000-000000000001",
    customerName: "Alex Miller (Peak Coffee)",
    productName: "Enduro Tyvek Race Bibs",
    dimensions: "210 x 148 mm (3mm Bleed)",
    currentVersion: 1,
    isUnlockedForProduction: false,
    revisions: [
      {
        id: "pr-0892-1",
        orderId: "o1000000-0000-0000-0000-000000000002",
        orderNumber: "ORD-2026-0892",
        versionNumber: 1,
        status: "PENDING",
        previewUrl: "/proofs/ORD-0892_v1.png",
        changeNotes: "Initial variable-data proof merge: 500 runners mapped from CSV.",
        createdAt: "2026-03-24T09:15:00Z",
      },
    ],
  },
  "o1000000-0000-0000-0000-000000000003": {
    orderId: "o1000000-0000-0000-0000-000000000003",
    orderNumber: "ORD-2026-0893",
    customerId: "00000000-0000-0000-0000-000000000002",
    customerName: "Sarah Jenkins (Highland MTB)",
    productName: "Pro Handlebar MTB Number Board",
    dimensions: "180 x 140 mm (3mm Bleed)",
    currentVersion: 1,
    isUnlockedForProduction: false,
    revisions: [
      {
        id: "pr-0893-1",
        orderId: "o1000000-0000-0000-0000-000000000003",
        orderNumber: "ORD-2026-0893",
        versionNumber: 1,
        status: "PENDING",
        previewUrl: "/proofs/ORD-0893_v1.png",
        changeNotes: "Initial layout generated from MTB board vector template.",
        createdAt: "2026-03-24T11:00:00Z",
      },
    ],
  },
};

// In-memory persistent demo store for proof revisions
export let PROOF_STORE: Record<string, OrderProofState> = JSON.parse(JSON.stringify(INITIAL_PROOF_STORE));

export function resetProofStore(): void {
  PROOF_STORE = JSON.parse(JSON.stringify(INITIAL_PROOF_STORE));
}

/**
 * Helper to find proof state by either internal UUID or human-readable order number
 */
export function findProofState(orderQuery: string): OrderProofState | undefined {
  if (PROOF_STORE[orderQuery]) return PROOF_STORE[orderQuery];
  return Object.values(PROOF_STORE).find(
    (s) => s.orderId === orderQuery || s.orderNumber === orderQuery
  );
}

/**
 * Retrieves proof history for an order with customer access validation.
 */
export function getOrderProofState(orderId: string, requestingUserId?: string): OrderProofState | null {
  const state = findProofState(orderId);
  if (!state) return null;

  // Authorization check: Customer can only view their own proof state
  if (requestingUserId && requestingUserId !== state.customerId && requestingUserId !== "00000000-0000-0000-0000-000000000099") {
    throw new Error("ACCESS_DENIED: You do not have permission to view proofs for this order.");
  }

  return state;
}

/**
 * Customer Proof Approval (Unlocks the Production Approval Gate)
 */
export function approveProofRevision(
  orderId: string,
  versionNumber: number,
  user: { id: string; email: string; fullName: string; role: string },
  customerNotes?: string
): OrderProofState {
  const orderState = findProofState(orderId);
  if (!orderState) {
    throw new Error(`ORDER_NOT_FOUND: Order '${orderId}' does not exist.`);
  }

  // Cross-user security check
  if (user.role !== "admin" && user.id !== orderState.customerId) {
    throw new Error("SECURITY_VIOLATION: Cannot approve a proof for an order belonging to another customer.");
  }

  const revision = orderState.revisions.find((r) => r.versionNumber === versionNumber);
  if (!revision) {
    throw new Error(`VERSION_NOT_FOUND: Proof revision v${versionNumber} does not exist for this order.`);
  }

  const now = new Date().toISOString();
  const signatureHash = `sha256:${Buffer.from(`${now}:${orderId}:v${versionNumber}:${user.id}`).toString("hex").slice(0, 24)}`;

  revision.status = "APPROVED";
  revision.approvedAt = now;
  revision.approvedBy = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
  revision.digitalSignatureHash = signatureHash;
  revision.customerNotes = customerNotes || "Proof approved digitally.";

  // UNLOCK THE APPROVAL GATE
  orderState.isUnlockedForProduction = true;

  return orderState;
}

/**
 * Customer Requests Revision (Keeps the Approval Gate Strictly Locked)
 */
export function requestProofChanges(
  orderId: string,
  versionNumber: number,
  user: { id: string; email: string; fullName: string; role: string },
  changeInstructions: string
): OrderProofState {
  const orderState = findProofState(orderId);
  if (!orderState) {
    throw new Error(`ORDER_NOT_FOUND: Order '${orderId}' does not exist.`);
  }

  if (user.role !== "admin" && user.id !== orderState.customerId) {
    throw new Error("SECURITY_VIOLATION: Cannot request changes for an order belonging to another customer.");
  }

  const revision = orderState.revisions.find((r) => r.versionNumber === versionNumber);
  if (!revision) {
    throw new Error(`VERSION_NOT_FOUND: Proof revision v${versionNumber} does not exist.`);
  }

  revision.status = "CHANGES_REQUESTED";
  revision.changeNotes = changeInstructions;

  // LOCK THE GATE
  orderState.isUnlockedForProduction = false;

  // Auto-generate next revision slot v(n+1)
  const nextVer = versionNumber + 1;
  const newRev: ProofRevision = {
    id: `pr-${orderState.orderNumber.replace(/[^a-zA-Z0-9]/g, "")}-${nextVer}`,
    orderId: orderState.orderId,
    orderNumber: orderState.orderNumber,
    versionNumber: nextVer,
    status: "PENDING",
    previewUrl: `/proofs/${orderState.orderNumber}_v${nextVer}.png`,
    changeNotes: `Queued revision addressing customer feedback: "${changeInstructions}"`,
    createdAt: new Date().toISOString(),
  };

  orderState.revisions.push(newRev);
  orderState.currentVersion = nextVer;

  return orderState;
}

/**
 * Server Approval Gate Check
 * Returns boolean whether production files are physically unlocked.
 */
export function checkProductionFileUnlockGate(orderId: string): { isUnlocked: boolean; reason: string } {
  const state = findProofState(orderId);
  if (!state) {
    return { isUnlocked: false, reason: "Order not found." };
  }

  if (!state.isUnlockedForProduction) {
    const activeRevision = state.revisions.find((r) => r.versionNumber === state.currentVersion);
    return {
      isUnlocked: false,
      reason: `APPROVAL GATE LOCKED: Current proof revision v${state.currentVersion} has status '${activeRevision?.status || "PENDING"}'. Customer approval signature required before production file generation.`,
    };
  }

  return { isUnlocked: true, reason: "Approved by customer. Production files unlocked." };
}
