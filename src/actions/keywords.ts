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
  const l1 = rows.filter(r => r.layer === "L1").length;
  const l2 = rows.filter(r => r.layer === "L2").length;
  const l3 = rows.filter(r => r.layer === "L3").length;
  const l4 = rows.filter(r => r.layer === "L4").length;
  const pending = rows.filter(r => r.layer === "pending").length;
  const excluded = rows.filter(r => r.status === "excluded").length;
  const lastSync = rows.reduce((a, b) => {
    const aTime = a?.updatedAt?.getTime() ?? 0;
    const bTime = b?.updatedAt?.getTime() ?? 0;
    return aTime > bTime ? a : b;
  }, rows[0])?.updatedAt ?? null;
  return { total, l1, l2, l3, l4, pending, excluded, lastSync };
}
