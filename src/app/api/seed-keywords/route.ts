import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  SECONDARY_AUTH_COOKIE,
  SECONDARY_AUTH_EXPIRED,
  isSecondaryAuthValid,
} from "@/lib/n8n-secondary-auth";
import { SeedKeywordInputSchema } from "@/contracts/seed-keyword";
import {
  getSeedKeywords,
  createSeedKeyword,
} from "@/lib/n8n-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "请先登录" },
      { status: 401 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const search = sp.get("search") ?? undefined;
  const language = sp.get("language") ?? undefined;
  const layer = sp.get("layer") ?? undefined;
  const enabledParam = sp.get("enabled");
  const enabled =
    enabledParam === "true" ? true : enabledParam === "false" ? false : undefined;
  const limit = Math.min(parseInt(sp.get("limit") ?? "50", 10) || 50, 200);
  const cursor = sp.get("cursor") ?? undefined;

  try {
    const result = await getSeedKeywords({
      search,
      language,
      layer,
      enabled,
      limit,
      cursor,
    });
    const isMock =
      process.env.USE_MOCK === "1" ||
      !process.env.N8N_API_KEY ||
      process.env.N8N_API_KEY.trim() === "";
    return NextResponse.json({ ...result, is_mock: isMock });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { code: "N8N_ERROR", message },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "请先登录" },
      { status: 401 }
    );
  }

  // 二次门校验
  const cookie = req.cookies.get(SECONDARY_AUTH_COOKIE)?.value;
  if (!isSecondaryAuthValid(cookie)) {
    return NextResponse.json(
      { code: SECONDARY_AUTH_EXPIRED, message: "请先通过二次验证" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { code: "INVALID_JSON", message: "请求体不是合法 JSON" },
      { status: 400 }
    );
  }

  const parsed = SeedKeywordInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: parsed.error.message },
      { status: 422 }
    );
  }

  try {
    const row = await createSeedKeyword(parsed.data);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { code: "N8N_ERROR", message },
      { status }
    );
  }
}
