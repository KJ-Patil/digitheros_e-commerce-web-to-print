import React from "react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`border border-dashed border-[#D4D3CB] rounded-lg p-10 text-center bg-[#FAFAF7] flex flex-col items-center justify-center ${className}`}
    >
      {icon ? (
        <div className="w-12 h-12 rounded-full bg-[#EFEFE8] text-[#556270] flex items-center justify-center mb-3">
          {icon}
        </div>
      ) : (
        <div className="w-10 h-10 rounded border border-[#D5D4CB] flex items-center justify-center text-xs font-mono text-[#8C98A4] mb-3">
          0/0
        </div>
      )}
      <h4 className="text-sm font-semibold text-[#13171C] tracking-tight">{title}</h4>
      <p className="text-xs text-[#636F7B] mt-1 max-w-sm mb-4">{description}</p>
      {actionLabel && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
