import React from "react";

export function Label({
  children,
  htmlFor,
  required,
  className = "",
}: {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-xs font-mono font-medium text-[#4B5663] uppercase tracking-wider mb-1.5 ${className}`}
    >
      {children} {required && <span className="text-[#E65A28]">*</span>}
    </label>
  );
}

export function Input({
  className = "",
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div>
      <input
        className={`w-full bg-white border ${
          error ? "border-rose-400 focus:ring-rose-400" : "border-[#CFCECB] focus:border-[#E65A28] focus:ring-[#E65A28]"
        } rounded px-3 py-2 text-sm text-[#13171C] placeholder-[#8F9CA9] focus:outline-none focus:ring-1 transition-all ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
}

export function Select({
  options,
  className = "",
  error,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { label: string; value: string | number }[];
  error?: string;
}) {
  return (
    <div>
      <select
        className={`w-full bg-white border ${
          error ? "border-rose-400 focus:ring-rose-400" : "border-[#CFCECB] focus:border-[#E65A28] focus:ring-[#E65A28]"
        } rounded px-3 py-2 text-sm text-[#13171C] focus:outline-none focus:ring-1 transition-all ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
}

export function Textarea({
  className = "",
  error,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <div>
      <textarea
        className={`w-full bg-white border ${
          error ? "border-rose-400 focus:ring-rose-400" : "border-[#CFCECB] focus:border-[#E65A28] focus:ring-[#E65A28]"
        } rounded px-3 py-2 text-sm text-[#13171C] placeholder-[#8F9CA9] focus:outline-none focus:ring-1 transition-all ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
}
