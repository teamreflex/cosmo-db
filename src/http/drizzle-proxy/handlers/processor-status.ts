import { Client } from "pg";
import { Context } from "hono";
import { env } from "../env";

const writeClient = new Client({
  host: env.DB_HOST,
  user: env.DB_USER,
  database: env.DB_NAME,
  password: env.DB_PASS,
  port: env.DB_PORT,
});

// @ts-ignore - using bun
await writeClient.connect();

export async function processorStatus(c: Context) {
  const result = await writeClient.query<Status>(
    "select * from squid_processor.status"
  );

  if (result.rows.length > 0) {
    const row = result.rows[0];
    return c.json({ height: row.height });
  }

  return c.json({ height: 0 });
}

type Status = {
  id: number;
  height: number;
  hash: string;
  nonce: number;
};
