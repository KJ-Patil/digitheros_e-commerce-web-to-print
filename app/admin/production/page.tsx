"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge, PipelineStage } from "@/components/ui/badge";
import {
  IconLock,
  IconUnlock,
  IconDownload,
} from "@/components/ui/icons";
import {
  getProductionJobs,
  generateProductionAnalytics,
  type ProductionJob,
  type MachineLine,
  type ProductionAnalyticsReport,
} from "@/lib/production/pipeline";
import { CATALOG_DIVISIONS } from "@/lib/catalog/products";
import { getSandboxOutbox, type DispatchedEmail } from "@/lib/email/email-engine";

const MACHINE_OPTIONS: { id: MachineLine; name: string }[] = [
  { id: "ROLAND_VG3_640", name: "Roland TrueVIS VG3-640 (ECO-UV Inkjet & Cutter)" },
  { id: "MIMAKI_UJF_3042", name: "Mimaki UJF-3042 MkII UV Flatbed" },
  { id: "EPILOG_FUSION_PRO", name: "Epilog Fusion Pro 36 Laser 120W" },
  { id: "TRODAT_MULTI_LASER", name: "Trodat Multi-Laser Engraver System" },
  { id: "UNASSIGNED", name: "Unassigned Line" },
];

export default function AdminProductionPage() {
  const [activeTab, setActiveTab] = useState<"QUEUE" | "REPORTS" | "ARCHIVE" | "EMAILS">("QUEUE");

  // Pipeline Data State
  const [jobs, setJobs] = useState<ProductionJob[]>(() => getProductionJobs());
  const [analytics, setAnalytics] = useState<ProductionAnalyticsReport>(() => generateProductionAnalytics());

  // Email Sandbox Outbox State
  const [emails, setEmails] = useState<DispatchedEmail[]>(() => getSandboxOutbox());
  const [emailFilterType, setEmailFilterType] = useState<string>("ALL");
  const [emailSearch, setEmailSearch] = useState<string>("");
  const [selectedEmailForPreview, setSelectedEmailForPreview] = useState<DispatchedEmail | null>(null);
  const [previewMode, setPreviewMode] = useState<"HTML" | "TEXT">("HTML");
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [isSimulatingAlert, setIsSimulatingAlert] = useState(false);
  const [simulateType, setSimulateType] = useState<string>("ORDER_CONFIRMED");
  const [simulateRecipient, setSimulateRecipient] = useState<string>("customer@digitalheroes.demo");

  // Filter States
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<PipelineStage | "ALL">("ALL");
  const [divisionFilter, setDivisionFilter] = useState<string>("ALL");
  const [machineFilter, setMachineFilter] = useState<MachineLine | "ALL">("ALL");
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  // Modals State
  const [selectedJobForMachine, setSelectedJobForMachine] = useState<ProductionJob | null>(null);
  const [allocatedMachine, setAllocatedMachine] = useState<MachineLine>("ROLAND_VG3_640");
  const [assignedOperator, setAssignedOperator] = useState("Sarah Connor (Staff #04)");

  const [selectedJobForHistory, setSelectedJobForHistory] = useState<ProductionJob | null>(null);

  // Delivery & Courier Tracking Modal State
  const [selectedJobForTracking, setSelectedJobForTracking] = useState<ProductionJob | null>(null);
  const [trackingCourier, setTrackingCourier] = useState<string>("Royal Mail Tracked 48");
  const [trackingCode, setTrackingCode] = useState<string>("");
  const [trackingUrlInput, setTrackingUrlInput] = useState<string>("");
  const [trackingStatus, setTrackingStatus] = useState<"DISPATCHED" | "IN_TRANSIT" | "DELIVERED">("DISPATCHED");
  const [trackingEstDelivery, setTrackingEstDelivery] = useState<string>("2 business days");
  const [isSavingTracking, setIsSavingTracking] = useState<boolean>(false);
  const [isGeneratingLabel, setIsGeneratingLabel] = useState<boolean>(false);
  const [generatedLabelBase64, setGeneratedLabelBase64] = useState<string | null>(null);

  const handleAutoGenerateLabel = async () => {
    if (!selectedJobForTracking) return;
    setIsGeneratingLabel(true);
    try {
      const carrier = trackingCourier.includes("DPD") ? "DPD" : "ROYAL_MAIL";
      const res = await fetch("/api/shipping/create-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedJobForTracking.id,
          carrier,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate label");
      setTrackingCode(data.result.trackingNumber);
      setTrackingUrlInput(data.result.trackingUrl);
      setTrackingEstDelivery(data.result.estimatedDelivery);
      if (data.result.labelPdfBase64) {
        setGeneratedLabelBase64(data.result.labelPdfBase64);
      }
      setDownloadMsg(`✓ ${data.result.serviceName} label generated (Tracking #${data.result.trackingNumber}).`);
      setTimeout(() => setDownloadMsg(null), 5000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Label generation failed");
    } finally {
      setIsGeneratingLabel(false);
    }
  };

  const handleSaveTracking = async () => {
    if (!selectedJobForTracking) return;
    setIsSavingTracking(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedJobForTracking.id}/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courierName: trackingCourier,
          trackingNumber: trackingCode || `RM48-${Date.now().toString().slice(-8)}GB`,
          trackingUrl: trackingUrlInput,
          dispatchStatus: trackingStatus,
          estimatedDelivery: trackingEstDelivery,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update tracking");

      setJobs((prev) =>
        prev.map((j) =>
          j.id === selectedJobForTracking.id
            ? {
                ...j,
                stage: trackingStatus === "DELIVERED" ? "COMPLETED" : "COMPLETED",
              }
            : j
        )
      );
      setDownloadMsg(`✓ Tracking recorded for ${selectedJobForTracking.orderNumber}. In-app notification generated.`);
      setTimeout(() => setDownloadMsg(null), 5000);
      setSelectedJobForTracking(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving tracking");
    } finally {
      setIsSavingTracking(false);
    }
  };

  // CSV Variable-Data Modal State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [csvResult, setCsvResult] = useState<{
    totalRecords: number;
    outputFileName: string;
    sampleRecords: Array<{
      bibNumber: string;
      name: string;
      category: string;
      wave?: string;
      barcodeData: string;
    }>;
  } | null>(null);

  // Initial Sync from Live Proof Store
  useEffect(() => {
    fetch("/api/proofs")
      .then((res) => res.json())
      .then((proofStates) => {
        if (Array.isArray(proofStates)) {
          setJobs((prevJobs) =>
            prevJobs.map((job) => {
              const matched = proofStates.find(
                (p) => p.orderNumber === job.id || p.orderId === job.id
              );
              if (matched) {
                return {
                  ...job,
                  proofVersion: `v${matched.currentVersion}`,
                  isProofApproved: matched.isUnlockedForProduction,
                  isReadyForProduction: matched.isUnlockedForProduction,
                };
              }
              return job;
            })
          );
        }
      })
      .catch(() => {});
  }, []);

  // Filter Logic
  const filteredJobs = jobs.filter((job) => {
    const isTargetArchive = activeTab === "ARCHIVE" ? job.isArchived : !job.isArchived;
    if (!isTargetArchive) return false;

    const matchesSearch =
      job.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      job.customerName.toLowerCase().includes(search.toLowerCase()) ||
      job.divisionName.toLowerCase().includes(search.toLowerCase()) ||
      job.assignedOperator.toLowerCase().includes(search.toLowerCase());

    const matchesStage = stageFilter === "ALL" || job.stage === stageFilter;
    const matchesDivision = divisionFilter === "ALL" || job.divisionSlug === divisionFilter;
    const matchesMachine = machineFilter === "ALL" || job.machineAllocation === machineFilter;

    return matchesSearch && matchesStage && matchesDivision && matchesMachine;
  });

  // Stage Progression Handler
  const advanceStage = async (job: ProductionJob) => {
    const stages: PipelineStage[] = [
      "QUOTE",
      "ORDER",
      "ARTWORK",
      "PROOF",
      "PRODUCTION",
      "COMPLETED",
    ];
    const currentIndex = stages.indexOf(job.stage);
    if (currentIndex >= stages.length - 1) return;

    const nextStage = stages[currentIndex + 1];

    try {
      const res = await fetch(`/api/admin/pipeline/${job.id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStage: nextStage,
          user: {
            id: "00000000-0000-0000-0000-000000000099",
            fullName: "Sarah Connor (Staff #04)",
            role: "admin",
          },
          notes: `Floor supervisor moved job from ${job.stage} to ${nextStage}.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to advance stage");
      }

      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? data.job : j))
      );
      setAnalytics(generateProductionAnalytics());
      setDownloadMsg(`✓ Job ${job.orderNumber} successfully advanced to ${nextStage}.`);
      setTimeout(() => setDownloadMsg(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Stage transition failed");
    }
  };

  const handleRefund = async (job: ProductionJob) => {
    const confirmRefund = window.confirm(`Are you sure you want to cancel and refund order ${job.orderNumber}?`);
    if (!confirmRefund) return;
    try {
      const res = await fetch(`/api/admin/orders/${job.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Staff initiated cancellation from production dashboard" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refund failed");
      setDownloadMsg(`✓ Order ${job.orderNumber} marked as REFUNDED and cancelled.`);
      setTimeout(() => setDownloadMsg(null), 4000);
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, stage: "QUOTE" as PipelineStage } : j))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Refund failed");
    }
  };

  // Machine Allocation Handler
  const handleSaveMachineAllocation = async () => {
    if (!selectedJobForMachine) return;

    try {
      const res = await fetch(`/api/admin/pipeline/${selectedJobForMachine.id}/machine`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machine: allocatedMachine,
          operator: assignedOperator,
          user: {
            id: "00000000-0000-0000-0000-000000000099",
            fullName: "Sarah Connor (Staff #04)",
            role: "admin",
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Allocation failed");

      setJobs((prev) =>
        prev.map((j) => (j.id === selectedJobForMachine.id ? data.job : j))
      );
      setAnalytics(generateProductionAnalytics());
      setSelectedJobForMachine(null);
      setDownloadMsg(`✓ Machine line allocated: ${data.job.machineName} for ${data.job.orderNumber}`);
      setTimeout(() => setDownloadMsg(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Machine allocation failed");
    }
  };

  // PDF / PNG Production Master Download Handler
  const handleDownload = async (job: ProductionJob, format: "pdf" | "png" = "pdf") => {
    try {
      const res = await fetch(`/api/production/download/${job.id}`);
      const data = await res.json();

      if (!res.ok || res.status === 423) {
        alert(
          `APPROVAL GATE BLOCKED (HTTP ${res.status}):\n\n${data.message || data.error}\n\nStrict Security Rule: Production print files cannot be downloaded until the customer signs proof approval.`
        );
        return;
      }

      const extUpper = format.toUpperCase();
      setDownloadMsg(
        `Downloading production ${extUpper} master: ${data.fileName || job.fileName} (${data.printSpecs?.resolution || "300 DPI"} + ${data.printSpecs?.bleed || "3mm Bleed"}, FOGRA39 Binary ICC Embedded)`
      );
      if (typeof window !== "undefined") {
        window.open(`/api/production/download/${job.id}?format=${format}`, "_blank");
      }
      setTimeout(() => setDownloadMsg(null), 5000);
    } catch {
      if (!job.isProofApproved) {
        alert(
          `APPROVAL GATE BLOCKED:\n\nCannot download production file '${job.fileName}'.\nProof revision ${job.proofVersion} is NOT approved by customer.`
        );
      } else {
        setDownloadMsg(`Downloading production file: ${job.fileName} (${format.toUpperCase()} 300 DPI)`);
        setTimeout(() => setDownloadMsg(null), 4000);
      }
    }
  };

  // CSV Batch Merge Runner
  const handleRunCsvBatch = async () => {
    setIsProcessingCsv(true);
    try {
      const res = await fetch("/api/variable-data/process-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: "ORD-2026-0892",
          loadSample: true,
          sampleCount: 500,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Batch processing failed");
      setCsvResult(data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "CSV merge failed");
    } finally {
      setIsProcessingCsv(false);
    }
  };

  // Email Sandbox Outbox Handlers
  const fetchEmails = async () => {
    try {
      const res = await fetch("/api/admin/emails?role=admin");
      const data = await res.json();
      if (data.success && Array.isArray(data.emails)) {
        setEmails(data.emails);
      }
    } catch {
      // non-blocking
    }
  };

  const handleResendEmail = async (emailId: string) => {
    try {
      const res = await fetch(`/api/admin/emails/${emailId}/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            id: "00000000-0000-0000-0000-000000000099",
            fullName: "Sarah Connor (Staff #04)",
            role: "admin",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resend failed");
      setDownloadMsg(`✓ Email alert re-dispatched to ${data.email.to}.`);
      setTimeout(() => setDownloadMsg(null), 4000);
      fetchEmails();
      if (selectedEmailForPreview?.id === emailId) {
        setSelectedEmailForPreview(data.email);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to resend email");
    }
  };

  const handleSimulateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulatingAlert(true);
    try {
      let templateData = {};
      const now = new Date().toISOString();
      if (simulateType === "QUOTE_SUBMITTED") {
        templateData = {
          quoteNumber: "QUO-2026-TEST",
          customerName: "Alex Miller",
          customerEmail: simulateRecipient,
          divisionName: "Stamps",
          productName: "Trodat 4913 Self-Inking Commercial Stamp",
          specsSummary: "Red Ink • 58x22mm • 4 Lines Custom Text",
          dimensionsMm: { width: 58, height: 22 },
          quantity: 5,
          estimatedPriceCents: 11000,
          targetResponseHours: 2,
        };
      } else if (simulateType === "ORDER_CONFIRMED") {
        templateData = {
          orderNumber: "ORD-2026-TEST",
          customerName: "Alex Miller",
          customerEmail: simulateRecipient,
          divisionName: "Labels & Stickers",
          productName: "Custom Die-Cut Vinyl Stickers",
          specsSummary: "Standard Vinyl Gloss • 75x50mm • Contour Cut",
          quantity: 100,
          subtotalCents: 4500,
          vatCents: 900,
          totalCents: 5400,
          shippingAddress: {
            recipientName: "Alex Miller",
            addressLine1: "14 Roastery Lane",
            city: "Sheffield",
            postcode: "S1 2EF",
          },
          estimatedDispatchDays: 3,
        };
      } else if (simulateType === "PROOF_READY_FOR_REVIEW") {
        templateData = {
          orderNumber: "ORD-2026-TEST",
          customerName: "Alex Miller",
          customerEmail: simulateRecipient,
          productName: "Custom Die-Cut Vinyl Stickers",
          proofVersion: "v1",
          reviewUrl: "/customer/dashboard?order=ORD-2026-TEST&view=proof",
          specsSummary: "75x50mm • 3mm Bleed",
          changeRequestDeadlineHours: 24,
        };
      } else if (simulateType === "PROOF_APPROVED") {
        templateData = {
          orderNumber: "ORD-2026-TEST",
          customerName: "Alex Miller",
          customerEmail: simulateRecipient,
          productName: "Custom Die-Cut Vinyl Stickers",
          proofVersion: "v1",
          digitalSignatureHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          approvedAt: now,
          machineAllocationName: "Roland TrueVIS VG3-640 (ECO-UV Inkjet & Cutter)",
        };
      } else {
        templateData = {
          orderNumber: "ORD-2026-TEST",
          customerName: "Alex Miller",
          customerEmail: simulateRecipient,
          productName: "Custom Die-Cut Vinyl Stickers",
          quantity: 100,
          carrier: "DPD UK Tracked Express",
          trackingNumber: "DPD-GB-99201948",
          trackingUrl: "https://www.dpd.co.uk/tracking/DPD-GB-99201948",
          invoiceDownloadUrl: "/api/invoices/test-01",
          dispatchedAt: now,
        };
      }

      const res = await fetch("/api/admin/emails/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: simulateType,
          recipientEmail: simulateRecipient,
          recipientName: "Test Recipient",
          referenceId: "ORD-2026-TEST",
          qualifier: `test_${Date.now()}`,
          templateData,
          user: {
            id: "00000000-0000-0000-0000-000000000099",
            fullName: "Sarah Connor (Staff #04)",
            role: "admin",
          },
          forceResend: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Simulation failed");

      setIsSimulateModalOpen(false);
      setDownloadMsg(`✓ Test alert (${simulateType}) generated and logged in outbox!`);
      setTimeout(() => setDownloadMsg(null), 4000);
      fetchEmails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Simulation error");
    } finally {
      setIsSimulatingAlert(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Admin Floor Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#232B34] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#E65A28]">
              Production Console
            </span>
            <span className="text-xs text-[#526071]">•</span>
            <span className="text-xs font-mono text-[#8C98A6]">Single Source of Truth</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
            Factory Floor Pipeline
          </h1>
          <p className="text-sm text-[#9BA8B6] mt-1">
            Manage the queue across all six print divisions: QUOTE → ORDER → ARTWORK → PROOF → PRODUCTION → COMPLETED.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="dark-outline"
            size="sm"
            onClick={() => {
              setActiveTab(activeTab === "ARCHIVE" ? "QUEUE" : "ARCHIVE");
            }}
          >
            {activeTab === "ARCHIVE" ? "Active Queue" : "Archive Search"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCsvModalOpen(true)}
          >
            Run CSV Batch Engine
          </Button>
        </div>
      </div>

      {downloadMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded text-emerald-200 text-xs font-mono flex items-center justify-between">
          <span>{downloadMsg}</span>
          <button onClick={() => setDownloadMsg(null)} className="underline ml-4">
            Close
          </button>
        </div>
      )}

      {/* Console Mode Switcher Tabs */}
      <div className="flex border-b border-[#232B34] gap-6 text-xs font-mono uppercase tracking-wider">
        <button
          onClick={() => setActiveTab("QUEUE")}
          className={`pb-3 font-bold border-b-2 transition-colors ${
            activeTab === "QUEUE"
              ? "border-[#E65A28] text-white"
              : "border-transparent text-[#7F8D9D] hover:text-white"
          }`}
        >
          Active Job Queue ({jobs.filter((j) => !j.isArchived).length})
        </button>
        <button
          onClick={() => setActiveTab("REPORTS")}
          className={`pb-3 font-bold border-b-2 transition-colors ${
            activeTab === "REPORTS"
              ? "border-[#E65A28] text-white"
              : "border-transparent text-[#7F8D9D] hover:text-white"
          }`}
        >
          Throughput & Revenue Reports
        </button>
        <button
          onClick={() => setActiveTab("ARCHIVE")}
          className={`pb-3 font-bold border-b-2 transition-colors ${
            activeTab === "ARCHIVE"
              ? "border-[#E65A28] text-white"
              : "border-transparent text-[#7F8D9D] hover:text-white"
          }`}
        >
          Completed Job Archive ({jobs.filter((j) => j.isArchived).length})
        </button>
        <button
          onClick={() => {
            setActiveTab("EMAILS");
            fetchEmails();
          }}
          className={`pb-3 font-bold border-b-2 transition-colors ${
            activeTab === "EMAILS"
              ? "border-[#E65A28] text-white"
              : "border-transparent text-[#7F8D9D] hover:text-white"
          }`}
        >
          Email Outbox & Alerts
        </button>
      </div>

      {/* TAB 1: ACTIVE QUEUE & PIPELINE */}
      {activeTab === "QUEUE" && (
        <div className="space-y-6">
          {/* Production Analytics Top Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#151A21] border border-[#27323E] rounded-lg p-4">
              <div className="text-xs font-mono text-[#8C98A6] uppercase">Queue Volume</div>
              <div className="text-2xl font-extrabold text-white mt-1">
                {jobs.filter((j) => !j.isArchived).length} Active Jobs
              </div>
              <div className="text-[11px] text-[#5E6D7E] mt-1">Across 6 print divisions</div>
            </div>

            <div className="bg-[#151A21] border border-[#27323E] rounded-lg p-4">
              <div className="text-xs font-mono text-[#8C98A6] uppercase">Ready for Press</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                {jobs.filter((j) => !j.isArchived && j.isProofApproved).length} Unlocked
              </div>
              <div className="text-[11px] text-[#5E6D7E] mt-1">Proof signatures validated</div>
            </div>

            <div className="bg-[#151A21] border border-[#27323E] rounded-lg p-4">
              <div className="text-xs font-mono text-[#8C98A6] uppercase">Approval Gate Blocked</div>
              <div className="text-2xl font-extrabold text-amber-400 mt-1">
                {jobs.filter((j) => !j.isArchived && !j.isProofApproved).length} Locked
              </div>
              <div className="text-[11px] text-[#5E6D7E] mt-1">Awaiting client sign-off</div>
            </div>

            <div className="bg-[#151A21] border border-[#27323E] rounded-lg p-4">
              <div className="text-xs font-mono text-[#8C98A6] uppercase">Active Queue Units</div>
              <div className="text-2xl font-extrabold text-white mt-1">
                {jobs
                  .filter((j) => !j.isArchived)
                  .reduce((sum, j) => sum + j.quantity, 0)
                  .toLocaleString()}{" "}
                Pcs
              </div>
              <div className="text-[11px] text-[#5E6D7E] mt-1">Roland, Mimaki & Epilog lines</div>
            </div>
          </div>

          {/* Pipeline Stage Visual Filter Bar */}
          <div className="bg-[#151A21] border border-[#27323E] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono uppercase tracking-wider text-[#8C98A6]">
                Pipeline Stage Filter
              </div>
              <span className="text-[11px] font-mono text-[#5E6D7E]">
                Sequence: QUOTE → ORDER → ARTWORK → PROOF → PRODUCTION → COMPLETED
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(["ALL", "QUOTE", "ORDER", "ARTWORK", "PROOF", "PRODUCTION", "COMPLETED"] as const).map(
                (stg) => {
                  const count =
                    stg === "ALL"
                      ? jobs.filter((j) => !j.isArchived).length
                      : jobs.filter((j) => !j.isArchived && j.stage === stg).length;
                  return (
                    <button
                      key={stg}
                      onClick={() => setStageFilter(stg)}
                      className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                        stageFilter === stg
                          ? "bg-[#E65A28] text-white font-bold"
                          : "bg-[#1E252D] text-[#8C98A6] hover:text-white"
                      }`}
                    >
                      <span>{stg}</span>
                      <span className="px-1 py-0.2 rounded bg-black/30 text-[10px]">
                        {count}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Secondary Filters: Division, Machine & Search */}
          <div className="bg-[#151A21] border border-[#27323E] rounded-lg p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Division Dropdown */}
              <select
                value={divisionFilter}
                onChange={(e) => setDivisionFilter(e.target.value)}
                aria-label="Filter by division"
                className="bg-[#1C232B] border border-[#27323E] text-xs font-mono text-[#CCD5DF] rounded px-3 py-2 focus:outline-none focus:border-[#E65A28]"
              >
                <option value="ALL">All Print Divisions</option>
                {CATALOG_DIVISIONS.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.number}. {d.name}
                  </option>
                ))}
              </select>

              {/* Machine Line Dropdown */}
              <select
                value={machineFilter}
                onChange={(e) => setMachineFilter(e.target.value as MachineLine | "ALL")}
                aria-label="Filter by machinery line"
                className="bg-[#1C232B] border border-[#27323E] text-xs font-mono text-[#CCD5DF] rounded px-3 py-2 focus:outline-none focus:border-[#E65A28]"
              >
                <option value="ALL">All Machinery Lines</option>
                {MACHINE_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Search Job ID, client, operator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1C232B] border border-[#27323E] rounded px-3 py-2 text-xs text-white placeholder-[#5E6D7E] focus:outline-none focus:border-[#E65A28]"
              />
            </div>
          </div>

          {/* Active Jobs Database Table */}
          <div className="overflow-x-auto border border-[#27323E] rounded-lg bg-[#151A21]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1C232B] text-[#8E9CA9] font-mono uppercase tracking-wider border-b border-[#27323E]">
                <tr>
                  <th className="px-4 py-3">Job ID & Client</th>
                  <th className="px-4 py-3">Division & Specs</th>
                  <th className="px-4 py-3">Qty / Priority</th>
                  <th className="px-4 py-3">Pipeline Stage</th>
                  <th className="px-4 py-3">Assigned Machinery</th>
                  <th className="px-4 py-3">Prepress Gate</th>
                  <th className="px-4 py-3 text-right min-w-[270px]">Floor Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#212933] text-[#CCD5DF]">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-xs font-mono text-[#6E7D8E]">
                      No production jobs match the current filter selection.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-[#1A2028] transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-white flex items-center gap-1.5">
                          <span>{job.orderNumber}</span>
                          {job.priority === "RUSH" && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                              RUSH
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8E9CA9] mt-0.5">{job.customerName}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">{job.divisionName}</div>
                        <div className="text-[11px] text-[#7E8B99] mt-0.5 max-w-xs truncate">
                          {job.specsSummary}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-white font-medium">
                        {job.quantity.toLocaleString()} pcs
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge variant={job.stage} size="sm">
                          {job.stage}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="text-xs text-white font-mono">{job.machineName.split("(")[0]}</div>
                        <div className="text-[11px] text-[#6E7D8E] mt-0.5">
                          Op: {job.assignedOperator}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {job.isProofApproved ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px] font-bold">
                              <IconUnlock className="w-3.5 h-3.5" /> UNLOCKED
                            </span>
                            <span className="block text-[10px] text-[#6E7D8E]">
                              {job.proofVersion} Approved
                            </span>
                            <span className="inline-block mt-0.5 px-1 py-0.2 rounded text-[9px] font-mono bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold" title="ISO 15076-1 Compliant Binary ICC Profile embedded into PDF & PNG masters">
                              ICC: FOGRA39
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 text-amber-400 font-mono text-[11px] font-bold">
                              <IconLock className="w-3.5 h-3.5" /> LOCKED
                            </span>
                            <span className="block text-[10px] text-[#6E7D8E]">
                              {job.proofVersion} Sign-off Req
                            </span>
                            <span className="inline-block mt-0.5 px-1 py-0.2 rounded text-[9px] font-mono bg-slate-900 border border-slate-700 text-slate-400">
                              ICC: Pending
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1.5 min-w-[280px] w-fit ml-auto">
                          {/* Row 1: Primary Masters & Stage Advance */}
                          <div className="flex items-center gap-1.5 flex-nowrap">
                            <Button
                              variant="dark-outline"
                              size="sm"
                              className={`h-7 px-2.5 text-[11px] font-mono border rounded whitespace-nowrap ${
                                job.isProofApproved
                                  ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60"
                                  : "border-[#2E3844] bg-[#161C23] text-[#6E7D8E]"
                              }`}
                              onClick={() => handleDownload(job, "pdf")}
                              title={job.isProofApproved ? "Download Print PDF" : "Locked - Requires Proof Approval"}
                            >
                              <IconDownload className="w-3 h-3 mr-1" /> PDF
                            </Button>

                            <Button
                              variant="dark-outline"
                              size="sm"
                              className={`h-7 px-2.5 text-[11px] font-mono border rounded whitespace-nowrap ${
                                job.isProofApproved
                                  ? "border-sky-500/50 bg-sky-950/40 text-sky-300 hover:bg-sky-900/60"
                                  : "border-[#2E3844] bg-[#161C23] text-[#6E7D8E]"
                              }`}
                              onClick={() => handleDownload(job, "png")}
                              title={job.isProofApproved ? "Download 300 DPI PNG Master" : "Locked - Requires Proof Approval"}
                            >
                              <IconDownload className="w-3 h-3 mr-1" /> PNG
                            </Button>

                            <Button
                              variant="primary"
                              size="sm"
                              className="h-7 px-3 text-[11px] font-mono font-bold bg-[#E65A28] hover:bg-[#CF4919] text-white rounded shadow-xs whitespace-nowrap"
                              onClick={() => advanceStage(job)}
                              title={`Advance ${job.orderNumber} to next pipeline stage`}
                            >
                              Next →
                            </Button>
                          </div>

                          {/* Row 2: Secondary Floor Operations */}
                          <div className="flex items-center gap-1.5 flex-nowrap">
                            <button
                              onClick={() => {
                                setSelectedJobForMachine(job);
                                setAllocatedMachine(job.machineAllocation);
                                setAssignedOperator(job.assignedOperator);
                              }}
                              className="h-6 px-2 text-[10px] font-mono rounded bg-[#1A222B] border border-[#2B3744] text-[#8E9CA9] hover:text-white hover:bg-[#222D39] transition-colors whitespace-nowrap"
                              title="Assign Machine Line & Operator"
                            >
                              Machine
                            </button>

                            <button
                              onClick={() => {
                                setSelectedJobForTracking(job);
                                setTrackingCourier("Royal Mail Tracked 48");
                                setTrackingCode(`RM48-${Date.now().toString().slice(-8)}GB`);
                                setTrackingUrlInput("");
                                setTrackingStatus("DISPATCHED");
                                setTrackingEstDelivery("2 business days");
                              }}
                              className="h-6 px-2 text-[10px] font-mono rounded bg-blue-950/40 border border-blue-700/40 text-blue-300 hover:bg-blue-900/50 transition-colors whitespace-nowrap"
                              title="Record courier tracking"
                            >
                              📦 Track
                            </button>

                            <button
                              onClick={() => setSelectedJobForHistory(job)}
                              className="h-6 px-2 text-[10px] font-mono rounded bg-[#1A222B] border border-[#2B3744] text-[#8E9CA9] hover:text-white hover:bg-[#222D39] transition-colors whitespace-nowrap"
                              title="Audit Lifecycle History"
                            >
                              Audit
                            </button>

                            <button
                              onClick={() => handleRefund(job)}
                              className="h-6 px-2 text-[10px] font-mono rounded bg-rose-950/30 border border-rose-800/30 text-rose-300 hover:bg-rose-900/50 transition-colors whitespace-nowrap"
                              title="Issue refund and cancel job"
                            >
                              Refund
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: THROUGHPUT & FINANCIAL REPORTS */}
      {activeTab === "REPORTS" && (
        <div className="space-y-6">
          {/* Key Financial & Volume Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#151A21] border border-[#27323E] rounded-lg p-4">
              <div className="text-xs font-mono text-[#8C98A6] uppercase">Total Invoiced (Gross)</div>
              <div className="text-2xl font-extrabold text-[#E65A28] mt-1 font-mono">
                £{(analytics.summary.totalGrossRevenueCents / 100).toFixed(2)}
              </div>
              <div className="text-[11px] text-[#5E6D7E] mt-1">Across all 6 print divisions</div>
            </div>

            <div className="bg-[#151A21] border border-[#27323E] rounded-lg p-4">
              <div className="text-xs font-mono text-[#8C98A6] uppercase">Net Turnover</div>
              <div className="text-2xl font-extrabold text-white mt-1 font-mono">
                £{(analytics.summary.totalNetRevenueCents / 100).toFixed(2)}
              </div>
              <div className="text-[11px] text-[#5E6D7E] mt-1">Excluding 20% UK VAT</div>
            </div>

            <div className="bg-[#151A21] border border-[#27323E] rounded-lg p-4">
              <div className="text-xs font-mono text-[#8C98A6] uppercase">Total VAT Collected</div>
              <div className="text-2xl font-extrabold text-white mt-1 font-mono">
                £{(analytics.summary.totalVatCents / 100).toFixed(2)}
              </div>
              <div className="text-[11px] text-[#5E6D7E] mt-1">HMRC Standard 20% Rate</div>
            </div>

            <div className="bg-[#151A21] border border-[#27323E] rounded-lg p-4">
              <div className="text-xs font-mono text-[#8C98A6] uppercase">Total Units Run</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
                {analytics.summary.totalUnitsProduced.toLocaleString()} Pcs
              </div>
              <div className="text-[11px] text-[#5E6D7E] mt-1">Physical units produced</div>
            </div>
          </div>

          {/* Division Throughput Breakdown Table */}
          <div className="border border-[#27323E] rounded-lg bg-[#151A21] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#232B34] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  Product Family Throughput Breakdown
                </h3>
                <p className="text-xs text-[#7F8D9D] mt-0.5">
                  Volume and revenue metrics across all six distinct manufacturing workflows.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400">Status: Real-Time Synced</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181E26] text-[#717F8E] font-mono uppercase text-[10px] border-b border-[#27323E]">
                  <tr>
                    <th className="p-3">Division</th>
                    <th className="p-3 text-right">Active</th>
                    <th className="p-3 text-right">Completed</th>
                    <th className="p-3 text-right">Total Units</th>
                    <th className="p-3 text-right">Net Sales</th>
                    <th className="p-3 text-right">VAT (20%)</th>
                    <th className="p-3 text-right">Gross Total</th>
                    <th className="p-3">Primary Equipment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#212933] font-mono text-[#CCD5DF]">
                  {analytics.divisionBreakdown.map((div) => (
                    <tr key={div.divisionSlug} className="hover:bg-[#1A2028]">
                      <td className="p-3 font-bold text-white">
                        {div.number}. {div.divisionName}
                      </td>
                      <td className="p-3 text-right">{div.activeJobs}</td>
                      <td className="p-3 text-right">{div.completedJobs}</td>
                      <td className="p-3 text-right font-semibold text-emerald-400">
                        {div.totalUnitsProduced.toLocaleString()}
                      </td>
                      <td className="p-3 text-right">£{(div.netRevenueCents / 100).toFixed(2)}</td>
                      <td className="p-3 text-right">£{(div.vatCents / 100).toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-white">
                        £{(div.grossRevenueCents / 100).toFixed(2)}
                      </td>
                      <td className="p-3 text-[11px] text-[#7E8B99] truncate max-w-xs">
                        {div.primaryMachinery}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Machine Line Load Monitor */}
          <div className="border border-[#27323E] rounded-lg bg-[#151A21] p-4 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Machinery Line Load & Queue Monitor
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(Object.keys(analytics.machineUtilization) as MachineLine[])
                .filter((k) => k !== "UNASSIGNED")
                .map((key) => {
                  const m = analytics.machineUtilization[key];
                  return (
                    <div key={key} className="bg-[#1C232B] p-4 rounded border border-[#27323E] space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-white truncate max-w-[150px]">
                          {m.name.split("(")[0]}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            m.status === "HEAVY"
                              ? "bg-amber-500/20 text-amber-300"
                              : m.status === "IDLE"
                              ? "bg-slate-700 text-slate-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-white font-mono">
                        {m.activeJobCount} Jobs Queued
                      </div>
                      <div className="text-[11px] text-[#7E8B99] font-mono">
                        {m.queuedUnits.toLocaleString()} units scheduled
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMPLETED JOB ARCHIVE */}
      {activeTab === "ARCHIVE" && (
        <div className="space-y-4">
          <div className="bg-[#151A21] border border-[#27323E] rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Permanent Job Archive
              </h3>
              <p className="text-xs text-[#8E9CA9] mt-0.5">
                Searchable history of all completed and dispatched print orders.
              </p>
            </div>
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Search archived jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1C232B] border border-[#27323E] rounded px-3 py-2 text-xs text-white placeholder-[#5E6D7E] focus:outline-none focus:border-[#E65A28]"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-[#27323E] rounded-lg bg-[#151A21]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1C232B] text-[#8E9CA9] font-mono uppercase tracking-wider border-b border-[#27323E]">
                <tr>
                  <th className="px-4 py-3">Order # & Customer</th>
                  <th className="px-4 py-3">Division & Product</th>
                  <th className="px-4 py-3">Run Qty</th>
                  <th className="px-4 py-3">Invoice Total</th>
                  <th className="px-4 py-3">Completed Date</th>
                  <th className="px-4 py-3 text-right">Archive File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#212933] font-mono text-[#CCD5DF]">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[#6E7D8E]">
                      No archived jobs found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-[#1A2028]">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white">{job.orderNumber}</div>
                        <div className="text-[11px] text-[#8E9CA9]">{job.customerName}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">{job.productName}</div>
                        <div className="text-[11px] text-[#7E8B99]">{job.divisionName}</div>
                      </td>
                      <td className="px-4 py-3.5">{job.quantity.toLocaleString()} pcs</td>
                      <td className="px-4 py-3.5 font-bold text-emerald-400">
                        £{(job.revenueTotalCents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-[#8E9CA9]">{job.dueDate}</td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="dark-outline"
                            size="sm"
                            className="text-xs py-1 h-7 border-[#384350]"
                            onClick={() => handleDownload(job, "pdf")}
                          >
                            <IconDownload className="w-3 h-3 mr-1" /> PDF
                          </Button>

                          <Button
                            variant="dark-outline"
                            size="sm"
                            className={`text-xs py-1 h-7 border-[#384350] ${
                              job.isProofApproved
                                ? "border-sky-500/50 bg-sky-950/40 text-sky-300 hover:bg-sky-900/60"
                                : "bg-[#1E252D] text-[#7E8B99] hover:bg-[#252E38]"
                            }`}
                            onClick={() => handleDownload(job, "png")}
                          >
                            <IconDownload className="w-3 h-3 mr-1" /> PNG
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: EMAIL SANDBOX OUTBOX & ALERTS LOG */}
      {activeTab === "EMAILS" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#E65A28]"></span>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Transactional Email Dispatch Outbox
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Development Sandbox Active
                </span>
              </div>
              <p className="text-xs text-[#8E9CA9] mt-1 font-mono">
                Inspect outbound customer lifecycle alerts, review responsive HTML previews, check idempotency keys, and trigger resends.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsSimulateModalOpen(true)}
              >
                + Simulate Lifecycle Alert
              </Button>
              <Button
                variant="dark-outline"
                size="sm"
                onClick={fetchEmails}
              >
                ↻ Refresh Outbox
              </Button>
            </div>
          </div>

          {/* Email Filter Bar */}
          <div className="bg-[#151A21] border border-[#27323E] rounded-lg p-4 space-y-3 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[#8E9CA9] uppercase font-bold text-[10px] mr-1">Alert Type:</span>
              {[
                "ALL",
                "QUOTE_SUBMITTED",
                "ORDER_CONFIRMED",
                "PROOF_READY_FOR_REVIEW",
                "PROOF_APPROVED",
                "JOB_COMPLETED_DISPATCHED",
              ].map((type) => (
                <button
                  key={type}
                  onClick={() => setEmailFilterType(type)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                    emailFilterType === type
                      ? "bg-[#E65A28] text-white"
                      : "bg-[#1C232B] text-[#8E9CA9] hover:text-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div>
              <input
                type="text"
                placeholder="Search by recipient, subject, reference # or idempotency key..."
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                className="w-full bg-[#1C232B] border border-[#27323E] rounded p-2 text-white placeholder-[#5E6D7E] text-xs focus:outline-none focus:border-[#E65A28]"
              />
            </div>
          </div>

          {/* Outbox Table */}
          <div className="border border-[#27323E] rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#151A21] text-[#717F8E] uppercase text-[10px] border-b border-[#27323E]">
                <tr>
                  <th className="p-3">Dispatched At</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Subject Line</th>
                  <th className="p-3">Idempotency Key</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2732] bg-[#101419] text-[#CCD5DF]">
                {emails
                  .filter((e) => emailFilterType === "ALL" || e.eventType === emailFilterType)
                  .filter((e) => {
                    if (!emailSearch) return true;
                    const s = emailSearch.toLowerCase();
                    return (
                      e.to.toLowerCase().includes(s) ||
                      e.toName.toLowerCase().includes(s) ||
                      e.subject.toLowerCase().includes(s) ||
                      e.referenceId.toLowerCase().includes(s) ||
                      e.idempotencyKey.toLowerCase().includes(s)
                    );
                  })
                  .map((email) => (
                    <tr key={email.id} className="hover:bg-[#151A21]">
                      <td className="p-3 text-[#8E9CA9] whitespace-nowrap">
                        {new Date(email.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        <span className="block text-[10px] text-[#556371]">{email.sentAt.split("T")[0]}</span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1C232B] border border-[#334155] text-amber-300">
                          {email.eventType}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-white">{email.toName}</div>
                        <div className="text-[11px] text-[#8E9CA9]">{email.to}</div>
                      </td>
                      <td className="p-3 text-white max-w-xs truncate" title={email.subject}>
                        {email.subject}
                      </td>
                      <td className="p-3 text-[#798897] text-[10px] truncate max-w-[140px]" title={email.idempotencyKey}>
                        {email.idempotencyKey}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">
                          {email.status}
                        </span>
                        {email.resendHistory && email.resendHistory.length > 0 && (
                          <span className="block text-[9px] text-amber-400 mt-0.5">
                            Resent ({email.resendHistory.length}x)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap space-x-2">
                        <Button
                          variant="dark-outline"
                          size="sm"
                          className="border-[#384350] bg-[#1C232B] text-white hover:bg-[#2A3440] text-[11px] py-1 h-7"
                          onClick={() => {
                            setSelectedEmailForPreview(email);
                            setPreviewMode("HTML");
                          }}
                        >
                          Preview
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-400 hover:text-amber-300 text-[11px] py-1 h-7"
                          onClick={() => handleResendEmail(email.id)}
                        >
                          Resend
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Machine Line Allocation Modal */}
      {selectedJobForMachine && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#151A21] border border-[#27323E] rounded-lg max-w-lg w-full p-6 space-y-5 shadow-2xl text-white">
            <div className="flex items-start justify-between border-b border-[#232B34] pb-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E65A28]">
                  Floor Dispatch
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Allocate Machine Line: {selectedJobForMachine.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedJobForMachine(null)}
                className="text-xs font-mono text-[#8E9CA9] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#8E9CA9] mb-1.5 uppercase">
                  Select Production Equipment Line
                </label>
                <select
                  value={allocatedMachine}
                  onChange={(e) => setAllocatedMachine(e.target.value as MachineLine)}
                  aria-label="Machinery allocation line"
                  className="w-full bg-[#1C232B] border border-[#27323E] rounded p-2.5 text-white focus:outline-none focus:border-[#E65A28]"
                >
                  {MACHINE_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#8E9CA9] mb-1.5 uppercase">
                  Assign Lead Press Operator
                </label>
                <input
                  type="text"
                  value={assignedOperator}
                  onChange={(e) => setAssignedOperator(e.target.value)}
                  className="w-full bg-[#1C232B] border border-[#27323E] rounded p-2.5 text-white focus:outline-none focus:border-[#E65A28]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#232B34]">
              <Button
                variant="dark-outline"
                size="sm"
                onClick={() => setSelectedJobForMachine(null)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveMachineAllocation}>
                Confirm Allocation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Pipeline Audit History Modal */}
      {selectedJobForHistory && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#151A21] border border-[#27323E] rounded-lg max-w-xl w-full p-6 space-y-5 shadow-2xl text-white">
            <div className="flex items-start justify-between border-b border-[#232B34] pb-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E65A28]">
                  Audit Trail
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Pipeline History: {selectedJobForHistory.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedJobForHistory(null)}
                className="text-xs font-mono text-[#8E9CA9] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto font-mono text-xs">
              {selectedJobForHistory.auditHistory.length === 0 ? (
                <div className="text-center py-6 text-[#7E8B99]">
                  No pipeline transitions recorded yet for this job.
                </div>
              ) : (
                selectedJobForHistory.auditHistory.map((item) => (
                  <div key={item.id} className="p-3 bg-[#1C232B] rounded border border-[#27323E] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold">
                        {item.fromStage} → {item.toStage}
                      </span>
                      <span className="text-[10px] text-[#7E8B99]">
                        {item.timestamp.replace("T", " ").slice(0, 19)}
                      </span>
                    </div>
                    <p className="text-white text-[11px]">{item.notes}</p>
                    <div className="text-[10px] text-[#7E8B99]">
                      Staff: {item.updatedBy.fullName}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#232B34]">
              <Button
                variant="dark-outline"
                size="sm"
                onClick={() => setSelectedJobForHistory(null)}
              >
                Close Audit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Courier & Delivery Tracking Modal */}
      {selectedJobForTracking && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#151A21] border border-[#27323E] rounded-lg max-w-lg w-full p-6 space-y-5 shadow-2xl text-white">
            <div className="flex items-start justify-between border-b border-[#232B34] pb-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E65A28]">
                  Dispatch Logistics (Simulated Mode)
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Courier Tracking: {selectedJobForTracking.orderNumber}
                </h3>
                <span className="text-xs text-[#8E9CA9]">
                  {selectedJobForTracking.productName} ({selectedJobForTracking.quantity} units)
                </span>
              </div>
              <button
                onClick={() => setSelectedJobForTracking(null)}
                className="text-xs font-mono text-[#8E9CA9] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#8E9CA9] mb-1.5 uppercase">Courier Partner</label>
                <select
                  value={trackingCourier}
                  onChange={(e) => setTrackingCourier(e.target.value)}
                  className="w-full bg-[#1C232B] border border-[#27323E] rounded p-2.5 text-white focus:outline-none focus:border-[#E65A28]"
                >
                  <option value="Royal Mail Tracked 48">Royal Mail Tracked 48</option>
                  <option value="Royal Mail Special Delivery (Guaranteed 1pm)">Royal Mail Special Delivery</option>
                  <option value="DPD UK Next Day Express">DPD UK Next Day Express</option>
                  <option value="FedEx Express UK">FedEx Express UK</option>
                  <option value="DHL Express Domestic">DHL Express Domestic</option>
                  <option value="Factory Collection / Courier Pickup">Factory Collection / Counter Pickup</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[#8E9CA9] uppercase">Consignment / Tracking Number</label>
                  <button
                    type="button"
                    disabled={isGeneratingLabel}
                    onClick={handleAutoGenerateLabel}
                    className="text-[11px] text-[#E65A28] hover:text-[#CF4919] font-bold underline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {isGeneratingLabel ? "Connecting Carrier API..." : "⚡ Auto-Generate via Carrier API"}
                  </button>
                </div>
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="e.g. GB982736189 / DPD-0928192"
                  className="w-full bg-[#1C232B] border border-[#27323E] rounded p-2.5 text-white font-mono"
                />
              </div>

              {generatedLabelBase64 && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-700/50 rounded flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-300 font-bold">✓ 4x6" Thermal Label Generated</span>
                  <button
                    type="button"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = `data:application/pdf;base64,${generatedLabelBase64}`;
                      link.download = `SHIPPING_LABEL_${selectedJobForTracking.orderNumber}.pdf`;
                      link.click();
                    }}
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-bold"
                  >
                    ⭳ Download Label PDF
                  </button>
                </div>
              )}

              <div>
                <label className="block text-[#8E9CA9] mb-1.5 uppercase">
                  Public Tracking URL (Leave blank for auto-format)
                </label>
                <input
                  type="url"
                  value={trackingUrlInput}
                  onChange={(e) => setTrackingUrlInput(e.target.value)}
                  placeholder="https://track.royalmail.com/..."
                  className="w-full bg-[#1C232B] border border-[#27323E] rounded p-2.5 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8E9CA9] mb-1.5 uppercase">Dispatch Status</label>
                  <select
                    value={trackingStatus}
                    onChange={(e) =>
                      setTrackingStatus(e.target.value as "DISPATCHED" | "IN_TRANSIT" | "DELIVERED")
                    }
                    className="w-full bg-[#1C232B] border border-[#27323E] rounded p-2.5 text-white"
                  >
                    <option value="DISPATCHED">DISPATCHED (Handed to courier)</option>
                    <option value="IN_TRANSIT">IN TRANSIT (Out for delivery)</option>
                    <option value="DELIVERED">DELIVERED (Signed for)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#8E9CA9] mb-1.5 uppercase">Estimated Delivery</label>
                  <input
                    type="text"
                    value={trackingEstDelivery}
                    onChange={(e) => setTrackingEstDelivery(e.target.value)}
                    placeholder="e.g. 2 business days"
                    className="w-full bg-[#1C232B] border border-[#27323E] rounded p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#0E1318] border border-[#232B34] rounded text-[11px] text-[#8E9CA9] space-y-1">
                <div className="text-white font-bold">Courier Dispatch (Mock / Development Mode):</div>
                <div className="text-amber-400">⚡ Operating in simulated mode — zero external business/courier accounts required</div>
                <div>✓ Generates simulated tracking link &amp; customer alert for {selectedJobForTracking.customerName}</div>
                <div className="text-emerald-400">✓ 4x6" printable thermal label generated in internal PDF mode</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#232B34]">
              <Button
                variant="dark-outline"
                size="sm"
                onClick={() => setSelectedJobForTracking(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isSavingTracking}
                onClick={handleSaveTracking}
                className="bg-[#E65A28] hover:bg-[#CF4919] text-white font-bold font-mono"
              >
                {isSavingTracking ? "Saving & Notifying..." : "Save Tracking & Notify"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Factory Floor CSV Variable-Data Studio Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#151A21] border border-[#27323E] rounded-lg max-w-3xl w-full p-6 space-y-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#232B34] pb-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E65A28]">
                  Factory Prepress Automation
                </span>
                <h3 className="text-xl font-extrabold text-white mt-1">
                  CSV Variable-Data Engine (500-Runner Merge)
                </h3>
                <p className="text-xs text-[#8E9CA9] mt-0.5">
                  Merge CSV records into 300 DPI print-ready layouts with adaptive font fitting and crop marks.
                </p>
              </div>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="text-xs font-mono text-[#8E9CA9] hover:text-white px-2 py-1 rounded bg-[#1C232B]"
              >
                ✕ Close
              </button>
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-[#1C232B] rounded border border-[#27323E] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold text-white block">
                  Target Job: ORD-2026-0892 (Alpine Enduro Tyvek Bibs)
                </span>
                <span className="text-[11px] text-[#8E9CA9]">
                  Specs: 210x148mm • 3mm Bleed • 4-Hole Punch Guides • 300 DPI
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                disabled={isProcessingCsv}
                onClick={handleRunCsvBatch}
              >
                {isProcessingCsv ? "Merging 500 Records..." : "▶ Load & Process 500 Runners"}
              </Button>
            </div>

            {/* Merge Results & Record Inspector */}
            {csvResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-3 bg-[#1C232B] rounded border border-[#27323E]">
                    <span className="text-[#8E9CA9] block text-[10px] uppercase">Total Merged</span>
                    <span className="text-lg font-bold text-emerald-400">
                      {csvResult.totalRecords} Athletes
                    </span>
                  </div>
                  <div className="p-3 bg-[#1C232B] rounded border border-[#27323E]">
                    <span className="text-[#8E9CA9] block text-[10px] uppercase">Resolution & Bleed</span>
                    <span className="text-lg font-bold text-white">300 DPI • 3.0mm</span>
                  </div>
                  <div className="p-3 bg-[#1C232B] rounded border border-[#27323E]">
                    <span className="text-[#8E9CA9] block text-[10px] uppercase">Archive Output</span>
                    <span className="text-sm font-bold text-purple-400 truncate block">
                      {csvResult.outputFileName}
                    </span>
                  </div>
                </div>

                {/* Sample Records Table */}
                <div className="border border-[#27323E] rounded overflow-hidden text-xs">
                  <div className="p-2.5 bg-[#1C232B] border-b border-[#27323E] font-mono text-[11px] font-bold text-[#8E9CA9] uppercase flex justify-between">
                    <span>Sample Rendered Records (First 5 of {csvResult.totalRecords})</span>
                    <span className="text-emerald-400">Adaptive Font Shrink: Active</span>
                  </div>
                  <table className="w-full text-left">
                    <thead className="bg-[#181E26] text-[#717F8E] font-mono uppercase text-[10px] border-b border-[#27323E]">
                      <tr>
                        <th className="p-2.5">Bib #</th>
                        <th className="p-2.5">Athlete Name</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Wave</th>
                        <th className="p-2.5">Timing Barcode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#212933] font-mono text-[#CCD5DF]">
                      {csvResult.sampleRecords.map((r, idx) => (
                        <tr key={idx} className="hover:bg-[#1E252D]">
                          <td className="p-2.5 font-bold text-white text-sm">#{r.bibNumber}</td>
                          <td className="p-2.5 font-medium text-emerald-300">{r.name}</td>
                          <td className="p-2.5">{r.category}</td>
                          <td className="p-2.5 text-[#8E9CA9]">{r.wave || "Wave 1"}</td>
                          <td className="p-2.5 text-purple-300 font-bold">{r.barcodeData}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#232B34]">
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                    <IconUnlock className="w-3.5 h-3.5" /> 500-page batch print stream compiled successfully.
                  </span>
                  <Button
                    variant="dark-outline"
                    size="sm"
                    onClick={() => {
                      alert(`Downloading 500-page batch print file: ${csvResult.outputFileName}`);
                    }}
                  >
                    <IconDownload className="w-3 h-3 mr-1" /> Download Merged Print Archive
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-[#27323E] rounded-lg space-y-2">
                <span className="text-xs font-mono text-[#8E9CA9] block">
                  Click &quot;Load & Process 500 Runners&quot; to test the automated CSV merge engine.
                </span>
                <span className="text-[11px] text-[#5E6D7E] block">
                  Simulates multi-page variable rendering for large mass-participation races.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: Email Inspection & Preview Modal */}
      {selectedEmailForPreview && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
          <div className="bg-[#151A21] border border-[#27323E] rounded-lg max-w-3xl w-full p-6 space-y-4 shadow-2xl text-white max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-[#232B34] pb-3 shrink-0">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E65A28]">
                  Outbox Transmission Inspector
                </span>
                <h3 className="text-base font-bold text-white mt-0.5 truncate max-w-xl">
                  {selectedEmailForPreview.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEmailForPreview(null)}
                className="text-xs font-mono text-[#8E9CA9] hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Email Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono shrink-0 p-3 bg-[#1C232B] rounded border border-[#27323E]">
              <div>
                <span className="text-[#8E9CA9] block text-[10px] uppercase">Recipient</span>
                <span className="text-white font-bold truncate block">{selectedEmailForPreview.to}</span>
              </div>
              <div>
                <span className="text-[#8E9CA9] block text-[10px] uppercase">Alert Type</span>
                <span className="text-amber-400 font-bold block">{selectedEmailForPreview.eventType}</span>
              </div>
              <div>
                <span className="text-[#8E9CA9] block text-[10px] uppercase">Status</span>
                <span className="text-emerald-400 font-bold block">{selectedEmailForPreview.status}</span>
              </div>
              <div>
                <span className="text-[#8E9CA9] block text-[10px] uppercase">Idempotency Key</span>
                <span className="text-[#8E9CA9] truncate block" title={selectedEmailForPreview.idempotencyKey}>
                  {selectedEmailForPreview.idempotencyKey}
                </span>
              </div>
            </div>

            {/* Preview Mode Selector */}
            <div className="flex items-center justify-between border-b border-[#232B34] pb-2 shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewMode("HTML")}
                  className={`px-3 py-1 text-xs font-mono font-bold rounded ${
                    previewMode === "HTML" ? "bg-[#E65A28] text-white" : "bg-[#1C232B] text-[#8E9CA9]"
                  }`}
                >
                  Rendered Responsive HTML
                </button>
                <button
                  onClick={() => setPreviewMode("TEXT")}
                  className={`px-3 py-1 text-xs font-mono font-bold rounded ${
                    previewMode === "TEXT" ? "bg-[#E65A28] text-white" : "bg-[#1C232B] text-[#8E9CA9]"
                  }`}
                >
                  Plaintext Terminal View
                </button>
              </div>
              <span className="text-[11px] font-mono text-[#8E9CA9]">
                Sent: {new Date(selectedEmailForPreview.sentAt).toLocaleString()}
              </span>
            </div>

            {/* Preview Frame */}
            <div className="grow overflow-hidden rounded border border-[#27323E] min-h-[360px] bg-[#0B1120]">
              {previewMode === "HTML" ? (
                <iframe
                  title="Email HTML Preview"
                  srcDoc={selectedEmailForPreview.htmlBody}
                  className="w-full h-full min-h-[360px] border-none bg-transparent"
                  sandbox="allow-same-origin"
                />
              ) : (
                <pre className="p-4 text-xs font-mono text-[#CCD5DF] whitespace-pre-wrap overflow-y-auto max-h-[400px]">
                  {selectedEmailForPreview.textBody}
                </pre>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-[#232B34] shrink-0">
              <span className="text-[11px] font-mono text-[#8E9CA9]">
                Server Gate: Prepress alerts require authenticated triggers.
              </span>
              <div className="flex gap-2">
                <Button
                  variant="dark-outline"
                  size="sm"
                  onClick={() => handleResendEmail(selectedEmailForPreview.id)}
                >
                  Resend Alert to Recipient
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedEmailForPreview(null)}
                >
                  Close Inspector
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Simulate & Dispatch Test Alert Modal */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#151A21] border border-[#27323E] rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-start justify-between border-b border-[#232B34] pb-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E65A28]">
                  QA / Sandbox Dispatch
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Simulate Lifecycle Alert
                </h3>
              </div>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="text-xs font-mono text-[#8E9CA9] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimulateAlert} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#8E9CA9] uppercase font-bold text-[10px] mb-1.5">
                  Select Alert Event Type
                </label>
                <select
                  value={simulateType}
                  onChange={(e) => setSimulateType(e.target.value)}
                  className="w-full bg-[#1C232B] border border-[#27323E] rounded p-2.5 text-white focus:outline-none focus:border-[#E65A28]"
                >
                  <option value="QUOTE_SUBMITTED">QUOTE_SUBMITTED (Custom Quote SLA)</option>
                  <option value="ORDER_CONFIRMED">ORDER_CONFIRMED (Payment & Preflight)</option>
                  <option value="PROOF_READY_FOR_REVIEW">PROOF_READY_FOR_REVIEW (Proof Gate)</option>
                  <option value="PROOF_APPROVED">PROOF_APPROVED (Digital Signature)</option>
                  <option value="JOB_COMPLETED_DISPATCHED">JOB_COMPLETED_DISPATCHED (Courier Tracking)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#8E9CA9] uppercase font-bold text-[10px] mb-1.5">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={simulateRecipient}
                  onChange={(e) => setSimulateRecipient(e.target.value)}
                  required
                  className="w-full bg-[#1C232B] border border-[#27323E] rounded p-2.5 text-white focus:outline-none focus:border-[#E65A28]"
                />
              </div>

              <div className="p-3 bg-[#1C232B] rounded border border-[#27323E] text-[11px] text-[#8E9CA9] space-y-1">
                <div>&bull; Renders boutique-industrial responsive HTML + plaintext.</div>
                <div>&bull; Enforces RFC 5322 anti-CRLF injection checks.</div>
                <div>&bull; Logs directly to development sandbox outbox.</div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#232B34]">
                <Button
                  type="button"
                  variant="dark-outline"
                  size="sm"
                  onClick={() => setIsSimulateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSimulatingAlert}
                >
                  {isSimulatingAlert ? "Dispatching..." : "Send Test Alert"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
