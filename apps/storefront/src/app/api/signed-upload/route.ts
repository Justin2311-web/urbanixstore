import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const receiptBucket = "uploads";
const maxReceiptBytes = 5 * 1024 * 1024;
const allowedReceiptTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);

function fail(reason: string, status = 400) {
  console.warn("[Storefront] Rejected receipt upload request:", reason);
  return NextResponse.json(
    { error: "Receipt upload failed. Please try again." },
    { status }
  );
}

function createAdminStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase URL or service role key for receipt uploads.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function safeOrderSegment(orderNumber: string) {
  return orderNumber.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "-").slice(0, 64);
}

export async function POST(request: Request) {
  try {
    const { fileName, fileSize, fileType, orderNumber } = (await request.json()) as {
      fileName?: string;
      fileSize?: number;
      fileType?: string;
      orderNumber?: string;
    };

    if (!orderNumber?.trim()) return fail("Missing order number.");

    const extension = fileType ? allowedReceiptTypes.get(fileType) : undefined;
    if (!extension) return fail(`Unsupported file type: ${fileType ?? "unknown"}.`);

    if (!Number.isFinite(fileSize) || Number(fileSize) <= 0 || Number(fileSize) > maxReceiptBytes) {
      return fail(`Invalid receipt size: ${fileSize ?? "unknown"}.`);
    }

    const orderSegment = safeOrderSegment(orderNumber);
    if (!orderSegment) return fail("Invalid order number.");

    const filePath = `receipts/${orderSegment}/${crypto.randomUUID()}.${extension}`;
    const sb = createAdminStorageClient();
    const { data, error } = await sb.storage.from(receiptBucket).createSignedUploadUrl(filePath);

    if (error || !data) {
      console.error("[Storefront] Could not create signed receipt upload URL:", error);
      return fail("Could not create signed upload URL.", 500);
    }

    const { data: urlData } = sb.storage.from(receiptBucket).getPublicUrl(filePath);

    return NextResponse.json({
      bucket: receiptBucket,
      fileName: fileName?.slice(0, 160) ?? null,
      filePath,
      publicUrl: urlData.publicUrl,
      signedUrl: data.signedUrl,
    });
  } catch (error) {
    console.error("[Storefront] /api/signed-upload error:", error);
    return fail("Unexpected receipt upload error.", 500);
  }
}
