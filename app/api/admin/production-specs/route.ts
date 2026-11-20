import { NextRequest, NextResponse } from "next/server";
import {
  DIVISION_PRODUCTION_SPECS,
  getDivisionProductionSpec,
  updateDivisionProductionSpec,
} from "@/lib/print-engine/specs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const division = url.searchParams.get("division");

    if (division) {
      const spec = getDivisionProductionSpec(division);
      return NextResponse.json({ success: true, spec });
    }

    return NextResponse.json({
      success: true,
      specs: Object.values(DIVISION_PRODUCTION_SPECS),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load production specifications." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { divisionSlug, updates } = body;

    if (!divisionSlug) {
      return NextResponse.json(
        { error: "divisionSlug is required." },
        { status: 400 }
      );
    }

    const updated = updateDivisionProductionSpec(divisionSlug, updates || {});
    return NextResponse.json({
      success: true,
      message: `Production specification updated for division '${updated.divisionName}'.`,
      spec: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update production specification." },
      { status: 500 }
    );
  }
}
