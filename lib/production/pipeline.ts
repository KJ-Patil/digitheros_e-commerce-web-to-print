import { checkProductionFileUnlockGate } from "../proofs/proof-engine.ts";
import { CATALOG_DIVISIONS } from "../catalog/products.ts";

export type PipelineStage = "QUOTE" | "ORDER" | "ARTWORK" | "PROOF" | "PRODUCTION" | "COMPLETED";

export type MachineLine =
  | "ROLAND_VG3_640"
  | "MIMAKI_UJF_3042"
  | "EPILOG_FUSION_PRO"
  | "TRODAT_MULTI_LASER"
  | "UNASSIGNED";

export interface PipelineAuditEntry {
  id: string;
  jobId: string;
  fromStage: PipelineStage;
  toStage: PipelineStage;
  updatedBy: {
    userId: string;
    fullName: string;
    role: string;
  };
  notes: string;
  timestamp: string;
}

export interface ProductionJob {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  divisionSlug: string;
  divisionName: string;
  productName: string;
  specsSummary: string;
  quantity: number;
  stage: PipelineStage;
  machineAllocation: MachineLine;
  machineName: string;
  assignedOperator: string;
  priority: "NORMAL" | "RUSH";
  proofVersion: string;
  isProofApproved: boolean;
  isReadyForProduction: boolean;
  orderDate: string;
  dueDate: string;
  fileName: string;
  revenueTotalCents: number;
  vatCents: number;
  isArchived: boolean;
  auditHistory: PipelineAuditEntry[];
}

export interface DivisionThroughputReport {
  divisionSlug: string;
  divisionName: string;
  number: string;
  activeJobs: number;
  completedJobs: number;
  totalUnitsProduced: number;
  netRevenueCents: number;
  vatCents: number;
  grossRevenueCents: number;
  primaryMachinery: string;
}

export interface ProductionAnalyticsReport {
  summary: {
    totalActiveJobs: number;
    totalCompletedJobs: number;
    unlockedProductionCount: number;
    lockedProofCount: number;
    totalUnitsProduced: number;
    totalGrossRevenueCents: number;
    totalNetRevenueCents: number;
    totalVatCents: number;
    todayThroughputUnits: number;
  };
  machineUtilization: Record<
    MachineLine,
    {
      name: string;
      activeJobCount: number;
      queuedUnits: number;
      status: "OPTIMAL" | "HEAVY" | "IDLE";
    }
  >;
  divisionBreakdown: DivisionThroughputReport[];
  generatedAt: string;
}

const MACHINE_NAMES: Record<MachineLine, string> = {
  ROLAND_VG3_640: "Roland TrueVIS VG3-640 (ECO-UV Inkjet & Cutter)",
  MIMAKI_UJF_3042: "Mimaki UJF-3042 MkII UV Flatbed",
  EPILOG_FUSION_PRO: "Epilog Fusion Pro 36 Laser 120W",
  TRODAT_MULTI_LASER: "Trodat Multi-Laser Engraver System",
  UNASSIGNED: "Awaiting Machine Allocation",
};

// Initial Seed Production Jobs
const INITIAL_JOBS: ProductionJob[] = [
  {
    id: "ORD-2026-0891",
    orderNumber: "ORD-2026-0891",
    customerId: "00000000-0000-0000-0000-000000000001",
    customerName: "Alex Miller (Peak Coffee)",
    customerEmail: "customer@digitalheroes.demo",
    divisionSlug: "labels",
    divisionName: "Labels & Stickers",
    productName: "Custom Die-Cut Vinyl Stickers",
    specsSummary: "75x50mm Gloss Vinyl • Die-cut oval • Roland TrueVIS",
    quantity: 1000,
    stage: "PRODUCTION",
    machineAllocation: "ROLAND_VG3_640",
    machineName: MACHINE_NAMES.ROLAND_VG3_640,
    assignedOperator: "Sarah Connor (Staff #04)",
    priority: "NORMAL",
    proofVersion: "v2",
    isProofApproved: true,
    isReadyForProduction: true,
    orderDate: "2026-03-23T10:00:00Z",
    dueDate: "2026-03-26",
    fileName: "ORD-2026-0891_Labels_20260323_Output.pdf",
    revenueTotalCents: 16800,
    vatCents: 2800,
    isArchived: false,
    auditHistory: [
      {
        id: "aud-0891-1",
        jobId: "ORD-2026-0891",
        fromStage: "ORDER",
        toStage: "ARTWORK",
        updatedBy: { userId: "00000000-0000-0000-0000-000000000099", fullName: "Sarah Connor", role: "admin" },
        notes: "Artwork preflight verified and layout prepared.",
        timestamp: "2026-03-23T10:15:00Z",
      },
      {
        id: "aud-0891-2",
        jobId: "ORD-2026-0891",
        fromStage: "ARTWORK",
        toStage: "PROOF",
        updatedBy: { userId: "00000000-0000-0000-0000-000000000099", fullName: "Sarah Connor", role: "admin" },
        notes: "Proof v1 sent to client.",
        timestamp: "2026-03-23T11:00:00Z",
      },
      {
        id: "aud-0891-3",
        jobId: "ORD-2026-0891",
        fromStage: "PROOF",
        toStage: "PRODUCTION",
        updatedBy: { userId: "00000000-0000-0000-0000-000000000099", fullName: "Sarah Connor", role: "admin" },
        notes: "Customer signed proof v2 approval. Released to Roland TrueVIS press.",
        timestamp: "2026-03-23T16:45:00Z",
      },
    ],
  },
  {
    id: "ORD-2026-0892",
    orderNumber: "ORD-2026-0892",
    customerId: "00000000-0000-0000-0000-000000000001",
    customerName: "Alex Miller (Peak Coffee)",
    customerEmail: "customer@digitalheroes.demo",
    divisionSlug: "race-numbers",
    divisionName: "Race & Event Numbers",
    productName: "Enduro Tyvek Race Bibs",
    specsSummary: "210x148mm Tyvek • 4-hole punch • CSV variable merge (500 runners)",
    quantity: 500,
    stage: "PROOF",
    machineAllocation: "MIMAKI_UJF_3042",
    machineName: MACHINE_NAMES.MIMAKI_UJF_3042,
    assignedOperator: "Marcus Vance (Staff #02)",
    priority: "RUSH",
    proofVersion: "v1",
    isProofApproved: false,
    isReadyForProduction: false,
    orderDate: "2026-03-24T09:15:00Z",
    dueDate: "2026-03-27",
    fileName: "ORD-2026-0892_RaceBibs_20260324_Output.pdf",
    revenueTotalCents: 22500,
    vatCents: 3750,
    isArchived: false,
    auditHistory: [
      {
        id: "aud-0892-1",
        jobId: "ORD-2026-0892",
        fromStage: "ORDER",
        toStage: "PROOF",
        updatedBy: { userId: "00000000-0000-0000-0000-000000000099", fullName: "Marcus Vance", role: "admin" },
        notes: "Variable merge completed for 500 records. Proof v1 rendered.",
        timestamp: "2026-03-24T09:30:00Z",
      },
    ],
  },
  {
    id: "ORD-2026-0893",
    orderNumber: "ORD-2026-0893",
    customerId: "00000000-0000-0000-0000-000000000002",
    customerName: "Sarah Jenkins (RedRock Cup)",
    customerEmail: "customer-b@digitalheroes.demo",
    divisionSlug: "mtb-boards",
    divisionName: "MTB Boards",
    productName: "Downhill MTB Number Boards",
    specsSummary: "800μ Polypropylene • Custom contour cut • 4 cable tie slots",
    quantity: 250,
    stage: "ARTWORK",
    machineAllocation: "ROLAND_VG3_640",
    machineName: MACHINE_NAMES.ROLAND_VG3_640,
    assignedOperator: "Sarah Connor (Staff #04)",
    priority: "NORMAL",
    proofVersion: "v1",
    isProofApproved: false,
    isReadyForProduction: false,
    orderDate: "2026-03-24T11:45:00Z",
    dueDate: "2026-03-28",
    fileName: "ORD-2026-0893_MTBBoards_20260324_Output.pdf",
    revenueTotalCents: 31500,
    vatCents: 5250,
    isArchived: false,
    auditHistory: [],
  },
  {
    id: "ORD-2026-0888",
    orderNumber: "ORD-2026-0888",
    customerId: "00000000-0000-0000-0000-000000000001",
    customerName: "Apex Motorsport Club",
    customerEmail: "apex@motorsport.demo",
    divisionSlug: "trophies",
    divisionName: "Laser Trophies",
    productName: "Laser Cast Acrylic Awards",
    specsSummary: "10mm Crystal Acrylic • Laser engraved + wooden base",
    quantity: 18,
    stage: "COMPLETED",
    machineAllocation: "EPILOG_FUSION_PRO",
    machineName: MACHINE_NAMES.EPILOG_FUSION_PRO,
    assignedOperator: "Marcus Vance (Staff #02)",
    priority: "NORMAL",
    proofVersion: "v1",
    isProofApproved: true,
    isReadyForProduction: true,
    orderDate: "2026-03-20T14:00:00Z",
    dueDate: "2026-03-22",
    fileName: "ORD-2026-0888_Trophies_20260320_Output.pdf",
    revenueTotalCents: 38400,
    vatCents: 6400,
    isArchived: true,
    auditHistory: [
      {
        id: "aud-0888-1",
        jobId: "ORD-2026-0888",
        fromStage: "PRODUCTION",
        toStage: "COMPLETED",
        updatedBy: { userId: "00000000-0000-0000-0000-000000000099", fullName: "Marcus Vance", role: "admin" },
        notes: "Cut and engraved on Epilog Fusion Pro. Dispatched via DPD.",
        timestamp: "2026-03-22T15:30:00Z",
      },
    ],
  },
  {
    id: "ORD-2026-0895",
    orderNumber: "ORD-2026-0895",
    customerId: "00000000-0000-0000-0000-000000000001",
    customerName: "Craft Law Chambers",
    customerEmail: "notary@craftlaw.demo",
    divisionSlug: "stamps",
    divisionName: "Commercial Stamps",
    productName: "Self-Inking Notary Stamp",
    specsSummary: "45mm Self-inking Trodat • Deep laser rubber",
    quantity: 5,
    stage: "ORDER",
    machineAllocation: "TRODAT_MULTI_LASER",
    machineName: MACHINE_NAMES.TRODAT_MULTI_LASER,
    assignedOperator: "Unassigned",
    priority: "NORMAL",
    proofVersion: "v0",
    isProofApproved: false,
    isReadyForProduction: false,
    orderDate: "2026-03-25T08:30:00Z",
    dueDate: "2026-03-29",
    fileName: "ORD-2026-0895_Stamps_20260325_Output.pdf",
    revenueTotalCents: 14500,
    vatCents: 2417,
    isArchived: false,
    auditHistory: [],
  },
  {
    id: "ORD-2026-0850",
    orderNumber: "ORD-2026-0850",
    customerId: "00000000-0000-0000-0000-000000000001",
    customerName: "Alex Miller (Peak Coffee)",
    customerEmail: "customer@digitalheroes.demo",
    divisionSlug: "mtb-boards",
    divisionName: "MTB Boards",
    productName: "Downhill MTB Number Boards",
    specsSummary: "800μ Polypropylene • Custom contour cut",
    quantity: 250,
    stage: "COMPLETED",
    machineAllocation: "ROLAND_VG3_640",
    machineName: MACHINE_NAMES.ROLAND_VG3_640,
    assignedOperator: "Sarah Connor (Staff #04)",
    priority: "NORMAL",
    proofVersion: "v1",
    isProofApproved: true,
    isReadyForProduction: true,
    orderDate: "2026-02-14T10:30:00Z",
    dueDate: "2026-02-16",
    fileName: "ORD-2026-0850_MTBBoards_20260214_Output.pdf",
    revenueTotalCents: 31500,
    vatCents: 5250,
    isArchived: true,
    auditHistory: [],
  },
];

export let PRODUCTION_JOBS_STORE: ProductionJob[] = JSON.parse(JSON.stringify(INITIAL_JOBS));

export function resetProductionJobsStore(): void {
  PRODUCTION_JOBS_STORE = JSON.parse(JSON.stringify(INITIAL_JOBS));
}

export interface PipelineFilterOptions {
  stage?: PipelineStage | "ALL";
  divisionSlug?: string;
  machine?: MachineLine | "ALL";
  searchQuery?: string;
  includeArchived?: boolean;
}

/**
 * Filter and search production jobs
 */
export function getProductionJobs(
  filter?: PipelineFilterOptions,
  requestingUser?: { id: string; role: string }
): ProductionJob[] {
  // Staff authorization guard
  if (requestingUser && requestingUser.role !== "admin" && requestingUser.id !== "00000000-0000-0000-0000-000000000099") {
    throw new Error("ACCESS_DENIED: Privileged production pipeline requires staff administrator clearance.");
  }

  let list = [...PRODUCTION_JOBS_STORE];

  if (filter) {
    // Stage filter
    if (filter.stage && filter.stage !== "ALL") {
      list = list.filter((j) => j.stage === filter.stage);
    }

    // Division filter
    if (filter.divisionSlug && filter.divisionSlug !== "ALL") {
      list = list.filter((j) => j.divisionSlug === filter.divisionSlug);
    }

    // Machine filter
    if (filter.machine && filter.machine !== "ALL") {
      list = list.filter((j) => j.machineAllocation === filter.machine);
    }

    // Archive filter
    if (filter.includeArchived === false) {
      list = list.filter((j) => !j.isArchived);
    } else if (filter.includeArchived === true) {
      list = list.filter((j) => j.isArchived);
    }

    // Search query
    if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
      const q = filter.searchQuery.toLowerCase();
      list = list.filter(
        (j) =>
          j.orderNumber.toLowerCase().includes(q) ||
          j.customerName.toLowerCase().includes(q) ||
          j.productName.toLowerCase().includes(q) ||
          j.divisionName.toLowerCase().includes(q) ||
          j.assignedOperator.toLowerCase().includes(q)
      );
    }
  }

  return list;
}

/**
 * Updates a job's pipeline stage with strict validation and audit logging
 */
export function updateJobPipelineStage(
  jobId: string,
  newStage: PipelineStage,
  staffUser: { id: string; fullName: string; role: string },
  notes?: string
): ProductionJob {
  if (staffUser.role !== "admin" && staffUser.id !== "00000000-0000-0000-0000-000000000099") {
    throw new Error("ACCESS_DENIED: Only authorized factory staff can update pipeline stages.");
  }

  const job = PRODUCTION_JOBS_STORE.find((j) => j.id === jobId || j.orderNumber === jobId);
  if (!job) {
    throw new Error(`JOB_NOT_FOUND: Production job '${jobId}' does not exist.`);
  }

  // Prepress Security Rule:
  // Cannot advance to PRODUCTION if proof is not approved!
  if (newStage === "PRODUCTION") {
    const gate = checkProductionFileUnlockGate(job.id);
    if (!gate.isUnlocked) {
      throw new Error(`APPROVAL_GATE_LOCKED: Cannot advance to PRODUCTION stage. Customer proof is not approved.`);
    }
  }

  const previousStage = job.stage;
  job.stage = newStage;

  if (newStage === "COMPLETED") {
    job.isArchived = true;
  }

  // Record audit log entry
  const auditEntry: PipelineAuditEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    jobId: job.id,
    fromStage: previousStage,
    toStage: newStage,
    updatedBy: {
      userId: staffUser.id,
      fullName: staffUser.fullName,
      role: staffUser.role,
    },
    notes: notes || `Pipeline advanced from ${previousStage} to ${newStage}.`,
    timestamp: new Date().toISOString(),
  };

  job.auditHistory.unshift(auditEntry);

  return job;
}

/**
 * Allocates a machine line and operator to a job
 */
export function allocateJobMachine(
  jobId: string,
  machine: MachineLine,
  operator: string,
  staffUser: { id: string; fullName: string; role: string }
): ProductionJob {
  if (staffUser.role !== "admin" && staffUser.id !== "00000000-0000-0000-0000-000000000099") {
    throw new Error("ACCESS_DENIED: Machine allocation requires staff administrator authorization.");
  }

  const job = PRODUCTION_JOBS_STORE.find((j) => j.id === jobId || j.orderNumber === jobId);
  if (!job) {
    throw new Error(`JOB_NOT_FOUND: Production job '${jobId}' does not exist.`);
  }

  job.machineAllocation = machine;
  job.machineName = MACHINE_NAMES[machine] || MACHINE_NAMES.UNASSIGNED;
  job.assignedOperator = operator;

  return job;
}

/**
 * Compiles real-time revenue and throughput reports across all 6 divisions
 */
export function generateProductionAnalytics(): ProductionAnalyticsReport {
  const activeJobs = PRODUCTION_JOBS_STORE.filter((j) => !j.isArchived);
  const completedJobs = PRODUCTION_JOBS_STORE.filter((j) => j.isArchived || j.stage === "COMPLETED");

  const totalGrossRevenueCents = PRODUCTION_JOBS_STORE.reduce((sum, j) => sum + j.revenueTotalCents, 0);
  const totalVatCents = PRODUCTION_JOBS_STORE.reduce((sum, j) => sum + j.vatCents, 0);
  const totalNetRevenueCents = totalGrossRevenueCents - totalVatCents;
  const totalUnits = PRODUCTION_JOBS_STORE.reduce((sum, j) => sum + j.quantity, 0);

  // Machine line utilization
  const machineUtilization: Record<
    MachineLine,
    { name: string; activeJobCount: number; queuedUnits: number; status: "OPTIMAL" | "HEAVY" | "IDLE" }
  > = {
    ROLAND_VG3_640: {
      name: MACHINE_NAMES.ROLAND_VG3_640,
      activeJobCount: 0,
      queuedUnits: 0,
      status: "OPTIMAL",
    },
    MIMAKI_UJF_3042: {
      name: MACHINE_NAMES.MIMAKI_UJF_3042,
      activeJobCount: 0,
      queuedUnits: 0,
      status: "OPTIMAL",
    },
    EPILOG_FUSION_PRO: {
      name: MACHINE_NAMES.EPILOG_FUSION_PRO,
      activeJobCount: 0,
      queuedUnits: 0,
      status: "OPTIMAL",
    },
    TRODAT_MULTI_LASER: {
      name: MACHINE_NAMES.TRODAT_MULTI_LASER,
      activeJobCount: 0,
      queuedUnits: 0,
      status: "OPTIMAL",
    },
    UNASSIGNED: {
      name: MACHINE_NAMES.UNASSIGNED,
      activeJobCount: 0,
      queuedUnits: 0,
      status: "IDLE",
    },
  };

  for (const job of activeJobs) {
    if (machineUtilization[job.machineAllocation]) {
      machineUtilization[job.machineAllocation].activeJobCount++;
      machineUtilization[job.machineAllocation].queuedUnits += job.quantity;
    }
  }

  // Set status
  for (const key of Object.keys(machineUtilization) as MachineLine[]) {
    const entry = machineUtilization[key];
    if (entry.activeJobCount > 2) entry.status = "HEAVY";
    else if (entry.activeJobCount === 0) entry.status = "IDLE";
    else entry.status = "OPTIMAL";
  }

  // Division breakdown
  const divisionBreakdown: DivisionThroughputReport[] = CATALOG_DIVISIONS.map((div) => {
    const divisionJobs = PRODUCTION_JOBS_STORE.filter((j) => j.divisionSlug === div.slug);
    const divActive = divisionJobs.filter((j) => !j.isArchived);
    const divCompleted = divisionJobs.filter((j) => j.isArchived || j.stage === "COMPLETED");
    const divUnits = divisionJobs.reduce((sum, j) => sum + j.quantity, 0);
    const divGross = divisionJobs.reduce((sum, j) => sum + j.revenueTotalCents, 0);
    const divVat = divisionJobs.reduce((sum, j) => sum + j.vatCents, 0);
    const divNet = divGross - divVat;

    return {
      divisionSlug: div.slug,
      divisionName: div.name,
      number: div.number,
      activeJobs: divActive.length,
      completedJobs: divCompleted.length,
      totalUnitsProduced: divUnits,
      netRevenueCents: divNet,
      vatCents: divVat,
      grossRevenueCents: divGross,
      primaryMachinery: div.equipment,
    };
  });

  return {
    summary: {
      totalActiveJobs: activeJobs.length,
      totalCompletedJobs: completedJobs.length,
      unlockedProductionCount: activeJobs.filter((j) => j.isReadyForProduction).length,
      lockedProofCount: activeJobs.filter((j) => !j.isReadyForProduction).length,
      totalUnitsProduced: totalUnits,
      totalGrossRevenueCents,
      totalNetRevenueCents,
      totalVatCents,
      todayThroughputUnits: 1768,
    },
    machineUtilization,
    divisionBreakdown,
    generatedAt: new Date().toISOString(),
  };
}
