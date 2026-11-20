export type UserRole = "customer" | "admin";

export type PipelineStage =
  | "QUOTE"
  | "ORDER"
  | "ARTWORK"
  | "PROOF"
  | "PRODUCTION"
  | "COMPLETED";

export type PreflightStatus = "PENDING" | "PASSED" | "WARNING" | "FAILED";

export type ProductionFileType = "PDF" | "PNG" | "CSV_MERGE_ZIP";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "REFUNDED";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  company_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface ProductDivision {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon_name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  division_id: string;
  slug: string;
  name: string;
  description: string;
  min_width_mm: number;
  max_width_mm: number;
  min_height_mm: number;
  max_height_mm: number;
  bleed_margin_mm: number;
  safe_margin_mm: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductParameter {
  id: string;
  product_id: string;
  parameter_type: "material" | "finish" | "cut_type" | "mounting" | string;
  name: string;
  code: string;
  price_multiplier: number;
  setup_cost_cents: number;
  is_default: boolean;
  sort_order: number;
}

export interface PricingRule {
  id: string;
  product_id: string;
  base_rate_per_sqcm_cents: number;
  min_order_cents: number;
  setup_fee_cents: number;
  vat_percentage: number;
  created_at: string;
}

export interface VolumeDiscount {
  id: string;
  division_id: string | null;
  product_id: string | null;
  min_quantity: number;
  discount_percentage: number;
  created_at: string;
}

export interface Design {
  id: string;
  customer_id: string;
  product_id: string;
  name: string;
  canvas_state_json: Record<string, unknown>;
  preview_thumbnail_url: string | null;
  is_saved_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArtworkUpload {
  id: string;
  customer_id: string;
  design_id: string | null;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  storage_path: string;
  preflight_status: PreflightStatus;
  preflight_details: Record<string, unknown>;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  stage: PipelineStage;
  subtotal_cents: number;
  discount_cents: number;
  vat_cents: number;
  total_cents: number;
  currency: string;
  shipping_address: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  design_id: string | null;
  configured_width_mm: number;
  configured_height_mm: number;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  configuration_json: Record<string, unknown>;
  created_at: string;
}

export interface ProofVersion {
  id: string;
  order_id: string;
  order_item_id: string;
  version_number: number;
  proof_preview_url: string;
  change_notes: string | null;
  created_by_user_id: string | null;
  created_at: string;
}

export interface ProofApproval {
  id: string;
  proof_version_id: string;
  approved_by_user_id: string;
  approved_at: string;
  digital_signature_hash: string;
  customer_notes: string | null;
  created_at: string;
}

export interface ProductionFile {
  id: string;
  order_id: string;
  order_item_id: string;
  proof_version_id: string | null;
  file_type: ProductionFileType;
  storage_path: string;
  file_name: string;
  resolution_dpi: number;
  bleed_mm: number;
  is_unlocked: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  order_id: string;
  invoice_number: string;
  subtotal_cents: number;
  vat_cents: number;
  total_cents: number;
  currency: string;
  pdf_storage_path: string | null;
  xero_contact_id: string | null;
  xero_invoice_id: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  read_at: string | null;
  created_at: string;
}
