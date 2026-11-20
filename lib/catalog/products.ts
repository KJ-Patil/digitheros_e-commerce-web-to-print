export interface CatalogParameter {
  id: string;
  type: "material" | "finish" | "cut_type" | "mounting";
  name: string;
  code: string;
  multiplier: number;
  setupFeeCents: number;
  isDefault?: boolean;
}

export interface CatalogProduct {
  id: string;
  divisionSlug: string;
  slug: string;
  name: string;
  shortTagline: string;
  description: string;
  minWidthMm: number;
  maxWidthMm: number;
  minHeightMm: number;
  maxHeightMm: number;
  defaultWidthMm: number;
  defaultHeightMm: number;
  bleedMm: number;
  safeMarginMm: number;
  baseRatePerSqCmCents: number;
  minOrderCents: number;
  setupFeeCents: number;
  parameters: CatalogParameter[];
  specsList: string[];
}

export interface CatalogDivision {
  slug: string;
  number: string;
  name: string;
  tagline: string;
  description: string;
  equipment: string;
  typicalTurnaround: string;
  substrates: string[];
  specsSummary: string;
  products: CatalogProduct[];
}

export interface GalleryItem {
  id: string;
  divisionSlug: string;
  title: string;
  client: string;
  material: string;
  dimensions: string;
  finish: string;
  productSlug: string;
  description: string;
}

export const CATALOG_DIVISIONS: CatalogDivision[] = [
  {
    slug: "labels",
    number: "01",
    name: "Labels & Stickers",
    tagline: "Custom die-cut waterproof vinyl, metallic foils, and roll labels.",
    description:
      "High-tack self-adhesive labels for beverage containers, cosmetic packaging, and industrial asset tagging. Cut with 0.1mm optical registration.",
    equipment: "Roland TrueVIS VG3-640 (8-Color Inkjet & Integrated Contour Cutter)",
    typicalTurnaround: "24-48 Hours",
    substrates: [
      "White Gloss Vinyl (100μ)",
      "Matte Finish Vinyl (100μ)",
      "Holographic Metallic Foil",
      "Clear Polypropylene with White Ink Understrike",
    ],
    specsSummary: "0.1mm cutting tolerance • Full 3mm exterior bleed • 300+ DPI color",
    products: [
      {
        id: "p1",
        divisionSlug: "labels",
        slug: "vinyl-stickers",
        name: "Custom Die-Cut Vinyl Stickers",
        shortTagline: "Any custom shape, waterproof adhesive, UV-laminated.",
        description:
          "Industrial-grade vinyl stickers cut to your exact vector outline. Coated with UV protective laminate resisting moisture, scratches, and sunlight.",
        minWidthMm: 25,
        maxWidthMm: 1200,
        minHeightMm: 25,
        maxHeightMm: 2500,
        defaultWidthMm: 75,
        defaultHeightMm: 50,
        bleedMm: 3.0,
        safeMarginMm: 3.0,
        baseRatePerSqCmCents: 2,
        minOrderCents: 1500,
        setupFeeCents: 1200,
        parameters: [
          { id: "m1", type: "material", name: "White Gloss Vinyl (100μ)", code: "GLOSS_VINYL", multiplier: 1.0, setupFeeCents: 0, isDefault: true },
          { id: "m2", type: "material", name: "Matte Non-Glare Vinyl (100μ)", code: "MATTE_VINYL", multiplier: 1.05, setupFeeCents: 0 },
          { id: "m3", type: "material", name: "Holographic Metallic Film", code: "HOLO_VINYL", multiplier: 1.4, setupFeeCents: 500 },
          { id: "f1", type: "finish", name: "Gloss UV Protective Laminate", code: "UV_GLOSS", multiplier: 1.0, setupFeeCents: 0, isDefault: true },
          { id: "f2", type: "finish", name: "Soft-Touch Matte Laminate", code: "SOFT_MATTE", multiplier: 1.15, setupFeeCents: 300 },
          { id: "c1", type: "cut_type", name: "Contour Die-Cut (Custom Outline)", code: "DIE_CUT", multiplier: 1.0, setupFeeCents: 0, isDefault: true },
          { id: "c2", type: "cut_type", name: "Kiss-Cut On Backing Sheet", code: "KISS_CUT", multiplier: 0.95, setupFeeCents: 0 },
        ],
        specsList: [
          "Outdoor durability rating: 3-5 years",
          "Automated contour toolpath generation",
          "Minimum order quantity: 25 units",
          "Food contact compliant low-migration inks",
        ],
      },
    ],
  },
  {
    slug: "race-numbers",
    number: "02",
    name: "Race & Event Numbers",
    tagline: "Waterproof Tyvek bibs with CSV variable data and barcode merging.",
    description:
      "Tear-proof athletic bibs for marathons, triathlons, and cycling races. Integrates server-side variable data merge for athlete names, categories, and timing chips.",
    equipment: "Konica Minolta AccurioPress with variable-data RIP engine",
    typicalTurnaround: "48-72 Hours",
    substrates: [
      "100gsm Genuine DuPont Tyvek",
      "120gsm Heavy-Duty Weatherproof Tyvek",
      "Pre-perforated timing chip tear-off stubs",
    ],
    specsSummary: "Full bleed printing • Corner hole punch • Barcode 128 / QR / Timing chip ready",
    products: [
      {
        id: "p2",
        divisionSlug: "race-numbers",
        slug: "tyvek-race-bibs",
        name: "Enduro Tyvek Race Bibs",
        shortTagline: "Tearproof, waterproof event numbers with variable data merge.",
        description:
          "High-strength DuPont Tyvek race numbers engineered for all-weather conditions. Upload a CSV spreadsheet to automate runner names, numbers, emergency medical blocks, and barcodes.",
        minWidthMm: 100,
        maxWidthMm: 300,
        minHeightMm: 100,
        maxHeightMm: 300,
        defaultWidthMm: 210,
        defaultHeightMm: 148,
        bleedMm: 3.0,
        safeMarginMm: 5.0,
        baseRatePerSqCmCents: 1,
        minOrderCents: 2000,
        setupFeeCents: 1500,
        parameters: [
          { id: "m4", type: "material", name: "100gsm Genuine DuPont Tyvek", code: "TYVEK_100", multiplier: 1.0, setupFeeCents: 0, isDefault: true },
          { id: "m5", type: "material", name: "120gsm Extra-Heavy Tyvek", code: "TYVEK_120", multiplier: 1.2, setupFeeCents: 0 },
          { id: "c3", type: "cut_type", name: "Standard 4-Corner Hole Punch", code: "PUNCH_4H", multiplier: 1.0, setupFeeCents: 0, isDefault: true },
          { id: "c4", type: "cut_type", name: "No Hole Punch (Adhesive Backing)", code: "NO_PUNCH", multiplier: 0.98, setupFeeCents: 0 },
        ],
        specsList: [
          "Zero tear propagation under 15kg tensile pull",
          "Automated server-side CSV variable merge",
          "Includes 4x 5mm safety-pin corner punches",
          "Bleed tolerance: 3mm on all four sides",
        ],
      },
    ],
  },
  {
    slug: "mtb-boards",
    number: "03",
    name: "MTB Boards",
    tagline: "Heavyweight polypropylene downhill & enduro handlebar plates.",
    description:
      "Impact-resistant number plates for mountain bike downhill, enduro, and BMX racing. Built to survive crashes, mud spray, and high-pressure washers.",
    equipment: "Mimaki Flatbed UV Direct-to-Substrate with Primer Channel",
    typicalTurnaround: "3-5 Business Days",
    substrates: [
      "800μ Solid Polypropylene (Impact Modified)",
      "1000μ Pro Downhill Armor Polypropylene",
    ],
    specsSummary: "Contour CNC router cutting • Zip-tie slots • High-opacity white ink backup",
    products: [
      {
        id: "p3",
        divisionSlug: "mtb-boards",
        slug: "mtb-handlebar-plates",
        name: "Gravity Downhill MTB Number Board",
        shortTagline: "Impact-modified polymer plate with handlebar zip-tie slots.",
        description:
          "Rigid yet flexible 800μ polypropylene boards designed to contour around brake hoses and handlebar stems. High-contrast typography optimized for race camera gate detection.",
        minWidthMm: 120,
        maxWidthMm: 250,
        minHeightMm: 120,
        maxHeightMm: 220,
        defaultWidthMm: 180,
        defaultHeightMm: 160,
        bleedMm: 3.0,
        safeMarginMm: 6.0,
        baseRatePerSqCmCents: 3,
        minOrderCents: 2500,
        setupFeeCents: 2000,
        parameters: [
          { id: "m6", type: "material", name: "800μ Solid Polypropylene", code: "PP_800", multiplier: 1.0, setupFeeCents: 0, isDefault: true },
          { id: "m7", type: "material", name: "1000μ Heavy Armor Polymer", code: "PP_1000", multiplier: 1.25, setupFeeCents: 400 },
          { id: "c5", type: "cut_type", name: "Standard 4-Slot Zip-Tie Routing", code: "SLOT_4", multiplier: 1.0, setupFeeCents: 0, isDefault: true },
          { id: "c6", type: "cut_type", name: "Custom Fork Clamp Profile", code: "FORK_PROFILE", multiplier: 1.1, setupFeeCents: 500 },
        ],
        specsList: [
          "Crash-proof flexibility down to -10°C",
          "UV-cured high-adhesion pigment inks",
          "Pre-cut cable routing and zip-tie slots",
          "Tested against high-pressure jet washing",
        ],
      },
    ],
  },
  {
    slug: "stamps",
    number: "04",
    name: "Commercial Stamps",
    tagline: "Self-inking precision rubber stamps for legal and corporate notary.",
    description:
      "Clean, instant impressions with micro-porous ink cartridges. Deep vulcanized laser engraving captures intricate logos, borders, and micro-text down to 4pt.",
    equipment: "Trotec Speedy 400 Laser Engraver (1000 DPI Laser Vulcanizer)",
    typicalTurnaround: "24-48 Hours",
    substrates: [
      "Odorless Vulcanized Rubber",
      "Trodat Printy & Professional Mechanics",
      "Colop Heavy Duty Steel Core",
    ],
    specsSummary: "1000 DPI engraving depth: 1.2mm • Water-based document-proof ink",
    products: [
      {
        id: "p4",
        divisionSlug: "stamps",
        slug: "self-inking-stamp",
        name: "Professional Self-Inking Notary Stamp",
        shortTagline: "Crisp vulcanized laser rubber mounted on durable mechanics.",
        description:
          "High-capacity self-inking stamp suitable for legal firms, medical practitioners, and accounting verifications. Good for 10,000+ crisp impressions before re-inking.",
        minWidthMm: 20,
        maxWidthMm: 100,
        minHeightMm: 20,
        maxHeightMm: 80,
        defaultWidthMm: 50,
        defaultHeightMm: 30,
        bleedMm: 1.5,
        safeMarginMm: 2.0,
        baseRatePerSqCmCents: 5,
        minOrderCents: 1200,
        setupFeeCents: 500,
        parameters: [
          { id: "m8", type: "material", name: "Trodat Printy Mechanism + Black Ink", code: "TRODAT_BLK", multiplier: 1.0, setupFeeCents: 0, isDefault: true },
          { id: "m9", type: "material", name: "Trodat Printy Mechanism + Blue Ink", code: "TRODAT_BLU", multiplier: 1.0, setupFeeCents: 0 },
          { id: "m10", type: "material", name: "Heavy-Duty Steel Core Notary Frame", code: "STEEL_FRAME", multiplier: 1.6, setupFeeCents: 800 },
        ],
        specsList: [
          "Laser engraved at 1000 DPI resolution",
          "Indelible ink complying with ISO 14145-2",
          "Snap-in replaceable ink reservoir",
          "Precision guide frame for accurate stamping",
        ],
      },
    ],
  },
  {
    slug: "trophies",
    number: "05",
    name: "Laser Trophies",
    tagline: "Multi-layer acrylic and hardwood awards with precision rotary engraving.",
    description:
      "Custom podium awards, corporate recognition plaques, and sporting cups. Laser cut and diamond-polished edges paired with solid walnut and oak timber bases.",
    equipment: "Epilog Fusion Pro 48 Laser System + Diamond Edge Polisher",
    typicalTurnaround: "5-7 Business Days",
    substrates: [
      "10mm Cast PMMA Optical Acrylic",
      "Solid American Walnut Base",
      "Brushed Gold / Silver Engraving Foil",
    ],
    specsSummary: "Diamond polished edges • Vector rotary engraving • Solid hardwood",
    products: [
      {
        id: "p5",
        divisionSlug: "trophies",
        slug: "acrylic-podium-award",
        name: "Cast Acrylic & Walnut Award",
        shortTagline: "10mm diamond-polished cast acrylic with solid walnut base.",
        description:
          "Modern architectural trophy combining optical crystal-clear cast acrylic with an FSC-certified solid walnut pedestal. Laser etched on reverse side for optical depth.",
        minWidthMm: 80,
        maxWidthMm: 300,
        minHeightMm: 100,
        maxHeightMm: 400,
        defaultWidthMm: 150,
        defaultHeightMm: 200,
        bleedMm: 0.0,
        safeMarginMm: 5.0,
        baseRatePerSqCmCents: 8,
        minOrderCents: 3000,
        setupFeeCents: 1500,
        parameters: [
          { id: "m11", type: "material", name: "10mm Cast Acrylic + Walnut Base", code: "ACRYLIC_WALNUT", multiplier: 1.0, setupFeeCents: 0, isDefault: true },
          { id: "m12", type: "material", name: "15mm Ultra-Heavy Acrylic Block", code: "ACRYLIC_15MM", multiplier: 1.4, setupFeeCents: 500 },
          { id: "f3", type: "finish", name: "Frosted Reverse Vector Etch", code: "FROST_ETCH", multiplier: 1.0, setupFeeCents: 0, isDefault: true },
          { id: "f4", type: "finish", name: "UV Color Infill + Reverse Etch", code: "COLOR_INFILL", multiplier: 1.3, setupFeeCents: 800 },
        ],
        specsList: [
          "Flame & diamond polished 90° edge facets",
          "Reverse etching preserves glass-smooth front face",
          "Natural oil finished American walnut base",
          "Individual winner name personalisation available",
        ],
      },
    ],
  },
  {
    slug: "laser-cut",
    number: "06",
    name: "Laser-Cut Work",
    tagline: "Industrial cutting and etching on architectural metals, woods and plastics.",
    description:
      "Rapid prototyping, architectural models, signage stencils, and custom gaskets. Clean kerf tolerance suitable for press-fit interlocking assemblies.",
    equipment: "150W CO2 Laser Bed (1300 x 900mm) + 30W Fiber Galvo",
    typicalTurnaround: "3-5 Business Days",
    substrates: [
      "3mm / 6mm FSC Baltic Birch Plywood",
      "Anodized Architectural Aluminum",
      "Engineering Delrin & Acetal",
      "Black & Smoked Cast Acrylic Sheet",
    ],
    specsSummary: "Kerf width: 0.15mm • 1300x900mm bed • Direct DXF / AI / SVG tooling",
    products: [
      {
        id: "p6",
        divisionSlug: "laser-cut",
        slug: "precision-laser-parts",
        name: "Architectural & Industrial Laser Profile",
        shortTagline: "Precision cutting and surface etching from vector geometry.",
        description:
          "High-tolerance laser cutting for design studios, makers, and manufacturers. Upload CAD geometry or vector drawings for immediate automated nesting and laser profiling.",
        minWidthMm: 30,
        maxWidthMm: 1200,
        minHeightMm: 30,
        maxHeightMm: 900,
        defaultWidthMm: 300,
        defaultHeightMm: 200,
        bleedMm: 0.5,
        safeMarginMm: 2.0,
        baseRatePerSqCmCents: 4,
        minOrderCents: 2500,
        setupFeeCents: 2500,
        parameters: [
          { id: "m13", type: "material", name: "3mm FSC Baltic Birch Plywood", code: "BIRCH_3MM", multiplier: 1.0, setupFeeCents: 0, isDefault: true },
          { id: "m14", type: "material", name: "6mm FSC Baltic Birch Plywood", code: "BIRCH_6MM", multiplier: 1.35, setupFeeCents: 300 },
          { id: "m15", type: "material", name: "3mm Matte Black Cast Acrylic", code: "ACRYLIC_BLK", multiplier: 1.5, setupFeeCents: 500 },
          { id: "m16", type: "material", name: "1.5mm Anodized Natural Aluminum", code: "ALUM_15", multiplier: 2.2, setupFeeCents: 1500 },
        ],
        specsList: [
          "Kerf compensation applied in server CAM",
          "Accepts DXF, SVG, AI, and EPS files",
          "Interlocking slot tolerances down to 0.1mm",
          "No burn-mark edge finishing available",
        ],
      },
    ],
  },
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "g1",
    divisionSlug: "labels",
    title: "Cold Brew Glass Bottle Labels",
    client: "Peak Coffee Roasters",
    material: "100μ White Gloss Vinyl",
    dimensions: "75 x 50 mm (Oval Die-Cut)",
    finish: "Soft-Touch Matte Laminate",
    productSlug: "vinyl-stickers",
    description: "Moisture-resistant refrigerated bottle labeling with custom contour die-cutting.",
  },
  {
    id: "g2",
    divisionSlug: "labels",
    title: "Brewery Keg Identification Badges",
    client: "North Coast Craft Ales",
    material: "Holographic Metallic Foil",
    dimensions: "90 x 90 mm (Square)",
    finish: "Gloss UV Protective Barrier",
    productSlug: "vinyl-stickers",
    description: "Anti-tamper holographic security sticker with high-tack permanent adhesive.",
  },
  {
    id: "g3",
    divisionSlug: "race-numbers",
    title: "Highland Ultra 100K Bibs",
    client: "Scottish Trail Running Series",
    material: "100gsm Genuine DuPont Tyvek",
    dimensions: "210 x 148 mm (A5 Format)",
    finish: "4-Corner Hole Punch + Barcode Merge",
    productSlug: "tyvek-race-bibs",
    description: "500 runners individually merged with emergency medical blocks and timing barcode.",
  },
  {
    id: "g4",
    divisionSlug: "mtb-boards",
    title: "National Downhill Series Plates",
    client: "British Cycling Downhill Cup",
    material: "800μ Solid Polypropylene",
    dimensions: "180 x 160 mm (Handlebar Contour)",
    finish: "4 Zip-Tie Cable Routing Slots",
    productSlug: "mtb-handlebar-plates",
    description: "High-contrast race digits with corporate sponsors for high-speed finish gate cameras.",
  },
  {
    id: "g5",
    divisionSlug: "stamps",
    title: "Corporate Legal Notary Seal",
    client: "Vanguard Chambers LLP",
    material: "Trodat Printy Steel Frame",
    dimensions: "50 x 30 mm",
    finish: "1000 DPI Vulcanized Laser Rubber",
    productSlug: "self-inking-stamp",
    description: "Ultra-fine legal border and microtext seal yielding 10,000+ crisp impressions.",
  },
  {
    id: "g6",
    divisionSlug: "trophies",
    title: "Annual Design Excellence Award",
    client: "London Architectural Guild",
    material: "10mm Cast Acrylic + Walnut Base",
    dimensions: "150 x 220 mm",
    finish: "Reverse Optical Vector Etch",
    productSlug: "acrylic-podium-award",
    description: "Reverse etched acrylic giving optical 3D depth, set in hand-oiled walnut timber.",
  },
  {
    id: "g7",
    divisionSlug: "laser-cut",
    title: "Acoustic Parametric Wall Stencils",
    client: "Studio K Architects",
    material: "6mm FSC Baltic Birch Plywood",
    dimensions: "600 x 400 mm",
    finish: "Sanded Edge Clean Kerf",
    productSlug: "precision-laser-parts",
    description: "Interlocking acoustic diffuser components with 0.15mm laser kerf precision.",
  },
];

export const ALL_PRODUCTS: CatalogProduct[] = CATALOG_DIVISIONS.flatMap((d) => d.products);
