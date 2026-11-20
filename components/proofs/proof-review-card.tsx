"use client";

import React, { useState } from "react";
import { OrderProofState, ProofRevision } from "@/lib/proofs/proof-engine";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea, Label } from "@/components/ui/form";
import {
  IconCheck,
  IconLock,
  IconUnlock,
} from "@/components/ui/icons";

interface ProofReviewCardProps {
  initialState: OrderProofState;
  onStateUpdate?: (newState: OrderProofState) => void;
}

export function ProofReviewCard({ initialState, onStateUpdate }: ProofReviewCardProps) {
  const { user } = useAuth();
  const [proofState, setProofState] = useState<OrderProofState>(initialState);
  const [selectedVersion, setSelectedVersion] = useState<number>(initialState.currentVersion);

  // Modals & form state
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isChangeOpen, setIsChangeOpen] = useState(false);
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [changeNotes, setChangeNotes] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const activeRevision: ProofRevision =
    proofState.revisions.find((r) => r.versionNumber === selectedVersion) ||
    proofState.revisions[proofState.revisions.length - 1];

  const handleApprove = async () => {
    if (!signatureConfirmed) {
      alert("Please confirm the digital sign-off checkbox before approving.");
      return;
    }

    try {
      const currentUser = user || {
        id: "00000000-0000-0000-0000-000000000001",
        email: "customer@digitalheroes.demo",
        fullName: "Alex Miller",
        role: "customer",
      };

      const res = await fetch(`/api/proofs/${proofState.orderId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionNumber: selectedVersion,
          customerNotes,
          user: currentUser,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approval failed");

      setProofState(data.proofState);
      if (onStateUpdate) onStateUpdate(data.proofState);
      setIsApproveOpen(false);
      setActionMessage(`✓ Proof v${selectedVersion} Approved! Production files are UNLOCKED on factory floor.`);
      setTimeout(() => setActionMessage(null), 6000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Approval failed");
    }
  };

  const handleRequestChanges = async () => {
    if (!changeNotes.trim()) {
      alert("Please enter revision instructions for the production prepress team.");
      return;
    }

    try {
      const currentUser = user || {
        id: "00000000-0000-0000-0000-000000000001",
        email: "customer@digitalheroes.demo",
        fullName: "Alex Miller",
        role: "customer",
      };

      const res = await fetch(`/api/proofs/${proofState.orderId}/change-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionNumber: selectedVersion,
          changeInstructions: changeNotes,
          user: currentUser,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Change request failed");

      setProofState(data.proofState);
      setSelectedVersion(data.proofState.currentVersion);
      if (onStateUpdate) onStateUpdate(data.proofState);
      setIsChangeOpen(false);
      setChangeNotes("");
      setActionMessage(`✓ Change request recorded. Revision v${data.proofState.currentVersion} queued. Production files remain strictly LOCKED.`);
      setTimeout(() => setActionMessage(null), 6000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Change request failed");
    }
  };

  return (
    <Card className="border border-[#E2E1D9] shadow-sm">
      {/* Proof Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#ECEBE4] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#E65A28]">
              {proofState.orderNumber}
            </span>
            <span className="text-xs text-[#9AA7B5]">•</span>
            <span className="text-xs font-mono text-[#526071]">{proofState.dimensions}</span>
          </div>
          <h3 className="text-base font-bold text-[#13171C] mt-0.5">
            {proofState.productName}
          </h3>
        </div>

        {/* Revision Selector Pills */}
        <div className="flex items-center gap-1.5 bg-[#FAF9F5] p-1 rounded border border-[#E2E1D9]">
          <span className="text-[10px] font-mono uppercase text-[#73808F] px-1 font-bold">
            Revisions:
          </span>
          {proofState.revisions.map((rev) => (
            <button
              key={rev.versionNumber}
              type="button"
              onClick={() => setSelectedVersion(rev.versionNumber)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
                selectedVersion === rev.versionNumber
                  ? "bg-[#13171C] text-white"
                  : "text-[#556372] hover:bg-[#EFEFEA]"
              }`}
            >
              v{rev.versionNumber}
            </button>
          ))}
        </div>
      </div>

      {actionMessage && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-950 text-xs font-mono font-medium">
          {actionMessage}
        </div>
      )}

      {/* Proof Visual Preview Surface */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Visual Simulated Substrate Proof */}
        <div className="md:col-span-7 bg-[#12161A] rounded-lg p-5 border border-[#232B34] flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-[11px] font-mono text-[#8C98A6] mb-3 border-b border-[#222B35] pb-2">
            <span>PREPRESS DIGITAL PROOF v{activeRevision.versionNumber}</span>
            <Badge
              variant={
                activeRevision.status === "APPROVED"
                  ? "success"
                  : activeRevision.status === "CHANGES_REQUESTED"
                  ? "danger"
                  : "warning"
              }
              size="sm"
            >
              {activeRevision.status.replace("_", " ")}
            </Badge>
          </div>

          {/* Scaled Visual Proof Canvas */}
          <div className="w-full h-52 bg-[#FAF9F5] rounded border border-[#D5D4CB] relative flex flex-col items-center justify-center p-4 shadow-inner overflow-hidden">
            {/* Visual crop lines around artwork */}
            <div className="absolute inset-4 border border-dashed border-[#E65A28]/50 rounded pointer-events-none" />

            <div className="text-center z-10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#E65A28] font-bold block mb-1">
                {proofState.orderNumber} • PROOF v{activeRevision.versionNumber}
              </span>
              <div className="text-2xl font-black font-mono text-[#13171C] tracking-tight">
                {proofState.productName.toUpperCase()}
              </div>
              <div className="text-xs font-mono text-[#556372] mt-1">
                {proofState.dimensions} • 300 DPI Fogra39 CMYK
              </div>

              {activeRevision.status === "APPROVED" && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-100/90 text-emerald-900 border border-emerald-300 font-mono text-xs font-bold">
                  <IconCheck className="w-4 h-4 text-emerald-700" /> DIGITAL APPROVAL STAMPED
                </div>
              )}
            </div>

            {/* Corner trim tick marks */}
            <div className="absolute top-1 left-1 text-[8px] font-mono text-[#8C98A6]">⌜ CUT</div>
            <div className="absolute top-1 right-1 text-[8px] font-mono text-[#8C98A6]">CUT ⌝</div>
            <div className="absolute bottom-1 left-1 text-[8px] font-mono text-[#8C98A6]">⌞ CUT</div>
            <div className="absolute bottom-1 right-1 text-[8px] font-mono text-[#8C98A6]">CUT ⌟</div>
          </div>

          {/* Gate status indicator below proof */}
          <div className="w-full mt-3 pt-2 border-t border-[#232B34] flex items-center justify-between text-xs font-mono">
            <span className="text-[#8C98A6]">Factory Floor Gate:</span>
            {proofState.isUnlockedForProduction ? (
              <span className="text-emerald-400 font-bold inline-flex items-center gap-1">
                <IconUnlock className="w-3.5 h-3.5" /> UNLOCKED FOR PRINT
              </span>
            ) : (
              <span className="text-amber-400 font-bold inline-flex items-center gap-1">
                <IconLock className="w-3.5 h-3.5" /> LOCKED (Awaiting Sign-off)
              </span>
            )}
          </div>
        </div>

        {/* Right: Revision Metadata & Actions */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-[#FAF9F5] border border-[#E2E1D9] rounded-lg p-4 space-y-2 text-xs font-mono">
            <div className="text-[10px] text-[#768492] uppercase font-bold border-b border-[#E8E7DF] pb-1">
              Revision Details
            </div>
            <div>
              <span className="text-[#768492]">Created:</span>{" "}
              <span className="text-[#13171C] font-semibold">{new Date(activeRevision.createdAt).toLocaleString()}</span>
            </div>
            {activeRevision.changeNotes && (
              <div>
                <span className="text-[#768492]">Revision Notes:</span>{" "}
                <span className="text-[#13171C] block bg-white p-2 rounded border border-[#E2E1D9] mt-1 text-[11px]">
                  {activeRevision.changeNotes}
                </span>
              </div>
            )}
            {activeRevision.approvedBy && (
              <div className="pt-2 border-t border-[#E8E7DF] space-y-1">
                <div className="text-emerald-800 font-bold">✓ Approved By: {activeRevision.approvedBy.fullName}</div>
                <div className="text-[10px] text-[#768492]">Timestamp: {new Date(activeRevision.approvedAt!).toLocaleString()}</div>
                <div className="text-[10px] text-[#768492] truncate">Hash: {activeRevision.digitalSignatureHash}</div>
              </div>
            )}
          </div>

          {/* Action Trigger Buttons */}
          {activeRevision.status === "PENDING" && (
            <div className="space-y-2">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setIsApproveOpen(true)}
              >
                ✓ Approve Proof v{activeRevision.versionNumber}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setIsChangeOpen(true)}
              >
                Request Revisions
              </Button>
            </div>
          )}

          {activeRevision.status === "APPROVED" && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 text-xs">
              <span className="font-bold block mb-0.5">Proof Approved</span>
              This revision has been confirmed and released into the manufacturing queue.
            </div>
          )}

          {activeRevision.status === "CHANGES_REQUESTED" && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-900 text-xs">
              <span className="font-bold block mb-0.5">Changes Requested on v{activeRevision.versionNumber}</span>
              Switch to v{proofState.currentVersion} above to inspect the latest revised proof.
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Approve Proof Confirmation */}
      {isApproveOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#13171C]">
            <div className="border-b border-[#ECEBE4] pb-3">
              <span className="text-[10px] font-mono uppercase text-[#E65A28] font-bold">
                Approval Gate Authorization
              </span>
              <h3 className="text-lg font-bold text-[#13171C]">
                Sign Off & Authorize Manufacturing
              </h3>
            </div>

            <div className="p-3 bg-[#FAF9F5] border border-[#E2E1D9] rounded text-xs space-y-2">
              <p className="font-semibold text-[#13171C]">
                Order: {proofState.orderNumber} • Proof Revision v{activeRevision.versionNumber}
              </p>
              <p className="text-[#556372]">
                Approving this digital proof immediately unlocks production files for the Roland & Epilog
                laser printers.
              </p>
            </div>

            <div>
              <Label>Optional Customer Release Notes</Label>
              <Textarea
                rows={2}
                placeholder="e.g. Colors match corporate brand manual; approved for print."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
              />
            </div>

            {/* Required Legal Confirmation Checkbox */}
            <div className="pt-2 border-t border-[#ECEBE4]">
              <label className="flex items-start gap-2.5 text-xs text-[#13171C] cursor-pointer">
                <input
                  type="checkbox"
                  checked={signatureConfirmed}
                  onChange={(e) => setSignatureConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-[#E65A28]"
                />
                <span>
                  <strong>I confirm that spelling, dimensions, and visual positioning are verified.</strong>{" "}
                  I authorize Digital Heroes to release these production files to the factory floor.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECEBE4]">
              <Button variant="ghost" size="sm" onClick={() => setIsApproveOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleApprove}>
                Sign & Unlock Production Files →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Request Proof Changes */}
      {isChangeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#13171C]">
            <div className="border-b border-[#ECEBE4] pb-3">
              <span className="text-[10px] font-mono uppercase text-[#E65A28] font-bold">
                Prepress Change Request
              </span>
              <h3 className="text-lg font-bold text-[#13171C]">
                Request Revisions for v{activeRevision.versionNumber}
              </h3>
            </div>

            <p className="text-xs text-[#556372]">
              Specify adjustments required. The factory prepress team will render revision v
              {activeRevision.versionNumber + 1}. Production files remain locked.
            </p>

            <div>
              <Label required>Revision Instructions</Label>
              <Textarea
                rows={4}
                placeholder="e.g. Please shift the main title 4mm higher to clear the handlebar clamp zone, and make the runner bib number bolder."
                value={changeNotes}
                onChange={(e) => setChangeNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECEBE4]">
              <Button variant="ghost" size="sm" onClick={() => setIsChangeOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleRequestChanges}>
                Submit Revision Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
