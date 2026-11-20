import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ALL_PRODUCTS } from "@/lib/catalog/products";

export async function GET() {
  try {
    let divisions: any[] = [];
    let products: any[] = [];
    let parameters: any[] = [];

    if (supabaseAdmin) {
      const { data: divData } = await supabaseAdmin.from("product_divisions").select("*").order("sort_order");
      if (divData && divData.length > 0) divisions = divData;

      const { data: prodData } = await supabaseAdmin.from("products").select("*").order("created_at");
      if (prodData && prodData.length > 0) products = prodData;

      const { data: paramData } = await supabaseAdmin.from("product_parameters").select("*").order("sort_order");
      if (paramData && paramData.length > 0) parameters = paramData;
    }

    // Fallback to static catalog if DB is cold
    if (products.length === 0) {
      products = ALL_PRODUCTS.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        min_width_mm: p.minWidthMm,
        max_width_mm: p.maxWidthMm,
        min_height_mm: p.minHeightMm,
        max_height_mm: p.maxHeightMm,
        bleed_margin_mm: p.bleedMm,
        safe_margin_mm: p.safeMarginMm,
        is_active: true,
      }));
    }

    return NextResponse.json({
      success: true,
      divisions,
      products,
      parameters,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch products";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, productId, parameterData, productData } = body;

    if (action === "ADD_PARAMETER" && parameterData) {
      const newParamId = "ba" + Math.random().toString(16).substring(2, 8) + "-0000-0000-0000-" + Date.now().toString(16).padStart(12, "0");

      if (supabaseAdmin) {
        await supabaseAdmin.from("product_parameters").insert({
          id: newParamId,
          product_id: productId,
          parameter_type: parameterData.parameterType || "material",
          name: parameterData.name,
          code: parameterData.code.toUpperCase().replace(/\s+/g, "_"),
          price_multiplier: Number(parameterData.priceMultiplier) || 1.0,
          setup_cost_cents: Number(parameterData.setupCostCents) || 0,
          is_default: Boolean(parameterData.isDefault),
          sort_order: Number(parameterData.sortOrder) || 1,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Material parameter created successfully",
        parameterId: newParamId,
      });
    }

    if (action === "TOGGLE_PRODUCT_STATUS" && productId) {
      if (supabaseAdmin) {
        await supabaseAdmin
          .from("products")
          .update({ is_active: productData.isActive })
          .eq("id", productId);
      }

      return NextResponse.json({
        success: true,
        message: `Product ${productId} active status updated`,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Product update failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
