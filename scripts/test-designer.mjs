// ========================================================================
// DIGITAL HEROES — DESIGNER & PREFLIGHT VALIDATION TEST SUITE
// File: scripts/test-designer.mjs
// ========================================================================

import {
  validateUploadedArtwork,
  sanitizeFileName,
  validateCanvasElements,
  MAX_UPLOAD_SIZE_BYTES,
} from "../lib/designer/preflight.ts";

console.log("==================================================================");
console.log("DIGITAL HEROES — DESIGNER & PREFLIGHT VALIDATION SUITE");
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

// TEST 1: Allowed file extensions
const validPdf = validateUploadedArtwork("artwork.pdf", 1024 * 500, "application/pdf", 75, 50);
assert("Test 1: Valid PDF artwork passes preflight", validPdf.passed);

const validSvg = validateUploadedArtwork("logo.svg", 1024 * 100, "image/svg+xml", 75, 50);
assert("Test 1: Valid SVG artwork passes preflight", validSvg.passed);

const invalidExe = validateUploadedArtwork("malicious.exe", 1024 * 100, "application/x-msdownload", 75, 50);
assert("Test 1: Disallowed file extension (.exe) is rejected", !invalidExe.passed);

// TEST 2: File size limits
const oversizeFile = validateUploadedArtwork("large_asset.pdf", MAX_UPLOAD_SIZE_BYTES + 1024, "application/pdf", 75, 50);
assert("Test 2: Files over 25MB are rejected by preflight", !oversizeFile.passed);

// TEST 3: Safe filename sanitization
const dirtyName = "../../suspicious$ file#name (1)!.pdf";
const cleanName = sanitizeFileName(dirtyName);
assert("Test 3: Filenames are sanitized (no slashes, spaces, or special characters)", !cleanName.includes("/") && !cleanName.includes(" ") && !cleanName.includes("$"));

// TEST 4: Safe-zone violation check
// Cut line is at 0,0 to 100,100 with 3mm safe margin. Text placed at 1mm,1mm breaches safe zone.
const breachingElements = [
  {
    id: "el-1",
    type: "text",
    xMm: 1, // Only 1mm from cut edge (safe margin is 3mm)
    yMm: 1,
    widthMm: 40,
    heightMm: 10,
    rotationDeg: 0,
    text: "Dangerously close text",
  },
];
const check1 = validateCanvasElements(breachingElements, 100, 100, 3, 3);
assert("Test 4: Safe zone violations detected when text is within 3mm of cut edge", check1.safeZoneViolations.length > 0);

// TEST 5: Compliant safe-zone placement
const safeElements = [
  {
    id: "el-2",
    type: "text",
    xMm: 10, // 10mm from edge (well within safe margin)
    yMm: 10,
    widthMm: 40,
    heightMm: 10,
    rotationDeg: 0,
    text: "Safely placed text",
  },
];
const check2 = validateCanvasElements(safeElements, 100, 100, 3, 3);
assert("Test 5: No safe zone violations when text is placed inside safe bounds", check2.safeZoneViolations.length === 0);

// TEST 6: Raster DPI advisory check
const rasterUpload = validateUploadedArtwork("photo.png", 1024 * 500, "image/png", 75, 50);
assert("Test 6: Raster uploads generate 300 DPI preflight advisory warning", rasterUpload.warnings.some((w) => w.includes("300 DPI")));

// TEST 7: Vector asset advisory check
const vectorUpload = validateUploadedArtwork("vector_layout.ai", 1024 * 500, "application/illustrator", 75, 50);
assert("Test 7: Vector uploads generate curve/outline advisory", vectorUpload.warnings.some((w) => w.includes("curves/outlines")));

console.log("------------------------------------------------------------------");
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("==================================================================");

if (failed > 0) process.exit(1);
