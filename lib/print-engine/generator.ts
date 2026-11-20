import { checkProductionFileUnlockGate, findProofState } from "../proofs/proof-engine.ts";
import { getOrderById } from "../orders/order-store.ts";
import { getDivisionProductionSpec } from "./specs.ts";

export interface PrintFileOptions {
  resolutionDpi: number; // 300 DPI standard
  bleedMm: number;        // 3.0 mm standard
  slugMarginMm: number;   // 10.0 mm prepress margin for crop marks & slug
  includeCutContour: boolean; // Spot color magenta cutline for optical cutter
  includeCropMarks: boolean;  // Prepress corner trim marks
  includeColorBars: boolean;  // 100/75/50/25% CMYK calibration swatches
  includeSlug: boolean;       // Job information metadata slug
  colorProfile: string;       // "ISO Coated v2 (ECI) / FOGRA39"
}

export const DEFAULT_PRINT_OPTIONS: PrintFileOptions = {
  resolutionDpi: 300,
  bleedMm: 3.0,
  slugMarginMm: 10.0,
  includeCutContour: true,
  includeCropMarks: true,
  includeColorBars: true,
  includeSlug: true,
  colorProfile: "CMYK (ISO Coated v2 / FOGRA39)",
};

export interface PrintFileResult {
  orderId: string;
  orderNumber: string;
  fileName: string;
  storagePath: string;
  fileSizeBytes: number;
  pdfContent: string; // Valid %PDF-1.4 stream
  prepressSummary: {
    dimensionsCutMm: { width: number; height: number };
    dimensionsBleedMm: { width: number; height: number };
    dimensionsMediaBoxPt: { width: number; height: number };
    resolutionDpi: number;
    bleedMm: number;
    colorProfile: string;
    spotSeparations: string[];
    equipmentProfile: string;
    digitalSignatureHash?: string;
  };
  generatedAt: string;
}

// PostScript conversion constants
const MM_TO_POINTS = 72 / 25.4; // ~2.834645669
const MM_TO_PX_300DPI = 300 / 25.4; // ~11.81102362

export function mmToPoints(mm: number): number {
  return Number((mm * MM_TO_POINTS).toFixed(3));
}

export function mmToPixels300Dpi(mm: number): number {
  return Math.round(mm * MM_TO_PX_300DPI);
}

/**
 * Server-Side Authoritative Print-File Generation
 * 
 * Strict Prepress Rule:
 * Must verify the digital proof approval gate before generating or releasing
 * production print files. Throws APPROVAL_GATE_LOCKED if unapproved.
 */
export function generateProductionPrintFile(
  orderId: string,
  staffUser?: { id: string; role: string },
  customOptions?: Partial<PrintFileOptions>
): PrintFileResult {
  // 1. Authoritative Approval Gate Enforcement
  const gate = checkProductionFileUnlockGate(orderId);
  if (!gate.isUnlocked) {
    throw new Error(`APPROVAL_GATE_LOCKED: Cannot generate production print file. ${gate.reason}`);
  }

  // 2. Fetch Order & Proof State
  const proofState = findProofState(orderId);
  const storedOrder = getOrderById(orderId, undefined, true);

  const orderNum = proofState?.orderNumber || storedOrder?.orderNumber || orderId;
  const productName = proofState?.productName || storedOrder?.productName || "Custom Print Job";
  const cutWidthMm = storedOrder?.dimensions.widthMm || 75;
  const cutHeightMm = storedOrder?.dimensions.heightMm || 50;

  const activeRevision = proofState?.revisions.find((r) => r.versionNumber === proofState.currentVersion) ||
    proofState?.revisions[proofState.revisions.length - 1];

  const divisionSlug = storedOrder?.divisionSlug || "labels";
  const divisionSpec = getDivisionProductionSpec(divisionSlug);
  const opts: PrintFileOptions = {
    ...DEFAULT_PRINT_OPTIONS,
    bleedMm: divisionSpec.defaultBleedMm,
    resolutionDpi: divisionSpec.resolutionDpi,
    colorProfile: divisionSpec.colorMode,
    ...customOptions,
  };

  // 3. Prepress Geometry Calculations
  const bleedMm = opts.bleedMm;
  const slugMm = opts.slugMarginMm;

  const bleedWidthMm = cutWidthMm + 2 * bleedMm;
  const bleedHeightMm = cutHeightMm + 2 * bleedMm;

  const totalWidthMm = cutWidthMm + 2 * (bleedMm + slugMm);
  const totalHeightMm = cutHeightMm + 2 * (bleedMm + slugMm);

  // PostScript Points
  const mediaBoxW = mmToPoints(totalWidthMm);
  const mediaBoxH = mmToPoints(totalHeightMm);

  const slugPt = mmToPoints(slugMm);
  const bleedPt = mmToPoints(bleedMm);

  const trimLeft = slugPt + bleedPt;
  const trimBottom = slugPt + bleedPt;
  const trimW = mmToPoints(cutWidthMm);
  const trimH = mmToPoints(cutHeightMm);
  const trimRight = trimLeft + trimW;
  const trimTop = trimBottom + trimH;

  const bleedLeft = slugPt;
  const bleedBottom = slugPt;
  const bleedW = mmToPoints(bleedWidthMm);
  const bleedH = mmToPoints(bleedHeightMm);
  const bleedRight = bleedLeft + bleedW;
  const bleedTop = bleedBottom + bleedH;

  // Equipment Mapping
  let equipmentProfile = "Roland TrueVIS VG3-640 (ECO-UV Inkjet & Optical Knife)";
  if (productName.toLowerCase().includes("bib") || productName.toLowerCase().includes("race")) {
    equipmentProfile = "Mimaki UJF-3042 MkII UV Flatbed (Tyvek / Synthetic Media)";
  } else if (productName.toLowerCase().includes("troph") || productName.toLowerCase().includes("laser")) {
    equipmentProfile = "Epilog Fusion Pro 36 (CO2 & Fiber Laser 120W)";
  }

  // 4. Construct Valid PDF 1.4 Stream with Vector Geometry
  const now = new Date().toISOString();
  const fileName = `${orderNum}_Production_300DPI_${cutWidthMm}x${cutHeightMm}mm_v${proofState?.currentVersion || 1}.pdf`;

  // Build PDF Stream Content
  let stream = "";

  // 4a. Background Artwork Fill (Extending to BleedBox)
  stream += "% --- Background Bleed Box Fill ---\n";
  stream += "0.96 0.95 0.93 rg\n"; // Neutral substrate tone
  stream += `${bleedLeft} ${bleedBottom} ${bleedW} ${bleedH} re f\n`;

  // 4b. Substrate Inner Graphic
  stream += "% --- Inner Design Area ---\n";
  stream += "0.07 0.09 0.11 rg\n"; // Dark ink
  stream += `${trimLeft + 10} ${trimBottom + 10} ${trimW - 20} ${trimH - 20} re f\n`;

  // Artwork Text
  stream += "BT\n";
  stream += "/F1 14 Tf\n";
  stream += "1 1 1 rg\n"; // White text
  stream += `${trimLeft + 15} ${trimTop - 25} Td\n`;
  stream += `(${productName.replace(/[()]/g, "")}) Tj\n`;
  stream += "ET\n";

  stream += "BT\n";
  stream += "/F1 9 Tf\n";
  stream += "0.90 0.35 0.16 rg\n"; // Terracotta accent
  stream += `${trimLeft + 15} ${trimTop - 40} Td\n`;
  stream += `(DIGITAL HEROES LEVEL 2 FACTORY OUTPUT - 300 DPI) Tj\n`;
  stream += "ET\n";

  // 4c. Safe Zone Guide (Dashed cyan box, 3mm inside cut)
  const safeMarginPt = mmToPoints(3.0);
  stream += "% --- Safe Zone Guide (3mm inner) ---\n";
  stream += "0 0.7 0.7 RG\n"; // Cyan
  stream += "0.5 w [2 2] 0 d\n";
  stream += `${trimLeft + safeMarginPt} ${trimBottom + safeMarginPt} ${trimW - 2 * safeMarginPt} ${trimH - 2 * safeMarginPt} re S\n`;
  stream += "[] 0 d\n"; // Reset dash

  // 4d. CutContour Vector Path (Magenta spot color for cutter)
  if (opts.includeCutContour) {
    stream += "% --- Spot CutContour Layer ---\n";
    stream += "1 0 1 RG\n"; // Magenta #FF00FF
    stream += "0.75 w\n";
    stream += `${trimLeft} ${trimBottom} ${trimW} ${trimH} re S\n`;
  }

  // 4e. Crop Marks (Corner Trim Lines extending into slug)
  if (opts.includeCropMarks) {
    const markLengthPt = mmToPoints(4.0);
    const markOffsetPt = mmToPoints(1.5);
    stream += "% --- Prepress Corner Crop Marks ---\n";
    stream += "0 0 0 RG\n"; // 100% Registration Black
    stream += "0.5 w\n";

    // Bottom-Left
    stream += `${trimLeft} ${trimBottom - markOffsetPt} m ${trimLeft} ${trimBottom - markOffsetPt - markLengthPt} l S\n`;
    stream += `${trimLeft - markOffsetPt} ${trimBottom} m ${trimLeft - markOffsetPt - markLengthPt} ${trimBottom} l S\n`;

    // Bottom-Right
    stream += `${trimRight} ${trimBottom - markOffsetPt} m ${trimRight} ${trimBottom - markOffsetPt - markLengthPt} l S\n`;
    stream += `${trimRight + markOffsetPt} ${trimBottom} m ${trimRight + markOffsetPt + markLengthPt} ${trimBottom} l S\n`;

    // Top-Left
    stream += `${trimLeft} ${trimTop + markOffsetPt} m ${trimLeft} ${trimTop + markOffsetPt + markLengthPt} l S\n`;
    stream += `${trimLeft - markOffsetPt} ${trimTop} m ${trimLeft - markOffsetPt - markLengthPt} ${trimTop} l S\n`;

    // Top-Right
    stream += `${trimRight} ${trimTop + markOffsetPt} m ${trimRight} ${trimTop + markOffsetPt + markLengthPt} l S\n`;
    stream += `${trimRight + markOffsetPt} ${trimTop} m ${trimRight + markOffsetPt + markLengthPt} ${trimTop} l S\n`;
  }

  // 4f. CMYK Calibration Color Bars
  if (opts.includeColorBars) {
    const swatchW = mmToPoints(5.0);
    const swatchH = mmToPoints(3.0);
    const startX = trimLeft;
    const startY = bleedTop + mmToPoints(2.0);

    stream += "% --- CMYK Calibration Color Bars ---\n";
    // Cyan
    stream += `0 0.8 0.8 0 k ${startX} ${startY} ${swatchW} ${swatchH} re f\n`;
    // Magenta
    stream += `0.8 0 0.8 0 k ${startX + swatchW + 2} ${startY} ${swatchW} ${swatchH} re f\n`;
    // Yellow
    stream += `0 0 0.9 0 k ${startX + (swatchW + 2) * 2} ${startY} ${swatchW} ${swatchH} re f\n`;
    // Black
    stream += `0 0 0 1 k ${startX + (swatchW + 2) * 3} ${startY} ${swatchW} ${swatchH} re f\n`;
  }

  // 4g. Job Metadata Slug Text
  if (opts.includeSlug) {
    stream += "% --- Prepress Slug Header ---\n";
    stream += "BT\n";
    stream += "/F1 7 Tf\n";
    stream += "0.2 0.2 0.2 rg\n";
    stream += `${trimLeft} ${bleedTestY(bleedBottom, 5.0)} Td\n`;
    stream += `(JOB: ${orderNum} | SIZE: ${cutWidthMm}x${cutHeightMm}mm | BLEED: ${bleedMm}mm | 300 DPI | PROFILE: FOGRA39 | DATE: ${now.split("T")[0]}) Tj\n`;
    stream += "ET\n";

    if (activeRevision?.digitalSignatureHash) {
      stream += "BT\n";
      stream += "/F1 6 Tf\n";
      stream += "0.4 0.4 0.4 rg\n";
      stream += `${trimLeft} ${bleedTestY(bleedBottom, 8.0)} Td\n`;
      stream += `(SIGNED APPROVAL: ${activeRevision.digitalSignatureHash} by ${activeRevision.approvedBy?.email || "customer"}) Tj\n`;
      stream += "ET\n";
    }
  }

  // Wrap in valid PDF 1.4 Object Structure
  const pdfString = buildPdfDocument({
    mediaBoxW,
    mediaBoxH,
    bleedBox: [bleedLeft, bleedBottom, bleedRight, bleedTop],
    trimBox: [trimLeft, trimBottom, trimRight, trimTop],
    streamContent: stream,
    title: `${orderNum} Production File`,
    creator: "Digital Heroes Level 2 Prepress Engine",
  });

  return {
    orderId,
    orderNumber: orderNum,
    fileName,
    storagePath: `production/${orderNum}/${fileName}`,
    fileSizeBytes: Buffer.byteLength(pdfString, "utf-8"),
    pdfContent: pdfString,
    prepressSummary: {
      dimensionsCutMm: { width: cutWidthMm, height: cutHeightMm },
      dimensionsBleedMm: { width: bleedWidthMm, height: bleedHeightMm },
      dimensionsMediaBoxPt: { width: mediaBoxW, height: mediaBoxH },
      resolutionDpi: opts.resolutionDpi,
      bleedMm: opts.bleedMm,
      colorProfile: opts.colorProfile,
      spotSeparations: opts.includeCutContour ? ["CutContour (Magenta #FF00FF)"] : [],
      equipmentProfile,
      digitalSignatureHash: activeRevision?.digitalSignatureHash,
    },
    generatedAt: now,
  };
}

function bleedTestY(bleedBottom: number, offsetMm: number): number {
  return Math.max(0, bleedBottom - mmToPoints(offsetMm));
}

/**
 * Low-level PDF 1.4 Document Formatter (Pure TypeScript / zero binary dependencies)
 */
function buildPdfDocument(params: {
  mediaBoxW: number;
  mediaBoxH: number;
  bleedBox: [number, number, number, number];
  trimBox: [number, number, number, number];
  streamContent: string;
  title: string;
  creator: string;
}): string {
  const streamBytes = Buffer.byteLength(params.streamContent, "utf-8");

  const objects: string[] = [];

  // Obj 1: Catalog
  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);

  // Obj 2: Pages
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`);

  // Obj 3: Page (with MediaBox, BleedBox, TrimBox)
  const bBox = params.bleedBox.map((n) => n.toFixed(2)).join(" ");
  const tBox = params.trimBox.map((n) => n.toFixed(2)).join(" ");

  objects.push(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${params.mediaBoxW.toFixed(2)} ${params.mediaBoxH.toFixed(2)}] /BleedBox [${bBox}] /TrimBox [${tBox}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  // Obj 4: Standard Helvetica Font
  objects.push(`4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);

  // Obj 5: Stream Content
  objects.push(`5 0 obj\n<< /Length ${streamBytes} >>\nstream\n${params.streamContent}\nendstream\nendobj\n`);

  // Obj 6: Info
  objects.push(
    `6 0 obj\n<< /Title (${params.title}) /Creator (${params.creator}) /CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}Z) >>\nendobj\n`
  );

  // Build XREF & Trailer
  let pdf = `%PDF-1.4\n%\xE2\xE3\xCF\xD3\n`;
  const offsets: number[] = [];

  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf-8"));
    pdf += obj;
  }

  const startXref = Buffer.byteLength(pdf, "utf-8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return pdf;
}
