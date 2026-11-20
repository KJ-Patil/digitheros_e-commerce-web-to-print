import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSavedDesigns } from "@/lib/orders/order-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId") || "00000000-0000-0000-0000-000000000001";

    const dbDesigns: Array<{
      id: string;
      customerId: string;
      name: string;
      productSlug: string;
      productName: string;
      divisionName: string;
      widthMm: number;
      heightMm: number;
      defaultQuantity: number;
      previewThumbnail: string;
      approvedVersion: string;
      lastOrderedDate: string;
      lastOrderNumber: string;
      canvasStateJson?: unknown;
    }> = [];

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("designs")
        .select("*")
        .eq("customer_id", customerId)
        .order("updated_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        for (const d of data) {
          dbDesigns.push({
            id: d.id,
            customerId: d.customer_id,
            name: d.name,
            productSlug: d.product_id || "vinyl-stickers",
            productName: d.name,
            divisionName: "Custom Artwork",
            widthMm: d.canvas_state_json?.widthMm || 75,
            heightMm: d.canvas_state_json?.heightMm || 50,
            defaultQuantity: 100,
            previewThumbnail: d.preview_thumbnail_url || "/proofs/ORD-0891_v2.png",
            approvedVersion: "v1",
            lastOrderedDate: d.updated_at ? d.updated_at.split("T")[0] : "2026-03-24",
            lastOrderNumber: "ORD-CLOUD",
            canvasStateJson: d.canvas_state_json,
          });
        }
      }
    }

    const localDesigns = getSavedDesigns(customerId);

    // Merge without duplicate IDs
    const merged = [...dbDesigns];
    for (const item of localDesigns) {
      if (!merged.some((m) => m.id === item.id)) {
        merged.push(item);
      }
    }

    return NextResponse.json({ success: true, designs: merged });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load designs";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
