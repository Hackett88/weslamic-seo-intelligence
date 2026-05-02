import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { N8nCallbackEventSchema } from "@/contracts/n8n-callback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

function isMockEnabled(req: NextRequest): boolean {
  if (req.nextUrl.searchParams.get("mock") === "1") return true;
  return process.env.USE_MOCK === "1";
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return new Response("unauthorized", { status: 401 });
  }

  const demo = req.nextUrl.searchParams.get("demo");
  if (demo === "hello-world") {
    return helloWorldStream(req);
  }

  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (endpoint) {
    if (!isMockEnabled(req)) {
      return new Response(
        "// TODO(D8): 切真 N8N，订阅 n8n_callback_projections 推送进度事件\n",
        { status: 501, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }
    return mockEndpointStream(req, endpoint);
  }

  return new Response(
    "missing endpoint or demo param\n",
    { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
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
          /* closed */
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
      version: "2025-01",
      event_id: `${executionId}-0-trigger`,
      seq: 0,
      ts: new Date(baseTs).toISOString(),
      batch_id: batchId,
      workflow_id: workflowId,
      execution_id: executionId,
      node_name: "trigger",
      node_status: "started",
    },
    {
      version: "2025-01",
      event_id: `${executionId}-1-fetch_phrase_these`,
      seq: 1,
      ts: new Date(baseTs + 1000).toISOString(),
      batch_id: batchId,
      workflow_id: workflowId,
      execution_id: executionId,
      node_name: "fetch_phrase_these",
      node_status: "running",
    },
    {
      version: "2025-01",
      event_id: `${executionId}-2-fetch_phrase_these-progress`,
      seq: 2,
      ts: new Date(baseTs + 2000).toISOString(),
      batch_id: batchId,
      workflow_id: workflowId,
      execution_id: executionId,
      node_name: "fetch_phrase_these",
      node_status: "progress",
      payload: { processed: 0.5 },
    },
    {
      version: "2025-01",
      event_id: `${executionId}-3-write_staging`,
      seq: 3,
      ts: new Date(baseTs + 3000).toISOString(),
      batch_id: batchId,
      workflow_id: workflowId,
      execution_id: executionId,
      node_name: "write_staging",
      node_status: "running",
    },
    {
      version: "2025-01",
      event_id: `${executionId}-4-write_staging-done`,
      seq: 4,
      ts: new Date(baseTs + 4000).toISOString(),
      batch_id: batchId,
      workflow_id: workflowId,
      execution_id: executionId,
      node_name: "write_staging",
      node_status: "succeeded",
      payload: { rows_new: 42, rows_cached: 8, units_actual: 50 },
    },
    {
      version: "2025-01",
      event_id: `${executionId}-5-done`,
      seq: 5,
      ts: new Date(baseTs + 5000).toISOString(),
      batch_id: batchId,
      workflow_id: workflowId,
      execution_id: executionId,
      node_name: "_done",
      node_status: "succeeded",
    },
  ];

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
        controller.enqueue(
          encoder.encode(
            `event: banner\ndata: ${JSON.stringify({ mock: true, batch_id: batchId, endpoint })}\n\n`
          )
        );

        for (const raw of rawEvents) {
          if (cancelled) return;
          const validated = N8nCallbackEventSchema.parse(raw);
          controller.enqueue(
            encoder.encode(
              `id: ${validated.event_id}\ndata: ${JSON.stringify(validated)}\n\n`
            )
          );
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        try {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: errMsg })}\n\n`
            )
          );
        } catch {
          /* */
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
