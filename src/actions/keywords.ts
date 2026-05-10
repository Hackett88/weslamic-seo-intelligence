"use server";

import { db } from "@/db/client";
import { keywords, type NewKeyword } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getKeywords() {
  return db.select().from(keywords).orderBy(keywords.createdAt);
}

export async function getKeywordById(id: number) {
  const result = await db.select().from(keywords).where(eq(keywords.id, id));
  return result[0] ?? null;
}

export async function createKeyword(data: NewKeyword) {
  const result = await db.insert(keywords).values(data).returning();
  revalidatePath("/app/keywords");
  return result[0];
}

export async function updateKeyword(id: number, data: Partial<NewKeyword>) {
  const result = await db
    .update(keywords)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(keywords.id, id))
    .returning();
  revalidatePath("/app/keywords");
  return result[0];
}

export async function deleteKeyword(id: number) {
  await db.delete(keywords).where(eq(keywords.id, id));
  revalidatePath("/app/keywords");
}

export async function getKeywordStats() {
  const rows = await db.select().from(keywords);
  const total = rows.length;

  const scored = rows.filter((r) => r.bp != null && r.cs != null).length;
  const unscored = total - scored;
  const protectedCount = rows.filter((r) => r.protected === true).length;

  const svValues = rows.map((r) => r.searchVolume).filter((v): v is number => v != null);
  const avgSv = svValues.length > 0
    ? Math.round(svValues.reduce((a, b) => a + b, 0) / svValues.length)
    : 0;

  const cpcValues = rows.map((r) => r.cpc).filter((v): v is number => v != null);
  const avgCpc = cpcValues.length > 0
    ? cpcValues.reduce((a, b) => a + b, 0) / cpcValues.length
    : 0;

  const lastSync = rows.reduce<Date | null>((acc, r) => {
    const t = r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
    if (!acc) return r.updatedAt ?? null;
    return t > acc.getTime() ? new Date(r.updatedAt!) : acc;
  }, null);

  return { total, scored, unscored, protected: protectedCount, avgSv, avgCpc, lastSync };
}
