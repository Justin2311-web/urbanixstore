import { NextResponse } from "next/server";
import type { UrbanixOrder } from "@ecommerce/shared";
import { upsertOrder } from "@ecommerce/shared/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const order = (await request.json()) as UrbanixOrder;
  await upsertOrder(order);

  return NextResponse.json({ ok: true });
}
