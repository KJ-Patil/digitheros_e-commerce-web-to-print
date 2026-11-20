-- ========================================================================
-- DIGITAL HEROES — COMPLETE POSTGRESQL DATABASE SCHEMA (PRD LEVEL 2)
-- Migration: 20260324000000_initial_schema.sql
-- Description: Core tables, constraints, indexes, and Row-Level Security (RLS)
-- Idempotent: Can be run multiple times safely without errors
-- ========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------
-- 1. ENUMS (Safe idempotent creation)
-- ------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE pipeline_stage AS ENUM (
    'QUOTE',
    'ORDER',
    'ARTWORK',
    'PROOF',
    'PRODUCTION',
    'COMPLETED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE file_preflight_status AS ENUM (
    'PENDING',
    'PASSED',
    'WARNING',
    'FAILED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE production_file_type AS ENUM (
    'PDF',
    'PNG',
    'CSV_MERGE_ZIP'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'SUCCEEDED',
    'FAILED',
    'REFUNDED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------
-- 2. PROFILES & ROLES (linked to auth.users)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------
-- 3. PRODUCT DIVISIONS (The 6 PRD Divisions)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_divisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------
-- 4. PARAMETER-DRIVEN PRODUCTS (No SKU Bloat)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  division_id UUID NOT NULL REFERENCES public.product_divisions(id) ON DELETE RESTRICT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  min_width_mm NUMERIC(8,2) NOT NULL DEFAULT 10.00,
  max_width_mm NUMERIC(8,2) NOT NULL DEFAULT 2000.00,
  min_height_mm NUMERIC(8,2) NOT NULL DEFAULT 10.00,
  max_height_mm NUMERIC(8,2) NOT NULL DEFAULT 3000.00,
  bleed_margin_mm NUMERIC(6,2) NOT NULL DEFAULT 3.00,
  safe_margin_mm NUMERIC(6,2) NOT NULL DEFAULT 3.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------
-- 5. PRODUCT PARAMETERS (Materials, Finishes, Mounts, Cut Styles)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_parameters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  parameter_type TEXT NOT NULL, -- e.g. 'material', 'finish', 'cut_type', 'mounting'
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  price_multiplier NUMERIC(6,3) NOT NULL DEFAULT 1.000,
  setup_cost_cents INT NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0
);

-- ------------------------------------------------------------------------
-- 6. PRICING RULES & VOLUME DISCOUNTS
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  base_rate_per_sqcm_cents INT NOT NULL DEFAULT 2, -- e.g. 2 cents (£0.02) per sq cm
  min_order_cents INT NOT NULL DEFAULT 1500,       -- £15.00 min order
  setup_fee_cents INT NOT NULL DEFAULT 1000,       -- £10.00 base setup
  vat_percentage NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.volume_discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  division_id UUID REFERENCES public.product_divisions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  min_quantity INT NOT NULL,
  discount_percentage NUMERIC(5,2) NOT NULL, -- e.g. 15.00 for 15%
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------
-- 7. TEMPLATES
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  division_id UUID NOT NULL REFERENCES public.product_divisions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  default_width_mm NUMERIC(8,2) NOT NULL,
  default_height_mm NUMERIC(8,2) NOT NULL,
  canvas_schema_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  thumbnail_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------
-- 8. CUSTOMER DESIGNS & ARTWORK UPLOADS
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  canvas_state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview_thumbnail_url TEXT,
  is_saved_template BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.artwork_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  design_id UUID REFERENCES public.designs(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  preflight_status file_preflight_status NOT NULL DEFAULT 'PENDING',
  preflight_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------
-- 9. ORDERS & ORDER ITEMS
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  stage pipeline_stage NOT NULL DEFAULT 'QUOTE',
  subtotal_cents INT NOT NULL DEFAULT 0,
  discount_cents INT NOT NULL DEFAULT 0,
  vat_cents INT NOT NULL DEFAULT 0,
  total_cents INT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  design_id UUID REFERENCES public.designs(id) ON DELETE SET NULL,
  configured_width_mm NUMERIC(8,2) NOT NULL,
  configured_height_mm NUMERIC(8,2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price_cents INT NOT NULL,
  line_total_cents INT NOT NULL,
  configuration_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------
-- 10. PROOF VERSIONS & APPROVALS (The Approval Gate)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.proof_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  proof_preview_url TEXT NOT NULL,
  change_notes TEXT,
  created_by_user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_item_proof_version UNIQUE(order_item_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.proof_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proof_version_id UUID NOT NULL UNIQUE REFERENCES public.proof_versions(id) ON DELETE CASCADE,
  approved_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  digital_signature_hash TEXT NOT NULL,
  customer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------
-- 11. PRODUCTION FILES (LOCKED until proof is approved)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.production_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  proof_version_id UUID REFERENCES public.proof_versions(id) ON DELETE SET NULL,
  file_type production_file_type NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  resolution_dpi INT NOT NULL DEFAULT 300,
  bleed_mm NUMERIC(6,2) NOT NULL DEFAULT 3.00,
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------
-- 12. PAYMENTS & INVOICES (Xero-ready)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL DEFAULT 'stripe',
  transaction_id TEXT NOT NULL UNIQUE,
  amount_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  status payment_status NOT NULL DEFAULT 'PENDING',
  payment_method_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE RESTRICT,
  invoice_number TEXT NOT NULL UNIQUE,
  subtotal_cents INT NOT NULL,
  vat_cents INT NOT NULL,
  total_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  pdf_storage_path TEXT,
  xero_contact_id TEXT,
  xero_invoice_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------
-- 13. NOTIFICATIONS & ORDER AUDIT HISTORY
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_stage pipeline_stage,
  new_stage pipeline_stage NOT NULL,
  changed_by_user_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volume_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public profiles can read self" ON public.profiles;
CREATE POLICY "Public profiles can read self"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can update self" ON public.profiles;
CREATE POLICY "Users can update self"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------
-- PUBLIC CATALOG POLICIES (Divisions, Products, Rules, Templates)
-- ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read of active divisions" ON public.product_divisions;
CREATE POLICY "Allow public read of active divisions"
  ON public.product_divisions FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Allow public read of active products" ON public.products;
CREATE POLICY "Allow public read of active products"
  ON public.products FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Allow public read of product parameters" ON public.product_parameters;
CREATE POLICY "Allow public read of product parameters"
  ON public.product_parameters FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public read of pricing rules" ON public.pricing_rules;
CREATE POLICY "Allow public read of pricing rules"
  ON public.pricing_rules FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public read of volume discounts" ON public.volume_discounts;
CREATE POLICY "Allow public read of volume discounts"
  ON public.volume_discounts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public read of active templates" ON public.templates;
CREATE POLICY "Allow public read of active templates"
  ON public.templates FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage catalog" ON public.product_divisions;
CREATE POLICY "Admins can manage catalog"
  ON public.product_divisions FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------
-- DESIGNS & ARTWORK POLICIES
-- ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers can manage own designs" ON public.designs;
CREATE POLICY "Customers can manage own designs"
  ON public.designs FOR ALL
  USING (customer_id = auth.uid() OR public.is_admin())
  WITH CHECK (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Customers can manage own artwork uploads" ON public.artwork_uploads;
CREATE POLICY "Customers can manage own artwork uploads"
  ON public.artwork_uploads FOR ALL
  USING (customer_id = auth.uid() OR public.is_admin())
  WITH CHECK (customer_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------
-- ORDERS & ORDER ITEMS POLICIES
-- ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers can read own orders" ON public.orders;
CREATE POLICY "Customers can read own orders"
  ON public.orders FOR SELECT
  USING (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Customers can create own orders" ON public.orders;
CREATE POLICY "Customers can create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Customers can read own order items" ON public.order_items;
CREATE POLICY "Customers can read own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.customer_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Customers can insert own order items" ON public.order_items;
CREATE POLICY "Customers can insert own order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.customer_id = auth.uid() OR public.is_admin())
    )
  );

-- ------------------------------------------------------------------------
-- PROOF VERSIONS & APPROVALS POLICIES
-- ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers can read proofs for own orders" ON public.proof_versions;
CREATE POLICY "Customers can read proofs for own orders"
  ON public.proof_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = proof_versions.order_id
      AND (orders.customer_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Customers can insert approvals for own proofs" ON public.proof_approvals;
CREATE POLICY "Customers can insert approvals for own proofs"
  ON public.proof_approvals FOR INSERT
  WITH CHECK (
    approved_by_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.proof_versions pv
      JOIN public.orders o ON o.id = pv.order_id
      WHERE pv.id = proof_version_id
      AND (o.customer_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Customers can read approvals for own proofs" ON public.proof_approvals;
CREATE POLICY "Customers can read approvals for own proofs"
  ON public.proof_approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.proof_versions pv
      JOIN public.orders o ON o.id = pv.order_id
      WHERE pv.id = proof_approvals.proof_version_id
      AND (o.customer_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Admins can manage all proof versions and approvals" ON public.proof_versions;
CREATE POLICY "Admins can manage all proof versions and approvals"
  ON public.proof_versions FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------
-- PRODUCTION FILES POLICIES (STRICT STAFF-ONLY RULE)
-- Note: Customers have ZERO SELECT access to production_files!
-- ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Production files restricted to admin staff only" ON public.production_files;
CREATE POLICY "Production files restricted to admin staff only"
  ON public.production_files FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------
-- PAYMENTS & INVOICES POLICIES
-- ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers can read own payments" ON public.payments;
CREATE POLICY "Customers can read own payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
      AND (orders.customer_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Customers can read own invoices" ON public.invoices;
CREATE POLICY "Customers can read own invoices"
  ON public.invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = invoices.order_id
      AND (orders.customer_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Admins can manage all invoices and payments" ON public.invoices;
CREATE POLICY "Admins can manage all invoices and payments"
  ON public.invoices FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------
-- NOTIFICATIONS POLICIES
-- ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
CREATE POLICY "Users can manage own notifications"
  ON public.notifications FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------
-- ORDER AUDIT HISTORY POLICIES
-- ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers can view stage history of own orders" ON public.order_status_history;
CREATE POLICY "Customers can view stage history of own orders"
  ON public.order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_status_history.order_id
      AND (orders.customer_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Admins can insert and manage order status history" ON public.order_status_history;
CREATE POLICY "Admins can insert and manage order status history"
  ON public.order_status_history FOR ALL
  USING (public.is_admin());
