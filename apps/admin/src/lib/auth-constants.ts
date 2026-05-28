// Shared auth constants; keep this Edge-compatible for proxy imports.
export const BYPASS_COOKIE = "admin_bypass_session";

function toBase64Url(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function getBypassValue() {
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    return null;
  }

  const payload = new TextEncoder().encode(`urbanix-admin-session-v1:${password}`);
  return toBase64Url(await crypto.subtle.digest("SHA-256", payload));
}
