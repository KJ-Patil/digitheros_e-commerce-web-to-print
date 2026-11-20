"use client";

import React, { useState, useRef } from "react";
import { CanvasElement, DesignCanvasState } from "@/lib/designer/types";
import { validateCanvasElements } from "@/lib/designer/preflight";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Label } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { IconShield } from "@/components/ui/icons";

interface CanvasDesignerProps {
  productSlug: string;
  productName: string;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  safeMarginMm: number;
  onSaveProof?: (state: DesignCanvasState) => void;
}

export function CanvasDesigner({
  productSlug,
  productName,
  widthMm,
  heightMm,
  bleedMm,
  safeMarginMm,
  onSaveProof,
}: CanvasDesignerProps) {
  // Mode: "edit" (with guides & bounding boxes) vs "proof" (trimmed realistic preview)
  const [mode, setMode] = useState<"edit" | "proof">("edit");
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");

  // Initial elements (Seed with division-appropriate design)
  const [elements, setElements] = useState<CanvasElement[]>(() => {
    if (productSlug.includes("race")) {
      return [
        {
          id: "el-1",
          type: "variable",
          xMm: 20,
          yMm: 35,
          widthMm: 170,
          heightMm: 70,
          rotationDeg: 0,
          text: "482",
          variableKey: "BIB_NUMBER",
          fontFamily: "display",
          fontSizePt: 120,
          textColor: "#13171C",
          textAlign: "center",
          isBold: true,
          shrinkToFit: true,
        },
        {
          id: "el-2",
          type: "text",
          xMm: 20,
          yMm: 15,
          widthMm: 170,
          heightMm: 15,
          rotationDeg: 0,
          text: "HIGHLAND ENDURO CHAMPIONSHIP",
          fontFamily: "mono",
          fontSizePt: 14,
          textColor: "#E65A28",
          textAlign: "center",
          isBold: true,
          letterSpacingEm: 0.1,
        },
        {
          id: "el-3",
          type: "variable",
          xMm: 20,
          yMm: 110,
          widthMm: 170,
          heightMm: 18,
          rotationDeg: 0,
          text: "ALEX MILLER • ELITE VET 40+",
          variableKey: "ATHLETE_NAME",
          fontFamily: "sans",
          fontSizePt: 12,
          textColor: "#4B5563",
          textAlign: "center",
          isBold: false,
          shrinkToFit: true,
        },
      ];
    } else {
      return [
        {
          id: "el-1",
          type: "text",
          xMm: 10,
          yMm: 10,
          widthMm: Math.max(20, widthMm - 20),
          heightMm: 16,
          rotationDeg: 0,
          text: "DIGITAL HEROES",
          fontFamily: "display",
          fontSizePt: 22,
          textColor: "#13171C",
          textAlign: "center",
          isBold: true,
          letterSpacingEm: 0.05,
        },
        {
          id: "el-2",
          type: "text",
          xMm: 10,
          yMm: 28,
          widthMm: Math.max(20, widthMm - 20),
          heightMm: 12,
          rotationDeg: 0,
          text: "PREMIUM PRINT SPECIFICATION",
          fontFamily: "mono",
          fontSizePt: 10,
          textColor: "#E65A28",
          textAlign: "center",
          isBold: true,
        },
      ];
    }
  });

  const [selectedId, setSelectedId] = useState<string | null>(elements[0]?.id || null);
  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  // Real-time preflight validation
  const { safeZoneViolations, bleedWarnings } = validateCanvasElements(
    elements,
    widthMm,
    heightMm,
    bleedMm,
    safeMarginMm
  );

  // SVG coordinate scaling
  const maxCanvasW = 540;
  const maxCanvasH = 400;
  const totalWMm = widthMm + bleedMm * 2;
  const totalHMm = heightMm + bleedMm * 2;
  const scale = Math.min(maxCanvasW / totalWMm, maxCanvasH / totalHMm);

  const svgBleedW = totalWMm * scale;
  const svgBleedH = totalHMm * scale;
  const svgTrimW = widthMm * scale;
  const svgTrimH = heightMm * scale;
  const svgSafeW = Math.max(10, (widthMm - safeMarginMm * 2) * scale);
  const svgSafeH = Math.max(10, (heightMm - safeMarginMm * 2) * scale);

  const offsetX = (580 - svgBleedW) / 2;
  const offsetY = (440 - svgBleedH) / 2;
  const trimX = offsetX + bleedMm * scale;
  const trimY = offsetY + bleedMm * scale;
  const safeX = trimX + safeMarginMm * scale;
  const safeY = trimY + safeMarginMm * scale;

  // Dragging interaction state
  const isDraggingRef = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0, elX: 0, elY: 0 });

  const handlePointerDown = (e: React.PointerEvent, el: CanvasElement) => {
    e.stopPropagation();
    setSelectedId(el.id);
    isDraggingRef.current = true;
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      elX: el.xMm,
      elY: el.yMm,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !selectedId) return;
    const dx = (e.clientX - dragStartPos.current.x) / scale;
    const dy = (e.clientY - dragStartPos.current.y) / scale;

    setElements((prev) =>
      prev.map((item) => {
        if (item.id === selectedId) {
          const newX = Math.round((dragStartPos.current.elX + dx) * 10) / 10;
          const newY = Math.round((dragStartPos.current.elY + dy) * 10) / 10;
          return { ...item, xMm: newX, yMm: newY };
        }
        return item;
      })
    );
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Add new element helper
  const addTextElement = () => {
    const newId = `el-${Date.now()}`;
    const newEl: CanvasElement = {
      id: newId,
      type: "text",
      xMm: safeMarginMm + 5,
      yMm: safeMarginMm + 10,
      widthMm: Math.min(60, widthMm - safeMarginMm * 2),
      heightMm: 12,
      rotationDeg: 0,
      text: "CUSTOM TEXT",
      fontFamily: "sans",
      fontSizePt: 16,
      textColor: "#13171C",
      textAlign: "center",
      isBold: true,
      shrinkToFit: true,
    };
    setElements([...elements, newEl]);
    setSelectedId(newId);
  };

  const addVariablePlaceholder = () => {
    const newId = `var-${Date.now()}`;
    const newEl: CanvasElement = {
      id: newId,
      type: "variable",
      xMm: safeMarginMm + 5,
      yMm: safeMarginMm + 25,
      widthMm: Math.min(80, widthMm - safeMarginMm * 2),
      heightMm: 20,
      rotationDeg: 0,
      text: "{{ATHLETE_NAME}}",
      variableKey: "ATHLETE_NAME",
      fontFamily: "mono",
      fontSizePt: 18,
      textColor: "#E65A28",
      textAlign: "center",
      isBold: true,
      shrinkToFit: true,
    };
    setElements([...elements, newEl]);
    setSelectedId(newId);
  };

  const handleUpdateSelected = (patch: Partial<CanvasElement>) => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) => (el.id === selectedId ? { ...el, ...patch } : el))
    );
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  };

  const handleExportState = () => {
    const canvasState: DesignCanvasState = {
      version: "1.0",
      productSlug,
      widthMm,
      heightMm,
      bleedMm,
      safeMarginMm,
      backgroundColor,
      elements,
    };
    if (onSaveProof) {
      onSaveProof(canvasState);
    } else {
      alert(
        `Digital Proof v1 Rendered Successfully!\n\nProduct: ${productName}\nDimensions: ${widthMm}x${heightMm}mm (+${bleedMm}mm bleed)\nElements: ${elements.length}\nSafe-Zone Check: ${safeZoneViolations.length === 0 ? "PASSED" : "WARNINGS DETECTED"}`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Designer Top Bar: Mode Toggle & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-[#E2E1D9] rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex bg-[#EFEFEA] p-1 rounded border border-[#DCDAD0] text-xs font-mono">
            <button
              onClick={() => setMode("edit")}
              className={`px-3 py-1.5 rounded uppercase font-semibold transition-colors cursor-pointer ${
                mode === "edit"
                  ? "bg-[#13171C] text-white shadow-sm"
                  : "text-[#586574] hover:text-[#13171C]"
              }`}
            >
              Interactive Canvas
            </button>
            <button
              onClick={() => setMode("proof")}
              className={`px-3 py-1.5 rounded uppercase font-semibold transition-colors cursor-pointer ${
                mode === "proof"
                  ? "bg-[#E65A28] text-white shadow-sm"
                  : "text-[#586574] hover:text-[#13171C]"
              }`}
            >
              Real Proof Preview
            </button>
          </div>

          <Badge variant={safeZoneViolations.length === 0 ? "success" : "warning"} size="sm">
            {safeZoneViolations.length === 0 ? "Safe Boundaries Intact" : "Margin Warnings (Preflight)"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("Reset canvas to factory template?")) {
                setElements([]);
              }
            }}
          >
            Clear
          </Button>
          <Button variant="primary" size="sm" onClick={handleExportState}>
            ✓ Approve & Generate Proof v1
          </Button>
        </div>
      </div>

      {/* Safety Margin Alert Warnings */}
      {(safeZoneViolations.length > 0 || bleedWarnings.length > 0) && mode === "edit" && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs font-mono flex items-start gap-2">
          <IconShield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase">Preflight Margin Constraint:</span>
            <ul className="mt-1 list-disc list-inside space-y-0.5">
              {[...safeZoneViolations, ...bleedWarnings].slice(0, 3).map((warn, i) => (
                <li key={i}>{warn}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main Designer Grid: Canvas Workspace vs Inspector Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Canvas Display Viewport */}
        <div className="lg:col-span-8 bg-[#12161A] border border-[#27323E] rounded-lg p-6 flex flex-col items-center select-none overflow-hidden">
          <div className="w-full flex items-center justify-between text-xs font-mono text-[#8C98A6] mb-3 border-b border-[#222B35] pb-2">
            <span>
              {mode === "edit" ? "WORKSPACE: 0.1mm Optical Guide Mode" : "REALISTIC PREPRESS PROOF PREVIEW"}
            </span>
            <span>
              {widthMm} × {heightMm} mm (+{bleedMm}mm Bleed)
            </span>
          </div>

          {/* Interactive SVG Canvas Surface */}
          <div
            className="relative border border-[#27323E] rounded bg-[#0A0D10] overflow-hidden"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Grid background in edit mode */}
            {mode === "edit" && (
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
            )}

            <svg
              viewBox="0 0 580 440"
              className="w-full max-w-[580px] h-auto cursor-crosshair"
              style={{ maxHeight: "440px" }}
              onClick={() => setSelectedId(null)}
            >
              {/* Outer Bleed Zone Boundary */}
              {mode === "edit" && (
                <rect
                  x={offsetX}
                  y={offsetY}
                  width={svgBleedW}
                  height={svgBleedH}
                  fill="#1B222B"
                  stroke="#EF4444"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
              )}

              {/* Physical Product Substrate Canvas (Trim Boundary) */}
              <rect
                x={trimX}
                y={trimY}
                width={svgTrimW}
                height={svgTrimH}
                fill={backgroundColor}
                stroke={mode === "edit" ? "#E65A28" : "#2E3A48"}
                strokeWidth={mode === "edit" ? 2 : 1}
                rx={productSlug.includes("sticker") ? 4 : 1}
                filter={mode === "proof" ? "drop-shadow(0 4px 12px rgba(0,0,0,0.4))" : undefined}
              />

              {/* Safe Printable Zone Boundary */}
              {mode === "edit" && (
                <rect
                  x={safeX}
                  y={safeY}
                  width={svgSafeW}
                  height={svgSafeH}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  pointerEvents="none"
                />
              )}

              {/* Render Canvas Elements */}
              {elements.map((el) => {
                const elSvgX = trimX + el.xMm * scale;
                const elSvgY = trimY + el.yMm * scale;
                const elSvgW = el.widthMm * scale;
                const elSvgH = el.heightMm * scale;
                const isSelected = selectedId === el.id && mode === "edit";

                // Typography classes
                const fontFamilies = {
                  sans: "font-sans",
                  mono: "font-mono",
                  serif: "font-serif",
                  display: "font-mono font-black uppercase tracking-tight",
                };

                return (
                  <g
                    key={el.id}
                    transform={`rotate(${el.rotationDeg || 0} ${elSvgX + elSvgW / 2} ${elSvgY + elSvgH / 2})`}
                    className="cursor-move"
                    onPointerDown={(e) => handlePointerDown(e, el)}
                  >
                    {/* Element Selection Highlight Box */}
                    {isSelected && (
                      <rect
                        x={elSvgX - 2}
                        y={elSvgY - 2}
                        width={elSvgW + 4}
                        height={elSvgH + 4}
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                    )}

                    {/* Text / Variable Element Content */}
                    {(el.type === "text" || el.type === "variable") && (
                      <foreignObject
                        x={elSvgX}
                        y={elSvgY}
                        width={elSvgW}
                        height={elSvgH}
                        className="overflow-hidden"
                      >
                        <div
                          className={`w-full h-full flex items-center justify-center select-none ${fontFamilies[el.fontFamily || "sans"]}`}
                          style={{
                            color: el.textColor || "#13171C",
                            fontSize: `${Math.max(10, (el.fontSizePt || 16) * (scale / 4.5))}px`,
                            fontWeight: el.isBold ? 800 : 400,
                            letterSpacing: el.letterSpacingEm ? `${el.letterSpacingEm}em` : undefined,
                            textAlign: el.textAlign || "center",
                            lineHeight: 1.1,
                          }}
                        >
                          {el.text}
                        </div>
                      </foreignObject>
                    )}

                    {/* Image / Logo Element Content */}
                    {el.type === "image" && el.imageUrl && (
                      <image
                        href={el.imageUrl}
                        x={elSvgX}
                        y={elSvgY}
                        width={elSvgW}
                        height={elSvgH}
                        preserveAspectRatio="xMidYMid meet"
                      />
                    )}
                  </g>
                );
              })}

              {/* Crop & Bleed Trim Corner Marks in Proof Mode */}
              {mode === "proof" && (
                <g stroke="#64748B" strokeWidth="1">
                  {/* Top-Left Crop Marks */}
                  <line x1={trimX} y1={trimY - 14} x2={trimX} y2={trimY - 4} />
                  <line x1={trimX - 14} y1={trimY} x2={trimX - 4} y2={trimY} />
                  {/* Top-Right Crop Marks */}
                  <line x1={trimX + svgTrimW} y1={trimY - 14} x2={trimX + svgTrimW} y2={trimY - 4} />
                  <line x1={trimX + svgTrimW + 4} y1={trimY} x2={trimX + svgTrimW + 14} y2={trimY} />
                  {/* Bottom-Left Crop Marks */}
                  <line x1={trimX} y1={trimY + svgTrimH + 4} x2={trimX} y2={trimY + svgTrimH + 14} />
                  <line x1={trimX - 14} y1={trimY + svgTrimH} x2={trimX - 4} y2={trimY + svgTrimH} />
                  {/* Bottom-Right Crop Marks */}
                  <line x1={trimX + svgTrimW} y1={trimY + svgTrimH + 4} x2={trimX + svgTrimW} y2={trimY + svgTrimH + 14} />
                  <line x1={trimX + svgTrimW + 4} y1={trimY + svgTrimH} x2={trimX + svgTrimW + 14} y2={trimY + svgTrimH} />
                </g>
              )}
            </svg>
          </div>

          {/* Guide Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-[11px] font-mono text-[#8C98A6]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-[#EF4444]"></span>
              <span>Exterior Bleed (+{bleedMm}mm)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#E65A28]"></span>
              <span>Trim Contour (Finished Cut)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-[#10B981]"></span>
              <span>Safe Margin (-{safeMarginMm}mm)</span>
            </div>
          </div>
        </div>

        {/* Right: Inspector Tool Palette & Element Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Tool Palette */}
          <Card>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#13171C] mb-3">
              Add Design Elements
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={addTextElement}>
                + Add Text Layer
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-[#E65A28]/40 text-[#E65A28]"
                onClick={addVariablePlaceholder}
              >
                + Variable Field
              </Button>
            </div>

            {/* Background Substrate Color Picker */}
            <div className="mt-4 pt-4 border-t border-[#ECEBE4]">
              <Label>Substrate Surface Color</Label>
              <div className="flex items-center gap-2 mt-1">
                {["#FFFFFF", "#F5F4EE", "#13171C", "#FDE047", "#0284C7"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBackgroundColor(c)}
                    className={`w-7 h-7 rounded border transition-all cursor-pointer ${
                      backgroundColor === c ? "ring-2 ring-[#E65A28] scale-110" : "border-[#D5D3CB]"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </Card>

          {/* Element Inspector */}
          {selectedElement ? (
            <Card className="border-l-4 border-l-[#E65A28]">
              <div className="flex items-center justify-between border-b border-[#ECEBE4] pb-2 mb-3">
                <span className="text-xs font-mono font-bold text-[#E65A28] uppercase">
                  Element Inspector: {selectedElement.type.toUpperCase()}
                </span>
                <button
                  onClick={handleDeleteSelected}
                  className="text-xs text-rose-600 hover:text-rose-800 font-mono font-bold cursor-pointer"
                >
                  Delete
                </button>
              </div>

              <div className="space-y-3">
                {/* Text Content */}
                <div>
                  <Label>Text Content</Label>
                  <Input
                    value={selectedElement.text || ""}
                    onChange={(e) => handleUpdateSelected({ text: e.target.value })}
                  />
                </div>

                {/* Font Selector */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Typeface</Label>
                    <Select
                      value={selectedElement.fontFamily || "sans"}
                      onChange={(e) =>
                        handleUpdateSelected({
                          fontFamily: e.target.value as "sans" | "mono" | "serif" | "display",
                        })
                      }
                      options={[
                        { label: "Technical Sans", value: "sans" },
                        { label: "Precision Mono", value: "mono" },
                        { label: "High-Impact Display", value: "display" },
                        { label: "Classic Serif", value: "serif" },
                      ]}
                    />
                  </div>

                  <div>
                    <Label>Point Size ({selectedElement.fontSizePt || 16}pt)</Label>
                    <Input
                      type="number"
                      min="8"
                      max="160"
                      value={selectedElement.fontSizePt || 16}
                      onChange={(e) =>
                        handleUpdateSelected({ fontSizePt: parseInt(e.target.value) || 12 })
                      }
                    />
                  </div>
                </div>

                {/* Text Color & Alignment */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Ink Color</Label>
                    <div className="flex items-center gap-1.5 mt-1">
                      {["#13171C", "#E65A28", "#FFFFFF", "#059669", "#2563EB"].map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => handleUpdateSelected({ textColor: col })}
                          className={`w-6 h-6 rounded border transition-all cursor-pointer ${
                            selectedElement.textColor === col
                              ? "ring-2 ring-[#E65A28] scale-110"
                              : "border-[#D5D3CB]"
                          }`}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Rotation ({selectedElement.rotationDeg || 0}°)</Label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="15"
                      value={selectedElement.rotationDeg || 0}
                      onChange={(e) =>
                        handleUpdateSelected({ rotationDeg: parseInt(e.target.value) || 0 })
                      }
                      className="w-full mt-2"
                    />
                  </div>
                </div>

                {/* Shrink-to-fit toggle */}
                <div className="pt-2 border-t border-[#ECEBE4] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#556372]">Shrink-To-Fit</span>
                  <input
                    type="checkbox"
                    checked={selectedElement.shrinkToFit ?? true}
                    onChange={(e) => handleUpdateSelected({ shrinkToFit: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#E65A28]"
                  />
                </div>
              </div>
            </Card>
          ) : (
            <Card className="text-center py-8">
              <p className="text-xs font-mono text-[#8C98A6]">
                Click any element on the canvas to inspect dimensions, typeface, or colors.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
