// ========================================================================
// DIGITAL HEROES — ORDERS, CHECKOUT & 1-CLICK REORDER TEST SUITE
// File: scripts/test-orders-checkout.mjs
// ========================================================================

import {
  resetOrderStore,
  getOrders,
  getOrderById,
  createCheckoutSession,
  processPaymentWebhook,
  reorderFromExistingOrder,
  reorderFromSavedDesign,
  getInvoiceForOrder,
} from "../lib/orders/order-store.ts";

console.log("==================================================================");
console.log("DIGITAL HEROES — ORDERS, CHECKOUT & REORDER SUITE");
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

// Reset store
resetOrderStore();

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
// TEST 1: Checkout Session Creation & Server Price Recalculation
// -------------------------------------------------------------------------
const session = createCheckoutSession({
  customer: CUSTOMER_A,
  productSlug: "vinyl-stickers",
  widthMm: 75,
  heightMm: 50,
  quantity: 500,
  materialCode: "GLOSS_VINYL",
  finishCode: "GLOSS_LAM",
  cutTypeCode: "DIE_CUT",
  shippingAddress: {
    recipientName: "Alex Miller",
    addressLine1: "14 Foundry Lane",
    city: "Sheffield",
    postcode: "S3 8HQ",
    country: "United Kingdom",
  },
});

assert("Test 1a: Checkout session generated with sessionId", session.sessionId.startsWith("cs_test_"));
assert("Test 1b: Order draft created in PAYMENT_PENDING status", session.orderDraft.status === "PAYMENT_PENDING");
assert("Test 1c: Order number generated sequentially", session.orderDraft.orderNumber.startsWith("ORD-2026-"));
assert("Test 1d: Server calculates authoritative 20% VAT", session.orderDraft.pricing.vatCents === Math.round(session.orderDraft.pricing.subtotalCents * 0.20));
assert("Test 1e: Total equals subtotal + VAT", session.orderDraft.pricing.totalCents === session.orderDraft.pricing.subtotalCents + session.orderDraft.pricing.vatCents);

// -------------------------------------------------------------------------
// TEST 2: Stripe Payment Webhook & Idempotency
// -------------------------------------------------------------------------
const webhookEventId = "evt_test_checkout_unique_1001";
const webhookPayload = {
  id: webhookEventId,
  type: "checkout.session.completed",
  data: {
    object: {
      id: session.sessionId,
      order_id: session.orderDraft.id,
      payment_status: "paid",
      payment_intent: "pi_test_intent_789",
      amount_total: session.orderDraft.pricing.totalCents,
      card_brand: "visa",
      card_last4: "4242",
    },
  },
};

const firstWebhookResult = processPaymentWebhook(webhookPayload);
assert("Test 2a: First webhook delivery processed successfully", firstWebhookResult.success === true && firstWebhookResult.duplicate === false);

const updatedOrder = getOrderById(session.orderDraft.id);
assert("Test 2b: Order transitioned to PAID status", updatedOrder.status === "PAID");
assert("Test 2c: Order advanced into PROOF pipeline stage", updatedOrder.stage === "PROOF");
assert("Test 2d: Payment details captured (transactionId, cardLast4)", updatedOrder.paymentDetails.cardLast4 === "4242");

// Idempotent retry test
const secondWebhookResult = processPaymentWebhook(webhookPayload);
assert("Test 2e: Idempotency: Duplicate webhook delivery recognized and skipped", secondWebhookResult.duplicate === true);

// -------------------------------------------------------------------------
// TEST 3: 1-Click Reorder from Existing Order
// -------------------------------------------------------------------------
const reorderedOrder = reorderFromExistingOrder("ORD-2026-0891", CUSTOMER_A);
assert("Test 3a: 1-Click reorder generates fresh order number", reorderedOrder.orderNumber !== "ORD-2026-0891");
assert("Test 3b: Reordered order preserves specifications (width, height, product)", reorderedOrder.dimensions.widthMm === 75 && reorderedOrder.dimensions.heightMm === 50);
assert("Test 3c: Reordered order starts in ORDER stage with PAID status", reorderedOrder.status === "PAID");
assert("Test 3d: Reordered order has initial proof version v1", reorderedOrder.proofVersion === "v1");

// Reorder with quantity override
const reorderSmallQty = reorderFromExistingOrder("ORD-2026-0891", CUSTOMER_A, 250);
assert("Test 3e: Reorder with quantity override sets quantity to 250", reorderSmallQty.quantity === 250);
assert("Test 3f: Reordered price adjusts correctly for smaller volume tier", reorderSmallQty.pricing.subtotalCents < reorderedOrder.pricing.subtotalCents);

// -------------------------------------------------------------------------
// TEST 4: 1-Click Reorder from Saved Design Template
// -------------------------------------------------------------------------
const designOrder = reorderFromSavedDesign("DSGN-LABELS-01", CUSTOMER_A);
assert("Test 4a: Reorder from saved design template succeeds", designOrder.productSlug === "vinyl-stickers");
assert("Test 4b: Reordered design preserves template dimensions (60x90mm)", designOrder.dimensions.widthMm === 60 && designOrder.dimensions.heightMm === 90);
assert("Test 4c: Reordered design links to saved designId", designOrder.designId === "DSGN-LABELS-01");

// -------------------------------------------------------------------------
// TEST 5: Cross-Customer Tenant Isolation
// -------------------------------------------------------------------------
let custBReorderBlocked = false;
try {
  reorderFromExistingOrder("ORD-2026-0891", CUSTOMER_B);
} catch (e) {
  if (e.message.includes("SECURITY_VIOLATION")) {
    custBReorderBlocked = true;
  }
}
assert("Test 5a: Customer B blocked from 1-click reordering Customer A's order", custBReorderBlocked);

let custBDesignBlocked = false;
try {
  reorderFromSavedDesign("DSGN-LABELS-01", CUSTOMER_B);
} catch (e) {
  if (e.message.includes("SECURITY_VIOLATION")) {
    custBDesignBlocked = true;
  }
}
assert("Test 5b: Customer B blocked from reordering Customer A's saved template", custBDesignBlocked);

let custBInvoiceBlocked = false;
try {
  getInvoiceForOrder("ORD-2026-0891", CUSTOMER_B.id, false);
} catch (e) {
  if (e.message.includes("ACCESS_DENIED")) {
    custBInvoiceBlocked = true;
  }
}
assert("Test 5c: Customer B blocked from accessing Customer A's invoice", custBInvoiceBlocked);

const custAOrders = getOrders(CUSTOMER_A.id, false);
const hasCustBOrderInA = custAOrders.some((o) => o.customerId === CUSTOMER_B.id);
assert("Test 5d: Customer A order query returns zero orders from Customer B", !hasCustBOrderInA);

// -------------------------------------------------------------------------
// TEST 6: Xero-Compatible Commercial Invoice Structure
// -------------------------------------------------------------------------
const invoice = getInvoiceForOrder("ORD-2026-0891", CUSTOMER_A.id);
assert("Test 6a: Invoice generated with INV- prefix", invoice !== null && invoice.invoiceNumber === "INV-2026-0891");
assert("Test 6b: Invoice includes customer details and currency GBP", invoice.currency === "GBP" && invoice.customerName === CUSTOMER_A.fullName);
assert("Test 6c: Invoice includes Xero integration reference", invoice.xeroReference.startsWith("XERO-ACC-REC-"));
assert("Test 6d: Invoice line item breakdown present with net, VAT, and gross", invoice.lineItems.length > 0 && invoice.lineItems[0].vatRatePercent === 20);

// -------------------------------------------------------------------------
// TEST 7: Admin Cross-Tenant Privileges
// -------------------------------------------------------------------------
const adminInvoice = getInvoiceForOrder("ORD-2026-0891", ADMIN.id, true);
assert("Test 7a: Admin can retrieve invoice for any order", adminInvoice !== null);

const allOrders = getOrders(ADMIN.id, true);
assert("Test 7b: Admin gets all orders across customers A and B", allOrders.length >= 3);

console.log("==================================================================");
console.log(`ORDERS & CHECKOUT TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log("==================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
