import { Client } from "pg";
import { Context } from "hono";
import { env } from "../env";

const readClient = new Client({
  host: env.DB_HOST,
  user: env.DB_READ_USER,
  database: env.DB_NAME,
  password: env.DB_READ_PASS,
  port: env.DB_PORT,
});

// @ts-ignore - using bun
await readClient.connect();

export async function processQuery(c: Context) {
  const { sql, params, method } = await c.req.json();

  // prevent multiple queries
  const sqlBody = sql.replace(/;/g, "");

  try {
    if (method === "all") {
      const result = await readClient.query({
        text: sqlBody,
        values: params,
        rowMode: "array",
      });
      return c.json(result.rows);
    }

    if (method === "execute") {
      const result = await readClient.query({
        text: sqlBody,
        values: params,
      });
      return c.json(result.rows);
    }

    return c.json({ error: "Unknown method value" }, 500);
  } catch (e) {
    console.error(e);
    return c.json({ error: "error" }, 500);
  }
}
