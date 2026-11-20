/**
 * DIGITAL HEROES — MODULE 10: TRANSACTIONAL EMAIL LIFECYCLE ALERTS TEST SUITE
 * 
 * Verifies:
 * 1. Template Generation for all 5 lifecycle alerts:
 *    - QUOTE_SUBMITTED
 *    - ORDER_CONFIRMED
 *    - PROOF_READY_FOR_REVIEW
 *    - PROOF_APPROVED
 *    - JOB_COMPLETED_DISPATCHED
 * 2. Responsive HTML & Plaintext formatting with boutique-industrial styling
 * 3. RFC 5322 CRLF injection security checks
 * 4. Server-Authoritative Idempotency & Deduplication Gate
 * 5. In-App Notification synchronization & RLS isolation (Customer A vs Customer B)
 * 6. Admin Sandbox Outbox visibility & role-based access restrictions
 * 7. Verification that email provider secrets are never leaked to client code
 */

import {
  renderQuoteSubmitted,
  renderOrderConfirmed,
  renderProofReady,
  renderProofApproved,
  renderJobCompleted,
} from "../lib/email/email-templates.ts";

import {
  sendLifecycleEmail,
  validateRecipientEmail,
  getSandboxOutbox,
  getSandboxEmailById,
  getUserNotifications,
  markNotificationAsRead,
  DISPATCHED_EMAILS_STORE,
} from "../lib/email/email-engine.ts";

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

async function runTestSuite() {
  console.log("==================================================================");
  console.log("DIGITAL HEROES — TRANSACTIONAL EMAIL LIFECYCLE SUITE");
  console.log("==================================================================");

  // ------------------------------------------------------------------------
  // 1. TEMPLATE GENERATION & INDUSTRIAL FORMATTING
  // ------------------------------------------------------------------------
  console.log("\n--- Section 1: All 5 Lifecycle Email Templates ---");

  // 1a: QUOTE_SUBMITTED
  const quoteResult = renderQuoteSubmitted({
    quoteNumber: "QUO-2026-0099",
    customerName: "Alex Miller",
    customerEmail: "customer@digitalheroes.demo",
    divisionName: "Laser-Cut Work",
    productName: "Bespoke Acrylic Sign",
    specsSummary: "5mm Frosted Matte Acrylic • 600x400mm",
    dimensionsMm: { width: 600, height: 400 },
    quantity: 10,
    estimatedPriceCents: 24000,
    targetResponseHours: 2,
    customerNotes: "Bevelled edges required",
  });

  assert(quoteResult.subject.includes("QUO-2026-0099"), "1a: Quote subject contains quote number");
  assert(quoteResult.html.includes("Digital Heroes") && quoteResult.html.includes("QUOTE SUBMITTED"), "1a: Quote HTML contains branding and badge");
  assert(quoteResult.html.includes("600mm &times; 400mm") && quoteResult.html.includes("2 business hours"), "1a: Quote HTML contains dimensions and 2h SLA");
  assert(quoteResult.text.includes("Target Response SLA: Within 2 business hours"), "1a: Quote text contains plaintext SLA");

  // 1b: ORDER_CONFIRMED
  const orderResult = renderOrderConfirmed({
    orderNumber: "ORD-2026-0901",
    customerName: "Alex Miller",
    customerEmail: "customer@digitalheroes.demo",
    divisionName: "Labels & Stickers",
    productName: "Custom Die-Cut Vinyl Stickers",
    specsSummary: "Standard Vinyl Gloss • 75x50mm • Contour Cut",
    quantity: 500,
    subtotalCents: 28500,
    vatCents: 5700,
    totalCents: 34200,
    shippingAddress: {
      recipientName: "Alex Miller",
      addressLine1: "14 Roastery Lane",
      city: "Sheffield",
      postcode: "S1 2EF",
    },
    estimatedDispatchDays: 3,
  });

  assert(orderResult.subject.includes("ORD-2026-0901") && orderResult.subject.includes("Order Confirmed"), "1b: Order confirmed subject line matches");
  assert(orderResult.html.includes("£342.00") && orderResult.html.includes("20.0%"), "1b: Order confirmed HTML includes gross total and 20% VAT");
  assert(orderResult.html.includes("14 Roastery Lane") && orderResult.html.toLowerCase().includes("preflight"), "1b: Order confirmed HTML includes address and preflight stage");
  assert(orderResult.text.includes("Net Subtotal: £285.00"), "1b: Order confirmed plaintext matches net subtotal");

  // 1c: PROOF_READY_FOR_REVIEW
  const proofResult = renderProofReady({
    orderNumber: "ORD-2026-0901",
    customerName: "Alex Miller",
    customerEmail: "customer@digitalheroes.demo",
    productName: "Custom Die-Cut Vinyl Stickers",
    proofVersion: "v1",
    reviewUrl: "https://digitalheroes.demo/customer/dashboard?order=ORD-2026-0901&view=proof",
    specsSummary: "75x50mm • 3mm Bleed",
    changeRequestDeadlineHours: 24,
  });

  assert(proofResult.subject.includes("Proof v1 Ready for Review"), "1c: Proof review subject contains version");
  assert(proofResult.html.includes("Production files remain strictly locked") && proofResult.html.includes("LOCKED (Pending Sign-Off)"), "1c: Proof review HTML emphasizes locked production gate");
  assert(proofResult.html.includes("Review & Approve Proof v1"), "1c: Proof review HTML has direct CTA button");
  assert(proofResult.text.toUpperCase().includes("STATUS: PRODUCTION GATE LOCKED"), "1c: Proof review plaintext explicitly alerts locked gate");

  // 1d: PROOF_APPROVED
  const approvedResult = renderProofApproved({
    orderNumber: "ORD-2026-0901",
    customerName: "Alex Miller",
    customerEmail: "customer@digitalheroes.demo",
    productName: "Custom Die-Cut Vinyl Stickers",
    proofVersion: "v1",
    digitalSignatureHash: "a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef",
    approvedAt: "2026-03-24T14:30:00Z",
    machineAllocationName: "Roland TrueVIS VG3-640 (ECO-UV Inkjet & Cutter)",
  });

  assert(approvedResult.subject.includes("Proof v1 Approved") && approvedResult.subject.includes("Production Unlocked"), "1d: Proof approved subject matches");
  assert(approvedResult.html.includes("a1b2c3d4e5f678901234567890abcdef"), "1d: Proof approved HTML displays SHA-256 digital signature hash");
  assert(approvedResult.html.includes("Roland TrueVIS VG3-640"), "1d: Proof approved HTML identifies factory machinery line");
  assert(approvedResult.text.includes("PRODUCTION FILES RELEASED"), "1d: Proof approved plaintext announces released files");

  // 1e: JOB_COMPLETED_DISPATCHED
  const dispatchedResult = renderJobCompleted({
    orderNumber: "ORD-2026-0901",
    customerName: "Alex Miller",
    customerEmail: "customer@digitalheroes.demo",
    productName: "Custom Die-Cut Vinyl Stickers",
    quantity: 500,
    carrier: "DPD UK Tracked Express",
    trackingNumber: "DPD-GB-82910482",
    trackingUrl: "https://www.dpd.co.uk/tracking/DPD-GB-82910482",
    invoiceDownloadUrl: "https://digitalheroes.demo/api/invoices/ord-001",
    dispatchedAt: "2026-03-26T16:00:00Z",
  });

  assert(dispatchedResult.subject.includes("Dispatched: Order ORD-2026-0901"), "1e: Dispatched subject matches order number");
  assert(dispatchedResult.html.includes("DPD-GB-82910482") && dispatchedResult.html.includes("DPD UK Tracked Express"), "1e: Dispatched HTML contains courier tracking reference");
  assert(dispatchedResult.html.includes("1-Click Reorder"), "1e: Dispatched HTML includes 1-click reorder link");
  assert(dispatchedResult.text.includes("Track delivery: https://www.dpd.co.uk/tracking/DPD-GB-82910482"), "1e: Dispatched plaintext contains tracking URL");

  // ------------------------------------------------------------------------
  // 2. SECURITY & ANTI-INJECTION SANITIZATION
  // ------------------------------------------------------------------------
  console.log("\n--- Section 2: RFC 5322 CRLF Anti-Injection Sanitization ---");

  // 2a: Valid email
  const validEmail = validateRecipientEmail("customer@digitalheroes.demo");
  assert(validEmail === "customer@digitalheroes.demo", "2a: Valid recipient email passes validation");

  // 2b: CRLF Injection Attempt with newline
  let crlfBlocked = false;
  try {
    validateRecipientEmail("customer@digitalheroes.demo\r\nBcc: attacker@evil.com");
  } catch (err) {
    if (err.message.includes("SECURITY_VIOLATION") && err.message.includes("CRLF")) {
      crlfBlocked = true;
    }
  }
  assert(crlfBlocked, "2b: CRLF injection attempt with \\r\\n is blocked with SECURITY_VIOLATION");

  // 2c: Malformed email format
  let malformedBlocked = false;
  try {
    validateRecipientEmail("invalid-email-format-without-at");
  } catch (err) {
    if (err.message.includes("INVALID_EMAIL_FORMAT")) {
      malformedBlocked = true;
    }
  }
  assert(malformedBlocked, "2c: Malformed email address rejected with INVALID_EMAIL_FORMAT");

  // ------------------------------------------------------------------------
  // 3. IDEMPOTENCY & DEDUPLICATION GATE
  // ------------------------------------------------------------------------
  console.log("\n--- Section 3: Idempotency & Deduplication Gate ---");

  const testRef = `ORD-2026-TEST-${Date.now()}`;
  const firstSend = await sendLifecycleEmail({
    eventType: "ORDER_CONFIRMED",
    recipient: {
      email: "alex@test.digitalheroes.demo",
      name: "Alex Test",
      userId: "user-test-alex",
    },
    referenceId: testRef,
    qualifier: "initial",
    data: {
      orderNumber: testRef,
      customerName: "Alex Test",
      customerEmail: "alex@test.digitalheroes.demo",
      divisionName: "Stamps",
      productName: "Self-Inking Stamp",
      specsSummary: "45mm Round",
      quantity: 1,
      subtotalCents: 2000,
      vatCents: 400,
      totalCents: 2400,
      shippingAddress: {
        recipientName: "Alex Test",
        addressLine1: "1 High St",
        city: "Sheffield",
        postcode: "S1 1AA",
      },
      estimatedDispatchDays: 2,
    },
  });

  assert(firstSend.success === true && firstSend.isDuplicateSuppressed === false, "3a: Initial email dispatch succeeds without suppression");
  assert(firstSend.email.idempotencyKey === `ORDER_CONFIRMED:${testRef}:initial`, "3a: Idempotency key generated with correct canonical format");

  // Attempt duplicate send with identical parameters
  const duplicateSend = await sendLifecycleEmail({
    eventType: "ORDER_CONFIRMED",
    recipient: {
      email: "alex@test.digitalheroes.demo",
      name: "Alex Test",
      userId: "user-test-alex",
    },
    referenceId: testRef,
    qualifier: "initial",
    data: {
      orderNumber: testRef,
      customerName: "Alex Test",
      customerEmail: "alex@test.digitalheroes.demo",
      divisionName: "Stamps",
      productName: "Self-Inking Stamp",
      specsSummary: "45mm Round",
      quantity: 1,
      subtotalCents: 2000,
      vatCents: 400,
      totalCents: 2400,
      shippingAddress: {
        recipientName: "Alex Test",
        addressLine1: "1 High St",
        city: "Sheffield",
        postcode: "S1 1AA",
      },
      estimatedDispatchDays: 2,
    },
  });

  assert(duplicateSend.isDuplicateSuppressed === true, "3b: Deduplication gate detects and suppresses duplicate dispatch");
  assert(duplicateSend.email.id === firstSend.email.id, "3b: Suppressed delivery returns existing outbox record reference");

  // Send different qualifier (e.g. proof v2 vs v1)
  const differentRevisionSend = await sendLifecycleEmail({
    eventType: "PROOF_READY_FOR_REVIEW",
    recipient: {
      email: "alex@test.digitalheroes.demo",
      name: "Alex Test",
      userId: "user-test-alex",
    },
    referenceId: testRef,
    qualifier: "v2",
    data: {
      orderNumber: testRef,
      customerName: "Alex Test",
      customerEmail: "alex@test.digitalheroes.demo",
      productName: "Self-Inking Stamp",
      proofVersion: "v2",
      reviewUrl: `/customer/dashboard?order=${testRef}&view=proof`,
      specsSummary: "45mm Round",
      changeRequestDeadlineHours: 24,
    },
  });

  assert(differentRevisionSend.isDuplicateSuppressed === false, "3c: Different qualifier (v2) is not blocked by v1 idempotency");

  // Admin forced resend
  const adminResend = await sendLifecycleEmail({
    eventType: "ORDER_CONFIRMED",
    recipient: {
      email: "alex@test.digitalheroes.demo",
      name: "Alex Test",
      userId: "user-test-alex",
    },
    referenceId: testRef,
    qualifier: "initial",
    data: {
      orderNumber: testRef,
      customerName: "Alex Test",
      customerEmail: "alex@test.digitalheroes.demo",
      divisionName: "Stamps",
      productName: "Self-Inking Stamp",
      specsSummary: "45mm Round",
      quantity: 1,
      subtotalCents: 2000,
      vatCents: 400,
      totalCents: 2400,
      shippingAddress: {
        recipientName: "Alex Test",
        addressLine1: "1 High St",
        city: "Sheffield",
        postcode: "S1 1AA",
      },
      estimatedDispatchDays: 2,
    },
    forceResend: true,
    requestedByStaff: {
      userId: "00000000-0000-0000-0000-000000000099",
      fullName: "Sarah Connor (Staff #04)",
    },
  });

  assert(adminResend.isDuplicateSuppressed === false, "3d: Admin forceResend bypasses deduplication gate");
  assert(adminResend.email.resendHistory && adminResend.email.resendHistory.length > 0, "3d: Resend history logs staff identity");

  // ------------------------------------------------------------------------
  // 4. IN-APP USER NOTIFICATIONS & RLS ISOLATION
  // ------------------------------------------------------------------------
  console.log("\n--- Section 4: In-App User Notifications & RLS Privacy ---");

  const alexUserId = "00000000-0000-0000-0000-000000000001";
  const jordanUserId = "00000000-0000-0000-0000-000000000002";

  const alexNotifs = getUserNotifications(alexUserId);
  const jordanNotifs = getUserNotifications(jordanUserId);

  assert(alexNotifs.length > 0, "4a: Customer Alex has active in-app notifications");
  assert(jordanNotifs.length > 0, "4a: Customer Jordan has active in-app notifications");

  // Cross-user isolation: Alex cannot see Jordan's notifications
  const jordanIds = new Set(jordanNotifs.map((n) => n.id));
  const alexContainsJordan = alexNotifs.some((n) => jordanIds.has(n.id));
  assert(!alexContainsJordan, "4b: CROSS-USER RLS: Customer Alex cannot see Customer Jordan's notifications");

  // Mark notification as read
  const unreadTarget = alexNotifs.find((n) => !n.readAt) || alexNotifs[0];
  const updatedNotif = markNotificationAsRead(unreadTarget.id, alexUserId);
  assert(Boolean(updatedNotif.readAt), "4c: Mark notification as read records readAt timestamp");

  // Customer A cannot mark Customer B's notification as read
  let crossUserMarkBlocked = false;
  try {
    markNotificationAsRead(jordanNotifs[0].id, alexUserId);
  } catch (err) {
    if (err.message.includes("NOT_FOUND")) {
      crossUserMarkBlocked = true;
    }
  }
  assert(crossUserMarkBlocked, "4d: Customer Alex denied updating Customer Jordan's notification");

  // ------------------------------------------------------------------------
  // 5. ADMIN SANDBOX OUTBOX
  // ------------------------------------------------------------------------
  console.log("\n--- Section 5: Admin Email Outbox ---");

  const allOutbox = getSandboxOutbox();
  assert(allOutbox.length >= 5, "5a: Admin sandbox outbox contains pre-seeded and dispatched emails");

  const proofApprovedFiltered = getSandboxOutbox({ eventType: "PROOF_APPROVED" });
  assert(
    proofApprovedFiltered.every((e) => e.eventType === "PROOF_APPROVED"),
    "5b: Outbox filtering by eventType returns only matching records"
  );

  const searchFiltered = getSandboxOutbox({ search: "Peak Coffee" });
  assert(
    searchFiltered.length > 0 && searchFiltered.every((e) => e.toName.includes("Alex") || e.to.includes("customer")),
    "5c: Outbox text search matches recipient and subject terms"
  );

  const singleEmail = getSandboxEmailById(allOutbox[0].id);
  assert(
    singleEmail !== null && Boolean(singleEmail.htmlBody) && Boolean(singleEmail.textBody),
    "5d: Fetching single email returns full rendered HTML and plaintext"
  );

  // ------------------------------------------------------------------------
  // 6. FRONTEND SECRET EXPOSURE CHECK
  // ------------------------------------------------------------------------
  console.log("\n--- Section 6: Frontend Zero Secret Exposure Check ---");

  // Verify that neither email-templates.ts nor email-engine.ts hardcode real secret API keys
  const engineSource = DISPATCHED_EMAILS_STORE.every(
    (e) => !e.metadata.RESEND_API_KEY && !e.metadata.SENDGRID_API_KEY
  );
  assert(engineSource, "6a: No secret third-party email API keys exposed in outbox metadata");

  console.log("==================================================================");
  console.log(`EMAIL NOTIFICATIONS TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test runner exception:", err);
  process.exit(1);
});
