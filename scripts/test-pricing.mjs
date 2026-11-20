// ========================================================================
// DIGITAL HEROES — SERVER PRICING & BOUNDARY TEST SUITE
// File: scripts/test-pricing.mjs
// Description: Validates math, volume discount tiers, boundaries & anti-tampering
// ========================================================================

import { calculateProductPrice } from "../lib/pricing/engine.ts";

console.log("==================================================================");
console.log("DIGITAL HEROES — SERVER PRICING & BOUNDARY VALIDATION SUITE");
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

// TEST 1: Standard 75x50mm Vinyl Stickers calculation
const res1 = calculateProductPrice({
  productSlug: "vinyl-stickers",
  widthMm: 75,
  heightMm: 50,
  quantity: 250,
  materialCode: "GLOSS_VINYL",
});

assert("Test 1: Standard product calculates successfully", res1 !== null);
assert("Test 1: Calculated area is exactly 37.5 cm²", res1.dimensions.areaSqCm === 37.5);
assert("Test 1: Total matches subtotal + VAT", res1.breakdown.totalCents === res1.breakdown.subtotalCents + res1.breakdown.vatCents);

// TEST 2: Volume discount threshold tiers
const qty50 = calculateProductPrice({ productSlug: "vinyl-stickers", widthMm: 75, heightMm: 50, quantity: 50 });
const qty100 = calculateProductPrice({ productSlug: "vinyl-stickers", widthMm: 75, heightMm: 50, quantity: 100 });
const qty250 = calculateProductPrice({ productSlug: "vinyl-stickers", widthMm: 75, heightMm: 50, quantity: 250 });
const qty500 = calculateProductPrice({ productSlug: "vinyl-stickers", widthMm: 75, heightMm: 50, quantity: 500 });
const qty1000 = calculateProductPrice({ productSlug: "vinyl-stickers", widthMm: 75, heightMm: 50, quantity: 1000 });

assert("Test 2a: Quantity 50 has 0% volume discount", qty50.breakdown.volumeDiscountPercentage === 0);
assert("Test 2b: Quantity 100 triggers 8% discount tier", qty100.breakdown.volumeDiscountPercentage === 8);
assert("Test 2c: Quantity 250 triggers 15% discount tier", qty250.breakdown.volumeDiscountPercentage === 15);
assert("Test 2d: Quantity 500 triggers 25% discount tier", qty500.breakdown.volumeDiscountPercentage === 25);
assert("Test 2e: Quantity 1000 triggers 35% discount tier", qty1000.breakdown.volumeDiscountPercentage === 35);

// TEST 3: Minimum order value floor protection (£15.00 min order)
const tinyOrder = calculateProductPrice({
  productSlug: "vinyl-stickers",
  widthMm: 25,
  heightMm: 25,
  quantity: 5,
});
assert("Test 3: Small order enforces minimum order floor (1500 cents / £15.00)", tinyOrder.breakdown.subtotalCents >= 1500);
assert("Test 3: Flag 'isMinimumOrderApplied' is true", tinyOrder.breakdown.isMinimumOrderApplied === true);

// TEST 4: Material multiplier math (Holographic Foil is 1.4x)
const standardMat = calculateProductPrice({
  productSlug: "vinyl-stickers",
  widthMm: 100,
  heightMm: 100,
  quantity: 250,
  materialCode: "GLOSS_VINYL",
});

const holoMat = calculateProductPrice({
  productSlug: "vinyl-stickers",
  widthMm: 100,
  heightMm: 100,
  quantity: 250,
  materialCode: "HOLO_VINYL",
});

assert(
  "Test 4: Holographic substrate yields higher unit price than standard gloss",
  holoMat.breakdown.unitPriceCents > standardMat.breakdown.unitPriceCents
);

// TEST 5: Dimension boundary enforcement — Below Minimum Width (Min is 25mm)
let errorCaught = false;
try {
  calculateProductPrice({
    productSlug: "vinyl-stickers",
    widthMm: 10,
    heightMm: 50,
    quantity: 100,
  });
} catch (e) {
  errorCaught = true;
  assert("Test 5: Width below 25mm rejected with DIMENSION_ERROR", e.message.includes("DIMENSION_ERROR"));
}
assert("Test 5: Below minimum width threw exception", errorCaught);

// TEST 6: Dimension boundary enforcement — Above Maximum Width (Max is 1200mm)
errorCaught = false;
try {
  calculateProductPrice({
    productSlug: "vinyl-stickers",
    widthMm: 1500,
    heightMm: 50,
    quantity: 100,
  });
} catch (e) {
  errorCaught = true;
  assert("Test 6: Width exceeding 1200mm rejected with DIMENSION_ERROR", e.message.includes("DIMENSION_ERROR"));
}
assert("Test 6: Above maximum width threw exception", errorCaught);

// TEST 7: Quantity boundary enforcement — Zero or Negative
errorCaught = false;
try {
  calculateProductPrice({
    productSlug: "vinyl-stickers",
    widthMm: 75,
    heightMm: 50,
    quantity: 0,
  });
} catch (e) {
  errorCaught = true;
  assert("Test 7: Quantity of 0 rejected with QUANTITY_ERROR", e.message.includes("QUANTITY_ERROR"));
}
assert("Test 7: Zero quantity threw exception", errorCaught);

// TEST 8: Invalid product slug
errorCaught = false;
try {
  calculateProductPrice({
    productSlug: "unreal-fake-product",
    widthMm: 50,
    heightMm: 50,
    quantity: 100,
  });
} catch (e) {
  errorCaught = true;
  assert("Test 8: Unknown product slug rejected with INVALID_PRODUCT", e.message.includes("INVALID_PRODUCT"));
}
assert("Test 8: Invalid product slug threw exception", errorCaught);

// TEST 9: Exact 20% VAT precision verification
const vatTest = calculateProductPrice({
  productSlug: "tyvek-race-bibs",
  widthMm: 210,
  heightMm: 148,
  quantity: 500,
});
const expectedVat = Math.round(vatTest.breakdown.subtotalCents * 0.2);
assert("Test 9: VAT matches Math.round(subtotal * 0.20) in integer cents", vatTest.breakdown.vatCents === expectedVat);

// TEST 10: Anti-Tampering Protection
// Even if client passes bogus client fields (e.g. clientPrice: 1), server calculates strictly from internal catalog rules
const fakePayload = {
  productSlug: "vinyl-stickers",
  widthMm: 75,
  heightMm: 50,
  quantity: 250,
  clientPrice: 0.01,
  clientDiscount: 99.0,
};
const safeServerResult = calculateProductPrice(fakePayload);
assert("Test 10: Anti-Tampering: Server ignores client price/discount injections", safeServerResult.breakdown.volumeDiscountPercentage === 15);

console.log("------------------------------------------------------------------");
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("==================================================================");

if (failed > 0) process.exit(1);
