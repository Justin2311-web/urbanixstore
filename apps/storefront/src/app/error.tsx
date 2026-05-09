"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="urbanix-container urbanix-section pb-24">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-primary">Storefront could not load</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          The CMS feed is temporarily unavailable. Refresh to try again, or the storefront will use its built-in fallback when possible.
        </p>
        <Button className="mt-5" onClick={reset} type="button">
          <RotateCcw />
          Try again
        </Button>
      </div>
    </main>
  );
}
