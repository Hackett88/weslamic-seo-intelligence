import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Dev 模式下防止热重载重复创建连接池导致连接耗尽
const globalForDB = global as typeof globalThis & { pgClient?: postgres.Sql };

const client =
  globalForDB.pgClient ??
  postgres(process.env.DATABASE_URL!, {
    ssl: false,
    max: 3,
    idle_timeout: 20,
    connect_timeout: 30,
  });

if (process.env.NODE_ENV !== "production") globalForDB.pgClient = client;

export const db = drizzle(client, { schema });
