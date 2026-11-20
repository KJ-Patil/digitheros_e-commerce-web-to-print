import React from "react";
import { IconAlert } from "./icons";

interface ErrorStateProps {
  title?: string;
  message: string;
  retryAction?: () => void;
  className?: string;
}

export function ErrorState({
  title = "System Alert",
  message,
  retryAction,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`border border-rose-300 bg-rose-50/70 rounded-lg p-4 text-rose-900 ${className}`}
    >
      <div className="flex items-start gap-3">
        <IconAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-rose-700">
            {title}
          </h4>
          <p className="text-xs text-rose-800 mt-1">{message}</p>
          {retryAction && (
            <button
              onClick={retryAction}
              className="mt-2 text-xs font-semibold text-rose-900 underline hover:text-rose-950 cursor-pointer"
            >
              Retry Action
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
