import bcrypt from "bcryptjs";
import type { NextResponse } from "next/server";

export const SECONDARY_AUTH_EXPIRED = "SECONDARY_AUTH_EXPIRED";
export const SECONDARY_AUTH_COOKIE = "__Host-secondary-auth";

const globalForAuth = globalThis as unknown as {
  __secondaryAuthMap?: Map<string, number>;
};

function getMap(): Map<string, number> {
  if (process.env.NODE_ENV !== "production") {
    if (!globalForAuth.__secondaryAuthMap) {
      globalForAuth.__secondaryAuthMap = new Map();
    }
    return globalForAuth.__secondaryAuthMap;
  }
  return processMap;
}

const processMap = new Map<string, number>();

export async function verifySecondaryPassword(plain: string): Promise<boolean> {
  const hash = process.env.N8N_SECONDARY_PASSWORD_HASH;
  if (!hash) return false;
  if (!plain) return false;
  return bcrypt.compare(plain, hash);
}

export function issueSecondaryAuthCookie(
  res: NextResponse,
  sessionKey: string,
  ttlSec: number = 1800
): { expiresAt: number } {
  const expiresAt = Date.now() + ttlSec * 1000;
  getMap().set(sessionKey, expiresAt);
  res.cookies.set({
    name: SECONDARY_AUTH_COOKIE,
    value: sessionKey,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ttlSec,
    path: "/",
  });
  res.headers.set("Cache-Control", "no-store");
  return { expiresAt };
}

export function isSecondaryAuthValid(sessionKey: string | undefined): boolean {
  if (!sessionKey) return false;
  const exp = getMap().get(sessionKey);
  if (!exp) return false;
  if (Date.now() > exp) {
    getMap().delete(sessionKey);
    return false;
  }
  return true;
}

export function getSecondaryAuthExpiresAt(
  sessionKey: string | undefined
): number | null {
  if (!sessionKey) return null;
  const exp = getMap().get(sessionKey);
  if (!exp) return null;
  if (Date.now() > exp) {
    getMap().delete(sessionKey);
    return null;
  }
  return exp;
}

export function revokeSecondaryAuth(sessionKey: string): void {
  getMap().delete(sessionKey);
}
