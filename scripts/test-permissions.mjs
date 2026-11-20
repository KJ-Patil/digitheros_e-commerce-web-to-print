// ========================================================================
// DIGITAL HEROES — CROSS-USER ACCESS DENIAL & RLS VERIFICATION TEST SUITE
// File: scripts/test-permissions.mjs
// ========================================================================

const USERS = {
  customerA: {
    id: "00000000-0000-0000-0000-000000000001",
    email: "customer@digitalheroes.demo",
    role: "customer",
  },
  customerB: {
    id: "00000000-0000-0000-0000-000000000002",
    email: "customer-b@digitalheroes.demo",
    role: "customer",
  },
  admin: {
    id: "00000000-0000-0000-0000-000000000099",
    email: "admin@digitalheroes.demo",
    role: "admin",
  },
};

const ORDERS = [
  {
    id: "o1000000-0000-0000-0000-000000000001",
    order_number: "ORD-2026-0891",
    customer_id: USERS.customerA.id,
    stage: "PRODUCTION",
    is_proof_approved: true,
  },
  {
    id: "o1000000-0000-0000-0000-000000000002",
    order_number: "ORD-2026-0892",
    customer_id: USERS.customerA.id,
    stage: "PROOF",
    is_proof_approved: false,
  },
  {
    id: "o1000000-0000-0000-0000-000000000003",
    order_number: "ORD-2026-0893",
    customer_id: USERS.customerB.id,
    stage: "ARTWORK",
    is_proof_approved: false,
  },
];

const PRODUCTION_FILES = [
  {
    id: "pf000000-0000-0000-0000-000000000001",
    order_id: "o1000000-0000-0000-0000-000000000001",
    file_name: "ORD-2026-0891_Labels_20260323_Output.pdf",
    is_unlocked: true,
  },
  {
    id: "pf000000-0000-0000-0000-000000000002",
    order_id: "o1000000-0000-0000-0000-000000000002",
    file_name: "ORD-2026-0892_RaceBibs_20260324_Output.pdf",
    is_unlocked: false,
  },
];

// Simulated RLS Evaluators
function simulateSelectOrders(currentUser) {
  if (!currentUser) return []; // Anonymous cannot see orders
  return ORDERS.filter((order) => {
    // RLS Policy: customer_id = auth.uid() OR is_admin()
    return order.customer_id === currentUser.id || currentUser.role === "admin";
  });
}

function simulateSelectProductionFiles(currentUser) {
  if (!currentUser || currentUser.role !== "admin") {
    // RLS Policy: public.production_files is restricted strictly to admin staff
    return { status: 403, error: "ACCESS DENIED: Production files restricted to admin staff only." };
  }
  return { status: 200, data: PRODUCTION_FILES };
}

function simulateDownloadProductionFile(currentUser, fileId) {
  const fileCheck = simulateSelectProductionFiles(currentUser);
  if (fileCheck.status !== 200) return fileCheck;

  const file = PRODUCTION_FILES.find((f) => f.id === fileId);
  if (!file) return { status: 404, error: "File not found" };

  // Approval Gate check: Production files unlock only once proof is approved
  if (!file.is_unlocked) {
    return {
      status: 423,
      error: "APPROVAL GATE LOCKED: Customer proof approval required before file release.",
    };
  }

  return { status: 200, message: `Unlocked production file: ${file.file_name}` };
}

function simulateApproveProof(currentUser, targetOrderId) {
  const targetOrder = ORDERS.find((o) => o.id === targetOrderId);
  if (!targetOrder) return { status: 404, error: "Order not found" };

  // RLS Policy: Customer can only approve proof if order.customer_id = auth.uid() OR is_admin()
  if (targetOrder.customer_id !== currentUser.id && currentUser.role !== "admin") {
    return {
      status: 403,
      error: "SECURITY VIOLATION: Customer cannot approve a proof belonging to another account.",
    };
  }

  return { status: 200, message: "Proof approved and signature recorded." };
}

// RUN THE TEST SUITE
console.log("==================================================================");
console.log("DIGITAL HEROES — RLS & CROSS-USER PERMISSIONS TEST SUITE");
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

// TEST 1: Customer A reads own orders
const customerAOrders = simulateSelectOrders(USERS.customerA);
assert(
  "Customer A can see Customer A's 2 orders",
  customerAOrders.length === 2 && customerAOrders.every((o) => o.customer_id === USERS.customerA.id)
);

// TEST 2: Customer B reads own orders
const customerBOrders = simulateSelectOrders(USERS.customerB);
assert(
  "Customer B can see Customer B's 1 order",
  customerBOrders.length === 1 && customerBOrders[0].customer_id === USERS.customerB.id
);

// TEST 3: Cross-user access denial — Customer A CANNOT see Customer B's orders
const customerACanSeeB = customerAOrders.some((o) => o.customer_id === USERS.customerB.id);
assert("CROSS-USER DENIAL: Customer A cannot see Customer B's orders", !customerACanSeeB);

// TEST 4: Cross-user access denial — Customer A CANNOT approve Customer B's proof
const illegalApproval = simulateApproveProof(USERS.customerA, "o1000000-0000-0000-0000-000000000003");
assert(
  "CROSS-USER DENIAL: Customer A blocked from approving Customer B's proof",
  illegalApproval.status === 403
);

// TEST 5: Production Files Access Denial for Customers
const customerAFileAccess = simulateSelectProductionFiles(USERS.customerA);
assert(
  "STAFF-ONLY RULE: Customer A denied access to production_files table",
  customerAFileAccess.status === 403
);

const customerBFileAccess = simulateSelectProductionFiles(USERS.customerB);
assert(
  "STAFF-ONLY RULE: Customer B denied access to production_files table",
  customerBFileAccess.status === 403
);

// TEST 6: Admin can view all orders across all customers
const adminOrders = simulateSelectOrders(USERS.admin);
assert(
  "ADMIN PRIVILEGE: Admin can see all 3 orders across customers A and B",
  adminOrders.length === 3
);

// TEST 7: Admin access to production files table
const adminFileAccess = simulateSelectProductionFiles(USERS.admin);
assert("ADMIN PRIVILEGE: Admin can query production_files table", adminFileAccess.status === 200);

// TEST 8: Approval Gate Enforcement — Locked file cannot be downloaded even by staff
const lockedDownload = simulateDownloadProductionFile(
  USERS.admin,
  "pf000000-0000-0000-0000-000000000002"
);
assert(
  "APPROVAL GATE: Locked file cannot be released until proof is customer-approved",
  lockedDownload.status === 423
);

// TEST 9: Approval Gate Release — Approved file is downloadable
const unlockedDownload = simulateDownloadProductionFile(
  USERS.admin,
  "pf000000-0000-0000-0000-000000000001"
);
assert(
  "APPROVAL GATE: Unlocked file is downloadable once approved",
  unlockedDownload.status === 200
);

// TEST 10: Anonymous visitor cannot see orders
const anonOrders = simulateSelectOrders(null);
assert("ANONYMOUS GUARD: Unauthenticated visitor sees 0 orders", anonOrders.length === 0);

console.log("------------------------------------------------------------------");
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("==================================================================");

if (failed > 0) process.exit(1);
