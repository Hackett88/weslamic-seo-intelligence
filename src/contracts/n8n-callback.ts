import { z } from "zod";

export const N8nCallbackEventSchema = z.object({
  version: z.literal("2025-01"),
  event_id: z.string().min(8),
  seq: z.number().int().nonnegative(),
  ts: z.string().datetime(),
  batch_id: z.string().min(1),
  workflow_id: z.string().min(1),
  execution_id: z.string().min(1),
  node_name: z.string().min(1),
  node_status: z.enum(["started", "running", "progress", "succeeded", "failed", "warning"]),
  payload: z.unknown().optional(),
});

export type N8nCallbackEvent = z.infer<typeof N8nCallbackEventSchema>;
