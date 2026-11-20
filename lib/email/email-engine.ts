/**
 * Digital Heroes (Level 2) — Transactional Email Lifecycle Engine
 * 
 * Provides server-authoritative transactional email delivery,
 * boutique-industrial HTML/text rendering, RFC 5322 CRLF anti-injection sanitization,
 * idempotent deduplication gates, development sandbox outbox tracking,
 * and user in-app notification synchronization.
 */

import type {
  EmailEventType,
  EmailTemplateData,
} from "./email-templates.ts";
import {
  renderQuoteSubmitted,
  renderOrderConfirmed,
  renderProofReady,
  renderProofApproved,
  renderJobCompleted,
} from "./email-templates.ts";

export type { EmailEventType, EmailTemplateData };

export interface EmailRecipient {
  email: string;
  name: string;
  userId?: string;
}

export interface DispatchedEmail {
  id: string;
  eventType: EmailEventType;
  idempotencyKey: string;
  to: string;
  toName: string;
  from: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  status: "SENT" | "DELIVERED" | "BOUNCED" | "QUEUED";
  isDuplicateSuppressed: boolean;
  sentAt: string;
  referenceId: string;
  metadata: Record<string, unknown>;
  resendHistory?: {
    resentAt: string;
    resentBy: string;
  }[];
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType: EmailEventType;
  referenceId: string;
  actionUrl: string;
  readAt: string | null;
  createdAt: string;
}

export interface SendEmailOptions {
  eventType: EmailEventType;
  recipient: EmailRecipient;
  referenceId: string;
  qualifier?: string; // e.g. "v1", "v2", "initial"
  data: EmailTemplateData["data"];
  forceResend?: boolean;
  requestedByStaff?: {
    userId: string;
    fullName: string;
  };
}

export interface SendEmailResult {
  success: boolean;
  email: DispatchedEmail;
  isDuplicateSuppressed: boolean;
  message: string;
}

// Global In-Memory Stores (Persisted during server runtime)
export const DISPATCHED_EMAILS_STORE: DispatchedEmail[] = [];
export const IN_APP_NOTIFICATIONS_STORE: InAppNotification[] = [];

/**
 * Calculates a deterministic idempotency key for deduplication.
 * Format: EVENT_TYPE:REFERENCE_ID:QUALIFIER
 */
export function computeEmailIdempotencyKey(
  eventType: EmailEventType,
  referenceId: string,
  qualifier: string = "initial"
): string {
  const cleanRef = referenceId.trim().toUpperCase();
  const cleanQual = qualifier.trim().toLowerCase();
  return `${eventType}:${cleanRef}:${cleanQual}`;
}

/**
 * Validates and sanitizes email recipient address against CRLF injection attacks.
 */
export function validateRecipientEmail(email: string): string {
  if (!email || typeof email !== "string") {
    throw new Error("INVALID_RECIPIENT: Recipient email address is required.");
  }

  // CRLF injection detection
  if (/[\r\n]/.test(email)) {
    throw new Error(
      "SECURITY_VIOLATION: Email address contains illegal carriage return or newline characters (CRLF Injection Attempt Detected)."
    );
  }

  const trimmed = email.trim();
  // Standard RFC 5322 basic pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(trimmed)) {
    throw new Error(`INVALID_EMAIL_FORMAT: The email address '${email}' is malformed.`);
  }

  return trimmed;
}

/**
 * Render appropriate template based on event type
 */
export function renderEmailContent(
  eventType: EmailEventType,
  data: EmailTemplateData["data"]
): { subject: string; html: string; text: string } {
  switch (eventType) {
    case "QUOTE_SUBMITTED":
      return renderQuoteSubmitted(data as Parameters<typeof renderQuoteSubmitted>[0]);
    case "ORDER_CONFIRMED":
      return renderOrderConfirmed(data as Parameters<typeof renderOrderConfirmed>[0]);
    case "PROOF_READY_FOR_REVIEW":
      return renderProofReady(data as Parameters<typeof renderProofReady>[0]);
    case "PROOF_APPROVED":
      return renderProofApproved(data as Parameters<typeof renderProofApproved>[0]);
    case "JOB_COMPLETED_DISPATCHED":
      return renderJobCompleted(data as Parameters<typeof renderJobCompleted>[0]);
    default:
      throw new Error(`UNKNOWN_EVENT_TYPE: Unsupported email alert type '${eventType}'`);
  }
}

/**
 * Determines primary in-app action URL for a given notification
 */
function getActionUrl(eventType: EmailEventType, referenceId: string): string {
  switch (eventType) {
    case "QUOTE_SUBMITTED":
      return `/customer/dashboard?tab=quotes&ref=${encodeURIComponent(referenceId)}`;
    case "ORDER_CONFIRMED":
    case "PROOF_APPROVED":
    case "JOB_COMPLETED_DISPATCHED":
      return `/customer/dashboard?order=${encodeURIComponent(referenceId)}`;
    case "PROOF_READY_FOR_REVIEW":
      return `/customer/dashboard?order=${encodeURIComponent(referenceId)}&view=proof`;
    default:
      return "/customer/dashboard";
  }
}

/**
 * Primary Server Dispatch Method
 * 
 * 1. Sanitizes inputs
 * 2. Checks Idempotency Gate (prevents double-sending identical event)
 * 3. Renders boutique-industrial responsive HTML + plaintext
 * 4. Dispatches via sandbox transport
 * 5. Syncs to in-app user notifications
 */
export async function sendLifecycleEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const sanitizedEmail = validateRecipientEmail(options.recipient.email);
  const idempotencyKey = computeEmailIdempotencyKey(
    options.eventType,
    options.referenceId,
    options.qualifier
  );

  // Check for prior send with this exact idempotency key
  const existing = DISPATCHED_EMAILS_STORE.find(
    (e) => e.idempotencyKey === idempotencyKey && !e.isDuplicateSuppressed
  );

  if (existing && !options.forceResend) {
    // Idempotency Gate activated: do not resend
    return {
      success: true,
      email: existing,
      isDuplicateSuppressed: true,
      message: `IDEMPOTENT_SUPPRESSION: Email for ${idempotencyKey} has already been transmitted at ${existing.sentAt}. Re-transmission safely prevented.`,
    };
  }

  // Render templates
  const { subject, html, text } = renderEmailContent(options.eventType, options.data);

  const emailRecord: DispatchedEmail = {
    id: `eml_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    eventType: options.eventType,
    idempotencyKey,
    to: sanitizedEmail,
    toName: options.recipient.name,
    from: "Digital Heroes Dispatch <alerts@digitalheroes.co.uk>",
    subject,
    htmlBody: html,
    textBody: text,
    status: "DELIVERED",
    isDuplicateSuppressed: false,
    sentAt: new Date().toISOString(),
    referenceId: options.referenceId,
    metadata: {
      qualifier: options.qualifier || "initial",
      resend: Boolean(options.forceResend),
      requestedByStaff: options.requestedByStaff || null,
      environment: process.env.NODE_ENV || "development_sandbox",
    },
    resendHistory: options.forceResend && options.requestedByStaff
      ? [
          {
            resentAt: new Date().toISOString(),
            resentBy: options.requestedByStaff.fullName,
          },
        ]
      : [],
  };

  // Prepend to top of outbox
  DISPATCHED_EMAILS_STORE.unshift(emailRecord);

  // Sync to In-App User Notifications if user ID is known
  if (options.recipient.userId) {
    const notification: InAppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: options.recipient.userId,
      title: subject.replace("[Digital Heroes] ", ""),
      message: text.split("\n\n")[1] || text.slice(0, 150),
      notificationType: options.eventType,
      referenceId: options.referenceId,
      actionUrl: getActionUrl(options.eventType, options.referenceId),
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    IN_APP_NOTIFICATIONS_STORE.unshift(notification);
  }

  return {
    success: true,
    email: emailRecord,
    isDuplicateSuppressed: false,
    message: `DISPATCHED_SUCCESS: ${options.eventType} alert delivered to ${sanitizedEmail} (Key: ${idempotencyKey}).`,
  };
}

/**
 * Query sandbox email outbox with filtering and search
 */
export function getSandboxOutbox(query?: {
  eventType?: string;
  recipient?: string;
  search?: string;
  status?: string;
}): DispatchedEmail[] {
  let list = [...DISPATCHED_EMAILS_STORE];

  if (query?.eventType && query.eventType !== "ALL") {
    list = list.filter((e) => e.eventType === query.eventType);
  }

  if (query?.recipient) {
    const term = query.recipient.toLowerCase();
    list = list.filter((e) => e.to.toLowerCase().includes(term));
  }

  if (query?.status && query.status !== "ALL") {
    list = list.filter((e) => e.status === query.status);
  }

  if (query?.search) {
    const s = query.search.toLowerCase();
    list = list.filter(
      (e) =>
        e.subject.toLowerCase().includes(s) ||
        e.referenceId.toLowerCase().includes(s) ||
        e.to.toLowerCase().includes(s) ||
        e.toName.toLowerCase().includes(s) ||
        e.idempotencyKey.toLowerCase().includes(s) ||
        e.textBody.toLowerCase().includes(s)
    );
  }

  return list;
}

/**
 * Fetch a single dispatched email by ID
 */
export function getSandboxEmailById(id: string): DispatchedEmail | null {
  return DISPATCHED_EMAILS_STORE.find((e) => e.id === id) || null;
}

/**
 * Resend a previously dispatched email (Staff action)
 */
export function resendSandboxEmail(
  id: string,
  staffUser: { userId: string; fullName: string }
): DispatchedEmail {
  const email = getSandboxEmailById(id);
  if (!email) {
    throw new Error(`NOT_FOUND: Email record '${id}' not found in outbox.`);
  }

  const updated: DispatchedEmail = {
    ...email,
    id: `eml_${Date.now()}_resend`,
    sentAt: new Date().toISOString(),
    status: "DELIVERED",
    resendHistory: [
      ...(email.resendHistory || []),
      {
        resentAt: new Date().toISOString(),
        resentBy: staffUser.fullName,
      },
    ],
  };

  DISPATCHED_EMAILS_STORE.unshift(updated);
  return updated;
}

/**
 * In-App Notification Operations
 */
export function getUserNotifications(userId: string): InAppNotification[] {
  return IN_APP_NOTIFICATIONS_STORE.filter((n) => n.userId === userId);
}

export function markNotificationAsRead(
  notificationId: string,
  userId: string
): InAppNotification {
  const notif = IN_APP_NOTIFICATIONS_STORE.find(
    (n) => n.id === notificationId && n.userId === userId
  );

  if (!notif) {
    throw new Error("NOT_FOUND: Notification does not exist or user lacks access.");
  }

  notif.readAt = new Date().toISOString();
  return notif;
}

export function markAllNotificationsAsRead(userId: string): number {
  let count = 0;
  for (const n of IN_APP_NOTIFICATIONS_STORE) {
    if (n.userId === userId && !n.readAt) {
      n.readAt = new Date().toISOString();
      count++;
    }
  }
  return count;
}

export function getUnreadNotificationCount(userId: string): number {
  return IN_APP_NOTIFICATIONS_STORE.filter((n) => n.userId === userId && !n.readAt).length;
}

// ------------------------------------------------------------------------
// Pre-Seed Initial Demonstration Lifecycle Emails
// ------------------------------------------------------------------------
function seedInitialSandboxOutbox() {
  if (DISPATCHED_EMAILS_STORE.length > 0) return;

  const alexUserId = "00000000-0000-0000-0000-000000000001";
  const jordanUserId = "00000000-0000-0000-0000-000000000002";

  // 1. Order Confirmed for ORD-2026-0891 (Alex Miller)
  const order1 = renderOrderConfirmed({
    orderNumber: "ORD-2026-0891",
    customerName: "Alex Miller (Peak Coffee)",
    customerEmail: "customer@digitalheroes.demo",
    divisionName: "Labels & Stickers",
    productName: "Custom Die-Cut Vinyl Stickers",
    specsSummary: "Standard Vinyl Gloss • 75x50mm • Contour Cut",
    quantity: 250,
    subtotalCents: 15300,
    vatCents: 3060,
    totalCents: 18360,
    shippingAddress: {
      recipientName: "Alex Miller",
      addressLine1: "14 Roastery Lane",
      city: "Sheffield",
      postcode: "S1 2EF",
    },
    estimatedDispatchDays: 3,
  });

  DISPATCHED_EMAILS_STORE.push({
    id: "eml_seed_001",
    eventType: "ORDER_CONFIRMED",
    idempotencyKey: "ORDER_CONFIRMED:ORD-2026-0891:initial",
    to: "customer@digitalheroes.demo",
    toName: "Alex Miller (Peak Coffee)",
    from: "Digital Heroes Dispatch <alerts@digitalheroes.co.uk>",
    subject: order1.subject,
    htmlBody: order1.html,
    textBody: order1.text,
    status: "DELIVERED",
    isDuplicateSuppressed: false,
    sentAt: "2026-03-24T09:30:00.000Z",
    referenceId: "ORD-2026-0891",
    metadata: { environment: "development_sandbox" },
  });

  // 2. Proof Ready for Review v1 for ORD-2026-0891
  const proof1 = renderProofReady({
    orderNumber: "ORD-2026-0891",
    customerName: "Alex Miller",
    customerEmail: "customer@digitalheroes.demo",
    productName: "Custom Die-Cut Vinyl Stickers",
    proofVersion: "v1",
    reviewUrl: "https://digitalheroes.demo/customer/dashboard?order=ORD-2026-0891&view=proof",
    specsSummary: "Standard Vinyl Gloss • 75x50mm • Contour Cut",
    changeRequestDeadlineHours: 24,
  });

  DISPATCHED_EMAILS_STORE.push({
    id: "eml_seed_002",
    eventType: "PROOF_READY_FOR_REVIEW",
    idempotencyKey: "PROOF_READY_FOR_REVIEW:ORD-2026-0891:v1",
    to: "customer@digitalheroes.demo",
    toName: "Alex Miller",
    from: "Digital Heroes Dispatch <alerts@digitalheroes.co.uk>",
    subject: proof1.subject,
    htmlBody: proof1.html,
    textBody: proof1.text,
    status: "DELIVERED",
    isDuplicateSuppressed: false,
    sentAt: "2026-03-24T11:00:00.000Z",
    referenceId: "ORD-2026-0891",
    metadata: { environment: "development_sandbox" },
  });

  // 3. Proof Approved for ORD-2026-0891
  const proofApproved1 = renderProofApproved({
    orderNumber: "ORD-2026-0891",
    customerName: "Alex Miller",
    customerEmail: "customer@digitalheroes.demo",
    productName: "Custom Die-Cut Vinyl Stickers",
    proofVersion: "v1",
    digitalSignatureHash: "9a2f7bc19e09d134ea4390f77243c5b8e91045a2781b0a9cd6e451b6a3782910",
    approvedAt: "2026-03-24T14:15:22.000Z",
    machineAllocationName: "Roland TrueVIS VG3-640 (ECO-UV Inkjet & Cutter)",
  });

  DISPATCHED_EMAILS_STORE.push({
    id: "eml_seed_003",
    eventType: "PROOF_APPROVED",
    idempotencyKey: "PROOF_APPROVED:ORD-2026-0891:v1",
    to: "customer@digitalheroes.demo",
    toName: "Alex Miller",
    from: "Digital Heroes Dispatch <alerts@digitalheroes.co.uk>",
    subject: proofApproved1.subject,
    htmlBody: proofApproved1.html,
    textBody: proofApproved1.text,
    status: "DELIVERED",
    isDuplicateSuppressed: false,
    sentAt: "2026-03-24T14:15:25.000Z",
    referenceId: "ORD-2026-0891",
    metadata: { environment: "development_sandbox" },
  });

  // 4. Quote Submitted for QUO-2026-0042 (Jordan Lee)
  const quote1 = renderQuoteSubmitted({
    quoteNumber: "QUO-2026-0042",
    customerName: "Jordan Lee",
    customerEmail: "customer-b@digitalheroes.demo",
    divisionName: "Laser-Cut Work",
    productName: "Laser-Cut Acrylic Directional Signs",
    specsSummary: "5mm Frosted Matte Acrylic • Flame Polished Edges • 600x400mm",
    dimensionsMm: { width: 600, height: 400 },
    quantity: 12,
    estimatedPriceCents: 38400,
    customerNotes: "Requires four 10mm pre-drilled corner holes for stainless steel standoffs.",
    targetResponseHours: 2,
  });

  DISPATCHED_EMAILS_STORE.push({
    id: "eml_seed_004",
    eventType: "QUOTE_SUBMITTED",
    idempotencyKey: "QUOTE_SUBMITTED:QUO-2026-0042:initial",
    to: "customer-b@digitalheroes.demo",
    toName: "Jordan Lee",
    from: "Digital Heroes Dispatch <alerts@digitalheroes.co.uk>",
    subject: quote1.subject,
    htmlBody: quote1.html,
    textBody: quote1.text,
    status: "DELIVERED",
    isDuplicateSuppressed: false,
    sentAt: "2026-03-24T15:20:00.000Z",
    referenceId: "QUO-2026-0042",
    metadata: { environment: "development_sandbox" },
  });

  // 5. Job Completed & Dispatched for ORD-2026-0894
  const dispatched1 = renderJobCompleted({
    orderNumber: "ORD-2026-0894",
    customerName: "Alex Miller",
    customerEmail: "customer@digitalheroes.demo",
    productName: "Bespoke Acrylic Corporate Award",
    quantity: 5,
    carrier: "DPD UK Tracked Express",
    trackingNumber: "DPD-GB-84920194",
    trackingUrl: "https://www.dpd.co.uk/tracking/DPD-GB-84920194",
    invoiceDownloadUrl: "https://digitalheroes.demo/api/invoices/ord-004",
    dispatchedAt: "2026-03-24T16:45:00.000Z",
  });

  DISPATCHED_EMAILS_STORE.push({
    id: "eml_seed_005",
    eventType: "JOB_COMPLETED_DISPATCHED",
    idempotencyKey: "JOB_COMPLETED_DISPATCHED:ORD-2026-0894:completed",
    to: "customer@digitalheroes.demo",
    toName: "Alex Miller",
    from: "Digital Heroes Dispatch <alerts@digitalheroes.co.uk>",
    subject: dispatched1.subject,
    htmlBody: dispatched1.html,
    textBody: dispatched1.text,
    status: "DELIVERED",
    isDuplicateSuppressed: false,
    sentAt: "2026-03-24T16:45:05.000Z",
    referenceId: "ORD-2026-0894",
    metadata: { environment: "development_sandbox" },
  });

  // Seed matching In-App Notifications for customer Alex Miller
  IN_APP_NOTIFICATIONS_STORE.push(
    {
      id: "notif_seed_001",
      userId: alexUserId,
      title: "Order Confirmed: ORD-2026-0891 - Prepress Queued",
      message: "Payment of £183.60 confirmed. Your artwork has entered automated preflight validation.",
      notificationType: "ORDER_CONFIRMED",
      referenceId: "ORD-2026-0891",
      actionUrl: "/customer/dashboard?order=ORD-2026-0891",
      readAt: "2026-03-24T10:00:00.000Z",
      createdAt: "2026-03-24T09:30:00.000Z",
    },
    {
      id: "notif_seed_002",
      userId: alexUserId,
      title: "Action Required: Proof v1 Ready for Review - ORD-2026-0891",
      message: "Digital proof v1 is ready. Inspect bleed bounds and cut lines before signing off.",
      notificationType: "PROOF_READY_FOR_REVIEW",
      referenceId: "ORD-2026-0891",
      actionUrl: "/customer/dashboard?order=ORD-2026-0891&view=proof",
      readAt: "2026-03-24T14:10:00.000Z",
      createdAt: "2026-03-24T11:00:00.000Z",
    },
    {
      id: "notif_seed_003",
      userId: alexUserId,
      title: "Proof v1 Approved: ORD-2026-0891 - Production Unlocked",
      message: "Digital signature registered. Production files dispatched to Roland VG3-640 press line.",
      notificationType: "PROOF_APPROVED",
      referenceId: "ORD-2026-0891",
      actionUrl: "/customer/dashboard?order=ORD-2026-0891",
      readAt: null, // Unread
      createdAt: "2026-03-24T14:15:25.000Z",
    },
    {
      id: "notif_seed_004",
      userId: alexUserId,
      title: "Dispatched: Order ORD-2026-0894 Has Shipped!",
      message: "Handed over to DPD UK Tracked Express. Consignment ref: DPD-GB-84920194.",
      notificationType: "JOB_COMPLETED_DISPATCHED",
      referenceId: "ORD-2026-0894",
      actionUrl: "/customer/dashboard?order=ORD-2026-0894",
      readAt: null, // Unread
      createdAt: "2026-03-24T16:45:05.000Z",
    },
    {
      id: "notif_seed_005",
      userId: jordanUserId,
      title: "Quote Request Received: QUO-2026-0042",
      message: "Custom Acrylic Directional Signs specification logged. Prepress engineering reviewing SLA.",
      notificationType: "QUOTE_SUBMITTED",
      referenceId: "QUO-2026-0042",
      actionUrl: "/customer/dashboard?tab=quotes&ref=QUO-2026-0042",
      readAt: null, // Unread
      createdAt: "2026-03-24T15:20:00.000Z",
    }
  );
}

// Automatically seed on module load
seedInitialSandboxOutbox();
