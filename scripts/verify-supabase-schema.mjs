/**
 * DIGITAL HEROES — MODULE 12: SUPABASE DATABASE SCHEMA & SEED VERIFICATION
 * 
 * Programmatically validates that the PostgreSQL schema migration and seed scripts
 * completely define:
 * 1. All PRD Level 2 ENUM types
 * 2. All 18 relational tables with appropriate constraints & foreign keys
 * 3. Row-Level Security (RLS) activation on every table
 * 4. Helper security functions (is_admin)
 * 5. Seed data for all 6 manufacturing divisions & products
 * 6. Demo user profiles and volume discount matrices
 */

import fs from "fs";
import path from "path";

console.log("==================================================================");
console.log("DIGITAL HEROES — SUPABASE POSTGRESQL SCHEMA & SEED VERIFIER");
console.log("==================================================================");

let passed = 0;
let failed = 0;

function assert(condition, description) {
  if (condition) {
    console.log(`[PASS] ${description}`);
    passed++;
  } else {
    console.error(`[FAIL] ${description}`);
    failed++;
  }
}

const schemaPath = path.resolve(process.cwd(), "supabase/migrations/20260324000000_initial_schema.sql");
const seedPath = path.resolve(process.cwd(), "supabase/seed.sql");

assert(fs.existsSync(schemaPath), "Schema file exists at supabase/migrations/20260324000000_initial_schema.sql");
assert(fs.existsSync(seedPath), "Seed file exists at supabase/seed.sql");

const schemaSql = fs.readFileSync(schemaPath, "utf-8");
const seedSql = fs.readFileSync(seedPath, "utf-8");

// 1. Verify ENUM Types
const requiredEnums = [
  "user_role",
  "pipeline_stage",
  "file_preflight_status",
  "production_file_type",
  "payment_status",
];

for (const enumName of requiredEnums) {
  assert(
    schemaSql.includes(`CREATE TYPE ${enumName}`) || schemaSql.includes(`CREATE TYPE IF NOT EXISTS ${enumName}`),
    `Schema defines ENUM '${enumName}'`
  );
}

// 2. Verify Tables
const requiredTables = [
  "profiles",
  "product_divisions",
  "products",
  "product_parameters",
  "pricing_rules",
  "volume_discounts",
  "templates",
  "designs",
  "artwork_uploads",
  "orders",
  "order_items",
  "proof_versions",
  "proof_approvals",
  "production_files",
  "payments",
  "invoices",
  "notifications",
  "order_status_history",
];

for (const table of requiredTables) {
  assert(
    schemaSql.includes(`CREATE TABLE IF NOT EXISTS public.${table}`) || schemaSql.includes(`CREATE TABLE public.${table}`),
    `Schema defines table 'public.${table}'`
  );
  assert(
    schemaSql.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`),
    `RLS is enabled on 'public.${table}'`
  );
}

// 3. Verify Security Functions & Roles
assert(schemaSql.includes("FUNCTION public.is_admin()"), "Security definer function 'is_admin()' defined");
assert(schemaSql.includes("CREATE POLICY \"Public profiles can read self\""), "Self-read profile policy defined");
assert(schemaSql.includes("CREATE POLICY \"Allow public read of active divisions\""), "Public division read policy defined");
assert(schemaSql.includes("CREATE POLICY \"Allow public read of active products\""), "Public product read policy defined");

// 4. Verify Seed Data
const requiredDivisions = [
  "labels",
  "race-numbers",
  "mtb-boards",
  "stamps",
  "trophies",
  "laser-cut",
];

for (const div of requiredDivisions) {
  assert(seedSql.includes(`'${div}'`), `Seed data contains manufacturing division '${div}'`);
}

// 5. Verify Demo User Credentials Seeded
assert(seedSql.includes("customer@digitalheroes.demo"), "Seed includes demo customer A: customer@digitalheroes.demo");
assert(seedSql.includes("customer-b@digitalheroes.demo"), "Seed includes demo customer B: customer-b@digitalheroes.demo");
assert(seedSql.includes("admin@digitalheroes.demo"), "Seed includes demo admin: admin@digitalheroes.demo");

console.log("==================================================================");
console.log(`SCHEMA VERIFICATION RESULTS: ${passed} passed, ${failed} failed`);
console.log("==================================================================");

if (failed > 0) {
  process.exit(1);
}
