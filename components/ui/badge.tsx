import React from "react";

export type PipelineStage =
  | "QUOTE"
  | "ORDER"
  | "ARTWORK"
  | "PROOF"
  | "PRODUCTION"
  | "COMPLETED";

export type StatusVariant =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | PipelineStage;

interface BadgeProps {
  children: React.ReactNode;
  variant?: StatusVariant;
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
}: BadgeProps) {
  const base = "inline-flex items-center font-mono uppercase tracking-wider font-semibold rounded";
  const sizeStyles = {
    sm: "px-1.5 py-0.5 text-[10px] leading-tight",
    md: "px-2 py-0.5 text-xs leading-none",
  };

  const variantStyles: Record<StatusVariant, string> = {
    neutral: "bg-[#EAE9E1] text-[#3D4752] border border-[#D8D7CE]",
    success: "bg-emerald-50 text-emerald-800 border border-emerald-300",
    warning: "bg-amber-50 text-amber-800 border border-amber-300",
    danger: "bg-rose-50 text-rose-800 border border-rose-300",
    info: "bg-sky-50 text-sky-800 border border-sky-300",

    // PRD Pipeline Stages
    QUOTE: "bg-amber-100/80 text-amber-900 border border-amber-300",
    ORDER: "bg-blue-100/80 text-blue-900 border border-blue-300",
    ARTWORK: "bg-purple-100/80 text-purple-900 border border-purple-300",
    PROOF: "bg-orange-100/80 text-orange-950 border border-orange-300 font-bold",
    PRODUCTION: "bg-emerald-100/80 text-emerald-950 border border-emerald-300 font-bold",
    COMPLETED: "bg-slate-200/90 text-slate-800 border border-slate-300",
  };

  return (
    <span
      className={`${base} ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.neutral} ${className}`}
    >
      {children}
    </span>
  );
}
