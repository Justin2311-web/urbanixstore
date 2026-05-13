import { NextResponse } from "next/server";
import { createStorefrontClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Returns a short-lived signed upload URL so the browser can PUT a file
 * directly to Supabase Storage without going through Vercel (4.5 MB limit).
 * The anon key is sufficient because the storage INSERT policy allows anon users.
 */
export async function POST(request: Request) {
  try {
    const { bucket, filePath } = (await request.json()) as {
      bucket: string;
      filePath: string;
    };

    if (!bucket || !filePath) {
      return NextResponse.json(
        { error: "bucket and filePath are required." },
        { status: 400 }
      );
    }

    const allowed = ["uploads"];
    if (!allowed.includes(bucket)) {
      return NextResponse.json(
        { error: `Bucket "${bucket}" is not permitted for storefront uploads.` },
        { status: 403 }
      );
    }

    const sb = createStorefrontClient();

    const { data, error } = await sb.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Could not create upload URL." },
        { status: 500 }
      );
    }

    const { data: urlData } = sb.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      publicUrl: urlData.publicUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
