import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none rounded";

  const sizeStyles = {
    sm: "text-xs px-2.5 py-1.5 h-8 gap-1.5",
    md: "text-sm px-4 py-2 h-10 gap-2",
    lg: "text-base px-6 py-2.5 h-12 gap-2.5 tracking-tight",
  };

  const variantStyles = {
    primary:
      "bg-[#E65A28] text-white hover:bg-[#CF4919] active:bg-[#B83E12] focus-visible:ring-[#E65A28] shadow-sm",
    secondary:
      "bg-[#13171C] text-white hover:bg-[#252B33] active:bg-[#0A0D10] focus-visible:ring-[#13171C]",
    outline:
      "border border-[#D1D0C7] bg-white text-[#13171C] hover:bg-[#F2F1EA] hover:border-[#B5B4AB] focus-visible:ring-[#13171C]",
    ghost:
      "text-[#333C48] hover:bg-[#ECEBE4] hover:text-[#13171C] focus-visible:ring-[#333C48]",
    danger:
      "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-600",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
