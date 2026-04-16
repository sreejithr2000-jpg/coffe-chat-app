"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  fallback?: string;
  label?: string;
}

export function BackButton({ fallback = "/dashboard", label = "Back" }: BackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-400 transition-colors hover:text-neutral-700"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M9 11.5L4.5 7L9 2.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
}
