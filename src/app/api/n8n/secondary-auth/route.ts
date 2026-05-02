import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import {
  verifySecondaryPassword,
  issueSecondaryAuthCookie,
} from "@/lib/n8n-secondary-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "请先登录" },
      { status: 401 }
    );
  }

  let body: { password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { code: "INVALID_JSON", message: "请求体不是合法 JSON" },
      { status: 400 }
    );
  }

  const password = (body.password ?? "").toString();
  if (!password) {
    return NextResponse.json(
      { code: "INVALID_PASSWORD", message: "密码不能为空" },
      { status: 401 }
    );
  }

  const ok = await verifySecondaryPassword(password);
  if (!ok) {
    return NextResponse.json(
      { code: "INVALID_PASSWORD", message: "密码错误" },
      { status: 401 }
    );
  }

  const sessionKey = randomUUID();
  const res = NextResponse.json({ ok: true });
  const { expiresAt } = issueSecondaryAuthCookie(res, sessionKey);
  res.headers.set("Content-Type", "application/json");
  return new NextResponse(
    JSON.stringify({ ok: true, expires_at: expiresAt }),
    { status: 200, headers: res.headers }
  );
}
