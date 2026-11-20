export interface CsvVariableRecord {
  rowIndex: number;
  bibNumber: string;
  name: string;
  category: string;
  wave?: string;
  team?: string;
  barcodeData: string;
  emergencyContact?: string;
}

export interface CsvValidationResult {
  isValid: boolean;
  totalRows: number;
  detectedHeaders: string[];
  mappedColumns: {
    numberCol: string | null;
    nameCol: string | null;
    categoryCol: string | null;
    barcodeCol: string | null;
  };
  sampleRecords: CsvVariableRecord[];
  warnings: string[];
  error?: string;
}

export interface VariableBatchJob {
  jobId: string;
  orderNumber: string;
  divisionSlug: string;
  totalRecords: number;
  processedRecords: number;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  outputFileName: string;
  outputFileSizeBytes: number;
  startedAt: string;
  completedAt?: string;
  records: CsvVariableRecord[];
}

export const MAX_CSV_ROWS = 5000;

// In-memory batch jobs store
export const BATCH_JOBS_STORE: Record<string, VariableBatchJob> = {};

/**
 * Sanitizes CSV field values to prevent CSV formula injection
 */
export function sanitizeCsvField(val: string): string {
  let clean = val.trim();
  if (
    clean.startsWith("=") ||
    clean.startsWith("+") ||
    clean.startsWith("-") ||
    clean.startsWith("@") ||
    clean.startsWith("\t") ||
    val.startsWith("\t")
  ) {
    clean = `'${clean}`;
  }
  return clean;
}

export const sanitizeCsvValue = sanitizeCsvField;

/**
 * Parses raw CSV text into array of rows handling quoted values
 */
export function parseCsvText(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  return lines.map((line) => {
    const row: string[] = [];
    let insideQuotes = false;
    let entry = "";

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if ((char === "," || char === "\t" || char === ";") && !insideQuotes) {
        row.push(sanitizeCsvField(entry));
        entry = "";
      } else {
        entry += char;
      }
    }
    row.push(sanitizeCsvField(entry));
    return row;
  });
}

/**
 * Validates and maps CSV dataset for variable-data print production
 */
export function validateAndMapCsv(csvText: string): CsvValidationResult {
  const rows = parseCsvText(csvText);
  if (rows.length < 2) {
    return {
      isValid: false,
      totalRows: 0,
      detectedHeaders: [],
      mappedColumns: { numberCol: null, nameCol: null, categoryCol: null, barcodeCol: null },
      sampleRecords: [],
      warnings: ["CSV must contain at least a header row and one data row."],
      error: "EMPTY_OR_INSUFFICIENT_ROWS",
    };
  }

  const rawHeaders = rows[0].map((h) => h.toLowerCase().trim());
  const dataRows = rows.slice(1);

  if (dataRows.length > MAX_CSV_ROWS) {
    return {
      isValid: false,
      totalRows: dataRows.length,
      detectedHeaders: rawHeaders,
      mappedColumns: { numberCol: null, nameCol: null, categoryCol: null, barcodeCol: null },
      sampleRecords: [],
      warnings: [`Dataset exceeds maximum limit of ${MAX_CSV_ROWS} rows per print run.`],
      error: "ROW_LIMIT_EXCEEDED",
    };
  }

  // Auto-detect columns
  const numberIndex = rawHeaders.findIndex((h) =>
    ["number", "bib", "bib_number", "bib_no", "raceno", "race_number", "id"].includes(h)
  );

  const nameIndex = rawHeaders.findIndex((h) =>
    ["name", "runner_name", "athlete", "athlete_name", "rider", "fullname"].includes(h)
  );

  const categoryIndex = rawHeaders.findIndex((h) =>
    ["category", "cat", "class", "division", "age_group", "gender"].includes(h)
  );

  const barcodeIndex = rawHeaders.findIndex((h) =>
    ["barcode", "barcode_data", "chip", "rfid", "timing_id"].includes(h)
  );

  const waveIndex = rawHeaders.findIndex((h) => ["wave", "start_time", "heat"].includes(h));
  const teamIndex = rawHeaders.findIndex((h) => ["team", "club", "sponsor"].includes(h));

  const warnings: string[] = [];
  if (numberIndex === -1) {
    warnings.push("Warning: No 'number' or 'bib' column found; using row index as race number.");
  }

  const mappedColumns = {
    numberCol: numberIndex !== -1 ? rawHeaders[numberIndex] : null,
    nameCol: nameIndex !== -1 ? rawHeaders[nameIndex] : null,
    categoryCol: categoryIndex !== -1 ? rawHeaders[categoryIndex] : null,
    barcodeCol: barcodeIndex !== -1 ? rawHeaders[barcodeIndex] : null,
  };

  const records: CsvVariableRecord[] = dataRows.map((r, idx) => {
    const bibNumber = numberIndex !== -1 && r[numberIndex] ? r[numberIndex] : String(idx + 1).padStart(3, "0");
    const name = nameIndex !== -1 && r[nameIndex] ? r[nameIndex] : `Participant #${bibNumber}`;
    const category = categoryIndex !== -1 && r[categoryIndex] ? r[categoryIndex] : "Open Senior";
    const barcodeData = barcodeIndex !== -1 && r[barcodeIndex] ? r[barcodeIndex] : `DH-${bibNumber}-2026`;
    const wave = waveIndex !== -1 ? r[waveIndex] : undefined;
    const team = teamIndex !== -1 ? r[teamIndex] : undefined;

    return {
      rowIndex: idx + 1,
      bibNumber,
      name,
      category,
      wave,
      team,
      barcodeData,
    };
  });

  return {
    isValid: true,
    totalRows: records.length,
    detectedHeaders: rawHeaders,
    mappedColumns,
    sampleRecords: records.slice(0, 5),
    warnings,
  };
}

/**
 * Calculates adaptive font size for runner name to prevent safe-zone clipping
 */
export function calculateRunnerNameFontSize(name: string): number {
  const len = name.length;
  if (len <= 14) return 26; // Full display size
  if (len <= 20) return 22;
  if (len <= 28) return 18;
  return 14; // Minimum legible size
}

/**
 * Generates a realistic sample 500-runner CSV string for test & demo runs
 */
export function generateSampleRunnersCsv(count: number = 500): string {
  const firstNames = [
    "Marcus", "Elena", "Liam", "Sophia", "David", "Emma", "Oliver", "Maya",
    "Alexander", "Chloe", "Benjamin", "Hannah", "Lucas", "Zoe", "Thomas"
  ];
  const lastNames = [
    "Vance", "Kovacs", "O'Connor", "Chen", "Sterling", "Rossi", "Müller", "Larsson",
    "MacLeod", "Dubois", "Fletcher", "Nakamura", "Novak", "Santos", "Wright"
  ];
  const categories = ["Elite Men", "Elite Women", "Masters 40+", "Masters 50+", "Junior U19", "E-MTB Open"];
  const clubs = ["Peak Enduro Club", "Highland Gravity", "Sheffield Velo", "RedRock Racing", "Borders DH", "Independent"];

  let csv = "bib_number,runner_name,category,team,wave,barcode\n";

  for (let i = 1; i <= count; i++) {
    const fName = firstNames[(i * 3 + 1) % firstNames.length];
    const lName = lastNames[(i * 7 + 2) % lastNames.length];
    const fullName = `${fName} ${lName}`;
    const category = categories[i % categories.length];
    const club = clubs[(i * 5) % clubs.length];
    const wave = `Wave ${Math.floor(i / 100) + 1} (09:${String(15 + (Math.floor(i / 100) * 15)).padStart(2, "0")})`;
    const barcode = `BIB2026-${String(i).padStart(4, "0")}`;

    csv += `${i},"${fullName}","${category}","${club}","${wave}",${barcode}\n`;
  }

  return csv;
}

/**
 * Executes a variable-data batch merge job
 */
export function executeVariableMergeJob(
  orderNumber: string,
  csvText: string,
  divisionSlug: string = "race-numbers"
): VariableBatchJob {
  const validation = validateAndMapCsv(csvText);
  if (!validation.isValid) {
    throw new Error(`CSV_VALIDATION_ERROR: ${validation.error || "Invalid CSV data."}`);
  }

  const allRows = parseCsvText(csvText).slice(1);
  const records: CsvVariableRecord[] = allRows.map((r, idx) => {
    const bibNumber = r[0] || String(idx + 1);
    const name = r[1] || `Athlete ${bibNumber}`;
    const category = r[2] || "Open";
    const team = r[3] || "Club";
    const wave = r[4] || "Wave 1";
    const barcodeData = r[5] || `BIB-${bibNumber}`;

    return {
      rowIndex: idx + 1,
      bibNumber,
      name,
      category,
      team,
      wave,
      barcodeData,
    };
  });

  const jobId = `vjob-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const outputFileName = `${orderNumber}_BatchMerge_${records.length}Records_300DPI.pdf`;

  // Estimate output file size: ~32KB per merged page
  const estimatedSizeBytes = records.length * 32768;

  const job: VariableBatchJob = {
    jobId,
    orderNumber,
    divisionSlug,
    totalRecords: records.length,
    processedRecords: records.length,
    status: "COMPLETED",
    outputFileName,
    outputFileSizeBytes: estimatedSizeBytes,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    records,
  };

  BATCH_JOBS_STORE[jobId] = job;
  return job;
}
