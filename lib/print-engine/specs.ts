/**
 * Digital Heroes (Level 2) — Configurable Production & Prepress Specifications
 * 
 * Provides division-specific prepress constraints, bleed requirements, safe margins,
 * color profiles, resolution requirements, and machine output specifications across
 * all six core manufacturing divisions.
 * 
 * IMPORTANT: All machine models and RIP profiles are clearly labelled placeholders
 * until physical manufacturer calibration profiles are connected.
 */

export interface DivisionProductionSpec {
  divisionSlug: string;
  divisionName: string;
  defaultBleedMm: number;
  minBleedMm: number;
  safeMarginMm: number;
  resolutionDpi: number;
  colorMode: "CMYK (FOGRA39 Simulation)" | "Grayscale / K-Only" | "CMYK + Spot White" | "Vector RGB Stroke";
  outputFormat: "PDF/X-1a:2001" | "PDF/X-4:2010" | "PDF 1.4 Vector" | "PDF 1.4 Multi-Plate" | "DXF / Vector PDF";
  supportsVariableData: boolean;
  requiresCutContour: boolean;
  cutContourStrokePt: number;
  spotColorName?: string;
  cuttingToleranceMm: number;
  minDimensionMm: { width: number; height: number };
  maxDimensionMm: { width: number; height: number };
  // Labeled placeholders for physical machinery
  hardwareProfilePlaceholder: {
    primaryMachine: string;
    finishingUnit: string;
    ripSoftware: string;
    status: "PLACEHOLDER (Pending manufacturer calibration profile)";
  };
  notes: string;
}

export const DIVISION_PRODUCTION_SPECS: Record<string, DivisionProductionSpec> = {
  labels: {
    divisionSlug: "labels",
    divisionName: "Labels & Stickers",
    defaultBleedMm: 2.0,
    minBleedMm: 1.5,
    safeMarginMm: 2.0,
    resolutionDpi: 300,
    colorMode: "CMYK (FOGRA39 Simulation)",
    outputFormat: "PDF/X-1a:2001",
    supportsVariableData: true,
    requiresCutContour: true,
    cutContourStrokePt: 0.25,
    spotColorName: "CutContour (100% Spot Magenta)",
    cuttingToleranceMm: 0.75,
    minDimensionMm: { width: 25, height: 25 },
    maxDimensionMm: { width: 1200, height: 50000 },
    hardwareProfilePlaceholder: {
      primaryMachine: "Roland TrueVIS VG3-640 (ECO-UV Inkjet & Optical Die-Cutter)",
      finishingUnit: "Summa S2 Class T140 Tangential Vinyl Cutter",
      ripSoftware: "Roland VersaWorks 6 RIP (Harlequin core)",
      status: "PLACEHOLDER (Pending manufacturer calibration profile)",
    },
    notes: "Requires dedicated Spot Color vector kiss-cut or die-cut contour line.",
  },

  "race-numbers": {
    divisionSlug: "race-numbers",
    divisionName: "Race & Event Numbers",
    defaultBleedMm: 3.0,
    minBleedMm: 2.0,
    safeMarginMm: 5.0,
    resolutionDpi: 300,
    colorMode: "CMYK (FOGRA39 Simulation)",
    outputFormat: "PDF/X-4:2010",
    supportsVariableData: true,
    requiresCutContour: false,
    cutContourStrokePt: 0,
    cuttingToleranceMm: 1.0,
    minDimensionMm: { width: 100, height: 70 },
    maxDimensionMm: { width: 450, height: 320 },
    hardwareProfilePlaceholder: {
      primaryMachine: "Canon imagePRESS V1000 Heavyweight Production Press",
      finishingUnit: "Duplo DC-618 Slitter/Cutter/Creaser with Eyelet Punch",
      ripSoftware: "EFI Fiery FS500 Pro Server",
      status: "PLACEHOLDER (Pending manufacturer calibration profile)",
    },
    notes: "Variable data barcode/QR matrix and sequential numbering engine integrated.",
  },

  "mtb-boards": {
    divisionSlug: "mtb-boards",
    divisionName: "MTB Number Boards",
    defaultBleedMm: 3.0,
    minBleedMm: 3.0,
    safeMarginMm: 6.0,
    resolutionDpi: 300,
    colorMode: "CMYK (FOGRA39 Simulation)",
    outputFormat: "PDF/X-4:2010",
    supportsVariableData: true,
    requiresCutContour: true,
    cutContourStrokePt: 0.5,
    spotColorName: "ThruCut (100% Spot Cyan)",
    cuttingToleranceMm: 1.0,
    minDimensionMm: { width: 120, height: 100 },
    maxDimensionMm: { width: 350, height: 250 },
    hardwareProfilePlaceholder: {
      primaryMachine: "Arizona 1380 GT UV Flatbed Rigid Substrate Printer",
      finishingUnit: "Zünd G3 Digital Flatbed CNC Router with Zip-Tie Hole Tooling",
      ripSoftware: "Onyx Thrive Production RIP",
      status: "PLACEHOLDER (Pending manufacturer calibration profile)",
    },
    notes: "Requires zip-tie cut slots and durable 500-micron polypropylene prepress template.",
  },

  stamps: {
    divisionSlug: "stamps",
    divisionName: "Custom Rubber Stamps",
    defaultBleedMm: 0.0,
    minBleedMm: 0.0,
    safeMarginMm: 1.5,
    resolutionDpi: 600,
    colorMode: "Grayscale / K-Only",
    outputFormat: "PDF 1.4 Vector",
    supportsVariableData: false,
    requiresCutContour: false,
    cutContourStrokePt: 0,
    cuttingToleranceMm: 0.25,
    minDimensionMm: { width: 15, height: 15 },
    maxDimensionMm: { width: 100, height: 80 },
    hardwareProfilePlaceholder: {
      primaryMachine: "Trotec Speedy 360 CO2 Laser (Stamp Rubber Engraving Engine)",
      finishingUnit: "Trodat Printy 4.0 Mechanical Stamp Casing Assembly",
      ripSoftware: "Ruby Laser Platform Driver",
      status: "PLACEHOLDER (Pending manufacturer calibration profile)",
    },
    notes: "100% Black (K) only for laser ablation. 0mm bleed required for rubber base.",
  },

  trophies: {
    divisionSlug: "trophies",
    divisionName: "Trophies & Awards",
    defaultBleedMm: 1.5,
    minBleedMm: 1.0,
    safeMarginMm: 3.0,
    resolutionDpi: 600,
    colorMode: "CMYK + Spot White",
    outputFormat: "PDF 1.4 Multi-Plate",
    supportsVariableData: true,
    requiresCutContour: false,
    cutContourStrokePt: 0,
    spotColorName: "White_Undercoat (Spot White)",
    cuttingToleranceMm: 0.5,
    minDimensionMm: { width: 40, height: 20 },
    maxDimensionMm: { width: 400, height: 300 },
    hardwareProfilePlaceholder: {
      primaryMachine: "Mimaki UJF-6042 MkII e Direct-to-Object UV LED Flatbed",
      finishingUnit: "Direct Glass/Acrylic Vacuum Bed & Diamond Polisher",
      ripSoftware: "RasterLink 7 Multi-Layer RIP",
      status: "PLACEHOLDER (Pending manufacturer calibration profile)",
    },
    notes: "Direct UV print onto acrylic/metal/glass with primer and opaque white undercoat.",
  },

  "laser-cut": {
    divisionSlug: "laser-cut",
    divisionName: "Laser-Cut Work",
    defaultBleedMm: 0.0,
    minBleedMm: 0.0,
    safeMarginMm: 2.0,
    resolutionDpi: 300,
    colorMode: "Vector RGB Stroke",
    outputFormat: "DXF / Vector PDF",
    supportsVariableData: false,
    requiresCutContour: true,
    cutContourStrokePt: 0.001, // Hairline
    spotColorName: "VectorLaserCut (RGB Red 255,0,0)",
    cuttingToleranceMm: 0.15,
    minDimensionMm: { width: 30, height: 30 },
    maxDimensionMm: { width: 900, height: 600 },
    hardwareProfilePlaceholder: {
      primaryMachine: "Rayjet 50 Industrial CO2 Laser Cutting & Engraving System",
      finishingUnit: "Deburring & Ultrasonic Cleaning Bath",
      ripSoftware: "Rayjet Commander Driver / LightBurn DSP Controller",
      status: "PLACEHOLDER (Pending manufacturer calibration profile)",
    },
    notes: "Hairline paths (0.01mm) dictate laser cutting (Red) vs vector engrave (Blue).",
  },
};

/**
 * Retrieve specification for a division
 */
export function getDivisionProductionSpec(divisionSlug: string): DivisionProductionSpec {
  const spec = DIVISION_PRODUCTION_SPECS[divisionSlug.toLowerCase()];
  if (!spec) {
    return DIVISION_PRODUCTION_SPECS.labels;
  }
  return { ...spec };
}

/**
 * Update specification for a division (in-memory with cloud persistence hook)
 */
export function updateDivisionProductionSpec(
  divisionSlug: string,
  updates: Partial<DivisionProductionSpec>
): DivisionProductionSpec {
  const existing = getDivisionProductionSpec(divisionSlug);
  const updated: DivisionProductionSpec = {
    ...existing,
    ...updates,
    divisionSlug: existing.divisionSlug, // Immutable slug
    divisionName: existing.divisionName,
    hardwareProfilePlaceholder: {
      ...existing.hardwareProfilePlaceholder,
      ...(updates.hardwareProfilePlaceholder || {}),
      status: "PLACEHOLDER (Pending manufacturer calibration profile)",
    },
  };

  DIVISION_PRODUCTION_SPECS[existing.divisionSlug] = updated;
  return updated;
}
