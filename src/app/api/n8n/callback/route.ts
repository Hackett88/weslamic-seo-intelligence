import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { n8nCallbackEvents, n8nCallbackProjections } from "@/db/schema";
import { N8nCallbackEventSchema } from "@/contracts/n8n-callback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tokensEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function ipAllowed(req: NextRequest): boolean {
  const raw = process.env.N8N_CALLBACK_IP_ALLOWLIST ?? "*";
  if (raw.trim() === "*") return true;
  const allow = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
  if (!ip) return false;
  return allow.includes(ip);
}

export async function POST(req: NextRequest) {
  const expectedToken = process.env.N8N_CALLBACK_TOKEN;
  if (!expectedToken) {
    return NextResponse.json({ error: "callback_token_unset" }, { status: 500 });
  }
  const incomingToken = req.headers.get("x-n8n-token") ?? "";
  if (!tokensEqual(incomingToken, expectedToken)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!ipAllowed(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = N8nCallbackEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "schema_validation_failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }
  const ev = parsed.data;

  const inserted = await db
    .insert(n8nCallbackEvents)
    .values({
      eventId:     ev.event_id,
      seq:         ev.seq,
      ts:          new Date(ev.ts),
      batchId:     ev.batch_id,
      workflowId:  ev.workflow_id,
      executionId: ev.execution_id,
      nodeName:    ev.node_name,
      nodeStatus:  ev.node_status,
      payload:     ev.payload as object | undefined,
    })
    .onConflictDoNothing({ target: n8nCallbackEvents.eventId })
    .returning({ eventId: n8nCallbackEvents.eventId });

  const duplicate = inserted.length === 0;

  let advancedTo: number | null = null;
  await db.transaction(async (tx) => {
    await tx
      .insert(n8nCallbackProjections)
      .values({ batchId: ev.batch_id, expectedSeq: 0 })
      .onConflictDoNothing({ target: n8nCallbackProjections.batchId });

    while (true) {
      const proj = await tx
        .select()
        .from(n8nCallbackProjections)
        .where(sql`${n8nCallbackProjections.batchId} = ${ev.batch_id}`)
        .for("update");
      const current = proj[0];
      if (!current) break;
      const nextSeq = current.expectedSeq + 1;
      const next = await tx
        .select()
        .from(n8nCallbackEvents)
        .where(
          sql`${n8nCallbackEvents.batchId} = ${ev.batch_id} AND ${n8nCallbackEvents.seq} = ${nextSeq}`
        )
        .limit(1);
      if (next.length === 0) {
        advancedTo = current.expectedSeq;
        break;
      }
      await tx
        .update(n8nCallbackProjections)
        .set({
          expectedSeq: nextSeq,
          lastEventTs: next[0].ts,
          status:      next[0].nodeStatus,
          updatedAt:   new Date(),
        })
        .where(sql`${n8nCallbackProjections.batchId} = ${ev.batch_id}`);
      advancedTo = nextSeq;
    }
  });

  return NextResponse.json({
    received: true,
    duplicate,
    advanced_to: advancedTo,
  });
}
