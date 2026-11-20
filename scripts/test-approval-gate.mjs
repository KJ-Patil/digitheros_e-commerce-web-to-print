// ========================================================================
// DIGITAL HEROES — PROOF ENGINE & APPROVAL GATE TEST SUITE
// File: scripts/test-approval-gate.mjs
// ========================================================================

import {
  resetProofStore,
  getOrderProofState,
  approveProofRevision,
  requestProofChanges,
  checkProductionFileUnlockGate,
} from "../lib/proofs/proof-engine.ts";

console.log("==================================================================");
console.log("DIGITAL HEROES — PROOF REVISION & APPROVAL GATE SUITE");
console.log("==================================================================");

let passed = 0;
let failed = 0;

function assert(description, condition) {
  if (condition) {
    console.log(`[PASS] ${description}`);
    passed++;
  } else {
    console.error(`[FAIL] ${description}`);
    failed++;
  }
}

// Reset store to known test fixture state
resetProofStore();

const CUSTOMER_A = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "customer@digitalheroes.demo",
  fullName: "Alex Miller",
  role: "customer",
};

const CUSTOMER_B = {
  id: "00000000-0000-0000-0000-000000000002",
  email: "customer-b@digitalheroes.demo",
  fullName: "Sarah Jenkins",
  role: "customer",
};

const ADMIN = {
  id: "00000000-0000-0000-0000-000000000099",
  email: "admin@digitalheroes.demo",
  fullName: "Marcus Vance",
  role: "admin",
};

// -------------------------------------------------------------------------
// TEST 1: Initial Proof States & Approval Gate Enforcement
// -------------------------------------------------------------------------
const order1 = getOrderProofState("ORD-2026-0891");
assert("Test 1a: Approved order ORD-2026-0891 is found", order1 !== null && order1.orderNumber === "ORD-2026-0891");
assert("Test 1b: Approved order has gate unlocked", order1.isUnlockedForProduction === true);

const gate1 = checkProductionFileUnlockGate("ORD-2026-0891");
assert("Test 1c: Server checkProductionFileUnlockGate returns unlocked for approved order", gate1.isUnlocked === true);

const order2 = getOrderProofState("ORD-2026-0892");
assert("Test 1d: Pending order ORD-2026-0892 is found at version v1", order2 !== null && order2.currentVersion === 1);
assert("Test 1e: Pending order has gate locked", order2.isUnlockedForProduction === false);

const gate2 = checkProductionFileUnlockGate("ORD-2026-0892");
assert("Test 1f: Server checkProductionFileUnlockGate blocks production file download for unapproved order", gate2.isUnlocked === false);
assert("Test 1g: Locked gate provides descriptive rejection reason", gate2.reason.includes("APPROVAL GATE LOCKED"));

// -------------------------------------------------------------------------
// TEST 2: Cross-Customer Security Separation (RLS / Auth Guard)
// -------------------------------------------------------------------------
let custBAccessDenied = false;
try {
  getOrderProofState("ORD-2026-0892", CUSTOMER_B.id);
} catch (e) {
  if (e.message.includes("ACCESS_DENIED")) {
    custBAccessDenied = true;
  }
}
assert("Test 2a: Customer B cannot view proof history of Customer A", custBAccessDenied);

let custBApproveDenied = false;
try {
  approveProofRevision("ORD-2026-0892", 1, CUSTOMER_B, "Malicious approval attempt");
} catch (e) {
  if (e.message.includes("SECURITY_VIOLATION")) {
    custBApproveDenied = true;
  }
}
assert("Test 2b: Customer B cannot approve proof of Customer A", custBApproveDenied);

let custBChangeDenied = false;
try {
  requestProofChanges("ORD-2026-0892", 1, CUSTOMER_B, "Change all colors");
} catch (e) {
  if (e.message.includes("SECURITY_VIOLATION")) {
    custBChangeDenied = true;
  }
}
assert("Test 2c: Customer B cannot request changes on proof of Customer A", custBChangeDenied);

// -------------------------------------------------------------------------
// TEST 3: Revision Change Request Flow (v1 -> v2)
// -------------------------------------------------------------------------
const stateAfterChanges = requestProofChanges(
  "ORD-2026-0892",
  1,
  CUSTOMER_A,
  "Please darken the red number contour by 15% and verify punch hole offsets."
);

assert("Test 3a: Proof revision increments to v2", stateAfterChanges.currentVersion === 2);
assert("Test 3b: Previous revision v1 marked as CHANGES_REQUESTED", stateAfterChanges.revisions[0].status === "CHANGES_REQUESTED");
assert("Test 3c: Revision instructions are preserved in v1", stateAfterChanges.revisions[0].changeNotes.includes("darken the red number"));
assert("Test 3d: New revision v2 created with status PENDING", stateAfterChanges.revisions[1].status === "PENDING" && stateAfterChanges.revisions[1].versionNumber === 2);
assert("Test 3e: Gate remains strictly locked after change request", stateAfterChanges.isUnlockedForProduction === false);

const gateAfterChange = checkProductionFileUnlockGate("ORD-2026-0892");
assert("Test 3f: Production file download still locked on queued revision", gateAfterChange.isUnlocked === false);

// -------------------------------------------------------------------------
// TEST 4: Customer Digital Signature Approval (Unlocking Production Gate)
// -------------------------------------------------------------------------
const stateAfterApproval = approveProofRevision(
  "ORD-2026-0892",
  2,
  CUSTOMER_A,
  "Colors and punch holes look great. Ready for factory floor."
);

assert("Test 4a: Revision v2 status transitions to APPROVED", stateAfterApproval.revisions[1].status === "APPROVED");
assert("Test 4b: Digital signature hash generated (sha256:...)", stateAfterApproval.revisions[1].digitalSignatureHash.startsWith("sha256:"));
assert("Test 4c: Approved user metadata logged", stateAfterApproval.revisions[1].approvedBy.email === CUSTOMER_A.email);
assert("Test 4d: Approval timestamp recorded", Boolean(stateAfterApproval.revisions[1].approvedAt));
assert("Test 4e: Order state isUnlockedForProduction becomes true", stateAfterApproval.isUnlockedForProduction === true);

const gateAfterApproval = checkProductionFileUnlockGate("ORD-2026-0892");
assert("Test 4f: Server production gate is officially UNLOCKED", gateAfterApproval.isUnlocked === true);

// -------------------------------------------------------------------------
// TEST 5: Error Handling for Non-Existent Resources
// -------------------------------------------------------------------------
let notFoundOrder = false;
try {
  approveProofRevision("ORD-DOES-NOT-EXIST", 1, CUSTOMER_A);
} catch (e) {
  if (e.message.includes("ORDER_NOT_FOUND")) {
    notFoundOrder = true;
  }
}
assert("Test 5a: Approving non-existent order throws ORDER_NOT_FOUND", notFoundOrder);

let notFoundVersion = false;
try {
  approveProofRevision("ORD-2026-0892", 99, CUSTOMER_A);
} catch (e) {
  if (e.message.includes("VERSION_NOT_FOUND")) {
    notFoundVersion = true;
  }
}
assert("Test 5b: Approving non-existent version throws VERSION_NOT_FOUND", notFoundVersion);

// -------------------------------------------------------------------------
// TEST 6: Admin Authority Verification
// -------------------------------------------------------------------------
const adminQuery = getOrderProofState("ORD-2026-0892", ADMIN.id);
assert("Test 6a: Admin user can inspect any customer proof history", adminQuery !== null);

console.log("==================================================================");
console.log(`APPROVAL GATE TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log("==================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
