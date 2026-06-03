"use client";

import { useEffect, useState } from "react";

type ReceiptResponse = {
  fileName?: string;
  legacy?: boolean;
  legacyUrl?: string;
  receiptType?: "image" | "pdf";
  signedUrl?: string;
};

export function PaymentReceiptViewer({ hasReceipt, orderId }: { hasReceipt: boolean; orderId: string }) {
  const [receipt, setReceipt] = useState<ReceiptResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(hasReceipt);

  useEffect(() => {
    if (!hasReceipt) {
      return;
    }

    let cancelled = false;

    async function loadReceipt() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/orders/${orderId}/receipt`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = await response.json().catch(() => ({})) as ReceiptResponse & { error?: string };

        if (!response.ok) {
          throw new Error(data.error || "Unable to load receipt.");
        }

        if (!cancelled) setReceipt(data);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load receipt.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadReceipt();

    return () => {
      cancelled = true;
    };
  }, [hasReceipt, orderId]);

  if (!hasReceipt) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
        No receipt uploaded.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
        Loading receipt...
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || "Unable to load receipt."}
      </div>
    );
  }

  const receiptUrl = receipt.signedUrl || receipt.legacyUrl;
  if (!receiptUrl) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
        No receipt uploaded.
      </div>
    );
  }

  if (receipt.receiptType === "pdf") {
    return (
      <div className="flex items-center gap-3">
        <span className="text-2xl">PDF</span>
        <a
          href={receiptUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-[#0e5c56] hover:underline"
        >
          View PDF Receipt
        </a>
        {receipt.legacy ? <span className="text-xs text-gray-400">Legacy URL</span> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={receiptUrl}
        alt="Payment receipt"
        className="max-h-72 w-auto rounded-lg border border-gray-200 object-contain"
      />
      <a
        href={receiptUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-block text-xs font-semibold text-[#0e5c56] hover:underline"
      >
        Open full image
      </a>
      {receipt.legacy ? <span className="ml-2 text-xs text-gray-400">Legacy URL</span> : null}
    </div>
  );
}
