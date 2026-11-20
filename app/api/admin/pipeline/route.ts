import { NextRequest, NextResponse } from "next/server";
import { getProductionJobs, type PipelineFilterOptions, type PipelineStage, type MachineLine } from "@/lib/production/pipeline";

/**
 * Admin Pipeline Query API
 * 
 * Supports multi-criteria filtering across the factory queue:
 * stage, division, machine allocation, search, and archive status.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stage = (searchParams.get("stage") as PipelineStage | "ALL") || undefined;
    const divisionSlug = searchParams.get("division") || undefined;
    const machine = (searchParams.get("machine") as MachineLine | "ALL") || undefined;
    const searchQuery = searchParams.get("q") || undefined;
    const isArchivedParam = searchParams.get("isArchived");
    const includeArchived = isArchivedParam !== null ? isArchivedParam === "true" : undefined;

    const filter: PipelineFilterOptions = {
      stage,
      divisionSlug,
      machine,
      searchQuery,
      includeArchived,
    };

    const staffUser = {
      id: searchParams.get("staffId") || "00000000-0000-0000-0000-000000000099",
      role: searchParams.get("role") || "admin",
    };

    const jobs = getProductionJobs(filter, staffUser);
    return NextResponse.json(jobs);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to query production jobs";
    const status = msg.includes("ACCESS_DENIED") ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
