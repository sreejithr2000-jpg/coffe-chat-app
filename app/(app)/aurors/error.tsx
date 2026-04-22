"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function AurorsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Aurors error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-2xl font-semibold text-neutral-800">Couldn&apos;t load Aurors</p>
      <p className="text-sm text-neutral-500">There was a problem fetching the mentor list. Please try again.</p>
      <Button onClick={reset} variant="primary" size="sm">
        Try again
      </Button>
    </div>
  );
}
