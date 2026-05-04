import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { and, eq, gt, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { n8nCallbackEvents } from "@/db/schema";
import { N8nCallbackEventSchema } from "@/contracts/n8n-callback";
import {
  triggerW01PhraseThese,
  triggerW02PhraseThis,
  triggerW03PhraseOrganic,
  buildBatchId,
  buildW02BatchId,
  buildW03BatchId,
  getStagingRowsByBatch,
  getW03StagingRowsByBatch,
  type W01Market,
  type StagingRow,
  type W03StagingRow,
} from "@/lib/n8n-trigger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

const ALLOWED_MARKETS: W01Market[] = [
  "sa", "id", "my", "ae", "uk", "fr", "de", "es", "us",
];

// 终态节点：进入这些节点之一即代表该 batch 流程结束（成功或失败）
const TERMINAL_NODES = new Set([
  "Callback Failed Validation",
  "Callback Failed Semrush",
  "Callback Nothing Found",
  "Callback Empty",
  "Callback Succeeded Write",
]);

const POLL_INTERVAL_MS = 1000;
const HARD_TIMEOUT_MS = 120_000;
const HEARTBEAT_MS = 20_000;

function isMockEnabled(req: NextRequest): boolean {
  if (req.nextUrl.searchParams.get("mock") === "1") return true;
  return process.env.USE_MOCK === "1";
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("unauthorized", { status: 401 });

  const demo = req.nextUrl.searchParams.get("demo");
  if (demo === "hello-world") return helloWorldStream(req);

  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (!endpoint) {
    return new Response("missing endpoint or demo param\n", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const ep = endpoint.toUpperCase();
  if (ep !== "W01" && ep !== "W02" && ep !== "W03") {
    return new Response(`endpoint ${endpoint} not implemented\n`, {
      status: 501,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (ep === "W02") {
    const keyword = (req.nextUrl.searchParams.get("keyword") ?? "")
      .trim()
      .toLowerCase();
    const marketsRaw = req.nextUrl.searchParams.get("markets") ?? "";
    const markets = marketsRaw
      .split(",")
      .map((s) => s.trim().toLowerCase() as W01Market)
      .filter((m) => ALLOWED_MARKETS.includes(m));

    if (!keyword) {
      return new Response("keyword required\n", { status: 400 });
    }
    if (markets.length === 0) {
      return new Response("at least one market required\n", { status: 400 });
    }

    if (isMockEnabled(req)) {
      return mockEndpointStream(req, "W02");
    }

    return realW02Stream(req, keyword, markets);
  }

  if (ep === "W03") {
    const keyword = (req.nextUrl.searchParams.get("keyword") ?? "")
      .trim()
      .toLowerCase();
    const marketRaw = (req.nextUrl.searchParams.get("market") ?? "")
      .trim()
      .toLowerCase() as W01Market;
    const displayLimitRaw = req.nextUrl.searchParams.get("display_limit") ?? "3";
    const displayLimit = Math.max(1, Math.min(10, Number(displayLimitRaw) || 3));
    const seedKeyword =
      (req.nextUrl.searchParams.get("seed_keyword") ?? "").trim().toLowerCase() ||
      undefined;

    if (!keyword) {
      return new Response("keyword required\n", { status: 400 });
    }
    if (!ALLOWED_MARKETS.includes(marketRaw)) {
      return new Response("valid market required\n", { status: 400 });
    }

    if (isMockEnabled(req)) {
      return mockEndpointStream(req, "W03");
    }

    return realW03Stream(req, keyword, marketRaw, displayLimit, seedKeyword);
  }

  const keywordsRaw = req.nextUrl.searchParams.get("keywords") ?? "";
  const marketsRaw = req.nextUrl.searchParams.get("markets") ?? "";
  const keywords = keywordsRaw
    .split("\n")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const markets = marketsRaw
    .split(",")
    .map((s) => s.trim().toLowerCase() as W01Market)
    .filter((m) => ALLOWED_MARKETS.includes(m));

  if (keywords.length === 0) {
    return new Response("keywords required\n", { status: 400 });
  }
  if (markets.length === 0) {
    return new Response("at least one market required\n", { status: 400 });
  }

  if (isMockEnabled(req)) {
    return mockEndpointStream(req, "W01");
  }

  return realW01Stream(req, keywords, markets);
}

function realW01Stream(
  req: NextRequest,
  keywords: string[],
  markets: W01Market[]
): Response {
  const encoder = new TextEncoder();

  // 笛卡尔积词×市场：每个市场一个独立 batch_id，并发 M 次 webhook
  const batches = markets.map((m) => ({ batchId: buildBatchId(m), market: m }));

  const stream = new ReadableStream({
    async start(controller) {
      let cancelled = false;
      const enqueue = (chunk: string) => {
        if (cancelled) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          /* closed */
        }
      };
      const close = () => {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      const heartbeat = setInterval(() => {
        if (cancelled) return;
        enqueue(`: heartbeat\n\n`);
      }, HEARTBEAT_MS);

      req.signal.addEventListener("abort", () => {
        cancelled = true;
        clearInterval(heartbeat);
        close();
      });

      // banner 事件：标记本次为真模式 + 暴露所有子 batch_id
      enqueue(
        `event: banner\ndata: ${JSON.stringify({
          mock: false,
          batches,
          keywords_count: keywords.length,
          markets_count: markets.length,
        })}\n\n`
      );

      // 触发 M 个 webhook（并发）
      const triggerResults = await Promise.allSettled(
        batches.map((b) =>
          triggerW01PhraseThese({
            batchId: b.batchId,
            keywords,
            market: b.market,
          })
        )
      );

      // 触发失败的 batch 直接标记完成（避免轮询永远等不到事件）
      const finishedBatches = new Set<string>();
      const triggerErrors: Record<string, string> = {};
      triggerResults.forEach((r, i) => {
        const batchId = batches[i].batchId;
        if (r.status === "rejected") {
          finishedBatches.add(batchId);
          triggerErrors[batchId] =
            r.reason instanceof Error ? r.reason.message : String(r.reason);
        } else if (!r.value.webhookOk) {
          finishedBatches.add(batchId);
          triggerErrors[batchId] = `webhook ${r.value.webhookStatus}`;
        }
      });

      // 把触发失败的合成事件推给前端
      for (const [batchId, errMsg] of Object.entries(triggerErrors)) {
        const market = batches.find((b) => b.batchId === batchId)?.market ?? "";
        const evt = {
          version: "2025-01" as const,
          event_id: `${batchId}-trigger-failed`,
          seq: 0,
          ts: new Date().toISOString(),
          batch_id: batchId,
          workflow_id: "W01",
          execution_id: "trigger",
          node_name: "Trigger Failed",
          node_status: "failed" as const,
          payload: { error: { code: "WEBHOOK_TRIGGER_FAILED", message: errMsg, market } },
        };
        enqueue(`id: ${evt.event_id}\ndata: ${JSON.stringify(evt)}\n\n`);
      }

      // 轮询每个 batch 的 callback 事件，按 seq 推进
      const lastSeqByBatch: Record<string, number> = {};
      for (const b of batches) lastSeqByBatch[b.batchId] = -1;

      const startedAt = Date.now();
      while (!cancelled && finishedBatches.size < batches.length) {
        if (Date.now() - startedAt > HARD_TIMEOUT_MS) {
          // 超时：把还没完成的 batch 标记成 timeout
          for (const b of batches) {
            if (finishedBatches.has(b.batchId)) continue;
            finishedBatches.add(b.batchId);
            const evt = {
              version: "2025-01" as const,
              event_id: `${b.batchId}-timeout`,
              seq: 90,
              ts: new Date().toISOString(),
              batch_id: b.batchId,
              workflow_id: "W01",
              execution_id: "timeout",
              node_name: "Stream Timeout",
              node_status: "failed" as const,
              payload: { error: { code: "STREAM_TIMEOUT", message: `> ${HARD_TIMEOUT_MS}ms` } },
            };
            enqueue(`id: ${evt.event_id}\ndata: ${JSON.stringify(evt)}\n\n`);
          }
          break;
        }

        for (const b of batches) {
          if (finishedBatches.has(b.batchId)) continue;
          let newEvents: typeof n8nCallbackEvents.$inferSelect[] = [];
          try {
            newEvents = await db
              .select()
              .from(n8nCallbackEvents)
              .where(
                and(
                  eq(n8nCallbackEvents.batchId, b.batchId),
                  gt(n8nCallbackEvents.seq, lastSeqByBatch[b.batchId])
                )
              )
              .orderBy(asc(n8nCallbackEvents.seq));
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            enqueue(
              `event: error\ndata: ${JSON.stringify({ error: `db poll failed: ${msg}` })}\n\n`
            );
            continue;
          }
          for (const ev of newEvents) {
            const evt = {
              version: "2025-01" as const,
              event_id: ev.eventId,
              seq: ev.seq,
              ts: ev.ts.toISOString(),
              batch_id: ev.batchId,
              workflow_id: ev.workflowId,
              execution_id: ev.executionId,
              node_name: ev.nodeName,
              node_status: ev.nodeStatus as
                | "started" | "running" | "progress" | "succeeded" | "failed" | "warning",
              payload: ev.payload as Record<string, unknown> | null | undefined,
            };
            // schema 校验失败也不阻断，原样推
            const parsed = N8nCallbackEventSchema.safeParse(evt);
            const data = parsed.success ? parsed.data : evt;
            enqueue(`id: ${ev.eventId}\ndata: ${JSON.stringify(data)}\n\n`);
            lastSeqByBatch[b.batchId] = ev.seq;
            if (TERMINAL_NODES.has(ev.nodeName)) {
              finishedBatches.add(b.batchId);
              break;
            }
          }
        }
        if (finishedBatches.size >= batches.length) break;
        await sleep(POLL_INTERVAL_MS);
      }

      // 拉 staging table 中各 batch 的数据行
      const allRows: StagingRow[] = [];
      for (const b of batches) {
        if (triggerErrors[b.batchId]) continue;
        try {
          const rows = await getStagingRowsByBatch(b.batchId);
          allRows.push(...rows);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          enqueue(
            `event: error\ndata: ${JSON.stringify({
              error: `staging fetch failed for ${b.batchId}: ${msg}`,
            })}\n\n`
          );
        }
      }

      // 推 rows 事件（前端用此事件渲染结果表）
      enqueue(`event: rows\ndata: ${JSON.stringify({ rows: allRows })}\n\n`);

      // 合成 _done 终态事件，触发前端关流
      const failed = Object.keys(triggerErrors).length > 0;
      const doneEvt = {
        version: "2025-01" as const,
        event_id: `_done-${randomUUID().slice(0, 8)}`,
        seq: 99,
        ts: new Date().toISOString(),
        batch_id: batches[0]?.batchId ?? "unknown",
        workflow_id: "W01",
        execution_id: "_done",
        node_name: "_done",
        node_status: failed && allRows.length === 0 ? "failed" as const : "succeeded" as const,
        payload: {
          rows_new: allRows.length,
          total_batches: batches.length,
          failed_batches: Object.keys(triggerErrors).length,
          units_actual: keywords.length * markets.length * 10,
        },
      };
      enqueue(`data: ${JSON.stringify(doneEvt)}\n\n`);

      clearInterval(heartbeat);
      close();
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

function realW02Stream(
  req: NextRequest,
  keyword: string,
  markets: W01Market[]
): Response {
  const encoder = new TextEncoder();
  const batches = markets.map((m) => ({ batchId: buildW02BatchId(m), market: m }));

  const stream = new ReadableStream({
    async start(controller) {
      let cancelled = false;
      const enqueue = (chunk: string) => {
        if (cancelled) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          /* closed */
        }
      };
      const close = () => {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      const heartbeat = setInterval(() => {
        if (cancelled) return;
        enqueue(`: heartbeat\n\n`);
      }, HEARTBEAT_MS);

      req.signal.addEventListener("abort", () => {
        cancelled = true;
        clearInterval(heartbeat);
        close();
      });

      enqueue(
        `event: banner\ndata: ${JSON.stringify({
          mock: false,
          batches,
          keyword,
          markets_count: markets.length,
        })}\n\n`
      );

      const triggerResults = await Promise.allSettled(
        batches.map((b) =>
          triggerW02PhraseThis({
            batchId: b.batchId,
            keyword,
            market: b.market,
          })
        )
      );

      const finishedBatches = new Set<string>();
      const triggerErrors: Record<string, string> = {};
      triggerResults.forEach((r, i) => {
        const batchId = batches[i].batchId;
        if (r.status === "rejected") {
          finishedBatches.add(batchId);
          triggerErrors[batchId] =
            r.reason instanceof Error ? r.reason.message : String(r.reason);
        } else if (!r.value.webhookOk) {
          finishedBatches.add(batchId);
          triggerErrors[batchId] = `webhook ${r.value.webhookStatus}`;
        }
      });

      for (const [batchId, errMsg] of Object.entries(triggerErrors)) {
        const market = batches.find((b) => b.batchId === batchId)?.market ?? "";
        const evt = {
          version: "2025-01" as const,
          event_id: `${batchId}-trigger-failed`,
          seq: 0,
          ts: new Date().toISOString(),
          batch_id: batchId,
          workflow_id: "W02",
          execution_id: "trigger",
          node_name: "Trigger Failed",
          node_status: "failed" as const,
          payload: { error: { code: "WEBHOOK_TRIGGER_FAILED", message: errMsg, market } },
        };
        enqueue(`id: ${evt.event_id}\ndata: ${JSON.stringify(evt)}\n\n`);
      }

      const lastSeqByBatch: Record<string, number> = {};
      for (const b of batches) lastSeqByBatch[b.batchId] = -1;

      const startedAt = Date.now();
      while (!cancelled && finishedBatches.size < batches.length) {
        if (Date.now() - startedAt > HARD_TIMEOUT_MS) {
          for (const b of batches) {
            if (finishedBatches.has(b.batchId)) continue;
            finishedBatches.add(b.batchId);
            const evt = {
              version: "2025-01" as const,
              event_id: `${b.batchId}-timeout`,
              seq: 90,
              ts: new Date().toISOString(),
              batch_id: b.batchId,
              workflow_id: "W02",
              execution_id: "timeout",
              node_name: "Stream Timeout",
              node_status: "failed" as const,
              payload: { error: { code: "STREAM_TIMEOUT", message: `> ${HARD_TIMEOUT_MS}ms` } },
            };
            enqueue(`id: ${evt.event_id}\ndata: ${JSON.stringify(evt)}\n\n`);
          }
          break;
        }

        for (const b of batches) {
          if (finishedBatches.has(b.batchId)) continue;
          let newEvents: typeof n8nCallbackEvents.$inferSelect[] = [];
          try {
            newEvents = await db
              .select()
              .from(n8nCallbackEvents)
              .where(
                and(
                  eq(n8nCallbackEvents.batchId, b.batchId),
                  gt(n8nCallbackEvents.seq, lastSeqByBatch[b.batchId])
                )
              )
              .orderBy(asc(n8nCallbackEvents.seq));
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            enqueue(
              `event: error\ndata: ${JSON.stringify({ error: `db poll failed: ${msg}` })}\n\n`
            );
            continue;
          }
          for (const ev of newEvents) {
            const evt = {
              version: "2025-01" as const,
              event_id: ev.eventId,
              seq: ev.seq,
              ts: ev.ts.toISOString(),
              batch_id: ev.batchId,
              workflow_id: ev.workflowId,
              execution_id: ev.executionId,
              node_name: ev.nodeName,
              node_status: ev.nodeStatus as
                | "started" | "running" | "progress" | "succeeded" | "failed" | "warning",
              payload: ev.payload as Record<string, unknown> | null | undefined,
            };
            const parsed = N8nCallbackEventSchema.safeParse(evt);
            const data = parsed.success ? parsed.data : evt;
            enqueue(`id: ${ev.eventId}\ndata: ${JSON.stringify(data)}\n\n`);
            lastSeqByBatch[b.batchId] = ev.seq;
            if (TERMINAL_NODES.has(ev.nodeName)) {
              finishedBatches.add(b.batchId);
              break;
            }
          }
        }
        if (finishedBatches.size >= batches.length) break;
        await sleep(POLL_INTERVAL_MS);
      }

      const allRows: StagingRow[] = [];
      for (const b of batches) {
        if (triggerErrors[b.batchId]) continue;
        try {
          const rows = await getStagingRowsByBatch(b.batchId);
          allRows.push(...rows);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          enqueue(
            `event: error\ndata: ${JSON.stringify({
              error: `staging fetch failed for ${b.batchId}: ${msg}`,
            })}\n\n`
          );
        }
      }

      enqueue(`event: rows\ndata: ${JSON.stringify({ rows: allRows })}\n\n`);

      const failed = Object.keys(triggerErrors).length > 0;
      const doneEvt = {
        version: "2025-01" as const,
        event_id: `_done-${randomUUID().slice(0, 8)}`,
        seq: 99,
        ts: new Date().toISOString(),
        batch_id: batches[0]?.batchId ?? "unknown",
        workflow_id: "W02",
        execution_id: "_done",
        node_name: "_done",
        node_status: failed && allRows.length === 0 ? "failed" as const : "succeeded" as const,
        payload: {
          rows_new: allRows.length,
          total_batches: batches.length,
          failed_batches: Object.keys(triggerErrors).length,
          units_actual: markets.length * 10,
        },
      };
      enqueue(`data: ${JSON.stringify(doneEvt)}\n\n`);

      clearInterval(heartbeat);
      close();
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

function realW03Stream(
  req: NextRequest,
  keyword: string,
  market: W01Market,
  displayLimit: number,
  seedKeyword: string | undefined
): Response {
  const encoder = new TextEncoder();
  const batchId = buildW03BatchId(market);
  const batches = [{ batchId, market }];

  const stream = new ReadableStream({
    async start(controller) {
      let cancelled = false;
      const enqueue = (chunk: string) => {
        if (cancelled) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          /* closed */
        }
      };
      const close = () => {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      const heartbeat = setInterval(() => {
        if (cancelled) return;
        enqueue(`: heartbeat\n\n`);
      }, HEARTBEAT_MS);

      req.signal.addEventListener("abort", () => {
        cancelled = true;
        clearInterval(heartbeat);
        close();
      });

      enqueue(
        `event: banner\ndata: ${JSON.stringify({
          mock: false,
          batches,
          keyword,
          market,
          display_limit: displayLimit,
        })}\n\n`
      );

      const triggerErrors: Record<string, string> = {};
      try {
        const r = await triggerW03PhraseOrganic({
          batchId,
          keyword,
          market,
          seedKeyword,
          displayLimit,
        });
        if (!r.webhookOk) {
          triggerErrors[batchId] = `webhook ${r.webhookStatus}`;
        }
      } catch (err) {
        triggerErrors[batchId] =
          err instanceof Error ? err.message : String(err);
      }

      const finishedBatches = new Set<string>();
      if (triggerErrors[batchId]) {
        finishedBatches.add(batchId);
        const evt = {
          version: "2025-01" as const,
          event_id: `${batchId}-trigger-failed`,
          seq: 0,
          ts: new Date().toISOString(),
          batch_id: batchId,
          workflow_id: "W03",
          execution_id: "trigger",
          node_name: "Trigger Failed",
          node_status: "failed" as const,
          payload: {
            error: {
              code: "WEBHOOK_TRIGGER_FAILED",
              message: triggerErrors[batchId],
              market,
            },
          },
        };
        enqueue(`id: ${evt.event_id}\ndata: ${JSON.stringify(evt)}\n\n`);
      }

      const lastSeqByBatch: Record<string, number> = { [batchId]: -1 };
      const startedAt = Date.now();
      while (!cancelled && finishedBatches.size < batches.length) {
        if (Date.now() - startedAt > HARD_TIMEOUT_MS) {
          for (const b of batches) {
            if (finishedBatches.has(b.batchId)) continue;
            finishedBatches.add(b.batchId);
            const evt = {
              version: "2025-01" as const,
              event_id: `${b.batchId}-timeout`,
              seq: 90,
              ts: new Date().toISOString(),
              batch_id: b.batchId,
              workflow_id: "W03",
              execution_id: "timeout",
              node_name: "Stream Timeout",
              node_status: "failed" as const,
              payload: { error: { code: "STREAM_TIMEOUT", message: `> ${HARD_TIMEOUT_MS}ms` } },
            };
            enqueue(`id: ${evt.event_id}\ndata: ${JSON.stringify(evt)}\n\n`);
          }
          break;
        }

        for (const b of batches) {
          if (finishedBatches.has(b.batchId)) continue;
          let newEvents: typeof n8nCallbackEvents.$inferSelect[] = [];
          try {
            newEvents = await db
              .select()
              .from(n8nCallbackEvents)
              .where(
                and(
                  eq(n8nCallbackEvents.batchId, b.batchId),
                  gt(n8nCallbackEvents.seq, lastSeqByBatch[b.batchId])
                )
              )
              .orderBy(asc(n8nCallbackEvents.seq));
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            enqueue(
              `event: error\ndata: ${JSON.stringify({ error: `db poll failed: ${msg}` })}\n\n`
            );
            continue;
          }
          for (const ev of newEvents) {
            const evt = {
              version: "2025-01" as const,
              event_id: ev.eventId,
              seq: ev.seq,
              ts: ev.ts.toISOString(),
              batch_id: ev.batchId,
              workflow_id: ev.workflowId,
              execution_id: ev.executionId,
              node_name: ev.nodeName,
              node_status: ev.nodeStatus as
                | "started" | "running" | "progress" | "succeeded" | "failed" | "warning",
              payload: ev.payload as Record<string, unknown> | null | undefined,
            };
            const parsed = N8nCallbackEventSchema.safeParse(evt);
            const data = parsed.success ? parsed.data : evt;
            enqueue(`id: ${ev.eventId}\ndata: ${JSON.stringify(data)}\n\n`);
            lastSeqByBatch[b.batchId] = ev.seq;
            if (TERMINAL_NODES.has(ev.nodeName)) {
              finishedBatches.add(b.batchId);
              break;
            }
          }
        }
        if (finishedBatches.size >= batches.length) break;
        await sleep(POLL_INTERVAL_MS);
      }

      const allRows: W03StagingRow[] = [];
      if (!triggerErrors[batchId]) {
        try {
          const rows = await getW03StagingRowsByBatch(batchId);
          allRows.push(...rows);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          enqueue(
            `event: error\ndata: ${JSON.stringify({
              error: `staging fetch failed for ${batchId}: ${msg}`,
            })}\n\n`
          );
        }
      }

      enqueue(`event: rows\ndata: ${JSON.stringify({ rows: allRows })}\n\n`);

      const failed = Object.keys(triggerErrors).length > 0;
      const doneEvt = {
        version: "2025-01" as const,
        event_id: `_done-${randomUUID().slice(0, 8)}`,
        seq: 99,
        ts: new Date().toISOString(),
        batch_id: batchId,
        workflow_id: "W03",
        execution_id: "_done",
        node_name: "_done",
        node_status: failed && allRows.length === 0 ? "failed" as const : "succeeded" as const,
        payload: {
          rows_new: allRows.length,
          total_batches: batches.length,
          failed_batches: Object.keys(triggerErrors).length,
          units_actual: displayLimit * 10,
        },
      };
      enqueue(`data: ${JSON.stringify(doneEvt)}\n\n`);

      clearInterval(heartbeat);
      close();
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function helloWorldStream(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let cancelled = false;
      const heartbeat = setInterval(() => {
        if (cancelled) return;
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          /* */
        }
      }, 20_000);

      req.signal.addEventListener("abort", () => {
        cancelled = true;
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          /* */
        }
      });

      try {
        for (let i = 0; i < 10; i++) {
          if (cancelled) return;
          const payload = JSON.stringify({ seq: i, ts: new Date().toISOString() });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          await new Promise((r) => setTimeout(r, 1000));
        }
      } finally {
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          /* */
        }
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

function mockEndpointStream(req: NextRequest, endpoint: string) {
  const encoder = new TextEncoder();
  const batchId = randomUUID();
  const executionId = `mock-exec-${Date.now()}`;
  const workflowId = `mock-${endpoint.toLowerCase()}`;
  const baseTs = Date.now();

  const rawEvents: Array<Record<string, unknown>> = [
    {
      version: "2025-01", event_id: `${executionId}-0-trigger`, seq: 0,
      ts: new Date(baseTs).toISOString(), batch_id: batchId, workflow_id: workflowId,
      execution_id: executionId, node_name: "trigger", node_status: "started",
    },
    {
      version: "2025-01", event_id: `${executionId}-1-fetch_phrase_these`, seq: 1,
      ts: new Date(baseTs + 1000).toISOString(), batch_id: batchId, workflow_id: workflowId,
      execution_id: executionId, node_name: "fetch_phrase_these", node_status: "running",
    },
    {
      version: "2025-01", event_id: `${executionId}-2-fetch_phrase_these-progress`, seq: 2,
      ts: new Date(baseTs + 2000).toISOString(), batch_id: batchId, workflow_id: workflowId,
      execution_id: executionId, node_name: "fetch_phrase_these", node_status: "progress",
      payload: { processed: 0.5 },
    },
    {
      version: "2025-01", event_id: `${executionId}-3-write_staging`, seq: 3,
      ts: new Date(baseTs + 3000).toISOString(), batch_id: batchId, workflow_id: workflowId,
      execution_id: executionId, node_name: "write_staging", node_status: "running",
    },
    {
      version: "2025-01", event_id: `${executionId}-4-write_staging-done`, seq: 4,
      ts: new Date(baseTs + 4000).toISOString(), batch_id: batchId, workflow_id: workflowId,
      execution_id: executionId, node_name: "write_staging", node_status: "succeeded",
      payload: { rows_new: 42, rows_cached: 8, units_actual: 50 },
    },
    {
      version: "2025-01", event_id: `${executionId}-5-done`, seq: 5,
      ts: new Date(baseTs + 5000).toISOString(), batch_id: batchId, workflow_id: workflowId,
      execution_id: executionId, node_name: "_done", node_status: "succeeded",
    },
  ];

  const stream = new ReadableStream({
    async start(controller) {
      let cancelled = false;
      const heartbeat = setInterval(() => {
        if (cancelled) return;
        try { controller.enqueue(encoder.encode(`: heartbeat\n\n`)); } catch { /* */ }
      }, 20_000);

      req.signal.addEventListener("abort", () => {
        cancelled = true;
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* */ }
      });

      try {
        controller.enqueue(
          encoder.encode(
            `event: banner\ndata: ${JSON.stringify({ mock: true, batch_id: batchId, endpoint })}\n\n`
          )
        );

        for (const raw of rawEvents) {
          if (cancelled) return;
          const validated = N8nCallbackEventSchema.parse(raw);
          // _done 之前先推一个 mock rows，让前端表格有内容
          if (validated.node_name === "_done") {
            const mockRows =
              endpoint.toUpperCase() === "W03"
                ? [
                    { keyword: "zikr ring", market: "us", position: 1, position_type: "Organic", domain: "weslamic.com",          url: "https://weslamic.com/products/zikr-ring",                  keyword_serp_features_codes: "1,2,14",  domain_serp_features_codes: "1,14"  },
                    { keyword: "zikr ring", market: "us", position: 2, position_type: "Organic", domain: "amazon.com",            url: "https://www.amazon.com/zikr-ring",                         keyword_serp_features_codes: "1,2,14",  domain_serp_features_codes: "1,2"   },
                    { keyword: "zikr ring", market: "us", position: 3, position_type: "Organic", domain: "muslimfootprints.com",  url: "https://muslimfootprints.com/blog/best-zikr-ring",         keyword_serp_features_codes: "1,2,14",  domain_serp_features_codes: ""      },
                  ]
                : [
                    { keyword: "hijab",          market: "sa", search_volume: 110000, keyword_difficulty: 42, cpc: 0.85, competition: 0.62, number_of_results: 12300000, trends: "0.6,0.7,0.8,0.9,1.0,1.0,1.0,0.9,0.9,1.0,1.0,1.0", intent: "Commercial" },
                    { keyword: "abaya",          market: "sa", search_volume: 74000,  keyword_difficulty: 38, cpc: 0.62, competition: 0.55, number_of_results: 8400000,  trends: "0.5,0.6,0.7,0.8,0.9,1.0,1.0,0.9,0.8,0.9,1.0,1.0", intent: "Commercial" },
                    { keyword: "ramadan dates",  market: "sa", search_volume: 18100,  keyword_difficulty: 29, cpc: 0.41, competition: 0.30, number_of_results: 2100000,  trends: "0.1,0.1,0.2,0.4,0.8,1.0,0.9,0.6,0.3,0.2,0.1,0.1", intent: "Informational" },
                    { keyword: "modest fashion", market: "sa", search_volume: 9900,   keyword_difficulty: 47, cpc: 1.12, competition: 0.81, number_of_results: 5600000,  trends: "0.7,0.8,0.9,0.9,1.0,1.0,1.0,1.0,0.9,0.9,1.0,1.0", intent: "Commercial" },
                    { keyword: "prayer mat",     market: "sa", search_volume: 6600,   keyword_difficulty: 35, cpc: 0.78, competition: 0.48, number_of_results: 3200000,  trends: "0.6,0.7,0.8,0.8,0.9,1.0,1.0,0.9,0.9,0.9,1.0,1.0", intent: "Commercial" },
                  ];
            controller.enqueue(
              encoder.encode(`event: rows\ndata: ${JSON.stringify({ rows: mockRows })}\n\n`)
            );
          }
          controller.enqueue(
            encoder.encode(`id: ${validated.event_id}\ndata: ${JSON.stringify(validated)}\n\n`)
          );
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        try {
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: errMsg })}\n\n`)
          );
        } catch { /* */ }
      } finally {
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* */ }
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
