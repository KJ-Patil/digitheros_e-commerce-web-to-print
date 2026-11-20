import { CATALOG_DIVISIONS, type CatalogProduct } from "../catalog/products.ts";

export interface PricingRequest {
  productSlug: string;
  widthMm: number;
  heightMm: number;
  quantity: number;
  materialCode?: string;
  finishCode?: string;
  cutTypeCode?: string;
}

export interface VolumeDiscountBreak {
  minQuantity: number;
  discountPercentage: number;
  label: string;
}

export const VOLUME_DISCOUNT_TIERS: VolumeDiscountBreak[] = [
  { minQuantity: 1000, discountPercentage: 35.0, label: "35% Bulk Tier (1,000+ pcs)" },
  { minQuantity: 500, discountPercentage: 25.0, label: "25% Volume Tier (500+ pcs)" },
  { minQuantity: 250, discountPercentage: 15.0, label: "15% Tier (250+ pcs)" },
  { minQuantity: 100, discountPercentage: 8.0, label: "8% Tier (100+ pcs)" },
  { minQuantity: 0, discountPercentage: 0.0, label: "Standard Rate (<100 pcs)" },
];

export interface PricingCalculationResult {
  product: {
    slug: string;
    name: string;
    divisionSlug: string;
  };
  dimensions: {
    widthMm: number;
    heightMm: number;
    areaSqCm: number;
    bleedMm: number;
    safeMarginMm: number;
  };
  quantity: number;
  selectedParameters: {
    material: { name: string; code: string; multiplier: number };
    finish?: { name: string; code: string; multiplier: number };
    cutType?: { name: string; code: string; multiplier: number };
  };
  breakdown: {
    baseRatePerSqCmCents: number;
    setupFeeCents: number;
    areaBaseCents: number;
    totalMultiplier: number;
    rawUnitCents: number;
    volumeDiscountPercentage: number;
    volumeDiscountLabel: string;
    unitPriceCents: number;
    subtotalCents: number;
    discountSavingsCents: number;
    vatPercentage: number;
    vatCents: number;
    totalCents: number;
    isMinimumOrderApplied: boolean;
  };
  formatted: {
    unitPrice: string;
    subtotal: string;
    vat: string;
    total: string;
    discountSavings: string;
    currency: string;
  };
  accounting: {
    currency: "GBP";
    xeroTaxType: "OUTPUT2"; // Standard 20% UK VAT
    lineAmount: number;     // in pounds
    taxAmount: number;
    totalAmount: number;
  };
}

/**
 * Finds product definition by slug across all divisions.
 */
export function getProductBySlug(slug: string): CatalogProduct | null {
  for (const div of CATALOG_DIVISIONS) {
    const p = div.products.find((prod) => prod.slug === slug);
    if (p) return p;
  }
  return null;
}

/**
 * Authoritative Server-Side Pricing Engine
 * Validates dimensional boundaries and applies deterministic pricing math.
 */
export function calculateProductPrice(req: PricingRequest): PricingCalculationResult {
  const product = getProductBySlug(req.productSlug);
  if (!product) {
    throw new Error(`INVALID_PRODUCT: Product with slug '${req.productSlug}' not found.`);
  }

  // 1. Boundary & Dimension Validation
  const widthMm = Number(req.widthMm);
  const heightMm = Number(req.heightMm);
  const quantity = Math.floor(Number(req.quantity));

  if (isNaN(widthMm) || widthMm < product.minWidthMm || widthMm > product.maxWidthMm) {
    throw new Error(
      `DIMENSION_ERROR: Width (${widthMm}mm) must be between ${product.minWidthMm}mm and ${product.maxWidthMm}mm.`
    );
  }

  if (isNaN(heightMm) || heightMm < product.minHeightMm || heightMm > product.maxHeightMm) {
    throw new Error(
      `DIMENSION_ERROR: Height (${heightMm}mm) must be between ${product.minHeightMm}mm and ${product.maxHeightMm}mm.`
    );
  }

  if (isNaN(quantity) || quantity <= 0) {
    throw new Error("QUANTITY_ERROR: Quantity must be a positive integer greater than zero.");
  }

  // 2. Resolve Parameters & Multipliers
  const materialParam =
    product.parameters.find(
      (p) => p.type === "material" && (req.materialCode ? p.code === req.materialCode : p.isDefault)
    ) ||
    product.parameters.find((p) => p.type === "material") ||
    { name: "Standard Substrate", code: "STD", multiplier: 1.0, setupFeeCents: 0 };

  const finishParam = product.parameters.find(
    (p) => p.type === "finish" && (req.finishCode ? p.code === req.finishCode : p.isDefault)
  );

  const cutParam = product.parameters.find(
    (p) => p.type === "cut_type" && (req.cutTypeCode ? p.code === req.cutTypeCode : p.isDefault)
  );

  const matMultiplier = materialParam.multiplier || 1.0;
  const finishMultiplier = finishParam?.multiplier || 1.0;
  const cutMultiplier = cutParam?.multiplier || 1.0;
  const totalMultiplier = matMultiplier * finishMultiplier * cutMultiplier;

  // 3. Area & Pricing Math
  const areaSqCm = (widthMm * heightMm) / 100;
  const baseCostPerUnitCents = product.baseRatePerSqCmCents * areaSqCm * totalMultiplier;
  const amortizedSetupCents = product.setupFeeCents / quantity;
  const rawUnitCents = Math.max(12, baseCostPerUnitCents + amortizedSetupCents);

  // 4. Volume Discount Tiering
  const matchingTier =
    VOLUME_DISCOUNT_TIERS.find((t) => quantity >= t.minQuantity) ||
    VOLUME_DISCOUNT_TIERS[VOLUME_DISCOUNT_TIERS.length - 1];

  const discountFraction = matchingTier.discountPercentage / 100;
  const unitPriceCents = Math.max(5, Math.round(rawUnitCents * (1 - discountFraction)));
  let subtotalCents = unitPriceCents * quantity;

  // Minimum Order Value Protection
  let isMinimumOrderApplied = false;
  if (subtotalCents < product.minOrderCents) {
    subtotalCents = product.minOrderCents;
    isMinimumOrderApplied = true;
  }

  const undiscountedSubtotalCents = Math.round(rawUnitCents * quantity);
  const discountSavingsCents = Math.max(0, undiscountedSubtotalCents - subtotalCents);

  // 5. VAT (20% standard UK rate, configurable)
  const vatPercentage = 20.0;
  const vatCents = Math.round(subtotalCents * (vatPercentage / 100));
  const totalCents = subtotalCents + vatCents;

  return {
    product: {
      slug: product.slug,
      name: product.name,
      divisionSlug: product.divisionSlug,
    },
    dimensions: {
      widthMm,
      heightMm,
      areaSqCm,
      bleedMm: product.bleedMm,
      safeMarginMm: product.safeMarginMm,
    },
    quantity,
    selectedParameters: {
      material: {
        name: materialParam.name,
        code: materialParam.code,
        multiplier: matMultiplier,
      },
      finish: finishParam
        ? { name: finishParam.name, code: finishParam.code, multiplier: finishMultiplier }
        : undefined,
      cutType: cutParam
        ? { name: cutParam.name, code: cutParam.code, multiplier: cutMultiplier }
        : undefined,
    },
    breakdown: {
      baseRatePerSqCmCents: product.baseRatePerSqCmCents,
      setupFeeCents: product.setupFeeCents,
      areaBaseCents: Math.round(baseCostPerUnitCents),
      totalMultiplier,
      rawUnitCents: Math.round(rawUnitCents),
      volumeDiscountPercentage: matchingTier.discountPercentage,
      volumeDiscountLabel: matchingTier.label,
      unitPriceCents,
      subtotalCents,
      discountSavingsCents,
      vatPercentage,
      vatCents,
      totalCents,
      isMinimumOrderApplied,
    },
    formatted: {
      unitPrice: `£${(unitPriceCents / 100).toFixed(2)}`,
      subtotal: `£${(subtotalCents / 100).toFixed(2)}`,
      vat: `£${(vatCents / 100).toFixed(2)}`,
      total: `£${(totalCents / 100).toFixed(2)}`,
      discountSavings: `£${(discountSavingsCents / 100).toFixed(2)}`,
      currency: "GBP",
    },
    accounting: {
      currency: "GBP",
      xeroTaxType: "OUTPUT2",
      lineAmount: Number((subtotalCents / 100).toFixed(2)),
      taxAmount: Number((vatCents / 100).toFixed(2)),
      totalAmount: Number((totalCents / 100).toFixed(2)),
    },
  };
}

export const calculatePrice = calculateProductPrice;
