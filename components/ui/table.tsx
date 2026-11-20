import React from "react";

export function Table({
  headers,
  children,
  className = "",
}: {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto border border-[#E2E1D9] rounded-lg bg-white ${className}`}>
      <table className="w-full text-left text-sm">
        <thead className="bg-[#F8F7F2] text-[#48535F] text-[11px] font-mono uppercase tracking-wider border-b border-[#E2E1D9]">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EFEFE9] text-[#13171C]">{children}</tbody>
      </table>
    </div>
  );
}

export function TableRow({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-[#F9F9F6] transition-colors ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3.5 text-xs sm:text-sm ${className}`}>{children}</td>;
}
