export type ElementType = "text" | "variable" | "image" | "shape";

export interface CanvasElement {
  id: string;
  type: ElementType;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  rotationDeg: number;
  // Text & Variable Properties
  text?: string;
  fontFamily?: "sans" | "mono" | "serif" | "display";
  fontSizePt?: number;
  minFontSizePt?: number;
  maxFontSizePt?: number;
  shrinkToFit?: boolean;
  letterSpacingEm?: number;
  textColor?: string;
  textAlign?: "left" | "center" | "right";
  isBold?: boolean;
  isVariablePlaceholder?: boolean;
  variableKey?: string; // e.g. "BIB_NUMBER", "ATHLETE_NAME"
  // Image properties
  imageUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  aspectRatio?: number;
}

export interface DesignCanvasState {
  version: "1.0";
  productSlug: string;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  safeMarginMm: number;
  backgroundColor: string;
  elements: CanvasElement[];
}

export interface PreflightReport {
  passed: boolean;
  fileName: string;
  fileSizeBytes: number;
  fileType: string;
  detectedDimensionsMm?: { width: number; height: number };
  detectedDpi?: number;
  hasBleed: boolean;
  warnings: string[];
  errors: string[];
}
