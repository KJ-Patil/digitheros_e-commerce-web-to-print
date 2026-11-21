import { calculatePrice, type PricingRequest } from "../pricing/engine.ts";
import { PROOF_STORE, type OrderProofState } from "../proofs/proof-engine.ts";

export interface ShippingAddress {
  recipientName: string;
  companyName?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  countyOrState?: string;
  postcode: string;
  country: string;
  phone?: string;
}

export interface DeliveryTracking {
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  dispatchStatus?: "PENDING" | "DISPATCHED" | "IN_TRANSIT" | "DELIVERED";
  dispatchedAt?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
}

export interface StoredOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  stage: "QUOTE" | "ORDER" | "ARTWORK" | "PROOF" | "PRODUCTION" | "COMPLETED";
  status: "PAYMENT_PENDING" | "PAID" | "IN_PRODUCTION" | "SHIPPED" | "COMPLETED";
  productSlug: string;
  productName: string;
  divisionSlug: string;
  divisionName: string;
  specsSummary: string;
  dimensions: {
    widthMm: number;
    heightMm: number;
  };
  quantity: number;
  selectedParameters: {
    material?: { name: string; code: string };
    finish?: { name: string; code: string };
    cutType?: { name: string; code: string };
  };
  pricing: {
    unitPriceCents: number;
    subtotalCents: number;
    discountCents: number;
    vatCents: number;
    totalCents: number;
    currency: string;
  };
  shippingAddress: ShippingAddress;
  paymentDetails: {
    provider: "stripe_simulated";
    sessionId: string;
    transactionId?: string;
    paymentStatus: "paid" | "pending" | "failed" | "cancelled";
    paidAt?: string;
    cardBrand?: string;
    cardLast4?: string;
    declineReason?: string;
  };
  deliveryTracking?: DeliveryTracking;
  designId?: string;
  proofVersion: string;
  isProofApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedDesignTemplate {
  id: string;
  customerId: string;
  name: string;
  productSlug: string;
  productName: string;
  divisionName: string;
  widthMm: number;
  heightMm: number;
  defaultQuantity: number;
  materialCode: string;
  finishCode?: string;
  cutTypeCode?: string;
  previewThumbnail: string;
  approvedVersion: string;
  lastOrderedDate: string;
  lastOrderNumber: string;
}

export interface OrderInvoice {
  id: string;
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  companyName?: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPriceCents: number;
    discountCents: number;
    netCents: number;
    vatRatePercent: number;
    vatCents: number;
    grossCents: number;
  }[];
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  paymentStatus: "PAID" | "PENDING";
  paidAt?: string;
  xeroReference: string;
}

// Initial seed orders
const INITIAL_ORDERS: StoredOrder[] = [
  {
    id: "c1000000-0000-0000-0000-000000000001",
    orderNumber: "ORD-2026-0891",
    customerId: "00000000-0000-0000-0000-000000000001",
    customerName: "Alex Miller",
    customerEmail: "customer@digitalheroes.demo",
    stage: "PRODUCTION",
    status: "PAID",
    productSlug: "vinyl-stickers",
    productName: "Custom Die-Cut Vinyl Stickers",
    divisionSlug: "labels",
    divisionName: "Labels & Stickers",
    specsSummary: "75x50mm Gloss Vinyl • Die-cut oval • Roland TrueVIS",
    dimensions: { widthMm: 75, heightMm: 50 },
    quantity: 1000,
    selectedParameters: {
      material: { name: "Gloss Vinyl (100μ)", code: "GLOSS_VINYL" },
      finish: { name: "UV Protective Gloss", code: "GLOSS_LAM" },
      cutType: { name: "Individual Die-Cut", code: "DIE_CUT" },
    },
    pricing: {
      unitPriceCents: 14,
      subtotalCents: 14000,
      discountCents: 7500,
      vatCents: 2800,
      totalCents: 16800,
      currency: "GBP",
    },
    shippingAddress: {
      recipientName: "Alex Miller",
      companyName: "Peak Coffee Roasters",
      addressLine1: "14 Foundry Lane",
      city: "Sheffield",
      postcode: "S3 8HQ",
      country: "United Kingdom",
    },
    paymentDetails: {
      provider: "stripe_simulated",
      sessionId: "cs_test_0891_seed",
      transactionId: "ch_test_3N8c12a0891",
      paymentStatus: "paid",
      paidAt: "2026-03-23T11:20:00Z",
      cardBrand: "visa",
      cardLast4: "4242",
    },
    designId: "DSGN-LABELS-01",
    proofVersion: "v2",
    isProofApproved: true,
    createdAt: "2026-03-23T10:00:00Z",
    updatedAt: "2026-03-23T16:42:00Z",
  },
  {
    id: "c1000000-0000-0000-0000-000000000002",
    orderNumber: "ORD-2026-0892",
    customerId: "00000000-0000-0000-0000-000000000001",
    customerName: "Alex Miller",
    customerEmail: "customer@digitalheroes.demo",
    stage: "PROOF",
    status: "PAID",
    productSlug: "tyvek-race-bibs",
    productName: "Enduro Tyvek Race Bibs",
    divisionSlug: "race-numbers",
    divisionName: "Race & Event Numbers",
    specsSummary: "210x148mm Tyvek • 4-hole punch • Barcode merge (500 runners)",
    dimensions: { widthMm: 210, heightMm: 148 },
    quantity: 500,
    selectedParameters: {
      material: { name: "Tearproof Tyvek (100gsm)", code: "TYVEK_100" },
      cutType: { name: "4-Corner Hole Punch", code: "PUNCH_4HOLE" },
    },
    pricing: {
      unitPriceCents: 45,
      subtotalCents: 18750,
      discountCents: 6250,
      vatCents: 3750,
      totalCents: 22500,
      currency: "GBP",
    },
    shippingAddress: {
      recipientName: "Alex Miller",
      companyName: "Alpine Enduro Trail",
      addressLine1: "Peak District Race HQ",
      city: "Castleton",
      postcode: "S33 8WN",
      country: "United Kingdom",
    },
    paymentDetails: {
      provider: "stripe_simulated",
      sessionId: "cs_test_0892_seed",
      transactionId: "ch_test_3N8c12a0892",
      paymentStatus: "paid",
      paidAt: "2026-03-24T09:30:00Z",
      cardBrand: "mastercard",
      cardLast4: "5555",
    },
    designId: "DSGN-RACE-02",
    proofVersion: "v1",
    isProofApproved: false,
    createdAt: "2026-03-24T09:15:00Z",
    updatedAt: "2026-03-24T09:30:00Z",
  },
  {
    id: "c1000000-0000-0000-0000-000000000050",
    orderNumber: "ORD-2026-0850",
    customerId: "00000000-0000-0000-0000-000000000001",
    customerName: "Alex Miller",
    customerEmail: "customer@digitalheroes.demo",
    stage: "COMPLETED",
    status: "COMPLETED",
    productSlug: "mtb-handlebar-plates",
    productName: "Downhill MTB Number Boards",
    divisionSlug: "mtb-boards",
    divisionName: "MTB Boards",
    specsSummary: "800μ Polypropylene • Custom contour cut • 4 cable tie slots",
    dimensions: { widthMm: 180, heightMm: 160 },
    quantity: 250,
    selectedParameters: {
      material: { name: "0.8mm Polypropylene", code: "POLYPRO_800" },
      finish: { name: "Matte Anti-Glare", code: "MATTE_LAM" },
      cutType: { name: "Contour Die-Cut + Slots", code: "DIE_CUT_SLOTS" },
    },
    pricing: {
      unitPriceCents: 105,
      subtotalCents: 26250,
      discountCents: 4632,
      vatCents: 5250,
      totalCents: 31500,
      currency: "GBP",
    },
    shippingAddress: {
      recipientName: "Alex Miller",
      companyName: "Peak Coffee Roasters",
      addressLine1: "14 Foundry Lane",
      city: "Sheffield",
      postcode: "S3 8HQ",
      country: "United Kingdom",
    },
    paymentDetails: {
      provider: "stripe_simulated",
      sessionId: "cs_test_0850_seed",
      transactionId: "ch_test_3N8c12a0850",
      paymentStatus: "paid",
      paidAt: "2026-02-14T11:00:00Z",
      cardBrand: "visa",
      cardLast4: "4242",
    },
    designId: "DSGN-MTB-01",
    proofVersion: "v1",
    isProofApproved: true,
    createdAt: "2026-02-14T10:30:00Z",
    updatedAt: "2026-02-16T15:00:00Z",
  },
  {
    id: "c1000000-0000-0000-0000-000000000003",
    orderNumber: "ORD-2026-0893",
    customerId: "00000000-0000-0000-0000-000000000002",
    customerName: "Sarah Jenkins",
    customerEmail: "customer-b@digitalheroes.demo",
    stage: "ARTWORK",
    status: "PAID",
    productSlug: "mtb-handlebar-plates",
    productName: "Downhill MTB Number Boards",
    divisionSlug: "mtb-boards",
    divisionName: "MTB Boards",
    specsSummary: "800μ Polypropylene • Custom contour cut",
    dimensions: { widthMm: 180, heightMm: 160 },
    quantity: 250,
    selectedParameters: {
      material: { name: "0.8mm Polypropylene", code: "POLYPRO_800" },
    },
    pricing: {
      unitPriceCents: 105,
      subtotalCents: 26250,
      discountCents: 4632,
      vatCents: 5250,
      totalCents: 31500,
      currency: "GBP",
    },
    shippingAddress: {
      recipientName: "Sarah Jenkins",
      companyName: "RedRock Gravity Cup",
      addressLine1: "10 Mountain View",
      city: "Fort William",
      postcode: "PH33 6TQ",
      country: "United Kingdom",
    },
    paymentDetails: {
      provider: "stripe_simulated",
      sessionId: "cs_test_0893_seed",
      transactionId: "ch_test_3N8c12a0893",
      paymentStatus: "paid",
      paidAt: "2026-03-24T12:00:00Z",
      cardBrand: "visa",
      cardLast4: "1111",
    },
    proofVersion: "v1",
    isProofApproved: false,
    createdAt: "2026-03-24T11:45:00Z",
    updatedAt: "2026-03-24T12:00:00Z",
  },
];

// Seed saved design templates
const INITIAL_SAVED_DESIGNS: SavedDesignTemplate[] = [
  {
    id: "DSGN-LABELS-01",
    customerId: "00000000-0000-0000-0000-000000000001",
    name: "Cold Brew Front Label (60x90mm)",
    productSlug: "vinyl-stickers",
    productName: "Custom Die-Cut Vinyl Stickers",
    divisionName: "Labels & Stickers",
    widthMm: 60,
    heightMm: 90,
    defaultQuantity: 500,
    materialCode: "METALLIC_VINYL",
    finishCode: "GLOSS_LAM",
    cutTypeCode: "DIE_CUT",
    previewThumbnail: "/proofs/ORD-0891_v2.png",
    approvedVersion: "v2",
    lastOrderedDate: "2026-03-23",
    lastOrderNumber: "ORD-2026-0891",
  },
  {
    id: "DSGN-RACE-02",
    customerId: "00000000-0000-0000-0000-000000000001",
    name: "Enduro 2025 Bib Template (210x148mm)",
    productSlug: "tyvek-race-bibs",
    productName: "Enduro Tyvek Race Bibs",
    divisionName: "Race & Event Numbers",
    widthMm: 210,
    heightMm: 148,
    defaultQuantity: 500,
    materialCode: "TYVEK_100",
    cutTypeCode: "PUNCH_4HOLE",
    previewThumbnail: "/proofs/ORD-0892_v1.png",
    approvedVersion: "v1",
    lastOrderedDate: "2026-03-24",
    lastOrderNumber: "ORD-2026-0892",
  },
  {
    id: "DSGN-TRPH-05",
    customerId: "00000000-0000-0000-0000-000000000001",
    name: "Annual Series Overall 1st-3rd (150x200mm)",
    productSlug: "acrylic-trophies",
    productName: "Laser Cast Acrylic Awards",
    divisionName: "Laser Trophies",
    widthMm: 150,
    heightMm: 200,
    defaultQuantity: 12,
    materialCode: "ACRYLIC_10MM",
    cutTypeCode: "WOOD_BASE",
    previewThumbnail: "/proofs/ORD-0888_v1.png",
    approvedVersion: "v1",
    lastOrderedDate: "2026-03-20",
    lastOrderNumber: "ORD-2026-0888",
  },
  {
    id: "DSGN-MTB-01",
    customerId: "00000000-0000-0000-0000-000000000001",
    name: "Downhill Handlebar Board (180x160mm)",
    productSlug: "mtb-handlebar-plates",
    productName: "Downhill MTB Number Boards",
    divisionName: "MTB Boards",
    widthMm: 180,
    heightMm: 160,
    defaultQuantity: 100,
    materialCode: "POLYPRO_800",
    cutTypeCode: "DIE_CUT_SLOTS",
    previewThumbnail: "/proofs/ORD-0893_v1.png",
    approvedVersion: "v1",
    lastOrderedDate: "2026-03-24",
    lastOrderNumber: "ORD-2026-0850",
  },
];

// In-memory store
export let ORDERS_STORE: StoredOrder[] = JSON.parse(JSON.stringify(INITIAL_ORDERS));
export let SAVED_DESIGNS_STORE: SavedDesignTemplate[] = JSON.parse(JSON.stringify(INITIAL_SAVED_DESIGNS));
export const PROCESSED_WEBHOOK_EVENTS = new Set<string>();

let orderCounter = 896;

export function resetOrderStore(): void {
  ORDERS_STORE = JSON.parse(JSON.stringify(INITIAL_ORDERS));
  SAVED_DESIGNS_STORE = JSON.parse(JSON.stringify(INITIAL_SAVED_DESIGNS));
  PROCESSED_WEBHOOK_EVENTS.clear();
  orderCounter = 896;
}

/**
 * Get all orders, filtered by customer ID unless admin
 */
export function getOrders(customerId?: string, isAdmin: boolean = false): StoredOrder[] {
  if (isAdmin || customerId === "00000000-0000-0000-0000-000000000099") {
    return ORDERS_STORE;
  }
  if (!customerId) return [];
  return ORDERS_STORE.filter((o) => o.customerId === customerId);
}

/**
 * Get an order by ID or order number with access validation
 */
export function getOrderById(
  orderQuery: string,
  requestingUserId?: string,
  isAdmin: boolean = false
): StoredOrder | null {
  const order = ORDERS_STORE.find(
    (o) => o.id === orderQuery || o.orderNumber === orderQuery
  );
  if (!order) return null;

  if (
    requestingUserId &&
    !isAdmin &&
    requestingUserId !== "00000000-0000-0000-0000-000000000099" &&
    order.customerId !== requestingUserId
  ) {
    throw new Error("ACCESS_DENIED: You do not have permission to access this order.");
  }

  return order;
}

export interface CheckoutSessionInput {
  customer: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  productSlug: string;
  widthMm: number;
  heightMm: number;
  quantity: number;
  materialCode?: string;
  finishCode?: string;
  cutTypeCode?: string;
  shippingAddress: ShippingAddress;
  designId?: string;
}

/**
 * Creates a Stripe checkout session with server-side authoritative pricing
 */
export function createCheckoutSession(input: CheckoutSessionInput): {
  sessionId: string;
  checkoutUrl: string;
  orderDraft: StoredOrder;
} {
  // 1. Authoritative server price recalculation (anti-tampering)
  const pricingReq: PricingRequest = {
    productSlug: input.productSlug,
    widthMm: input.widthMm,
    heightMm: input.heightMm,
    quantity: input.quantity,
    materialCode: input.materialCode,
    finishCode: input.finishCode,
    cutTypeCode: input.cutTypeCode,
  };

  const calculated = calculatePrice(pricingReq);

  orderCounter++;
  const orderNum = `ORD-2026-0${orderCounter}`;
  const orderId = `c1000000-0000-0000-0000-${String(orderCounter).padStart(12, "0")}`;
  const sessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const newOrder: StoredOrder = {
    id: orderId,
    orderNumber: orderNum,
    customerId: input.customer.id,
    customerName: input.customer.fullName,
    customerEmail: input.customer.email,
    stage: "ORDER",
    status: "PAYMENT_PENDING",
    productSlug: input.productSlug,
    productName: calculated.product.name,
    divisionSlug: calculated.product.divisionSlug,
    divisionName: calculated.product.name,
    specsSummary: `${input.widthMm}x${input.heightMm}mm • ${calculated.selectedParameters.material.name} • ${input.quantity} units`,
    dimensions: {
      widthMm: input.widthMm,
      heightMm: input.heightMm,
    },
    quantity: input.quantity,
    selectedParameters: {
      material: calculated.selectedParameters.material,
      finish: calculated.selectedParameters.finish,
      cutType: calculated.selectedParameters.cutType,
    },
    pricing: {
      unitPriceCents: calculated.breakdown.unitPriceCents,
      subtotalCents: calculated.breakdown.subtotalCents,
      discountCents: calculated.breakdown.discountSavingsCents,
      vatCents: calculated.breakdown.vatCents,
      totalCents: calculated.breakdown.totalCents,
      currency: "GBP",
    },
    shippingAddress: input.shippingAddress,
    paymentDetails: {
      provider: "stripe_simulated",
      sessionId,
      paymentStatus: "pending",
    },
    designId: input.designId,
    proofVersion: "v1",
    isProofApproved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  ORDERS_STORE.unshift(newOrder);

  // Also initialize proof slot in PROOF_STORE
  const proofState: OrderProofState = {
    orderId,
    orderNumber: orderNum,
    customerId: input.customer.id,
    customerName: input.customer.fullName,
    productName: calculated.product.name,
    dimensions: `${input.widthMm} x ${input.heightMm} mm (3mm Bleed)`,
    currentVersion: 1,
    isUnlockedForProduction: false,
    revisions: [
      {
        id: `pr-${orderNum.replace(/[^a-zA-Z0-9]/g, "")}-1`,
        orderId,
        orderNumber: orderNum,
        versionNumber: 1,
        status: "PENDING",
        previewUrl: `/proofs/${orderNum}_v1.png`,
        changeNotes: "Initial automated proof rendering from customer configuration.",
        createdAt: new Date().toISOString(),
      },
    ],
  };
  PROOF_STORE[orderId] = proofState;

  return {
    sessionId,
    checkoutUrl: `/checkout?session_id=${sessionId}`,
    orderDraft: newOrder,
  };
}

/**
 * Process incoming payment events (e.g. Stripe checkout.session.completed)
 * Idempotent: repeated deliveries for the same event ID are discarded cleanly.
 */
export function processPaymentWebhook(event: {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      order_id?: string;
      payment_status?: string;
      payment_intent?: string;
      amount_total?: number;
      card_brand?: string;
      card_last4?: string;
      decline_reason?: string;
      metadata?: Record<string, string>;
    };
  };
}): { success: boolean; duplicate: boolean; order?: StoredOrder; message: string } {
  // Idempotency check
  if (PROCESSED_WEBHOOK_EVENTS.has(event.id)) {
    return {
      success: true,
      duplicate: true,
      message: `Idempotent skip: Webhook event '${event.id}' has already been processed.`,
    };
  }

  const session = event.data.object;
  const order = ORDERS_STORE.find(
    (o) =>
      o.paymentDetails.sessionId === session.id ||
      (session.order_id && (o.id === session.order_id || o.orderNumber === session.order_id)) ||
      (session.metadata?.orderId && (o.id === session.metadata.orderId || o.orderNumber === session.metadata.orderId)) ||
      (session.metadata?.orderNumber && (o.id === session.metadata.orderNumber || o.orderNumber === session.metadata.orderNumber))
  );

  if (!order) {
    throw new Error(`ORDER_NOT_FOUND: No order found matching session '${session.id}'.`);
  }

  if (event.type === "checkout.session.completed") {
    order.status = "PAID";
    order.stage = "PROOF"; // Transitions into Proof pipeline stage
    order.paymentDetails.paymentStatus = "paid";
    order.paymentDetails.transactionId = session.payment_intent || `ch_test_${Math.random().toString(36).substring(2, 10)}`;
    order.paymentDetails.paidAt = new Date().toISOString();
    order.paymentDetails.cardBrand = session.card_brand || "visa";
    order.paymentDetails.cardLast4 = session.card_last4 || "4242";
    order.updatedAt = new Date().toISOString();

    PROCESSED_WEBHOOK_EVENTS.add(event.id);

    return {
      success: true,
      duplicate: false,
      order,
      message: `Payment confirmed for order ${order.orderNumber}. Order advanced to PROOF stage.`,
    };
  }

  if (event.type === "checkout.session.failed" || event.type === "payment_intent.payment_failed") {
    order.status = "PAYMENT_PENDING";
    order.paymentDetails.paymentStatus = "failed";
    order.paymentDetails.declineReason = session.decline_reason || "Simulated card decline: Insufficient funds or invalid card.";
    order.updatedAt = new Date().toISOString();

    PROCESSED_WEBHOOK_EVENTS.add(event.id);

    return {
      success: false,
      duplicate: false,
      order,
      message: `Payment failed for order ${order.orderNumber}: ${order.paymentDetails.declineReason}`,
    };
  }

  if (event.type === "checkout.session.cancelled") {
    order.status = "PAYMENT_PENDING";
    order.paymentDetails.paymentStatus = "cancelled";
    order.paymentDetails.declineReason = "Checkout session cancelled by customer.";
    order.updatedAt = new Date().toISOString();

    PROCESSED_WEBHOOK_EVENTS.add(event.id);

    return {
      success: false,
      duplicate: false,
      order,
      message: `Checkout session cancelled for order ${order.orderNumber}.`,
    };
  }

  PROCESSED_WEBHOOK_EVENTS.add(event.id);
  return {
    success: true,
    duplicate: false,
    message: `Unhandled event type '${event.type}' acknowledged.`,
  };
}

/**
 * Update delivery tracking information for an order
 */
export function updateOrderTracking(
  orderId: string,
  tracking: DeliveryTracking
): StoredOrder {
  const order = ORDERS_STORE.find((o) => o.id === orderId || o.orderNumber === orderId);
  if (!order) {
    throw new Error(`ORDER_NOT_FOUND: Order '${orderId}' not found.`);
  }

  const dispatchStatus = tracking.dispatchStatus || "DISPATCHED";
  const courier = tracking.courierName || "Royal Mail Tracked 48";
  const trackingNumber = tracking.trackingNumber || `RM48-${Date.now().toString().slice(-8)}GB`;

  order.deliveryTracking = {
    courierName: courier,
    trackingNumber,
    trackingUrl:
      tracking.trackingUrl ||
      (courier.toLowerCase().includes("dpd")
        ? `https://track.dpd.co.uk/search?reference=${trackingNumber}`
        : `https://www.royalmail.com/track-your-item#/tracking-results/${trackingNumber}`),
    dispatchStatus,
    dispatchedAt: order.deliveryTracking?.dispatchedAt || new Date().toISOString(),
    estimatedDelivery: tracking.estimatedDelivery || "2 business days",
    deliveredAt: dispatchStatus === "DELIVERED" ? new Date().toISOString() : undefined,
  };

  if (dispatchStatus === "DISPATCHED" || dispatchStatus === "IN_TRANSIT") {
    order.status = "SHIPPED";
  } else if (dispatchStatus === "DELIVERED") {
    order.status = "COMPLETED";
    order.stage = "COMPLETED";
  }

  order.updatedAt = new Date().toISOString();
  return order;
}

/**
 * 1-Click Reorder from an Existing Order
 */
export function reorderFromExistingOrder(
  sourceOrderId: string,
  requestingUser: { id: string; email: string; fullName: string; role: string },
  overrideQuantity?: number
): StoredOrder {
  const sourceOrder = ORDERS_STORE.find(
    (o) => o.id === sourceOrderId || o.orderNumber === sourceOrderId
  );

  if (!sourceOrder) {
    throw new Error(`ORDER_NOT_FOUND: Source order '${sourceOrderId}' does not exist.`);
  }

  // Cross-user permission guard
  if (
    requestingUser.role !== "admin" &&
    requestingUser.id !== "00000000-0000-0000-0000-000000000099" &&
    sourceOrder.customerId !== requestingUser.id
  ) {
    throw new Error("SECURITY_VIOLATION: Cannot reorder from an order belonging to another customer.");
  }

  const quantity = overrideQuantity && overrideQuantity > 0 ? overrideQuantity : sourceOrder.quantity;

  // Recalculate price authoritatively on the server at current rate
  const pricingReq: PricingRequest = {
    productSlug: sourceOrder.productSlug,
    widthMm: sourceOrder.dimensions.widthMm,
    heightMm: sourceOrder.dimensions.heightMm,
    quantity,
    materialCode: sourceOrder.selectedParameters.material?.code,
    finishCode: sourceOrder.selectedParameters.finish?.code,
    cutTypeCode: sourceOrder.selectedParameters.cutType?.code,
  };

  const calculated = calculatePrice(pricingReq);

  orderCounter++;
  const newOrderNum = `ORD-2026-0${orderCounter}`;
  const newOrderId = `c1000000-0000-0000-0000-${String(orderCounter).padStart(12, "0")}`;

  const newOrder: StoredOrder = {
    id: newOrderId,
    orderNumber: newOrderNum,
    customerId: requestingUser.id,
    customerName: requestingUser.fullName,
    customerEmail: requestingUser.email,
    stage: "ORDER",
    status: "PAID",
    productSlug: sourceOrder.productSlug,
    productName: sourceOrder.productName,
    divisionSlug: sourceOrder.divisionSlug,
    divisionName: sourceOrder.divisionName,
    specsSummary: `Repeat of ${sourceOrder.orderNumber}: ${sourceOrder.specsSummary}`,
    dimensions: { ...sourceOrder.dimensions },
    quantity,
    selectedParameters: { ...sourceOrder.selectedParameters },
    pricing: {
      unitPriceCents: calculated.breakdown.unitPriceCents,
      subtotalCents: calculated.breakdown.subtotalCents,
      discountCents: calculated.breakdown.discountSavingsCents,
      vatCents: calculated.breakdown.vatCents,
      totalCents: calculated.breakdown.totalCents,
      currency: "GBP",
    },
    shippingAddress: { ...sourceOrder.shippingAddress },
    paymentDetails: {
      provider: "stripe_simulated",
      sessionId: `cs_test_repeat_${Date.now()}`,
      transactionId: `ch_test_repeat_${Math.random().toString(36).substring(2, 9)}`,
      paymentStatus: "paid",
      paidAt: new Date().toISOString(),
      cardBrand: sourceOrder.paymentDetails.cardBrand || "visa",
      cardLast4: sourceOrder.paymentDetails.cardLast4 || "4242",
    },
    designId: sourceOrder.designId,
    proofVersion: "v1",
    isProofApproved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  ORDERS_STORE.unshift(newOrder);

  // Initialize fresh proof slot
  const proofState: OrderProofState = {
    orderId: newOrderId,
    orderNumber: newOrderNum,
    customerId: requestingUser.id,
    customerName: requestingUser.fullName,
    productName: newOrder.productName,
    dimensions: `${newOrder.dimensions.widthMm} x ${newOrder.dimensions.heightMm} mm (3mm Bleed)`,
    currentVersion: 1,
    isUnlockedForProduction: false,
    revisions: [
      {
        id: `pr-${newOrderNum.replace(/[^a-zA-Z0-9]/g, "")}-1`,
        orderId: newOrderId,
        orderNumber: newOrderNum,
        versionNumber: 1,
        status: "PENDING",
        previewUrl: `/proofs/${newOrderNum}_v1.png`,
        changeNotes: `1-Click Repeat order generated from ${sourceOrder.orderNumber}.`,
        createdAt: new Date().toISOString(),
      },
    ],
  };
  PROOF_STORE[newOrderId] = proofState;

  return newOrder;
}

/**
 * 1-Click Reorder from a Saved Design Template
 */
export function reorderFromSavedDesign(
  designId: string,
  requestingUser: { id: string; email: string; fullName: string; role: string },
  overrideQuantity?: number
): StoredOrder {
  const design = SAVED_DESIGNS_STORE.find((d) => d.id === designId);
  if (!design) {
    throw new Error(`DESIGN_NOT_FOUND: Saved design '${designId}' does not exist.`);
  }

  if (
    requestingUser.role !== "admin" &&
    requestingUser.id !== "00000000-0000-0000-0000-000000000099" &&
    design.customerId !== requestingUser.id
  ) {
    throw new Error("SECURITY_VIOLATION: Cannot reorder from a design belonging to another customer.");
  }

  const quantity = overrideQuantity && overrideQuantity > 0 ? overrideQuantity : design.defaultQuantity;

  const pricingReq: PricingRequest = {
    productSlug: design.productSlug,
    widthMm: design.widthMm,
    heightMm: design.heightMm,
    quantity,
    materialCode: design.materialCode,
    finishCode: design.finishCode,
    cutTypeCode: design.cutTypeCode,
  };

  const calculated = calculatePrice(pricingReq);

  orderCounter++;
  const newOrderNum = `ORD-2026-0${orderCounter}`;
  const newOrderId = `c1000000-0000-0000-0000-${String(orderCounter).padStart(12, "0")}`;

  const newOrder: StoredOrder = {
    id: newOrderId,
    orderNumber: newOrderNum,
    customerId: requestingUser.id,
    customerName: requestingUser.fullName,
    customerEmail: requestingUser.email,
    stage: "ORDER",
    status: "PAID",
    productSlug: design.productSlug,
    productName: design.productName,
    divisionSlug: calculated.product.divisionSlug,
    divisionName: design.divisionName,
    specsSummary: `${design.name} • ${design.widthMm}x${design.heightMm}mm • ${quantity} units`,
    dimensions: {
      widthMm: design.widthMm,
      heightMm: design.heightMm,
    },
    quantity,
    selectedParameters: {
      material: calculated.selectedParameters.material,
      finish: calculated.selectedParameters.finish,
      cutType: calculated.selectedParameters.cutType,
    },
    pricing: {
      unitPriceCents: calculated.breakdown.unitPriceCents,
      subtotalCents: calculated.breakdown.subtotalCents,
      discountCents: calculated.breakdown.discountSavingsCents,
      vatCents: calculated.breakdown.vatCents,
      totalCents: calculated.breakdown.totalCents,
      currency: "GBP",
    },
    shippingAddress: {
      recipientName: requestingUser.fullName,
      addressLine1: "14 Foundry Lane",
      city: "Sheffield",
      postcode: "S3 8HQ",
      country: "United Kingdom",
    },
    paymentDetails: {
      provider: "stripe_simulated",
      sessionId: `cs_test_design_${Date.now()}`,
      transactionId: `ch_test_design_${Math.random().toString(36).substring(2, 9)}`,
      paymentStatus: "paid",
      paidAt: new Date().toISOString(),
      cardBrand: "visa",
      cardLast4: "4242",
    },
    designId: design.id,
    proofVersion: "v1",
    isProofApproved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  ORDERS_STORE.unshift(newOrder);

  // Initialize fresh proof slot
  const proofState: OrderProofState = {
    orderId: newOrderId,
    orderNumber: newOrderNum,
    customerId: requestingUser.id,
    customerName: requestingUser.fullName,
    productName: newOrder.productName,
    dimensions: `${design.widthMm} x ${design.heightMm} mm (3mm Bleed)`,
    currentVersion: 1,
    isUnlockedForProduction: false,
    revisions: [
      {
        id: `pr-${newOrderNum.replace(/[^a-zA-Z0-9]/g, "")}-1`,
        orderId: newOrderId,
        orderNumber: newOrderNum,
        versionNumber: 1,
        status: "PENDING",
        previewUrl: `/proofs/${newOrderNum}_v1.png`,
        changeNotes: `1-Click order generated from saved template '${design.name}'.`,
        createdAt: new Date().toISOString(),
      },
    ],
  };
  PROOF_STORE[newOrderId] = proofState;

  return newOrder;
}

/**
 * Get customer's saved designs
 */
export function getSavedDesigns(customerId: string): SavedDesignTemplate[] {
  return SAVED_DESIGNS_STORE.filter((d) => d.customerId === customerId);
}

/**
 * Delete a saved design template
 */
export function deleteSavedDesign(designId: string, customerId?: string): boolean {
  const index = SAVED_DESIGNS_STORE.findIndex(
    (d) => d.id === designId && (!customerId || d.customerId === customerId)
  );
  if (index !== -1) {
    SAVED_DESIGNS_STORE.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Authoritative Xero-compatible invoice generator for an order
 */
export function getInvoiceForOrder(
  orderQuery: string,
  requestingUserId?: string,
  isAdmin: boolean = false
): OrderInvoice | null {
  const order = getOrderById(orderQuery, requestingUserId, isAdmin);
  if (!order) return null;

  const invoiceNumber = `INV-${order.orderNumber.replace("ORD-", "")}`;
  const issueDate = order.paymentDetails.paidAt?.split("T")[0] || order.createdAt.split("T")[0];

  return {
    id: `inv-${order.id.slice(0, 12)}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    invoiceNumber,
    customerId: order.customerId,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    companyName: order.shippingAddress.companyName,
    issueDate,
    dueDate: issueDate,
    currency: order.pricing.currency,
    lineItems: [
      {
        description: `${order.productName} — ${order.specsSummary}`,
        quantity: order.quantity,
        unitPriceCents: order.pricing.unitPriceCents,
        discountCents: order.pricing.discountCents,
        netCents: order.pricing.subtotalCents,
        vatRatePercent: 20,
        vatCents: order.pricing.vatCents,
        grossCents: order.pricing.totalCents,
      },
    ],
    subtotalCents: order.pricing.subtotalCents,
    vatCents: order.pricing.vatCents,
    totalCents: order.pricing.totalCents,
    paymentStatus: order.status === "PAID" || order.status === "COMPLETED" ? "PAID" : "PENDING",
    paidAt: order.paymentDetails.paidAt,
    xeroReference: `XERO-ACC-REC-${invoiceNumber}`,
  };
}
