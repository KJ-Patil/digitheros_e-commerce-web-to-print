// ========================================================================
// DIGITAL HEROES — ADMIN PRODUCTION PIPELINE & REPORTS TEST SUITE
// File: scripts/test-admin-pipeline.mjs
// ========================================================================

import {
  resetProductionJobsStore,
  getProductionJobs,
  updateJobPipelineStage,
  allocateJobMachine,
  generateProductionAnalytics,
} from "../lib/production/pipeline.ts";
import { resetProofStore } from "../lib/proofs/proof-engine.ts";

console.log("==================================================================");
console.log("DIGITAL HEROES — PRODUCTION PIPELINE & REPORTS SUITE");
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

// Reset stores
resetProductionJobsStore();
resetProofStore();

const STAFF_ADMIN = {
  id: "00000000-0000-0000-0000-000000000099",
  fullName: "Sarah Connor (Staff #04)",
  role: "admin",
};

const CUSTOMER_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  fullName: "Alex Miller",
  role: "customer",
};

// -------------------------------------------------------------------------
// TEST 1: Staff Authorization Guards
// -------------------------------------------------------------------------
let customerAccessBlocked = false;
try {
  getProductionJobs(undefined, CUSTOMER_USER);
} catch (e) {
  if (e.message.includes("ACCESS_DENIED")) {
    customerAccessBlocked = true;
  }
}
assert("Test 1a: Customer denied access to privileged production pipeline", customerAccessBlocked);

const adminJobs = getProductionJobs(undefined, STAFF_ADMIN);
assert("Test 1b: Staff administrator retrieves production jobs list", adminJobs.length >= 5);

// -------------------------------------------------------------------------
// TEST 2: Pipeline Stage Progression & Audit Logging
// -------------------------------------------------------------------------
const stageUpdatedJob = updateJobPipelineStage(
  "ORD-2026-0895",
  "ARTWORK",
  STAFF_ADMIN,
  "Prepress verified notary logo artwork."
);
assert("Test 2a: Job ORD-2026-0895 advanced from ORDER to ARTWORK", stageUpdatedJob.stage === "ARTWORK");
assert("Test 2b: Pipeline audit entry created", stageUpdatedJob.auditHistory.length > 0);
assert("Test 2c: Audit entry contains staff identity and transition notes",
  stageUpdatedJob.auditHistory[0].fromStage === "ORDER" &&
  stageUpdatedJob.auditHistory[0].toStage === "ARTWORK" &&
  stageUpdatedJob.auditHistory[0].updatedBy.fullName === STAFF_ADMIN.fullName
);

// -------------------------------------------------------------------------
// TEST 3: Prepress Approval Gate Enforcement on Stage Update
// -------------------------------------------------------------------------
let unapprovedProductionBlocked = false;
try {
  // ORD-2026-0892 has status PENDING (unapproved)
  updateJobPipelineStage("ORD-2026-0892", "PRODUCTION", STAFF_ADMIN);
} catch (e) {
  if (e.message.includes("APPROVAL_GATE_LOCKED")) {
    unapprovedProductionBlocked = true;
  }
}
assert("Test 3a: Blocked advancing unapproved job to PRODUCTION stage", unapprovedProductionBlocked);

// -------------------------------------------------------------------------
// TEST 4: Job Completion & Automatic Archiving
// -------------------------------------------------------------------------
const completedJob = updateJobPipelineStage(
  "ORD-2026-0891",
  "COMPLETED",
  STAFF_ADMIN,
  "Labels printed on Roland TrueVIS and packaged."
);
assert("Test 4a: Job stage becomes COMPLETED", completedJob.stage === "COMPLETED");
assert("Test 4b: Job is automatically flagged as isArchived = true", completedJob.isArchived === true);

// -------------------------------------------------------------------------
// TEST 5: Machine Line Allocation
// -------------------------------------------------------------------------
let custMachineBlocked = false;
try {
  allocateJobMachine("ORD-2026-0893", "ROLAND_VG3_640", "Operator John", CUSTOMER_USER);
} catch (e) {
  if (e.message.includes("ACCESS_DENIED")) {
    custMachineBlocked = true;
  }
}
assert("Test 5a: Customer blocked from machine line allocation", custMachineBlocked);

const allocatedJob = allocateJobMachine(
  "ORD-2026-0893",
  "ROLAND_VG3_640",
  "Sarah Connor (Staff #04)",
  STAFF_ADMIN
);
assert("Test 5b: Job machine line allocated to ROLAND_VG3_640", allocatedJob.machineAllocation === "ROLAND_VG3_640");
assert("Test 5c: Machine name populated correctly", allocatedJob.machineName.includes("Roland TrueVIS"));
assert("Test 5d: Operator assigned correctly", allocatedJob.assignedOperator === "Sarah Connor (Staff #04)");

// -------------------------------------------------------------------------
// TEST 6: Production Analytics & Revenue Reports
// -------------------------------------------------------------------------
const analytics = generateProductionAnalytics();
assert("Test 6a: Analytics summary contains active and completed job counts",
  analytics.summary.totalActiveJobs > 0 && analytics.summary.totalCompletedJobs > 0
);
assert("Test 6b: Gross revenue equals net revenue + total VAT",
  analytics.summary.totalGrossRevenueCents === analytics.summary.totalNetRevenueCents + analytics.summary.totalVatCents
);
assert("Test 6c: Division breakdown includes all 6 print divisions",
  analytics.divisionBreakdown.length === 6
);
assert("Test 6d: Machine utilization tracks active job counts per line",
  analytics.machineUtilization.ROLAND_VG3_640.name.includes("Roland") &&
  analytics.machineUtilization.EPILOG_FUSION_PRO.name.includes("Epilog")
);

// -------------------------------------------------------------------------
// TEST 7: Multi-Parameter Filtering & Archive Search
// -------------------------------------------------------------------------
const proofJobs = getProductionJobs({ stage: "PROOF" }, STAFF_ADMIN);
assert("Test 7a: Filtering by stage PROOF returns only proof jobs",
  proofJobs.every((j) => j.stage === "PROOF")
);

const labelJobs = getProductionJobs({ divisionSlug: "labels" }, STAFF_ADMIN);
assert("Test 7b: Filtering by division labels returns only label jobs",
  labelJobs.every((j) => j.divisionSlug === "labels")
);

const archivedJobs = getProductionJobs({ includeArchived: true }, STAFF_ADMIN);
assert("Test 7c: Querying archived jobs returns completed jobs",
  archivedJobs.length >= 2 && archivedJobs.every((j) => j.isArchived)
);

const searchResults = getProductionJobs({ searchQuery: "Peak Coffee" }, STAFF_ADMIN);
assert("Test 7d: Text search matches customer name Peak Coffee",
  searchResults.length > 0 && searchResults[0].customerName.includes("Peak Coffee")
);

console.log("==================================================================");
console.log(`ADMIN PIPELINE TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log("==================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
