import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  badge?: string;
}

export function Card({ children, className = "", badge, ...props }: CardProps) {
  return (
    <div
      className={`relative bg-white border border-[#E2E1D9] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${className}`}
      {...props}
    >
      {badge && (
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-mono tracking-widest text-[#8492A6] uppercase bg-[#F3F2EB] px-2 py-0.5 rounded border border-[#E4E3DB]">
            {badge}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  tag,
  action,
}: {
  title: string;
  subtitle?: string;
  tag?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between border-b border-[#ECEBE4] pb-3 mb-4">
      <div>
        {tag && (
          <span className="text-[11px] font-mono font-medium tracking-wider uppercase text-[#E65A28]">
            {tag}
          </span>
        )}
        <h3 className="text-base font-semibold text-[#13171C] tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-[#636F7B] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="ml-3 shrink-0">{action}</div>}
    </div>
  );
}
