import { Client } from "pg";
import express from "express";

const app = express();

app.use(express.json());
const port = process.env.PROXY_PORT;

const client = new Client({
  host: "db",
  user: "postgres",
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
});

app.post("/query", async (req, res) => {
  const { sql, params, method } = req.body;

  // prevent multiple queries
  const sqlBody = sql.replace(/;/g, "");

  if (method === "all") {
    try {
      const result = await client.query({
        text: sqlBody,
        values: params,
        rowMode: "array",
      });
      res.send(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e });
    }
  } else if (method === "execute") {
    try {
      const result = await client.query({
        text: sqlBody,
        values: params,
      });

      res.send(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e });
    }
  } else {
    res.status(500).json({ error: "Unknown method value" });
  }
});

app.listen(port, () => {
  console.log(`Postgres proxy listening on port ${port}`);
});
