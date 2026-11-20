import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Read .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local file not found!");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const equalsIdx = trimmed.indexOf("=");
  if (equalsIdx > 0) {
    const key = trimmed.slice(0, equalsIdx).trim();
    const val = trimmed.slice(equalsIdx + 1).trim();
    envVars[key] = val;
  }
}

const supabaseUrl = envVars["NEXT_PUBLIC_SUPABASE_URL"];
const anonKey = envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const serviceKey = envVars["SUPABASE_SERVICE_ROLE_KEY"];

console.log("==================================================================");
console.log("DIGITAL HEROES — SUPABASE LIVE CONNECTION VERIFIER");
console.log("==================================================================");
console.log(`Target URL: ${supabaseUrl}`);
console.log(`Anon Key detected: ${anonKey ? anonKey.slice(0, 15) + "..." : "MISSING"}`);
console.log(`Service Key detected: ${serviceKey ? serviceKey.slice(0, 15) + "..." : "MISSING"}`);
console.log("------------------------------------------------------------------");

async function runTests() {
  let passed = 0;
  let failed = 0;

  // 1. Client initialization
  const supabase = createClient(supabaseUrl, anonKey);
  const supabaseAdmin = createClient(supabaseUrl, serviceKey);

  console.log("\n[1/4] Testing Public Client Query (product_divisions)...");
  try {
    const { data, error } = await supabase.from("product_divisions").select("id, slug, name").limit(10);
    if (error) {
      console.error("❌ Public query error:", error.message);
      failed++;
    } else {
      console.log(`✅ Success! Retrieved ${data.length} product divisions from Supabase:`);
      data.forEach(d => console.log(`   - ${d.name} (${d.slug})`));
      passed++;
    }
  } catch (err) {
    console.error("❌ Network or connection exception:", err.message);
    failed++;
  }

  console.log("\n[2/4] Testing Products Catalog Query (products)...");
  try {
    const { data, error } = await supabase.from("products").select("id, slug, name").limit(10);
    if (error) {
      console.error("❌ Products query error:", error.message);
      failed++;
    } else {
      console.log(`✅ Success! Retrieved ${data.length} products from Supabase:`);
      data.forEach(p => console.log(`   - ${p.name} (${p.slug})`));
      passed++;
    }
  } catch (err) {
    console.error("❌ Network or connection exception:", err.message);
    failed++;
  }

  console.log("\n[3/4] Testing Admin Privileged Client (profiles via service_role)...");
  try {
    const { data, error } = await supabaseAdmin.from("profiles").select("id, email, full_name, role").limit(5);
    if (error) {
      console.error("❌ Service role query error:", error.message);
      failed++;
    } else {
      console.log(`✅ Success! Privileged access verified. Found ${data.length} profiles:`);
      data.forEach(u => console.log(`   - ${u.full_name} <${u.email}> (${u.role})`));
      passed++;
    }
  } catch (err) {
    console.error("❌ Service role query exception:", err.message);
    failed++;
  }

  console.log("\n[4/4] Testing Storage Buckets...");
  try {
    const { data, error } = await supabaseAdmin.storage.listBuckets();
    if (error) {
      console.warn("⚠️ Storage bucket check warning:", error.message);
    } else {
      const bucketNames = data.map(b => b.name);
      console.log(`✅ Success! Found ${data.length} storage buckets: ${bucketNames.join(", ") || "(none yet)"}`);
      passed++;
    }
  } catch (err) {
    console.warn("⚠️ Storage bucket check exception:", err.message);
  }

  console.log("\n==================================================================");
  if (failed === 0) {
    console.log("🎉 ALL CONNECTION CHECKS PASSED: Live Supabase is fully operational!");
  } else {
    console.log(`⚠️ Connection checks completed with ${failed} error(s).`);
  }
  console.log("==================================================================");
}

runTests();
