import React from "react";

export function DemoNotice({
  module,
  note = "Demo Mode: All pricing, tax rates, and specifications use editable prototype defaults. No live credit card required.",
}: {
  module: string;
  note?: string;
}) {
  return (
    <div className="bg-[#12161A] text-[#E0E5EC] px-4 py-2 border-b border-[#2C353F] flex flex-wrap items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <span className="font-mono bg-[#E65A28] text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
          {module}
        </span>
        <span className="text-[#A2ADB8] text-[11px]">{note}</span>
      </div>
      <div className="text-[11px] font-mono text-[#7D8A97] hidden sm:block">
        PRD Level 2 • 2026 Edition
      </div>
    </div>
  );
}
