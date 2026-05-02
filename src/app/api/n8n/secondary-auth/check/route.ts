import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  SECONDARY_AUTH_COOKIE,
  SECONDARY_AUTH_EXPIRED,
  getSecondaryAuthExpiresAt,
} from "@/lib/n8n-secondary-auth";

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

  const cookie = req.cookies.get(SECONDARY_AUTH_COOKIE)?.value;
  const expiresAt = getSecondaryAuthExpiresAt(cookie);
  if (!expiresAt) {
    return NextResponse.json(
      { code: SECONDARY_AUTH_EXPIRED, authenticated: false },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { authenticated: true, expires_at: expiresAt },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
