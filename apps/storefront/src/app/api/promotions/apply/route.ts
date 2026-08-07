import { NextResponse } from "next/server";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { evaluatePromotion, type PromotionItemInput } from "@/lib/promotion-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = await rateLimit({ key: `promotions:apply:${getClientIp(request)}`, limit: 20, windowSeconds: 60 });
  if (!limit.ok) return rateLimitResponse(limit, "Too many promo code attempts. Please wait a minute.");
  try {
    const body = await request.json() as { code?: string; items?: PromotionItemInput[]; customerPhone?: string };
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }
    const result = await evaluatePromotion({ code: body.code ?? "", items: body.items, customerPhone: body.customerPhone });
    return NextResponse.json({ ok: true, promotion: result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to apply promo code." }, { status: 400 });
  }
}
