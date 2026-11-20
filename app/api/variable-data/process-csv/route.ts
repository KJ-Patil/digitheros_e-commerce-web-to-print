import { NextRequest, NextResponse } from "next/server";
import {
  validateAndMapCsv,
  executeVariableMergeJob,
  generateSampleRunnersCsv,
} from "@/lib/print-engine/variable-data";

/**
 * CSV Variable-Data Processing API
 * 
 * Supports Race & Event Numbers, MTB Boards, and numbered asset decals.
 * Validates headers, auto-maps columns, and executes batch variable merge jobs.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, loadSample } = body;
    let { csvText } = body;

    if (loadSample) {
      csvText = generateSampleRunnersCsv(Number(body.sampleCount) || 500);
    }

    if (!csvText || typeof csvText !== "string") {
      return NextResponse.json(
        { error: "INVALID_REQUEST: csvText payload is required." },
        { status: 400 }
      );
    }

    const orderNum = orderNumber || "ORD-2026-0892";

    // 1. Validation & Column Mapping
    const validation = validateAndMapCsv(csvText);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "CSV_VALIDATION_FAILED",
          details: validation.error,
          warnings: validation.warnings,
        },
        { status: 422 }
      );
    }

    // 2. Execute Batch Merge
    const batchJob = executeVariableMergeJob(orderNum, csvText, "race-numbers");

    return NextResponse.json({
      success: true,
      message: `Successfully merged ${batchJob.totalRecords} variable records for ${orderNum}.`,
      jobId: batchJob.jobId,
      totalRecords: batchJob.totalRecords,
      outputFileName: batchJob.outputFileName,
      outputFileSizeBytes: batchJob.outputFileSizeBytes,
      mappedColumns: validation.mappedColumns,
      sampleRecords: validation.sampleRecords,
      status: batchJob.status,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "CSV processing error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
