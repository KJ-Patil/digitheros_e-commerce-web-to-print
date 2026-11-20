import React from "react";

interface BlueprintPreviewProps {
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  safeMarginMm: number;
  shapeName?: string;
  materialName?: string;
  className?: string;
}

export function BlueprintPreview({
  widthMm,
  heightMm,
  bleedMm,
  safeMarginMm,
  shapeName = "Rectangle",
  materialName = "Standard",
  className = "",
}: BlueprintPreviewProps) {
  // Normalize aspect ratio for SVG canvas (maintain proportions within a 340x260 bounding box)
  const maxCanvasW = 320;
  const maxCanvasH = 220;

  const totalWMm = widthMm + bleedMm * 2;
  const totalHMm = heightMm + bleedMm * 2;

  const scale = Math.min(maxCanvasW / totalWMm, maxCanvasH / totalHMm);

  const svgBleedW = totalWMm * scale;
  const svgBleedH = totalHMm * scale;

  const svgTrimW = widthMm * scale;
  const svgTrimH = heightMm * scale;

  const svgSafeW = Math.max(10, (widthMm - safeMarginMm * 2) * scale);
  const svgSafeH = Math.max(10, (heightMm - safeMarginMm * 2) * scale);

  const offsetX = (360 - svgBleedW) / 2;
  const offsetY = (260 - svgBleedH) / 2;

  const trimX = offsetX + bleedMm * scale;
  const trimY = offsetY + bleedMm * scale;

  const safeX = trimX + safeMarginMm * scale;
  const safeY = trimY + safeMarginMm * scale;

  const areaSqCm = (widthMm * heightMm) / 100;

  return (
    <div className={`bg-[#12161A] text-white rounded-lg p-5 border border-[#2B343E] ${className}`}>
      <div className="flex items-center justify-between border-b border-[#242C35] pb-3 mb-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#E65A28] uppercase font-bold">
            Technical Print CAD Blueprint
          </span>
          <div className="text-sm font-mono font-bold text-white mt-0.5">
            {widthMm} mm × {heightMm} mm ({areaSqCm.toFixed(1)} cm²)
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono uppercase bg-[#1F2731] text-[#9BA8B6] px-2 py-0.5 rounded border border-[#2E3947]">
            {shapeName}
          </span>
        </div>
      </div>

      {/* Interactive Blueprint Canvas */}
      <div className="relative w-full h-[270px] bg-[#0A0D10] border border-[#1E252D] rounded flex items-center justify-center overflow-hidden">
        {/* Subtle engineering grid background */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "linear-gradient(#4A5768 1px, transparent 1px), linear-gradient(90deg, #4A5768 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <svg viewBox="0 0 360 260" className="w-full h-full relative z-10">
          {/* Bleed Zone (Red dashed) */}
          <rect
            x={offsetX}
            y={offsetY}
            width={svgBleedW}
            height={svgBleedH}
            fill="#1E232A"
            stroke="#EF4444"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            rx="2"
          />

          {/* Finished Trim Cut Line (Solid white/orange) */}
          <rect
            x={trimX}
            y={trimY}
            width={svgTrimW}
            height={svgTrimH}
            fill="#13181F"
            stroke="#E65A28"
            strokeWidth="2"
            rx="2"
          />

          {/* Safe Printable Zone (Green dashed) */}
          <rect
            x={safeX}
            y={safeY}
            width={svgSafeW}
            height={svgSafeH}
            fill="none"
            stroke="#10B981"
            strokeWidth="1.25"
            strokeDasharray="3 3"
            rx="1"
          />

          {/* Center Crosshair Marker */}
          <line
            x1="180"
            y1={offsetY - 6}
            x2="180"
            y2={offsetY + svgBleedH + 6}
            stroke="#3E4C5E"
            strokeWidth="0.75"
            strokeDasharray="2 2"
          />
          <line
            x1={offsetX - 6}
            y1="130"
            x2={offsetX + svgBleedW + 6}
            y2="130"
            stroke="#3E4C5E"
            strokeWidth="0.75"
            strokeDasharray="2 2"
          />

          {/* Center Spec Label inside safe zone */}
          <text
            x="180"
            y="126"
            textAnchor="middle"
            fill="#E0E6ED"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {widthMm} × {heightMm} MM
          </text>
          <text
            x="180"
            y="140"
            textAnchor="middle"
            fill="#7E8D9F"
            fontSize="8"
            fontFamily="monospace"
          >
            SAFE PRINT ZONE
          </text>
        </svg>

        {/* Floating Corner Spec Badges */}
        <div className="absolute bottom-2 left-2 text-[10px] font-mono text-[#8C9BAA] bg-[#12161A]/90 px-2 py-1 rounded border border-[#27323E]">
          Substrate: {materialName}
        </div>
      </div>

      {/* Legend & Pre-flight Guide */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#242C35] text-[10px] font-mono">
        <div className="flex items-center gap-1.5 text-[#EF4444]">
          <span className="w-3 h-0.5 border-t border-dashed border-[#EF4444]"></span>
          <span>Bleed: +{bleedMm}mm</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#E65A28]">
          <span className="w-3 h-0.5 bg-[#E65A28]"></span>
          <span>Trim Cut Line</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#10B981]">
          <span className="w-3 h-0.5 border-t border-dashed border-[#10B981]"></span>
          <span>Safe: -{safeMarginMm}mm</span>
        </div>
      </div>
    </div>
  );
}
