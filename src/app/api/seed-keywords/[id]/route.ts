import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  SECONDARY_AUTH_COOKIE,
  SECONDARY_AUTH_EXPIRED,
  isSecondaryAuthValid,
} from "@/lib/n8n-secondary-auth";
import { SeedKeywordPatchSchema } from "@/contracts/seed-keyword";
import {
  updateSeedKeyword,
  deleteSeedKeyword,
} from "@/lib/n8n-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function secondaryCheck(req: NextRequest): NextResponse | null {
  const cookie = req.cookies.get(SECONDARY_AUTH_COOKIE)?.value;
  if (!isSecondaryAuthValid(cookie)) {
    return NextResponse.json(
      { code: SECONDARY_AUTH_EXPIRED, message: "请先通过二次验证" },
      { status: 401 }
    );
  }
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "请先登录" },
      { status: 401 }
    );
  }

  const deny = secondaryCheck(req);
  if (deny) return deny;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { code: "INVALID_JSON", message: "请求体不是合法 JSON" },
      { status: 400 }
    );
  }

  const parsed = SeedKeywordPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: parsed.error.message },
      { status: 422 }
    );
  }

  try {
    const row = await updateSeedKeyword(id, parsed.data);
    return NextResponse.json(row);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { code: "N8N_ERROR", message },
      { status }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "请先登录" },
      { status: 401 }
    );
  }

  const deny = secondaryCheck(req);
  if (deny) return deny;

  const { id } = await params;

  try {
    const result = await deleteSeedKeyword(id);
    return NextResponse.json(result);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { code: "N8N_ERROR", message },
      { status }
    );
  }
}
