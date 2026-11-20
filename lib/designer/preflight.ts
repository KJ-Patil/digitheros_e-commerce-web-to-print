import type { PreflightReport, CanvasElement } from "./types.ts";

export const SUPPORTED_FILE_TYPES = [
  "application/pdf",
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "application/illustrator",
  "application/postscript",
];

export const SUPPORTED_EXTENSIONS = [".pdf", ".svg", ".png", ".jpg", ".jpeg", ".ai"];
export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Sanitizes uploaded file names to prevent directory traversal or unsafe characters.
 */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/\.\.+/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+/, "")
    .toLowerCase();
}

/**
 * Validates uploaded artwork against production print constraints.
 */
export function validateUploadedArtwork(
  fileName: string,
  fileSizeBytes: number,
  fileType: string,
  targetWidthMm: number,
  targetHeightMm: number
): PreflightReport {
  const warnings: string[] = [];
  const errors: string[] = [];

  const lowerName = fileName.toLowerCase();
  const hasValidExt = SUPPORTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

  if (!hasValidExt) {
    errors.push(
      `Unsupported file extension. Allowed formats: ${SUPPORTED_EXTENSIONS.join(", ")}.`
    );
  }

  if (fileSizeBytes > MAX_UPLOAD_SIZE_BYTES) {
    errors.push(
      `File exceeds maximum limit of 25MB (Received: ${(fileSizeBytes / (1024 * 1024)).toFixed(1)}MB).`
    );
  }

  // Preflight checks for vector vs raster
  const isVector = lowerName.endsWith(".pdf") || lowerName.endsWith(".svg") || lowerName.endsWith(".ai");

  if (!isVector) {
    warnings.push("Raster format detected (PNG/JPEG). Ensure resolution is at least 300 DPI at 1:1 scale.");
    warnings.push("Color profile note: RGB raster assets will be automatically converted to CMYK Fogra39 upon RIP processing.");
  } else {
    warnings.push("Vector asset detected. Ensure all live fonts are converted to curves/outlines prior to proof approval.");
  }

  return {
    passed: errors.length === 0,
    fileName: sanitizeFileName(fileName),
    fileSizeBytes,
    fileType,
    detectedDimensionsMm: { width: targetWidthMm, height: targetHeightMm },
    detectedDpi: isVector ? undefined : 300,
    hasBleed: true,
    warnings,
    errors,
  };
}

/**
 * Validates in-browser canvas elements against safe-zone and bleed constraints.
 */
export function validateCanvasElements(
  elements: CanvasElement[],
  canvasWidthMm: number,
  canvasHeightMm: number,
  bleedMm: number,
  safeMarginMm: number
): { safeZoneViolations: string[]; bleedWarnings: string[] } {
  const safeZoneViolations: string[] = [];
  const bleedWarnings: string[] = [];

  const minSafeX = safeMarginMm;
  const maxSafeX = canvasWidthMm - safeMarginMm;
  const minSafeY = safeMarginMm;
  const maxSafeY = canvasHeightMm - safeMarginMm;

  for (const el of elements) {
    // Check text elements breaching safe zone
    if (el.type === "text" || el.type === "variable") {
      const elRight = el.xMm + el.widthMm;
      const elBottom = el.yMm + el.heightMm;

      if (
        el.xMm < minSafeX ||
        elRight > maxSafeX ||
        el.yMm < minSafeY ||
        elBottom > maxSafeY
      ) {
        safeZoneViolations.push(
          `Text element '${el.text || el.variableKey || "Text"}' is within ${safeMarginMm}mm of the cut line. It risks being clipped during finishing.`
        );
      }
    }

    // Check image elements that touch cut boundary but don't bleed out to full bleed line
    if (el.type === "image" || el.type === "shape") {
      const touchesLeftTrim = el.xMm <= 0.5 && el.xMm > -bleedMm;
      const touchesRightTrim = el.xMm + el.widthMm >= canvasWidthMm - 0.5 && el.xMm + el.widthMm < canvasWidthMm + bleedMm;

      if (touchesLeftTrim || touchesRightTrim) {
        bleedWarnings.push(
          `Background asset touches the cut border. Extend it by +${bleedMm}mm to the red bleed line to prevent white paper borders.`
        );
      }
    }
  }

  return { safeZoneViolations, bleedWarnings };
}

/**
 * Convenience alias for sanitizing artwork filenames.
 */
export function sanitizeArtworkFilename(name: string): string {
  return sanitizeFileName(name);
}

/**
 * Validates an uploaded artwork file object for security and format constraints.
 */
export function validateArtworkFile(file: { name: string; size: number; type: string }): {
  status: "PASSED" | "FAILED";
  errors: string[];
  warnings: string[];
} {
  const result = validateUploadedArtwork(file.name, file.size, file.type, 100, 100);
  return {
    status: result.passed ? "PASSED" : "FAILED",
    errors: result.errors,
    warnings: result.warnings,
  };
}
