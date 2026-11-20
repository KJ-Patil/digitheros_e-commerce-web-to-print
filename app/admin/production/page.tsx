"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, PipelineStage } from "@/components/ui/badge";
import {
  IconLock,
  IconUnlock,
  IconDownload,
} from "@/components/ui/icons";

interface Job {
  id: string;
  customer: string;
  division: string;
  specs: string;
  quantity: number;
  stage: PipelineStage;
  proofVersion: string;
  isProofApproved: boolean;
  orderDate: string;
  fileName: string;
  isCsvMerge?: boolean;
}

const INITIAL_JOBS: Job[] = [
  {
    id: "ORD-2026-0891",
    customer: "Peak Coffee Roasters",
    division: "Labels & Stickers",
    specs: "75x50mm Gloss Vinyl • Die-cut oval",
    quantity: 1000,
    stage: "PRODUCTION",
    proofVersion: "v2",
    isProofApproved: true,
    orderDate: "2026-03-23",
    fileName: "ORD-2026-0891_Labels_20260323_Output.pdf",
  },
  {
    id: "ORD-2026-0892",
    customer: "Alpine Enduro Trail",
    division: "Race & Event Numbers",
    specs: "210x148mm Tyvek • 4-hole punch • Barcode merge",
    quantity: 500,
    stage: "PROOF",
    proofVersion: "v1",
    isProofApproved: false,
    orderDate: "2026-03-24",
    fileName: "ORD-2026-0892_RaceBibs_20260324_Output.pdf",
    isCsvMerge: true,
  },
  {
    id: "ORD-2026-0893",
    customer: "RedRock Gravity Cup",
    division: "MTB Boards",
    specs: "800μ Polypropylene • Custom contour cut",
    quantity: 250,
    stage: "ARTWORK",
    proofVersion: "v1",
    isProofApproved: false,
    orderDate: "2026-03-24",
    fileName: "ORD-2026-0893_MTBBoards_20260324_Output.pdf",
  },
  {
    id: "ORD-2026-0888",
    customer: "Apex Motorsport Club",
    division: "Trophies",
    specs: "10mm Crystal Acrylic • Laser engraved + wooden base",
    quantity: 18,
    stage: "COMPLETED",
    proofVersion: "v1",
    isProofApproved: true,
    orderDate: "2026-03-20",
    fileName: "ORD-2026-0888_Trophies_20260320_Output.pdf",
  },
  {
    id: "ORD-2026-0895",
    customer: "Craft Law Chambers",
    division: "Stamps",
    specs: "45mm Self-inking Trodat • Deep laser rubber",
    quantity: 5,
    stage: "ORDER",
    proofVersion: "v0",
    isProofApproved: false,
    orderDate: "2026-03-25",
    fileName: "ORD-2026-0895_Stamps_20260325_Output.pdf",
  },
];

export default function AdminProductionPage() {
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.id.toLowerCase().includes(search.toLowerCase()) ||
      job.customer.toLowerCase().includes(search.toLowerCase()) ||
      job.division.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter === "ALL" || job.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const advanceStage = (id: string) => {
    const stages: PipelineStage[] = [
      "QUOTE",
      "ORDER",
      "ARTWORK",
      "PROOF",
      "PRODUCTION",
      "COMPLETED",
    ];
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id === id) {
          const currentIndex = stages.indexOf(job.stage);
          const nextIndex = Math.min(currentIndex + 1, stages.length - 1);
          return { ...job, stage: stages[nextIndex] };
        }
        return job;
      })
    );
  };

  const handleDownload = (job: Job) => {
    if (!job.isProofApproved) {
      alert(
        `APPROVAL GATE BLOCKED:\n\nCannot download production file '${job.fileName}'.\nProof revision ${job.proofVersion} is NOT approved by customer.`
      );
      return;
    }
    setDownloadMsg(`Downloading production file: ${job.fileName} (High-res 300 DPI + 3mm Bleed)`);
    setTimeout(() => setDownloadMsg(null), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Admin Floor Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#232B34] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#E65A28]">
              Production Console § 11
            </span>
            <span className="text-xs text-[#526071]">•</span>
            <span className="text-xs font-mono text-[#8C98A6]">Single Source of Truth</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
            Factory Floor Pipeline
          </h1>
          <p className="text-sm text-[#9BA8B6] mt-1">
            Manage the queue from quote to completion. Production files unlock automatically upon signed proof approval.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-[#384350] bg-[#1E252D] text-white hover:bg-[#2A3440]"
            onClick={() => alert("Archive sync check complete.")}
          >
            Archive Search
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => alert("Batch CSV variable-data engine triggered.")}
          >
            Run CSV Batch Engine
          </Button>
        </div>
      </div>

      {downloadMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded text-emerald-200 text-xs font-mono flex items-center justify-between">
          <span>✓ {downloadMsg}</span>
          <button onClick={() => setDownloadMsg(null)} className="underline ml-4">
            Close
          </button>
        </div>
      )}

      {/* Production Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#151A21] border border-[#27323E] rounded-lg p-4">
          <div className="text-xs font-mono text-[#8C98A6] uppercase">Queue Volume</div>
          <div className="text-2xl font-extrabold text-white mt-1">{jobs.length} Active Jobs</div>
          <div className="text-[11px] text-[#5E6D7E] mt-1">Across 5 print divisions</div>
        </div>

        <div className="bg-[#151A21] border border-[#27323E] rounded-lg p-4">
          <div className="text-xs font-mono text-[#8C98A6] uppercase">Unlocked Files</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            {jobs.filter((j) => j.isProofApproved).length} Ready
          </div>
          <div className="text-[11px] text-[#5E6D7E] mt-1">Proof signatures validated</div>
        </div>

        <div className="bg-[#151A21] border border-[#27323E] rounded-lg p-4">
          <div className="text-xs font-mono text-[#8C98A6] uppercase">Approval Gate Blocked</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">
            {jobs.filter((j) => !j.isProofApproved).length} Locked
          </div>
          <div className="text-[11px] text-[#5E6D7E] mt-1">Awaiting client sign-off</div>
        </div>

        <div className="bg-[#151A21] border border-[#27323E] rounded-lg p-4">
          <div className="text-xs font-mono text-[#8C98A6] uppercase">Today Throughput</div>
          <div className="text-2xl font-extrabold text-white mt-1">1,768 Units</div>
          <div className="text-[11px] text-[#5E6D7E] mt-1">Roland & Epilog Lasers</div>
        </div>
      </div>

      {/* Pipeline Navigation / Visual Bar */}
      <div className="bg-[#151A21] border border-[#27323E] rounded-lg p-4">
        <div className="text-xs font-mono uppercase tracking-wider text-[#8C98A6] mb-3">
          Pipeline Stage Filter (§ 11)
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "QUOTE", "ORDER", "ARTWORK", "PROOF", "PRODUCTION", "COMPLETED"].map((stg) => (
            <button
              key={stg}
              onClick={() => setStageFilter(stg)}
              className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors ${
                stageFilter === stg
                  ? "bg-[#E65A28] text-white font-bold"
                  : "bg-[#1E252D] text-[#8C98A6] hover:text-white"
              }`}
            >
              {stg}
            </button>
          ))}
        </div>
      </div>

      {/* Job Database & Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by Job ID, customer, division..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#151A21] border border-[#27323E] rounded px-3 py-2 text-xs text-white placeholder-[#5E6D7E] focus:outline-none focus:border-[#E65A28]"
            />
          </div>
          <span className="text-xs font-mono text-[#6E7D8E]">
            Displaying {filteredJobs.length} of {jobs.length} jobs in queue
          </span>
        </div>

        <div className="overflow-x-auto border border-[#27323E] rounded-lg bg-[#151A21]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1C232B] text-[#8E9CA9] font-mono uppercase tracking-wider border-b border-[#27323E]">
              <tr>
                <th className="px-4 py-3">Job ID & Customer</th>
                <th className="px-4 py-3">Division & Specs</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Pipeline Stage</th>
                <th className="px-4 py-3">Proof State</th>
                <th className="px-4 py-3">Production Gate</th>
                <th className="px-4 py-3 text-right">Floor Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#212933] text-[#CCD5DF]">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-[#1A2028] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-mono font-bold text-white">{job.id}</div>
                    <div className="text-[11px] text-[#8E9CA9] mt-0.5">{job.customer}</div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-white">{job.division}</div>
                    <div className="text-[11px] text-[#7E8B99] mt-0.5 max-w-xs truncate">
                      {job.specs}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 font-mono text-white font-medium">
                    {job.quantity.toLocaleString()}
                    {job.isCsvMerge && (
                      <span className="block text-[10px] text-purple-400 font-mono">
                        CSV Batch
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    <Badge variant={job.stage} size="sm">
                      {job.stage}
                    </Badge>
                  </td>

                  <td className="px-4 py-3.5 font-mono text-[11px]">
                    {job.isProofApproved ? (
                      <span className="text-emerald-400 font-bold">
                        ✓ {job.proofVersion} Approved
                      </span>
                    ) : (
                      <span className="text-amber-400 font-medium">
                        ⏳ {job.proofVersion} Pending
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    {job.isProofApproved ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] font-bold">
                        <IconUnlock className="w-3.5 h-3.5" /> UNLOCKED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-amber-400 font-mono text-[11px] font-bold">
                        <IconLock className="w-3.5 h-3.5" /> LOCKED
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`text-xs py-1 h-7 border-[#384350] ${
                        job.isProofApproved
                          ? "bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 border-emerald-700"
                          : "bg-[#1E252D] text-[#7E8B99] hover:bg-[#252E38]"
                      }`}
                      onClick={() => handleDownload(job)}
                    >
                      <IconDownload className="w-3 h-3 mr-1" /> PDF
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs py-1 h-7 bg-[#232B34] hover:bg-[#323D4A]"
                      onClick={() => advanceStage(job.id)}
                    >
                      Advance →
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
