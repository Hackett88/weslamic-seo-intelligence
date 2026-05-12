import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { queryHistory, type QueryHistoryRow } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENDPOINT_WHITELIST = [
  "W01", "W02", "W03", "W04", "W05", "W06", "W07", "W08", "W09", "W10",
] as const;
type EndpointCode = (typeof ENDPOINT_WHITELIST)[number];
const ENDPOINT_SET: ReadonlySet<string> = new Set(ENDPOINT_WHITELIST);

const SOURCE_WHITELIST = ["workspace", "drawer"] as const;
type HistorySource = (typeof SOURCE_WHITELIST)[number];
const SOURCE_SET: ReadonlySet<string> = new Set(SOURCE_WHITELIST);

const MAX_ENTRIES = 5;

// Wire shape the frontend `HistoryEntry` consumes.
// submittedAt is **ms timestamp (number)**, not ISO string.
type HistoryEntryWire = {
  id: string;
  endpoint: string;
  submittedAt: number;
  label: string;
  tooltip?: string;
  rows: unknown[];
  summary: Record<string, unknown>;
  dataSource?: string;
  params?: unknown;
  source: HistorySource;
};

function toWire(row: QueryHistoryRow): HistoryEntryWire {
  const wire: HistoryEntryWire = {
    id: row.id,
    endpoint: row.endpoint,
    submittedAt: row.submittedAt.getTime(),
    label: row.label,
    rows: Array.isArray(row.rows) ? (row.rows as unknown[]) : [],
    summary:
      row.summary && typeof row.summary === "object" && !Array.isArray(row.summary)
        ? (row.summary as Record<string, unknown>)
        : {},
    source: (SOURCE_SET.has(row.source) ? row.source : "workspace") as HistorySource,
  };
  if (row.tooltip != null) wire.tooltip = row.tooltip;
  if (row.dataSource != null) wire.dataSource = row.dataSource;
  if (row.params != null) wire.params = row.params;
  return wire;
}

function getUserId(session: { user?: { id?: string | null; name?: string | null } } | null): string | null {
  if (!session || !session.user) return null;
  // NextAuth v5 default JWT strategy may not surface `id` on session.user
  // without a custom session callback. Schema comment says userId is hardcoded "1" for admin,
  // matching the only credentials user (id: "1") in `src/lib/auth.ts`.
  const id = (session.user.id ?? "").toString().trim();
  if (id) return id;
  return "1";
}

async function listRecent(userId: string, endpoint: string): Promise<HistoryEntryWire[]> {
  const rows = await db
    .select()
    .from(queryHistory)
    .where(and(eq(queryHistory.userId, userId), eq(queryHistory.endpoint, endpoint)))
    .orderBy(desc(queryHistory.submittedAt))
    .limit(MAX_ENTRIES);
  return rows.map(toWire);
}

async function trimToMax(userId: string, endpoint: string): Promise<void> {
  // Keep only the most recent MAX_ENTRIES rows per (user_id, endpoint).
  await db.execute(sql`
    DELETE FROM query_history
    WHERE user_id = ${userId}
      AND endpoint = ${endpoint}
      AND id NOT IN (
        SELECT id FROM query_history
        WHERE user_id = ${userId} AND endpoint = ${endpoint}
        ORDER BY submitted_at DESC
        LIMIT ${MAX_ENTRIES}
      )
  `);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const endpointRaw = req.nextUrl.searchParams.get("endpoint");
  if (!endpointRaw || !ENDPOINT_SET.has(endpointRaw)) {
    return NextResponse.json({ error: "invalid endpoint" }, { status: 400 });
  }
  const endpoint = endpointRaw as EndpointCode;

  try {
    const list = await listRecent(userId, endpoint);
    return NextResponse.json(list);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: "db_error", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const endpoint = typeof b.endpoint === "string" ? b.endpoint : "";
  if (!endpoint || !ENDPOINT_SET.has(endpoint)) {
    return NextResponse.json({ error: "invalid endpoint" }, { status: 400 });
  }

  const sourceRaw = b.source ?? "workspace";
  if (typeof sourceRaw !== "string" || !SOURCE_SET.has(sourceRaw)) {
    return NextResponse.json({ error: "invalid source" }, { status: 400 });
  }
  const source = sourceRaw as HistorySource;

  if (typeof b.label !== "string" || b.label.length === 0) {
    return NextResponse.json({ error: "label required" }, { status: 400 });
  }
  if (!Array.isArray(b.rows)) {
    return NextResponse.json({ error: "rows must be array" }, { status: 400 });
  }
  if (!b.summary || typeof b.summary !== "object" || Array.isArray(b.summary)) {
    return NextResponse.json({ error: "summary must be object" }, { status: 400 });
  }
  if (b.tooltip !== undefined && b.tooltip !== null && typeof b.tooltip !== "string") {
    return NextResponse.json({ error: "tooltip must be string" }, { status: 400 });
  }
  if (b.dataSource !== undefined && b.dataSource !== null && typeof b.dataSource !== "string") {
    return NextResponse.json({ error: "dataSource must be string" }, { status: 400 });
  }

  try {
    await db.insert(queryHistory).values({
      userId,
      endpoint,
      source,
      label: b.label,
      tooltip: typeof b.tooltip === "string" ? b.tooltip : null,
      params: b.params ?? null,
      rows: b.rows as unknown[],
      summary: b.summary as Record<string, unknown>,
      dataSource: typeof b.dataSource === "string" ? b.dataSource : null,
    });

    await trimToMax(userId, endpoint);

    const list = await listRecent(userId, endpoint);
    return NextResponse.json(list);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: "db_error", message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const endpointRaw = sp.get("endpoint");
  if (!endpointRaw || !ENDPOINT_SET.has(endpointRaw)) {
    return NextResponse.json({ error: "invalid endpoint" }, { status: 400 });
  }
  const endpoint = endpointRaw as EndpointCode;
  const idParam = sp.get("id");

  try {
    if (idParam) {
      await db
        .delete(queryHistory)
        .where(
          and(
            eq(queryHistory.userId, userId),
            eq(queryHistory.endpoint, endpoint),
            eq(queryHistory.id, idParam),
          ),
        );
    } else {
      await db
        .delete(queryHistory)
        .where(and(eq(queryHistory.userId, userId), eq(queryHistory.endpoint, endpoint)));
    }
    const list = await listRecent(userId, endpoint);
    return NextResponse.json(list);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: "db_error", message }, { status: 500 });
  }
}
