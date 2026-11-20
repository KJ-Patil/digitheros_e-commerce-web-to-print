import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SAVED_DESIGNS_STORE, deleteSavedDesign } from "@/lib/orders/order-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("designs")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, design: data });
      }
    }

    const fallback = SAVED_DESIGNS_STORE.find((d) => d.id === id);
    if (fallback) {
      return NextResponse.json({
        success: true,
        design: {
          id: fallback.id,
          customer_id: fallback.customerId,
          name: fallback.name,
          product_id: fallback.productSlug,
          canvas_state_json: {
            widthMm: fallback.widthMm,
            heightMm: fallback.heightMm,
            backgroundColor: "#FFFFFF",
            elements: [
              {
                id: "el-1",
                type: "text",
                xMm: 10,
                yMm: 15,
                widthMm: Math.max(20, fallback.widthMm - 20),
                heightMm: 16,
                rotationDeg: 0,
                text: fallback.name,
                fontFamily: "display",
                fontSizePt: 18,
                textColor: "#13171C",
                textAlign: "center",
                isBold: true,
              },
            ],
          },
        },
      });
    }

    return NextResponse.json({ success: false, error: "Design not found" }, { status: 404 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching design";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (supabaseAdmin) {
      const { error } = await supabaseAdmin.from("designs").delete().eq("id", id);
      if (error) {
        console.warn("Supabase delete design error:", error.message);
      }
    }

    deleteSavedDesign(id);

    return NextResponse.json({
      success: true,
      message: `Design ${id} removed successfully`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error deleting design";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, canvasStateJson } = body;

    if (supabaseAdmin) {
      await supabaseAdmin
        .from("designs")
        .update({
          ...(name && { name }),
          ...(canvasStateJson && { canvas_state_json: canvasStateJson }),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    }

    return NextResponse.json({ success: true, message: `Design ${id} updated` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating design";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
