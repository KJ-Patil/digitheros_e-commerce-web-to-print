import { NextRequest, NextResponse } from "next/server";
import { buildFogra39BinaryIccProfile } from "@/lib/print-engine/generator";

/**
 * Standalone Hardware ICC Profile Download Endpoint
 * 
 * Delivers compliant ISO 15076-1 / ICC.1:2010-12 binary .icc profiles
 * for Roland VersaWorks, Mimaki RasterLink, and commercial RIP hardware.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ profile: string }> }
) {
  try {
    const { profile } = await context.params;
    const normalized = (profile || "").toLowerCase();

    if (!normalized.includes("fogra") && !normalized.includes("iso") && !normalized.includes("cmyk")) {
      return NextResponse.json(
        {
          error: "PROFILE_NOT_FOUND",
          message: `Unknown ICC Profile '${profile}'. Supported hardware profile: 'FOGRA39' (ISO Coated v2).`,
        },
        { status: 404 }
      );
    }

    const iccBuffer = buildFogra39BinaryIccProfile();
    const fileName = "ISOcoated_v2_eci_FOGRA39.icc";

    return new NextResponse(new Uint8Array(iccBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.iccprofile",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(iccBuffer.length),
        "X-ICC-Standard": "ISO 15076-1:2010",
        "X-Color-Space": "CMYK",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "ICC profile fetch failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
