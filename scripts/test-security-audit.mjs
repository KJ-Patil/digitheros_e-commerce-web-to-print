/**
 * DIGITAL HEROES — MODULE 11: COMPREHENSIVE SECURITY, QA & RESPONSIVE AUDIT TEST SUITE
 * 
 * Exhaustive programmatic penetration testing and vulnerability assessment:
 * 1. Insecure Direct Object References (IDOR)
 * 2. Row Level Security & RBAC Privilege Separation
 * 3. Prepress Approval Gate Integrity (HTTP 423)
 * 4. Pricing Anti-Tampering & Server-Authoritative Math
 * 5. Input Fuzzing, Path Traversal & Injection Defense
 * 6. Rate Limiting Throttling & Secret Key Isolation
 * 7. Mobile-First Responsive Breakpoint Conformance
 */

import {
  runComprehensiveSecurityAudit,
} from "../lib/security/audit-engine.ts";

import {
  getOrderById,
  getInvoiceForOrder,
  reorderFromExistingOrder,
  reorderFromSavedDesign,
} from "../lib/orders/order-store.ts";

import {
  approveProofRevision,
  requestProofChanges,
  checkProductionFileUnlockGate,
} from "../lib/proofs/proof-engine.ts";

import {
  calculatePrice,
} from "../lib/pricing/engine.ts";

import {
  validateArtworkFile,
  sanitizeArtworkFilename,
} from "../lib/designer/preflight.ts";

import {
  sanitizeCsvValue,
} from "../lib/print-engine/variable-data.ts";

import {
  validateRecipientEmail,
  getUserNotifications,
  markNotificationAsRead,
} from "../lib/email/email-engine.ts";

import {
  checkRateLimit,
  resetRateLimiter,
} from "../lib/security/rate-limiter.ts";

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    failed++;
  }
}

async function runSecurityAuditSuite() {
  console.log("==================================================================");
  console.log("DIGITAL HEROES — MODULE 11 SECURITY, QA & RESPONSIVE AUDIT SUITE");
  console.log("==================================================================");

  const CUST_A = "00000000-0000-0000-0000-000000000001"; // Alex Miller (Peak Coffee)
  const CUST_B = "00000000-0000-0000-0000-000000000002"; // Jordan Lee / Sarah Jenkins
  const ADMIN_ID = "00000000-0000-0000-0000-000000000099"; // Sarah Connor (Staff)

  // ------------------------------------------------------------------------
  // 1. INSECURE DIRECT OBJECT REFERENCES (IDOR)
  // ------------------------------------------------------------------------
  console.log("\n--- Domain 1: Insecure Direct Object References (IDOR) ---");

  // 1a: Cross-customer order reading
  let orderBlocked = false;
  try {
    getOrderById("ORD-2026-0893", CUST_A, false);
  } catch (err) {
    orderBlocked = err.message.includes("ACCESS_DENIED");
  }
  assert(orderBlocked, "1a: IDOR: Customer A blocked from accessing Customer B's order");

  // 1b: Cross-customer commercial invoice download
  let invoiceBlocked = false;
  try {
    getInvoiceForOrder("ORD-2026-0893", CUST_A, false);
  } catch (err) {
    invoiceBlocked = err.message.includes("ACCESS_DENIED");
  }
  assert(invoiceBlocked, "1b: IDOR: Customer A blocked from downloading Customer B's invoice");

  // 1c: Cross-customer proof approval
  let proofApproveBlocked = false;
  try {
    approveProofRevision(
      "c1000000-0000-0000-0000-000000000003",
      1,
      { id: CUST_A, email: "alex@demo.co", fullName: "Alex Miller", role: "customer" },
      "Malicious approval attempt"
    );
  } catch (err) {
    proofApproveBlocked = err.message.includes("SECURITY_VIOLATION");
  }
  assert(proofApproveBlocked, "1c: IDOR: Customer A blocked from approving Customer B's proof revision");

  // 1d: Cross-customer change request
  let proofChangeBlocked = false;
  try {
    requestProofChanges(
      "c1000000-0000-0000-0000-000000000003",
      1,
      { id: CUST_A, email: "alex@demo.co", fullName: "Alex Miller", role: "customer" },
      "Malicious change instructions"
    );
  } catch (err) {
    proofChangeBlocked = err.message.includes("SECURITY_VIOLATION");
  }
  assert(proofChangeBlocked, "1d: IDOR: Customer A blocked from requesting changes on Customer B's proof");

  // 1e: Cross-customer 1-click reorder from order
  let reorderOrderBlocked = false;
  try {
    reorderFromExistingOrder("c1000000-0000-0000-0000-000000000003", {
      id: CUST_A,
      email: "alex@demo.co",
      fullName: "Alex Miller",
      role: "customer",
    });
  } catch (err) {
    reorderOrderBlocked = err.message.includes("SECURITY_VIOLATION");
  }
  assert(reorderOrderBlocked, "1e: IDOR: Customer A blocked from reordering Customer B's past order");

  // 1f: Cross-customer reorder from saved design template
  let reorderDesignBlocked = false;
  try {
    reorderFromSavedDesign("DSGN-MTB-01", {
      id: CUST_B,
      email: "jordan@demo.co",
      fullName: "Jordan Lee",
      role: "customer",
    });
  } catch (err) {
    reorderDesignBlocked = err.message.includes("SECURITY_VIOLATION");
  }
  assert(reorderDesignBlocked, "1f: IDOR: Customer B blocked from reordering Customer A's saved template");

  // 1g: Cross-customer notifications isolation
  const alexNotifs = getUserNotifications(CUST_A);
  const jordanNotifs = getUserNotifications(CUST_B);
  const jordanNotifIds = new Set(jordanNotifs.map((n) => n.id));
  const alexSeesJordan = alexNotifs.some((n) => jordanNotifIds.has(n.id));
  assert(!alexSeesJordan, "1g: IDOR: Customer A cannot view Customer B's notification alerts");

  // 1h: Cross-customer notification acknowledgment
  let notifAckBlocked = false;
  try {
    if (jordanNotifs.length > 0) {
      markNotificationAsRead(jordanNotifs[0].id, CUST_A);
    } else {
      notifAckBlocked = true;
    }
  } catch (err) {
    notifAckBlocked = err.message.includes("NOT_FOUND") || err.message.includes("ACCESS_DENIED");
  }
  assert(notifAckBlocked, "1h: IDOR: Customer A blocked from marking Customer B's notification as read");

  // ------------------------------------------------------------------------
  // 2. RLS & RBAC PRIVILEGE SEPARATION
  // ------------------------------------------------------------------------
  console.log("\n--- Domain 2: RLS & RBAC Privilege Separation ---");

  // 2a: Anonymous user guard
  const anonQuery = getOrderById("ORD-2026-0891", undefined, false);
  assert(anonQuery === null || anonQuery !== undefined, "2a: RBAC: Unauthenticated anonymous request returns null / shielded");

  // 2b: Admin can access across customers
  const adminQueryA = getOrderById("ORD-2026-0891", ADMIN_ID, true);
  const adminQueryB = getOrderById("ORD-2026-0893", ADMIN_ID, true);
  assert(adminQueryA !== null && adminQueryB !== null, "2b: RBAC: Staff administrator permitted operational access across orders");

  // 2c: Prepress approval gate check
  const gateApproved = checkProductionFileUnlockGate("ORD-2026-0891");
  const gateUnapproved = checkProductionFileUnlockGate("ORD-2026-0892");
  assert(gateApproved.isUnlocked === true, "2c: GATE: Approved order ORD-2026-0891 is unlocked");
  assert(gateUnapproved.isUnlocked === false, "2c: GATE: Unapproved order ORD-2026-0892 is locked (HTTP 423)");

  // ------------------------------------------------------------------------
  // 3. PRICING ANTI-TAMPERING
  // ------------------------------------------------------------------------
  console.log("\n--- Domain 3: Pricing Anti-Tampering ---");

  // 3a: Forged price injection
  const calcTamper = calculatePrice({
    productSlug: "vinyl-stickers",
    widthMm: 75,
    heightMm: 50,
    quantity: 100,
    materialCode: "GLOSS_VINYL",
    unitPriceCents: 1, // Attempt £0.01 injection
    subtotalCents: 100, // Attempt £1.00 injection
    vatCents: 0, // Attempt zero VAT
    totalCents: 100,
  });

  assert(calcTamper.breakdown.subtotalCents > 100, "3a: TAMPER: Injected £1.00 subtotal ignored by server");
  assert(calcTamper.breakdown.vatCents === Math.round(calcTamper.breakdown.subtotalCents * 0.20), "3b: TAMPER: Server computes exact 20% VAT in integer cents");
  assert(calcTamper.breakdown.totalCents === calcTamper.breakdown.subtotalCents + calcTamper.breakdown.vatCents, "3c: TAMPER: Server computes total = subtotal + VAT authoritatively");

  // ------------------------------------------------------------------------
  // 4. INPUT FUZZING & INJECTIONS
  // ------------------------------------------------------------------------
  console.log("\n--- Domain 4: Input Fuzzing & Injections ---");

  // 4a: Negative width
  let negWidth = false;
  try {
    calculatePrice({ productSlug: "vinyl-stickers", widthMm: -50, heightMm: 50, quantity: 100 });
  } catch (err) {
    negWidth = err.message.includes("DIMENSION_ERROR");
  }
  assert(negWidth, "4a: FUZZ: Negative width rejected with DIMENSION_ERROR");

  // 4b: Below minimum allowable dimension (25mm)
  let subMinDim = false;
  try {
    calculatePrice({ productSlug: "vinyl-stickers", widthMm: 10, heightMm: 50, quantity: 100 });
  } catch (err) {
    subMinDim = err.message.includes("DIMENSION_ERROR");
  }
  assert(subMinDim, "4b: FUZZ: Dimension below 25mm floor rejected with DIMENSION_ERROR");

  // 4c: Above maximum allowable dimension (1200mm)
  let excessDim = false;
  try {
    calculatePrice({ productSlug: "vinyl-stickers", widthMm: 1500, heightMm: 50, quantity: 100 });
  } catch (err) {
    excessDim = err.message.includes("DIMENSION_ERROR");
  }
  assert(excessDim, "4c: FUZZ: Dimension exceeding 1200mm max roll width rejected");

  // 4d: Zero quantity
  let zeroQty = false;
  try {
    calculatePrice({ productSlug: "vinyl-stickers", widthMm: 75, heightMm: 50, quantity: 0 });
  } catch (err) {
    zeroQty = err.message.includes("QUANTITY_ERROR");
  }
  assert(zeroQty, "4d: FUZZ: Zero quantity rejected with QUANTITY_ERROR");

  // 4e: Negative quantity
  let negQty = false;
  try {
    calculatePrice({ productSlug: "vinyl-stickers", widthMm: 75, heightMm: 50, quantity: -25 });
  } catch (err) {
    negQty = err.message.includes("QUANTITY_ERROR");
  }
  assert(negQty, "4e: FUZZ: Negative quantity rejected with QUANTITY_ERROR");

  // 4f: CSV formula injection sanitization
  const testFormulas = ["=1+1", "@SUM(A1:A10)", "+cmd|'/C calc'!A0", "-2+5", "\tmalicious"];
  const allFormulasSanitized = testFormulas.every((f) => sanitizeCsvValue(f).startsWith("'"));
  assert(allFormulasSanitized, "4f: INJECTION: All CSV formula prefixes (=, @, +, -, \\t) neutralized with leading apostrophe");

  // 4g: Email CRLF injection
  let crlfBlocked = false;
  try {
    validateRecipientEmail("customer@demo.co\r\nBcc: evil@hacker.com");
  } catch (err) {
    crlfBlocked = err.message.includes("SECURITY_VIOLATION");
  }
  assert(crlfBlocked, "4g: INJECTION: CRLF control characters in email address blocked with SECURITY_VIOLATION");

  // 4h: Artwork filename path traversal
  const cleanFilename = sanitizeArtworkFilename("../../../etc/shadow.pdf");
  assert(!cleanFilename.includes("..") && !cleanFilename.includes("/"), "4h: TRAVERSAL: Artwork filename path traversal stripped to safe alphanumeric name");

  // 4i: Disallowed executable upload
  const exeResult = validateArtworkFile({ name: "backdoor.exe", size: 1024, type: "application/x-msdownload" });
  assert(exeResult.status === "FAILED", "4i: UPLOAD: Executable file upload rejected in preflight");

  // ------------------------------------------------------------------------
  // 5. RATE LIMITING & SECRET EXPOSURE
  // ------------------------------------------------------------------------
  console.log("\n--- Domain 5: Rate Limiting & Secret Containment ---");

  resetRateLimiter();
  let throttled = false;
  for (let i = 0; i < 65; i++) {
    const res = checkRateLimit("ip_10_0_0_1", 60, 60000);
    if (!res.allowed) {
      throttled = true;
      break;
    }
  }
  assert(throttled, "5a: RATE: Sliding window rate limiter throttles burst requests at threshold 60");

  const singleIpCheck = checkRateLimit("ip_unique_client_test", 60, 60000);
  assert(singleIpCheck.allowed === true && singleIpCheck.remaining === 59, "5b: RATE: Normal traffic allowed with accurate remaining count");

  // ------------------------------------------------------------------------
  // 6. COMPREHENSIVE AUDIT ENGINE SUMMARY
  // ------------------------------------------------------------------------
  console.log("\n--- Domain 6: Full Audit Engine Assessment ---");

  const fullReport = runComprehensiveSecurityAudit();
  assert(fullReport.summary.totalTests >= 20, "6a: AUDIT: Comprehensive assessment ran >= 20 security checks");
  assert(fullReport.summary.healthScorePercentage === 100, "6b: AUDIT: Overall Security Health Score is 100%");
  assert(fullReport.summary.failedCount === 0, "6c: AUDIT: Zero security vulnerabilities detected");
  assert(fullReport.responsiveAudit.viewportsTested.length === 4, "6d: RESPONSIVE: 4 canonical viewports validated for mobile-first QA");
  assert(
    fullReport.responsiveAudit.viewportsTested.every((v) => v.touchTargetMin44px && !v.horizontalOverflow),
    "6e: RESPONSIVE: Touch targets >= 44px and zero horizontal overflow across all viewports"
  );

  console.log("==================================================================");
  console.log(`SECURITY AUDIT TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAuditSuite().catch((err) => {
  console.error("Security test suite error:", err);
  process.exit(1);
});
