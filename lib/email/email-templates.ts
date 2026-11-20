/**
 * Digital Heroes (Level 2) — Boutique-Industrial Transactional Email Templates
 * 
 * Generates both semantic responsive HTML and clean plaintext variants
 * for all five core lifecycle alert types:
 * 1. QUOTE_SUBMITTED
 * 2. ORDER_CONFIRMED
 * 3. PROOF_READY_FOR_REVIEW
 * 4. PROOF_APPROVED
 * 5. JOB_COMPLETED_DISPATCHED
 */

export type EmailEventType =
  | "QUOTE_SUBMITTED"
  | "ORDER_CONFIRMED"
  | "PROOF_READY_FOR_REVIEW"
  | "PROOF_APPROVED"
  | "JOB_COMPLETED_DISPATCHED";

export interface QuoteSubmittedData {
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  divisionName: string;
  productName: string;
  specsSummary: string;
  dimensionsMm: { width: number; height: number };
  quantity: number;
  estimatedPriceCents?: number;
  customerNotes?: string;
  targetResponseHours: number;
}

export interface OrderConfirmedData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  divisionName: string;
  productName: string;
  specsSummary: string;
  quantity: number;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  shippingAddress: {
    recipientName: string;
    addressLine1: string;
    city: string;
    postcode: string;
  };
  estimatedDispatchDays: number;
}

export interface ProofReadyData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  proofVersion: string;
  reviewUrl: string;
  thumbnailUrl?: string;
  specsSummary: string;
  changeRequestDeadlineHours: number;
}

export interface ProofApprovedData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  proofVersion: string;
  digitalSignatureHash: string;
  approvedAt: string;
  machineAllocationName: string;
}

export interface JobCompletedData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  quantity: number;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  invoiceDownloadUrl: string;
  dispatchedAt: string;
}

export type EmailTemplateData =
  | { type: "QUOTE_SUBMITTED"; data: QuoteSubmittedData }
  | { type: "ORDER_CONFIRMED"; data: OrderConfirmedData }
  | { type: "PROOF_READY_FOR_REVIEW"; data: ProofReadyData }
  | { type: "PROOF_APPROVED"; data: ProofApprovedData }
  | { type: "JOB_COMPLETED_DISPATCHED"; data: JobCompletedData };

function formatCurrency(cents: number): string {
  return `£${(cents / 100).toFixed(2)}`;
}

/**
 * Base email layout wrapper with boutique-industrial aesthetic
 */
function wrapIndustrialHtml(options: {
  title: string;
  badge: string;
  badgeColor?: string;
  preheader: string;
  contentHtml: string;
  actionButton?: { label: string; url: string };
}): string {
  const badgeBg = options.badgeColor || "#f97316";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b1120;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      background-color: #0b1120;
      padding: 40px 16px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 4px;
      overflow: hidden;
    }
    .header {
      background-color: #0f172a;
      border-bottom: 2px solid ${badgeBg};
      padding: 24px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #ffffff;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 11px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #94a3b8;
      letter-spacing: 0.05em;
      margin-top: 4px;
    }
    .badge {
      display: inline-block;
      background-color: ${badgeBg};
      color: #0f172a;
      font-size: 11px;
      font-weight: 700;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      padding: 4px 10px;
      border-radius: 2px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .content {
      padding: 32px;
    }
    .h1 {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .p {
      color: #cbd5e1;
      font-size: 14px;
      margin-bottom: 20px;
    }
    .specs-box {
      background-color: #0f172a;
      border: 1px solid #334155;
      border-left: 4px solid ${badgeBg};
      border-radius: 2px;
      padding: 16px;
      margin: 20px 0;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin: 16px 0;
    }
    .table th {
      text-align: left;
      padding: 8px 12px;
      background-color: #0f172a;
      color: #94a3b8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      border-bottom: 1px solid #334155;
      font-size: 11px;
      text-transform: uppercase;
    }
    .table td {
      padding: 10px 12px;
      border-bottom: 1px solid #334155;
      color: #e2e8f0;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0 24px 0;
    }
    .btn {
      display: inline-block;
      background-color: ${badgeBg};
      color: #0f172a !important;
      font-size: 14px;
      font-weight: 700;
      padding: 14px 28px;
      border-radius: 2px;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .footer {
      background-color: #0f172a;
      border-top: 1px solid #334155;
      padding: 24px 32px;
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
    }
    .footer a {
      color: #94a3b8;
      text-decoration: underline;
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${options.preheader}
  </div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div>
          <div class="brand-title">Digital Heroes</div>
          <div class="brand-sub">INDUSTRIAL PRINTWORKS // PREPRESS OPERATIONS</div>
        </div>
        <div class="badge">${options.badge}</div>
      </div>
      <div class="content">
        ${options.contentHtml}
        ${
          options.actionButton
            ? `<div class="btn-container">
                 <a href="${options.actionButton.url}" class="btn">${options.actionButton.label}</a>
               </div>`
            : ""
        }
      </div>
      <div class="footer">
        <p><strong>Digital Heroes Factory Operations</strong> &bull; Unit 4, Olympic Industrial Way, Sheffield S9 2PR, UK</p>
        <p>VAT Registration: GB 394 8291 04 &bull; Registered in England & Wales #14285710</p>
        <p>This automated transactional alert is sent regarding your active manufacturing contract. Production files remain locked until formal customer proof approval.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 1. QUOTE_SUBMITTED Template
 */
export function renderQuoteSubmitted(data: QuoteSubmittedData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `[Digital Heroes] Quote Request Received: ${data.quoteNumber} - ${data.productName}`;
  const preheader = `Your bespoke print quote ${data.quoteNumber} is being reviewed by our prepress engineering team.`;

  const contentHtml = `
    <h1 class="h1">Custom Quote Specification Logged</h1>
    <p class="p">Dear ${data.customerName},</p>
    <p class="p">We have received your custom manufacturing inquiry. Our prepress estimation team has queued your specifications for technical review and pricing verification.</p>
    
    <div class="specs-box">
      <table style="width:100%; border:none; font-size:13px; color:#cbd5e1;">
        <tr><td style="width:140px; color:#94a3b8;" class="mono">QUOTE REF:</td><td class="mono" style="font-weight:700; color:#f97316;">${data.quoteNumber}</td></tr>
        <tr><td style="color:#94a3b8;" class="mono">DIVISION:</td><td>${data.divisionName}</td></tr>
        <tr><td style="color:#94a3b8;" class="mono">PRODUCT:</td><td><strong>${data.productName}</strong></td></tr>
        <tr><td style="color:#94a3b8;" class="mono">DIMENSIONS:</td><td>${data.dimensionsMm.width}mm &times; ${data.dimensionsMm.height}mm</td></tr>
        <tr><td style="color:#94a3b8;" class="mono">QUANTITY:</td><td>${data.quantity.toLocaleString()} units</td></tr>
        <tr><td style="color:#94a3b8;" class="mono">SPECIFICATION:</td><td>${data.specsSummary}</td></tr>
        ${data.estimatedPriceCents ? `<tr><td style="color:#94a3b8;" class="mono">ESTIMATED RANGE:</td><td class="mono" style="font-weight:700; color:#38bdf8;">~${formatCurrency(data.estimatedPriceCents)} + VAT</td></tr>` : ""}
        ${data.customerNotes ? `<tr><td style="color:#94a3b8;" class="mono">CLIENT NOTES:</td><td>${data.customerNotes}</td></tr>` : ""}
      </table>
    </div>

    <p class="p"><strong>Target Response SLA:</strong> We respond to all trade inquiries within <strong>${data.targetResponseHours} business hours</strong>. Once approved, you will receive an invitation to configure your artwork or review your initial PDF proof.</p>
  `;

  const html = wrapIndustrialHtml({
    title: subject,
    badge: "QUOTE SUBMITTED",
    badgeColor: "#38bdf8",
    preheader,
    contentHtml,
    actionButton: {
      label: "View Quote in Customer Portal",
      url: `https://digitalheroes.demo/customer/dashboard?tab=quotes&ref=${data.quoteNumber}`,
    },
  });

  const text = `
DIGITAL HEROES // INDUSTRIAL PRINTWORKS
QUOTE SPECIFICATION RECEIVED: ${data.quoteNumber}
--------------------------------------------------
Dear ${data.customerName},

We have received your custom manufacturing inquiry. Our prepress team is reviewing your requirements:

- Quote Ref: ${data.quoteNumber}
- Product: ${data.productName} (${data.divisionName})
- Dimensions: ${data.dimensionsMm.width}mm x ${data.dimensionsMm.height}mm
- Quantity: ${data.quantity.toLocaleString()} units
- Specifications: ${data.specsSummary}
${data.estimatedPriceCents ? `- Estimated Subtotal: ~${formatCurrency(data.estimatedPriceCents)} + VAT\n` : ""}
Target Response SLA: Within ${data.targetResponseHours} business hours.

View online: https://digitalheroes.demo/customer/dashboard?tab=quotes&ref=${data.quoteNumber}

Unit 4, Olympic Industrial Way, Sheffield S9 2PR
VAT: GB 394 8291 04
`.trim();

  return { subject, html, text };
}

/**
 * 2. ORDER_CONFIRMED Template
 */
export function renderOrderConfirmed(data: OrderConfirmedData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `[Digital Heroes] Order Confirmed: ${data.orderNumber} - Prepress Queued`;
  const preheader = `Payment confirmed for order ${data.orderNumber}. Your job has entered prepress validation.`;

  const contentHtml = `
    <h1 class="h1">Order &amp; Payment Confirmed</h1>
    <p class="p">Dear ${data.customerName},</p>
    <p class="p">Thank you for your order. Payment of <strong>${formatCurrency(data.totalCents)}</strong> (incl. 20% UK VAT) has been received. Your production files are now undergoing automated preflight inspection.</p>

    <div class="specs-box">
      <table style="width:100%; border:none; font-size:13px; color:#cbd5e1;">
        <tr><td style="width:140px; color:#94a3b8;" class="mono">ORDER NUMBER:</td><td class="mono" style="font-weight:700; color:#22c55e;">${data.orderNumber}</td></tr>
        <tr><td style="color:#94a3b8;" class="mono">MANUFACTURING:</td><td>${data.divisionName} &bull; ${data.productName}</td></tr>
        <tr><td style="color:#94a3b8;" class="mono">SPECIFICATION:</td><td>${data.specsSummary}</td></tr>
        <tr><td style="color:#94a3b8;" class="mono">QUANTITY:</td><td>${data.quantity.toLocaleString()} units</td></tr>
        <tr><td style="color:#94a3b8;" class="mono">EST. DISPATCH:</td><td>Within ${data.estimatedDispatchDays} business days upon proof sign-off</td></tr>
      </table>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Item / Breakdown</th>
          <th style="text-align:right;">Amount (GBP)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${data.productName} &times; ${data.quantity}</td>
          <td style="text-align:right;" class="mono">${formatCurrency(data.subtotalCents)}</td>
        </tr>
        <tr>
          <td>UK VAT (20.0%)</td>
          <td style="text-align:right;" class="mono">${formatCurrency(data.vatCents)}</td>
        </tr>
        <tr style="font-weight:700; background-color:#0f172a;">
          <td style="color:#ffffff;">Total Paid (BACS / Card)</td>
          <td style="text-align:right; color:#22c55e;" class="mono">${formatCurrency(data.totalCents)}</td>
        </tr>
      </tbody>
    </table>

    <p class="p" style="font-size:13px; color:#94a3b8;"><strong>Delivery Destination:</strong> ${data.shippingAddress.recipientName}, ${data.shippingAddress.addressLine1}, ${data.shippingAddress.city} ${data.shippingAddress.postcode}</p>
    <p class="p" style="margin-top:16px;"><strong>Next Prepress Step:</strong> You will receive a notification when your <strong>PDF Proof (v1)</strong> is generated. Production will strictly commence upon your digital sign-off.</p>
  `;

  const html = wrapIndustrialHtml({
    title: subject,
    badge: "ORDER CONFIRMED",
    badgeColor: "#22c55e",
    preheader,
    contentHtml,
    actionButton: {
      label: "Track Prepress & Order Progress",
      url: `https://digitalheroes.demo/customer/dashboard?order=${data.orderNumber}`,
    },
  });

  const text = `
DIGITAL HEROES // INDUSTRIAL PRINTWORKS
ORDER CONFIRMED: ${data.orderNumber}
--------------------------------------------------
Dear ${data.customerName},

Payment of ${formatCurrency(data.totalCents)} (incl. 20% VAT) has been confirmed.

Order Summary:
- Order Number: ${data.orderNumber}
- Product: ${data.productName} (${data.divisionName})
- Quantity: ${data.quantity.toLocaleString()} units
- Net Subtotal: ${formatCurrency(data.subtotalCents)}
- 20% UK VAT: ${formatCurrency(data.vatCents)}
- Total Paid: ${formatCurrency(data.totalCents)}
- Delivery To: ${data.shippingAddress.recipientName}, ${data.shippingAddress.addressLine1}, ${data.shippingAddress.city} ${data.shippingAddress.postcode}

Next Step: Your digital proof is being compiled. You will receive an email once v1 is ready for approval.

Track Order: https://digitalheroes.demo/customer/dashboard?order=${data.orderNumber}

Unit 4, Olympic Industrial Way, Sheffield S9 2PR
VAT: GB 394 8291 04
`.trim();

  return { subject, html, text };
}

/**
 * 3. PROOF_READY_FOR_REVIEW Template
 */
export function renderProofReady(data: ProofReadyData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `[Digital Heroes] Action Required: Proof ${data.proofVersion} Ready for Review - ${data.orderNumber}`;
  const preheader = `Your digital print proof ${data.proofVersion} for order ${data.orderNumber} is ready. Production is on hold pending your sign-off.`;

  const contentHtml = `
    <h1 class="h1">Action Required: Digital Proof (${data.proofVersion}) Ready</h1>
    <p class="p">Dear ${data.customerName},</p>
    <p class="p">Our prepress engine has rendered your digital proof. <strong>Production files remain strictly locked</strong> on our servers until you inspect and officially approve this revision.</p>

    <div class="specs-box" style="border-left-color: #f59e0b;">
      <table style="width:100%; border:none; font-size:13px; color:#cbd5e1;">
        <tr><td style="width:140px; color:#94a3b8;" class="mono">ORDER NUMBER:</td><td class="mono" style="font-weight:700;">${data.orderNumber}</td></tr>
        <tr><td style="color:#94a3b8;" class="mono">PROOF REVISION:</td><td class="mono" style="font-weight:700; color:#f59e0b;">${data.proofVersion}</td></tr>
        <tr><td style="color:#94a3b8;" class="mono">PRODUCT:</td><td>${data.productName}</td></tr>
        <tr><td style="color:#94a3b8;" class="mono">SPECIFICATION:</td><td>${data.specsSummary}</td></tr>
        <tr><td style="color:#94a3b8;" class="mono">GATE STATUS:</td><td style="color:#ef4444;" class="mono">LOCKED (Pending Sign-Off)</td></tr>
      </table>
    </div>

    <p class="p"><strong>What to check on your proof:</strong></p>
    <ul style="color:#cbd5e1; font-size:13px; line-height:1.6; padding-left:20px;">
      <li><strong>Spelling &amp; Typography:</strong> Check all phone numbers, URLs, bib names, and titles.</li>
      <li><strong>Bleed &amp; Trim Bounds:</strong> Ensure artwork extends through the 3mm bleed margin and important elements stay within the safe zone.</li>
      <li><strong>Cut Lines:</strong> Verify that the contour cut / perforation aligns with your intended shape.</li>
    </ul>

    <p class="p" style="font-size:12px; color:#94a3b8;">If adjustments are required, you may submit change instructions directly in the portal. A revised proof (v2) will be generated at no additional charge.</p>
  `;

  const html = wrapIndustrialHtml({
    title: subject,
    badge: `PROOF ${data.proofVersion} AWAITING APPROVAL`,
    badgeColor: "#f59e0b",
    preheader,
    contentHtml,
    actionButton: {
      label: `Review & Approve Proof ${data.proofVersion}`,
      url: data.reviewUrl,
    },
  });

  const text = `
DIGITAL HEROES // INDUSTRIAL PRINTWORKS
ACTION REQUIRED: PROOF ${data.proofVersion} READY FOR REVIEW
--------------------------------------------------
Order: ${data.orderNumber}
Product: ${data.productName}
Revision: ${data.proofVersion}
Status: PRODUCTION GATE LOCKED

Dear ${data.customerName},

Your digital proof (${data.proofVersion}) is ready for review. Production files cannot be released to our print lines until you review and officially sign off on this proof.

Review your proof online: ${data.reviewUrl}

Please verify:
1. Spelling and contact numbers
2. Bleed (3mm) and safety margins
3. Cut lines and contour orientation

You can approve the proof or submit change instructions directly through the review portal.

Unit 4, Olympic Industrial Way, Sheffield S9 2PR
VAT: GB 394 8291 04
`.trim();

  return { subject, html, text };
}

/**
 * 4. PROOF_APPROVED Template
 */
export function renderProofApproved(data: ProofApprovedData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `[Digital Heroes] Proof ${data.proofVersion} Approved: ${data.orderNumber} - Production Unlocked`;
  const preheader = `Proof sign-off registered for ${data.orderNumber}. Production files unlocked and allocated to machinery.`;

  const contentHtml = `
    <h1 class="h1">Proof Approved &bull; Production Unlocked</h1>
    <p class="p">Dear ${data.customerName},</p>
    <p class="p">We have officially recorded your digital approval for <strong>Proof ${data.proofVersion}</strong>. The server-authoritative production gate has released your high-resolution print files to our manufacturing pipeline.</p>

    <div class="specs-box" style="border-left-color: #10b981;">
      <table style="width:100%; border:none; font-size:13px; color:#cbd5e1;">
        <tr><td style="width:160px; color:#94a3b8;" class="mono">ORDER NUMBER:</td><td class="mono" style="font-weight:700;">${data.orderNumber}</td></tr>
        <tr><td style="color:#94a3b8;" class="mono">APPROVED VERSION:</td><td class="mono" style="font-weight:700; color:#10b981;">${data.proofVersion}</td></tr>
        <tr><td style="color:#94a3b8;" class="mono">APPROVED TIMESTAMP:</td><td class="mono">${new Date(data.approvedAt).toUTCString()}</td></tr>
        <tr><td style="color:#94a3b8;" class="mono">DIGITAL SIGNATURE:</td><td class="mono" style="font-size:11px; word-break:break-all; color:#38bdf8;">${data.digitalSignatureHash}</td></tr>
        <tr><td style="color:#94a3b8;" class="mono">FACTORY LINE:</td><td class="mono" style="color:#ffffff;">${data.machineAllocationName}</td></tr>
      </table>
    </div>

    <p class="p">Our operators have scheduled your print run. Once finishing, quality inspection, and packing are complete, you will receive a final dispatch alert containing your consignment tracking number.</p>
  `;

  const html = wrapIndustrialHtml({
    title: subject,
    badge: "PROOF APPROVED &bull; IN PRODUCTION",
    badgeColor: "#10b981",
    preheader,
    contentHtml,
    actionButton: {
      label: "View Live Production Status",
      url: `https://digitalheroes.demo/customer/dashboard?order=${data.orderNumber}`,
    },
  });

  const text = `
DIGITAL HEROES // INDUSTRIAL PRINTWORKS
PROOF APPROVED - PRODUCTION FILES RELEASED
--------------------------------------------------
Order: ${data.orderNumber}
Product: ${data.productName}
Approved Version: ${data.proofVersion}
Signature Hash: ${data.digitalSignatureHash}
Timestamp: ${data.approvedAt}
Allocated Machine: ${data.machineAllocationName}

Dear ${data.customerName},

Your digital approval has been verified and logged. Production files have been unlocked and dispatched to our factory floor.

Track Live Pipeline: https://digitalheroes.demo/customer/dashboard?order=${data.orderNumber}

Unit 4, Olympic Industrial Way, Sheffield S9 2PR
VAT: GB 394 8291 04
`.trim();

  return { subject, html, text };
}

/**
 * 5. JOB_COMPLETED_DISPATCHED Template
 */
export function renderJobCompleted(data: JobCompletedData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `[Digital Heroes] Dispatched: Order ${data.orderNumber} is on its way!`;
  const preheader = `Your order ${data.orderNumber} has passed quality inspection and dispatched via ${data.carrier}.`;

  const contentHtml = `
    <h1 class="h1">Manufacture Complete &bull; Dispatched</h1>
    <p class="p">Dear ${data.customerName},</p>
    <p class="p">Great news! Your print job has successfully passed final quality control, precision guillotine/laser trimming, and packaging. It has been handed over to <strong>${data.carrier}</strong>.</p>

    <div class="specs-box" style="border-left-color: #6366f1;">
      <table style="width:100%; border:none; font-size:13px; color:#cbd5e1;">
        <tr><td style="width:140px; color:#94a3b8;" class="mono">ORDER NUMBER:</td><td class="mono" style="font-weight:700;">${data.orderNumber}</td></tr>
        <tr><td style="color:#94a3b8;" class="mono">ITEM:</td><td>${data.productName} &times; ${data.quantity.toLocaleString()} units</td></tr>
        <tr><td style="color:#94a3b8;" class="mono">COURIER:</td><td><strong>${data.carrier}</strong></td></tr>
        <tr><td style="color:#94a3b8;" class="mono">CONSIGNMENT REF:</td><td class="mono" style="font-weight:700; color:#6366f1;">${data.trackingNumber}</td></tr>
        <tr><td style="color:#94a3b8;" class="mono">DISPATCH DATE:</td><td class="mono">${new Date(data.dispatchedAt).toUTCString()}</td></tr>
      </table>
    </div>

    <p class="p">You can track your package online or download your official VAT commercial tax invoice at any time.</p>

    <div style="background-color:#0f172a; padding:16px; border:1px dashed #334155; margin:20px 0; text-align:center;">
      <p style="margin:0 0 8px 0; font-size:13px; color:#cbd5e1;">Need to reorder this exact approved artwork in the future?</p>
      <a href="https://digitalheroes.demo/customer/dashboard?reorder=${data.orderNumber}" style="color:#f97316; font-weight:700; font-size:13px; text-decoration:none;">&rarr; 1-Click Reorder from Saved Designs</a>
    </div>
  `;

  const html = wrapIndustrialHtml({
    title: subject,
    badge: "DISPATCHED // EN ROUTE",
    badgeColor: "#6366f1",
    preheader,
    contentHtml,
    actionButton: {
      label: `Track Consignment (${data.carrier})`,
      url: data.trackingUrl,
    },
  });

  const text = `
DIGITAL HEROES // INDUSTRIAL PRINTWORKS
JOB COMPLETED & DISPATCHED: ${data.orderNumber}
--------------------------------------------------
Order: ${data.orderNumber}
Product: ${data.productName} (${data.quantity.toLocaleString()} units)
Carrier: ${data.carrier}
Tracking Reference: ${data.trackingNumber}
Dispatched At: ${data.dispatchedAt}

Dear ${data.customerName},

Your print order has completed production and is en route.

Track delivery: ${data.trackingUrl}
Download VAT Invoice: ${data.invoiceDownloadUrl}
1-Click Reorder: https://digitalheroes.demo/customer/dashboard?reorder=${data.orderNumber}

Thank you for manufacturing with Digital Heroes.

Unit 4, Olympic Industrial Way, Sheffield S9 2PR
VAT: GB 394 8291 04
`.trim();

  return { subject, html, text };
}
