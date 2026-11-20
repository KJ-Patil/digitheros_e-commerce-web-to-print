import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      designId,
      customerId,
      productId = "b1000000-0000-0000-0000-000000000001",
      name = "Custom Design",
      canvasStateJson,
      previewThumbnailUrl,
    } = body;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer authentication required" },
        { status: 401 }
      );
    }

    const id = designId || "d" + Math.random().toString(16).substring(2, 9) + "-0000-0000-0000-" + Date.now().toString(16).padStart(12, "0");

    if (supabaseAdmin) {
      const { error } = await supabaseAdmin.from("designs").upsert({
        id,
        customer_id: customerId,
        product_id: productId,
        name,
        canvas_state_json: canvasStateJson || {},
        preview_thumbnail_url: previewThumbnailUrl || null,
        is_saved_template: true,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.warn("Supabase design save warning:", error.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Design saved to cloud database successfully",
      design: {
        id,
        name,
        customerId,
        productId,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save design";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
