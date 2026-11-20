-- ========================================================================
-- DIGITAL HEROES — SEED DEMO DATA (PRD LEVEL 2)
-- File: supabase/seed.sql
-- Description: Divisions, products, parameters, discounts, test users & orders
-- ========================================================================

-- 1. Insert Divisions
INSERT INTO public.product_divisions (id, slug, name, tagline, description, icon_name, sort_order)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'labels', 'Labels & Stickers', 'Custom die-cut waterproof vinyl, metallic foils, and roll labels.', 'Precision cut promotional, packaging and industrial labels.', 'IconTag', 1),
  ('d1000000-0000-0000-0000-000000000002', 'race-numbers', 'Race & Event Numbers', 'Waterproof Tyvek bibs with CSV variable data and barcode merging.', 'High-performance event bibs designed for all weather.', 'IconFlag', 2),
  ('d1000000-0000-0000-0000-000000000003', 'mtb-boards', 'MTB Boards', 'Heavyweight polypropylene downhill & enduro handlebar plates.', 'Direct UV printed impact polymer boards with zip-tie slots.', 'IconBike', 3),
  ('d1000000-0000-0000-0000-000000000004', 'stamps', 'Commercial Stamps', 'Self-inking precision rubber stamps for legal and corporate notary.', 'Laser vulcanized crisp stamp impressions.', 'IconStamp', 4),
  ('d1000000-0000-0000-0000-000000000005', 'trophies', 'Laser Trophies', 'Multi-layer acrylic and hardwood awards with precision rotary engraving.', 'Bespoke podium awards and corporate achievement plaques.', 'IconTrophy', 5),
  ('d1000000-0000-0000-0000-000000000006', 'laser-cut', 'Laser-Cut Work', 'Industrial cutting and etching on architectural metals, woods and plastics.', 'Custom laser profiling from CAD and vector files.', 'IconLaser', 6)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Products (Parameter-Driven)
INSERT INTO public.products (id, division_id, slug, name, description, min_width_mm, max_width_mm, min_height_mm, max_height_mm, bleed_margin_mm, safe_margin_mm)
VALUES
  ('p1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'vinyl-stickers', 'Custom Vinyl Stickers', 'Waterproof adhesive vinyl with custom contour shape.', 25.00, 1200.00, 25.00, 2500.00, 3.00, 3.00),
  ('p1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'tyvek-race-bibs', 'Enduro Tyvek Race Bibs', 'Tearproof, waterproof event numbers with variable data merge.', 100.00, 300.00, 100.00, 300.00, 3.00, 5.00),
  ('p1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003', 'mtb-handlebar-plates', 'Gravity Downhill Number Board', 'Impact resistant 800μ polypropylene plate with 4-hole zip tie punch.', 120.00, 250.00, 120.00, 220.00, 3.00, 6.00),
  ('p1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000004', 'self-inking-stamp', 'Professional Self-Inking Stamp', 'Laser vulcanized rubber mounted on Trodat mechanics.', 20.00, 100.00, 20.00, 80.00, 1.50, 2.00),
  ('p1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000005', 'acrylic-podium-award', 'Cast Acrylic Trophy', 'Optically clear 10mm cast PMMA acrylic with walnut base.', 80.00, 300.00, 100.00, 400.00, 0.00, 5.00),
  ('p1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000006', 'precision-laser-parts', 'Architectural Laser Profile', 'Precision CNC laser cut birch ply, acrylic, or brass.', 30.00, 1200.00, 30.00, 900.00, 0.50, 2.00)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Product Parameters (Materials & Finishes)
INSERT INTO public.product_parameters (id, product_id, parameter_type, name, code, price_multiplier, setup_cost_cents, is_default, sort_order)
VALUES
  -- Vinyl Stickers
  ('pm000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'material', 'White Gloss Vinyl (100μ)', 'GLOSS_VINYL', 1.000, 0, true, 1),
  ('pm000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000001', 'material', 'Matte Finish Vinyl (100μ)', 'MATTE_VINYL', 1.050, 0, false, 2),
  ('pm000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000001', 'material', 'Holographic Metallic Vinyl', 'HOLO_VINYL', 1.400, 500, false, 3),
  
  -- Race Bibs
  ('pm000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000002', 'material', 'Tyvek Waterproof (100gsm)', 'TYVEK_100', 1.000, 0, true, 1),
  ('pm000000-0000-0000-0000-000000000005', 'p1000000-0000-0000-0000-000000000002', 'material', 'Tyvek Heavy Duty (120gsm)', 'TYVEK_120', 1.200, 0, false, 2),

  -- MTB Boards
  ('pm000000-0000-0000-0000-000000000006', 'p1000000-0000-0000-0000-000000000003', 'material', '800μ Solid Polypropylene', 'PP_800', 1.000, 0, true, 1),
  ('pm000000-0000-0000-0000-000000000007', 'p1000000-0000-0000-0000-000000000003', 'material', '1000μ Pro Downhill Polymer', 'PP_1000', 1.250, 0, false, 2)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Pricing Rules & Volume Discounts
INSERT INTO public.pricing_rules (product_id, base_rate_per_sqcm_cents, min_order_cents, setup_fee_cents, vat_percentage)
VALUES
  ('p1000000-0000-0000-0000-000000000001', 2, 1500, 1200, 20.00), -- 2p per sq cm
  ('p1000000-0000-0000-0000-000000000002', 1, 2000, 1500, 20.00),
  ('p1000000-0000-0000-0000-000000000003', 3, 2500, 2000, 20.00),
  ('p1000000-0000-0000-0000-000000000004', 5, 1200, 500, 20.00),
  ('p1000000-0000-0000-0000-000000000005', 8, 3000, 1500, 20.00),
  ('p1000000-0000-0000-0000-000000000006', 4, 2500, 2500, 20.00)
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO public.volume_discounts (division_id, min_quantity, discount_percentage)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 100, 8.00),
  ('d1000000-0000-0000-0000-000000000001', 250, 15.00),
  ('d1000000-0000-0000-0000-000000000001', 500, 25.00),
  ('d1000000-0000-0000-0000-000000000001', 1000, 35.00)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Test User Profiles (Customer A, Customer B, and Admin)
-- Customer A
INSERT INTO public.profiles (id, email, full_name, company_name, phone, role)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'customer@digitalheroes.demo', 'Alex Miller', 'Peak Coffee Roasters', '+44 7700 900123', 'customer'),
  ('00000000-0000-0000-0000-000000000002', 'customer-b@digitalheroes.demo', 'Jordan Lee', 'Alpine Enduro Club', '+44 7700 900456', 'customer'),
  ('00000000-0000-0000-0000-000000000099', 'admin@digitalheroes.demo', 'Sarah Connor', 'Digital Heroes Factory Staff', '+44 7700 900999', 'admin')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Demo Orders & Pipeline Jobs
-- Order 1: Approved and in PRODUCTION
INSERT INTO public.orders (id, order_number, customer_id, stage, subtotal_cents, discount_cents, vat_cents, total_cents, currency)
VALUES
  ('o1000000-0000-0000-0000-000000000001', 'ORD-2026-0891', '00000000-0000-0000-0000-000000000001', 'PRODUCTION', 14000, 0, 2800, 16800, 'GBP')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_items (id, order_id, product_id, configured_width_mm, configured_height_mm, quantity, unit_price_cents, line_total_cents, configuration_json)
VALUES
  ('oi000000-0000-0000-0000-000000000001', 'o1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 75.00, 50.00, 1000, 14, 14000, '{"material": "GLOSS_VINYL", "shape": "oval", "bleed_mm": 3.0}')
ON CONFLICT (id) DO NOTHING;

-- Proof v1 (superseded) and Proof v2 (Approved)
INSERT INTO public.proof_versions (id, order_id, order_item_id, version_number, proof_preview_url, change_notes)
VALUES
  ('pv000000-0000-0000-0000-000000000001', 'o1000000-0000-0000-0000-000000000001', 'oi000000-0000-0000-0000-000000000001', 1, '/proofs/ORD-0891_v1.png', 'Initial proof rendering'),
  ('pv000000-0000-0000-0000-000000000002', 'o1000000-0000-0000-0000-000000000001', 'oi000000-0000-0000-0000-000000000001', 2, '/proofs/ORD-0891_v2.png', 'Adjusted barcode offset and increased contrast')
ON CONFLICT (id) DO NOTHING;

-- Approval for v2
INSERT INTO public.proof_approvals (proof_version_id, approved_by_user_id, approved_at, digital_signature_hash, customer_notes)
VALUES
  ('pv000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', now(), 'sha256:9f8c12a83bd82c', 'Looks perfect, proceed to print')
ON CONFLICT (proof_version_id) DO NOTHING;

-- Production File: UNLOCKED because v2 is approved
INSERT INTO public.production_files (id, order_id, order_item_id, proof_version_id, file_type, storage_path, file_name, resolution_dpi, bleed_mm, is_unlocked)
VALUES
  ('pf000000-0000-0000-0000-000000000001', 'o1000000-0000-0000-0000-000000000001', 'oi000000-0000-0000-0000-000000000001', 'pv000000-0000-0000-0000-000000000002', 'PDF', 'production/ORD-2026-0891_Labels_20260323_Output.pdf', 'ORD-2026-0891_Labels_20260323_Output.pdf', 300, 3.00, true)
ON CONFLICT (id) DO NOTHING;

-- Order 2: In PROOF stage, proof v1 is PENDING approval
INSERT INTO public.orders (id, order_number, customer_id, stage, subtotal_cents, discount_cents, vat_cents, total_cents, currency)
VALUES
  ('o1000000-0000-0000-0000-000000000002', 'ORD-2026-0892', '00000000-0000-0000-0000-000000000001', 'PROOF', 18750, 0, 3750, 22500, 'GBP')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_items (id, order_id, product_id, configured_width_mm, configured_height_mm, quantity, unit_price_cents, line_total_cents, configuration_json)
VALUES
  ('oi000000-0000-0000-0000-000000000002', 'o1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000002', 210.00, 148.00, 500, 45, 18750, '{"material": "TYVEK_100", "csv_merge": true, "rows": 500}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.proof_versions (id, order_id, order_item_id, version_number, proof_preview_url, change_notes)
VALUES
  ('pv000000-0000-0000-0000-000000000003', 'o1000000-0000-0000-0000-000000000002', 'oi000000-0000-0000-0000-000000000002', 1, '/proofs/ORD-0892_v1.png', 'Variable merge sample: Runners 001 - 010')
ON CONFLICT (id) DO NOTHING;

-- Production File: LOCKED because proof is NOT approved yet
INSERT INTO public.production_files (id, order_id, order_item_id, proof_version_id, file_type, storage_path, file_name, resolution_dpi, bleed_mm, is_unlocked)
VALUES
  ('pf000000-0000-0000-0000-000000000002', 'o1000000-0000-0000-0000-000000000002', 'oi000000-0000-0000-0000-000000000002', 'pv000000-0000-0000-0000-000000000003', 'PDF', 'production/ORD-2026-0892_RaceBibs_20260324_Output.pdf', 'ORD-2026-0892_RaceBibs_20260324_Output.pdf', 300, 3.00, false)
ON CONFLICT (id) DO NOTHING;
