# Digital Heroes (Level 2) — Web-to-Print E-Commerce & Factory Production Platform

> **Boutique-Industrial Web-to-Print Storefront and Multi-Stage Factory Floor Production Pipeline.**  
> Built for bespoke UK manufacturing across **6 core product divisions**: custom labels, race bibs, MTB boards, commercial stamps, laser-cut acrylic trophies, and architectural laser profiling.

---

## 1. Executive System Overview

Digital Heroes Level 2 is a modern, high-precision Web-to-Print platform that bridges customer-facing parametric configuration with direct factory floor RIP (Raster Image Processor) and CNC machinery queues.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 DIGITAL HEROES ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  CUSTOMER STOREFRONT                        SERVER-SIDE CORE                    FACTORY FLOOR CONSOLE
┌──────────────────────┐                  ┌────────────────────┐               ┌───────────────────────┐
│ • Parametric Catalog │                  │ • Pricing Engine   │               │ • 6-Stage Kanban      │
│ • Live Pricing Math  │ ───────────────> │   (Zero SKU Bloat) │ ────────────> │   (Quote → Completed) │
│ • In-Browser Canvas  │                  │ • Prepress 300 DPI │               │ • Machine Dispatch    │
│   (Bleed/Safe Zones) │                  │ • CSV VDP Engine   │               │ • Download Factory PDF│
│ • Proof Approval     │                  │ • RLS & IDOR Guard │               │ • Email Outbox Log    │
└──────────────────────┘                  └────────────────────┘               └───────────────────────┘
           │                                         │                                     │
           ▼                                         ▼                                     ▼
   Next.js 16 App Router                     Supabase PostgreSQL                      Roland / HP / Trotec
   Tailwind CSS v4                           Row-Level Security                      Industrial Presses
```

### Core Architecture Highlights

- **Zero SKU Bloat**: Unlike legacy print platforms that require hundreds of static SKUs per dimension/finish combo, Digital Heroes uses a single parametric model per product. Area, volume discounts, substrate weights, and cut styles are computed dynamically on the server.
- **Prepress Approval Gate (HTTP 423 Locked)**: Production-ready 300 DPI print files remain strictly locked and inaccessible on the server until the customer signs the digital proof.
- **Server-Authoritative Pricing Anti-Tampering**: Subtotals, volume tier discounts, and 20% VAT are computed exclusively on the server in integer cents. Client-injected prices are completely ignored.
- **In-Browser Vector/Raster Designer**: Client-side canvas enforcing 3mm bleed margins, cut bounds, safe zones, and instant preflight file checks.
- **High-Throughput Variable-Data Engine**: Merges CSV datasets (up to 5,000 rows) with vector templates to generate runner bibs and race plates with sequential barcodes.
- **Multi-Tenant RLS & IDOR Defense**: Strict Row-Level Security separates public visitors, individual customer accounts, and factory staff.

---

## 2. The 6 Manufacturing Divisions

| Division Slug | Manufacturing Division | Primary Substrates & Machinery | Key Factory Constraints |
| :--- | :--- | :--- | :--- |
| `labels` | **Labels & Stickers** | Gloss/Matte/Holographic Vinyl • Roland TrueVIS | 25mm to 1200mm width, 3mm bleed |
| `race-numbers` | **Race & Event Numbers** | Tearproof Tyvek 100/120gsm • HP Latex 365 | CSV variable merge, 4-hole punch |
| `mtb-boards` | **MTB Boards** | 800μ/1000μ Polypropylene • Direct Flatbed UV | Cable-tie cut slots, contour punch |
| `stamps` | **Commercial Stamps** | Laser-vulcanized rubber • Trodat mechanics | 20mm to 100mm, 0.2mm detail tolerance |
| `trophies` | **Laser Trophies** | 10mm Cast PMMA Acrylic + Hardwood Walnut | Flame polished edges, CNC laser rotary |
| `laser-cut` | **Laser-Cut Work** | Birch ply, cast brass, acetal • Trotec Speedy 400 | Kerf compensation, vector stroke DXF/PDF |

---

## 3. Technology Stack

- **Framework**: Next.js 16.4.6 (App Router, Turbopack, React Server Components)
- **Runtime**: React 19.3.0
- **Styling**: Tailwind CSS v4.3.3 (Boutique-industrial dark theme with high-contrast safety accents)
- **Database**: Supabase PostgreSQL with native Row-Level Security (RLS)
- **Scripting & Engine**: Node.js ESM (`--experimental-strip-types` for fast, lightweight native execution)
- **PDF & Prepress**: High-resolution vector and bitmap prepress layout engine with 3mm bleed boxes and trim marks
- **Code Quality**: ESLint v9 (0 errors, 0 warnings standard)

---

## 4. Quickstart & Local Development

### Prerequisites

- Node.js >= 20.10.0 (Node 22 or 24 LTS recommended)
- npm >= 10.0.0

### Installation

```bash
# Clone repository
git clone https://github.com/digitalheroes/dighero.git
cd dighero

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Demo Personas & Test Credentials

The system includes pre-seeded authentication states and 1-click role switchers on the `/login` page:

| Persona | Role | Email | Company / Use Case | Default Route |
| :--- | :--- | :--- | :--- | :--- |
| **Customer A** | `customer` | `customer@digitalheroes.demo` | Peak Coffee Roasters (Stickers, Bibs) | `/customer/dashboard` |
| **Customer B** | `customer` | `customer-b@digitalheroes.demo` | Alpine Enduro Club (Downhill MTB) | `/customer/dashboard` |
| **Admin** | `admin` | `admin@digitalheroes.demo` | Digital Heroes Factory Production Floor | `/admin/production` |

---

## 6. Automated Test Suites & Verification

The project includes **10 comprehensive automated test suites** covering all aspects of the pipeline:

```bash
# Run all 10 test suites
npm test

# Run individual test suites
npm run test:schema        # Supabase PostgreSQL schema, RLS, and seed data
npm run test:permissions   # RLS policy and cross-customer isolation tests
npm run test:pricing       # Parametric pricing, volume tiers, and boundary math
npm run test:designer      # Preflight checks, bleed validation, and safe margins
npm run test:proofs        # Proof revision cycle (v1->v2) & approval gate (HTTP 423)
npm run test:orders        # Order capture, Stripe simulated checkout & 1-click reorder
npm run test:print         # 300 DPI PDF generation & 5,000-runner CSV data merge
npm run test:pipeline      # 6-stage Kanban, machine routing, and throughput reports
npm run test:email         # Transactional email templates, CRLF guards, and outbox
npm run test:security      # Programmatic penetration tests across 7 attack vectors
```

### Test Suite Summary

- **Total Automated Tests**: 265+ test assertions
- **Test Pass Rate**: 100%
- **Lint Status**: 0 errors, 0 warnings (`npm run lint`)
- **Build Status**: Clean production build (`npm run build`)

---

## 7. Supabase Database Setup & Migrations

### Local / Remote Migration

All database tables, constraints, ENUM types, and Row-Level Security policies are defined in:
`supabase/migrations/20260324000000_initial_schema.sql`

To deploy schema and seed data to your Supabase project:

```bash
# Option A: Using Supabase CLI
supabase db push
supabase db seed

# Option B: Direct SQL Execution
# Execute 'supabase/migrations/20260324000000_initial_schema.sql' in the Supabase SQL Editor
# Followed by 'supabase/seed.sql'
```

### Schema Architecture

- `profiles`: Customer and administrator accounts with role assignment (`customer` | `admin`).
- `product_divisions`: The 6 manufacturing divisions.
- `products`: Base products defining minimum/maximum physical bounds and bleed/safe zones.
- `product_parameters`: Dynamic materials, finishes, and cut types with price multipliers and setup fees.
- `pricing_rules`: Base rate per cm², minimum order floor (£15.00), setup fees, and 20% VAT.
- `volume_discounts`: Quantity break matrix (100 -> 8%, 250 -> 15%, 500 -> 25%, 1000 -> 35%).
- `orders` & `order_items`: Master order records and configured line items.
- `proof_versions` & `proof_approvals`: Multi-version proof engine with cryptographic SHA-256 signatures.
- `production_files`: RIP print files guarded by `is_unlocked` Boolean gate.
- `notifications`: Real-time customer lifecycle alerts with RLS privacy.

---

## 8. Security & Access Control Model

1. **Insecure Direct Object References (IDOR)**:
   All order retrieval, invoice generation, proof signing, change requests, and reordering APIs validate the caller's session ID against the resource's `customer_id`. Unauthorized cross-customer requests throw `SECURITY_VIOLATION` or `ACCESS_DENIED`.
2. **Prepress Approval Gate**:
   Raw production files (`/api/production/download/[orderId]`) return `HTTP 423 Locked` if the proof is not approved, and `HTTP 403 Forbidden` if requested by a non-staff customer account.
3. **Anti-Tampering Pricing**:
   Pricing calculations are strictly server-authoritative. Injected client prices are discarded.
4. **Input Sanitization**:
   - Filenames: Directory traversal sequences (`..`, `/`, `\`) are stripped.
   - CSV Merging: Leading formula characters (`=`, `@`, `+`, `-`, `\t`) are prefixed with `'` to neutralize formula execution.
   - Emails: RFC 5322 CRLF (`\r\n`) sequences are rejected with `SECURITY_VIOLATION`.
5. **Rate Limiting**:
   Sensitive API endpoints enforce an in-memory sliding window rate limit of 60 requests/minute per client.

---

## 9. Production Deployment Runbook (Vercel)

### Step 1: Connect Repository to Vercel

```bash
vercel
```

### Step 2: Configure Environment Variables in Vercel

Set the following variables in the Vercel Project Settings:

```ini
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-domain.com

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

EMAIL_DISPATCH_PROVIDER=resend
RESEND_API_KEY=re_...
EMAIL_FROM_ADDRESS=orders@your-domain.com
EMAIL_FROM_NAME="Digital Heroes Print Co."
```

### Step 3: Trigger Production Deployment

```bash
vercel --prod
```

---

## 10. Operational Limitations & Known Factory Constraints

- **Roll Width Boundaries**: Maximum printable roll width on Roland TrueVIS and HP Latex is 1,200mm. Orders requesting dimensions > 1,200mm are automatically rejected.
- **Bleed Allowance**: Minimum required bleed is 3.0mm on all perimeter edges for die-cut items.
- **CSV Runner Limit**: In-memory variable-data merging supports batches up to 5,000 rows. Batches exceeding 5,000 rows must be split into multiple print runs.
- **Color Space Conversion**: Uploaded RGB raster assets are automatically mapped to Fogra39 CMYK during RIP rendering; out-of-gamut warnings are surfaced in preflight.

---

## 11. Project Directory Structure

```
dighero/
├── app/
│   ├── (public storefront)
│   │   ├── divisions/[slug]/      # Division landing pages
│   │   ├── products/[slug]/       # Parametric configurator & live price calc
│   │   ├── designer/              # In-browser canvas & preflight engine
│   │   ├── checkout/              # Stripe checkout & order confirmation
│   │   ├── gallery/               # Material swatch & sample gallery
│   │   └── login/                 # 1-click persona switcher & auth
│   ├── customer/
│   │   └── dashboard/             # Order tracker, proof approval gate, reorders
│   ├── admin/
│   │   ├── production/            # Factory floor Kanban, machine queue, reports
│   │   └── security/              # Automated pen-test runner & audit console
│   └── api/
│       ├── pricing/calculate/     # Server-authoritative pricing math
│       ├── checkout/              # Session creation & webhook listener
│       ├── proofs/                # Proof approvals (v1->v2) & change requests
│       ├── production/            # 300 DPI PDF generation & download gate
│       ├── variable-data/         # CSV parser & runner bib merge worker
│       ├── notifications/         # Customer in-app notification center
│       └── admin/                 # Machine allocation & security pen-test API
├── components/
│   ├── catalog/                   # Product configurators & material selectors
│   ├── designer/                  # In-browser canvas, bleed/safe zones
│   ├── navigation/                # Public nav, customer nav, admin header
│   └── ui/                        # Boutique-industrial UI components
├── lib/
│   ├── auth/                      # Session guards & role assertion
│   ├── catalog/                   # 6 divisions & product models
│   ├── designer/                  # Safe margins & preflight validation
│   ├── email/                     # 5 transactional templates & outbox engine
│   ├── orders/                    # Order store, Stripe capture & reorders
│   ├── pricing/                   # Server pricing engine & volume discounts
│   ├── print-engine/              # PDF prepress engine & CSV variable-data
│   ├── production/                # Machine lines, stages & Kanban state
│   ├── proofs/                    # Multi-version proof store & gate lock
│   ├── security/                  # Programmatic pen-test audit engine & rate limiter
│   └── supabase/                  # Browser client & privileged server admin client
├── scripts/                       # 10 automated test suites (265+ assertions)
├── supabase/
│   ├── migrations/                # Complete PostgreSQL schema & RLS policies
│   └── seed.sql                   # Seed catalog, products, parameters & demo users
└── .env.example                   # Complete environment configuration template
```

---

## 12. Support & Maintenance

For technical inquiries or factory floor machinery integration:
- **Factory Floor Ops**: `factory-ops@digitalheroes.co.uk`
- **Engineering**: `dev@digitalheroes.co.uk`
- **Lead Time SLA**: Standard orders 48h dispatch; Custom quote review 2h SLA.

&copy; 2026 Digital Heroes Print Co. All rights reserved.
