/**
 * Digital Heroes (Level 2) — Internal PDF Invoice Generator
 * 
 * Generates actual downloadable commercial tax invoices in valid PDF 1.4 format.
 * Zero external third-party dependencies.
 */

import type { OrderInvoice } from "./order-store.ts";

function escapePdfString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function generateInvoicePdf(invoice: OrderInvoice): {
  fileName: string;
  pdfString: string;
  pdfBuffer: Buffer;
} {
  const fileName = `INVOICE_${invoice.orderNumber}.pdf`;

  // Standard A4 dimensions in points (72 points per inch)
  const widthPt = 595.28;
  const heightPt = 841.89;

  let stream = "";

  // Background Header Bar (Dark charcoal #13171C)
  stream += "0.075 0.090 0.110 rg\n"; // RGB(19, 23, 28)
  stream += `0 ${heightPt - 90} ${widthPt} 90 re\n`;
  stream += "f\n";

  // Header Title
  stream += "BT\n";
  stream += "/F1 20 Tf\n";
  stream += "1.0 1.0 1.0 rg\n"; // White text
  stream += `40 ${heightPt - 45} Td\n`;
  stream += `(COMMERCIAL TAX INVOICE) Tj\n`;
  stream += "ET\n";

  // Header Subtitle
  stream += "BT\n";
  stream += "/F1 9 Tf\n";
  stream += "0.90 0.40 0.20 rg\n"; // Brand orange #E65A28
  stream += `40 ${heightPt - 62} Td\n`;
  stream += `(DIGITAL HEROES PRINT WORKS &bull; INDUSTRIAL WEB-TO-PRINT) Tj\n`;
  stream += "ET\n";

  // Header Invoice Number Right-Aligned
  stream += "BT\n";
  stream += "/F1 12 Tf\n";
  stream += "1.0 1.0 1.0 rg\n";
  stream += `380 ${heightPt - 45} Td\n`;
  stream += `(${escapePdfString(invoice.invoiceNumber)}) Tj\n`;
  stream += "ET\n";

  stream += "BT\n";
  stream += "/F1 8 Tf\n";
  stream += "0.7 0.7 0.7 rg\n";
  stream += `380 ${heightPt - 62} Td\n`;
  stream += `(Date: ${escapePdfString(invoice.issueDate)} | Status: ${invoice.paymentStatus}) Tj\n`;
  stream += "ET\n";

  // Issuer & Billed To Section
  const topY = heightPt - 130;

  // Issuer Box
  stream += "BT\n";
  stream += "/F1 9 Tf\n";
  stream += "0.5 0.5 0.5 rg\n";
  stream += `40 ${topY} Td\n`;
  stream += `(ISSUER / SELLER) Tj\n`;
  stream += "ET\n";

  stream += "BT\n";
  stream += "/F1 9 Tf\n";
  stream += "0.1 0.1 0.1 rg\n";
  stream += `40 ${topY - 14} Td\n`;
  stream += `(Digital Heroes Print Works Ltd) Tj\n`;
  stream += `0 -12 Td\n`;
  stream += `(Unit 4, Industrial Parkway) Tj\n`;
  stream += `0 -12 Td\n`;
  stream += `(Sheffield, S3 8HQ, United Kingdom) Tj\n`;
  stream += `0 -12 Td\n`;
  stream += `(VAT Registration: GB 941 2026 88) Tj\n`;
  stream += "ET\n";

  // Billed To Box
  stream += "BT\n";
  stream += "/F1 9 Tf\n";
  stream += "0.5 0.5 0.5 rg\n";
  stream += `320 ${topY} Td\n`;
  stream += `(BILLED TO) Tj\n`;
  stream += "ET\n";

  stream += "BT\n";
  stream += "/F1 9 Tf\n";
  stream += "0.1 0.1 0.1 rg\n";
  stream += `320 ${topY - 14} Td\n`;
  stream += `(${escapePdfString(invoice.companyName || invoice.customerName)}) Tj\n`;
  stream += `0 -12 Td\n`;
  stream += `(Contact: ${escapePdfString(invoice.customerName)}) Tj\n`;
  stream += `0 -12 Td\n`;
  stream += `(${escapePdfString(invoice.customerEmail)}) Tj\n`;
  stream += `0 -12 Td\n`;
  stream += `(Order Ref: ${escapePdfString(invoice.orderNumber)}) Tj\n`;
  stream += "ET\n";

  // Divider Line
  stream += "0.8 0.8 0.8 RG\n";
  stream += "1.0 w\n";
  stream += `40 ${topY - 65} m ${widthPt - 40} ${topY - 65} l\n`;
  stream += "S\n";

  // Table Header
  const tableHeaderY = topY - 85;
  stream += "0.95 0.95 0.93 rg\n"; // Light gray table header background
  stream += `40 ${tableHeaderY - 5} ${widthPt - 80} 20 re\n`;
  stream += "f\n";

  stream += "BT\n";
  stream += "/F1 8 Tf\n";
  stream += "0.3 0.3 0.3 rg\n";
  stream += `45 ${tableHeaderY} Td\n`;
  stream += `(DESCRIPTION / SPECIFICATION) Tj\n`;
  stream += `240 0 Td\n`;
  stream += `(QTY) Tj\n`;
  stream += `50 0 Td\n`;
  stream += `(NET SUB) Tj\n`;
  stream += `60 0 Td\n`;
  stream += `(VAT 20%) Tj\n`;
  stream += `65 0 Td\n`;
  stream += `(TOTAL GBP) Tj\n`;
  stream += "ET\n";

  // Line items
  let rowY = tableHeaderY - 26;
  for (const line of invoice.lineItems) {
    const desc = escapePdfString(line.description.slice(0, 48));
    const qty = line.quantity.toLocaleString();
    const net = `£${(line.netCents / 100).toFixed(2)}`;
    const vat = `£${(line.vatCents / 100).toFixed(2)}`;
    const gross = `£${(line.grossCents / 100).toFixed(2)}`;

    stream += "BT\n";
    stream += "/F1 8 Tf\n";
    stream += "0.1 0.1 0.1 rg\n";
    stream += `45 ${rowY} Td\n`;
    stream += `(${desc}) Tj\n`;
    stream += `240 0 Td\n`;
    stream += `(${qty}) Tj\n`;
    stream += `50 0 Td\n`;
    stream += `(${net}) Tj\n`;
    stream += `60 0 Td\n`;
    stream += `(${vat}) Tj\n`;
    stream += `65 0 Td\n`;
    stream += `(${gross}) Tj\n`;
    stream += "ET\n";

    // Row separator line
    stream += "0.9 0.9 0.9 RG\n";
    stream += "0.5 w\n";
    stream += `40 ${rowY - 8} m ${widthPt - 40} ${rowY - 8} l\n`;
    stream += "S\n";

    rowY -= 24;
  }

  // Totals Box
  const totalsY = rowY - 25;

  stream += "BT\n";
  stream += "/F1 9 Tf\n";
  stream += "0.4 0.4 0.4 rg\n";
  stream += `360 ${totalsY} Td\n`;
  stream += `(Net Subtotal:) Tj\n`;
  stream += `90 0 Td\n`;
  stream += `(£${(invoice.subtotalCents / 100).toFixed(2)}) Tj\n`;
  stream += "ET\n";

  stream += "BT\n";
  stream += "/F1 9 Tf\n";
  stream += "0.4 0.4 0.4 rg\n";
  stream += `360 ${totalsY - 16} Td\n`;
  stream += `(UK VAT (20.0%):) Tj\n`;
  stream += `90 0 Td\n`;
  stream += `(£${(invoice.vatCents / 100).toFixed(2)}) Tj\n`;
  stream += "ET\n";

  // Total Highlight Bar
  stream += "0.075 0.090 0.110 rg\n";
  stream += `350 ${totalsY - 45} 200 24 re\n`;
  stream += "f\n";

  stream += "BT\n";
  stream += "/F1 10 Tf\n";
  stream += "1.0 1.0 1.0 rg\n";
  stream += `360 ${totalsY - 37} Td\n`;
  stream += `(TOTAL AMOUNT PAID:) Tj\n`;
  stream += `0.90 0.40 0.20 rg\n`;
  stream += `85 0 Td\n`;
  stream += `(£${(invoice.totalCents / 100).toFixed(2)} GBP) Tj\n`;
  stream += "ET\n";

  // Payment Audit Stamp
  stream += "0.2 0.7 0.3 RG\n";
  stream += "1.5 w\n";
  stream += `40 ${totalsY - 45} 180 50 re\n`;
  stream += "S\n";

  stream += "BT\n";
  stream += "/F1 9 Tf\n";
  stream += "0.15 0.55 0.25 rg\n";
  stream += `50 ${totalsY - 12} Td\n`;
  stream += `(PAID IN FULL - SIMULATED SETTLEMENT) Tj\n`;
  stream += `/F1 7 Tf\n`;
  stream += `0.4 0.4 0.4 rg\n`;
  stream += `0 -12 Td\n`;
  stream += `(Reference: ${escapePdfString(invoice.xeroReference)}) Tj\n`;
  stream += `0 -10 Td\n`;
  stream += `(Settlement: Internal Simulated Gateway) Tj\n`;
  stream += `0 -10 Td\n`;
  stream += `(Timestamp: ${new Date().toISOString().slice(0, 19)}Z) Tj\n`;
  stream += "ET\n";

  // Footer
  stream += "BT\n";
  stream += "/F1 7 Tf\n";
  stream += "0.6 0.6 0.6 rg\n";
  stream += `40 40 Td\n`;
  stream += `(Digital Heroes W2P &bull; Official Computer-Generated Tax Document &bull; Unit 4 Industrial Parkway, Sheffield, UK) Tj\n`;
  stream += "ET\n";

  const streamBytes = Buffer.byteLength(stream, "utf-8");

  // Build full PDF-1.4 structure
  const objects: string[] = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${widthPt.toFixed(2)} ${heightPt.toFixed(2)}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
    `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
    `5 0 obj\n<< /Length ${streamBytes} >>\nstream\n${stream}\nendstream\nendobj\n`,
    `6 0 obj\n<< /Title (Invoice ${invoice.invoiceNumber}) /Creator (Digital Heroes Internal Tax Engine) /CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}Z) >>\nendobj\n`,
  ];

  let pdfString = `%PDF-1.4\n%\xE2\xE3\xCF\xD3\n`;
  const offsets: number[] = [];

  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdfString, "utf-8"));
    pdfString += obj;
  }

  const startXref = Buffer.byteLength(pdfString, "utf-8");
  pdfString += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdfString += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  pdfString += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  const pdfBuffer = Buffer.from(pdfString, "utf-8");
  return { fileName, pdfString, pdfBuffer };
}
