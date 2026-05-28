import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const expected = process.env.REVALIDATE_SECRET;

  if (expected && secret !== expected) {
    return NextResponse.json({ ok: false, error: "Invalid revalidation secret." }, { status: 401 });
  }

  revalidatePath("/", "layout");
  revalidatePath("/", "page");
  revalidatePath("/products", "page");
  revalidatePath("/categories", "page");

  return NextResponse.json({ ok: true, revalidated: true });
}

export async function GET(request: Request) {
  return POST(request);
}
