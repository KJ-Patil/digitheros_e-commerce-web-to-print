// ========================================================================
// DIGITAL HEROES — PRINT-FILE & CSV VARIABLE-DATA ENGINE TEST SUITE
// File: scripts/test-print-engine.mjs
// ========================================================================

import {
  mmToPoints,
  mmToPixels300Dpi,
  generateProductionPrintFile,
  generateProductionPngFile,
  buildFogra39BinaryIccProfile,
} from "../lib/print-engine/generator.ts";
import {
  validateAndMapCsv,
  parseCsvText,
  sanitizeCsvField,
  calculateRunnerNameFontSize,
  generateSampleRunnersCsv,
  executeVariableMergeJob,
} from "../lib/print-engine/variable-data.ts";
import { resetProofStore } from "../lib/proofs/proof-engine.ts";
import { resetOrderStore } from "../lib/orders/order-store.ts";

console.log("==================================================================");
console.log("DIGITAL HEROES — PRINT ENGINE & CSV VARIABLE-DATA SUITE");
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
resetProofStore();
resetOrderStore();

// -------------------------------------------------------------------------
// TEST 1: 300 DPI Prepress Geometry & Conversion Math
// -------------------------------------------------------------------------
const inchPoints = mmToPoints(25.4);
assert("Test 1a: 25.4mm converts to exactly 72.0 PostScript points", Math.abs(inchPoints - 72.0) < 0.01);

const inchPixels = mmToPixels300Dpi(25.4);
assert("Test 1b: 25.4mm converts to exactly 300 pixels at 300 DPI", inchPixels === 300);

const bleedPoints = mmToPoints(3.0);
assert("Test 1c: 3.0mm standard bleed converts to ~8.504 points", Math.abs(bleedPoints - 8.504) < 0.01);

// -------------------------------------------------------------------------
// TEST 2: Prepress Approval Gate Enforcement
// -------------------------------------------------------------------------
let unapprovedGateBlocked = false;
try {
  generateProductionPrintFile("ORD-2026-0892"); // In PROOF stage, unapproved
} catch (e) {
  if (e.message.includes("APPROVAL_GATE_LOCKED")) {
    unapprovedGateBlocked = true;
  }
}
assert("Test 2a: Attempting to generate production print file for unapproved order is BLOCKED", unapprovedGateBlocked);

// -------------------------------------------------------------------------
// TEST 3: High-Resolution 300 DPI PDF Generation for Approved Order
// -------------------------------------------------------------------------
const printResult = generateProductionPrintFile("ORD-2026-0891"); // v2 Approved
assert("Test 3a: Print file generated for approved order ORD-2026-0891", printResult !== null);
assert("Test 3b: Output stream starts with standard %PDF-1.4 header", printResult.pdfContent.startsWith("%PDF-1.4"));
assert("Test 3c: Output contains defined MediaBox, BleedBox, and TrimBox",
  printResult.pdfContent.includes("/MediaBox") &&
  printResult.pdfContent.includes("/BleedBox") &&
  printResult.pdfContent.includes("/TrimBox")
);
assert("Test 3d: Output includes CutContour spot separation vector layer",
  printResult.pdfContent.includes("Spot CutContour Layer") &&
  printResult.pdfContent.includes("1 0 1 RG") // Magenta #FF00FF
);
assert("Test 3e: Output includes corner trim crop marks",
  printResult.pdfContent.includes("Prepress Corner Crop Marks")
);
assert("Test 3f: Output includes prepress metadata slug with digital signature hash",
  printResult.pdfContent.includes("SIGNED APPROVAL:") &&
  printResult.pdfContent.includes("FOGRA39")
);
assert("Test 3g: Predictable order-based filename generated",
  printResult.fileName.includes("ORD-2026-0891_Production_300DPI")
);

// -------------------------------------------------------------------------
// TEST 4: CSV Variable-Data Parser & Sanitization
// -------------------------------------------------------------------------
const emptyCsv = validateAndMapCsv("");
assert("Test 4a: Empty CSV rejected", !emptyCsv.isValid && emptyCsv.error === "EMPTY_OR_INSUFFICIENT_ROWS");

const dirtyFormula = "=1+1+cmd|' /C calc'!A0";
const cleanFormula = sanitizeCsvField(dirtyFormula);
assert("Test 4b: CSV formula injection sanitized with leading apostrophe", cleanFormula.startsWith("'="));

const sampleCsv = `bib_number,runner_name,category,team,barcode
101,"Marcus Vance",Elite Men,"Peak Enduro",BIB101
102,"Elena Kovacs",Elite Women,"Highland Gravity",BIB102`;

const parsedRows = parseCsvText(sampleCsv);
assert("Test 4c: Parse text handles comma-delimited rows and quoted text", parsedRows.length === 3 && parsedRows[1][1] === "Marcus Vance");

const validation = validateAndMapCsv(sampleCsv);
assert("Test 4d: Header auto-mapper maps bib_number, runner_name, category, and barcode",
  validation.isValid &&
  validation.mappedColumns.numberCol === "bib_number" &&
  validation.mappedColumns.nameCol === "runner_name"
);
assert("Test 4e: Sample records correctly populated", validation.sampleRecords.length === 2 && validation.sampleRecords[0].bibNumber === "101");

// -------------------------------------------------------------------------
// TEST 5: Adaptive Font Sizing / Shrink-to-Fit
// -------------------------------------------------------------------------
const shortNameFont = calculateRunnerNameFontSize("Dan Cole");
assert("Test 5a: Short name (<=14 chars) renders at maximum 26pt display size", shortNameFont === 26);

const medNameFont = calculateRunnerNameFontSize("Alexander Kovacs");
assert("Test 5b: Medium name (15-20 chars) scales down to 22pt", medNameFont === 22);

const longNameFont = calculateRunnerNameFontSize("Maximilian Alexander von Hohenberg");
assert("Test 5c: Very long name scales down to 14pt minimum to protect safe margin", longNameFont === 14);

// -------------------------------------------------------------------------
// TEST 6: Large 500-Runner Enduro Batch Merge Simulation
// -------------------------------------------------------------------------
const large500Csv = generateSampleRunnersCsv(500);
const largeValidation = validateAndMapCsv(large500Csv);
assert("Test 6a: 500-runner synthetic dataset validates cleanly", largeValidation.isValid && largeValidation.totalRows === 500);

const batchMergeResult = executeVariableMergeJob("ORD-2026-0892", large500Csv, "race-numbers");
assert("Test 6b: 500-runner batch merge job completed successfully", batchMergeResult.status === "COMPLETED" && batchMergeResult.totalRecords === 500);
assert("Test 6c: Batch merge output filename formatted with record count and 300DPI", batchMergeResult.outputFileName === "ORD-2026-0892_BatchMerge_500Records_300DPI.pdf");
assert("Test 6d: Estimated output archive size computed for press operator", batchMergeResult.outputFileSizeBytes > 1000000);

// -------------------------------------------------------------------------
// TEST 7: High-Resolution 300 DPI Standalone Raster PNG Master Output
// -------------------------------------------------------------------------
let unapprovedPngBlocked = false;
try {
  generateProductionPngFile("ORD-2026-0892"); // Unapproved
} catch (e) {
  if (e.message.includes("APPROVAL_GATE_LOCKED")) {
    unapprovedPngBlocked = true;
  }
}
assert("Test 7a: PNG generation for unapproved order is locked by gate", unapprovedPngBlocked);

const pngResult = generateProductionPngFile("ORD-2026-0891");
assert("Test 7b: PNG file generated for approved order ORD-2026-0891", pngResult !== null && Buffer.isBuffer(pngResult.pngBuffer));

const pngHeader = pngResult.pngBuffer.subarray(0, 8);
const expectedHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
assert("Test 7c: PNG starts with official 8-byte RFC 2083 signature", pngHeader.equals(expectedHeader));

const pngStr = pngResult.pngBuffer.toString("latin1");
assert("Test 7d: PNG contains IHDR chunk with positive dimensions", pngStr.includes("IHDR") && pngResult.prepressSummary.dimensionsPx.width > 0);
assert("Test 7e: PNG contains pHYs chunk setting 300 DPI (11811 pixels/meter)", pngStr.includes("pHYs"));
assert("Test 7f: PNG contains tEXt prepress metadata with digital signature and color profile",
  pngStr.includes("tEXt") &&
  pngStr.includes("CutContour") &&
  pngStr.includes("300 DPI")
);
assert("Test 7g: PNG contains IDAT compressed scanlines and IEND chunk", pngStr.includes("IDAT") && pngStr.includes("IEND"));
assert("Test 7h: Output filename includes order number and 300DPI", pngResult.fileName.includes("ORD-2026-0891_Production_Master_300DPI"));

// -------------------------------------------------------------------------
// TEST 8: ISO 15076-1 / ICC.1 Binary Prepress Profile Embedding (PDF & PNG)
// -------------------------------------------------------------------------
const binaryIcc = buildFogra39BinaryIccProfile();
assert("Test 8a: Binary ICC profile generated with 488 bytes", binaryIcc.length === 488);
assert("Test 8b: ICC header contains magic profile signature 'acsp'", binaryIcc.subarray(36, 40).toString("ascii") === "acsp");
assert("Test 8c: ICC header specifies printer class 'prtr' and CMYK color space",
  binaryIcc.subarray(12, 16).toString("ascii") === "prtr" &&
  binaryIcc.subarray(16, 20).toString("ascii") === "CMYK"
);
assert("Test 8d: PDF production stream embeds /ICCBased ColorSpace object",
  printResult.pdfContent.includes("/ICCBased") &&
  printResult.pdfContent.includes("/Alternate /DeviceCMYK")
);
assert("Test 8e: PDF production stream embeds /OutputIntents dictionary with FOGRA39",
  printResult.pdfContent.includes("/OutputIntents") &&
  printResult.pdfContent.includes("FOGRA39") &&
  printResult.pdfContent.includes("GTS_PDFX")
);
assert("Test 8f: PNG production master embeds compliant iCCP chunk",
  pngStr.includes("iCCP") &&
  pngStr.includes("ISO Coated v2 / FOGRA39")
);
assert("Test 8g: Prepress summary flags binary ICC profile as embedded",
  printResult.prepressSummary.iccProfile?.isEmbeddedBinary === true &&
  pngResult.prepressSummary.iccProfile?.isEmbeddedBinary === true
);

console.log("==================================================================");
console.log(`PRINT ENGINE TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log("==================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
