import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    let pricingRules: any[] = [];
    let volumeDiscounts: any[] = [];
    let products: any[] = [];

    if (supabaseAdmin) {
      const { data: prData } = await supabaseAdmin.from("pricing_rules").select("*");
      if (prData) pricingRules = prData;

      const { data: vdData } = await supabaseAdmin.from("volume_discounts").select("*").order("min_quantity");
      if (vdData) volumeDiscounts = vdData;

      const { data: prodData } = await supabaseAdmin.from("products").select("id, name, slug");
      if (prodData) products = prodData;
    }

    return NextResponse.json({
      success: true,
      pricingRules,
      volumeDiscounts,
      products,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch pricing rules";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ruleId, ruleData, discountData } = body;

    if (action === "UPDATE_RULE" && ruleId && ruleData) {
      if (supabaseAdmin) {
        await supabaseAdmin
          .from("pricing_rules")
          .update({
            base_rate_per_sqcm_cents: Number(ruleData.baseRatePerSqcmCents),
            min_order_cents: Number(ruleData.minOrderCents),
            setup_fee_cents: Number(ruleData.setupFeeCents),
            vat_percentage: Number(ruleData.vatPercentage),
          })
          .eq("id", ruleId);
      }
      return NextResponse.json({ success: true, message: "Pricing rule updated successfully" });
    }

    if (action === "ADD_VOLUME_TIER" && discountData) {
      const newId = "vd" + Math.random().toString(16).substring(2, 8) + "-0000-0000-0000-" + Date.now().toString(16).padStart(12, "0");
      if (supabaseAdmin) {
        await supabaseAdmin.from("volume_discounts").insert({
          id: newId,
          min_quantity: Number(discountData.minQuantity),
          discount_percentage: Number(discountData.discountPercentage),
        });
      }
      return NextResponse.json({ success: true, message: "Volume discount tier added", id: newId });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Pricing rule update failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
