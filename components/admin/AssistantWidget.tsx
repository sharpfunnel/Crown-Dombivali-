"use client";

import { useState } from "react";
import AssistantChat from "@/components/admin/AssistantChat";

/** Floating chat bubble, mounted once in the protected admin layout. */
export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed right-6 bottom-6 z-50">
      {open ? (
        <div className="flex h-144 max-h-[calc(100vh-3rem)] w-96 max-w-[calc(100vw-3rem)] flex-col overflow-hidden border border-white/10 bg-[#0b1220] shadow-2xl sm:w-104">
          <div className="flex items-center justify-between bg-accent px-4 py-3.5">
            <span className="flex items-center gap-2 text-sm font-bold text-white">
              <SparkleIcon className="h-4 w-4" /> Assistant
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-md p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <CloseIcon className="h-4.5 w-4.5" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <AssistantChat />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open assistant"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform hover:scale-105"
        >
          <SparkleIcon className="h-5.5 w-5.5" />
        </button>
      )}
    </div>
  );
}

function SparkleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.5 13.9 9l6.6 1.9-6.6 1.9L12 19.5 10.1 12.8 3.5 10.9l6.6-1.9L12 2.5Z" />
    </svg>
  );
}

function CloseIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
