import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type UserInfoPayload = {
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  lastOrderProduct?: string;
  lastOrderDate?: string;
  notes?: string;
};

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = await rateLimit({
      key: `users:ip:${ip}`,
      limit: 10,
      windowSeconds: 300,
    });
    if (!limit.ok) {
      return rateLimitResponse(
        limit,
        "Too many profile sync attempts. Please wait a few minutes and try again."
      );
    }

    const payload = (await request.json()) as UserInfoPayload;
    const customerPhone = String(payload.customerPhone ?? "").replace(/\D/g, "");

    if (!payload.customerName || !customerPhone || !payload.customerAddress) {
      return NextResponse.json(
        { error: "Name, phone number, and address are required." },
        { status: 400 }
      );
    }

    const webhookUrl =
      process.env.GOOGLE_USER_INFO_WEBHOOK_URL ?? process.env.USER_INFO_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        {
          error:
            "Customer profile was saved on this device, but Google Sheet sync is not configured yet.",
          missingEnv: "GOOGLE_USER_INFO_WEBHOOK_URL",
        },
        { status: 503 }
      );
    }

    const now = new Date().toISOString();
    const body = JSON.stringify({
      ...payload,
      createdAt: payload.createdAt || now,
      customerPhone,
      updatedAt: now,
      userId: payload.userId || crypto.randomUUID(),
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const secret = process.env.GOOGLE_USER_INFO_WEBHOOK_SECRET?.trim();
    if (secret) {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const signature = createHmac("sha256", secret)
        .update(`${timestamp}.${body}`)
        .digest("hex");
      headers["X-Urbanix-Timestamp"] = timestamp;
      headers["X-Urbanix-Signature"] = `sha256=${signature}`;
    }

    const response = await fetch(webhookUrl, {
      body,
      headers,
      method: "POST",
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Google Sheet sync failed.",
          details: data,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
