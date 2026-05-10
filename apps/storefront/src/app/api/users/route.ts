import { NextResponse } from "next/server";

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
    const payload = await request.json() as UserInfoPayload;
    const customerPhone = String(payload.customerPhone ?? "").replace(/\D/g, "");

    if (!payload.customerName || !customerPhone || !payload.customerAddress) {
      return NextResponse.json({ error: "Name, phone number, and address are required." }, { status: 400 });
    }

    const webhookUrl = process.env.GOOGLE_USER_INFO_WEBHOOK_URL ?? process.env.USER_INFO_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json({
        error: "Customer profile was saved on this device, but Google Sheet sync is not configured yet.",
        missingEnv: "GOOGLE_USER_INFO_WEBHOOK_URL",
      }, { status: 503 });
    }

    const now = new Date().toISOString();
    const response = await fetch(webhookUrl, {
      body: JSON.stringify({
        ...payload,
        createdAt: payload.createdAt || now,
        customerPhone,
        updatedAt: now,
        userId: payload.userId || crypto.randomUUID(),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json({
        error: "Google Sheet sync failed.",
        details: data,
      }, { status: 502 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
