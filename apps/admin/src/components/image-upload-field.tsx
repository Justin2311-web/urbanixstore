"use client";

import { useState } from "react";
import { createSignedUploadUrl } from "@/lib/actions";

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/**
 * A "use client" image upload field that:
 * 1. Validates file type and size before upload
 * 2. Obtains a signed upload URL from the server (server action — tiny request, no file)
 * 3. PUTs the file directly to Supabase Storage (bypasses Vercel's 4.5 MB body limit)
 * 4. Writes the resulting public URL into a hidden <input name={name}> for form submission
 */
export function ImageUploadField({
  bucket,
  storagePath,
  name,
  initialUrl,
}: {
  /** Supabase Storage bucket name, e.g. "banners" */
  bucket: string;
  /** Path prefix inside the bucket, e.g. "hero" or "banners/abc/desktop" */
  storagePath: string;
  /** Name of the hidden form input that carries the URL to the server action */
  name: string;
  /** Existing image URL to pre-fill */
  initialUrl?: string | null;
}) {
  const [url, setUrl] = useState<string>(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // --- client-side validation ---
    if (!file.type.startsWith("image/")) {
      setError(`"${file.name}" is not an image file.`);
      e.target.value = "";
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(
        `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum allowed is ${MAX_SIZE_MB} MB.`
      );
      e.target.value = "";
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(10);

    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const filePath = `${storagePath}/${Date.now()}.${ext}`;

      // Step 1: get signed upload URL (server action, no file data sent through Vercel)
      const { signedUrl, publicUrl } = await createSignedUploadUrl(bucket, filePath);
      setProgress(40);

      // Step 2: PUT file directly to Supabase Storage (completely bypasses Vercel)
      const res = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
      }

      setProgress(100);
      setUrl(publicUrl);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      {/* Hidden input — submitted with the form, carries the public URL */}
      <input type="hidden" name={name} value={url} />

      {/* Preview + remove */}
      {url && (
        <div className="mb-2 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Preview"
            className="h-24 w-36 rounded-lg object-cover border border-gray-200"
          />
          <button
            type="button"
            onClick={() => setUrl("")}
            className="mt-1 rounded bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
          >
            Remove
          </button>
        </div>
      )}

      {/* File picker */}
      <input
        type="file"
        accept="image/*"
        disabled={uploading}
        className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[#e8f3ef] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#0e5c56] hover:file:bg-[#d0e9e3] disabled:opacity-50"
        onChange={handleFileChange}
      />

      {/* Upload progress bar */}
      {uploading && (
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-[#0e5c56] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{progress}%</span>
        </div>
      )}

      {/* Error */}
      {error && <p className="mt-1 text-xs text-red-600">⚠ {error}</p>}

      {/* Hint */}
      {!error && !uploading && (
        <p className="mt-1 text-xs text-gray-400">
          Max {MAX_SIZE_MB} MB · JPG, PNG, WebP
        </p>
      )}
    </div>
  );
}
