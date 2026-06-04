import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BYPASS_COOKIE, getBypassValue } from "@/lib/auth-constants";
import { createAdminClient } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const privateReceiptBucket = "receipts";
const legacyReceiptBucket = "uploads";
const signedUrlExpiresIn = 10 * 60;

type ReceiptRow = {
  receipt_bucket: string | null;
  receipt_path: string | null;
  receipt_public_url_legacy: string | null;
  receipt_url: string | null;
};

function receiptTypeFromPath(pathOrUrl: string) {
  return /\.pdf(?:$|\?)/i.test(pathOrUrl) ? "pdf" : "image";
}

function fileNameFromPath(pathOrUrl: string) {
  try {
    const parsed = pathOrUrl.startsWith("http") ? new URL(pathOrUrl).pathname : pathOrUrl;
    return decodeURIComponent(parsed.split("/").pop() || "receipt");
  } catch {
    return "receipt";
  }
}

type AdminAuthResult = "authorized" | "unauthenticated" | "forbidden";

async function isAuthorizedAdmin(): Promise<AdminAuthResult> {
  const cookieStore = await cookies();
  const bypassValue = await getBypassValue();

  if (bypassValue && cookieStore.get(BYPASS_COOKIE)?.value === bypassValue) {
    return "authorized";
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "unauthenticated";

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const userEmail = user.email?.trim().toLowerCase();
    if (!adminEmail) {
      console.error("[Admin] Missing ADMIN_EMAIL for receipt auth check.");
      return "forbidden";
    }

    return userEmail === adminEmail ? "authorized" : "forbidden";
  } catch (error) {
    console.error("[Admin] Receipt auth check failed:", error);
    return "unauthenticated";
  }
}

function isSafeStoragePath(path: string) {
  return (
    path.length > 0 &&
    path.length <= 256 &&
    !path.includes("..") &&
    /^[a-zA-Z0-9/_.-]+$/.test(path) &&
    /\.(?:jpe?g|png|webp|pdf)$/i.test(path)
  );
}

function isPrivateReceiptPath(path: string) {
  return isSafeStoragePath(path) && path.startsWith("orders/");
}

function isLegacyReceiptPath(path: string) {
  return isSafeStoragePath(path) && path.startsWith("receipts/");
}

function legacyPublicUrl(sb: ReturnType<typeof createAdminClient>, path: string) {
  const { data } = sb.storage.from(legacyReceiptBucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await isAuthorizedAdmin();
  if (auth === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth === "forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
  }

  try {
    const sb = createAdminClient();
    const { data: order, error } = await sb
      .from("orders")
      .select("receipt_bucket, receipt_path, receipt_public_url_legacy, receipt_url")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[Admin] Receipt lookup failed:", error);
      return NextResponse.json({ error: "Unable to load receipt" }, { status: 500 });
    }

    const receipt = order as ReceiptRow | null;
    if (!receipt) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (receipt.receipt_path) {
      const bucket = receipt.receipt_bucket?.trim() || null;

      if (bucket === legacyReceiptBucket || (!bucket && isLegacyReceiptPath(receipt.receipt_path))) {
        const legacyUrl = legacyPublicUrl(sb, receipt.receipt_path);
        return NextResponse.json({
          fileName: fileNameFromPath(receipt.receipt_path),
          legacy: true,
          legacyUrl,
          receiptType: receiptTypeFromPath(receipt.receipt_path),
        });
      }

      if ((bucket && bucket !== privateReceiptBucket) || !isPrivateReceiptPath(receipt.receipt_path)) {
        console.error("[Admin] Unexpected receipt bucket:", bucket);
        return NextResponse.json({ error: "Invalid receipt storage" }, { status: 500 });
      }

      const { data, error: signedError } = await sb.storage
        .from(privateReceiptBucket)
        .createSignedUrl(receipt.receipt_path, signedUrlExpiresIn);

      if (signedError || !data?.signedUrl) {
        console.error("[Admin] Receipt signed URL failed:", signedError);
        return NextResponse.json({ error: "Unable to open receipt" }, { status: 500 });
      }

      return NextResponse.json({
        expiresIn: signedUrlExpiresIn,
        fileName: fileNameFromPath(receipt.receipt_path),
        legacy: false,
        receiptType: receiptTypeFromPath(receipt.receipt_path),
        signedUrl: data.signedUrl,
      });
    }

    const legacyUrl = receipt.receipt_public_url_legacy || receipt.receipt_url;
    if (legacyUrl) {
      return NextResponse.json({
        fileName: fileNameFromPath(legacyUrl),
        legacy: true,
        legacyUrl,
        receiptType: receiptTypeFromPath(legacyUrl),
      });
    }

    return NextResponse.json({ error: "No receipt uploaded" }, { status: 404 });
  } catch (error) {
    console.error("[Admin] Receipt route failed:", error);
    return NextResponse.json({ error: "Unable to open receipt" }, { status: 500 });
  }
}
